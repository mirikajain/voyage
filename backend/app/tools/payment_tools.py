from typing import Dict, Any, Optional
from app.services.payment_service import PaymentService

def spend_guardrail_check(
    amount: float,
    user_budget: Optional[float] = None,
    user_preferences: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Deterministic spend guardrail check against trip budget and autonomous spending limits."""
    result = PaymentService.spend_guardrail_check(
        amount=amount,
        user_budget=user_budget,
        user_preferences=user_preferences
    )
    return result.model_dump()

def prepare_human_approval_request(
    action: str,
    item_title: str,
    amount: float,
    currency: str = "INR",
    payment_reference: Optional[str] = None
) -> Dict[str, Any]:
    """Constructs a structured human approval request without charging the user."""
    ref = payment_reference or f"VOYAGE-AUTH-{item_title[:6].upper()}"
    return {
        "action": action,
        "item": item_title,
        "amount": amount,
        "currency": currency,
        "payment_reference": ref,
        "requires_approval": True,
        "approval_reason": "Travel purchase requires explicit user authorization before charge",
        "merchant": "Voyage Luxury AI Travel Concierge",
        "gateway": "Razorpay"
    }

def create_razorpay_order(
    amount_in_rupees: float,
    currency: str = "INR",
    payment_reference: Optional[str] = None,
    notes: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Generates a Razorpay order in smallest currency unit (paise)."""
    order = PaymentService.create_order(
        amount_in_rupees=amount_in_rupees,
        currency=currency,
        payment_reference=payment_reference,
        notes=notes
    )
    return order.model_dump()

def confirm_razorpay_payment(
    order_id: str,
    amount_in_rupees: float,
    currency: str = "INR",
    payment_reference: Optional[str] = None,
    payment_id: Optional[str] = None,
    status: str = "paid"
) -> Dict[str, Any]:
    """Confirms payment and generates booking receipt reference."""
    conf = PaymentService.confirm_payment(
        order_id=order_id,
        amount_in_rupees=amount_in_rupees,
        currency=currency,
        payment_reference=payment_reference,
        payment_id=payment_id,
        status=status
    )
    return conf.model_dump()
