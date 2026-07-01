from datetime import date, datetime, timedelta
from typing import Optional


def to_utc_iso(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    return dt.isoformat() + "Z"


SHOP_UTC_OFFSET = timedelta(hours=3)

LOCAL_TZ_MODIFIER = "-3 hours"


def shop_today() -> date:
    return (datetime.utcnow() - SHOP_UTC_OFFSET).date()
