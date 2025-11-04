import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# Import các Pydantic model từ file models.py
from .models import EnrollRequest, SearchRequest

# Tải các biến môi trường (SUPABASE_URL, SUPABASE_ANON_KEY) từ file .env
load_dotenv()

# Khởi tạo kết nối Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Khởi tạo ứng dụng FastAPI
app = FastAPI()

# Cấu hình CORS (Cross-Origin Resource Sharing)
# Đây là bước bắt buộc để "cho phép" React ở domain khác (Vercel)
# được phép gọi API này.
origins = [
    "http://localhost:5173",  # Link React dev (Vite)
    "http://localhost:3000",  # Link React dev (CRA)
    # Sau này bạn sẽ thêm link Vercel của bạn vào đây
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Chào mừng bạn đến với Face ID Backend!"}



@app.post("/api/enroll")
async def enroll_face(request: EnrollRequest):

    try:
        data, count = supabase.table('users').insert({
            'student_id': request.studentId,
            'name': request.name,
            'embedding': request.vector
        }).execute()

        return {"success": True, "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search-face")
async def search_face(request: SearchRequest):
    try:
        matches = supabase.rpc('match_users', {
            'query_embedding': request.vector,
            'match_threshold': 0.4,  # Ngưỡng giống nhau (0.4 ~ 60% giống)
            'match_count': 1  # Chỉ lấy 1 kết quả
        }).execute()

        if not matches.data:
            raise HTTPException(status_code=404, detail="User not found")

        found_user = matches.data[0]
        return {"success": True, "name": found_user['name'], "student_id": found_user['student_id']}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))