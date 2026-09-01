import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from app.models.payment_schemas import (
    CreateOrderRequest,
    VerifyPaymentRequest,
    RazorpayOrderSchema,
    PaymentConfirmationSchema
)
from app.models.schemas import AgentRunResponse
from app.services.razorpay_service import RazorpayService
from app.agent.graph import voyage_agent_app
from app.agent.nodes import _add_event
from app.api.agent import _format_agent_response

router = APIRouter(prefix="/payment", tags=["Payment"])

@router.post("/create-order", response_model=RazorpayOrderSchema)
async def create_payment_order(request: CreateOrderRequest):
    """
    Creates a Razorpay order for the approved trip package.
    Converts amount in Rupees to Paise.
    """
    try:
        receipt = request.receipt or f"rcpt_{uuid.uuid4().hex[:8]}"
        notes = dict(request.notes or {})
        if request.thread_id:
            notes["thread_id"] = request.thread_id

        order_data = RazorpayService.create_razorpay_order(
            amount_in_rupees=request.amount,
            currency=request.currency,
            receipt=receipt,
            notes=notes
        )

        # If thread_id is provided, record order in LangGraph checkpoint
        if request.thread_id:
            config = {"configurable": {"thread_id": request.thread_id}}
            try:
                current_state = voyage_agent_app.get_state(config)
                if current_state and current_state.values:
                    state_dict = dict(current_state.values)
                    state_dict["payment_order"] = order_data
                    state_dict["razorpay_order_id"] = order_data.get("order_id")
                    state_dict["payment_status"] = "pending"
                    state_dict["booking_status"] = "processing"
                    
                    events = _add_event(
                        state_dict.get("agent_events", []),
                        f"Payment initiated: Created Razorpay order {order_data['order_id']} (₹{int(request.amount):,})",
                        "budget"
                    )
                    state_dict["agent_events"] = events
                    voyage_agent_app.update_state(config, state_dict)
            except Exception as e:
                print(f"[Payment API] Note: Failed to update thread order state: {e}")

        return RazorpayOrderSchema(**order_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create Razorpay order: {str(e)}"
        )

@router.post("/verify")
async def verify_payment(request: VerifyPaymentRequest):
    """
    Cryptographically verifies the Razorpay payment signature using secret key.
    On success: marks payment as 'paid', trip as 'confirmed', and syncs LangGraph state.
    """
    try:
        is_valid, msg = RazorpayService.verify_payment_signature(
            razorpay_order_id=request.razorpay_order_id,
            razorpay_payment_id=request.razorpay_payment_id,
            razorpay_signature=request.razorpay_signature
        )

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment signature verification failed: {msg}"
            )

        thread_id = request.thread_id
        final_state = None

        if thread_id:
            config = {"configurable": {"thread_id": thread_id}}
            try:
                current_state = voyage_agent_app.get_state(config)
                state_dict = dict(current_state.values) if current_state and current_state.values else {}
                
                amount = float(request.amount or state_dict.get("payment_amount") or state_dict.get("estimated_total") or 0.0)
                ref = state_dict.get("payment_reference") or f"VOYAGE-{thread_id[:6].upper()}"

                confirmation = RazorpayService.generate_booking_confirmation(
                    order_id=request.razorpay_order_id,
                    payment_id=request.razorpay_payment_id,
                    amount_in_rupees=amount,
                    currency=request.currency or "INR",
                    payment_reference=ref
                )

                state_dict["payment_status"] = "paid"
                state_dict["booking_status"] = "confirmed"
                state_dict["requires_approval"] = False
                state_dict["approval_status"] = "approved"
                state_dict["razorpay_order_id"] = request.razorpay_order_id
                state_dict["razorpay_payment_id"] = request.razorpay_payment_id
                state_dict["payment_confirmation"] = confirmation

                events = state_dict.get("agent_events", [])
                events = _add_event(events, f"Razorpay payment verified: {request.razorpay_payment_id}", "budget")
                events = _add_event(events, f"Trip confirmed! Booking reference: {confirmation['booking_reference']}", "complete")
                state_dict["agent_events"] = events

                steps = list(state_dict.get("step_progress", []))
                for s in steps:
                    if s["id"] in ["step-8", "step-9"]:
                        s["status"] = "complete"
                        s["completed_description"] = "Razorpay payment verified"
                
                if not any(s["id"] == "step-10" for s in steps):
                    steps.append({
                        "id": "step-10",
                        "label": "Trip confirmed",
                        "status": "complete",
                        "completed_description": f"Ref: {confirmation['booking_reference']}"
                    })
                state_dict["step_progress"] = steps

                voyage_agent_app.update_state(config, state_dict)
                final_state = state_dict
            except Exception as e:
                print(f"[Payment API] Note: Failed to update thread verification state: {e}")

        if final_state and thread_id:
            formatted = _format_agent_response(thread_id, final_state)
            return {
                "verified": True,
                "status": "paid",
                "booking_status": "confirmed",
                "message": msg,
                "payment_id": request.razorpay_payment_id,
                "order_id": request.razorpay_order_id,
                "booking_reference": final_state.get("payment_confirmation", {}).get("booking_reference"),
                "agent_response": formatted.dict()
            }

        booking_ref = f"VOYAGE-{uuid.uuid4().hex[:6].upper()}-BK"
        return {
            "verified": True,
            "status": "paid",
            "booking_status": "confirmed",
            "message": msg,
            "payment_id": request.razorpay_payment_id,
            "order_id": request.razorpay_order_id,
            "booking_reference": booking_ref
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification encountered an internal error: {str(e)}"
        )
