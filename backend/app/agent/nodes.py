import datetime
import uuid
import sys
from typing import Dict, Any, List
from app.agent.state import AgentState
from app.agent.llm import is_llm_enabled
from app.agent.prompts import (
    parse_request_deterministic,
    try_gemini_extract_intent,
    try_gemini_compare_options
)
from app.services.travel_service import TravelService
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
    prompt = state.get("request", "")
    
    ai_mode = "demo"
    parsed = None

    if is_llm_enabled():
        parsed = try_gemini_extract_intent(prompt)
        if parsed and parsed.get("destination"):
            ai_mode = "llm"
        else:
            ai_mode = "fallback"

    if not parsed or not parsed.get("destination"):
        parsed = parse_request_deterministic(prompt)
        if not is_llm_enabled():
            ai_mode = "demo"

    # Log parsed parameters safely
    _safe_log(f"REQUEST MESSAGE: {prompt}")
    _safe_log(f"PARSED DESTINATION: {parsed['destination']}")
    _safe_log(f"PARSED DURATION: {parsed['duration_days']}")
    _safe_log(f"PARSED BUDGET: {parsed['budget']}")
    _safe_log(f"PARSED ORIGIN: {parsed['origin']}")
    _safe_log(f"PARSED DEPARTURE DATE: {parsed['departure_date']}")

    event_label = "Gemini AI" if ai_mode == "llm" else ("Fallback parser" if ai_mode == "fallback" else "Demo Mode")
    date_str = f" from {parsed['departure_date']}" if parsed.get("departure_date") else ""
    budget_str = f" under ₹{int(parsed['budget']):,}" if parsed.get("budget") else ""
    
    events = _add_event(
        state.get("agent_events", []),
        f"Request understood ({event_label}): {parsed['duration_days']}-day {parsed['destination']} trip{date_str}{budget_str}",
        "system"
    )
    
    steps = [
        {"id": "step-1", "label": "Understanding request", "status": "complete", "completed_description": f"Identified {parsed['destination']} ({parsed['duration_days']} days, {parsed.get('travel_style', 'luxury boutique')})"},
        {"id": "step-2", "label": "Checking travel preferences", "status": "active", "active_description": f"Querying preferences for {parsed['destination']}..."},
        {"id": "step-3", "label": "Searching external travel services", "status": "waiting"},
        {"id": "step-4", "label": "Comparing options", "status": "waiting"},
        {"id": "step-5", "label": "Checking trip budget", "status": "waiting"},
        {"id": "step-6", "label": "Preparing recommendation", "status": "waiting"},
    ]

    return {
        "destination": parsed["destination"],
        "origin": parsed.get("origin", "Mumbai"),
        "duration": parsed["duration_days"],
        "departure_date": parsed.get("departure_date"),
        "return_date": parsed.get("return_date"),
        "budget": parsed.get("budget"),
        "currency": parsed.get("currency", "INR"),
        "travel_style": parsed.get("travel_style", "luxury boutique"),
        "interests": parsed.get("interests", ["heritage", "cafés"]),
        "agent_events": events,
        "step_progress": steps,
        "optimization_attempts": 0,
        "is_budget_exceeded": False,
        "ai_mode": ai_mode
    }

def load_preferences_node(state: AgentState) -> Dict[str, Any]:
    destination = state.get("destination", "Goa")
    travel_style = state.get("travel_style", "Luxury boutique")
    interests = state.get("interests", ["heritage", "cafés"])

    mock_prefs = {
        "travel_style": travel_style,
        "interests": interests,
        "food_preferences": [f"local {destination} cuisine", "curated wine pairing"],
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

    # Modular independent tool calls with dynamic duration & dates
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
        "flights": {"provider": flights[0].get("source", "Voyage Demo Provider"), "is_live": flight_live},
        "restaurants": {"provider": restaurants.get("source", "Voyage Demo Provider"), "is_live": dining_live},
        "hotels": {"provider": "Voyage Demo Provider", "is_live": False},
        "activities": {"provider": activities.get("source", "Voyage Demo Provider"), "is_live": act_live},
        "transport": {"provider": "Voyage Demo Provider", "is_live": False},
        "any_live": flight_live or dining_live or act_live
    }

    events = state["agent_events"]
    flt_src = flights[0].get('source', 'Aviationstack')
    htl_cost = float(hotels[0].get('total_price') or hotels[0].get('total_cost') or 12800.0)
    flt_cost = float(flights[0].get('price') or flights[0].get('total_price') or 8000.0)
    act_cost = float(activities.get('total_estimated', 6500.0))

    events = _add_event(events, f"Hotel search: Found '{hotels[0]['name']}' (₹{int(htl_cost):,})", "tool")
    events = _add_event(events, f"Flight search: Found '{flights[0]['airline']}' (₹{int(flt_cost):,}) via {flt_src}", "tool")
    events = _add_event(events, f"Activity search: Found {len(activities['items'])} experiences in {destination} (₹{int(act_cost):,})", "tool")

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
    hotel_options = state["hotel_options"]
    flight_options = state["flight_options"]
    activity_options = state["activity_options"]
    ai_mode = state.get("ai_mode", "demo")
    interests = state.get('interests', ['heritage', 'cafés'])

    # Default selection
    selected_hotel = hotel_options[0]
    selected_flight = flight_options[0]
    selected_restaurants = state["restaurant_options"]
    selected_activities = activity_options
    selected_transport = state["transport_options"]

    reasons = [
        f"Matches your preference for {', '.join(interests)} in {destination}",
        f"Top-rated boutique stay ({selected_hotel.get('rating', 4.8)}★) with curated local hospitality",
        f"Synchronized schedule for your {state.get('duration', 4)}-day {destination} itinerary"
    ]

    # If Gemini is active, let Gemini evaluate and recommend reasons
    if ai_mode == "llm":
        gemini_eval = try_gemini_compare_options(
            destination=destination,
            user_style=state.get("travel_style", "luxury boutique"),
            interests=interests,
            budget=float(state.get("budget") or 40000.0),
            hotel_options=hotel_options,
            flight_options=flight_options,
            activity_options=activity_options
        )
        if gemini_eval and gemini_eval.get("reasons"):
            reasons = gemini_eval["reasons"][:3]
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
        steps[3]["completed_description"] = f"Selected top-rated inventory in {destination}"
    if len(steps) >= 5:
        steps[4]["status"] = "active"
        steps[4]["active_description"] = "Verifying budget envelopes & contingency..."

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
    hotel_cost = float(state["selected_hotel"].get("total_price") or state["selected_hotel"].get("total_cost", 12800.0))
    flight_cost = float(state["selected_flight"].get("price") or state["selected_flight"].get("total_price", 8000.0))
    dining_cost = float(state["selected_restaurants"].get("total_estimated", 7000.0))
    activities_cost = float(state["selected_activities"].get("total_estimated", 6500.0))
    transport_cost = float(state["selected_transport"].get("total_estimated", 3500.0))
    
    user_budget = state.get("budget")

    total = calculate_total_cost(
        flight_cost=flight_cost,
        hotel_cost=hotel_cost,
        dining_cost=dining_cost,
        activities_cost=activities_cost,
        transport_cost=transport_cost
    )

    events = state["agent_events"]

    # If user provided no budget ceiling:
    if user_budget is None:
        events = _add_event(
            events,
            f"Budget estimated: Total package ₹{int(total):,} calculated for {state.get('duration', 4)} days in {state.get('destination')}",
            "budget"
        )
        steps = list(state.get("step_progress", []))
        if len(steps) >= 5:
            steps[4]["status"] = "complete"
            steps[4]["completed_description"] = f"Estimated trip total: ₹{int(total):,}"
        if len(steps) >= 6:
            steps[5]["status"] = "active"
            steps[5]["active_description"] = "Assembling complete day-by-day plan..."

        return {
            "estimated_total": total,
            "remaining_budget": 0.0,
            "is_budget_exceeded": False,
            "agent_events": events,
            "step_progress": steps
        }

    budget = float(user_budget)
    is_within, diff = evaluate_budget_cushion(total, budget)
    attempts = state.get("optimization_attempts", 0)

    if is_within:
        events = _add_event(
            events,
            f"Budget verified: ₹{int(total):,} fits within ₹{int(budget):,} ceiling (buffer: ₹{int(diff):,})",
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
            f"Budget check: Estimated ₹{int(total):,} exceeds ceiling ₹{int(budget):,} (overage: ₹{int(abs(diff)):,})",
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
    duration = state.get("duration", 4)
    destination = state.get("destination", "Goa")
    hotel_cost = float(hotel.get("total_price") or hotel.get("total_cost", 12800.0))
    nights = max(1, duration - 1)
    nightly_hotel_cost = round(hotel_cost / nights, 2)
    flight = state.get("selected_flight", {})
    flt_cost = float(flight.get("price") or flight.get("total_price", 8000.0))

    dest_lower = destination.lower()

    if "jaipur" in dest_lower:
        day1 = {
            "day": 1,
            "day_title": "Arrival, Royal Haveli Check-In & Amber Fort Sunset",
            "items": [
                {"id": "d1-1", "day": 1, "time": "10:00 AM", "title": f"Arrival at Jaipur Airport (JAI) & Chauffeur Transfer", "category": "transport", "location": f"JAI ⇄ {hotel['name']}", "estimated_cost": 800.0, "booking_required": True},
                {"id": "d1-2", "day": 1, "time": "01:00 PM", "title": f"Check-in at {hotel['name']}", "category": "hotel", "location": hotel.get("location", "Jaipur"), "estimated_cost": nightly_hotel_cost, "booking_required": True},
                {"id": "d1-3", "day": 1, "time": "04:30 PM", "title": "Amber Fort & Nahargarh Fort Sunset Panorama", "category": "activity", "location": "Amer, Jaipur", "estimated_cost": 1800.0, "booking_required": True},
                {"id": "d1-4", "day": 1, "time": "08:00 PM", "title": "1135 AD Amber Fort Candlelight Dinner", "category": "dining", "location": "Amer Fort Palace", "estimated_cost": 2400.0, "booking_required": False}
            ]
        }
        day2 = {
            "day": 2,
            "day_title": "City Palace, Hawa Mahal & Royal Bazaars",
            "items": [
                {"id": "d2-1", "day": 2, "time": "09:00 AM", "title": "Courtyard Breakfast at Haveli", "category": "dining", "location": hotel['name'], "estimated_cost": 800.0, "booking_required": False},
                {"id": "d2-2", "day": 2, "time": "10:30 AM", "title": "City Palace & Hawa Mahal Royal Photography Tour", "category": "activity", "location": "Old City, Jaipur", "estimated_cost": 1200.0, "booking_required": True},
                {"id": "d2-3", "day": 2, "time": "01:30 PM", "title": "Caffé Palladio Heritage Mezze Lunch", "category": "dining", "location": "Narain Niwas, Jaipur", "estimated_cost": 1600.0, "booking_required": False},
                {"id": "d2-4", "day": 2, "time": "05:00 PM", "title": "Johari Bazaar Artisanal Jewelry & Textiles Walk", "category": "activity", "location": "Johari Bazaar", "estimated_cost": 0.0, "booking_required": False}
            ]
        }
        day2_departure = {
            "day": 2,
            "day_title": "City Palace, Hawa Mahal & VIP Departure",
            "items": [
                {"id": "d2-1", "day": 2, "time": "09:00 AM", "title": "Courtyard Breakfast at Haveli", "category": "dining", "location": hotel['name'], "estimated_cost": 800.0, "booking_required": False},
                {"id": "d2-2", "day": 2, "time": "10:30 AM", "title": "City Palace & Hawa Mahal Royal Photography Walk", "category": "activity", "location": "Old City, Jaipur", "estimated_cost": 1200.0, "booking_required": True},
                {"id": "d2-3", "day": 2, "time": "03:30 PM", "title": "Chauffeur Transfer to Jaipur Airport (JAI)", "category": "transport", "location": f"{hotel['name']} ⇄ JAI Airport", "estimated_cost": 800.0, "booking_required": True},
                {"id": "d2-4", "day": 2, "time": "06:30 PM", "title": f"Return Flight from Jaipur ({flight.get('airline', 'IndiGo Premier')})", "category": "travel", "location": "Jaipur (JAI) Flight", "estimated_cost": flt_cost, "booking_required": True}
            ]
        }
        day3 = {
            "day": 3,
            "day_title": "Jantar Mantar & Johari Gemstone Trail",
            "items": [
                {"id": "d3-1", "day": 3, "time": "09:30 AM", "title": "Jantar Mantar UNESCO Astronomical Observatory Tour", "category": "activity", "location": "City Palace Complex", "estimated_cost": 1000.0, "booking_required": True},
                {"id": "d3-2", "day": 3, "time": "01:30 PM", "title": "Baradari City Palace Courtyard Lunch", "category": "dining", "location": "City Palace", "estimated_cost": 2000.0, "booking_required": False},
                {"id": "d3-3", "day": 3, "time": "07:30 PM", "title": "Chokhi Dhani Cultural Village & Rajasthani Feast", "category": "dining", "location": "Tonk Road", "estimated_cost": 1800.0, "booking_required": True}
            ]
        }
        day4 = {
            "day": 4,
            "day_title": "Elefantastic Sanctuary & VIP Departure",
            "items": [
                {"id": "d4-1", "day": 4, "time": "09:00 AM", "title": "Elefantastic Ethical Sanctuary Experience", "category": "activity", "location": "Amer Foothills", "estimated_cost": 2200.0, "booking_required": True},
                {"id": "d4-2", "day": 4, "time": "01:00 PM", "title": "Laxmi Mishthan Bhandar (LMB) Heritage Lunch", "category": "dining", "location": "Johari Bazaar", "estimated_cost": 800.0, "booking_required": False},
                {"id": "d4-3", "day": 4, "time": "04:00 PM", "title": "Chauffeur Airport Transfer to JAI", "category": "transport", "location": "Hotel ⇄ JAI Airport", "estimated_cost": 800.0, "booking_required": True},
                {"id": "d4-4", "day": 4, "time": "07:00 PM", "title": f"Return Flight ({flight.get('airline', 'IndiGo Premier')})", "category": "travel", "location": "Jaipur (JAI) Flight", "estimated_cost": flt_cost, "booking_required": True}
            ]
        }
        day5 = {
            "day": 5,
            "day_title": "Galta Ji Stepwells & Sunset Departure",
            "items": [
                {"id": "d5-1", "day": 5, "time": "09:30 AM", "title": "Galta Ji Ancient Monkey Temple & Stepwells Tour", "category": "activity", "location": "Galta Hills", "estimated_cost": 900.0, "booking_required": True},
                {"id": "d5-2", "day": 5, "time": "01:30 PM", "title": "Farewell Rajasthani Thali Lunch", "category": "dining", "location": "Old City", "estimated_cost": 1200.0, "booking_required": False},
                {"id": "d5-3", "day": 5, "time": "04:30 PM", "title": "Chauffeur Transfer to JAI", "category": "transport", "location": "Hotel ⇄ Airport", "estimated_cost": 800.0, "booking_required": True},
                {"id": "d5-4", "day": 5, "time": "07:30 PM", "title": "Evening Return Flight", "category": "travel", "location": "JAI Flight", "estimated_cost": flt_cost, "booking_required": True}
            ]
        }

        if duration == 2:
            itinerary = [day1, day2_departure]
        elif duration == 3:
            day3_dep = dict(day3)
            day3_dep["items"].append({"id": "d3-4", "day": 3, "time": "06:00 PM", "title": f"Return Flight ({flight.get('airline', 'IndiGo')})", "category": "travel", "location": "JAI Flight", "estimated_cost": flt_cost, "booking_required": True})
            itinerary = [day1, day2, day3_dep]
        elif duration == 4:
            itinerary = [day1, day2, day3, day4]
        else:
            itinerary = [day1, day2, day3, day4, day5]

        return {"itinerary": itinerary}

    elif "goa" in dest_lower:
        all_possible_days = [
            {
                "day": 1,
                "day_title": "Arrival & Morjim Coastal Sunset",
                "items": [
                    {"id": "d1-1", "day": 1, "time": "10:30 AM", "title": "Arrival at Airport & Private EV Transfer", "category": "transport", "location": "Airport ⇄ Morjim", "estimated_cost": 1100.0, "booking_required": True},
                    {"id": "d1-2", "day": 1, "time": "01:30 PM", "title": f"Check-in at {hotel['name']}", "category": "hotel", "location": hotel.get("location", "North Goa"), "estimated_cost": nightly_hotel_cost, "booking_required": True},
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
                    {"id": "d4-3", "day": 4, "time": "03:30 PM", "title": "Executive EV Airport Transfer", "category": "transport", "location": "Resort ⇄ Airport", "estimated_cost": 1100.0, "booking_required": True},
                    {"id": "d4-4", "day": 4, "time": "06:00 PM", "title": f"Return Flight ({flight.get('airline', 'IndiGo / Vistara')})", "category": "travel", "location": "Flight Return", "estimated_cost": flt_cost, "booking_required": True}
                ]
            },
            {
                "day": 5,
                "day_title": "Coastal Cliff Hikes, Beach Relaxation & VIP Departure",
                "items": [
                    {"id": "d5-1", "day": 5, "time": "08:30 AM", "title": "Anjuna Coastal Cliff Yoga & Ocean Breeze", "category": "activity", "location": "Anjuna Cliff", "estimated_cost": 1200.0, "booking_required": True},
                    {"id": "d5-2", "day": 5, "time": "12:30 PM", "title": "Farewell Seafood Platter at Fisherman's Wharf", "category": "dining", "location": "Salcette", "estimated_cost": 1500.0, "booking_required": False},
                    {"id": "d5-3", "day": 5, "time": "04:30 PM", "title": "Executive Return EV Sedan Transfer", "category": "transport", "location": "Hotel ⇄ Airport", "estimated_cost": 1100.0, "booking_required": True},
                    {"id": "d5-4", "day": 5, "time": "07:30 PM", "title": "Evening Return Flight", "category": "travel", "location": "Flight Return", "estimated_cost": flt_cost, "booking_required": True}
                ]
            }
        ]

        if duration == 2:
            day1 = all_possible_days[0]
            day2_dep = {
                "day": 2,
                "day_title": "Brunch, Souvenirs & Departure",
                "items": [
                    {"id": "d2-1", "day": 2, "time": "09:30 AM", "title": "Resort Breakfast & Beach Walk", "category": "dining", "location": hotel['name'], "estimated_cost": 800.0, "booking_required": False},
                    {"id": "d2-2", "day": 2, "time": "11:30 AM", "title": "Fontainhas Latin Quarter Heritage Walk", "category": "activity", "location": "Panjim", "estimated_cost": 1200.0, "booking_required": True},
                    {"id": "d2-3", "day": 2, "time": "03:30 PM", "title": "Executive EV Airport Transfer", "category": "transport", "location": "Resort ⇄ Airport", "estimated_cost": 1100.0, "booking_required": True},
                    {"id": "d2-4", "day": 2, "time": "06:00 PM", "title": f"Return Flight ({flight.get('airline', 'IndiGo / Vistara')})", "category": "travel", "location": "Flight Return", "estimated_cost": flt_cost, "booking_required": True}
                ]
            }
            return {"itinerary": [day1, day2_dep]}
        else:
            return {"itinerary": all_possible_days[:min(len(all_possible_days), duration)]}

    else:
        # Generalized dynamic itinerary for ANY destination (Paris, Kyoto, Mumbai, etc.)
        itinerary = []
        for d in range(1, duration + 1):
            if d == 1:
                itinerary.append({
                    "day": 1,
                    "day_title": f"Arrival & {destination} Welcome Experience",
                    "items": [
                        {"id": f"d1-1", "day": 1, "time": "10:00 AM", "title": f"Arrival & Executive Airport Transfer to {destination}", "category": "transport", "location": f"Airport ⇄ {hotel['name']}", "estimated_cost": 1000.0, "booking_required": True},
                        {"id": f"d1-2", "day": 1, "time": "01:30 PM", "title": f"Check-in at {hotel['name']}", "category": "hotel", "location": hotel.get("location", destination), "estimated_cost": nightly_hotel_cost, "booking_required": True},
                        {"id": f"d1-3", "day": 1, "time": "05:00 PM", "title": f"Historic Highlights & Orientation Walk in {destination}", "category": "activity", "location": destination, "estimated_cost": 1200.0, "booking_required": True},
                        {"id": f"d1-4", "day": 1, "time": "08:00 PM", "title": f"Welcome Dinner & Chef Tasting in {destination}", "category": "dining", "location": destination, "estimated_cost": 1800.0, "booking_required": False}
                    ]
                })
            elif d == duration:
                itinerary.append({
                    "day": d,
                    "day_title": f"Local Discovery & VIP Departure from {destination}",
                    "items": [
                        {"id": f"d{d}-1", "day": d, "time": "09:30 AM", "title": f"Artisanal Breakfast & Souvenir Walk in {destination}", "category": "dining", "location": hotel['name'], "estimated_cost": 700.0, "booking_required": False},
                        {"id": f"d{d}-2", "day": d, "time": "01:00 PM", "title": f"Farewell Lunch at Curated {destination} Bistro", "category": "dining", "location": destination, "estimated_cost": 1200.0, "booking_required": False},
                        {"id": f"d{d}-3", "day": d, "time": "04:00 PM", "title": f"Executive Return Airport Transfer", "category": "transport", "location": f"{hotel['name']} ⇄ Airport", "estimated_cost": 1000.0, "booking_required": True},
                        {"id": f"d{d}-4", "day": d, "time": "07:00 PM", "title": f"Return Flight ({flight.get('airline', 'Premier Flight')})", "category": "travel", "location": f"{destination} Flight", "estimated_cost": flt_cost, "booking_required": True}
                    ]
                })
            else:
                itinerary.append({
                    "day": d,
                    "day_title": f"{destination} Cultural & Sightseeing Highlights (Day {d})",
                    "items": [
                        {"id": f"d{d}-1", "day": d, "time": "09:30 AM", "title": f"Morning Tour of Key Landmarks in {destination}", "category": "activity", "location": destination, "estimated_cost": 1200.0, "booking_required": True},
                        {"id": f"d{d}-2", "day": d, "time": "01:30 PM", "title": f"Local Gastronomy & Café Experience", "category": "dining", "location": destination, "estimated_cost": 1200.0, "booking_required": False},
                        {"id": f"d{d}-3", "day": d, "time": "05:00 PM", "title": f"Sunset Panorama & Evening Cultural Tour", "category": "activity", "location": destination, "estimated_cost": 1000.0, "booking_required": True}
                    ]
                })

        return {"itinerary": itinerary}

def prepare_recommendation_node(state: AgentState) -> Dict[str, Any]:
    user_budget = state.get("budget")
    total = float(state.get("estimated_total", 37800.0))
    is_exceeded = state.get("is_budget_exceeded", False)
    hotel = state["selected_hotel"]
    destination = state.get("destination", "Goa")
    duration = state.get("duration", 4)
    ai_mode = state.get("ai_mode", "demo")

    if user_budget is not None and is_exceeded:
        budget = float(user_budget)
        reasons = [
            f"Standard estimated cost is ₹{int(total):,}",
            f"Exceeds requested ceiling of ₹{int(budget):,} by ₹{int(total - budget):,}",
            "Consider increasing budget or adjusting to fewer activities"
        ]
        compromise_msg = f"Your ₹{int(budget):,} budget is unlikely to cover this {duration}-day {destination} itinerary with flights and accommodation. I found a baseline plan for ₹{int(total):,}, or we can reduce the number of activities."
    else:
        reasons = state.get("reasons", [
            f"Curated for your {duration}-day {destination} stay",
            f"Top-rated boutique accommodation ({hotel.get('rating', 4.8)}★)",
            f"Balanced dining, activities and seamless transport"
        ])
        compromise_msg = None

    approval_req = prepare_human_approval_request(
        action="BUILD_VOYAGE_TRIP",
        item_title=f"{destination} {duration}-Day Trip Package ({hotel['name']})",
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
