from pydantic import BaseModel

class User(BaseModel):
    email: str
    password: str
    created_at: str

class PaymentRequest(BaseModel):
    amount: int

class VpnConfiguration(BaseModel):
    duration: int
    country: str