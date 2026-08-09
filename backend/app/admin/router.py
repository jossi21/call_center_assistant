from fastapi import APIRouter

from app.admin.agents.router import router as agents_router
from app.admin.languages.router import router as language_router
from app.admin.tools.router import router as tool_router
from app.admin.staffs.router import router as staff_router

router = APIRouter(prefix="/admin")

router.include_router(agents_router)
router.include_router(language_router)
router.include_router(tool_router)
router.include_router(staff_router)