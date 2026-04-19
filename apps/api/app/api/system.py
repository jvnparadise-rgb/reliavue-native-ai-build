from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/info")
def system_info() -> dict[str, str]:
    return {
        "app_name": settings.app_name,
        "environment": settings.environment,
        "database_url": settings.database_url,
    }
