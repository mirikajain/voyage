from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.payment_schemas import (
    SpendGuardrailResult,
    RazorpayOrderSchema,
    PaymentConfirmationSchema
)

class AgentRunRequest(BaseModel):
    message: str = Field(..., description="User prompt or travel planning query")
    thread_id: Optional[str] = Field(None, description="Session thread ID for state checkpointing")
    user_id: Optional[str] = Field("advait_sharma", description="User ID for preference lookup")

class ResumeApprovalRequest(BaseModel):
    approved: bool = Field(True, description="Whether user approved or rejected the payment authorization")
    simulate_failure: Optional[bool] = Field(False, description="Simulate a Razorpay payment failure scenario")
    payment_id: Optional[str] = Field(None, description="Payment ID if pre-authorized")
    payload: Optional[Dict[str, Any]] = None

class ConfirmPaymentRequest(BaseModel):
    order_id: str = Field(..., description="Razorpay Order ID")
    payment_id: str = Field(..., description="Razorpay Payment ID")
    payment_reference: Optional[str] = Field(None, description="Voyage Payment Reference")
    amount: float = Field(..., description="Amount paid in INR")
    currency: str = Field("INR", description="Currency code")
    status: str = Field("paid", description="Status: 'paid' | 'failed' | 'cancelled'")

class ItineraryItemSchema(BaseModel):
    id: str
    day: int
    time: Optional[str] = None
    title: str
    category: str
    location: Optional[str] = None
    estimated_cost: float
    booking_required: bool = False

class CostBreakdownSchema(BaseModel):
    hotel_name: str
    hotel_cost: float
    dining_cost: float
    activities_cost: float
    transport_cost: float
    travel_cost: float
    total_estimated_cost: float
    requested_budget: Optional[float] = None
    remaining_buffer: float = 0.0
    hotel_source: str = "Voyage Demo Provider"
    hotel_is_live: bool = False
    travel_source: str = "Voyage Demo Provider"
    travel_is_live: bool = False
    budget_envelopes: Optional[Dict[str, float]] = None
    category_status: Optional[Dict[str, str]] = None

class AgentEventSchema(BaseModel):
    id: str
    timestamp: str
    event: str
    category: str = "system"

class StepProgressSchema(BaseModel):
    id: str
    label: str
    status: str  # "waiting" | "active" | "complete"
    active_description: Optional[str] = None
    completed_description: Optional[str] = None

class ApprovalRequestSchema(BaseModel):
    action: str = "BUILD_VOYAGE_TRIP"
    item: str
    trip_destination: Optional[str] = None
    destination: Optional[str] = None
    duration: Optional[int] = None
    duration_days: Optional[int] = None
    selected_hotel: Optional[str] = None
    selected_flight: Optional[str] = None
    selected_activities: Optional[List[str]] = Field(default_factory=list)
    total_estimated_cost: Optional[float] = None
    amount: float
    currency: str = "INR"
    payment_reference: str
    requires_approval: bool = True
    approval_status: Optional[str] = "pending"
    approval_reason: str = "Travel purchase requires explicit user authorization before charge"
    user_explanation: Optional[str] = None
    budget: Optional[float] = None
    remaining_budget: Optional[float] = 0.0
    remaining_buffer: float = 0.0
    budget_envelopes: Optional[Dict[str, float]] = None
    gateway: str = "Razorpay"

class SearchResultsSchema(BaseModel):
    type: str  # "flights" | "hotels" | "restaurants" | "activities"
    query_title: str
    items: List[Dict[str, Any]]
    total_count: int
    provider: str
    is_live: bool

class SimulateDisruptionRequest(BaseModel):
    type: str = Field("flight_cancelled", description="Disruption type: 'flight_cancelled', 'flight_delayed', 'hotel_cancelled', 'activity_cancelled', 'transport_cancelled'")
    item_id: Optional[str] = Field(None, description="Optional specific itinerary item ID to disrupt")
    reason: Optional[str] = Field(None, description="Custom reason for disruption")
    delay_minutes: Optional[int] = Field(180, description="Delay duration in minutes if flight_delayed")
    is_simulation: bool = Field(True, description="Always marked true for simulated events")

class ResolveDisruptionRequest(BaseModel):
    approved: bool = Field(True, description="Whether user approved or rejected the recovery plan")
    selected_replacement_id: Optional[str] = Field(None, description="Optional alternative replacement selected by user")

class DisruptionItemChangeSchema(BaseModel):
    item_id: Optional[str] = None
    day: Optional[int] = None
    action: str  # "replaced" | "rescheduled" | "cancelled"
    original_title: Optional[str] = None
    new_title: Optional[str] = None
    original_cost: Optional[float] = None
    new_cost: Optional[float] = None
    original_time: Optional[str] = None
    new_time: Optional[str] = None
    description: Optional[str] = None

class DisruptionRecoverySchema(BaseModel):
    disruption_detected: bool = True
    disruption_type: str
    disruption_reason: str
    disruption_timestamp: str
    is_simulation: bool = True
    affected_item: Optional[Dict[str, Any]] = None
    affected_downstream_items: List[Dict[str, Any]] = Field(default_factory=list)
    selected_replacement: Optional[Dict[str, Any]] = None
    replacement_options: List[Dict[str, Any]] = Field(default_factory=list)
    itinerary_changes: List[DisruptionItemChangeSchema] = Field(default_factory=list)
    additional_cost: float = 0.0
    original_item_cost: float = 0.0
    replacement_cost: float = 0.0
    price_difference: float = 0.0
    recovery_status: str = "ready_for_review"  # "ready_for_review" | "approved" | "rejected" | "unresolved"
    requires_approval: bool = True

class AgentRunResponse(BaseModel):
    thread_id: str
    status: str  # "completed" | "needs_input" | "budget_warning" | "awaiting_approval" | "in_progress" | "error"
    intent: str = Field("trip_planning", description="Active intent: 'trip_planning', 'flight_search', 'hotel_search', 'restaurant_search', 'activity_search', 'follow_up'")
    destination: Optional[str] = None
    origin: Optional[str] = None
    departure_date: Optional[str] = None
    return_date: Optional[str] = None
    duration_days: Optional[int] = None
    travelers: Optional[int] = None
    budget: Optional[float] = None
    budget_envelopes: Optional[Dict[str, float]] = None
    category_status: Optional[Dict[str, str]] = None
    currency: str = "INR"
    estimated_total: Optional[float] = 0.0
    remaining_budget: Optional[float] = 0.0
    breakdown: Optional[CostBreakdownSchema] = None
    reasons: Optional[List[str]] = Field(default_factory=list)
    itinerary: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    search_results: Optional[SearchResultsSchema] = None
    agent_events: List[AgentEventSchema] = Field(default_factory=list)
    step_progress: List[StepProgressSchema] = Field(default_factory=list)
    provider_summary: Dict[str, Any] = Field(default_factory=dict)
    
    # Conversational Clarification Layer
    missing_fields: Optional[List[str]] = None
    question: Optional[str] = None

    # Financial and Approval Layer
    requires_approval: bool = False
    approval_status: Optional[str] = "pending"
    approval_reason: Optional[str] = None
    approval_request: Optional[ApprovalRequestSchema] = None
    payment_status: str = Field("not_started", description="Status: 'not_started' | 'awaiting_approval' | 'approved' | 'paid' | 'failed' | 'cancelled' | 'rejected'")
    booking_status: Optional[str] = Field("not_started", description="Booking status: 'not_started' | 'processing' | 'confirmed' | 'failed'")
    payment_amount: Optional[float] = None
    payment_reference: Optional[str] = None
    payment_order: Optional[RazorpayOrderSchema] = None
    payment_confirmation: Optional[PaymentConfirmationSchema] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    spend_guardrail_result: Optional[SpendGuardrailResult] = None

    # Proactive Travel Disruption Layer
    disruption_recovery: Optional[DisruptionRecoverySchema] = None
    
    is_budget_exceeded: bool = False
    compromise_message: Optional[str] = None
    data_source_notice: str = "Prices shown from simulated external travel providers"
    optimization_attempts: int = 0
    ai_mode: str = Field("demo", description="Active AI mode: 'llm', 'demo', or 'fallback'")
    error: Optional[str] = None
