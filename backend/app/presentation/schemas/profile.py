from typing import List, Optional

from pydantic import BaseModel

from app.core.constants import ALLOWED_CATEGORIES, ALLOWED_MARKETS


class PreferencesUpdate(BaseModel):
    markets: Optional[List[str]] = None
    categories: Optional[List[str]] = None

    def validate_markets(self):
        if self.markets is not None:
            invalid = set(self.markets) - set(ALLOWED_MARKETS)
            if invalid:
                raise ValueError(f"Недопустимые рынки: {', '.join(invalid)}")

    def validate_categories(self):
        if self.categories is not None:
            invalid = set(self.categories) - set(ALLOWED_CATEGORIES)
            if invalid:
                raise ValueError(f"Недопустимые категории: {', '.join(invalid)}")
