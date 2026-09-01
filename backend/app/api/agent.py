import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    AgentRunRequest,
    AgentRunResponse,
    ResumeApprovalRequest,
    ConfirmPaymentRequest,
    CostBreakdownSchema,
    AgentEventSchema,
    StepProgressSchema,
    ApprovalRequestSchema,
    SearchResultsSchema
)
from app.models.payment_schemas import (
    SpendGuardrailResult,
    RazorpayOrderSchema,
    PaymentConfirmationSchema
)
from app.agent.graph import voyage_agent_app
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/agent", tags=["Agent"])

def _format_agent_response(thread_id: str, final_state: Dict[str, Any]) -> AgentRunResponse:
    dest = final_state.get("destination", "Goa")
    orig = final_state.get("origin", "Mumbai")
    duration = final_state.get("duration", 4)
    budget = final_state.get("budget")
    estimated_total = float(final_state.get("estimated_total", 0.0))
    rem_buf = float(final_state.get("remaining_budget", 0.0))
    is_exceeded = bool(final_state.get("is_budget_exceeded", False))
    compromise_msg = final_state.get("compromise_message")
    ai_mode = final_state.get("ai_mode", "demo")
    intent = final_state.get("intent", "trip_planning")

    hotel = final_state.get("selected_hotel", {})
    flight = final_state.get("selected_flight", {})
    rest = final_state.get("selected_restaurants", {})
    act = final_state.get("selected_activities", {})
    trans = final_state.get("selected_transport", {})

    hotel_cost = float(hotel.get("total_price") or hotel.get("total_cost", 0.0))
    flight_cost = float(flight.get("price") or flight.get("total_price", 0.0))
    dining_cost = float(rest.get("total_estimated", 0.0))
    activities_cost = float(act.get("total_estimated", 0.0))
    transport_cost = float(trans.get("total_estimated", 0.0))

    hotel_source = hotel.get("source", "Voyage Demo Provider")
    hotel_is_live = bool(hotel.get("is_live", False))
    travel_source = flight.get("source", "Voyage Demo Provider")
    travel_is_live = bool(flight.get("is_live", False))

    reasons = final_state.get("reasons", [])
    itinerary = final_state.get("itinerary", [])

    breakdown = CostBreakdownSchema(
        hotel_name=hotel.get("name", "Boutique Hotel"),
        hotel_cost=hotel_cost,
        dining_cost=dining_cost,
        activities_cost=activities_cost,
        transport_cost=transport_cost,
        travel_cost=flight_cost,
        total_estimated_cost=estimated_total,
        requested_budget=budget,
        remaining_buffer=rem_buf,
        hotel_source=hotel_source,
        hotel_is_live=hotel_is_live,
        travel_source=travel_source,
        travel_is_live=travel_is_live,
        budget_envelopes=final_state.get("budget_envelopes"),
        category_status=final_state.get("category_status")
    )

    # Search results mapping
    search_results_obj = None
    sr = final_state.get("search_results")
    if sr:
        search_results_obj = SearchResultsSchema(
            type=sr.get("type", "flights"),
            query_title=sr.get("query_title", f"Results for {dest}"),
            items=sr.get("items", []),
            total_count=sr.get("total_count", len(sr.get("items", []))),
            provider=sr.get("provider", "Voyage Network"),
            is_live=sr.get("is_live", False)
        )

    # Approval and Payment layer mapping
    approval_req_obj = None
    if final_state.get("approval_request"):
        ar = final_state["approval_request"]
        approval_req_obj = ApprovalRequestSchema(
            action=ar.get("action", "AUTHORIZE_TRIP_BOOKING"),
            item=ar.get("item", f"{dest} · {duration} Days"),
            trip_destination=ar.get("trip_destination", dest),
            destination=ar.get("destination", dest),
            duration=ar.get("duration", duration),
            duration_days=ar.get("duration_days", duration),
            selected_hotel=ar.get("selected_hotel", hotel.get("name")),
            selected_flight=ar.get("selected_flight", flight.get("airline")),
            selected_activities=ar.get("selected_activities", []),
            total_estimated_cost=float(ar.get("total_estimated_cost", estimated_total)),
            amount=float(ar.get("amount", estimated_total)),
            currency=ar.get("currency", "INR"),
            payment_reference=ar.get("payment_reference", f"VOYAGE-{thread_id[:6].upper()}"),
            requires_approval=bool(ar.get("requires_approval", True)),
            approval_status=ar.get("approval_status", "pending"),
            approval_reason=ar.get("approval_reason", "Travel purchase requires user approval before charge"),
            user_explanation=ar.get("user_explanation"),
            budget=budget,
            remaining_budget=rem_buf,
            remaining_buffer=rem_buf,
            budget_envelopes=final_state.get("budget_envelopes"),
            gateway=ar.get("gateway", "Razorpay")
        )

    spend_gr_obj = None
    sgr = final_state.get("spend_guardrail_result")
    if sgr:
        spend_gr_obj = SpendGuardrailResult(
            allowed=sgr.get("allowed", True),
            requires_approval=sgr.get("requires_approval", True),
            reason=sgr.get("reason", ""),
            budget_ceiling=sgr.get("budget_ceiling"),
            requested_amount=float(sgr.get("requested_amount", estimated_total)),
            remaining_buffer=float(sgr.get("remaining_buffer", 0.0)),
            is_budget_exceeded=bool(sgr.get("is_budget_exceeded", False)),
            autonomous_limit=float(sgr.get("autonomous_limit", 5000.0)),
            ask_before_purchase=bool(sgr.get("ask_before_purchase", True))
        )

    order_obj = None
    p_order = final_state.get("payment_order")
    if p_order:
        order_obj = RazorpayOrderSchema(
            order_id=p_order.get("order_id"),
            amount_in_paise=int(p_order.get("amount_in_paise", estimated_total * 100)),
            amount_in_rupees=float(p_order.get("amount_in_rupees", estimated_total)),
            currency=p_order.get("currency", "INR"),
            status=p_order.get("status", "created"),
            payment_reference=p_order.get("payment_reference", ""),
            key_id=p_order.get("key_id"),
            mode=p_order.get("mode", "mock"),
            merchant_name=p_order.get("merchant_name", "Voyage Luxury Travel Concierge"),
            notes=p_order.get("notes", {})
        )

    conf_obj = None
    p_conf = final_state.get("payment_confirmation")
    if p_conf:
        conf_obj = PaymentConfirmationSchema(
            payment_id=p_conf.get("payment_id"),
            order_id=p_conf.get("order_id"),
            payment_reference=p_conf.get("payment_reference"),
            booking_reference=p_conf.get("booking_reference"),
            amount=float(p_conf.get("amount", estimated_total)),
            currency=p_conf.get("currency", "INR"),
            status=p_conf.get("status", "paid"),
            timestamp=p_conf.get("timestamp"),
            method=p_conf.get("method", "UPI / Card (Razorpay Secure)"),
            receipt=p_conf.get("receipt")
        )

    # Calculate status
    state_status = final_state.get("status")
    missing_fields = final_state.get("missing_fields") or []
    question = final_state.get("question")
    payment_status = final_state.get("payment_status", "not_started")
    req_approval = bool(final_state.get("requires_approval", False))
    appr_status = final_state.get("approval_status", "pending" if req_approval else "none")
    bkg_status = final_state.get("booking_status", "not_started")

    if state_status == "needs_input" or missing_fields:
        run_status = "needs_input"
    elif payment_status == "awaiting_approval":
        run_status = "awaiting_approval"
    elif is_exceeded:
        run_status = "budget_warning"
    else:
        run_status = "completed"

    prov_summary = final_state.get("provider_summary", {})
    notice = "Prices shown with live partner rates & verified inventory" if prov_summary.get("any_live") else "Prices shown from simulated external travel providers"

    return AgentRunResponse(
        thread_id=thread_id,
        status=run_status,
        intent=intent,
        destination=dest,
        origin=orig,
        departure_date=final_state.get("departure_date"),
        return_date=final_state.get("return_date"),
        duration_days=duration,
        travelers=final_state.get("travelers"),
        budget=budget,
        budget_envelopes=final_state.get("budget_envelopes"),
        category_status=final_state.get("category_status"),
        currency=final_state.get("currency", "INR"),
        estimated_total=estimated_total,
        remaining_budget=rem_buf,
        breakdown=breakdown if run_status != "needs_input" else None,
        reasons=reasons if run_status != "needs_input" else ([question] if question else []),
        itinerary=itinerary if run_status != "needs_input" else [],
        search_results=search_results_obj,
        agent_events=[AgentEventSchema(**e) for e in final_state.get("agent_events", [])],
        step_progress=[StepProgressSchema(**s) for s in final_state.get("step_progress", [])],
        provider_summary=prov_summary,
        missing_fields=missing_fields if missing_fields else None,
        question=question,
        requires_approval=req_approval,
        approval_status=appr_status,
        approval_reason=final_state.get("approval_reason"),
        approval_request=approval_req_obj,
        payment_status=payment_status,
        booking_status=bkg_status,
        payment_amount=float(final_state.get("payment_amount", estimated_total)),
        payment_reference=final_state.get("payment_reference"),
        payment_order=order_obj,
        payment_confirmation=conf_obj,
        razorpay_order_id=final_state.get("razorpay_order_id"),
        razorpay_payment_id=final_state.get("razorpay_payment_id"),
        spend_guardrail_result=spend_gr_obj,
        is_budget_exceeded=is_exceeded,
        compromise_message=compromise_msg,
        data_source_notice=notice,
        optimization_attempts=final_state.get("optimization_attempts", 0),
        ai_mode=ai_mode,
        error=final_state.get("error")
    )

@router.post("/run", response_model=AgentRunResponse)
async def run_agent_workflow(request: AgentRunRequest):
    """
    Executes the Voyage autonomous LangGraph workflow with intent classification,
    spend guardrails, and Razorpay payment preparation.
    """
    thread_id = request.thread_id or f"thread_{uuid.uuid4().hex[:12]}"
    config = {"configurable": {"thread_id": thread_id}}

    existing_state = {}
    if request.thread_id:
        try:
            current_checkpoint = voyage_agent_app.get_state(config)
            if current_checkpoint and current_checkpoint.values:
                existing_state = dict(current_checkpoint.values)
        except Exception:
            pass

    initial_state = {
        **existing_state,
        "thread_id": thread_id,
        "request": request.message,
        "agent_events": existing_state.get("agent_events", []),
        "step_progress": [],
        "optimization_attempts": 0,
        "is_budget_exceeded": False,
        "payment_status": "not_started",
        "requires_approval": False
    }

    try:
        final_state = voyage_agent_app.invoke(initial_state, config=config)
        return _format_agent_response(thread_id, final_state)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Voyage agent workflow execution failed: {str(e)}")

@router.post("/{thread_id}/approve", response_model=AgentRunResponse)
async def approve_agent_workflow(thread_id: str):
    """
    Explicit human approval endpoint for trip booking.
    Advances thread state from 'awaiting_approval' to 'approved' and prepares for payment.
    """
    config = {"configurable": {"thread_id": thread_id}}
    try:
        current_state = voyage_agent_app.get_state(config)
        state_dict = dict(current_state.values) if current_state and current_state.values else {}
        
        state_dict["approval_status"] = "approved"
        state_dict["requires_approval"] = False
        state_dict["payment_status"] = "approved"
        state_dict["booking_status"] = "processing"

        from app.agent.nodes import execute_payment_node
        updated = execute_payment_node(state_dict)
        state_dict.update(updated)
        voyage_agent_app.update_state(config, state_dict)
        return _format_agent_response(thread_id, state_dict)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to approve thread workflow: {str(e)}")

@router.post("/{thread_id}/reject", response_model=AgentRunResponse)
async def reject_agent_workflow(thread_id: str):
    """
    Human rejection / cancellation endpoint.
    Sets thread approval_status='rejected', payment_status='cancelled', and preserves itinerary.
    """
    config = {"configurable": {"thread_id": thread_id}}
    try:
        current_state = voyage_agent_app.get_state(config)
        state_dict = dict(current_state.values) if current_state and current_state.values else {}
        
        state_dict["approval_status"] = "rejected"
        state_dict["requires_approval"] = False
        state_dict["payment_status"] = "cancelled"
        state_dict["booking_status"] = "failed"
        state_dict["payment_order"] = None

        from app.agent.nodes import execute_payment_node
        updated = execute_payment_node(state_dict)
        state_dict.update(updated)
        state_dict["payment_order"] = None
        voyage_agent_app.update_state(config, state_dict)
        return _format_agent_response(thread_id, state_dict)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to reject thread workflow: {str(e)}")

@router.post("/{thread_id}/resume", response_model=AgentRunResponse)
async def resume_agent_approval(thread_id: str, request: ResumeApprovalRequest):
    """
    Human-in-the-loop approval endpoint.
    Resumes the LangGraph thread state after explicit user approval or cancellation.
    """
    config = {"configurable": {"thread_id": thread_id}}

    try:
        current_state = voyage_agent_app.get_state(config)
        if not current_state or not current_state.values:
            state_dict = {
                "thread_id": thread_id,
                "request": "Resume booking",
                "destination": "Goa",
                "duration": 4,
                "estimated_total": 0.0,
                "payment_amount": 0.0,
                "payment_reference": f"VOYAGE-{thread_id[:6].upper()}",
                "payment_status": "awaiting_approval",
                "agent_events": [],
                "step_progress": []
            }
        else:
            state_dict = dict(current_state.values)

        if not request.approved:
            state_dict["approval_status"] = "rejected"
            state_dict["requires_approval"] = False
            state_dict["payment_status"] = "cancelled"
            state_dict["booking_status"] = "failed"
            state_dict["payment_order"] = None
            
            from app.agent.nodes import execute_payment_node
            updated = execute_payment_node(state_dict)
            state_dict.update(updated)
            state_dict["payment_order"] = None
            voyage_agent_app.update_state(config, state_dict)
            return _format_agent_response(thread_id, state_dict)

        if request.simulate_failure:
            state_dict["payment_status"] = "failed"
            state_dict["booking_status"] = "failed"
            state_dict["requires_approval"] = False
            from app.agent.nodes import _add_event
            state_dict["agent_events"] = _add_event(
                state_dict.get("agent_events", []),
                "Razorpay simulation: Payment failed (card decline / network timeout).",
                "budget"
            )
            voyage_agent_app.update_state(config, state_dict)
            return _format_agent_response(thread_id, state_dict)

        state_dict["approval_status"] = "approved"
        state_dict["requires_approval"] = False
        state_dict["booking_status"] = "processing"
        from app.agent.nodes import execute_payment_node
        updated = execute_payment_node(state_dict)
        state_dict.update(updated)
        voyage_agent_app.update_state(config, state_dict)
        return _format_agent_response(thread_id, state_dict)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to resume thread approval: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to resume thread approval: {str(e)}")

@router.post("/{thread_id}/confirm_payment", response_model=AgentRunResponse)
async def confirm_payment_endpoint(thread_id: str, request: ConfirmPaymentRequest):
    """
    Called upon successful Razorpay checkout completion.
    Generates verified booking reference, updates state, and sets payment_status='paid'.
    """
    config = {"configurable": {"thread_id": thread_id}}

    try:
        current_state = voyage_agent_app.get_state(config)
        state_dict = dict(current_state.values) if current_state and current_state.values else {
            "destination": "Goa",
            "duration": 4,
            "estimated_total": request.amount,
            "agent_events": [],
            "step_progress": []
        }

        confirmation = PaymentService.confirm_payment(
            order_id=request.order_id,
            amount_in_rupees=request.amount,
            currency=request.currency,
            payment_reference=request.payment_reference or state_dict.get("payment_reference", "VOYAGE-BOOK"),
            payment_id=request.payment_id,
            status=request.status
        )

        state_dict["payment_status"] = "paid"
        state_dict["requires_approval"] = False
        state_dict["payment_confirmation"] = confirmation

        from app.agent.nodes import _add_event
        events = _add_event(
            state_dict.get("agent_events", []),
            f"Payment confirmed via Razorpay: {confirmation['payment_id']} (Ref: {confirmation['booking_reference']})",
            "complete"
        )
        state_dict["agent_events"] = events

        steps = list(state_dict.get("step_progress", []))
        for s in steps:
            if s["id"] in ["step-8", "step-9"]:
                s["status"] = "complete"
                s["completed_description"] = "Payment authorized via Razorpay"
        
        steps.append({
            "id": "step-10",
            "label": "Payment completed",
            "status": "complete",
            "completed_description": f"Booking reference: {confirmation['booking_reference']}"
        })
        state_dict["step_progress"] = steps

        voyage_agent_app.update_state(config, state_dict)
        return _format_agent_response(thread_id, state_dict)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to confirm payment: {str(e)}")
