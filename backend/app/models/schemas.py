from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class AgentRunRequest(BaseModel):
    message: str = Field(..., description="User prompt or travel planning query")
    thread_id: Optional[str] = Field(None, description="Session thread ID for state checkpointing")
    user_id: Optional[str] = Field("advait_sharma", description="User ID for preference lookup")

class ResumeApprovalRequest(BaseModel):
    action: str = Field(..., description="Action to approve, e.g. APPROVE_ITINERARY or BOOK_HOTEL")
    approved: bool = Field(True, description="Whether user approved the step")
    payload: Optional[Dict[str, Any]] = None

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
    requested_budget: float
    remaining_buffer: float

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
    action: str
    item: str
    amount: float
    currency: str = "INR"

class AgentRunResponse(BaseModel):
    thread_id: str
    status: str  # "completed" | "budget_warning" | "in_progress" | "error"
    destination: str
    duration_days: int
    budget: float
    currency: str = "INR"
    estimated_total: float
    remaining_budget: float
    breakdown: CostBreakdownSchema
    reasons: List[str]
    itinerary: List[Dict[str, Any]]
    agent_events: List[AgentEventSchema]
    step_progress: List[StepProgressSchema]
    requires_approval: bool = False
    approval_request: Optional[ApprovalRequestSchema] = None
    is_budget_exceeded: bool = False
    compromise_message: Optional[str] = None
    data_source_notice: str = "Prices shown from simulated external travel providers"
    optimization_attempts: int = 0
    ai_mode: str = Field("demo", description="Active AI mode: 'llm', 'demo', or 'fallback'")
    error: Optional[str] = None
