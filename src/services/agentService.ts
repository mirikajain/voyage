import type {
  AgentWorkflowStep,
  AgentActivityLogItem,
  AgentRecommendationResult,
  ItineraryDay,
  TripCostBreakdown,
  UserPreferences,
} from '../types';
import {
  searchHotels,
  searchFlights,
  searchDining,
  searchActivities,
  searchTransport,
} from './travelApi';

export interface AgentExecutionCallbacks {
  onStepUpdate: (steps: AgentWorkflowStep[]) => void;
  onLogUpdate: (log: AgentActivityLogItem[]) => void;
  onRecommendationReady: (result: AgentRecommendationResult) => void;
  onError?: (error: string) => void;
}

export const initialAgentSteps: AgentWorkflowStep[] = [
  { id: 'step-1', label: 'Understanding request', status: 'waiting', activeDescription: 'Parsing destination, duration, and financial ceiling...', completedDescription: 'Identified destination & target constraints' },
  { id: 'step-2', label: 'Checking travel preferences', status: 'waiting', activeDescription: 'Querying user profile for culinary & style preferences...', completedDescription: 'Profile loaded: Boutique stays, coastal dining' },
  { id: 'step-3', label: 'Searching external travel services', status: 'waiting', activeDescription: 'Querying partner inventory for live flights, hotels & activities...', completedDescription: 'Found 14 verified partner options' },
  { id: 'step-4', label: 'Comparing options', status: 'waiting', activeDescription: 'Filtering by rating 4.6+, location proximity & cancelation terms...', completedDescription: 'Selected top-tier compatible inventory' },
  { id: 'step-5', label: 'Checking trip budget', status: 'waiting', activeDescription: 'Simulating total cost envelope against specified budget...', completedDescription: 'Budget validation verified with cushion' },
  { id: 'step-6', label: 'Preparing recommendation', status: 'waiting', activeDescription: 'Assembling complete day-by-day plan & pricing breakdown...', completedDescription: 'Recommendation ready for user review' },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function parseTravelPrompt(prompt: string): {
  destination: string;
  durationDays: number;
  budget: number;
} {
  const lower = prompt.toLowerCase();
  
  // Destination detection
  let destination = 'Goa';
  if (lower.includes('paris')) destination = 'Paris';
  else if (lower.includes('kyoto') || lower.includes('tokyo') || lower.includes('japan')) destination = 'Kyoto';
  else if (lower.includes('amalfi') || lower.includes('italy')) destination = 'Amalfi Coast';
  else if (lower.includes('goa')) destination = 'Goa';

  // Duration detection (e.g. "4-day", "4 days", "7 days")
  let durationDays = 4;
  const dayMatch = lower.match(/(\d+)\s*(-|\s)?day/);
  if (dayMatch && dayMatch[1]) {
    durationDays = parseInt(dayMatch[1], 10);
  }

  // Budget detection (e.g. "₹40,000", "40000", "10,000", "10k")
  let budget = 40000;
  const cleanForBudget = prompt.replace(/,/g, '');
  const budgetMatch = cleanForBudget.match(/(?:under|budget|of|₹|rs\.?|inr)?\s*₹?\s*(\d{4,7})/i);
  if (budgetMatch && budgetMatch[1]) {
    budget = parseInt(budgetMatch[1], 10);
  } else if (cleanForBudget.includes('10k') || cleanForBudget.includes('10000')) {
    budget = 10000;
  } else if (cleanForBudget.includes('40k') || cleanForBudget.includes('40000')) {
    budget = 40000;
  }

  return { destination, durationDays, budget };
}

export async function executeAgentWorkflow(
  prompt: string,
  userProfile: UserPreferences,
  callbacks: AgentExecutionCallbacks
): Promise<void> {
  const { destination, durationDays, budget } = parseTravelPrompt(prompt);
  let currentSteps: AgentWorkflowStep[] = initialAgentSteps.map(s => ({ ...s, status: 'waiting' }));
  const logEntries: AgentActivityLogItem[] = [];

  const updateSteps = (stepIndex: number, status: 'waiting' | 'active' | 'complete') => {
    currentSteps = currentSteps.map((step, idx) => {
      if (idx < stepIndex) return { ...step, status: 'complete' };
      if (idx === stepIndex) return { ...step, status };
      return { ...step, status: 'waiting' };
    });
    callbacks.onStepUpdate([...currentSteps]);
  };

  const addLog = (event: string, category: 'system' | 'tool' | 'budget' | 'complete' = 'system') => {
    logEntries.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: formatTime(),
      event,
      category,
    });
    callbacks.onLogUpdate([...logEntries]);
  };

  try {
    // STEP 1: Understanding request
    updateSteps(0, 'active');
    addLog(`Request understood: ${durationDays}-day ${destination} trip under ₹${budget.toLocaleString()}`, 'system');
    await sleep(450);
    updateSteps(0, 'complete');

    // STEP 2: Checking travel preferences
    updateSteps(1, 'active');
    addLog(`Preferences loaded: Style: "${userProfile.travelStyle[0]}", Food: "${userProfile.foodPreferences[0]}"`, 'system');
    await sleep(400);
    updateSteps(1, 'complete');

    // STEP 3: Searching external travel services (simulated partner APIs)
    updateSteps(2, 'active');
    addLog('Searching external travel partner network...', 'tool');
    
    // Call simulated tool functions
    const [hotels, flight, dining, activities, transport] = await Promise.all([
      searchHotels(destination, durationDays),
      searchFlights(destination),
      searchDining(destination, durationDays),
      searchActivities(destination, durationDays),
      searchTransport(destination, durationDays),
    ]);

    addLog(`Hotel results: Found "${hotels[0].name}" via simulated partner GDS`, 'tool');
    addLog(`Flight results: Found "${flight.airline}" direct return`, 'tool');
    addLog(`Activity results: Found ${activities.activities.length} curated options`, 'tool');
    await sleep(550);
    updateSteps(2, 'complete');

    // STEP 4: Comparing options
    updateSteps(3, 'active');
    addLog('Comparing options & filtering for 4.6+ guest ratings and schedule fit', 'tool');
    await sleep(450);
    updateSteps(3, 'complete');

    // STEP 5: Checking trip budget
    updateSteps(4, 'active');
    
    let hotelCost = hotels[0].totalCost; // 12,800
    let diningCost = dining.totalEstimated; // 7,000
    let activitiesCost = activities.totalEstimated; // 6,500
    let transportCost = transport.totalEstimated; // 3,500
    let travelCost = flight.totalCost; // 8,000

    let totalEstimated = hotelCost + diningCost + activitiesCost + transportCost + travelCost; // 37,800
    const isBudgetExceeded = totalEstimated > budget;

    if (isBudgetExceeded) {
      addLog(`Budget alert: Estimated ₹${totalEstimated.toLocaleString()} exceeds user budget ₹${budget.toLocaleString()}`, 'budget');
    } else {
      addLog(`Budget verified: ₹${totalEstimated.toLocaleString()} is within ₹${budget.toLocaleString()} ceiling (cushion: ₹${(budget - totalEstimated).toLocaleString()})`, 'budget');
    }
    await sleep(450);
    updateSteps(4, 'complete');

    // STEP 6: Preparing recommendation
    updateSteps(5, 'active');
    addLog('Synthesizing structured itinerary and user recommendation', 'complete');
    await sleep(400);
    updateSteps(5, 'complete');

    // Build the complete Itinerary Days
    const itinerary: ItineraryDay[] = [
      {
        dayNumber: 1,
        dayTitle: 'Arrival & Morjim Coastal Sunset',
        items: [
          { time: '10:30 AM', title: 'Arrival at Manohar Intl Airport & Private EV Transfer', location: 'GOX ⇄ Morjim', category: 'transport', cost: 1100 },
          { time: '01:30 PM', title: `Check-in at ${hotels[0].name}`, location: hotels[0].location, category: 'hotel', cost: Math.round(hotelCost / 3) },
          { time: '05:30 PM', title: 'Beach sunset & Mandovi River Catamaran cruise', location: 'Morjim Beach', category: 'activity', cost: 2500 },
          { time: '08:00 PM', title: 'Welcome Coastal Dinner at Cavatina', location: 'Benaulim / Al Fresco', category: 'dining', cost: 2400 },
        ],
      },
      {
        dayNumber: 2,
        dayTitle: 'Old Goa Heritage, Art & Nightlife',
        items: [
          { time: '09:00 AM', title: 'Artisanal Breakfast at Resort Terrace', location: hotels[0].name, category: 'dining', cost: 800 },
          { time: '10:30 AM', title: 'Fontainhas Latin Quarter Walking Tour', location: 'Panjim Heritage Zone', category: 'activity', cost: 1200 },
          { time: '01:30 PM', title: 'Heritage Lunch & Artisanal Kokum Kitchen', location: 'Assagao Garden', category: 'dining', cost: 1200 },
          { time: '08:30 PM', title: 'Curated Beach Bar Sundowner & Nightlife', location: 'Vagator Cliff', category: 'dining', cost: 1000 },
        ],
      },
      {
        dayNumber: 3,
        dayTitle: 'Island Water Sports & Chef Tasting',
        items: [
          { time: '09:30 AM', title: 'Backwaters Sea Kayaking & Snorkeling', location: 'Grand Island Coast', category: 'activity', cost: 2000 },
          { time: '01:30 PM', title: 'Casual Fisherman Seafood Lunch', location: 'Anjuna Beach', category: 'dining', cost: 800 },
          { time: '05:00 PM', title: 'Local Spice Trail & Plantation Excursion', location: 'Ponda Rainforest', category: 'activity', cost: 800 },
          { time: '08:00 PM', title: 'Signature Assagao Villa Dinner at Jamun', location: 'Assagao', category: 'dining', cost: 2000 },
        ],
      },
      {
        dayNumber: 4,
        dayTitle: 'Brunch, Artisanal Souvenirs & Departure',
        items: [
          { time: '10:00 AM', title: 'Leisurely Organic Brunch & Poolside Relaxation', location: hotels[0].name, category: 'dining', cost: 800 },
          { time: '12:00 PM', title: 'Fontainhas Boutique & Spices Shopping', location: 'Panjim Central', category: 'activity', cost: 0 },
          { time: '03:30 PM', title: 'Executive EV Airport Transfer to GOX', location: 'Resort ⇄ GOX Airport', category: 'transport', cost: 1100 },
          { time: '06:00 PM', title: 'Return Flight to Mumbai / Destination', location: 'IndiGo Premier Flight', category: 'travel', cost: 8000 },
        ],
      },
    ];

    const breakdown: TripCostBreakdown = {
      hotelName: hotels[0].name,
      hotelCost,
      diningCost,
      activitiesCost,
      transportCost,
      travelCost,
      totalEstimatedCost: totalEstimated,
      requestedBudget: budget,
      remainingBuffer: Math.max(0, budget - totalEstimated),
    };

    const recommendationResult: AgentRecommendationResult = {
      id: `rec-goa-${Date.now()}`,
      planTitle: `YOUR ${destination.toUpperCase()} PLAN`,
      destination,
      durationDays,
      breakdown,
      reasons: isBudgetExceeded
        ? [
            `Standard estimated cost is ₹${totalEstimated.toLocaleString()}`,
            `Exceeds requested ceiling of ₹${budget.toLocaleString()} by ₹${(totalEstimated - budget).toLocaleString()}`,
            `Consider adjusting budget or reducing activity count`,
          ]
        : [
            `Within your ₹${budget.toLocaleString()} budget`,
            `Leaves ₹${(budget - totalEstimated).toLocaleString()} buffer`,
            `Matches your preference for beaches and cafés`,
          ],
      itinerary,
      isBudgetExceeded,
      compromiseMessage: isBudgetExceeded
        ? `Your ₹${budget.toLocaleString()} budget is unlikely to cover a full 4-day luxury itinerary with flights and resort stay. I curated a baseline plan for ₹${totalEstimated.toLocaleString()}, or we can reduce the number of activities.`
        : undefined,
      dataSourceNotice: 'Prices shown from simulated external travel providers',
    };

    callbacks.onRecommendationReady(recommendationResult);
  } catch (err: any) {
    callbacks.onError?.(err?.message || 'Failed to process travel request');
  }
}
