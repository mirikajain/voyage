import datetime
import uuid
from typing import Dict, Any, List, Optional
from app.agent.state import AgentState
from app.agent.llm import is_llm_enabled
from app.agent.prompts import (
    parse_request_deterministic,
    try_gemini_extract_intent,
    try_gemini_compare_options
)
from app.services.travel_service import TravelService
from app.services.payment_service import PaymentService
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
from app.tools.payment_tools import (
    spend_guardrail_check,
    prepare_human_approval_request,
    create_razorpay_order
)

def _safe_log(msg: str):
    try:
        print(msg)
    except Exception:
        try:
            print(msg.encode("ascii", errors="replace").decode("ascii"))
        except Exception:
            pass

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
    prompt = state.get("request") or state.get("message") or ""
    thread_id = state.get("thread_id") or "thread_default"
    
    ai_mode = "demo"
    parsed = None

    if is_llm_enabled():
        parsed = try_gemini_extract_intent(prompt)
        if parsed and (parsed.get("destination") or parsed.get("intent") in ["hotel_search", "flight_search", "restaurant_search", "activity_search", "transport_search", "budget_adjustment", "follow_up"] or parsed.get("duration_days") or parsed.get("budget")):
            ai_mode = "llm"
        else:
            ai_mode = "fallback"

    # Deterministic parser extraction & backfill
    det_parsed = parse_request_deterministic(prompt)
    if not parsed:
        parsed = det_parsed
        if not is_llm_enabled():
            ai_mode = "demo"
    else:
        # Backfill any missing fields that deterministic parser detected
        for k in ["budget", "total_budget", "total_budget_update", "hotel_budget", "flight_budget", "transport_budget", "dining_budget", "activity_budget", "duration_days", "destination", "origin", "departure_date", "return_date", "travelers", "budget_updates"]:
            if not parsed.get(k) and det_parsed.get(k):
                parsed[k] = det_parsed[k]
        # If Gemini gave generic trip_planning but deterministic parser identified specific search or budget adjustment, prioritize specific intent
        if parsed.get("intent") == "trip_planning" and det_parsed.get("intent") in ["hotel_search", "flight_search", "restaurant_search", "activity_search", "transport_search", "budget_adjustment", "follow_up"]:
            parsed["intent"] = det_parsed["intent"]

    raw_intent = parsed.get("intent", "trip_planning")
    old_dest = state.get("destination")
    old_orig = state.get("origin")
    old_duration = state.get("duration") or state.get("duration_days")
    old_dep_date = state.get("departure_date")
    old_ret_date = state.get("return_date")
    old_budget = state.get("budget")
    old_travelers = state.get("travelers")
    old_envelopes = dict(state.get("budget_envelopes") or {})
    old_category_status = dict(state.get("category_status") or {})

    has_existing_trip = bool(old_dest or old_orig or old_budget or old_duration)
    
    # Check if user is starting an explicit brand-new trip with a new destination
    is_explicit_new_destination = False
    if old_dest and parsed.get("destination"):
        if parsed["destination"].strip().lower() != old_dest.strip().lower() and ("plan" in prompt.lower() or "trip to" in prompt.lower()):
            is_explicit_new_destination = True

    # INTENT RESOLUTION:
    # 1. Dedicated Search intents (hotel_search, flight_search, restaurant_search, activity_search, transport_search) ALWAYS stay search intents!
    if raw_intent in ["hotel_search", "flight_search", "restaurant_search", "activity_search", "transport_search"]:
        intent = raw_intent
    # 2. Budget adjustments
    elif raw_intent == "budget_adjustment":
        intent = "budget_adjustment"
    # 3. Follow-up modification
    elif raw_intent == "follow_up":
        intent = "follow_up"
    # 4. Trip planning
    elif raw_intent == "trip_planning":
        if has_existing_trip and not is_explicit_new_destination and (not parsed.get("destination") or parsed.get("destination").lower() == (old_dest or "").lower()) and not ("plan" in prompt.lower() or "trip" in prompt.lower() or "new" in prompt.lower()):
            intent = "follow_up"
        else:
            intent = "trip_planning"
    else:
        intent = raw_intent

    # Entity merging across turns
    dest = parsed.get("destination") or (old_dest if not is_explicit_new_destination else None)
    orig = parsed.get("origin") or (old_orig if not is_explicit_new_destination else None)
    
    if parsed.get("duration_days") and int(parsed["duration_days"]) > 0:
        duration = int(parsed["duration_days"])
    elif not is_explicit_new_destination and old_duration:
        duration = int(old_duration)
    else:
        duration = None

    if parsed.get("departure_date"):
        dep_date = parsed["departure_date"]
        ret_date = parsed.get("return_date")
    elif not is_explicit_new_destination and old_dep_date:
        dep_date = old_dep_date
        ret_date = old_ret_date
    else:
        dep_date = None
        ret_date = None

    # Total budget merge logic (preserves existing budget; does not overwrite with None/0 or category budgets)
    total_budget_update = parsed.get("total_budget_update")
    if total_budget_update is not None and float(total_budget_update) > 0:
        current_budget = float(total_budget_update)
    elif raw_intent == "trip_planning" and parsed.get("budget") is not None and float(parsed["budget"]) > 0:
        current_budget = float(parsed["budget"])
    elif not is_explicit_new_destination and old_budget is not None and float(old_budget) > 0:
        current_budget = float(old_budget)
    else:
        current_budget = None

    travelers = parsed.get("travelers") or (old_travelers if not is_explicit_new_destination else None)

    # Category budget updates
    parsed_budget_updates = parsed.get("budget_updates") or {}
    if hasattr(parsed_budget_updates, "model_dump"):
        parsed_budget_updates = parsed_budget_updates.model_dump()
    budget_updates = {k: float(v) for k, v in parsed_budget_updates.items() if v is not None and float(v) > 0}
    is_cheaper = parsed.get("is_cheaper_request", False)
    cheaper_cat = parsed.get("cheaper_category")

    budget_envelopes = dict(old_envelopes) if not is_explicit_new_destination else {}
    category_status = dict(old_category_status) if not is_explicit_new_destination else {}
    for cat, val in budget_updates.items():
        budget_envelopes[cat] = float(val)
        category_status[cat] = "Budget updated"

    # Specific category budgets directly parsed
    if parsed.get("hotel_budget") and float(parsed["hotel_budget"]) > 0:
        budget_envelopes["hotel"] = float(parsed["hotel_budget"])
        category_status["hotel"] = "Budget updated"
    if parsed.get("flight_budget") and float(parsed["flight_budget"]) > 0:
        budget_envelopes["flights"] = float(parsed["flight_budget"])
        category_status["flights"] = "Budget updated"
    if parsed.get("dining_budget") and float(parsed["dining_budget"]) > 0:
        budget_envelopes["dining"] = float(parsed["dining_budget"])
        category_status["dining"] = "Budget updated"
    if parsed.get("activity_budget") and float(parsed["activity_budget"]) > 0:
        budget_envelopes["activities"] = float(parsed["activity_budget"])
        category_status["activities"] = "Budget updated"
    if parsed.get("transport_budget") and float(parsed["transport_budget"]) > 0:
        budget_envelopes["transport"] = float(parsed["transport_budget"])
        category_status["transport"] = "Budget updated"

    # Preserved user category budget targets across turns
    old_hotel_budget = state.get("hotel_budget")
    old_flight_budget = state.get("flight_budget")
    old_dining_budget = state.get("dining_budget")
    old_activity_budget = state.get("activity_budget")
    old_transport_budget = state.get("transport_budget")

    if not is_explicit_new_destination:
        hotel_budget = float(parsed["hotel_budget"]) if parsed.get("hotel_budget") else (float(budget_updates["hotel"]) if "hotel" in budget_updates else old_hotel_budget)
        flight_budget = float(parsed["flight_budget"]) if parsed.get("flight_budget") else (float(budget_updates["flights"]) if "flights" in budget_updates else old_flight_budget)
        dining_budget = float(parsed["dining_budget"]) if parsed.get("dining_budget") else (float(budget_updates["dining"]) if "dining" in budget_updates else old_dining_budget)
        activity_budget = float(parsed["activity_budget"]) if parsed.get("activity_budget") else (float(budget_updates["activities"]) if "activities" in budget_updates else old_activity_budget)
        transport_budget = float(parsed["transport_budget"]) if parsed.get("transport_budget") else (float(budget_updates["transport"]) if "transport" in budget_updates else old_transport_budget)
    else:
        hotel_budget = float(parsed["hotel_budget"]) if parsed.get("hotel_budget") else (float(budget_updates["hotel"]) if "hotel" in budget_updates else None)
        flight_budget = float(parsed["flight_budget"]) if parsed.get("flight_budget") else (float(budget_updates["flights"]) if "flights" in budget_updates else None)
        dining_budget = float(parsed["dining_budget"]) if parsed.get("dining_budget") else (float(budget_updates["dining"]) if "dining" in budget_updates else None)
        activity_budget = float(parsed["activity_budget"]) if parsed.get("activity_budget") else (float(budget_updates["activities"]) if "activities" in budget_updates else None)
        transport_budget = float(parsed["transport_budget"]) if parsed.get("transport_budget") else (float(budget_updates["transport"]) if "transport" in budget_updates else None)

    # Trace logging showing state flow
    _safe_log("=" * 60)
    _safe_log(f"INTENT: {intent}")
    _safe_log(f"DESTINATION: {dest}")
    _safe_log(f"ORIGIN: {orig}")
    _safe_log(f"DATES: {dep_date} -> {ret_date}")
    _safe_log(f"DURATION: {duration}")
    _safe_log(f"TOTAL_BUDGET: {current_budget}")
    _safe_log(f"HOTEL_BUDGET: {hotel_budget}")
    _safe_log(f"FLIGHT_BUDGET: {flight_budget}")
    _safe_log(f"THREAD_ID: {thread_id}")
    _safe_log("=" * 60)

    events = state.get("agent_events", [])
    event_label = "Gemini AI" if ai_mode == "llm" else ("Fallback parser" if ai_mode == "fallback" else "Deterministic Parser")
    
    if intent in ["budget_adjustment", "follow_up"]:
        if parsed.get("duration_days") and parsed["duration_days"] != old_duration:
            event_text = f"Follow-up: Adjusted trip duration to {duration} days"
        elif total_budget_update:
            event_text = f"Follow-up: Updated total trip budget to ₹{int(current_budget):,}"
        elif budget_updates:
            cat_desc = ', '.join([f"{k} (₹{int(v):,})" for k, v in budget_updates.items()])
            event_text = f"Follow-up: Updated budget envelopes for {cat_desc}"
        elif parsed.get("origin") and parsed["origin"] != old_orig:
            event_text = f"Follow-up: Updated origin departure city to {orig}"
        elif parsed.get("destination") and parsed["destination"] != old_dest:
            event_text = f"Follow-up: Updated destination to {dest}"
        else:
            event_text = f"Follow-up: Received trip details ({prompt})"
    elif intent in ["hotel_search", "flight_search", "restaurant_search", "activity_search", "transport_search"]:
        event_text = f"Searching {intent.replace('_', ' ').title()} for {dest or 'your destination'}"
    else:
        event_text = f"Request understood ({event_label}): {intent.replace('_', ' ').title()}"

    events = _add_event(events, event_text, "system")

    steps = [
        {"id": "step-1", "label": "Understanding request", "status": "complete", "completed_description": event_text},
        {"id": "step-2", "label": "Executing search & validation", "status": "active", "active_description": "Validating travel parameters..."}
    ]

    duration_changed = False
    if parsed.get("duration_days") and old_duration and int(parsed["duration_days"]) != int(old_duration):
        duration_changed = True

    category_updated_this_turn = parsed.get("category_updated_this_turn")

    return {
        "thread_id": thread_id,
        "intent": intent,
        "destination": dest,
        "origin": orig,
        "duration": duration,
        "duration_days": duration,
        "duration_changed": duration_changed,
        "category_updated_this_turn": category_updated_this_turn,
        "departure_date": dep_date,
        "return_date": ret_date,
        "budget": current_budget,
        "total_budget_update": total_budget_update,
        "travelers": travelers,
        "budget_envelopes": budget_envelopes,
        "budget_updates": budget_updates if budget_updates else None,
        "hotel_budget": hotel_budget,
        "flight_budget": flight_budget,
        "transport_budget": transport_budget,
        "dining_budget": dining_budget,
        "activity_budget": activity_budget,
        "is_cheaper_request": is_cheaper,
        "cheaper_category": cheaper_cat,
        "category_status": category_status,
        "currency": parsed.get("currency", "INR"),
        "travel_style": parsed.get("travel_style", "luxury boutique"),
        "interests": parsed.get("interests", ["heritage", "cafés"]),
        "agent_events": events,
        "step_progress": steps,
        "optimization_attempts": 0,
        "is_budget_exceeded": False,
        "payment_status": "not_started",
        "requires_approval": False,
        "ai_mode": ai_mode
    }

def collect_details_node(state: AgentState) -> Dict[str, Any]:
    """
    Evaluates whether all essential travel details exist.
    If core destination/duration/budget is missing for trip planning, pauses for clarification.
    For search queries (e.g. hotel_search), performs search directly once destination is known.
    """
    intent = state.get("intent", "trip_planning")
    dest = state.get("destination")
    orig = state.get("origin")
    dep_date = state.get("departure_date")
    ret_date = state.get("return_date")
    dur = state.get("duration") or state.get("duration_days")
    budget = state.get("budget")
    travelers = state.get("travelers")
    events = state.get("agent_events", [])

    missing = []
    question = None

    if intent == "trip_planning":
        # Check if destination is completely missing
        if not dest:
            missing.append("destination")
            question = "Where would you like to travel?"
        # Check if both duration and budget are missing (e.g. "Plan a trip to Paris")
        elif not dur and not dep_date and budget is None:
            missing.append("duration_days")
            missing.append("budget")
            question = f"I'd love to help you plan a trip to {dest}! How many days are you planning to stay and what's your approximate budget?"

        if missing:
            events = _add_event(events, f"Clarification requested: {question}", "system")
            step_progress = [
                {"id": "step-1", "label": "Collecting trip details", "status": "active", "active_description": question}
            ]

            return {
                "status": "needs_input",
                "missing_fields": missing,
                "question": question,
                "needs_clarification": True,
                "agent_events": events,
                "step_progress": step_progress
            }

        effective_orig = orig or "Mumbai"
        effective_dur = dur or 4
        effective_dep_date = dep_date or "2026-09-14"
        effective_ret_date = ret_date or (
            (datetime.date(2026, 9, 14) + datetime.timedelta(days=effective_dur)).strftime("%Y-%m-%d")
        )

        return {
            "origin": effective_orig,
            "duration": effective_dur,
            "duration_days": effective_dur,
            "departure_date": effective_dep_date,
            "return_date": effective_ret_date,
            "status": "in_progress",
            "missing_fields": [],
            "question": None,
            "needs_clarification": False
        }

    elif intent == "flight_search":
        if not dest:
            missing.append("destination")
        if not orig:
            missing.append("origin")

        if missing:
            if "destination" in missing and "origin" in missing:
                question = "Where would you like to fly from and to?"
            elif "origin" in missing:
                question = f"Where will you be departing from for your flight to {dest}?"
            elif "destination" in missing:
                question = "Where would you like to fly to?"
            
            events = _add_event(events, f"Clarification requested: {question}", "system")
            step_progress = [
                {"id": "step-1", "label": "Collecting flight details", "status": "active", "active_description": question}
            ]

            return {
                "status": "needs_input",
                "missing_fields": missing,
                "question": question,
                "needs_clarification": True,
                "agent_events": events,
                "step_progress": step_progress
            }

        return {
            "departure_date": dep_date,
            "status": "in_progress",
            "missing_fields": [],
            "question": None,
            "needs_clarification": False
        }

    elif intent == "hotel_search":
        if not dest:
            missing.append("destination")
            question = "In which city or destination are you looking for hotels?"

            events = _add_event(events, f"Clarification requested: {question}", "system")
            step_progress = [
                {"id": "step-1", "label": "Collecting hotel details", "status": "active", "active_description": question}
            ]

            return {
                "status": "needs_input",
                "missing_fields": missing,
                "question": question,
                "needs_clarification": True,
                "agent_events": events,
                "step_progress": step_progress
            }

        effective_dur = dur or 4
        return {
            "duration": effective_dur,
            "duration_days": effective_dur,
            "departure_date": dep_date,
            "return_date": ret_date,
            "status": "in_progress",
            "missing_fields": [],
            "question": None,
            "needs_clarification": False
        }

    elif intent in ["restaurant_search", "activity_search", "transport_search"]:
        if not dest:
            missing.append("destination")
            question = f"In which destination are you looking for {intent.split('_')[0]} options?"
            events = _add_event(events, f"Clarification requested: {question}", "system")
            step_progress = [
                {"id": "step-1", "label": "Collecting search details", "status": "active", "active_description": question}
            ]
            return {
                "status": "needs_input",
                "missing_fields": missing,
                "question": question,
                "needs_clarification": True,
                "agent_events": events,
                "step_progress": step_progress
            }

        return {
            "status": "in_progress",
            "missing_fields": [],
            "question": None,
            "needs_clarification": False
        }

    # Budget adjustments or follow-ups
    return {
        "status": "in_progress",
        "missing_fields": [],
        "question": None,
        "needs_clarification": False
    }

def route_after_collect_details(state: AgentState) -> str:
    """
    Conditional edge after collect_details.
    If missing required information, routes to END (pausing turn for user clarification).
    Otherwise routes by intent to provider search or budget nodes.
    """
    if state.get("status") == "needs_input" or state.get("missing_fields"):
        return "needs_input"
    
    intent = state.get("intent", "trip_planning")
    if intent in ["hotel_search", "flight_search", "restaurant_search", "activity_search", "transport_search"]:
        return intent
    
    if intent in ["budget_adjustment", "follow_up"]:
        # If duration changed, always recalculate full trip options and stay costs for the new duration
        if state.get("duration_changed", False):
            return "recalculate_trip"

        cat_this_turn = state.get("category_updated_this_turn")
        budget_updates = state.get("budget_updates") or {}
        cheaper_cat = state.get("cheaper_category")

        if cat_this_turn == "activities" or budget_updates.get("activities") or cheaper_cat == "activities":
            return "update_activities"
        if cat_this_turn == "hotel" or budget_updates.get("hotel") or cheaper_cat == "hotel":
            return "update_hotel"
        if cat_this_turn == "flights" or budget_updates.get("flights") or cheaper_cat == "flights":
            return "update_flights"
        if cat_this_turn == "dining" or budget_updates.get("dining") or cheaper_cat == "dining":
            return "update_dining"
        if cat_this_turn == "transport" or budget_updates.get("transport") or cheaper_cat == "transport":
            return "update_transport"
            
        return "recalculate_trip"

    return "trip_planning"

def route_intent(state: AgentState) -> str:
    """Alias for backwards compatibility."""
    return route_after_collect_details(state)

# -------------------------------------------------------------
# SPECIFIC SEARCH NODES (No Itinerary / No Budget Check)
# -------------------------------------------------------------

def search_flights_node(state: AgentState) -> Dict[str, Any]:
    dest = state.get("destination", "Mumbai")
    orig = state.get("origin", "Delhi")
    dep_date = state.get("departure_date")

    flights = TravelService.search_flights(
        destination=dest,
        origin=orig,
        departure_date=dep_date
    )

    flight_live = bool(flights and flights[0].is_live)
    prov = flights[0].source if flights else "Voyage Demo Provider"

    search_results = {
        "type": "flights",
        "query_title": f"Flights: {orig} ➔ {dest}",
        "items": [f.model_dump() for f in flights],
        "total_count": len(flights),
        "provider": prov,
        "is_live": flight_live
    }

    events = _add_event(
        state.get("agent_events", []),
        f"Found {len(flights)} flight options from {orig} to {dest} via {prov}",
        "tool"
    )

    steps = list(state.get("step_progress", []))
    if len(steps) >= 2:
        steps[1]["status"] = "complete"
        steps[1]["completed_description"] = f"Retrieved {len(flights)} routes via {prov}"
    if len(steps) >= 3:
        steps[2]["status"] = "active"
        steps[2]["active_description"] = "Synthesizing schedule & fares..."

    return {
        "search_results": search_results,
        "agent_events": events,
        "step_progress": steps
    }

def search_hotels_node(state: AgentState) -> Dict[str, Any]:
    dest = state.get("destination", "Goa")
    duration = state.get("duration", 4)
    hotel_budget = state.get("hotel_budget") or (state.get("budget_envelopes") or {}).get("hotel")

    hotels = TravelService.search_hotels(destination=dest, duration_days=duration)
    
    # If hotel budget is specified (e.g. "Show hotels in Goa under ₹5,000"), prioritize matching options
    if hotel_budget:
        budget_matching = [h for h in hotels if float(h.total_price or h.cost_per_night or 999999) <= hotel_budget]
        if budget_matching:
            hotels = budget_matching

    hotel_live = bool(hotels and hotels[0].is_live)
    prov = hotels[0].source if hotels else "Voyage Demo Provider"

    query_title = f"Hotels & Stays in {dest}"
    if hotel_budget:
        query_title += f" (Budget: ₹{int(hotel_budget):,})"

    search_results = {
        "type": "hotels",
        "query_title": query_title,
        "items": [h.model_dump() for h in hotels],
        "total_count": len(hotels),
        "provider": prov,
        "is_live": hotel_live
    }

    events = _add_event(
        state.get("agent_events", []),
        f"Found {len(hotels)} boutique stays in {dest} via {prov}",
        "tool"
    )

    steps = list(state.get("step_progress", []))
    if len(steps) >= 2:
        steps[1]["status"] = "complete"
        steps[1]["completed_description"] = f"Retrieved {len(hotels)} stays in {dest}"

    return {
        "search_results": search_results,
        "status": "completed",
        "agent_events": events,
        "step_progress": steps
    }

def search_restaurants_node(state: AgentState) -> Dict[str, Any]:
    dest = state.get("destination", "Paris")
    duration = state.get("duration", 4)

    res_data = TravelService.search_restaurants(destination=dest, duration_days=duration)
    if isinstance(res_data, dict):
        items = res_data.get("items", [])
        dining_live = bool(res_data.get("is_live", False))
        prov = res_data.get("source", "Voyage Demo Provider")
    elif isinstance(res_data, list):
        items = [r.model_dump() if hasattr(r, "model_dump") else r for r in res_data]
        dining_live = bool(res_data and getattr(res_data[0], "is_live", False))
        prov = getattr(res_data[0], "source", "Voyage Demo Provider") if res_data else "Voyage Demo Provider"
    else:
        items = []
        dining_live = False
        prov = "Voyage Demo Provider"

    search_results = {
        "type": "restaurants",
        "query_title": f"Dining & Gastronomy in {dest}",
        "items": items,
        "total_count": len(items),
        "provider": prov,
        "is_live": dining_live
    }

    events = _add_event(
        state.get("agent_events", []),
        f"Found {len(items)} dining venues in {dest} via {prov}",
        "tool"
    )

    steps = list(state.get("step_progress", []))
    if len(steps) >= 2:
        steps[1]["status"] = "complete"
        steps[1]["completed_description"] = f"Retrieved {len(items)} restaurants via {prov}"

    return {
        "search_results": search_results,
        "status": "completed",
        "agent_events": events,
        "step_progress": steps
    }

def search_activities_node(state: AgentState) -> Dict[str, Any]:
    dest = state.get("destination", "Kyoto")
    duration = state.get("duration", 4)

    act_data = TravelService.search_activities(destination=dest, duration_days=duration)
    if isinstance(act_data, dict):
        items = act_data.get("items", [])
        act_live = bool(act_data.get("is_live", False))
        prov = act_data.get("source", "Google Places API")
    elif isinstance(act_data, list):
        items = [a.model_dump() if hasattr(a, "model_dump") else a for a in act_data]
        act_live = bool(act_data and getattr(act_data[0], "is_live", False))
        prov = getattr(act_data[0], "source", "Google Places API") if act_data else "Google Places API"
    else:
        items = []
        act_live = False
        prov = "Google Places API"

    search_results = {
        "type": "activities",
        "query_title": f"Attractions & Experiences in {dest}",
        "items": items,
        "total_count": len(items),
        "provider": prov,
        "is_live": act_live
    }

    events = _add_event(
        state.get("agent_events", []),
        f"Found {len(items)} attractions in {dest} via {prov}",
        "tool"
    )

    steps = list(state.get("step_progress", []))
    if len(steps) >= 2:
        steps[1]["status"] = "complete"
        steps[1]["completed_description"] = f"Retrieved {len(items)} experiences via {prov}"

    return {
        "search_results": search_results,
        "status": "completed",
        "agent_events": events,
        "step_progress": steps
    }

def prepare_search_results_node(state: AgentState) -> Dict[str, Any]:
    search_results = state.get("search_results", {})
    count = search_results.get("total_count", 0)
    q_type = search_results.get("type", "travel")
    prov = search_results.get("provider", "Voyage Demo Provider")
    is_live = bool(search_results.get("is_live", False))

    events = _add_event(
        state.get("agent_events", []),
        f"Search completed: Displaying {count} {q_type} options from {prov}",
        "complete"
    )

    steps = list(state.get("step_progress", []))
    if len(steps) >= 3:
        steps[2]["status"] = "complete"
        steps[2]["completed_description"] = f"{count} {q_type} options ready for viewing"

    return {
        "status": "completed",
        "itinerary": [],
        "reasons": [
            f"Curated {count} options from {prov}",
            "Verified live pricing and availability" if is_live else "Demo pricing from simulated provider data",
            "Sorted by ratings and travel convenience"
        ],
        "agent_events": events,
        "step_progress": steps,
        "payment_status": "not_started",
        "requires_approval": False
    }

# -------------------------------------------------------------
# CATEGORY BUDGET SELECTION HELPERS (Strict deterministic enforcement)
# -------------------------------------------------------------

def select_hotel_within_budget(
    available_hotels: List[Dict[str, Any]],
    hotel_budget: Optional[float],
    duration_days: int = 4
) -> Tuple[Dict[str, Any], float, Optional[str]]:
    nights = max(1, duration_days - 1)
    if not available_hotels:
        return {"name": "Boutique Hotel", "total_price": 0.0, "rating": 4.8}, 0.0, None

    hotels_with_stay = []
    for h in available_hotels:
        h_copy = dict(h) if isinstance(h, dict) else h.model_dump()
        ppn = float(h_copy.get("price_per_night") or h_copy.get("cost_per_night") or (float(h_copy.get("total_price", 0.0)) / max(1, int(h_copy.get("nights", 1)))))
        stay_cost = round(ppn * nights, 2)
        h_copy["nights"] = nights
        h_copy["price_per_night"] = ppn
        h_copy["cost_per_night"] = ppn
        h_copy["total_price"] = stay_cost
        h_copy["total_cost"] = stay_cost
        hotels_with_stay.append(h_copy)

    if hotel_budget is None:
        selected = max(hotels_with_stay, key=lambda h: float(h.get("rating", 4.0)))
        return selected, float(selected["total_price"]), None

    matching = [h for h in hotels_with_stay if float(h["total_price"]) <= float(hotel_budget)]
    if matching:
        selected = max(matching, key=lambda h: float(h.get("rating", 4.0)))
        return selected, float(selected["total_price"]), None
    else:
        cheapest = min(hotels_with_stay, key=lambda h: float(h["total_price"]))
        cheapest_cost = float(cheapest["total_price"])
        msg = f"No suitable hotel was found within ₹{int(hotel_budget):,} for the requested {duration_days}-day ({nights} night{'s' if nights > 1 else ''}) stay. The lowest available option is '{cheapest.get('name')}' at ₹{int(cheapest_cost):,}."
        return cheapest, cheapest_cost, msg


def select_flight_within_budget(
    available_flights: List[Dict[str, Any]],
    flight_budget: Optional[float]
) -> Tuple[Dict[str, Any], float, Optional[str]]:
    if not available_flights:
        return {"airline": "Direct Flight", "price": flight_budget or 8000.0}, float(flight_budget or 8000.0), None

    flights_list = [f if isinstance(f, dict) else f.model_dump() for f in available_flights]
    if flight_budget is None:
        selected = flights_list[0]
        return selected, float(selected.get("price") or selected.get("total_price", 8000.0)), None

    matching = [f for f in flights_list if float(f.get("price") or f.get("total_price", 999999)) <= float(flight_budget)]
    if matching:
        selected = matching[0]
        return selected, float(selected.get("price") or selected.get("total_price", flight_budget)), None
    else:
        cheapest = min(flights_list, key=lambda f: float(f.get("price") or f.get("total_price", 999999)))
        cheapest_cost = float(cheapest.get("price") or cheapest.get("total_price", 8000.0))
        msg = f"No flight was found within ₹{int(flight_budget):,}. Lowest available flight is '{cheapest.get('airline')}' at ₹{int(cheapest_cost):,}."
        return cheapest, cheapest_cost, msg


def select_activities_within_budget(
    available_activities: List[Dict[str, Any]],
    activity_budget: Optional[float],
    duration_days: int = 4
) -> Tuple[List[Dict[str, Any]], float, Optional[str]]:
    if not available_activities:
        return [], 0.0, None

    acts_list = [a if isinstance(a, dict) else a.model_dump() for a in available_activities]
    if activity_budget is None:
        target_count = min(len(acts_list), max(1, duration_days - 1))
        chosen = acts_list[:target_count]
        total = round(sum(float(a.get("cost", 0.0)) for a in chosen), 2)
        return chosen, total, None

    # Deterministically enforce category budget: sum(chosen.cost) <= activity_budget
    sorted_acts = sorted(acts_list, key=lambda a: (-float(a.get("rating", 4.5)), float(a.get("cost", 0.0))))
    chosen = []
    current_sum = 0.0
    for a in sorted_acts:
        cost = float(a.get("cost", 0.0))
        if current_sum + cost <= float(activity_budget):
            chosen.append(a)
            current_sum += cost

    if chosen:
        total = round(current_sum, 2)
        return chosen, total, None
    else:
        cheapest = min(acts_list, key=lambda a: float(a.get("cost", 999999)))
        cheapest_cost = float(cheapest.get("cost", 0.0))
        msg = f"No activity was found within ₹{int(activity_budget):,}. The lowest available experience is '{cheapest.get('name')}' at ₹{int(cheapest_cost):,}."
        return [cheapest], cheapest_cost, msg


def select_dining_within_budget(
    available_restaurants: List[Dict[str, Any]],
    dining_budget: Optional[float],
    duration_days: int = 4
) -> Tuple[List[Dict[str, Any]], float, Optional[str]]:
    if not available_restaurants:
        return [], 0.0, None

    rests_list = [r if isinstance(r, dict) else r.model_dump() for r in available_restaurants]
    if dining_budget is None:
        target_count = min(len(rests_list), max(1, duration_days))
        chosen = rests_list[:target_count]
        total = round(sum(float(r.get("cost", 0.0)) for r in chosen), 2)
        return chosen, total, None

    sorted_rests = sorted(rests_list, key=lambda r: (-float(r.get("rating", 4.5)), float(r.get("cost", 0.0))))
    chosen = []
    current_sum = 0.0
    for r in sorted_rests:
        cost = float(r.get("cost", 0.0))
        if current_sum + cost <= float(dining_budget):
            chosen.append(r)
            current_sum += cost

    if chosen:
        total = round(current_sum, 2)
        return chosen, total, None
    else:
        cheapest = min(rests_list, key=lambda r: float(r.get("cost", 999999)))
        cheapest_cost = float(cheapest.get("cost", 0.0))
        msg = f"No dining venue found within ₹{int(dining_budget):,}. Lowest option is '{cheapest.get('name')}' at ₹{int(cheapest_cost):,}."
        return [cheapest], cheapest_cost, msg


def select_transport_within_budget(
    available_transports: List[Dict[str, Any]],
    transport_budget: Optional[float],
    duration_days: int = 4
) -> Tuple[List[Dict[str, Any]], float, Optional[str]]:
    if not available_transports:
        return [], 0.0, None

    trns_list = [t if isinstance(t, dict) else t.model_dump() for t in available_transports]
    if transport_budget is None:
        chosen = trns_list
        total = round(sum(float(t.get("cost", 0.0)) for t in chosen), 2)
        return chosen, total, None

    sorted_trns = sorted(trns_list, key=lambda t: float(t.get("cost", 0.0)))
    chosen = []
    current_sum = 0.0
    for t in sorted_trns:
        cost = float(t.get("cost", 0.0))
        if current_sum + cost <= float(transport_budget):
            chosen.append(t)
            current_sum += cost

    if chosen:
        total = round(current_sum, 2)
        return chosen, total, None
    else:
        cheapest = sorted_trns[0]
        cheapest_cost = float(cheapest.get("cost", 0.0))
        msg = f"No transport option found within ₹{int(transport_budget):,}. Lowest option is '{cheapest.get('name')}' at ₹{int(cheapest_cost):,}."
        return [cheapest], cheapest_cost, msg

# -------------------------------------------------------------
# GRANULAR FOLLOW-UP UPDATE NODES
# -------------------------------------------------------------

def update_hotel_node(state: AgentState) -> Dict[str, Any]:
    """Granular update node for hotel budget modifications."""
    dest = state.get("destination", "Goa")
    duration = int(state.get("duration") or state.get("duration_days") or 4)
    budget_envelopes = dict(state.get("budget_envelopes") or {})
    category_status = dict(state.get("category_status") or {})
    hotel_budget = state.get("hotel_budget") or budget_envelopes.get("hotel")

    hotels = search_hotels(destination=dest, duration_days=duration)
    selected_hotel, actual_cost, compromise_msg = select_hotel_within_budget(hotels, hotel_budget, duration)

    budget_envelopes["hotel"] = actual_cost
    is_budget_exceeded = bool(compromise_msg)
    
    if is_budget_exceeded:
        category_status["hotel"] = "Hotel budget too low"
        event_msg = f"No hotel found within ₹{int(hotel_budget):,}. Lowest available is '{selected_hotel.get('name')}' (₹{int(actual_cost):,})."
    else:
        category_status["hotel"] = "New hotel selected"
        event_msg = f"Hotel updated: Selected '{selected_hotel.get('name')}' (₹{int(actual_cost):,}) for {duration} days."

    events = _add_event(state.get("agent_events", []), event_msg, "tool")
    steps = list(state.get("step_progress", []))

    return {
        "selected_hotel": selected_hotel,
        "hotel_options": hotels,
        "budget_envelopes": budget_envelopes,
        "hotel_budget": hotel_budget,
        "category_status": category_status,
        "compromise_message": compromise_msg,
        "is_budget_exceeded": is_budget_exceeded,
        "agent_events": events,
        "step_progress": steps
    }

def update_flights_node(state: AgentState) -> Dict[str, Any]:
    """Granular update node for flight budget modifications."""
    dest = state.get("destination", "Goa")
    orig = state.get("origin", "Mumbai")
    budget_envelopes = dict(state.get("budget_envelopes") or {})
    category_status = dict(state.get("category_status") or {})
    flight_budget = state.get("flight_budget") or budget_envelopes.get("flights")

    flights = search_flights(destination=dest, origin=orig)
    selected_flight, actual_cost, compromise_msg = select_flight_within_budget(flights, flight_budget)

    budget_envelopes["flights"] = actual_cost
    is_budget_exceeded = bool(compromise_msg)

    if is_budget_exceeded:
        category_status["flights"] = "Flight budget too low"
        event_msg = f"No flight found within ₹{int(flight_budget):,}. Lowest is '{selected_flight.get('airline')}' (₹{int(actual_cost):,})."
    else:
        category_status["flights"] = "New flight selected"
        event_msg = f"Flight updated: Selected '{selected_flight.get('airline', 'Flight')}' (₹{int(actual_cost):,})."

    events = _add_event(state.get("agent_events", []), event_msg, "tool")
    steps = list(state.get("step_progress", []))

    return {
        "selected_flight": selected_flight,
        "flight_options": flights,
        "budget_envelopes": budget_envelopes,
        "flight_budget": flight_budget,
        "category_status": category_status,
        "compromise_message": compromise_msg,
        "is_budget_exceeded": is_budget_exceeded,
        "agent_events": events,
        "step_progress": steps
    }

def update_activities_node(state: AgentState) -> Dict[str, Any]:
    """Granular update node for activity budget modifications."""
    dest = state.get("destination", "Goa")
    duration = int(state.get("duration") or state.get("duration_days") or 4)
    budget_envelopes = dict(state.get("budget_envelopes") or {})
    category_status = dict(state.get("category_status") or {})
    activity_budget = state.get("activity_budget") or budget_envelopes.get("activities")

    acts_data = search_activities(destination=dest, duration_days=duration)
    raw_acts = acts_data.get("items", []) if isinstance(acts_data, dict) else acts_data
    
    selected_acts, actual_cost, compromise_msg = select_activities_within_budget(raw_acts, activity_budget, duration)
    budget_envelopes["activities"] = actual_cost
    is_budget_exceeded = bool(compromise_msg)

    if is_budget_exceeded:
        category_status["activities"] = "Activity budget too low"
        event_msg = f"No activities found within ₹{int(activity_budget):,}. Lowest available is ₹{int(actual_cost):,}."
    else:
        category_status["activities"] = "Activities updated"
        event_msg = f"Activities updated: Selected {len(selected_acts)} experiences totaling ₹{int(actual_cost):,} within ₹{int(activity_budget):,} envelope."

    events = _add_event(state.get("agent_events", []), event_msg, "tool")
    steps = list(state.get("step_progress", []))

    return {
        "selected_activities": {
            "items": selected_acts,
            "total_estimated": actual_cost,
            "is_live": acts_data.get("is_live", False) if isinstance(acts_data, dict) else False,
            "source": acts_data.get("source", "Voyage Demo Provider") if isinstance(acts_data, dict) else "Voyage Demo Provider"
        },
        "budget_envelopes": budget_envelopes,
        "activity_budget": activity_budget,
        "category_status": category_status,
        "compromise_message": compromise_msg,
        "is_budget_exceeded": is_budget_exceeded,
        "agent_events": events,
        "step_progress": steps
    }

def update_dining_node(state: AgentState) -> Dict[str, Any]:
    """Granular update node for dining budget modifications."""
    dest = state.get("destination", "Goa")
    duration = int(state.get("duration") or state.get("duration_days") or 4)
    budget_envelopes = dict(state.get("budget_envelopes") or {})
    category_status = dict(state.get("category_status") or {})
    dining_budget = state.get("dining_budget") or budget_envelopes.get("dining")

    rests_data = search_restaurants(destination=dest, duration_days=duration)
    raw_rests = rests_data.get("items", []) if isinstance(rests_data, dict) else rests_data

    selected_rests, actual_cost, compromise_msg = select_dining_within_budget(raw_rests, dining_budget, duration)
    budget_envelopes["dining"] = actual_cost
    is_budget_exceeded = bool(compromise_msg)

    if is_budget_exceeded:
        category_status["dining"] = "Dining budget too low"
    else:
        category_status["dining"] = "Dining updated"

    event_msg = f"Dining updated: Selected {len(selected_rests)} dining venues totaling ₹{int(actual_cost):,}."
    events = _add_event(state.get("agent_events", []), event_msg, "tool")
    steps = list(state.get("step_progress", []))

    return {
        "selected_restaurants": {
            "items": selected_rests,
            "total_estimated": actual_cost,
            "is_live": rests_data.get("is_live", False) if isinstance(rests_data, dict) else False,
            "source": rests_data.get("source", "Voyage Demo Provider") if isinstance(rests_data, dict) else "Voyage Demo Provider"
        },
        "budget_envelopes": budget_envelopes,
        "dining_budget": dining_budget,
        "category_status": category_status,
        "compromise_message": compromise_msg,
        "is_budget_exceeded": is_budget_exceeded,
        "agent_events": events,
        "step_progress": steps
    }

def update_transport_node(state: AgentState) -> Dict[str, Any]:
    """Granular update node for transport budget modifications."""
    dest = state.get("destination", "Goa")
    duration = int(state.get("duration") or state.get("duration_days") or 4)
    budget_envelopes = dict(state.get("budget_envelopes") or {})
    category_status = dict(state.get("category_status") or {})
    transport_budget = state.get("transport_budget") or budget_envelopes.get("transport")

    trans_data = search_transport(destination=dest, duration_days=duration)
    raw_trans = trans_data.get("items", []) if isinstance(trans_data, dict) else trans_data

    selected_trans, actual_cost, compromise_msg = select_transport_within_budget(raw_trans, transport_budget, duration)
    budget_envelopes["transport"] = actual_cost
    is_budget_exceeded = bool(compromise_msg)

    if is_budget_exceeded:
        category_status["transport"] = "Transport budget too low"
    else:
        category_status["transport"] = "Transport updated"

    event_msg = f"Transport updated: Total ₹{int(actual_cost):,}."
    events = _add_event(state.get("agent_events", []), event_msg, "tool")
    steps = list(state.get("step_progress", []))

    return {
        "selected_transport": {
            "items": selected_trans,
            "total_estimated": actual_cost,
            "is_live": False,
            "source": "Voyage Demo Provider"
        },
        "budget_envelopes": budget_envelopes,
        "transport_budget": transport_budget,
        "category_status": category_status,
        "compromise_message": compromise_msg,
        "is_budget_exceeded": is_budget_exceeded,
        "agent_events": events,
        "step_progress": steps
    }

def recalculate_trip_node(state: AgentState) -> Dict[str, Any]:
    """Recalculates all category options and duration-dependent costs when duration or destination changes."""
    dest = state.get("destination", "Goa")
    orig = state.get("origin", "Mumbai")
    duration = int(state.get("duration") or state.get("duration_days") or 4)
    nights = max(1, duration - 1)

    budget_envelopes = dict(state.get("budget_envelopes") or {})
    category_status = dict(state.get("category_status") or {})

    hotel_budget = state.get("hotel_budget") or budget_envelopes.get("hotel")
    flight_budget = state.get("flight_budget") or budget_envelopes.get("flights")
    dining_budget = state.get("dining_budget") or budget_envelopes.get("dining")
    activity_budget = state.get("activity_budget") or budget_envelopes.get("activities")
    transport_budget = state.get("transport_budget") or budget_envelopes.get("transport")

    # Search fresh options for new duration and destination
    hotels = search_hotels(destination=dest, duration_days=duration)
    flights = search_flights(destination=dest, origin=orig)
    rests_data = search_restaurants(destination=dest, duration_days=duration)
    acts_data = search_activities(destination=dest, duration_days=duration)
    trans_data = search_transport(destination=dest, duration_days=duration)

    raw_rests = rests_data.get("items", []) if isinstance(rests_data, dict) else rests_data
    raw_acts = acts_data.get("items", []) if isinstance(acts_data, dict) else acts_data
    raw_trans = trans_data.get("items", []) if isinstance(trans_data, dict) else trans_data

    # Re-evaluate all categories
    selected_hotel, hotel_cost, hotel_comp = select_hotel_within_budget(hotels, hotel_budget, duration)
    selected_flight, flight_cost, flight_comp = select_flight_within_budget(flights, flight_budget)
    selected_rests, dining_cost, din_comp = select_dining_within_budget(raw_rests, dining_budget, duration)
    selected_acts, activity_cost, act_comp = select_activities_within_budget(raw_acts, activity_budget, duration)
    selected_trans, transport_cost, trans_comp = select_transport_within_budget(raw_trans, transport_budget, duration)

    budget_envelopes["hotel"] = hotel_cost
    budget_envelopes["flights"] = flight_cost
    budget_envelopes["dining"] = dining_cost
    budget_envelopes["activities"] = activity_cost
    budget_envelopes["transport"] = transport_cost

    compromises = [c for c in [hotel_comp, flight_comp, din_comp, act_comp, trans_comp] if c]
    compromise_msg = compromises[0] if compromises else None
    is_budget_exceeded = bool(compromises)

    events = state.get("agent_events", [])
    events = _add_event(
        events,
        f"Trip recalculated: {duration} days ({nights} night{'s' if nights > 1 else ''}) in {dest}",
        "tool"
    )

    steps = list(state.get("step_progress", []))

    return {
        "duration": duration,
        "duration_days": duration,
        "selected_hotel": selected_hotel,
        "hotel_options": hotels,
        "selected_flight": selected_flight,
        "flight_options": flights,
        "selected_restaurants": {
            "items": selected_rests,
            "total_estimated": dining_cost,
            "is_live": rests_data.get("is_live", False) if isinstance(rests_data, dict) else False,
            "source": rests_data.get("source", "Voyage Demo Provider") if isinstance(rests_data, dict) else "Voyage Demo Provider"
        },
        "selected_activities": {
            "items": selected_acts,
            "total_estimated": activity_cost,
            "is_live": acts_data.get("is_live", False) if isinstance(acts_data, dict) else False,
            "source": acts_data.get("source", "Voyage Demo Provider") if isinstance(acts_data, dict) else "Voyage Demo Provider"
        },
        "selected_transport": {
            "items": selected_trans,
            "total_estimated": transport_cost,
            "is_live": False,
            "source": "Voyage Demo Provider"
        },
        "budget_envelopes": budget_envelopes,
        "hotel_budget": hotel_budget,
        "flight_budget": flight_budget,
        "dining_budget": dining_budget,
        "activity_budget": activity_budget,
        "transport_budget": transport_budget,
        "category_status": category_status,
        "compromise_message": compromise_msg,
        "is_budget_exceeded": is_budget_exceeded,
        "agent_events": events,
        "step_progress": steps
    }

# -------------------------------------------------------------
# FULL TRIP PLANNING NODES
# -------------------------------------------------------------

def load_preferences_node(state: AgentState) -> Dict[str, Any]:
    destination = state.get("destination", "Goa")
    travel_style = state.get("travel_style", "Luxury boutique")
    interests = state.get("interests", ["heritage", "cafés"])

    mock_prefs = {
        "travel_style": travel_style,
        "interests": interests,
        "food_preferences": [f"local {destination} cuisine", "curated wine pairing"],
        "budget_style": "Moderate",
        "aiPreferences": {
            "askBeforePurchases": True,
            "alertBudgetRisks": True
        }
    }

    events = _add_event(
        state.get("agent_events", []),
        f"Travel preferences loaded: {travel_style}, interests in {', '.join(interests)}",
        "system"
    )

    steps = list(state.get("step_progress", []))
    if len(steps) >= 2:
        steps[1]["status"] = "complete"
        steps[1]["completed_description"] = f"Profile loaded: {travel_style} & {', '.join(interests[:2])}"
    if len(steps) >= 3:
        steps[2]["status"] = "active"
        steps[2]["active_description"] = f"Searching verified partner inventory for {destination}..."

    return {
        "preferences": mock_prefs,
        "agent_events": events,
        "step_progress": steps
    }

def search_travel_node(state: AgentState) -> Dict[str, Any]:
    destination = state.get("destination", "Goa")
    duration = state.get("duration", 4)
    origin = state.get("origin", "Mumbai")
    dep_date = state.get("departure_date")
    ret_date = state.get("return_date")

    flights = search_flights(
        destination=destination,
        origin=origin,
        departure_date=dep_date,
        return_date=ret_date
    )
    hotels = search_hotels(
        destination=destination,
        duration_days=duration
    )
    restaurants = search_restaurants(
        destination=destination,
        duration_days=duration
    )
    activities = search_activities(
        destination=destination,
        duration_days=duration
    )
    transport = search_transport(
        destination=destination,
        duration_days=duration
    )

    flight_live = bool(flights and flights[0].get("is_live", False))
    dining_live = bool(restaurants.get("is_live", False))
    act_live = bool(activities.get("is_live", False))

    provider_summary = {
        "flights": {"provider": flights[0].get("source", "Voyage Demo Provider") if flights else "Voyage Demo Provider", "is_live": flight_live},
        "restaurants": {"provider": restaurants.get("source", "Voyage Demo Provider"), "is_live": dining_live},
        "hotels": {"provider": "Voyage Demo Provider", "is_live": False},
        "activities": {"provider": activities.get("source", "Voyage Demo Provider"), "is_live": act_live},
        "transport": {"provider": "Voyage Demo Provider", "is_live": False},
        "any_live": flight_live or dining_live or act_live
    }

    events = state.get("agent_events", [])
    flt_src = flights[0].get('source', 'Voyage') if flights else "Voyage"
    htl_cost = float(hotels[0].get('total_price') or hotels[0].get('total_cost') or 0.0) if hotels else 0.0
    flt_cost = float(flights[0].get('price') or flights[0].get('total_price') or 0.0) if flights else 0.0
    act_cost = float(activities.get('total_estimated', 0.0))

    if hotels:
        events = _add_event(events, f"Hotel search: Found '{hotels[0]['name']}' (₹{int(htl_cost):,})", "tool")
    if flights:
        events = _add_event(events, f"Flight search: Found '{flights[0]['airline']}' (₹{int(flt_cost):,}) via {flt_src}", "tool")
    events = _add_event(events, f"Activity search: Found {len(activities.get('items', []))} experiences in {destination} (₹{int(act_cost):,})", "tool")

    steps = list(state.get("step_progress", []))
    if len(steps) >= 3:
        steps[2]["status"] = "complete"
        steps[2]["completed_description"] = f"Found verified options across 5 categories in {destination}"
    if len(steps) >= 4:
        steps[3]["status"] = "active"
        steps[3]["active_description"] = "Evaluating options against travel style..."

    return {
        "flight_options": flights,
        "hotel_options": hotels,
        "restaurant_options": restaurants,
        "activity_options": activities,
        "transport_options": transport,
        "provider_summary": provider_summary,
        "agent_events": events,
        "step_progress": steps
    }

def compare_options_node(state: AgentState) -> Dict[str, Any]:
    destination = state.get("destination", "Goa")
    duration = int(state.get("duration") or state.get("duration_days") or 4)
    hotel_options = state.get("hotel_options", [])
    flight_options = state.get("flight_options", [])
    rest_data = state.get("restaurant_options", {})
    act_data = state.get("activity_options", {})
    trans_data = state.get("transport_options", {})
    ai_mode = state.get("ai_mode", "demo")
    interests = state.get('interests', ['heritage', 'cafés'])

    raw_rests = rest_data.get("items", []) if isinstance(rest_data, dict) else rest_data
    raw_acts = act_data.get("items", []) if isinstance(act_data, dict) else act_data
    raw_trans = trans_data.get("items", []) if isinstance(trans_data, dict) else trans_data

    # Select options respecting any category budgets
    selected_hotel, hotel_cost, hotel_comp = select_hotel_within_budget(hotel_options, state.get("hotel_budget"), duration)
    selected_flight, flight_cost, flight_comp = select_flight_within_budget(flight_options, state.get("flight_budget"))
    selected_acts, act_cost, act_comp = select_activities_within_budget(raw_acts, state.get("activity_budget"), duration)
    selected_rests, din_cost, din_comp = select_dining_within_budget(raw_rests, state.get("dining_budget"), duration)
    selected_trans, trans_cost, trans_comp = select_transport_within_budget(raw_trans, state.get("transport_budget"), duration)

    budget_envelopes = dict(state.get("budget_envelopes") or {})
    budget_envelopes["hotel"] = hotel_cost
    budget_envelopes["flights"] = flight_cost
    budget_envelopes["dining"] = din_cost
    budget_envelopes["activities"] = act_cost
    budget_envelopes["transport"] = trans_cost

    reasons = [
        f"Matches your preference for {', '.join(interests)} in {destination}",
        f"Top-rated boutique stay ({selected_hotel.get('rating', 4.8)}★) with curated local hospitality",
        f"Synchronized schedule for your {duration}-day {destination} itinerary"
    ]

    compromises = [c for c in [hotel_comp, flight_comp, din_comp, act_comp, trans_comp] if c]
    compromise_msg = compromises[0] if compromises else None
    is_budget_exceeded = bool(compromises)

    events = _add_event(
        state.get("agent_events", []),
        f"Option comparison: Selected '{selected_hotel.get('name', 'Stay')}' & verified flight schedule",
        "tool"
    )

    steps = list(state.get("step_progress", []))
    if len(steps) >= 4:
        steps[3]["status"] = "complete"
        steps[3]["completed_description"] = f"Selected top-rated inventory in {destination}"
    if len(steps) >= 5:
        steps[4]["status"] = "active"
        steps[4]["active_description"] = "Verifying budget envelopes & contingency..."

    return {
        "selected_hotel": selected_hotel,
        "selected_flight": selected_flight,
        "selected_restaurants": {
            "items": selected_rests,
            "total_estimated": din_cost,
            "is_live": rest_data.get("is_live", False) if isinstance(rest_data, dict) else False,
            "source": rest_data.get("source", "Voyage Demo Provider") if isinstance(rest_data, dict) else "Voyage Demo Provider"
        },
        "selected_activities": {
            "items": selected_acts,
            "total_estimated": act_cost,
            "is_live": act_data.get("is_live", False) if isinstance(act_data, dict) else False,
            "source": act_data.get("source", "Voyage Demo Provider") if isinstance(act_data, dict) else "Voyage Demo Provider"
        },
        "selected_transport": {
            "items": selected_trans,
            "total_estimated": trans_cost,
            "is_live": False,
            "source": "Voyage Demo Provider"
        },
        "budget_envelopes": budget_envelopes,
        "reasons": reasons,
        "compromise_message": compromise_msg,
        "is_budget_exceeded": is_budget_exceeded,
        "agent_events": events,
        "step_progress": steps
    }

def check_budget_node(state: AgentState) -> Dict[str, Any]:
    hotel_obj = state.get("selected_hotel") or {}
    flight_obj = state.get("selected_flight") or {}
    rest_obj = state.get("selected_restaurants") or {}
    act_obj = state.get("selected_activities") or {}
    trans_obj = state.get("selected_transport") or {}

    # Category defaults derived from actual options
    default_hotel_cost = float(hotel_obj.get("total_price") or hotel_obj.get("total_cost") or 0.0)
    default_flight_cost = float(flight_obj.get("price") or flight_obj.get("total_price") or 0.0)
    default_dining_cost = float(rest_obj.get("total_estimated") or 0.0)
    default_activities_cost = float(act_obj.get("total_estimated") or 0.0)
    default_transport_cost = float(trans_obj.get("total_estimated") or 0.0)

    # Read category envelopes if custom overrides exist from state
    budget_envelopes = dict(state.get("budget_envelopes") or {})

    hotel_cost = float(budget_envelopes["hotel"]) if "hotel" in budget_envelopes and budget_envelopes["hotel"] is not None else default_hotel_cost
    flight_cost = float(budget_envelopes["flights"]) if "flights" in budget_envelopes and budget_envelopes["flights"] is not None else default_flight_cost
    dining_cost = float(budget_envelopes["dining"]) if "dining" in budget_envelopes and budget_envelopes["dining"] is not None else default_dining_cost
    activities_cost = float(budget_envelopes["activities"]) if "activities" in budget_envelopes and budget_envelopes["activities"] is not None else default_activities_cost
    transport_cost = float(budget_envelopes["transport"]) if "transport" in budget_envelopes and budget_envelopes["transport"] is not None else default_transport_cost

    budget_envelopes = {
        "hotel": hotel_cost,
        "flights": flight_cost,
        "dining": dining_cost,
        "activities": activities_cost,
        "transport": transport_cost
    }

    user_budget = state.get("budget")

    # Python strictly calculates deterministic sum
    total = calculate_total_cost(
        flight_cost=flight_cost,
        hotel_cost=hotel_cost,
        dining_cost=dining_cost,
        activities_cost=activities_cost,
        transport_cost=transport_cost
    )

    events = state.get("agent_events", [])

    if user_budget is None:
        events = _add_event(
            events,
            f"Budget estimated: Total package ₹{int(total):,} calculated for {state.get('duration', 4)} days in {state.get('destination')}",
            "budget"
        )
        steps = list(state.get("step_progress", []))
        for s in steps:
            if "budget" in s["label"].lower() or "checking" in s["label"].lower():
                s["status"] = "complete"
                s["completed_description"] = f"₹{int(total):,} calculated"
        return {
            "estimated_total": total,
            "remaining_budget": 0.0,
            "is_budget_exceeded": False,
            "budget_envelopes": budget_envelopes,
            "hotel_budget": state.get("hotel_budget"),
            "flight_budget": state.get("flight_budget"),
            "transport_budget": state.get("transport_budget"),
            "dining_budget": state.get("dining_budget"),
            "activity_budget": state.get("activity_budget"),
            "agent_events": events,
            "step_progress": steps
        }

    is_within, cushion = evaluate_budget_cushion(total, float(user_budget))
    is_exceeded = (total > float(user_budget))

    if is_exceeded:
        events = _add_event(
            events,
            f"Budget exceeded: Estimated ₹{int(total):,} exceeds ceiling ₹{int(user_budget):,} by ₹{int(total - float(user_budget)):,}",
            "budget"
        )
    else:
        events = _add_event(
            events,
            f"Budget check passed: ₹{int(total):,} fits within ₹{int(user_budget):,} (Cushion: ₹{int(cushion):,})",
            "budget"
        )

    steps = list(state.get("step_progress", []))
    for s in steps:
        if "budget" in s["label"].lower() or "checking" in s["label"].lower():
            s["status"] = "complete"
            s["completed_description"] = f"₹{int(total):,} within ₹{int(user_budget):,}" if not is_exceeded else f"Exceeds by ₹{int(total - float(user_budget)):,}"

    return {
        "estimated_total": total,
        "remaining_budget": cushion,
        "is_budget_exceeded": is_exceeded,
        "budget_envelopes": budget_envelopes,
        "hotel_budget": state.get("hotel_budget"),
        "flight_budget": state.get("flight_budget"),
        "transport_budget": state.get("transport_budget"),
        "dining_budget": state.get("dining_budget"),
        "activity_budget": state.get("activity_budget"),
        "agent_events": events,
        "step_progress": steps
    }

def optimize_budget_node(state: AgentState) -> Dict[str, Any]:
    hotel = dict(state.get("selected_hotel") or {})
    flight = dict(state.get("selected_flight") or {})
    activities = dict(state.get("selected_activities") or {})
    transport = dict(state.get("selected_transport") or {})
    restaurants = dict(state.get("selected_restaurants") or {})
    budget_envelopes = dict(state.get("budget_envelopes") or {})

    user_budget = float(state.get("budget") or 0.0)
    duration_days = int(state.get("duration") or state.get("duration_days") or 4)
    attempts = int(state.get("optimization_attempts") or 0)

    # Defensive category cost retrieval
    hotel_cost = float(budget_envelopes.get("hotel") or hotel.get("total_price") or hotel.get("total_cost") or 0.0)
    flight_cost = float(budget_envelopes.get("flights") or flight.get("price") or flight.get("total_price") or 0.0)
    dining_cost = float(budget_envelopes.get("dining") or restaurants.get("total_estimated") or 0.0)
    activity_cost = float(budget_envelopes.get("activities") or activities.get("total_estimated") or 0.0)
    transport_cost = float(budget_envelopes.get("transport") or transport.get("total_estimated") or 0.0)

    optimized = generate_optimized_options(
        hotel_cost=hotel_cost,
        flight_cost=flight_cost,
        dining_cost=dining_cost,
        activity_cost=activity_cost,
        transport_cost=transport_cost,
        total_budget=user_budget,
        duration_days=duration_days,
        attempt=attempts
    )

    if optimized["hotel_cost"] < hotel_cost:
        hotel["total_cost"] = optimized["hotel_cost"]
        hotel["total_price"] = optimized["hotel_cost"]
        hotel["name"] = f"{hotel.get('name', 'Hotel')} (Value Tier)"
    
    if optimized["flight_cost"] < flight_cost:
        flight["total_price"] = optimized["flight_cost"]
        flight["price"] = optimized["flight_cost"]
        flight["airline"] = f"{flight.get('airline', 'Flight')} (Saver Fare)"

    restaurants["total_estimated"] = optimized["dining_cost"]
    activities["total_estimated"] = optimized["activity_cost"]
    transport["total_estimated"] = optimized["transport_cost"]

    updated_envelopes = {
        "hotel": optimized["hotel_cost"],
        "flights": optimized["flight_cost"],
        "dining": optimized["dining_cost"],
        "activities": optimized["activity_cost"],
        "transport": optimized["transport_cost"]
    }

    events = _add_event(
        state.get("agent_events", []),
        f"Budget optimization (Attempt {attempts + 1}): {optimized.get('change_description', 'Adjusted category allocations')} (Target: ₹{int(optimized['total']):,})",
        "budget"
    )

    return {
        "selected_hotel": hotel,
        "selected_flight": flight,
        "selected_restaurants": restaurants,
        "selected_activities": activities,
        "selected_transport": transport,
        "budget_envelopes": updated_envelopes,
        "hotel_budget": state.get("hotel_budget"),
        "flight_budget": state.get("flight_budget"),
        "dining_budget": state.get("dining_budget"),
        "activity_budget": state.get("activity_budget"),
        "transport_budget": state.get("transport_budget"),
        "optimization_attempts": attempts + 1,
        "agent_events": events
    }

def build_itinerary_node(state: AgentState) -> Dict[str, Any]:
    hotel = state.get("selected_hotel") or {}
    flight = state.get("selected_flight") or {}
    destination = state.get("destination", "Goa")
    duration = int(state.get("duration") or state.get("duration_days") or 4)
    envelopes = state.get("budget_envelopes") or {}

    flt_cost = float(flight.get('price') or flight.get('total_price') or envelopes.get('flights') or 0.0)
    total_htl_cost = float(hotel.get('total_price') or hotel.get('total_cost') or envelopes.get('hotel') or 0.0)
    nights = max(1, duration - 1)
    nightly_hotel_cost = round(total_htl_cost / max(1, nights), 0)

    act_data = state.get("selected_activities") or {}
    raw_acts = act_data.get("items", []) if isinstance(act_data, dict) else act_data
    rest_data = state.get("selected_restaurants") or {}
    raw_rests = rest_data.get("items", []) if isinstance(rest_data, dict) else rest_data

    itinerary = []
    for d in range(1, duration + 1):
        if d == 1:
            act1 = raw_acts[0] if raw_acts else {"title": f"{destination} Highlights", "location": destination, "cost": 2500.0}
            din1 = raw_rests[0] if raw_rests else {"title": f"Welcome Dinner at {destination}", "location": destination, "cost": 2400.0}
            
            day_items = [
                {"id": "d1-1", "day": 1, "time": "10:30 AM", "title": "Arrival at Airport & Executive EV Transfer", "category": "transport", "location": f"Airport ⇄ {hotel.get('name', destination)}", "estimated_cost": 1100.0, "booking_required": True},
                {"id": "d1-2", "day": 1, "time": "01:30 PM", "title": f"Check-in at {hotel.get('name', 'Boutique Stay')}", "category": "hotel", "location": hotel.get("location", destination), "estimated_cost": nightly_hotel_cost, "booking_required": True},
                {"id": "d1-3", "day": 1, "time": "05:30 PM", "title": act1.get("name") or act1.get("title", f"{destination} Highlights"), "category": "activity", "location": act1.get("location", destination), "estimated_cost": float(act1.get("cost", 2500.0)), "booking_required": True},
                {"id": "d1-4", "day": 1, "time": "08:00 PM", "title": din1.get("name") or din1.get("title", f"Welcome Dining at {destination}"), "category": "dining", "location": din1.get("location", destination), "estimated_cost": float(din1.get("cost", 2400.0)), "booking_required": False}
            ]
            itinerary.append({
                "day": 1,
                "day_title": f"Arrival & {destination} Welcome Experience",
                "items": day_items
            })
        elif d == duration:
            din_last = raw_rests[min(d - 1, len(raw_rests) - 1)] if raw_rests else {"name": "Artisanal Brunch", "location": destination, "cost": 800.0}
            act_last = raw_acts[min(d - 1, len(raw_acts) - 1)] if (len(raw_acts) >= d) else {"name": f"{destination} Heritage & Souvenirs Walk", "location": destination, "cost": 1200.0}
            
            day_items = [
                {"id": f"d{d}-1", "day": d, "time": "09:30 AM", "title": din_last.get("name", "Resort Breakfast & Promenade Walk"), "category": "dining", "location": din_last.get("location", destination), "estimated_cost": float(din_last.get("cost", 800.0)), "booking_required": False},
                {"id": f"d{d}-2", "day": d, "time": "11:30 AM", "title": act_last.get("name", f"Fontainhas Latin Quarter Heritage Walk" if "goa" in destination.lower() else f"{destination} Heritage & Market Walk"), "category": "activity", "location": act_last.get("location", destination), "estimated_cost": float(act_last.get("cost", 1200.0)), "booking_required": True},
                {"id": f"d{d}-3", "day": d, "time": "03:30 PM", "title": "Executive EV Airport Transfer", "category": "transport", "location": f"Resort ⇄ Airport", "estimated_cost": 1100.0, "booking_required": True},
                {"id": f"d{d}-4", "day": d, "time": "06:00 PM", "title": f"Return Flight ({flight.get('airline', 'IndiGo / Premier Flight')})", "category": "travel", "location": f"{destination} ⇄ Origin", "estimated_cost": flt_cost, "booking_required": True}
            ]
            itinerary.append({
                "day": d,
                "day_title": "Brunch, Souvenirs & Departure",
                "items": day_items
            })
        else:
            act_idx = (d - 1) % max(1, len(raw_acts)) if raw_acts else 0
            act_item = raw_acts[act_idx] if raw_acts else {"name": f"{destination} Cultural Excursion (Day {d})", "location": destination, "cost": 1500.0}
            din_idx = (d - 1) % max(1, len(raw_rests)) if raw_rests else 0
            din_item = raw_rests[din_idx] if raw_rests else {"name": f"Curated {destination} Dinner Tasting", "location": destination, "cost": 1500.0}

            day_items = [
                {"id": f"d{d}-1", "day": d, "time": "09:00 AM", "title": f"Artisanal Breakfast at {hotel.get('name', 'Resort Terrace')}", "category": "dining", "location": hotel.get('name', destination), "estimated_cost": 800.0, "booking_required": False},
                {"id": f"d{d}-2", "day": d, "time": "10:30 AM", "title": act_item.get("name", f"Day {d} Excursion in {destination}"), "category": "activity", "location": act_item.get("location", destination), "estimated_cost": float(act_item.get("cost", 1500.0)), "booking_required": True},
                {"id": f"d{d}-3", "day": d, "time": "01:30 PM", "title": "Local Gastronomy & Garden Lunch", "category": "dining", "location": destination, "estimated_cost": 1200.0, "booking_required": False},
                {"id": f"d{d}-4", "day": d, "time": "08:00 PM", "title": din_item.get("name", f"Evening Dining Experience at {destination}"), "category": "dining", "location": din_item.get("location", destination), "estimated_cost": float(din_item.get("cost", 1800.0)), "booking_required": True}
            ]
            itinerary.append({
                "day": d,
                "day_title": f"{destination} Exploration & Nightlife (Day {d})",
                "items": day_items
            })

    return {"itinerary": itinerary}

def prepare_payment_node(state: AgentState) -> Dict[str, Any]:
    user_budget = state.get("budget")
    total = float(state.get("estimated_total") or 0.0)
    hotel = state.get("selected_hotel", {})
    flight = state.get("selected_flight", {})
    activities = state.get("selected_activities", {})
    destination = state.get("destination", "Goa")
    duration = state.get("duration") or state.get("duration_days") or 4
    prefs = state.get("preferences", {})
    budget_envelopes = state.get("budget_envelopes") or {}

    guardrail_result = spend_guardrail_check(
        amount=total,
        user_budget=user_budget,
        user_preferences=prefs
    )

    events = state.get("agent_events", [])
    payment_ref = f"VOYAGE-{uuid.uuid4().hex[:6].upper()}"

    if not guardrail_result["allowed"] or guardrail_result["is_budget_exceeded"]:
        events = _add_event(
            events,
            f"Spend guardrail blocked payment: {guardrail_result['reason']}",
            "budget"
        )
        return {
            "payment_status": "not_started",
            "booking_status": "not_started",
            "payment_amount": total,
            "payment_currency": state.get("currency", "INR"),
            "payment_reference": payment_ref,
            "requires_approval": False,
            "approval_status": "blocked_by_guardrails",
            "approval_reason": guardrail_result["reason"],
            "spend_guardrail_result": guardrail_result,
            "agent_events": events
        }

    events = _add_event(
        events,
        f"Spend guardrail verified: Package ₹{int(total):,} fits within budget. Payment reference {payment_ref} created. Awaiting human approval.",
        "budget"
    )

    act_items = activities.get("items", []) if isinstance(activities, dict) else []
    act_titles = [a.get("title", "Experience") for a in act_items[:3]]

    approval_req = {
        "action": "AUTHORIZE_TRIP_BOOKING",
        "item": f"{destination} · {duration} Days ({hotel.get('name', 'Curated Boutique Stay')})",
        "trip_destination": destination,
        "destination": destination,
        "duration": duration,
        "duration_days": duration,
        "selected_hotel": hotel.get("name", "Boutique Hotel"),
        "selected_flight": flight.get("airline", "Direct Flight"),
        "selected_activities": act_titles or [f"{destination} Heritage & Excursion"],
        "total_estimated_cost": total,
        "amount": total,
        "currency": state.get("currency", "INR"),
        "payment_reference": payment_ref,
        "requires_approval": True,
        "approval_status": "pending",
        "approval_reason": "Travel purchase requires user approval before charge",
        "user_explanation": f"Curated {duration}-day trip to {destination} including {hotel.get('name', 'hotel')} and {flight.get('airline', 'flight')}.",
        "budget": user_budget,
        "remaining_budget": guardrail_result["remaining_buffer"],
        "remaining_buffer": guardrail_result["remaining_buffer"],
        "budget_envelopes": budget_envelopes,
        "gateway": "Razorpay"
    }

    steps = list(state.get("step_progress", []))
    payment_steps = [
        {"id": "step-7", "label": "Preparing payment", "status": "complete", "completed_description": f"Generated ref {payment_ref} (₹{int(total):,})"},
        {"id": "step-8", "label": "Waiting for your approval", "status": "active", "active_description": "Awaiting human authorization to proceed with Razorpay checkout..."}
    ]
    
    merged_steps = [s for s in steps if s["id"] not in ["step-7", "step-8"]] + payment_steps

    return {
        "payment_status": "awaiting_approval",
        "booking_status": "not_started",
        "payment_amount": total,
        "payment_currency": state.get("currency", "INR"),
        "payment_reference": payment_ref,
        "requires_approval": True,
        "approval_status": "pending",
        "approval_reason": "Travel purchase requires explicit human authorization",
        "approval_request": approval_req,
        "spend_guardrail_result": guardrail_result,
        "agent_events": events,
        "step_progress": merged_steps
    }

def prepare_recommendation_node(state: AgentState) -> Dict[str, Any]:
    user_budget = state.get("budget")
    total = float(state.get("estimated_total") or 0.0)
    is_exceeded = state.get("is_budget_exceeded", False)
    hotel = state.get("selected_hotel", {})
    flight = state.get("selected_flight", {})
    activities = state.get("selected_activities", {})
    destination = state.get("destination", "Goa")
    duration = state.get("duration") or state.get("duration_days") or 4
    ai_mode = state.get("ai_mode", "demo")
    compromise_msg = state.get("compromise_message")
    budget_envelopes = state.get("budget_envelopes") or {}
    payment_ref = state.get("payment_reference") or f"VOYAGE-{uuid.uuid4().hex[:6].upper()}"

    if user_budget is not None and is_exceeded:
        budget = float(user_budget)
        reasons = [
            f"Standard estimated cost is ₹{int(total):,}",
            f"Exceeds requested ceiling of ₹{int(budget):,} by ₹{int(total - budget):,}",
            "Consider increasing budget or adjusting to fewer activities"
        ]
        compromise_msg = f"Your ₹{int(budget):,} budget is unlikely to cover this {duration}-day {destination} itinerary with flights and accommodation. I found a baseline plan for ₹{int(total):,}, or we can reduce the number of activities."
        requires_appr = False
        appr_status = "blocked_by_guardrails"
        pay_status = "not_started"
    else:
        reasons = state.get("reasons", [
            f"Curated for your {duration}-day {destination} stay",
            f"Top-rated boutique accommodation ({hotel.get('rating', 4.8)}★)",
            f"Balanced dining, activities and seamless transport"
        ])
        requires_appr = True
        appr_status = "pending"
        pay_status = "awaiting_approval"

    mode_text = "Gemini LLM" if ai_mode == "llm" else ("Fallback Mode" if ai_mode == "fallback" else "Demo Mode")
    events = _add_event(
        state.get("agent_events", []),
        f"Recommendation synthesized ({mode_text}) and ready for user review",
        "complete"
    )

    if requires_appr:
        events = _add_event(
            events,
            "Waiting for your approval before proceeding to Razorpay checkout.",
            "system"
        )

    steps = list(state.get("step_progress", []))
    for s in steps:
        if "recommendation" in s["label"].lower() or "preparing" in s["label"].lower():
            s["status"] = "complete"
            s["completed_description"] = f"Recommendation ready ({mode_text})"

    if not any(s["id"] == "step-8" for s in steps):
        steps.append({
            "id": "step-8",
            "label": "Waiting for your approval",
            "status": "active" if requires_appr else "complete",
            "active_description": "Awaiting human authorization to proceed with Razorpay checkout..." if requires_appr else "Budget ceiling exceeded"
        })

    act_items = activities.get("items", []) if isinstance(activities, dict) else []
    act_titles = [a.get("title", "Experience") for a in act_items[:3]]

    approval_req = state.get("approval_request") or {
        "action": "AUTHORIZE_TRIP_BOOKING",
        "item": f"{destination} · {duration} Days ({hotel.get('name', 'Curated Boutique Stay')})",
        "trip_destination": destination,
        "destination": destination,
        "duration": duration,
        "duration_days": duration,
        "selected_hotel": hotel.get("name", "Boutique Hotel"),
        "selected_flight": flight.get("airline", "Direct Flight"),
        "selected_activities": act_titles or [f"{destination} Heritage & Excursion"],
        "total_estimated_cost": total,
        "amount": total,
        "currency": state.get("currency", "INR"),
        "payment_reference": payment_ref,
        "requires_approval": requires_appr,
        "approval_status": appr_status,
        "approval_reason": "Travel purchase requires user approval before charge",
        "user_explanation": f"Curated {duration}-day trip to {destination} including {hotel.get('name', 'hotel')} and {flight.get('airline', 'flight')}.",
        "budget": user_budget,
        "remaining_budget": state.get("remaining_budget", 0.0),
        "remaining_buffer": state.get("remaining_budget", 0.0),
        "budget_envelopes": budget_envelopes,
        "gateway": "Razorpay"
    }

    _safe_log("FINAL RECOMMENDATION:")
    _safe_log(f"destination={destination}")
    _safe_log(f"duration={duration}")
    _safe_log(f"budget={user_budget}")
    _safe_log(f"estimated_total={total}")
    _safe_log(f"hotel={budget_envelopes.get('hotel')}")
    _safe_log(f"flights={budget_envelopes.get('flights')}")
    _safe_log(f"transport={budget_envelopes.get('transport')}")
    _safe_log(f"dining={budget_envelopes.get('dining')}")
    _safe_log(f"activities={budget_envelopes.get('activities')}")

    return {
        "reasons": reasons,
        "compromise_message": compromise_msg,
        "requires_approval": requires_appr,
        "approval_status": appr_status,
        "payment_status": pay_status,
        "booking_status": "not_started",
        "approval_request": approval_req,
        "agent_events": events,
        "step_progress": steps
    }

def execute_payment_node(state: AgentState) -> Dict[str, Any]:
    is_rejected = state.get("approval_status") == "rejected" or state.get("approved") is False
    approved = not is_rejected and (state.get("approval_status") == "approved" or state.get("approved") is True)
    total = float(state.get("payment_amount") or state.get("estimated_total") or 0.0)
    currency = state.get("payment_currency", "INR")
    ref = state.get("payment_reference") or f"VOYAGE-{uuid.uuid4().hex[:6].upper()}"
    events = state.get("agent_events", [])

    if not approved:
        events = _add_event(
            events,
            f"Payment authorization cancelled by user for reference {ref}. No charge was made.",
            "system"
        )
        steps = list(state.get("step_progress", []))
        for s in steps:
            if s["id"] == "step-8":
                s["status"] = "complete"
                s["completed_description"] = "Payment cancelled by user"
        return {
            "payment_status": "cancelled",
            "booking_status": "failed",
            "requires_approval": False,
            "approval_status": "rejected",
            "agent_events": events,
            "step_progress": steps
        }

    razorpay_order = create_razorpay_order(
        amount_in_rupees=total,
        currency=currency,
        payment_reference=ref,
        notes={
            "destination": state.get("destination", "Goa"),
            "duration": state.get("duration", 4),
            "reference": ref
        }
    )

    events = _add_event(
        events,
        f"Payment approved: Created Razorpay order {razorpay_order['order_id']} ({razorpay_order['amount_in_paise']} paise).",
        "budget"
    )

    steps = list(state.get("step_progress", []))
    for s in steps:
        if s["id"] == "step-8":
            s["status"] = "complete"
            s["completed_description"] = "Payment authorized by user"
    
    if not any(s["id"] == "step-9" for s in steps):
        steps.append({
            "id": "step-9",
            "label": "Processing payment",
            "status": "active",
            "active_description": f"Ready for Razorpay checkout ({ref})..."
        })

    return {
        "payment_status": "approved",
        "booking_status": "processing",
        "payment_order": razorpay_order,
        "razorpay_order_id": razorpay_order.get("order_id"),
        "requires_approval": False,
        "approval_status": "approved",
        "agent_events": events,
        "step_progress": steps
    }
