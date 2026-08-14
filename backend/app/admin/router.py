from fastapi import APIRouter

from app.admin.agents.router import router as agents_router
from app.admin.languages.router import router as language_router
from app.admin.tools.router import router as tool_router
from app.admin.staffs.router import router as staff_router
from app.admin.handoffs.router import router as handoffs_router
from app.admin.users.router import router as users_router
from app.admin.analytics.router import router as analytics_router
from app.admin.channels.router import router as channels_router


router = APIRouter(prefix="/admin")

router.include_router(agents_router)
router.include_router(language_router)
router.include_router(tool_router)
router.include_router(staff_router)
router.include_router(handoffs_router)
router.include_router(users_router)
router.include_router(analytics_router)
router.include_router(channels_router)