ALLOWED_MARKETS = ["russia", "usa", "europe", "asia"]
ALLOWED_CATEGORIES = ["macro", "stocks", "fx", "crypto", "commodities"]

NEWS_SOURCES: dict = {
    "russia": {
        "macro": [
            "https://www.rbc.ru/economics/",
            "https://www.vedomosti.ru/rubrics/economics",
        ],
        "stocks": [
            "https://www.rbc.ru/finances/",
        ],
        "fx": [
            "https://www.rbc.ru/tags/?tag=валюта",
        ],
        "crypto": [
            "https://www.rbc.ru/crypto/",
        ],
        "commodities": [
            "https://www.rbc.ru/commodities/",
        ],
    },
    "usa": {
        "macro": [
            "https://www.cnbc.com/economy/",
        ],
        "stocks": [
            "https://www.cnbc.com/stocks/",
        ],
        "fx": [
            "https://www.investing.com/currencies/",
        ],
        "crypto": [
            "https://www.coindesk.com/",
        ],
        "commodities": [
            "https://www.investing.com/commodities/",
        ],
    },
}
