from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    request: str
    destination: str
    origin: str
    dates: str
    duration: int
    budget: float
    currency: str
    travel_style: str
    interests: List[str]
    preferences: Dict[str, Any]

    flight_options: List[Dict[str, Any]]
    hotel_options: List[Dict[str, Any]]
    restaurant_options: Dict[str, Any]
    activity_options: Dict[str, Any]
    transport_options: Dict[str, Any]

    selected_flight: Dict[str, Any]
    selected_hotel: Dict[str, Any]
    selected_restaurants: Dict[str, Any]
    selected_activities: Dict[str, Any]
    selected_transport: Dict[str, Any]

    estimated_total: float
    remaining_budget: float

    itinerary: List[Dict[str, Any]]
    reasons: List[str]

    agent_events: List[Dict[str, Any]]
    step_progress: List[Dict[str, Any]]

    requires_approval: bool
    approval_request: Optional[Dict[str, Any]]

    payment_status: str
    payment_id: Optional[str]

    optimization_attempts: int
    is_budget_exceeded: bool
    compromise_message: Optional[str]

    ai_mode: str  # "llm" | "demo" | "fallback"
    error: Optional[str]
