from typing import Literal, Dict, List, Set
import re

CATEGORY_MACRO = "macro"
CATEGORY_STOCKS = "stocks"

ALLOWED_CATEGORIES: Set[str] = {CATEGORY_MACRO, CATEGORY_STOCKS}

MARKET_RU: Literal["RU"] = "RU"
ALLOWED_MARKETS: Set[str] = {MARKET_RU}

ALLOWED_HORIZONS: Set[str] = {"short", "mid", "long"}
ALLOWED_EXPERIENCE: Set[str] = {"beginner", "intermediate", "pro"}
ALLOWED_RISK: Set[str] = {"low", "medium", "high"}

ALLOWED_SECTORS: Set[str] = {
    "banks",
    "oil_gas",
    "metals_mining",
    "it",
    "consumer",
    "telecom",
    "utilities",
    "real_estate",
    "transport",
    "industrials",
    "financials_other",
}

TICKER_RE = re.compile(r"^[A-Z0-9\.]{2,12}$")

NEWS_SOURCES: Dict[str, Dict[str, List[str]]] = {
    MARKET_RU: {
        CATEGORY_MACRO: [
            "https://www.rbc.ru/economics/",
            "https://www.vedomosti.ru/rubrics/economics",
            "https://www.cbr.ru/press/",
            "https://minfin.gov.ru/ru/press-center/",
        ],
        CATEGORY_STOCKS: [
            "https://www.rbc.ru/finances/",
            "https://www.vedomosti.ru/finance",
            "https://www.moex.com/ru/news/",
        ],
    }
}
