from fastapi import APIRouter

from app.core.constants import ALLOWED_CATEGORIES, ALLOWED_MARKETS

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/options")
def get_options():
    return {
        "markets": ALLOWED_MARKETS,
        "categories": ALLOWED_CATEGORIES,
    }
