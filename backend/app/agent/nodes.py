import datetime
import uuid
from typing import Dict, Any, List
from app.agent.state import AgentState
from app.agent.llm import is_llm_enabled
from app.agent.prompts import (
    parse_request_deterministic,
    try_gemini_extract_intent,
    try_gemini_compare_options
)
from app.tools.travel_tools import (
    search_flights,
    search_hotels,
    search_restaurants,
    search_activities,
    search_transport
)
from app.tools.budget_tools import (
    calculate_total_cost,
    evaluate_budget_cushion,
    generate_optimized_options
)
from app.tools.payment_tools import prepare_human_approval_request

def _get_timestamp() -> str:
    return datetime.datetime.now().strftime("%H:%M")

def _add_event(events: List[Dict[str, Any]], event_text: str, category: str = "system") -> List[Dict[str, Any]]:
    new_event = {
        "id": f"evt-{uuid.uuid4().hex[:8]}",
        "timestamp": _get_timestamp(),
        "event": event_text,
        "category": category
    }
    return events + [new_event]

def parse_request_node(state: AgentState) -> Dict[str, Any]:
    prompt = state.get("request", "Plan a 4-day Goa trip under ₹40,000")
    
    ai_mode = "demo"
    parsed = None

    if is_llm_enabled():
        parsed = try_gemini_extract_intent(prompt)
        if parsed:
            ai_mode = "llm"
        else:
            ai_mode = "fallback"

    if not parsed:
        parsed = parse_request_deterministic(prompt)
        if not is_llm_enabled():
            ai_mode = "demo"

    event_label = "Gemini AI" if ai_mode == "llm" else ("Fallback parser" if ai_mode == "fallback" else "Demo Mode")
    events = _add_event(
        state.get("agent_events", []),
        f"Request understood ({event_label}): {parsed['duration_days']}-day {parsed['destination']} trip under ₹{int(parsed['budget']):,}",
        "system"
    )
    
    steps = [
        {"id": "step-1", "label": "Understanding request", "status": "complete", "completed_description": f"Identified {parsed['destination']} ({parsed['duration_days']} days, {parsed.get('travel_style', 'luxury')})"},
        {"id": "step-2", "label": "Checking travel preferences", "status": "active", "active_description": "Querying user profile & dining styles..."},
        {"id": "step-3", "label": "Searching external travel services", "status": "waiting"},
        {"id": "step-4", "label": "Comparing options", "status": "waiting"},
        {"id": "step-5", "label": "Checking trip budget", "status": "waiting"},
        {"id": "step-6", "label": "Preparing recommendation", "status": "waiting"},
    ]

    return {
        "destination": parsed["destination"],
        "origin": parsed.get("origin", "Mumbai"),
        "duration": parsed["duration_days"],
        "budget": parsed["budget"],
        "currency": parsed.get("currency", "INR"),
        "travel_style": parsed.get("travel_style", "luxury boutique"),
        "interests": parsed.get("interests", ["beaches", "cafés"]),
        "agent_events": events,
        "step_progress": steps,
        "optimization_attempts": 0,
        "is_budget_exceeded": False,
        "ai_mode": ai_mode
    }

def load_preferences_node(state: AgentState) -> Dict[str, Any]:
    travel_style = state.get("travel_style", "Luxury boutique")
    interests = state.get("interests", ["beaches", "cafés", "nightlife"])

    mock_prefs = {
        "travel_style": travel_style,
        "interests": interests,
        "food_preferences": ["local coastal cuisine", "curated wine pairing"],
        "budget_style": "Moderate"
    }

    events = _add_event(
        state["agent_events"],
        f"Travel preferences loaded: {travel_style}, interests in {', '.join(interests)}",
        "system"
    )

    steps = list(state.get("step_progress", []))
    if len(steps) >= 2:
        steps[1]["status"] = "complete"
        steps[1]["completed_description"] = f"Profile loaded: {travel_style} & {', '.join(interests[:2])}"
    if len(steps) >= 3:
        steps[2]["status"] = "active"
        steps[2]["active_description"] = "Querying partner GDS and aggregator networks..."

    return {
        "preferences": mock_prefs,
        "agent_events": events,
        "step_progress": steps
    }

def search_travel_node(state: AgentState) -> Dict[str, Any]:
    destination = state.get("destination", "Goa")
    duration = state.get("duration", 4)
    origin = state.get("origin", "Mumbai")

    # Modular independent tool calls
    flights = [search_flights(destination=destination, origin=origin)]
    hotels = search_hotels(destination=destination, duration_days=duration)
    restaurants = search_restaurants(destination=destination, duration_days=duration)
    activities = search_activities(destination=destination, duration_days=duration)
    transport = search_transport(destination=destination, duration_days=duration)

    events = state["agent_events"]
    events = _add_event(events, f"Hotel search: Found '{hotels[0]['name']}' (₹{int(hotels[0]['total_cost']):,})", "tool")
    events = _add_event(events, f"Flight search: Found '{flights[0]['airline']}' (₹{int(flights[0]['price']):,})", "tool")
    events = _add_event(events, f"Activity search: Found {len(activities['items'])} experiences (₹{int(activities['total_estimated']):,})", "tool")

    steps = list(state.get("step_progress", []))
    if len(steps) >= 3:
        steps[2]["status"] = "complete"
        steps[2]["completed_description"] = "Found verified partner options across 5 categories"
    if len(steps) >= 4:
        steps[3]["status"] = "active"
        steps[3]["active_description"] = "Evaluating options against preferences..."

    return {
        "flight_options": flights,
        "hotel_options": hotels,
        "restaurant_options": restaurants,
        "activity_options": activities,
        "transport_options": transport,
        "agent_events": events,
        "step_progress": steps
    }

def compare_options_node(state: AgentState) -> Dict[str, Any]:
    destination = state.get("destination", "Goa")
    hotel_options = state["hotel_options"]
    flight_options = state["flight_options"]
    activity_options = state["activity_options"]
    ai_mode = state.get("ai_mode", "demo")

    # Default selection
    selected_hotel = hotel_options[0]
    selected_flight = flight_options[0]
    selected_restaurants = state["restaurant_options"]
    selected_activities = activity_options
    selected_transport = state["transport_options"]

    reasons = [
        f"Matches your preference for {', '.join(state.get('interests', ['beaches', 'cafés']))} in {destination}",
        f"Top-rated boutique stay ({selected_hotel.get('rating', 4.8)}★) with verified amenities",
        "Direct flights aligned with standard hotel check-in times"
    ]

    # If Gemini is active, let Gemini evaluate and recommend reasons
    if ai_mode == "llm":
        gemini_eval = try_gemini_compare_options(
            destination=destination,
            user_style=state.get("travel_style", "luxury boutique"),
            interests=state.get("interests", ["beaches", "cafés"]),
            budget=float(state.get("budget", 40000.0)),
            hotel_options=hotel_options,
            flight_options=flight_options,
            activity_options=activity_options
        )
        if gemini_eval and gemini_eval.get("reasons"):
            reasons = gemini_eval["reasons"][:3]
            # Match hotel ID from tool results
            for h in hotel_options:
                if h["id"] == gemini_eval.get("recommended_hotel_id"):
                    selected_hotel = h
                    break

    eval_label = "Gemini reasoning" if ai_mode == "llm" else "Preference filter"
    events = _add_event(
        state["agent_events"],
        f"Option comparison ({eval_label}): Selected '{selected_hotel['name']}' & verified flight schedule",
        "tool"
    )

    steps = list(state.get("step_progress", []))
    if len(steps) >= 4:
        steps[3]["status"] = "complete"
        steps[3]["completed_description"] = "Selected top-rated compatible inventory"
    if len(steps) >= 5:
        steps[4]["status"] = "active"
        steps[4]["active_description"] = "Simulating total envelope against budget ceiling..."

    return {
        "selected_hotel": selected_hotel,
        "selected_flight": selected_flight,
        "selected_restaurants": selected_restaurants,
        "selected_activities": selected_activities,
        "selected_transport": selected_transport,
        "reasons": reasons,
        "agent_events": events,
        "step_progress": steps
    }

def check_budget_node(state: AgentState) -> Dict[str, Any]:
    # Financial calculation MUST remain strictly deterministic in Python
    hotel_cost = float(state["selected_hotel"]["total_cost"])
    flight_cost = float(state["selected_flight"]["price"])
    dining_cost = float(state["selected_restaurants"]["total_estimated"])
    activities_cost = float(state["selected_activities"]["total_estimated"])
    transport_cost = float(state["selected_transport"]["total_estimated"])
    
    budget = float(state.get("budget", 40000.0))

    total = calculate_total_cost(
        flight_cost=flight_cost,
        hotel_cost=hotel_cost,
        dining_cost=dining_cost,
        activities_cost=activities_cost,
        transport_cost=transport_cost
    )

    is_within, diff = evaluate_budget_cushion(total, budget)
    attempts = state.get("optimization_attempts", 0)

    events = state["agent_events"]
    if is_within:
        events = _add_event(
            events,
            f"Budget verified: ₹{int(total):,} fits within ₹{int(budget):,} ceiling (cushion: ₹{int(diff):,})",
            "budget"
        )
        steps = list(state.get("step_progress", []))
        if len(steps) >= 5:
            steps[4]["status"] = "complete"
            steps[4]["completed_description"] = f"Budget verified with ₹{int(diff):,} buffer"
        if len(steps) >= 6:
            steps[5]["status"] = "active"
            steps[5]["active_description"] = "Assembling complete day-by-day plan..."

        return {
            "estimated_total": total,
            "remaining_budget": diff,
            "is_budget_exceeded": False,
            "agent_events": events,
            "step_progress": steps
        }
    else:
        events = _add_event(
            events,
            f"Budget check: Estimated ₹{int(total):,} exceeds target ceiling ₹{int(budget):,} (overage: ₹{int(abs(diff)):,})",
            "budget"
        )
        return {
            "estimated_total": total,
            "remaining_budget": 0.0,
            "is_budget_exceeded": True,
            "agent_events": events,
            "optimization_attempts": attempts + 1
        }

def optimize_budget_node(state: AgentState) -> Dict[str, Any]:
    destination = state.get("destination", "Goa")
    attempts = state.get("optimization_attempts", 1)

    optimized = generate_optimized_options(
        destination=destination,
        attempt=attempts,
        current_hotel=state["selected_hotel"],
        current_dining=state["selected_restaurants"],
        current_activities=state["selected_activities"],
        current_transport=state["selected_transport"]
    )

    events = _add_event(
        state["agent_events"],
        f"Optimization attempt {attempts}/3: {optimized['change_description']}",
        "budget"
    )

    return {
        "selected_hotel": optimized["hotel"],
        "selected_restaurants": optimized["dining"],
        "selected_activities": optimized["activities"],
        "selected_transport": optimized["transport"],
        "agent_events": events
    }

def build_itinerary_node(state: AgentState) -> Dict[str, Any]:
    hotel = state["selected_hotel"]
    hotel_cost = float(hotel["total_cost"])

    # Structured 4-day plan with known tool costs
    itinerary = [
        {
            "day": 1,
            "day_title": "Arrival & Morjim Coastal Sunset",
            "items": [
                {"id": "d1-1", "day": 1, "time": "10:30 AM", "title": "Arrival at Manohar Intl Airport & Private EV Transfer", "category": "transport", "location": "GOX ⇄ Morjim", "estimated_cost": 1100.0, "booking_required": True},
                {"id": "d1-2", "day": 1, "time": "01:30 PM", "title": f"Check-in at {hotel['name']}", "category": "hotel", "location": hotel.get("location", "North Goa"), "estimated_cost": round(hotel_cost / 3, 2), "booking_required": True},
                {"id": "d1-3", "day": 1, "time": "05:30 PM", "title": "Beach sunset & Mandovi River Catamaran cruise", "category": "activity", "location": "Morjim Beach", "estimated_cost": 2500.0, "booking_required": True},
                {"id": "d1-4", "day": 1, "time": "08:00 PM", "title": "Welcome Coastal Tasting at Cavatina", "category": "dining", "location": "Benaulim", "estimated_cost": 2400.0, "booking_required": False}
            ]
        },
        {
            "day": 2,
            "day_title": "Old Goa Heritage, Art & Nightlife",
            "items": [
                {"id": "d2-1", "day": 2, "time": "09:00 AM", "title": "Artisanal Breakfast at Resort Terrace", "category": "dining", "location": hotel['name'], "estimated_cost": 800.0, "booking_required": False},
                {"id": "d2-2", "day": 2, "time": "10:30 AM", "title": "Fontainhas Latin Quarter Walking Tour", "category": "activity", "location": "Panjim Heritage Zone", "estimated_cost": 1200.0, "booking_required": True},
                {"id": "d2-3", "day": 2, "time": "01:30 PM", "title": "Heritage Lunch & Artisanal Kokum Kitchen", "category": "dining", "location": "Assagao Garden", "estimated_cost": 1200.0, "booking_required": False},
                {"id": "d2-4", "day": 2, "time": "08:30 PM", "title": "Curated Beach Bar Sundowner & Nightlife", "category": "dining", "location": "Vagator Cliff", "estimated_cost": 1000.0, "booking_required": False}
            ]
        },
        {
            "day": 3,
            "day_title": "Island Water Sports & Chef Tasting",
            "items": [
                {"id": "d3-1", "day": 3, "time": "09:30 AM", "title": "Backwaters Sea Kayaking & Snorkeling", "category": "activity", "location": "Grand Island Coast", "estimated_cost": 2000.0, "booking_required": True},
                {"id": "d3-2", "day": 3, "time": "01:30 PM", "title": "Casual Fisherman Seafood Lunch", "category": "dining", "location": "Anjuna Beach", "estimated_cost": 800.0, "booking_required": False},
                {"id": "d3-3", "day": 3, "time": "05:00 PM", "title": "Local Spice Trail & Plantation Excursion", "category": "activity", "location": "Ponda Rainforest", "estimated_cost": 800.0, "booking_required": True},
                {"id": "d3-4", "day": 3, "time": "08:00 PM", "title": "Signature Assagao Villa Dinner at Jamun", "category": "dining", "location": "Assagao", "estimated_cost": 2000.0, "booking_required": True}
            ]
        },
        {
            "day": 4,
            "day_title": "Brunch, Artisanal Souvenirs & Departure",
            "items": [
                {"id": "d4-1", "day": 4, "time": "10:00 AM", "title": "Leisurely Organic Brunch & Poolside Relaxation", "category": "dining", "location": hotel['name'], "estimated_cost": 800.0, "booking_required": False},
                {"id": "d4-2", "day": 4, "time": "12:00 PM", "title": "Fontainhas Boutique & Spices Shopping", "category": "activity", "location": "Panjim Central", "estimated_cost": 0.0, "booking_required": False},
                {"id": "d4-3", "day": 4, "time": "03:30 PM", "title": "Executive EV Airport Transfer to GOX", "category": "transport", "location": "Resort ⇄ GOX Airport", "estimated_cost": 1100.0, "booking_required": True},
                {"id": "d4-4", "day": 4, "time": "06:00 PM", "title": "Return Flight to Destination", "category": "travel", "location": "IndiGo / Vistara Premier Flight", "estimated_cost": 8000.0, "booking_required": True}
            ]
        }
    ]

    return {
        "itinerary": itinerary
    }

def prepare_recommendation_node(state: AgentState) -> Dict[str, Any]:
    budget = float(state.get("budget", 40000.0))
    total = float(state.get("estimated_total", 37800.0))
    is_exceeded = state.get("is_budget_exceeded", False)
    hotel = state["selected_hotel"]
    destination = state.get("destination", "Goa")
    ai_mode = state.get("ai_mode", "demo")

    if is_exceeded:
        reasons = [
            f"Standard estimated cost is ₹{int(total):,}",
            f"Exceeds requested ceiling of ₹{int(budget):,} by ₹{int(total - budget):,}",
            "Consider increasing budget or adjusting to fewer activities"
        ]
        compromise_msg = f"Your ₹{int(budget):,} budget is unlikely to cover this 4-day itinerary with flights and accommodation. I found a baseline plan for ₹{int(total):,}, or we can reduce the number of activities."
    else:
        reasons = state.get("reasons", [
            f"Within your ₹{int(budget):,} budget",
            f"Leaves ₹{int(budget - total):,} buffer",
            f"Matches your preference for beaches and cafés"
        ])
        compromise_msg = None

    # Prepare explicit human approval request payload (prepared, not executed)
    approval_req = prepare_human_approval_request(
        action="BUILD_VOYAGE_TRIP",
        item_title=f"{destination} 4-Day Trip Package ({hotel['name']})",
        amount=total,
        currency=state.get("currency", "INR")
    )

    mode_text = "Gemini LLM" if ai_mode == "llm" else ("Fallback Mode" if ai_mode == "fallback" else "Demo Mode")
    events = _add_event(
        state["agent_events"],
        f"Recommendation synthesized ({mode_text}) and ready for user review",
        "complete"
    )

    steps = list(state.get("step_progress", []))
    if len(steps) >= 6:
        steps[5]["status"] = "complete"
        steps[5]["completed_description"] = f"Recommendation ready ({mode_text})"

    return {
        "reasons": reasons,
        "compromise_message": compromise_msg,
        "requires_approval": False,
        "approval_request": approval_req,
        "payment_status": "unpaid",
        "agent_events": events,
        "step_progress": steps
    }
