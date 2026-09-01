import uuid
import datetime
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field

class DisruptionType:
    FLIGHT_CANCELLED = "flight_cancelled"
    FLIGHT_DELAYED = "flight_delayed"
    HOTEL_CANCELLED = "hotel_cancelled"
    HOTEL_UNAVAILABLE = "hotel_unavailable"
    ACTIVITY_CANCELLED = "activity_cancelled"
    RESTAURANT_CANCELLED = "restaurant_cancelled"
    TRANSPORT_CANCELLED = "transport_cancelled"
    SCHEDULE_CHANGED = "schedule_changed"

class DisruptionEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"disp-{uuid.uuid4().hex[:8]}")
    event_type: str  # DisruptionType
    provider: str = "Voyage Disruption Feed"
    booking_id: Optional[str] = None
    item_id: Optional[str] = None
    category: str = "flight"  # "flight" | "hotel" | "activity" | "restaurant" | "transport"
    reason: str = "Unforeseen operational schedule cancellation"
    original_departure: Optional[str] = None
    original_arrival: Optional[str] = None
    delay_minutes: Optional[int] = 0
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now().strftime("%H:%M"))
    is_simulation: bool = True
    raw_payload: Optional[Dict[str, Any]] = None

def normalize_disruption_event(raw_data: Dict[str, Any]) -> DisruptionEvent:
    """
    Normalizes provider disruption events, webhooks, or simulations into a uniform DisruptionEvent structure.
    Keeps provider-specific payload idiosyncrasies out of the core LangGraph reasoning nodes.
    """
    evt_type = (raw_data.get("type") or raw_data.get("event_type") or DisruptionType.FLIGHT_CANCELLED).lower()
    
    # Map common aliases
    if "flight" in evt_type:
        category = "flight"
        if "delay" in evt_type:
            evt_type = DisruptionType.FLIGHT_DELAYED
        else:
            evt_type = DisruptionType.FLIGHT_CANCELLED
    elif "hotel" in evt_type or "stay" in evt_type:
        category = "hotel"
        if "unavail" in evt_type:
            evt_type = DisruptionType.HOTEL_UNAVAILABLE
        else:
            evt_type = DisruptionType.HOTEL_CANCELLED
    elif "activity" in evt_type or "tour" in evt_type or "experience" in evt_type:
        category = "activity"
        evt_type = DisruptionType.ACTIVITY_CANCELLED
    elif "restaurant" in evt_type or "dining" in evt_type or "food" in evt_type:
        category = "restaurant"
        evt_type = DisruptionType.RESTAURANT_CANCELLED
    elif "transport" in evt_type or "cab" in evt_type or "transfer" in evt_type:
        category = "transport"
        evt_type = DisruptionType.TRANSPORT_CANCELLED
    else:
        category = "flight"
        evt_type = DisruptionType.FLIGHT_CANCELLED

    reason = raw_data.get("reason")
    if not reason:
        if evt_type == DisruptionType.FLIGHT_CANCELLED:
            reason = "Flight cancelled by airline due to aircraft maintenance & airspace congestion"
        elif evt_type == DisruptionType.FLIGHT_DELAYED:
            delay = raw_data.get("delay_minutes", 180)
            reason = f"Flight delayed by {delay} minutes due to technical turnaround"
        elif evt_type in [DisruptionType.HOTEL_CANCELLED, DisruptionType.HOTEL_UNAVAILABLE]:
            reason = "Hotel booking unavailable due to emergency maintenance at property"
        elif evt_type == DisruptionType.ACTIVITY_CANCELLED:
            reason = "Activity cancelled due to seasonal weather & water safety advisory"
        elif evt_type == DisruptionType.RESTAURANT_CANCELLED:
            reason = "Dining reservation cancelled due to private event booking"
        elif evt_type == DisruptionType.TRANSPORT_CANCELLED:
            reason = "Transport pickup cancelled due to vehicle breakdown"
        else:
            reason = "Schedule change notified by partner provider"

    now_str = datetime.datetime.now().strftime("%H:%M")

    return DisruptionEvent(
        event_id=raw_data.get("event_id") or f"disp-{uuid.uuid4().hex[:8]}",
        event_type=evt_type,
        provider=raw_data.get("provider", "Voyage Simulated Webhook Feed"),
        booking_id=raw_data.get("booking_id"),
        item_id=raw_data.get("item_id"),
        category=category,
        reason=reason,
        original_departure=raw_data.get("original_departure"),
        original_arrival=raw_data.get("original_arrival"),
        delay_minutes=raw_data.get("delay_minutes", 0),
        timestamp=raw_data.get("timestamp") or now_str,
        is_simulation=bool(raw_data.get("is_simulation", True)),
        raw_payload=raw_data
    )

def parse_time_to_minutes(time_str: str) -> int:
    """Converts a standard 12-hour time string like '10:30 AM' or '05:30 PM' to minutes from midnight."""
    if not time_str:
        return 540  # Default 09:00 AM
    try:
        t = datetime.datetime.strptime(time_str.strip().upper(), "%I:%M %p")
        return t.hour * 60 + t.minute
    except Exception:
        pass
    try:
        t = datetime.datetime.strptime(time_str.strip(), "%H:%M")
        return t.hour * 60 + t.minute
    except Exception:
        return 540

def format_minutes_to_time(minutes: int) -> str:
    """Converts minutes from midnight back to 'hh:mm AM/PM'."""
    hrs = (minutes // 60) % 24
    mins = minutes % 60
    d = datetime.time(hrs, mins)
    return d.strftime("%I:%M %p")
