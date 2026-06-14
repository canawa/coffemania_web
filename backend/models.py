from pydantic import BaseModel, Field
from typing import Literal, Optional

class User(BaseModel):
    email: str
    password: str
    created_at: str
    code: str = Field(min_length=6, max_length=6)

class SendCodeRequest(BaseModel):
    email: str
    purpose: Literal["register", "reset_password"]

class ResetPasswordRequest(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6, max_length=128)

class PaymentRequest(BaseModel):
    amount: int
    promo_code: Optional[str] = None
    purpose: str = "subscription"
    subscription_id: Optional[int] = None
    duration_days: int = 30

class VpnConfiguration(BaseModel):
    duration: int
    country: str


class RenewSubscriptionRequest(BaseModel):
    duration: int
    subscription_id: Optional[int] = None

class ReferralCodeRequest(BaseModel):
    code: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str