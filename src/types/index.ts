export type NavigationPage = 'home' | 'concierge' | 'trips' | 'explore' | 'wallet' | 'profile';

export type ExploreCategory = 'hotels' | 'flights' | 'restaurants' | 'activities' | 'transport';

export type AgentStepStatus = 'waiting' | 'active' | 'complete';

export interface TripCostBreakdown {
  hotelName: string;
  hotelCost: number;
  diningCost: number;
  activitiesCost: number;
  transportCost: number;
  travelCost: number;
  totalEstimatedCost: number;
  requestedBudget: number;
  remainingBuffer: number;
  hotelSource?: string;
  hotelIsLive?: boolean;
  travelSource?: string;
  travelIsLive?: boolean;
  budgetEnvelopes?: Record<string, number>;
  categoryStatus?: Record<string, string>;
}

export interface ItineraryItem {
  time?: string;
  title: string;
  location?: string;
  cost: number;
  category: 'hotel' | 'food' | 'dining' | 'activity' | 'transport' | 'travel';
}

export interface ItineraryDay {
  dayNumber: number;
  dayTitle: string;
  items: ItineraryItem[];
}

export interface SearchResultItem {
  id: string;
  airline?: string;
  flight_number?: string;
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
  status?: string;
  stops?: number;
  name?: string;
  location?: string;
  rating?: number;
  cuisine?: string;
  category?: string;
  cost?: number;
  price?: number;
  total_price?: number;
  currency?: string;
  source?: string;
  is_live?: boolean;
  amenities?: string[];
  image?: string;
}

export interface SearchResultsData {
  type: string;  // "flights" | "hotels" | "restaurants" | "activities"
  query_title: string;
  items: SearchResultItem[];
  total_count: number;
  provider: string;
  is_live: boolean;
}

export interface SpendGuardrailResult {
  allowed: boolean;
  requires_approval: boolean;
  reason: string;
  budget_ceiling?: number;
  requested_amount: number;
  remaining_buffer: number;
  is_budget_exceeded: boolean;
  autonomous_limit?: number;
  ask_before_purchase?: boolean;
}

export interface RazorpayOrderData {
  order_id: string;
  amount_in_paise: number;
  amount_in_rupees: number;
  currency: string;
  status: string;
  payment_reference: string;
  key_id?: string;
  mode: string;
  merchant_name?: string;
}

export interface PaymentConfirmationData {
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

export interface ApprovalRequestData {
  action: string;
  item: string;
  amount: number;
  currency: string;
  payment_reference: string;
  requires_approval: boolean;
  approval_reason: string;
  budget?: number;
  remaining_buffer: number;
  gateway?: string;
}

export interface DisruptionItemChange {
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

export interface DisruptionRecoveryData {
  disruption_detected: boolean;
  disruption_type: string;
  disruption_reason: string;
  disruption_timestamp: string;
  is_simulation: boolean;
  affected_item?: any;
  affected_downstream_items?: any[];
  selected_replacement?: any;
  replacement_options?: any[];
  itinerary_changes?: DisruptionItemChange[];
  additional_cost: number;
  original_item_cost: number;
  replacement_cost: number;
  price_difference: number;
  recovery_status: 'ready_for_review' | 'approved' | 'rejected' | 'unresolved';
  requires_approval: boolean;
}

export interface AgentRecommendationResult {
  id: string;
  thread_id?: string;
  planTitle: string;
  intent?: 'trip_planning' | 'flight_search' | 'hotel_search' | 'restaurant_search' | 'activity_search' | 'transport_search' | 'general_travel';
  destination: string;
  origin?: string;
  departureDate?: string;
  returnDate?: string;
  durationDays: number;
  travelers?: number;
  breakdown: TripCostBreakdown;
  reasons: string[];
  itinerary: ItineraryDay[];
  searchResults?: SearchResultsData;
  budgetEnvelopes?: Record<string, number>;
  categoryStatus?: Record<string, string>;
  
  // Phase 5 Financial & Approval Layer
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'blocked_by_guardrails';
  approvalRequest?: ApprovalRequestData;
  paymentStatus?: 'not_started' | 'preparing' | 'awaiting_approval' | 'approved' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'rejected';
  bookingStatus?: 'not_started' | 'processing' | 'confirmed' | 'failed';
  paymentAmount?: number;
  paymentReference?: string;
  paymentOrder?: RazorpayOrderData;
  paymentConfirmation?: PaymentConfirmationData;
  spendGuardrailResult?: SpendGuardrailResult;

  // Proactive Travel Disruption Layer
  disruptionRecovery?: DisruptionRecoveryData;

  isBudgetExceeded: boolean;
  compromiseMessage?: string;
  dataSourceNotice: string;
  optimizationAttempts?: number;
  aiMode?: 'llm' | 'demo' | 'fallback';
  providerSummary?: Record<string, any>;
}

export interface AgentWorkflowStep {
  id: string;
  label: string;
  status: AgentStepStatus;
  activeDescription?: string;
  completedDescription?: string;
}

export interface AgentActivityLogItem {
  id: string;
  timestamp: string;
  event: string;
  category?: 'system' | 'tool' | 'budget' | 'complete' | 'disruption';
}

export interface Trip {
  id: string;
  destination: string;
  country: string;
  image: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalBudget: number;
  amountSpent: number;
  currency: string;
  status: 'Upcoming' | 'Active Planning' | 'Past' | 'Booked';
  travelVibe: string;
  bookingReference?: string;
  paymentReference?: string;
  paymentStatus?: string;
  flightDetails?: {
    airline: string;
    flightNumber: string;
    departure: string;
    arrival: string;
  };
  hotelDetails?: {
    name: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
  };
  itinerary: {
    day: number;
    title: string;
    items: ItineraryItem[];
  }[];
}

export interface VoyageInsight {
  id: string;
  type: 'budget' | 'logistics' | 'savings';
  headline: string;
  subtext: string;
  badgeText: string;
  impactValue?: string;
  isActionable?: boolean;
  actionLabel?: string;
}

export interface ExploreItem {
  id: string;
  category: ExploreCategory;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  priceUnit: string;
  image: string;
  shortDescription: string;
  tags: string[];
  matchScore: number;
  aiEvaluation: {
    whyRecommended: string[];
    itineraryFit: string;
    budgetImpact: string;
  };
}

export interface SpendingCategoryItem {
  name: string;
  spent: number;
  allocated: number;
  percentage: number;
  color: string;
}

export interface Transaction {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  currency: string;
  status: 'Settled' | 'Pending' | 'Auto-Reserved';
  razorpayPaymentId?: string;
  method: string;
}

export interface HomeAddress {
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface UserPreferences {
  name: string;
  email: string;
  avatar: string;
  travelStyle: string[];
  preferredDestinations: string[];
  foodPreferences: string[];
  typicalTripBudget: number;
  currency: string;
  homeAddress?: HomeAddress;
  totalSpent?: number;
  totalBudget?: number;
  transactions?: Transaction[];
  aiPreferences: {
    askBeforePurchases: boolean;
    alertBudgetRisks: boolean;
    suggestItineraryChanges: boolean;
    autoOptimizeRecommendations: boolean;
  };
  paymentPreferences: {
    preferredMethod: string;
    savedCards: {
      id: string;
      brand: string;
      last4: string;
      expiry: string;
      holderName: string;
      isDefault: boolean;
    }[];
    savedUpi: {
      id: string;
      upiId: string;
      provider: string;
      isDefault: boolean;
    }[];
  };
}

export interface RecommendationProposal {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  distance: string;
  location: string;
  image: string;
  reasons: string[];
  savingsAmount?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  recommendation?: RecommendationProposal | AgentRecommendationResult;
  isBudgetWarning?: boolean;
  quickPrompts?: string[];
}
