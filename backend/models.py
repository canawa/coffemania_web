from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    email: str
    password: str
    created_at: str

class PaymentRequest(BaseModel):
    amount: int
    promo_code: Optional[str] = None

class VpnConfiguration(BaseModel):
    duration: int
    country: str

class ReferralCodeRequest(BaseModel):
    code: str