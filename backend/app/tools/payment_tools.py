from typing import Dict, Any
from app.services.payment_service import MockPaymentService

def prepare_human_approval_request(
    action: str,
    item_title: str,
    amount: float,
    currency: str = "INR"
) -> Dict[str, Any]:
    """
    Constructs an explicit human approval request object.
    Does NOT execute payment.
    """
    return MockPaymentService.prepare_approval_payload(
        item_name=item_title,
        amount=amount,
        currency=currency
    )

def verify_budget_guardrails(total_cost: float, budget_ceiling: float) -> Dict[str, Any]:
    """Checks spend guardrails against user-defined ceilings."""
    return MockPaymentService.check_spend_guardrails(amount=total_cost, budget_ceiling=budget_ceiling)
