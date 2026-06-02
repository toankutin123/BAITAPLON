from pydantic import BaseModel
from typing import Optional, List


class RealEstate(BaseModel):
    price: Optional[float] = None
    area: Optional[float] = None
    bedroom: Optional[int] = None
    toilet: Optional[int] = None
    floors: Optional[int] = None
    address: Optional[str] = None
    width: Optional[float] = None
    length: Optional[float] = None
    rent_income: Optional[float] = None
    nearby: List[str] = []