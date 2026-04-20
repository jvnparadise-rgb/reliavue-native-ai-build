from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/system", tags=["system"])


def _redact_database_url(url: str) -> str:
    if "@" not in url or "://" not in url:
        return url

    scheme, rest = url.split("://", 1)
    creds_and_host = rest.split("@", 1)

    if len(creds_and_host) != 2:
        return url

    creds, host_part = creds_and_host
    if ":" not in creds:
        return f"{scheme}://***@{host_part}"

    username, _password = creds.split(":", 1)
    return f"{scheme}://{username}:***@{host_part}"


@router.get("/info")
def system_info() -> dict[str, str]:
    return {
        "app_name": settings.app_name,
        "environment": settings.environment,
        "database_url": _redact_database_url(settings.resolved_database_url),
    }
