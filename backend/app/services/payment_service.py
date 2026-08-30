from typing import Dict, Any, Optional

class MockPaymentService:
    """
    Razorpay Financial Layer Service.
    Prepares tokenized spend guardrails and approval payloads.
    Does NOT execute real payments.
    """
    
    @staticmethod
    def check_spend_guardrails(amount: float, budget_ceiling: float) -> Dict[str, Any]:
        within_bounds = amount <= budget_ceiling
        return {
            "within_bounds": within_bounds,
            "amount": amount,
            "budget_ceiling": budget_ceiling,
            "surplus_or_deficit": budget_ceiling - amount,
            "security_tier": "Razorpay Token Vault L1"
        }

    @staticmethod
    def prepare_approval_payload(item_name: str, amount: float, currency: str = "INR") -> Dict[str, Any]:
        return {
            "action": "AUTHORIZE_TRAVEL_RESERVATION",
            "item": item_name,
            "amount": amount,
            "currency": currency,
            "requires_explicit_user_confirmation": True,
            "merchant": "Voyage Luxury AI Vault",
            "vault_token_id": "tok_rzp_vault_4242"
        }
