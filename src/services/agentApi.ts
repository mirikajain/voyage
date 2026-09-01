/**
 * Voyage AI Agent Backend API Client
 * Connects the React Frontend to the Python FastAPI + LangGraph Agent Backend
 * Supports Real Travel APIs, Gemini Reasoning, Spend Guardrails, and Razorpay Checkout
 */

export interface BackendStepProgress {
  id: string;
  label: string;
  status: 'waiting' | 'active' | 'complete';
  active_description?: string;
  completed_description?: string;
}

export interface BackendAgentEvent {
  id: string;
  timestamp: string;
  event: string;
  category: 'system' | 'tool' | 'budget' | 'complete';
}

export interface BackendCostBreakdown {
  hotel_name: string;
  hotel_cost: number;
  dining_cost: number;
  activities_cost: number;
  transport_cost: number;
  travel_cost: number;
  total_estimated_cost: number;
  requested_budget?: number | null;
  remaining_buffer: number;
  hotel_source?: string;
  hotel_is_live?: boolean;
  travel_source?: string;
  travel_is_live?: boolean;
  budget_envelopes?: Record<string, number>;
  category_status?: Record<string, string>;
}

export interface BackendItineraryItem {
  id: string;
  day: number;
  time?: string;
  title: string;
  category: string;
  location?: string;
  estimated_cost: number;
  booking_required?: boolean;
}

export interface BackendItineraryDay {
  day: number;
  day_title: string;
  items: BackendItineraryItem[];
}

export interface BackendApprovalRequest {
  action: string;
  item: string;
  amount: number;
  currency: string;
  payment_reference: string;
  requires_approval: boolean;
  approval_reason: string;
  budget?: number | null;
  remaining_buffer: number;
  gateway?: string;
}

export interface BackendSearchResults {
  type: string;
  query_title: string;
  items: any[];
  total_count: number;
  provider: string;
  is_live: boolean;
}

export interface BackendRazorpayOrder {
  order_id: string;
  amount_in_paise: number;
  amount_in_rupees: number;
  currency: string;
  status: string;
  payment_reference: string;
  key_id?: string;
  mode: string;
  merchant_name?: string;
  notes?: Record<string, any>;
}

export interface BackendPaymentConfirmation {
  payment_id: string;
  order_id: string;
  payment_reference: string;
  booking_reference: string;
  amount: number;
  currency: string;
  status: 'paid' | 'failed' | 'cancelled';
  timestamp: string;
  method: string;
  receipt?: string;
}

export interface BackendSpendGuardrailResult {
  allowed: boolean;
  requires_approval: boolean;
  reason: string;
  budget_ceiling?: number | null;
  requested_amount: number;
  remaining_buffer: number;
  is_budget_exceeded: boolean;
  autonomous_limit: number;
  ask_before_purchase: boolean;
}

export interface BackendDisruptionItemChange {
  item_id?: string;
  day?: number;
  action: 'replaced' | 'rescheduled' | 'cancelled';
  original_title?: string;
  new_title?: string;
  original_cost?: number;
  new_cost?: number;
  original_time?: string;
  new_time?: string;
  description?: string;
}

export interface BackendDisruptionRecovery {
  disruption_detected: boolean;
  disruption_type: string;
  disruption_reason: string;
  disruption_timestamp: string;
  is_simulation: boolean;
  affected_item?: any;
  affected_downstream_items?: any[];
  selected_replacement?: any;
  replacement_options?: any[];
  itinerary_changes?: BackendDisruptionItemChange[];
  additional_cost: number;
  original_item_cost: number;
  replacement_cost: number;
  price_difference: number;
  recovery_status: 'ready_for_review' | 'approved' | 'rejected' | 'unresolved';
  requires_approval: boolean;
}

export interface BackendAgentResponse {
  thread_id: string;
  status: 'completed' | 'needs_input' | 'budget_warning' | 'awaiting_approval' | 'in_progress' | 'error';
  intent: 'trip_planning' | 'flight_search' | 'hotel_search' | 'restaurant_search' | 'activity_search' | 'transport_search' | 'general_travel';
  destination?: string | null;
  origin?: string | null;
  departure_date?: string | null;
  return_date?: string | null;
  duration_days?: number | null;
  travelers?: number | null;
  budget?: number | null;
  budget_envelopes?: Record<string, number>;
  category_status?: Record<string, string>;
  currency: string;
  estimated_total?: number | null;
  remaining_budget?: number | null;
  breakdown?: BackendCostBreakdown | null;
  reasons?: string[];
  itinerary?: BackendItineraryDay[];
  search_results?: BackendSearchResults | null;
  agent_events: BackendAgentEvent[];
  step_progress: BackendStepProgress[];
  provider_summary?: Record<string, any>;
  
  // Conversational Clarification Layer
  missing_fields?: string[] | null;
  question?: string | null;

  // Financial & Approval Layer
  requires_approval: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected' | 'blocked_by_guardrails' | null;
  approval_request?: BackendApprovalRequest | null;
  payment_status: 'not_started' | 'awaiting_approval' | 'approved' | 'paid' | 'failed' | 'cancelled' | 'rejected';
  booking_status?: 'not_started' | 'processing' | 'confirmed' | 'failed' | null;
  payment_amount?: number | null;
  payment_reference?: string | null;
  payment_order?: BackendRazorpayOrder | null;
  payment_confirmation?: BackendPaymentConfirmation | null;
  spend_guardrail_result?: BackendSpendGuardrailResult | null;

  // Proactive Travel Disruption Layer
  disruption_recovery?: BackendDisruptionRecovery | null;
  
  is_budget_exceeded: boolean;
  compromise_message?: string;
  data_source_notice: string;
  optimization_attempts: number;
  ai_mode?: 'llm' | 'demo' | 'fallback';
  error?: string;
}

const API_BASE_URL = '/api/agent';

export async function runAgent(
  message: string,
  threadId?: string
): Promise<BackendAgentResponse> {
  const response = await fetch(`${API_BASE_URL}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      thread_id: threadId,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Agent backend error (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function resumeAgentApproval(
  threadId: string,
  approved: boolean,
  simulateFailure: boolean = false
): Promise<BackendAgentResponse> {
  const response = await fetch(`${API_BASE_URL}/${threadId}/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      approved,
      simulate_failure: simulateFailure,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to resume agent approval (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function approveAgentWorkflow(
  threadId: string
): Promise<BackendAgentResponse> {
  const response = await fetch(`${API_BASE_URL}/${threadId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to approve workflow (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function rejectAgentWorkflow(
  threadId: string
): Promise<BackendAgentResponse> {
  const response = await fetch(`${API_BASE_URL}/${threadId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to reject workflow (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function createPaymentOrder(payload: {
  amount: number;
  currency?: string;
  thread_id?: string;
  receipt?: string;
  notes?: Record<string, any>;
}): Promise<{
  order_id: string;
  amount_in_paise: number;
  amount_in_rupees: number;
  currency: string;
  status: string;
  key_id?: string;
  mode?: string;
  merchant_name?: string;
}> {
  const response = await fetch('/api/payment/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create payment order (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function verifyPaymentSignature(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  thread_id?: string;
  amount?: number;
  currency?: string;
}): Promise<{
  verified: boolean;
  status: string;
  booking_status: string;
  message: string;
  payment_id: string;
  order_id: string;
  booking_reference?: string;
  agent_response?: BackendAgentResponse;
}> {
  const response = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Payment verification failed (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function confirmPayment(
  threadId: string,
  payload: {
    order_id: string;
    payment_id: string;
    payment_reference?: string;
    amount: number;
    currency?: string;
    status?: string;
  }
): Promise<BackendAgentResponse> {
  const response = await fetch(`${API_BASE_URL}/${threadId}/confirm_payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to confirm payment (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function simulateDisruption(
  threadId: string,
  payload: {
    type: string;
    item_id?: string;
    reason?: string;
    delay_minutes?: number;
    is_simulation?: boolean;
  }
): Promise<BackendAgentResponse> {
  const response = await fetch(`${API_BASE_URL}/${threadId}/simulate-disruption`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to simulate disruption (${response.status}): ${errText}`);
  }

  return response.json();
}

export async function resolveDisruption(
  threadId: string,
  payload: {
    approved: boolean;
    selected_replacement_id?: string;
  }
): Promise<BackendAgentResponse> {
  const response = await fetch(`${API_BASE_URL}/${threadId}/resolve-disruption`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to resolve disruption (${response.status}): ${errText}`);
  }

  return response.json();
}


