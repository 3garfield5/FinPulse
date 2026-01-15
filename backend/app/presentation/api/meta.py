from fastapi import APIRouter

from app.core.constants import (
    MARKET_RU,
    CATEGORY_MACRO,
    CATEGORY_STOCKS,
    ALLOWED_HORIZONS,
    ALLOWED_EXPERIENCE,
    ALLOWED_RISK,
    ALLOWED_SECTORS,
)

router = APIRouter(prefix="/meta", tags=["Meta"])


@router.get("/options")
def get_options():
    return {
        "markets": [MARKET_RU],

        "categories": [
            CATEGORY_MACRO,
            CATEGORY_STOCKS,
        ],

        "horizons": sorted(ALLOWED_HORIZONS),
        "experience_levels": sorted(ALLOWED_EXPERIENCE),
        "risk_levels": sorted(ALLOWED_RISK),
        "sectors": sorted(ALLOWED_SECTORS),
    }
