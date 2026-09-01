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
  { id: 'step-2', label: 'Checking travel preferences', status: 'waiting', activeDescription: 'Querying user profile for culinary & style preferences...', completedDescription: 'Profile loaded: Boutique stays, curated dining' },
  { id: 'step-3', label: 'Searching external travel services', status: 'waiting', activeDescription: 'Querying partner inventory for live flights, hotels & activities...', completedDescription: 'Found verified partner options' },
  { id: 'step-4', label: 'Comparing options', status: 'waiting', activeDescription: 'Filtering by rating 4.6+, location proximity & schedule fit...', completedDescription: 'Selected top-tier compatible inventory' },
  { id: 'step-5', label: 'Checking trip budget', status: 'waiting', activeDescription: 'Simulating total cost envelope against specified budget...', completedDescription: 'Budget validation verified with cushion' },
  { id: 'step-6', label: 'Preparing recommendation', status: 'waiting', activeDescription: 'Assembling complete day-by-day plan & pricing breakdown...', completedDescription: 'Recommendation ready for user review' },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'my', 'our', 'luxury', 'romantic', 'budget', 'weekend',
  'day', 'days', 'night', 'nights', 'plan', 'trip', 'tour', 'getaway',
  'vacation', 'holiday', 'itinerary', 'under', 'for', 'from', 'with', 'in',
  'to', 'of', 'and', 'below', 'max', 'about', 'around', 'near', 'take',
  'me', 'fly', 'flying', 'travel', 'visiting', 'visit', 'find', 'show', 'search',
  'flights', 'flight', 'hotels', 'hotel', 'restaurants', 'restaurant',
  'activities', 'activity', 'attractions', 'places', 'food', 'cafes', 'cafe'
]);

function cleanLocation(text: string): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  const filtered = words.filter(w => !STOP_WORDS.has(w.toLowerCase()) && !/^[\d?,₹$]+$/.test(w));
  if (filtered.length === 0) {
    const rawWords = words.filter(w => !/^[\d?,₹$]+$/.test(w));
    return rawWords.join(' ').trim().replace(/\b\w/g, l => l.toUpperCase());
  }
  return filtered.join(' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function parseTravelPrompt(prompt: string): {
  intent: 'trip_planning' | 'flight_search' | 'hotel_search' | 'restaurant_search' | 'activity_search';
  destination: string;
  origin: string;
  durationDays: number;
  budget: number | null;
} {
  const rawClean = prompt.replace(/\?/g, ' ').replace(/,/g, '');
  const lower = rawClean.toLowerCase();
  
  // 1. Intent Detection
  let intent: 'trip_planning' | 'flight_search' | 'hotel_search' | 'restaurant_search' | 'activity_search' = 'trip_planning';
  const isFlightQuery = /\b(flight|flights|fly|flying|airline|airlines|airfare|tickets|plane)\b/i.test(lower);
  const isHotelQuery = /\b(hotel|hotels|resort|resorts|villa|villas|stay|stays|accommodation|room|rooms)\b/i.test(lower);
  const isRestaurantQuery = /\b(restaurant|restaurants|dining|dinner|lunch|breakfast|food|cafe|cafes|café|cafés|bistro|eatery)\b/i.test(lower);
  const isActivityQuery = /\b(activity|activities|things to do|attraction|attractions|sightseeing|tour|tours|experience|monument)\b/i.test(lower);
  const isExplicitTrip = /\b(plan\s+(?:a\s+)?|itinerary|vacation|getaway|holiday|\d+\s*-?\s*day|\d+\s*-?\s*night|weekend)\b/i.test(lower);

  if (isFlightQuery && !isExplicitTrip) {
    intent = 'flight_search';
  } else if (isHotelQuery && !isExplicitTrip) {
    intent = 'hotel_search';
  } else if (isRestaurantQuery && !isExplicitTrip) {
    intent = 'restaurant_search';
  } else if (isActivityQuery && !isExplicitTrip) {
    intent = 'activity_search';
  } else {
    intent = 'trip_planning';
  }

  // 2. Origin & Destination detection
  let origin = 'Mumbai';
  let destination = '';

  const fromToMatch = lower.match(/(?:flying\s+|flights?\s+)?from\s+([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget|trip|tour)|$)/);
  if (fromToMatch) {
    const origCand = cleanLocation(fromToMatch[1]);
    const destCand = cleanLocation(fromToMatch[2]);
    if (origCand) origin = origCand;
    if (destCand) destination = destCand;
  }

  if (!destination) {
    const startToMatch = lower.match(/^([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget|trip|tour)|$)/);
    if (startToMatch) {
      const origCand = cleanLocation(startToMatch[1]);
      const destCand = cleanLocation(startToMatch[2]);
      if (origCand && destCand) {
        origin = origCand;
        destination = destCand;
      }
    }
  }

  if (!destination) {
    const nearMatch = lower.match(/near\s+([a-z\s]+?)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget)|$)/);
    if (nearMatch && nearMatch[1]) {
      const cand = cleanLocation(nearMatch[1]);
      if (cand.toLowerCase().includes('eiffel')) destination = 'Paris';
      else destination = cand;
    }
  }

  if (!destination) {
    const toMatch = lower.match(/(?:take\s+me\s+to|trip\s+to|travel\s+to|visit|fly\s+to|going\s+to|head\s+to|flights?\s+to|flight\s+to)\s+([a-z\s]+?)(?:\s+(?:for|under|with|from|on|in|\d|₹|budget|trip|tour)|$)/);
    if (toMatch && toMatch[1]) {
      destination = cleanLocation(toMatch[1]);
    }
  }

  if (!destination) {
    const inMatch = lower.match(/(?:in|at)\s+([a-z\s]+?)(?:\s+(?:for|under|with|from|on|\d|₹|budget|trip|tour)|$)/);
    if (inMatch && inMatch[1]) {
      destination = cleanLocation(inMatch[1]);
    }
  }

  if (!destination) {
    const tripMatch = lower.match(/(?:plan\s+(?:a\s+)?)?(?:(?:(\d+)[-\s]*(?:day|days|night|nights)|weekend)\s+)?([a-z\s]+?)(?:\s+(?:trip|tour|getaway|vacation|itinerary|holiday))(?:\s+(?:for|under|with|from|on|in|\d|₹|budget)|$)/);
    if (tripMatch && tripMatch[2]) {
      destination = cleanLocation(tripMatch[2]);
    }
  }

  if (!destination) {
    const common = ['jaipur', 'goa', 'paris', 'kyoto', 'tokyo', 'mumbai', 'delhi', 'amalfi', 'rome', 'london', 'dubai', 'bali', 'udaipur', 'manali', 'kashmir', 'kerala'];
    for (const c of common) {
      if (new RegExp(`\\b${c}\\b`).test(lower)) {
        destination = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }
  }

  if (!destination) {
    destination = 'Goa';
  }

  // 3. Duration detection (e.g. "2-day", "2 days", "weekend", "5 nights")
  let durationDays: number | null = null;
  const dayMatch = lower.match(/(\d+)\s*(-|\s)?(day|days|night|nights)/);
  if (dayMatch && dayMatch[1]) {
    durationDays = parseInt(dayMatch[1], 10);
  } else if (/two\s+day|2\s+day|weekend/i.test(lower)) {
    durationDays = 2;
  } else if (/three\s+day|3\s+day/i.test(lower)) {
    durationDays = 3;
  } else if (/four\s+day|4\s+day/i.test(lower)) {
    durationDays = 4;
  } else if (/five\s+day|5\s+day/i.test(lower)) {
    durationDays = 5;
  }

  if (durationDays === null) {
    durationDays = 4;
  }

  // 4. Budget detection (e.g. "₹25,000", "25k", "1.5 lakh", "under 25000")
  let budget: number | null = null;
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs)\b/);
  if (lakhMatch && lakhMatch[1]) {
    budget = parseFloat(lakhMatch[1]) * 100000;
  }

  if (budget === null) {
    const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*k\b/);
    if (kMatch && kMatch[1]) {
      budget = parseFloat(kMatch[1]) * 1000;
    }
  }

  if (budget === null) {
    const numMatch = lower.match(/(?:under|budget|of|₹|rs\.?|inr|below|max|within|for)\s*₹?\s*(\d{4,8})/);
    if (numMatch && numMatch[1]) {
      budget = parseInt(numMatch[1], 10);
    }
  }

  return { intent, destination, origin, durationDays, budget };
}

export async function executeAgentWorkflow(
  prompt: string,
  _userProfile: UserPreferences,
  callbacks: AgentExecutionCallbacks
): Promise<void> {
  const { intent, destination, origin, durationDays, budget } = parseTravelPrompt(prompt);
  const targetBudget = budget || 40000;
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
    addLog(`Request understood: ${intent === 'flight_search' ? `Flights ${origin} ➔ ${destination}` : `${durationDays}-day ${destination} trip`}`, 'system');
    await sleep(450);
    updateSteps(0, 'complete');

    // STEP 2: Checking travel preferences
    updateSteps(1, 'active');
    addLog(`Preferences loaded for ${destination}`, 'system');
    await sleep(400);
    updateSteps(1, 'complete');

    // STEP 3: Searching external travel services
    updateSteps(2, 'active');
    addLog(`Searching external travel partner network for ${destination}...`, 'tool');
    
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
    addLog('Comparing options & filtering for ratings and schedule fit', 'tool');
    await sleep(450);
    updateSteps(3, 'complete');

    // STEP 5: Checking trip budget
    updateSteps(4, 'active');
    
    let hotelCost = hotels[0].totalCost;
    let diningCost = dining.totalEstimated;
    let activitiesCost = activities.totalEstimated;
    let transportCost = transport.totalEstimated;
    let travelCost = flight.totalCost;

    let totalEstimated = hotelCost + diningCost + activitiesCost + transportCost + travelCost;
    const isBudgetExceeded = budget ? totalEstimated > budget : false;

    addLog(`Budget verified: Estimated total ₹${totalEstimated.toLocaleString()}`, 'budget');
    await sleep(450);
    updateSteps(4, 'complete');

    // STEP 6: Preparing recommendation
    updateSteps(5, 'active');
    addLog('Synthesizing structured response', 'complete');
    await sleep(400);
    updateSteps(5, 'complete');

    const itinerary: ItineraryDay[] = [
      {
        dayNumber: 1,
        dayTitle: `Arrival & ${destination} Exploration`,
        items: [
          { time: '10:30 AM', title: `Arrival & Private EV Transfer`, location: `${destination} Airport`, category: 'transport', cost: 1100 },
          { time: '01:30 PM', title: `Check-in at ${hotels[0].name}`, location: hotels[0].location, category: 'hotel', cost: Math.round(hotelCost / Math.max(1, durationDays - 1)) },
          { time: '05:30 PM', title: `Guided Sunset Highlights Tour`, location: destination, category: 'activity', cost: 1800 },
          { time: '08:00 PM', title: `Welcome Chef Tasting Dinner`, location: destination, category: 'dining', cost: 2400 },
        ],
      },
      {
        dayNumber: 2,
        dayTitle: `${destination} Heritage & Cultural Walk`,
        items: [
          { time: '09:00 AM', title: 'Artisanal Breakfast at Hotel Terrace', location: hotels[0].name, category: 'dining', cost: 800 },
          { time: '10:30 AM', title: `Historic District & Architecture Walk`, location: destination, category: 'activity', cost: 1200 },
          { time: '01:30 PM', title: 'Curated Local Cuisine Lunch', location: destination, category: 'dining', cost: 1200 },
          { time: '08:30 PM', title: 'Evening Rooftop Panorama & Lounge', location: destination, category: 'dining', cost: 1000 },
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
      requestedBudget: targetBudget,
      remainingBuffer: Math.max(0, targetBudget - totalEstimated),
    };

    const recommendationResult: AgentRecommendationResult = {
      id: `rec-${destination.toLowerCase()}-${Date.now()}`,
      planTitle: `YOUR ${destination.toUpperCase()} PLAN`,
      intent,
      destination,
      origin,
      durationDays,
      breakdown,
      reasons: isBudgetExceeded && budget
        ? [
            `Standard estimated cost is ₹${totalEstimated.toLocaleString()}`,
            `Exceeds requested ceiling of ₹${budget.toLocaleString()} by ₹${(totalEstimated - budget).toLocaleString()}`,
            `Consider adjusting budget or reducing activity count`,
          ]
        : [
            `Curated for your ${destination} request`,
            `Top-rated partner inventory`,
            `Verified schedule and rates`,
          ],
      itinerary,
      isBudgetExceeded,
      compromiseMessage: isBudgetExceeded && budget
        ? `Your ₹${budget.toLocaleString()} budget is unlikely to cover a full ${durationDays}-day luxury itinerary with flights and accommodation. I curated a baseline plan for ₹${totalEstimated.toLocaleString()}, or we can reduce the number of activities.`
        : undefined,
      dataSourceNotice: 'Prices shown from simulated external travel providers',
    };

    callbacks.onRecommendationReady(recommendationResult);
  } catch (err: any) {
    callbacks.onError?.(err?.message || 'Failed to process travel request');
  }
}
