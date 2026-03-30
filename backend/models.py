from pydantic import BaseModel

class User(BaseModel):
    email: str
    password: str
    created_at: str

class PaymentRequest(BaseModel):
    amount: int
    promo_code: str | None = None

class VpnConfiguration(BaseModel):
    duration: int
    country: str

class ReferralCodeRequest(BaseModel):
    code: str