from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict, total=False):
    thread_id: Optional[str]
    request: str
    intent: str  # "trip_planning" | "flight_search" | "hotel_search" | "restaurant_search" | "activity_search" | "transport_search" | "follow_up" | "general_travel"
    destination: str
    origin: str
    departure_date: Optional[str]
    return_date: Optional[str]
    duration: Optional[int]
    duration_days: Optional[int]
    budget: Optional[float]  # Overall trip budget ceiling
    total_budget_update: Optional[float]
    travelers: Optional[int]  # Number of people travelling
    budget_envelopes: Dict[str, float]  # Granular category envelopes: hotel, flights, dining, activities, transport
    budget_updates: Optional[Dict[str, Optional[float]]]
    hotel_budget: Optional[float]
    flight_budget: Optional[float]
    dining_budget: Optional[float]
    activity_budget: Optional[float]
    transport_budget: Optional[float]
    is_cheaper_request: Optional[bool]
    cheaper_category: Optional[str]
    duration_changed: Optional[bool]
    category_updated_this_turn: Optional[str]
    category_status: Dict[str, str]  # Status per category: e.g. {"hotel": "New hotel selected", "dining": "Budget updated"}
    currency: str
    travel_style: str
    interests: List[str]
    preferences: Dict[str, Any]
    home_address: Optional[Dict[str, Any]]
    home_city: Optional[str]
    
    # Conversational Clarification State
    status: Optional[str]  # "completed" | "needs_input" | "budget_warning" | "awaiting_approval"
    missing_fields: Optional[List[str]]
    question: Optional[str]
    needs_clarification: Optional[bool]

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

    search_results: Optional[Dict[str, Any]]

    estimated_total: float
    remaining_budget: float

    itinerary: List[Dict[str, Any]]
    reasons: List[str]

    agent_events: List[Dict[str, Any]]
    step_progress: List[Dict[str, Any]]
    provider_summary: Dict[str, Any]

    # Payment & Spend Guardrails State
    payment_status: str  # "not_started" | "awaiting_approval" | "pending" | "approved" | "processing" | "paid" | "failed" | "cancelled" | "rejected"
    payment_amount: float
    payment_currency: str
    payment_reference: str
    requires_approval: bool
    approval_status: Optional[str]  # "pending" | "approved" | "rejected" | "blocked_by_guardrails"
    approval_reason: Optional[str]
    approval_request: Optional[Dict[str, Any]]
    spend_guardrail_result: Optional[Dict[str, Any]]
    payment_order: Optional[Dict[str, Any]]
    payment_confirmation: Optional[Dict[str, Any]]

    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    booking_status: Optional[str]  # "not_started" | "processing" | "confirmed" | "failed"

    payment_id: Optional[str]
    optimization_attempts: int
    is_budget_exceeded: bool
    compromise_message: Optional[str]

    # Proactive Travel Disruption State
    disruption_detected: Optional[bool]
    disruption_type: Optional[str]
    disruption_event: Optional[Dict[str, Any]]
    disruption_reason: Optional[str]
    disruption_timestamp: Optional[str]
    affected_item_id: Optional[str]
    affected_item: Optional[Dict[str, Any]]
    affected_downstream_items: Optional[List[Dict[str, Any]]]
    replacement_options: Optional[List[Dict[str, Any]]]
    selected_replacement: Optional[Dict[str, Any]]
    itinerary_changes: Optional[List[Dict[str, Any]]]
    additional_cost: Optional[float]
    original_item_cost: Optional[float]
    replacement_cost: Optional[float]
    budget_impact: Optional[Dict[str, Any]]
    recovery_status: Optional[str]  # "detected" | "analyzing_impact" | "searching_alternatives" | "budget_evaluated" | "ready_for_review" | "approved" | "rejected" | "unresolved"
    user_notified: Optional[bool]
    recovery_recommendation: Optional[Dict[str, Any]]
    is_simulation: Optional[bool]

    ai_mode: str  # "llm" | "demo" | "fallback"
    error: Optional[str]
