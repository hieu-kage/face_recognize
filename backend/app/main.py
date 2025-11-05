from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import users, logs

app = FastAPI(title="FaceID Attendance API")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://face-recognize-two.vercel.app"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(logs.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Chào mừng bạn đến với Face ID Backend! (Đã refactor)"}