/**
 * Voyage AI Agent Backend API Client
 * Connects the React Frontend to the Python FastAPI + LangGraph Agent Backend (Real Travel APIs + Gemini)
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
}

export interface BackendAgentResponse {
  thread_id: string;
  status: 'completed' | 'budget_warning' | 'in_progress' | 'error';
  destination: string;
  duration_days: number;
  budget?: number | null;
  currency: string;
  estimated_total: number;
  remaining_budget: number;
  breakdown: BackendCostBreakdown;
  reasons: string[];
  itinerary: BackendItineraryDay[];
  agent_events: BackendAgentEvent[];
  step_progress: BackendStepProgress[];
  provider_summary?: Record<string, any>;
  requires_approval: boolean;
  approval_request?: BackendApprovalRequest | null;
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

export async function getAgentState(threadId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/${threadId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch thread state for ${threadId}`);
  }
  return response.json();
}

export async function resumeAgent(
  threadId: string,
  approval: { action: string; approved: boolean }
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/${threadId}/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(approval),
  });

  if (!response.ok) {
    throw new Error(`Failed to resume agent thread ${threadId}`);
  }
  return response.json();
}
