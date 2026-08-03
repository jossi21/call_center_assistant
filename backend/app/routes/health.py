from fastapi import APIRouter

# create our router
router = APIRouter()

# this is our server health checker endpoint helps us to know our server/ backend status
@router.get('/health')
def health_check():
    return {
        "status" : "ok",
        "message" : "Welcome to the Call Center AI Assistant API"
    }