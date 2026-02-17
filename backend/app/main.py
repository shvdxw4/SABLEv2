from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from app.audio.routes import router 
from pydantic import BaseModel
from passlib.context import CryptContext
import os, jwt
from datetime import datetime, timedelta


#Schemas
class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    username: str
    email: str

#Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

#Fake DB
users_db = []

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

app.include_router(router, prefix="/audio", tags=["audio"])

@app.get("/")
def root():
    return {"message": "SABLE backend online"}

@app.post("/signup", response_model=UserOut)
def signup(user: UserLogin):
    for u in users_db:
        if u["username"] == user.username or u["email"] == user.email:
            raise HTTPException(status_code=400, detail="User already exists")
    user_dict = user.dict()
    user_dict["password"] = hash_password(user.password)
    users_db.append(user_dict)
    return UserOut(**user_dict)

@app.post("/login")
def login(user: UserLogin):
    for u in users_db:
        if u["username"] == user.username:
            if verify_password(user.password, u["password"]):
                token_data = {"sub": u["username"], "email": u["email"]}
                access_token = create_access_token(token_data)
                print("ACCESS TOKEN (generated):", access_token)
                return {"message": "Login successful", "token": access_token}
            else:
                break
    raise HTTPException(status_code=400, detail="Invalid credentials")

@app.get("/whoami")
def whoami(authorization: str = Header(None)):
    print("RAW AUTH HEADER:", authorization)
    if not authorization or not authorization.startswith("Bearer "):
        print("Missing or invalid header")
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    print("TOKEN EXTRACTED:", token)
    payload = decode_access_token(token)
    if not payload:
        print("Invalid or expired token!")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"user": payload["sub"], "email": payload.get("email")}