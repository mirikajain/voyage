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

export interface AgentRecommendationResult {
  id: string;
  planTitle: string;
  destination: string;
  durationDays: number;
  breakdown: TripCostBreakdown;
  reasons: string[];
  itinerary: ItineraryDay[];
  isBudgetExceeded: boolean;
  compromiseMessage?: string;
  dataSourceNotice: string;
  aiMode?: 'llm' | 'demo' | 'fallback';
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
  category?: 'system' | 'tool' | 'budget' | 'complete';
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
  status: 'Upcoming' | 'Active Planning' | 'Past';
  travelVibe: string;
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

export interface UserPreferences {
  name: string;
  email: string;
  avatar: string;
  travelStyle: string[];
  preferredDestinations: string[];
  foodPreferences: string[];
  typicalTripBudget: number;
  currency: string;
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
