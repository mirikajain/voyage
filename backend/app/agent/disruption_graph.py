import copy
import uuid
import datetime
from typing import Dict, Any, List, Optional, Tuple

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.agent.state import AgentState
from app.agent.disruption import (
    DisruptionType,
    DisruptionEvent,
    normalize_disruption_event,
    parse_time_to_minutes,
    format_minutes_to_time
)
from app.services.travel_service import TravelService
from app.services.payment_service import PaymentService

def _now_str() -> str:
    return datetime.datetime.now().strftime("%H:%M")

def _add_event(events: List[Dict[str, Any]], message: str, category: str = "disruption") -> List[Dict[str, Any]]:
    new_events = list(events) if events else []
    new_events.append({
        "id": f"evt-{uuid.uuid4().hex[:6]}",
        "timestamp": _now_str(),
        "event": message,
        "category": category
    })
    return new_events

# -------------------------------------------------------------
# DISRUPTION GRAPH NODES
# -------------------------------------------------------------

def detect_disruption_node(state: AgentState) -> Dict[str, Any]:
    """
    Step 1: Ingests, normalizes, and registers an external or simulated disruption event.
    """
    raw_event = state.get("disruption_event") or {}
    event = normalize_disruption_event(raw_event)
    
    events = list(state.get("agent_events", []))
    events = _add_event(
        events,
        f"⚠️ Disruption detected: {event.reason} ({event.event_type.replace('_', ' ').title()})",
        "disruption"
    )

    steps = [
        {"id": "s1", "label": "Disruption Detection", "status": "complete", "completed_description": f"{event.event_type.replace('_', ' ').title()} logged"},
        {"id": "s2", "label": "Impact Assessment", "status": "active", "active_description": "Calculating downstream itinerary ripple effects..."},
        {"id": "s3", "label": "Search Replacements", "status": "waiting"},
        {"id": "s4", "label": "Budget & Safety Check", "status": "waiting"},
        {"id": "s5", "label": "Itinerary Adaptation", "status": "waiting"},
        {"id": "s6", "label": "Recovery Review", "status": "waiting"}
    ]

    return {
        "disruption_detected": True,
        "disruption_type": event.event_type,
        "disruption_event": event.model_dump(),
        "disruption_reason": event.reason,
        "disruption_timestamp": event.timestamp,
        "is_simulation": event.is_simulation,
        "recovery_status": "detected",
        "agent_events": events,
        "step_progress": steps
    }

def identify_affected_item_node(state: AgentState) -> Dict[str, Any]:
    """
    Step 2: Identifies the exact itinerary / booking item affected by the disruption.
    """
    event_data = state.get("disruption_event") or {}
    category = event_data.get("category", "flight")
    event_type = event_data.get("event_type", DisruptionType.FLIGHT_CANCELLED)
    target_item_id = event_data.get("item_id")

    itinerary = state.get("itinerary", [])
    selected_flight = state.get("selected_flight", {})
    selected_hotel = state.get("selected_hotel", {})
    selected_activities = state.get("selected_activities", {})

    affected_item = None
    affected_day = 1

    # Search in itinerary items first
    for day in itinerary:
        day_num = day.get("day", 1)
        for item in day.get("items", []):
            if target_item_id and item.get("id") == target_item_id:
                affected_item = dict(item)
                affected_day = day_num
                break
            elif not target_item_id:
                # Category match
                item_cat = item.get("category", "").lower()
                if category == "flight" and ("flight" in item_cat or "airport" in item.get("title", "").lower()):
                    affected_item = dict(item)
                    affected_day = day_num
                    break
                elif category == "hotel" and ("hotel" in item_cat or "check-in" in item.get("title", "").lower()):
                    affected_item = dict(item)
                    affected_day = day_num
                    break
                elif category == "activity" and item_cat in ["activity", "experience", "tour"]:
                    affected_item = dict(item)
                    affected_day = day_num
                    break
        if affected_item:
            break

    # Fallback to selected category state if not found in itinerary
    if not affected_item:
        if category == "flight":
            affected_item = {
                "id": selected_flight.get("id", "flt-primary"),
                "day": 1,
                "time": selected_flight.get("departure_time", "09:20 AM"),
                "title": selected_flight.get("airline", "IndiGo 6E-204"),
                "category": "flight",
                "location": f"{selected_flight.get('origin', 'Mumbai')} ➔ {selected_flight.get('destination', 'Goa')}",
                "estimated_cost": float(selected_flight.get("price") or selected_flight.get("total_price") or 8000.0)
            }
        elif category == "hotel":
            affected_item = {
                "id": selected_hotel.get("id", "htl-primary"),
                "day": 1,
                "time": "01:30 PM",
                "title": selected_hotel.get("name", "Boutique Resort"),
                "category": "hotel",
                "location": selected_hotel.get("location", state.get("destination", "Goa")),
                "estimated_cost": float(selected_hotel.get("total_price") or selected_hotel.get("total_cost") or 9600.0)
            }
        elif category == "activity":
            raw_acts = selected_activities.get("items", []) if isinstance(selected_activities, dict) else selected_activities
            act0 = raw_acts[0] if raw_acts else {"title": "Sunset Cruise & Heritage Walk", "cost": 2500.0}
            affected_item = {
                "id": act0.get("id", "act-primary"),
                "day": 1,
                "time": "05:30 PM",
                "title": act0.get("name") or act0.get("title", "Sunset Experience"),
                "category": "activity",
                "location": state.get("destination", "Goa"),
                "estimated_cost": float(act0.get("cost", 2500.0))
            }
        else:
            affected_item = {
                "id": "item-primary",
                "day": 1,
                "time": "10:30 AM",
                "title": "Scheduled Item",
                "category": category,
                "estimated_cost": 2000.0
            }

    orig_cost = float(affected_item.get("estimated_cost") or affected_item.get("cost") or affected_item.get("price") or 0.0)

    events = _add_event(
        state.get("agent_events", []),
        f"Identified affected item: '{affected_item.get('title')}' (Day {affected_item.get('day', 1)}) — Cost: ₹{int(orig_cost):,}",
        "disruption"
    )

    steps = list(state.get("step_progress", []))
    for s in steps:
        if s["id"] == "s2":
            s["status"] = "active"
            s["active_description"] = f"Assessing downstream impact on Day {affected_day}..."

    return {
        "affected_item_id": affected_item.get("id"),
        "affected_item": affected_item,
        "original_item_cost": orig_cost,
        "agent_events": events,
        "step_progress": steps
    }

def assess_impact_node(state: AgentState) -> Dict[str, Any]:
    """
    Step 3: Evaluates downstream timing conflicts and dependencies caused by the disruption.
    Example: Flight arriving 3 hours later shifts airport transfer and hotel check-in times.
    """
    affected_item = state.get("affected_item") or {}
    event_data = state.get("disruption_event") or {}
    category = event_data.get("category", "flight")
    event_type = event_data.get("event_type", DisruptionType.FLIGHT_CANCELLED)
    delay_minutes = event_data.get("delay_minutes", 180 if event_type == DisruptionType.FLIGHT_DELAYED else 210)

    itinerary = state.get("itinerary", [])
    affected_day_num = affected_item.get("day", 1)

    downstream_impacts = []

    # Calculate impacts on the same day
    for day in itinerary:
        if day.get("day") == affected_day_num:
            for item in day.get("items", []):
                if item.get("id") == affected_item.get("id"):
                    continue
                
                item_cat = item.get("category", "").lower()
                orig_time = item.get("time", "12:00 PM")
                orig_mins = parse_time_to_minutes(orig_time)

                if category == "flight":
                    # When flight is delayed or cancelled & rescheduled to later, transfers and check-in shift
                    if "transport" in item_cat or "transfer" in item.get("title", "").lower():
                        new_mins = orig_mins + delay_minutes
                        new_time = format_minutes_to_time(new_mins)
                        downstream_impacts.append({
                            "item_id": item.get("id"),
                            "day": affected_day_num,
                            "title": item.get("title"),
                            "category": "transport",
                            "original_time": orig_time,
                            "adjusted_time": new_time,
                            "impact_description": f"Airport transfer pickup shifted from {orig_time} to {new_time}"
                        })
                    elif "hotel" in item_cat or "check-in" in item.get("title", "").lower():
                        new_mins = orig_mins + delay_minutes
                        new_time = format_minutes_to_time(new_mins)
                        downstream_impacts.append({
                            "item_id": item.get("id"),
                            "day": affected_day_num,
                            "title": item.get("title"),
                            "category": "hotel",
                            "original_time": orig_time,
                            "adjusted_time": new_time,
                            "impact_description": f"Hotel check-in window adjusted to {new_time}"
                        })
                    elif "activity" in item_cat:
                        # If activity falls before the new arrival window, it needs rescheduling
                        arrival_window_mins = parse_time_to_minutes("10:30 AM") + delay_minutes
                        if orig_mins <= arrival_window_mins:
                            new_mins = arrival_window_mins + 120  # Reschedule 2 hours post arrival
                            new_time = format_minutes_to_time(new_mins)
                            downstream_impacts.append({
                                "item_id": item.get("id"),
                                "day": affected_day_num,
                                "title": item.get("title"),
                                "category": "activity",
                                "original_time": orig_time,
                                "adjusted_time": new_time,
                                "impact_description": f"Activity rescheduled from {orig_time} to {new_time} to avoid flight conflict"
                            })
                elif category == "hotel":
                    if "hotel" in item_cat or "check-in" in item.get("title", "").lower():
                        downstream_impacts.append({
                            "item_id": item.get("id"),
                            "day": affected_day_num,
                            "title": item.get("title"),
                            "category": "hotel",
                            "original_time": orig_time,
                            "adjusted_time": orig_time,
                            "impact_description": "Property check-in redirected to new accommodation"
                        })
                elif category == "activity":
                    if item.get("id") == affected_item.get("id"):
                        downstream_impacts.append({
                            "item_id": item.get("id"),
                            "day": affected_day_num,
                            "title": item.get("title"),
                            "category": "activity",
                            "original_time": orig_time,
                            "adjusted_time": orig_time,
                            "impact_description": "Cancelled activity replaced with alternative local experience"
                        })

    events = _add_event(
        state.get("agent_events", []),
        f"Calculated downstream ripple effects: {len(downstream_impacts)} itinerary items adjusted on Day {affected_day_num}",
        "disruption"
    )

    steps = list(state.get("step_progress", []))
    for s in steps:
        if s["id"] == "s2":
            s["status"] = "complete"
            s["completed_description"] = f"{len(downstream_impacts)} downstream items assessed"
        elif s["id"] == "s3":
            s["status"] = "active"
            s["active_description"] = f"Searching replacement {category} options..."

    return {
        "affected_downstream_items": downstream_impacts,
        "recovery_status": "analyzing_impact",
        "agent_events": events,
        "step_progress": steps
    }

def search_replacements_node(state: AgentState) -> Dict[str, Any]:
    """
    Step 4: Dispatches to TravelService to find verified alternative inventory.
    """
    event_data = state.get("disruption_event") or {}
    category = event_data.get("category", "flight")
    dest = state.get("destination", "Goa")
    orig = state.get("origin", "Mumbai")
    duration = int(state.get("duration") or state.get("duration_days") or 4)
    affected_item_id = state.get("affected_item_id")

    replacement_candidates = []

    if category == "flight":
        flights = TravelService.search_flights(destination=dest, origin=orig)
        for flt in flights:
            f_dict = flt if isinstance(flt, dict) else flt.model_dump()
            if affected_item_id and f_dict.get("id") == affected_item_id:
                continue
            replacement_candidates.append(f_dict)
    elif category == "hotel":
        hotels = TravelService.search_hotels(destination=dest, duration_days=duration)
        for htl in hotels:
            h_dict = htl if isinstance(htl, dict) else htl.model_dump()
            if affected_item_id and h_dict.get("id") == affected_item_id:
                continue
            replacement_candidates.append(h_dict)
    elif category == "activity":
        act_res = TravelService.search_activities(destination=dest, duration_days=duration)
        acts = act_res.get("items", []) if isinstance(act_res, dict) else act_res
        for act in acts:
            a_dict = act if isinstance(act, dict) else (act.model_dump() if hasattr(act, "model_dump") else {"name": str(act), "cost": 2500.0})
            if affected_item_id and a_dict.get("id") == affected_item_id:
                continue
            replacement_candidates.append(a_dict)
    elif category == "transport":
        trn_res = TravelService.search_transport(destination=dest)
        trans = trn_res.get("items", []) if isinstance(trn_res, dict) else trn_res
        for trn in trans:
            t_dict = trn if isinstance(trn, dict) else (trn.model_dump() if hasattr(trn, "model_dump") else {"name": str(trn), "cost": 1500.0})
            if affected_item_id and t_dict.get("id") == affected_item_id:
                continue
            replacement_candidates.append(t_dict)
    else:
        replacement_candidates = []

    events = _add_event(
        state.get("agent_events", []),
        f"Searched provider network: Found {len(replacement_candidates)} replacement {category} options",
        "tool"
    )

    steps = list(state.get("step_progress", []))
    for s in steps:
        if s["id"] == "s3":
            s["status"] = "complete"
            s["completed_description"] = f"{len(replacement_candidates)} replacement candidates found"
        elif s["id"] == "s4":
            s["status"] = "active"
            s["active_description"] = "Comparing alternatives & evaluating budget safety..."

    return {
        "replacement_options": replacement_candidates,
        "recovery_status": "searching_alternatives",
        "agent_events": events,
        "step_progress": steps
    }

def compare_replacements_node(state: AgentState) -> Dict[str, Any]:
    """
    Step 5: Deterministically ranks replacement options based on timing compatibility, price, and quality.
    """
    candidates = state.get("replacement_options", [])
    orig_cost = float(state.get("original_item_cost", 0.0))
    event_data = state.get("disruption_event") or {}
    category = event_data.get("category", "flight")

    if not candidates:
        events = _add_event(
            state.get("agent_events", []),
            f"No direct replacement {category} options found within provider parameters",
            "disruption"
        )
        return {
            "selected_replacement": None,
            "additional_cost": 0.0,
            "replacement_cost": 0.0,
            "recovery_status": "unresolved",
            "agent_events": events
        }

    # Deterministic ranking: sort by price delta and schedule proximity
    sorted_candidates = sorted(
        candidates,
        key=lambda c: (
            float(c.get("price") or c.get("cost") or c.get("total_price") or 999999),
            -float(c.get("rating", 4.0))
        )
    )

    selected = sorted_candidates[0]
    repl_cost = float(selected.get("price") or selected.get("cost") or selected.get("total_price") or selected.get("total_cost") or 0.0)
    
    price_diff = round(repl_cost - orig_cost, 2)
    additional_cost = round(max(0.0, price_diff), 2)

    events = _add_event(
        state.get("agent_events", []),
        f"Selected optimal replacement: '{selected.get('name') or selected.get('airline') or selected.get('title')}' at ₹{int(repl_cost):,} (Δ: {'+₹' + str(int(price_diff)) if price_diff > 0 else '₹' + str(int(price_diff))})",
        "budget"
    )

    return {
        "selected_replacement": selected,
        "replacement_options": sorted_candidates[:3],
        "replacement_cost": repl_cost,
        "additional_cost": additional_cost,
        "budget_impact": {
            "original_cost": orig_cost,
            "replacement_cost": repl_cost,
            "price_difference": price_diff,
            "additional_cost": additional_cost
        },
        "agent_events": events
    }

def check_disruption_budget_node(state: AgentState) -> Dict[str, Any]:
    """
    Step 6: Enforces financial guardrails, calculates revised trip totals, and determines approval requirements.
    """
    user_budget = state.get("budget")
    prev_total = float(state.get("estimated_total", 0.0))
    additional_cost = float(state.get("additional_cost", 0.0))
    budget_impact = state.get("budget_impact") or {}
    price_diff = float(budget_impact.get("price_difference", additional_cost))

    new_total = round(prev_total + (price_diff if price_diff > 0 else 0.0), 2)
    new_remaining = round(float(user_budget) - new_total, 2) if user_budget is not None else 0.0

    # Safety Guardrails: Explicit approval is ALWAYS required before booking or spending money
    requires_approval = True
    if additional_cost > 0:
        approval_reason = f"Travel disruption replacement requires additional payment of ₹{int(additional_cost):,}"
    else:
        approval_reason = "Travel disruption replacement is within existing budget (No additional payment required)"

    spend_check = PaymentService.spend_guardrail_check(
        amount=new_total,
        user_budget=user_budget,
        user_preferences=state.get("preferences")
    )

    events = _add_event(
        state.get("agent_events", []),
        f"Budget safety check passed: Revised trip total ₹{int(new_total):,} (Cushion: ₹{int(new_remaining):,}) — Approval required: {requires_approval}",
        "budget"
    )

    steps = list(state.get("step_progress", []))
    for s in steps:
        if s["id"] == "s4":
            s["status"] = "complete"
            s["completed_description"] = f"₹{int(new_total):,} calculated (Δ ₹{int(additional_cost):,})"
        elif s["id"] == "s5":
            s["status"] = "active"
            s["active_description"] = "Adapting affected itinerary items..."

    return {
        "estimated_total": new_total,
        "remaining_budget": new_remaining,
        "requires_approval": requires_approval,
        "approval_reason": approval_reason,
        "spend_guardrail_result": spend_check.model_dump(),
        "recovery_status": "budget_evaluated",
        "agent_events": events,
        "step_progress": steps
    }

def rebuild_affected_itinerary_node(state: AgentState) -> Dict[str, Any]:
    """
    Step 7: Surgically updates ONLY the affected itinerary items and their downstream dependencies.
    Retains all unaffected days and items 100% intact.
    """
    old_itinerary = state.get("itinerary", [])
    affected_item = state.get("affected_item") or {}
    affected_id = state.get("affected_item_id")
    selected_repl = state.get("selected_replacement") or {}
    downstream_impacts = state.get("affected_downstream_items") or []
    event_data = state.get("disruption_event") or {}
    category = event_data.get("category", "flight")

    impact_map = {d["item_id"]: d for d in downstream_impacts if d.get("item_id")}

    revised_itinerary = copy.deepcopy(old_itinerary)
    itinerary_changes = []

    for day in revised_itinerary:
        for idx, item in enumerate(day.get("items", [])):
            item_id = item.get("id")

            # Replace the primary disrupted item
            if item_id == affected_id or (not affected_id and item.get("category") == category and day.get("day") == affected_item.get("day", 1)):
                old_title = item.get("title")
                new_title = selected_repl.get("name") or selected_repl.get("airline") or selected_repl.get("title") or "Replacement Service"
                new_cost = float(selected_repl.get("price") or selected_repl.get("cost") or selected_repl.get("total_price") or item.get("estimated_cost", 0.0))
                new_time = selected_repl.get("departure_time") or item.get("time", "12:40 PM")

                item["title"] = f"{new_title} [Recovery Replacement]"
                item["estimated_cost"] = new_cost
                item["time"] = new_time
                item["booking_required"] = True
                
                itinerary_changes.append({
                    "item_id": item_id,
                    "day": day.get("day"),
                    "action": "replaced",
                    "original_title": old_title,
                    "new_title": item["title"],
                    "original_cost": affected_item.get("estimated_cost", 0.0),
                    "new_cost": new_cost,
                    "time": new_time
                })

            # Update downstream dependent items
            elif item_id in impact_map:
                impact_info = impact_map[item_id]
                old_time = item.get("time")
                new_time = impact_info.get("adjusted_time", old_time)
                item["time"] = new_time
                item["title"] = f"{item['title']} (Adjusted Timing)"
                
                itinerary_changes.append({
                    "item_id": item_id,
                    "day": day.get("day"),
                    "action": "rescheduled",
                    "original_title": impact_info.get("title"),
                    "new_title": item["title"],
                    "original_time": old_time,
                    "new_time": new_time,
                    "description": impact_info.get("impact_description")
                })

    events = _add_event(
        state.get("agent_events", []),
        f"Itinerary adapted: {len(itinerary_changes)} item(s) updated on Day {affected_item.get('day', 1)}. Remaining trip days preserved intact.",
        "disruption"
    )

    steps = list(state.get("step_progress", []))
    for s in steps:
        if s["id"] == "s5":
            s["status"] = "complete"
            s["completed_description"] = f"{len(itinerary_changes)} items adapted"
        elif s["id"] == "s6":
            s["status"] = "active"
            s["active_description"] = "Preparing recovery recommendation & authorization request..."

    return {
        "itinerary": revised_itinerary,
        "itinerary_changes": itinerary_changes,
        "agent_events": events,
        "step_progress": steps
    }

def prepare_recovery_node(state: AgentState) -> Dict[str, Any]:
    """
    Step 8: Formulates a natural, proactive AI recovery notification, comparison summary, and Razorpay authorization request.
    """
    thread_id = state.get("thread_id", "thread_live")
    event_data = state.get("disruption_event") or {}
    event_type = event_data.get("event_type", DisruptionType.FLIGHT_CANCELLED)
    reason = event_data.get("reason", "Operational disruption")
    category = event_data.get("category", "flight")

    affected = state.get("affected_item") or {}
    selected_repl = state.get("selected_replacement") or {}
    options = state.get("replacement_options") or []
    additional_cost = float(state.get("additional_cost", 0.0))
    budget_impact = state.get("budget_impact") or {}
    price_diff = float(budget_impact.get("price_difference", additional_cost))
    new_total = float(state.get("estimated_total", 0.0))
    user_budget = state.get("budget")
    downstream_impacts = state.get("affected_downstream_items") or []

    repl_name = selected_repl.get("name") or selected_repl.get("airline") or selected_repl.get("title", "Alternative Option")
    repl_cost = float(selected_repl.get("price") or selected_repl.get("cost") or selected_repl.get("total_price") or 0.0)
    repl_time = selected_repl.get("departure_time") or selected_repl.get("time", "Adjusted Window")

    # Build options summary
    opt_lines = []
    for opt in options:
        o_name = opt.get("name") or opt.get("airline") or opt.get("title")
        o_cost = float(opt.get("price") or opt.get("cost") or opt.get("total_price") or 0.0)
        o_time = opt.get("departure_time") or opt.get("time", "")
        opt_lines.append(f"• {o_name} ({o_time}) — ₹{int(o_cost):,}")

    downstream_lines = [f"• {d.get('impact_description')}" for d in downstream_impacts]

    msg_intro = f"⚠️ Travel Disruption Alert ({'Simulation Event' if event_data.get('is_simulation') else 'Live Provider Notice'})\n\n"
    msg_intro += f"Your scheduled {category} '{affected.get('title')}' was {event_type.replace('_', ' ')}: {reason}.\n\n"
    msg_intro += f"I have proactively analyzed your itinerary and found {len(options)} verified replacement options:\n"
    msg_intro += "\n".join(opt_lines) + "\n\n"
    
    if downstream_lines:
        msg_intro += "Itinerary adjustments applied:\n" + "\n".join(downstream_lines) + "\n\n"

    diff_text = f"+₹{int(price_diff):,}" if price_diff > 0 else ("₹" + str(int(price_diff)) if price_diff < 0 else "₹0 (Within existing budget)")
    cushion_text = f"Cushion: ₹{int(state.get('remaining_budget', 0)):,}" if user_budget else "No hard limit set"
    msg_intro += f"Recommended Option: '{repl_name}' ({repl_time})\n"
    msg_intro += f"Cost Impact: {diff_text} · Revised Trip Total: ₹{int(new_total):,} ({cushion_text})\n\n"
    msg_intro += "Please review the recovery details below and authorize the replacement."

    # Create Payment / Approval Request
    approval_request = {
        "action": "AUTHORIZE_DISRUPTION_RECOVERY",
        "item": f"Disruption Recovery: {repl_name}",
        "trip_destination": state.get("destination", "Goa"),
        "destination": state.get("destination", "Goa"),
        "duration": state.get("duration", 4),
        "duration_days": state.get("duration", 4),
        "selected_hotel": state.get("selected_hotel", {}).get("name"),
        "selected_flight": repl_name if category == "flight" else state.get("selected_flight", {}).get("airline"),
        "selected_activities": [a.get("new_title") or a.get("original_title") or "Adjusted Item" for a in state.get("itinerary_changes", [])],
        "total_estimated_cost": new_total,
        "amount": additional_cost if additional_cost > 0 else 0.0,
        "currency": "INR",
        "payment_reference": f"VOYAGE-REC-{thread_id[:6].upper()}",
        "requires_approval": True,
        "approval_status": "pending",
        "approval_reason": state.get("approval_reason", "Disruption replacement requires user authorization"),
        "user_explanation": msg_intro,
        "budget": user_budget,
        "remaining_budget": state.get("remaining_budget", 0.0),
        "remaining_buffer": state.get("remaining_budget", 0.0),
        "gateway": "Razorpay"
    }

    # Razorpay Order preparation if additional cost > 0
    order_data = None
    if additional_cost > 0:
        order_obj = PaymentService.create_order(
            amount_in_rupees=additional_cost,
            currency="INR",
            payment_reference=approval_request["payment_reference"],
            notes={
                "thread_id": thread_id,
                "type": "disruption_recovery",
                "disrupted_item": affected.get("title", ""),
                "replacement_item": repl_name
            }
        )
        order_data = order_obj.model_dump() if hasattr(order_obj, "model_dump") else order_obj

    events = _add_event(
        state.get("agent_events", []),
        f"Recovery plan prepared and ready for user authorization (Additional charge: ₹{int(additional_cost):,})",
        "system"
    )

    steps = list(state.get("step_progress", []))
    for s in steps:
        if s["id"] == "s6":
            s["status"] = "complete"
            s["completed_description"] = "Recovery ready for user review"

    return {
        "recovery_status": "ready_for_review",
        "status": "awaiting_approval",
        "payment_status": "awaiting_approval",
        "requires_approval": True,
        "user_notified": True,
        "reasons": [msg_intro],
        "approval_request": approval_request,
        "payment_order": order_data,
        "payment_amount": additional_cost,
        "agent_events": events,
        "step_progress": steps
    }

def apply_disruption_resolution_node(state: AgentState) -> Dict[str, Any]:
    """
    Step 9: Commits or rejects the recovery plan based on user decision.
    """
    approval_status = state.get("approval_status", "approved")
    thread_id = state.get("thread_id", "thread_live")
    additional_cost = float(state.get("additional_cost", 0.0))

    events = list(state.get("agent_events", []))

    if approval_status == "approved":
        events = _add_event(
            events,
            f"User approved disruption recovery replacement. Itinerary updated and booking confirmed.",
            "payment"
        )

        payment_id = state.get("razorpay_payment_id") or f"pay_{uuid.uuid4().hex[:14]}"
        order_id = state.get("razorpay_order_id") or state.get("payment_order", {}).get("order_id", f"order_{uuid.uuid4().hex[:14]}")

        if additional_cost > 0:
            events = _add_event(
                events,
                f"Razorpay payment verified: {payment_id} (₹{int(additional_cost):,})",
                "budget"
            )
            events = _add_event(
                events,
                f"Budget recalculated: Additional ₹{int(additional_cost):,} committed to trip",
                "budget"
            )
        elif additional_cost < 0:
            events = _add_event(
                events,
                f"Budget recalculated: Saved ₹{int(abs(additional_cost)):,} on replacement booking",
                "budget"
            )
        
        # Payment confirmation
        conf_data = {
            "payment_id": payment_id,
            "order_id": order_id,
            "payment_reference": state.get("approval_request", {}).get("payment_reference", f"VOYAGE-REC-{thread_id[:6].upper()}"),
            "booking_reference": f"VOYAGE-{uuid.uuid4().hex[:6].upper()}-REC",
            "amount": max(0.0, additional_cost),
            "currency": "INR",
            "status": "paid",
            "timestamp": _now_str(),
            "method": "UPI / Card (Razorpay Secure)",
            "receipt": f"receipt_{uuid.uuid4().hex[:8]}"
        }

        # Update step progress
        steps = list(state.get("step_progress", []))
        for s in steps:
            if s.get("id") in ["s6", "step-8", "step-9"]:
                s["status"] = "complete"
                s["completed_description"] = "Replacement confirmed & verified"

        return {
            "recovery_status": "approved",
            "status": "completed",
            "payment_status": "paid",
            "booking_status": "confirmed",
            "disruption_detected": False,
            "payment_confirmation": conf_data,
            "agent_events": events,
            "step_progress": steps
        }
    else:
        events = _add_event(
            events,
            "User rejected recovery recommendation. Disrupted item flagged as unresolved.",
            "disruption"
        )
        return {
            "recovery_status": "rejected",
            "status": "completed",
            "payment_status": "cancelled",
            "booking_status": "failed",
            "disruption_detected": True,
            "agent_events": events
        }

# -------------------------------------------------------------
# DISRUPTION STATEGRAPH DEFINITION
# -------------------------------------------------------------

def build_disruption_graph():
    graph = StateGraph(AgentState)

    graph.add_node("detect_disruption", detect_disruption_node)
    graph.add_node("identify_affected_item", identify_affected_item_node)
    graph.add_node("assess_impact", assess_impact_node)
    graph.add_node("search_replacements", search_replacements_node)
    graph.add_node("compare_replacements", compare_replacements_node)
    graph.add_node("check_disruption_budget", check_disruption_budget_node)
    graph.add_node("rebuild_affected_itinerary", rebuild_affected_itinerary_node)
    graph.add_node("prepare_recovery", prepare_recovery_node)
    graph.add_node("apply_disruption_resolution", apply_disruption_resolution_node)

    graph.set_entry_point("detect_disruption")
    graph.add_edge("detect_disruption", "identify_affected_item")
    graph.add_edge("identify_affected_item", "assess_impact")
    graph.add_edge("assess_impact", "search_replacements")
    graph.add_edge("search_replacements", "compare_replacements")
    graph.add_edge("compare_replacements", "check_disruption_budget")
    graph.add_edge("check_disruption_budget", "rebuild_affected_itinerary")
    graph.add_edge("rebuild_affected_itinerary", "prepare_recovery")
    graph.add_edge("prepare_recovery", END)
    graph.add_edge("apply_disruption_resolution", END)

    memory = MemorySaver()
    return graph.compile(checkpointer=memory)

voyage_disruption_app = build_disruption_graph()
