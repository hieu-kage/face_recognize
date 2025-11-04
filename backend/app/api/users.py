from fastapi import APIRouter, HTTPException
from app.core.config import supabase_client
from app.schemas.attendance import EnrollRequest, SearchRequest

router = APIRouter()


# API ĐĂNG KÝ (ENROLL)
@router.post("/enroll")
async def enroll_face(request: EnrollRequest):
    try:
        data, count = supabase_client.table('users').insert({
            'student_id': request.studentId,
            'name': request.name,
            'embedding': request.vector
        }).execute()
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# API ĐIỂM DANH (SEARCH)
@router.post("/search-face")
async def search_face(request: SearchRequest):
    try:
        matches = supabase_client.rpc('match_users', {
            'query_embedding': request.vector,
            'match_threshold': 0.4,
            'match_count': 1
        }).execute()

        if not matches.data:
            raise HTTPException(status_code=404, detail="User not found")

        found_user = matches.data[0]

        # Ghi log (Tạm thời vẫn để đây, bạn có thể tách ra sau)
        try:
            supabase_client.table('attendance_logs').insert({
                'user_id': found_user['id']
            }).execute()
        except Exception as log_error:
            print(f"Lỗi khi ghi log điểm danh: {log_error}")

        return {"success": True, "name": found_user['name'], "student_id": found_user['student_id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))