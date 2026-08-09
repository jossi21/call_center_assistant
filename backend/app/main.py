from fastapi import FastAPI
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware

# Routes
from app.routes import health, chat, auth 
from app.admin import router as admin_router
from app.staffs import router as staff_router

# create the app 
app = FastAPI(
    title=settings.app_name
)

app.add_middleware(CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"])
    
# register the router
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(admin_router.router)
app.include_router(staff_router.router)

# home page endpoint
@app.get("/")
def root():
    return {
        "message": "Welcome to the Call Center AI Assistant API"
    }