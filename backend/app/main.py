from fastapi import FastAPI, HTTPException, Header
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

#Schemas
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

from app.s3 import presign_get

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