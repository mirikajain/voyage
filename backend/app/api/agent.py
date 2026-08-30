import uuid
import os
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.models.schemas import (
    AgentRunRequest,
    AgentRunResponse,
    ResumeApprovalRequest,
    CostBreakdownSchema,
    AgentEventSchema,
    StepProgressSchema,
    ApprovalRequestSchema
)
from app.agent.graph import voyage_agent_app
from app.agent.llm import is_llm_enabled

router = APIRouter(prefix="/api/agent", tags=["Agent"])

@router.post("/run", response_model=AgentRunResponse)
async def run_agent(request: AgentRunRequest):
    """
    Executes the LangGraph autonomous travel concierge graph powered by Real Travel APIs & Google Gemini.
    """
    try:
        thread_id = request.thread_id or f"thread_{uuid.uuid4().hex[:12]}"
        config = {"configurable": {"thread_id": thread_id}}

        initial_state = {
            "request": request.message,
            "agent_events": [],
            "step_progress": [],
            "optimization_attempts": 0,
            "is_budget_exceeded": False
        }

        # Run the LangGraph execution
        final_state = voyage_agent_app.invoke(initial_state, config=config)

        # Assemble breakdown response
        hotel = final_state.get("selected_hotel", {})
        flight = final_state.get("selected_flight", {})
        dining = final_state.get("selected_restaurants", {})
        activities = final_state.get("selected_activities", {})
        transport = final_state.get("selected_transport", {})

        hotel_cost = float(hotel.get("total_price") or hotel.get("total_cost", 12800.0))
        flight_cost = float(flight.get("price") or flight.get("total_price", 8000.0))
        dining_cost = float(dining.get("total_estimated", 7000.0))
        activities_cost = float(activities.get("total_estimated", 6500.0))
        transport_cost = float(transport.get("total_estimated", 3500.0))
        
        total_est = float(final_state.get("estimated_total", hotel_cost + flight_cost + dining_cost + activities_cost + transport_cost))
        
        user_budget = final_state.get("budget")
        budget_val = float(user_budget) if user_budget is not None else None
        remaining = float(final_state.get("remaining_budget", max(0.0, (budget_val - total_est) if budget_val else 0.0)))

        hotel_src = hotel.get("source", "Voyage Demo Provider")
        hotel_live = bool(hotel.get("is_live", False))
        travel_src = flight.get("source", "Voyage Demo Provider")
        travel_live = bool(flight.get("is_live", False))

        breakdown = CostBreakdownSchema(
            hotel_name=hotel.get("name", "Boutique Residence"),
            hotel_cost=hotel_cost,
            dining_cost=dining_cost,
            activities_cost=activities_cost,
            transport_cost=transport_cost,
            travel_cost=flight_cost,
            total_estimated_cost=total_est,
            requested_budget=budget_val,
            remaining_buffer=remaining,
            hotel_source=hotel_src,
            hotel_is_live=hotel_live,
            travel_source=travel_src,
            travel_is_live=travel_live
        )

        approval_req = None
        if final_state.get("approval_request"):
            req_data = final_state["approval_request"]
            approval_req = ApprovalRequestSchema(
                action=req_data.get("action", "BUILD_VOYAGE_TRIP"),
                item=req_data.get("item", f"{final_state.get('destination', 'Trip')} Package"),
                amount=float(req_data.get("amount", total_est)),
                currency=req_data.get("currency", "INR")
            )

        events = [
            AgentEventSchema(
                id=e.get("id", str(i)),
                timestamp=e.get("timestamp", "12:00"),
                event=e.get("event", ""),
                category=e.get("category", "system")
            )
            for i, e in enumerate(final_state.get("agent_events", []))
        ]

        steps = [
            StepProgressSchema(
                id=s.get("id", f"s-{i}"),
                label=s.get("label", ""),
                status=s.get("status", "complete"),
                active_description=s.get("active_description"),
                completed_description=s.get("completed_description")
            )
            for i, s in enumerate(final_state.get("step_progress", []))
        ]

        prov_sum = final_state.get("provider_summary", {
            "flights": {"provider": travel_src, "is_live": travel_live},
            "restaurants": {"provider": dining.get("source", "Voyage Demo Provider"), "is_live": dining.get("is_live", False)},
            "hotels": {"provider": hotel_src, "is_live": hotel_live},
            "activities": {"provider": activities.get("source", "Voyage Demo Provider"), "is_live": activities.get("is_live", False)},
            "transport": {"provider": transport.get("source", "Voyage Demo Provider"), "is_live": False},
            "any_live": travel_live or hotel_live or dining.get("is_live", False) or activities.get("is_live", False)
        })

        data_source_notice = "Live availability from external travel provider" if prov_sum.get("any_live") else "Prices shown from simulated external travel providers"

        return AgentRunResponse(
            thread_id=thread_id,
            status="completed" if not final_state.get("is_budget_exceeded") else "budget_warning",
            destination=final_state.get("destination", "Goa"),
            duration_days=final_state.get("duration", 4),
            budget=budget_val,
            currency=final_state.get("currency", "INR"),
            estimated_total=total_est,
            remaining_budget=remaining,
            breakdown=breakdown,
            reasons=final_state.get("reasons", []),
            itinerary=final_state.get("itinerary", []),
            agent_events=events,
            step_progress=steps,
            provider_summary=prov_sum,
            requires_approval=final_state.get("requires_approval", False),
            approval_request=approval_req,
            is_budget_exceeded=final_state.get("is_budget_exceeded", False),
            compromise_message=final_state.get("compromise_message"),
            data_source_notice=data_source_notice,
            optimization_attempts=final_state.get("optimization_attempts", 0),
            ai_mode=final_state.get("ai_mode", "demo"),
            error=final_state.get("error")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LangGraph Agent execution error: {str(e)}")

@router.get("/{thread_id}")
async def get_agent_state(thread_id: str):
    """
    Retrieves the current checkpointed graph state for a specific thread_id.
    """
    config = {"configurable": {"thread_id": thread_id}}
    state = voyage_agent_app.get_state(config)
    if not state or not state.values:
        raise HTTPException(status_code=404, detail="Thread state not found")
    return {
        "thread_id": thread_id,
        "values": state.values,
        "next": state.next
    }

@router.post("/{thread_id}/resume")
async def resume_agent(thread_id: str, approval: ResumeApprovalRequest):
    """
    Resumes an agent thread following human approval or adjustments.
    Does NOT execute real payments.
    """
    config = {"configurable": {"thread_id": thread_id}}
    state = voyage_agent_app.get_state(config)
    if not state or not state.values:
        raise HTTPException(status_code=404, detail="Thread state not found")
    
    return {
        "thread_id": thread_id,
        "resumed": True,
        "approval_action": approval.action,
        "approved": approval.approved,
        "status": "resumed_without_payment"
    }

@router.get("/health")
async def agent_health():
    """Health check returning mode, engine, and travel API mode"""
    has_key = is_llm_enabled()
    travel_mode = os.getenv("TRAVEL_API_MODE", "demo")
    return {
        "status": "healthy",
        "service": "Voyage LangGraph Agent Backend",
        "engine": "LangGraph + Google Gemini",
        "mode": "llm" if has_key else "demo",
        "travel_api_mode": travel_mode,
        "model": os.getenv("MODEL_NAME", "gemini-2.5-flash" if has_key else "deterministic-rules")
    }
