from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import các "bộ não" (routers)
from app.api import users, logs

# Khởi tạo ứng dụng FastAPI
app = FastAPI(title="FaceID Attendance API")

# Cấu hình CORS (như cũ)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    # "https://your-vercel-link.vercel.app" # Sẽ thêm link deploy sau
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api")

# Tương tự, dùng router từ file logs.py
app.include_router(logs.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Chào mừng bạn đến với Face ID Backend! (Đã refactor)"}