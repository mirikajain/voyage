from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class SpendGuardrailResult(BaseModel):
    allowed: bool
    requires_approval: bool
    reason: str
    budget_ceiling: Optional[float] = None
    requested_amount: float
    remaining_buffer: float = 0.0
    is_budget_exceeded: bool = False
    autonomous_limit: float = 5000.0
    ask_before_purchase: bool = True

class RazorpayOrderSchema(BaseModel):
    order_id: str
    amount_in_paise: int
    amount_in_rupees: float
    currency: str = "INR"
    status: str = "created"
    payment_reference: Optional[str] = None
    key_id: Optional[str] = None
    mode: str = "mock"  # "mock" | "live"
    merchant_name: str = "Voyage Luxury Travel Concierge"
    notes: Dict[str, Any] = Field(default_factory=dict)

class PaymentConfirmationSchema(BaseModel):
    payment_id: str
    order_id: str
    payment_reference: str
    booking_reference: str
    amount: float
    currency: str = "INR"
    status: str = "paid"  # "paid" | "failed" | "cancelled"
    timestamp: str
    method: str = "UPI / Card (Razorpay Secure)"
    receipt: str

class CreateOrderRequest(BaseModel):
    amount: float
    currency: str = "INR"
    thread_id: Optional[str] = None
    receipt: Optional[str] = None
    notes: Dict[str, Any] = Field(default_factory=dict)

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    thread_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = "INR"

class ApproveTripRequest(BaseModel):
    approved: bool = True
    notes: Optional[str] = None

class RejectTripRequest(BaseModel):
    reason: Optional[str] = "User cancelled"

