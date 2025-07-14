from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserOut(BaseModel):
    username: str
    email: str

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

users_db = []

app = FastAPI()

@app.get("/")
def root():
    return {"message": "SABLE backend online"}

@app.post("/signup", response_model=UserOut)
def signup(user: UserCreate):
    for u in users_db:
        if u["username"] == user.username or u["email"] == user.email:
            raise HTTPException(status_code=400, detail="User already exists")
    user_dict = user.dict()
    user_dict["password"] = hash_password(user.password)
    users_db.append(user_dict)
    return UserOut(**user_dict)

@app.post("/login")
def login(user: UserCreate):
    for u in users_db:
        if u["username"] == user.username:
            if verify_password(user.password, u["password"]):
                return {"message": "Login successful", "token": "fake-jwt-for-now"}
            else:
                break
    raise HTTPException(status_code=400, detail="Invalid credentials")