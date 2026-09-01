import os
import uuid
import datetime
from typing import Dict, Any, Optional
from app.models.payment_schemas import (
    SpendGuardrailResult,
    RazorpayOrderSchema,
    PaymentConfirmationSchema
)

class PaymentService:
    """
    Razorpay-compatible Financial Intelligence & Payment Layer.
    Provides deterministic spend guardrail validation, order generation, and mock/live checkout execution.
    """

    @classmethod
    def get_mode(cls) -> str:
        return os.getenv("RAZORPAY_MODE", "mock").strip().lower()

    @classmethod
    def get_key_id(cls) -> str:
        return os.getenv("RAZORPAY_KEY_ID", "rzp_test_voyage_demo_key").strip()

    @classmethod
    def get_key_secret(cls) -> Optional[str]:
        # Secret is kept strictly server-side and never returned in API responses
        sec = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
        return sec if sec else None

    @classmethod
    def spend_guardrail_check(
        cls,
        amount: float,
        user_budget: Optional[float] = None,
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> SpendGuardrailResult:
        """
        Deterministic Python spend guardrail validation.
        - Blocks payment if amount exceeds user's trip budget ceiling.
        - Enforces explicit user approval if amount exceeds autonomous threshold (₹5,000)
          or if user preference 'askBeforePurchases' is active (default True).
        """
        prefs = user_preferences or {}
        ai_prefs = prefs.get("aiPreferences", {})
        ask_before_purchase = ai_prefs.get("askBeforePurchases", True)
        autonomous_limit = float(prefs.get("autonomousSpendingLimit", 5000.0))

        if user_budget is not None and user_budget > 0:
            if amount > user_budget:
                overage = amount - user_budget
                return SpendGuardrailResult(
                    allowed=False,
                    requires_approval=True,
                    reason=f"Estimated cost ₹{int(amount):,} exceeds specified budget ₹{int(user_budget):,} by ₹{int(overage):,}. Resolve budget overage before booking.",
                    budget_ceiling=user_budget,
                    requested_amount=amount,
                    remaining_buffer=0.0,
                    is_budget_exceeded=True,
                    autonomous_limit=autonomous_limit,
                    ask_before_purchase=ask_before_purchase
                )
            else:
                buffer_val = user_budget - amount
                return SpendGuardrailResult(
                    allowed=True,
                    requires_approval=True,  # Travel booking packages always require explicit human sign-off
                    reason="Package fits within verified budget ceiling. Human approval required before payment authorization.",
                    budget_ceiling=user_budget,
                    requested_amount=amount,
                    remaining_buffer=buffer_val,
                    is_budget_exceeded=False,
                    autonomous_limit=autonomous_limit,
                    ask_before_purchase=ask_before_purchase
                )
        else:
            return SpendGuardrailResult(
                allowed=True,
                requires_approval=True,
                reason="Standard travel package requires explicit human confirmation before charge.",
                budget_ceiling=None,
                requested_amount=amount,
                remaining_buffer=0.0,
                is_budget_exceeded=False,
                autonomous_limit=autonomous_limit,
                ask_before_purchase=ask_before_purchase
            )

    @classmethod
    def create_order(
        cls,
        amount_in_rupees: float,
        currency: str = "INR",
        payment_reference: Optional[str] = None,
        notes: Optional[Dict[str, Any]] = None
    ) -> RazorpayOrderSchema:
        """
        Generates a Razorpay-compatible order.
        Converts Rupees to Paise: ₹37,800 -> 3780000 paise.
        """
        mode = cls.get_mode()
        key_id = cls.get_key_id()
        key_secret = cls.get_key_secret()
        amount_in_paise = int(round(amount_in_rupees * 100))
        ref = payment_reference or f"VOYAGE-{uuid.uuid4().hex[:6].upper()}"

        # If live mode is enabled and credentials are valid, call Razorpay SDK
        if mode == "live" and key_id and key_secret:
            try:
                import razorpay
                client = razorpay.Client(auth=(key_id, key_secret))
                order_payload = {
                    "amount": amount_in_paise,
                    "currency": currency,
                    "receipt": f"rcpt_{ref}",
                    "notes": notes or {"platform": "Voyage AI Concierge"}
                }
                live_order = client.order.create(data=order_payload)
                return RazorpayOrderSchema(
                    order_id=live_order.get("id"),
                    amount_in_paise=live_order.get("amount", amount_in_paise),
                    amount_in_rupees=amount_in_rupees,
                    currency=currency,
                    status=live_order.get("status", "created"),
                    payment_reference=ref,
                    key_id=key_id,
                    mode="live",
                    merchant_name="Voyage Luxury Travel Concierge",
                    notes=notes or {}
                )
            except Exception as e:
                print(f"[PaymentService] Live Razorpay order creation failed, falling back to mock mode: {e}")

        # Mock order mode (Default for Buildathon demo)
        mock_order_id = f"order_voyage_demo_{uuid.uuid4().hex[:8]}"
        return RazorpayOrderSchema(
            order_id=mock_order_id,
            amount_in_paise=amount_in_paise,
            amount_in_rupees=amount_in_rupees,
            currency=currency,
            status="created",
            payment_reference=ref,
            key_id=key_id,
            mode="mock",
            merchant_name="Voyage Luxury Travel Concierge",
            notes=notes or {"platform": "Voyage AI Concierge", "environment": "demo"}
        )

    @classmethod
    def confirm_payment(
        cls,
        order_id: str,
        amount_in_rupees: float,
        currency: str = "INR",
        payment_reference: Optional[str] = None,
        payment_id: Optional[str] = None,
        status: str = "paid"
    ) -> PaymentConfirmationSchema:
        """
        Synthesizes a verified payment confirmation and generated booking reference.
        """
        ref = payment_reference or f"VOYAGE-{uuid.uuid4().hex[:6].upper()}"
        pay_id = payment_id or f"pay_voyage_demo_{uuid.uuid4().hex[:10]}"
        booking_ref = f"{ref}-BK"
        ts = datetime.datetime.now().strftime("%d %b %Y, %I:%M %p")

        return PaymentConfirmationSchema(
            payment_id=pay_id,
            order_id=order_id,
            payment_reference=ref,
            booking_reference=booking_ref,
            amount=amount_in_rupees,
            currency=currency,
            status=status,
            timestamp=ts,
            method="UPI / Card (Razorpay Secure)",
            receipt=f"rcpt_{ref}"
        )
