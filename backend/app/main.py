from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from app.db import engine
from app.audio.routes import router 
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from passlib.context import CryptContext
import os, jwt
from datetime import datetime, timedelta


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

#Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


#JWT setup
SECRET_KEY = os.getenv("SABLE_SECRET_KEY", "dev-secret-change-me") #Use env var in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

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

