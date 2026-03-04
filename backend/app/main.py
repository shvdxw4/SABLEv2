from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.db import engine
from app.audio.routes import router 
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from app.s3 import presign_put, presign_get
from passlib.context import CryptContext
import os, jwt
from datetime import datetime, timedelta
from typing import Optional, List
from dotenv import load_dotenv
import stripe 

#Schemas

class AdminSubIn(BaseModel):
    identifier: str  # email or username

class SignupIn(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)

class LoginIn(BaseModel):
    identifier: str  # email OR username
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    role: str

class CreatorTrackCreateIn(BaseModel):
    title: Optional[str] = Field(default="Untitled", min_length=1, max_length=200)

    audio_ext: str = Field(min_length=1, max_length=10)
    audio_content_type: str = Field(min_length=3, max_length=100)

    artwork_ext: str = Field(min_length=1, max_length=10)
    artwork_content_type: str = Field(min_length=3, max_length=100)

class CreatorTrackCreateOut(BaseModel):
    track_id: int
    audio_s3_key: str
    audio_upload_url: str
    artwork_s3_key: str
    artwork_upload_url: str

class CreatorTrackPatchIn(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    tags: Optional[List[str]] = None

class CreatorTrackOut(BaseModel):
    id: int
    title: str
    state: str
    tier: str
    audio_s3_key: str | None = None
    artwork_s3_key: str | None = None
    tags: list[str]

class PublishIn(BaseModel):
    tier: str

class BillingCheckoutIn(BaseModel):
    plan: str

#Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


#JWT setup
SECRET_KEY = os.getenv("SABLE_SECRET_KEY", "dev-secret-change-me") #Use env var in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30# Track domain constants (must match DB CHECK constraints)

TRACK_STATE_DRAFT = "DRAFT"
TRACK_STATE_PUBLISHED = "PUBLISHED"
TRACK_STATE_REMOVED = "REMOVED"

TRACK_TIER_PUBLIC = "PUBLIC"
TRACK_TIER_SUBSCRIBER = "SUBSCRIBER"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    print("TOKEN RECEIVED FOR DECODE:", token)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("DECODED PAYLOAD:", payload)
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]

def get_current_user(authorization: str | None):
    token = get_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = int(payload["sub"])

    with engine.begin() as conn:
        user = conn.execute(
            text("SELECT id, email, username, role FROM users WHERE id = :id LIMIT 1;"),
            {"id": user_id},
        ).mappings().first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return dict(user)

def require_creator(user: dict):
    if user["role"] != "creator":
        raise HTTPException(status_code=403, detail="Creator role required")

def require_admin(user: dict):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

def _normalize_ext(ext: str) -> str:
    ext = ext.strip().lower().lstrip(".")
    return ext

def _validate_audio_ext(ext: str) -> None:
    allowed = {"mp3", "wav", "m4a", "aac", "ogg"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported audio_ext: {ext}")

def _validate_artwork_ext(ext: str) -> None:
    allowed = {"jpg", "jpeg", "png", "webp"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported artwork_ext: {ext}")

def get_current_user_optional(authorization: str | None):
    if not authorization:
        return None
    try:
        return get_current_user(authorization)
    except HTTPException:
        return None

def has_active_subscription(user_id: int) -> bool:
    with engine.begin() as conn:
        row = conn.execute(
            text("""
                SELECT status, expires_at
                FROM subscriptions
                WHERE user_id = :uid
                LIMIT 1;
            """),
            {"uid": user_id},
        ).mappings().first()

    if not row:
        return False

    status = (row["status"] or "").upper()
    if status != "ACTIVE":
        return False

    # If expires_at is set and in the past, treat as inactive
    exp = row["expires_at"]
    if exp is not None:
        # DB returns a datetime; compare at DB level would be nicer later, but this is fine for Tier-1
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        if exp <= now:
            return False

    return True

def admin_only(authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

load_dotenv()

def _stripe():
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY is not set")
    stripe.api_key = key
    return stripe

#FastAPI app
app = FastAPI(title="SABLE API", version="0.1.0")

FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173"
).split(",")

FRONTEND_ORIGINS = [o.strip() for o in FRONTEND_ORIGINS if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/health/db")
def health_db():
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return {"db": "ok"}
    except Exception as e:
        return {"db": "fail", "error": str(e)}

app.include_router(router, prefix="/audio", tags=["audio"])

@app.get("/")
def root():
    return {"message": "SABLE backend online"}

@app.post("/signup", response_model=UserOut)
def signup(payload: SignupIn):
    password_hash = hash_password(payload.password)

    try:
        with engine.begin() as conn:
            row = conn.execute(
                text("""
                    INSERT INTO users (email, username, password_hash, role)
                    VALUES (:email, :username, :password_hash, 'subscriber')
                    RETURNING id, email, username, role;
                """),
                {
                    "email": payload.email,
                    "username": payload.username,
                    "password_hash": password_hash,
                }
            ).mappings().one()

        return dict(row)

    except Exception as e:
        # Minimal, but honest. We'll refine error handling after baseline works.
        raise HTTPException(status_code=400, detail=f"Signup failed: {str(e)}")

@app.post("/login")
def login(payload: LoginIn):
    with engine.begin() as conn:
        user = conn.execute(
            text("""
                SELECT id, email, username, password_hash, role
                FROM users
                WHERE email = :identifier OR username = :identifier
                LIMIT 1;
            """),
            {"identifier": payload.identifier}
        ).mappings().first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": str(user["id"]),
        "role": user["role"],
    })

    return {"access_token": token, "token_type": "bearer"}

@app.get("/me", response_model=UserOut)
def me(authorization: str | None = Header(default=None)):
    token = get_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = int(payload["sub"])

    with engine.begin() as conn:
        user = conn.execute(
            text("""
                SELECT id, email, username, role
                FROM users
                WHERE id = :id
                LIMIT 1;
            """),
            {"id": user_id}
        ).mappings().first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return dict(user)

@app.post("/creator/tracks", response_model=CreatorTrackCreateOut)
def create_creator_track(payload: CreatorTrackCreateIn, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    require_creator(user)

    audio_ext = _normalize_ext(payload.audio_ext)
    artwork_ext = _normalize_ext(payload.artwork_ext)
    _validate_audio_ext(audio_ext)
    _validate_artwork_ext(artwork_ext)

    title = (payload.title or "Untitled").strip() or "Untitled"

    # Create the draft row first to get track_id (BIGSERIAL)
    with engine.begin() as conn:
        track = conn.execute(
            text("""
                INSERT INTO tracks (creator_id, title, tier, state)
                VALUES (:creator_id, :title, 'PUBLIC', 'DRAFT')
                RETURNING id;
            """),
            {"creator_id": user["id"], "title": title},
        ).mappings().one()

        track_id = int(track["id"])

        audio_key = f"creators/{user['id']}/tracks/{track_id}/audio.{audio_ext}"
        artwork_key = f"creators/{user['id']}/tracks/{track_id}/artwork.{artwork_ext}"

        # Persist keys immediately (durability spine)
        conn.execute(
            text("""
                UPDATE tracks
                SET audio_s3_key = :audio_key,
                    artwork_s3_key = :artwork_key
                WHERE id = :track_id AND creator_id = :creator_id;
            """),
            {
                "audio_key": audio_key,
                "artwork_key": artwork_key,
                "track_id": track_id,
                "creator_id": user["id"],
            }
        )

        track = conn.execute(
            text("""
                INSERT INTO tracks (creator_id, title, tier, state)
                VALUES (:creator_id, :title, :tier, :state)
                RETURNING id;
            """),
            {
                "creator_id": user["id"],
                "title": title,
                "tier": TRACK_TIER_PUBLIC,
                "state": TRACK_STATE_DRAFT,
            },
        ).mappings().one()

    audio_upload_url = presign_put(key=audio_key, content_type=payload.audio_content_type)
    artwork_upload_url = presign_put(key=artwork_key, content_type=payload.artwork_content_type)

    return {
        "track_id": track_id,
        "audio_s3_key": audio_key,
        "audio_upload_url": audio_upload_url,
        "artwork_s3_key": artwork_key,
        "artwork_upload_url": artwork_upload_url,
    }

@app.patch("/creator/tracks/{track_id}", response_model=CreatorTrackOut)
def patch_creator_track(track_id: int, payload: CreatorTrackPatchIn, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    require_creator(user)

    # Load track and enforce ownership + draft-only
    with engine.begin() as conn:
        track = conn.execute(
            text("""
                SELECT id, creator_id, title, state, tier, audio_s3_key, artwork_s3_key
                FROM tracks
                WHERE id = :id
                LIMIT 1;
            """),
            {"id": track_id},
        ).mappings().first()

        if not track:
            raise HTTPException(status_code=404, detail="Track not found")

        if int(track["creator_id"]) != int(user["id"]):
            raise HTTPException(status_code=403, detail="Not your track")

        if track["state"] != TRACK_STATE_DRAFT:
            raise HTTPException(status_code=400, detail="Only DRAFT tracks can be edited")

        # Update title if provided
        new_title = track["title"]
        if payload.title is not None:
            new_title = payload.title.strip() or track["title"]
            conn.execute(
                text("UPDATE tracks SET title = :title WHERE id = :id AND creator_id = :creator_id;"),
                {"title": new_title, "id": track_id, "creator_id": user["id"]},
            )

        # Replace tags if provided
        tags_out: list[str] = []
        if payload.tags is not None:
            clean = []
            for t in payload.tags:
                if not t:
                    continue
                t2 = t.strip().lower()
                if not t2:
                    continue
                if len(t2) > 30:
                    raise HTTPException(status_code=400, detail="Tag too long (max 30)")
                clean.append(t2)

            # de-dupe while preserving order
            seen = set()
            deduped = []
            for t in clean:
                if t not in seen:
                    seen.add(t)
                    deduped.append(t)

            conn.execute(
                text("DELETE FROM track_tags WHERE track_id = :track_id;"),
                {"track_id": track_id},
            )
            for t in deduped:
                conn.execute(
                    text("INSERT INTO track_tags (track_id, tag) VALUES (:track_id, :tag);"),
                    {"track_id": track_id, "tag": t},
                )
            tags_out = deduped
        else:
            # return existing tags
            tags_out = [
                r[0] for r in conn.execute(
                    text("SELECT tag FROM track_tags WHERE track_id = :track_id ORDER BY tag;"),
                    {"track_id": track_id},
                ).all()
            ]

        # Reload track fields to return
        refreshed = conn.execute(
            text("""
                SELECT id, title, state, tier, audio_s3_key, artwork_s3_key
                FROM tracks
                WHERE id = :id;
            """),
            {"id": track_id},
        ).mappings().one()

    return {
        "id": int(refreshed["id"]),
        "title": refreshed["title"],
        "state": refreshed["state"],
        "tier": refreshed["tier"],
        "audio_s3_key": refreshed["audio_s3_key"],
        "artwork_s3_key": refreshed["artwork_s3_key"],
        "tags": tags_out,
    }

@app.post("/creator/tracks/{track_id}/publish")
def publish_track(track_id: int, payload: PublishIn, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    require_creator(user)

    tier = payload.tier.strip().upper()
    if tier not in {TRACK_TIER_PUBLIC, TRACK_TIER_SUBSCRIBER}:
        raise HTTPException(status_code=400, detail="Invalid tier")

    with engine.begin() as conn:
        track = conn.execute(
            text("SELECT id, creator_id, state, audio_s3_key FROM tracks WHERE id=:id LIMIT 1;"),
            {"id": track_id},
        ).mappings().first()

        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        if int(track["creator_id"]) != int(user["id"]):
            raise HTTPException(status_code=403, detail="Not your track")
        if track["state"] != TRACK_STATE_DRAFT:
            raise HTTPException(status_code=400, detail="Only DRAFT tracks can be published")
        if not track["audio_s3_key"]:
            raise HTTPException(status_code=400, detail="Audio not uploaded")

        conn.execute(
            text("""
                UPDATE tracks
                SET state = :state,
                    tier = :tier,
                    published_at = NOW()
                WHERE id = :id AND creator_id = :creator_id;
            """),
            {"state": TRACK_STATE_PUBLISHED, "tier": tier, "id": track_id, "creator_id": user["id"]},
        )

    return {"ok": True, "track_id": track_id, "state": TRACK_STATE_PUBLISHED, "tier": tier}

@app.delete("/creator/tracks/{track_id}")
def remove_track(track_id: int, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    require_creator(user)

    with engine.begin() as conn:
        track = conn.execute(
            text("SELECT id, creator_id, state FROM tracks WHERE id=:id LIMIT 1;"),
            {"id": track_id},
        ).mappings().first()

        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        if int(track["creator_id"]) != int(user["id"]):
            raise HTTPException(status_code=403, detail="Not your track")

        if track["state"] != TRACK_STATE_REMOVED:
            conn.execute(
                text("UPDATE tracks SET state=:state WHERE id=:id AND creator_id=:creator_id;"),
                {"state": TRACK_STATE_REMOVED, "id": track_id, "creator_id": user["id"]},
            )

    return {"ok": True, "track_id": track_id, "state": TRACK_STATE_REMOVED}

@app.get("/tracks")
def list_tracks(authorization: str | None = Header(default=None)):
    user = get_current_user_optional(authorization)
    include_subscriber = False

    if user:
        include_subscriber = has_active_subscription(int(user["id"]))

    tiers = [TRACK_TIER_PUBLIC]
    if include_subscriber:
        tiers.append(TRACK_TIER_SUBSCRIBER)

    with engine.begin() as conn:
        rows = conn.execute(
            text("""
                SELECT t.id, t.title, t.tier, t.state, t.creator_id, t.published_at
                FROM tracks t
                WHERE t.state = :published
                  AND t.tier = ANY(:tiers)
                ORDER BY t.published_at DESC NULLS LAST, t.id DESC
                LIMIT 50;
            """),
            {"published": TRACK_STATE_PUBLISHED, "tiers": tiers},
        ).mappings().all()

    # Minimal response for Tier-1 browse
    return {"items": [dict(r) for r in rows], "include_subscriber": include_subscriber}

@app.get("/tracks/{track_id}")
def get_track(track_id: int, authorization: str | None = Header(default=None)):
    user = get_current_user_optional(authorization)
    include_subscriber = False
    if user:
        include_subscriber = has_active_subscription(int(user["id"]))

    tiers = [TRACK_TIER_PUBLIC]
    if include_subscriber:
        tiers.append(TRACK_TIER_SUBSCRIBER)

    with engine.begin() as conn:
        row = conn.execute(
            text("""
                SELECT t.id, t.title, t.tier, t.state, t.creator_id, t.published_at,
                       t.artwork_s3_key
                FROM tracks t
                WHERE t.id = :id
                  AND t.state = :published
                  AND t.tier = ANY(:tiers)
                LIMIT 1;
            """),
            {"id": track_id, "published": TRACK_STATE_PUBLISHED, "tiers": tiers},
        ).mappings().first()

        if not row:
            raise HTTPException(status_code=404, detail="Track not found")

        tags = [r[0] for r in conn.execute(
            text("SELECT tag FROM track_tags WHERE track_id=:id ORDER BY tag;"),
            {"id": track_id},
        ).all()]

    return {**dict(row), "tags": tags}

@app.get("/tracks/{track_id}/stream")
def stream_track(track_id: int, authorization: str | None = Header(default=None)):
    user = get_current_user_optional(authorization)
    include_subscriber = False
    if user:
        include_subscriber = has_active_subscription(int(user["id"]))

    tiers = [TRACK_TIER_PUBLIC]
    if include_subscriber:
        tiers.append(TRACK_TIER_SUBSCRIBER)

    with engine.begin() as conn:
        row = conn.execute(
            text("""
                SELECT audio_s3_key
                FROM tracks
                WHERE id = :id
                  AND state = :published
                  AND tier = ANY(:tiers)
                LIMIT 1;
            """),
            {"id": track_id, "published": TRACK_STATE_PUBLISHED, "tiers": tiers},
        ).mappings().first()

        if not row or not row["audio_s3_key"]:
            raise HTTPException(status_code=404, detail="Track not found")

    url = presign_get(row["audio_s3_key"], expires_sec=300)
    return {"url": url}

@app.post("/billing/checkout")
def billing_checkout(payload: BillingCheckoutIn, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)

    plan = payload.plan.strip().lower()
    if plan not in {"monthly", "yearly"}:
        raise HTTPException(status_code=400, detail="Invalid plan")

    price_id = os.getenv("STRIPE_PRICE_MONTHLY_ID") if plan == "monthly" else os.getenv("STRIPE_PRICE_YEARLY_ID")
    if not price_id:
        raise RuntimeError("Stripe price id env var missing")

    success_url = os.getenv("STRIPE_SUCCESS_URL")
    cancel_url = os.getenv("STRIPE_CANCEL_URL")
    if not success_url or not cancel_url:
        raise RuntimeError("STRIPE_SUCCESS_URL / STRIPE_CANCEL_URL not set")

    s = _stripe()
    session = s.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        # Tie session to our user; no webhooks yet, so we’ll verify session on success
        client_reference_id=str(user["id"]),
        metadata={"user_id": str(user["id"]), "plan": plan},
    )

    # Optional: store stripe_session_id so success route can double-check ownership
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO subscriptions (user_id, status, stripe_session_id, started_at, expires_at)
                VALUES (:uid, 'CANCELED', :sid, NOW(), NULL)
                ON CONFLICT (user_id)
                DO UPDATE SET stripe_session_id=:sid;
            """),
            {"uid": int(user["id"]), "sid": session.id},
        )

    return {"url": session.url, "session_id": session.id}

@app.get("/billing/success")
def billing_success(session_id: str, authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    s = _stripe()

    session = s.checkout.Session.retrieve(session_id, expand=["subscription"])
    # Basic verification checks (Tier-1)
    if session.get("client_reference_id") != str(user["id"]):
        raise HTTPException(status_code=403, detail="Session does not belong to this user")

    if session.get("payment_status") not in {"paid", "no_payment_required"}:
        raise HTTPException(status_code=400, detail="Payment not completed")

    # subscription object exists in subscription mode
    stripe_sub = session.get("subscription")
    if not stripe_sub:
        raise HTTPException(status_code=400, detail="No subscription found on session")

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO subscriptions (user_id, status, stripe_customer_id, stripe_session_id, started_at, expires_at)
                VALUES (:uid, 'ACTIVE', :cust, :sid, NOW(), NULL)
                ON CONFLICT (user_id)
                DO UPDATE SET status='ACTIVE', stripe_customer_id=:cust, stripe_session_id=:sid, started_at=NOW(), expires_at=NULL;
            """),
            {"uid": int(user["id"]), "cust": session.get("customer"), "sid": session.id},
        )

    return {"ok": True, "subscription": "ACTIVE"}

@app.get("/billing/cancel")
def billing_cancel():
    return {"ok": True, "status": "canceled"}

@app.post("/offline/manifest")
def offline_manifest(authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)

    # Determine subscription status
    with engine.begin() as conn:
        sub = conn.execute(
            text("""
                SELECT status, expires_at
                FROM subscriptions
                WHERE user_id = :uid
            """),
            {"uid": int(user["id"])}
        ).mappings().first()

    is_active = False
    if sub:
        if sub["status"] == "ACTIVE":
            if sub["expires_at"] is None:
                is_active = True
            else:
                from datetime import datetime
                is_active = sub["expires_at"] > datetime.utcnow()

    # Fetch allowed tracks
    if is_active:
        tier_filter = ("PUBLIC", "SUBSCRIBER")
    else:
        tier_filter = ("PUBLIC",)

    with engine.begin() as conn:
        rows = conn.execute(
            text("""
                SELECT id, title, tier, audio_s3_key
                FROM tracks
                WHERE state = 'PUBLISHED'
                AND tier = ANY(:tiers)
            """),
            {"tiers": list(tier_filter)}
        ).mappings().all()

    # Build manifest
    manifest = []
    for row in rows:
        stream_url = presign_get(row["audio_s3_key"])  # your existing presign helper
        manifest.append({
            "track_id": row["id"],
            "title": row["title"],
            "tier": row["tier"],
            "stream_url": stream_url
        })

    return {"tracks": manifest}

@app.post("/admin/subscriptions/activate")
def admin_activate_sub(payload: AdminSubIn, admin=Depends(admin_only)):
    with engine.begin() as conn:
        u = conn.execute(
            text("SELECT id FROM users WHERE email=:x OR username=:x"),
            {"x": payload.identifier}
        ).mappings().first()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")

        conn.execute(
            text("""
                INSERT INTO subscriptions (user_id, status, started_at, expires_at)
                VALUES (:uid, 'ACTIVE', NOW(), NULL)
                ON CONFLICT (user_id) DO UPDATE
                SET status='ACTIVE', started_at=NOW(), expires_at=NULL;
            """),
            {"uid": u["id"]}
        )
    return {"ok": True, "user_id": u["id"], "status": "ACTIVE"}

@app.post("/admin/subscriptions/cancel")
def admin_cancel_sub(payload: AdminSubIn, admin=Depends(admin_only)):
    with engine.begin() as conn:
        u = conn.execute(
            text("SELECT id FROM users WHERE email=:x OR username=:x"),
            {"x": payload.identifier}
        ).mappings().first()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")

        conn.execute(
            text("""
                INSERT INTO subscriptions (user_id, status, started_at, expires_at)
                VALUES (:uid, 'CANCELED', NOW(), NULL)
                ON CONFLICT (user_id) DO UPDATE
                SET status='CANCELED';
            """),
            {"uid": u["id"]}
        )
    return {"ok": True, "user_id": u["id"], "status": "CANCELED"}

@app.post("/admin/tracks/{track_id}/hide")
def admin_hide_track(track_id: int, admin=Depends(admin_only)):
    with engine.begin() as conn:
        r = conn.execute(
            text("UPDATE tracks SET state='REMOVED' WHERE id=:tid RETURNING id"),
            {"tid": track_id}
        ).fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Track not found")
    return {"ok": True, "track_id": track_id, "state": "REMOVED"}

@app.post("/admin/seed")
def admin_seed(admin=Depends(admin_only)):
    with engine.begin() as conn:
        # upsert creator
        creator = conn.execute(text("""
            INSERT INTO users (email, username, password_hash, role)
            VALUES ('demo_creator@sable.dev', 'DemoCreator', 'seeded', 'creator')
            ON CONFLICT (email) DO UPDATE SET role='creator'
            RETURNING id;
        """)).fetchone()
        creator_id = creator[0]

        # create two published tracks
        pub = conn.execute(text("""
            INSERT INTO tracks (creator_id, title, tier, state, audio_s3_key, artwork_s3_key, created_at, published_at)
            VALUES (:cid, 'Seed Public', 'PUBLIC', 'PUBLISHED', 'seed/audio-public.mp3', 'seed/art-public.png', NOW(), NOW())
            RETURNING id;
        """), {"cid": creator_id}).fetchone()[0]

        sub = conn.execute(text("""
            INSERT INTO tracks (creator_id, title, tier, state, audio_s3_key, artwork_s3_key, created_at, published_at)
            VALUES (:cid, 'Seed Subscriber', 'SUBSCRIBER', 'PUBLISHED', 'seed/audio-sub.mp3', 'seed/art-sub.png', NOW(), NOW())
            RETURNING id;
        """), {"cid": creator_id}).fetchone()[0]

    return {"ok": True, "creator_id": creator_id, "public_track_id": pub, "subscriber_track_id": sub}

