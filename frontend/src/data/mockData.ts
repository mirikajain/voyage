import type { Trip, VoyageInsight, ExploreItem, SpendingCategoryItem, Transaction, UserPreferences, RecommendationProposal, AgentWorkflowStep } from '../types';

export const mockTrips: Trip[] = [
  {
    id: 'trip-goa-2026',
    destination: 'GOA',
    country: 'India',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    startDate: 'Sep 14',
    endDate: 'Sep 18, 2024',
    durationDays: 4,
    travelers: 2,
    totalBudget: 40000,
    amountSpent: 32400,
    currency: '₹',
    status: 'Upcoming',
    travelVibe: 'Coastal Serenity & Heritage',
    flightDetails: {
      airline: 'IndiGo Premier 6E-241',
      flightNumber: '6E-241',
      departure: '09:20 AM DEL',
      arrival: '11:45 AM GOI',
    },
    hotelDetails: {
      name: 'The Leela Goa',
      checkIn: 'Sep 14, 2:00 PM',
      checkOut: 'Sep 18, 11:00 AM',
      roomType: 'Mobor, South Goa',
    },
    itinerary: [
      {
        day: 1,
        title: 'Sat, Sep 14',
        items: [
          { time: '09:20 AM', title: 'Flight to Goa', location: 'IndiGo 6E-241 • DEL → GOI', cost: 5800, category: 'travel' },
          { time: '01:30 PM', title: 'Airport Transfer', location: 'Private Cab', cost: 2400, category: 'transport' },
          { time: '02:00 PM', title: 'Hotel Check-in', location: 'The Leela Goa', cost: 18000, category: 'hotel' },
          { time: 'Evening', title: 'Sunset Cruise', location: '6:00 PM - 8:00 PM', cost: 6200, category: 'activity' },
        ],
      },
      {
        day: 2,
        title: 'Sun, Sep 15',
        items: [
          { time: '09:30 AM', title: 'Private Latin Quarter Walking Tour', location: 'Fontainhas, Panjim', cost: 2200, category: 'activity' },
          { time: '01:00 PM', title: 'Lunch at Joseph Bar & Kokum Kitchen', location: 'Panjim', cost: 1800, category: 'food' },
          { time: '08:00 PM', title: 'Le Cinq Gourmet Dinner', location: 'Cavatina by Avinash Martins', cost: 6800, category: 'food' },
        ],
      },
      {
        day: 3,
        title: 'Mon, Sep 16',
        items: [
          { time: '10:00 AM', title: 'South Goa Spice Plantation Tour & Lunch', location: 'Sahakari Spice Farm', cost: 3200, category: 'activity' },
          { time: '05:00 PM', title: 'Palolem Beach Kayaking & Sunset', location: 'Canacona', cost: 2400, category: 'activity' },
        ],
      },
      {
        day: 4,
        title: 'Tue, Sep 17',
        items: [
          { time: '11:00 AM', title: 'Resort Spa & Pool Relaxation', location: 'The Leela Goa', cost: 0, category: 'activity' },
          { time: '04:00 PM', title: 'Airport Return Transfer', location: 'The Leela to GOX', cost: 2400, category: 'transport' },
        ],
      },
    ],
  },
  {
    id: 'trip-paris-2026',
    destination: 'PARIS',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    startDate: 'Oct 20',
    endDate: 'Oct 27, 2024',
    durationDays: 7,
    travelers: 3,
    totalBudget: 150000,
    amountSpent: 132400,
    currency: '₹',
    status: 'Active Planning',
    travelVibe: 'Art, History & Culinary',
    flightDetails: {
      airline: 'Air France AF-217',
      flightNumber: 'AF-217',
      departure: '02:15 AM DEL',
      arrival: '08:00 AM CDG',
    },
    hotelDetails: {
      name: 'Le Pavillon de la Reine',
      checkIn: 'Oct 20, 3:00 PM',
      checkOut: 'Oct 27, 12:00 PM',
      roomType: 'Place des Vosges, Paris',
    },
    itinerary: [],
  },
  {
    id: 'trip-bali-2024',
    destination: 'BALI',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    startDate: 'Jun 10',
    endDate: 'Jun 15, 2024',
    durationDays: 5,
    travelers: 2,
    totalBudget: 90000,
    amountSpent: 86400,
    currency: '₹',
    status: 'Past',
    travelVibe: 'Tropical Temples & Ocean Villas',
    itinerary: [],
  },
  {
    id: 'trip-tokyo-2024',
    destination: 'TOKYO',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    startDate: 'Mar 12',
    endDate: 'Mar 18, 2024',
    durationDays: 6,
    travelers: 2,
    totalBudget: 180000,
    amountSpent: 0,
    currency: '₹',
    status: 'Cancelled',
    travelVibe: 'Cancelled due to schedule change',
    itinerary: [],
  },
];


export const mockInsights: VoyageInsight[] = [
  {
    id: 'insight-1',
    type: 'budget',
    headline: 'Your Goa trip is 81% within budget',
    subtext: '₹7,600 cushion remaining across 4 days with zero unexpected surcharges detected.',
    badgeText: 'Optimal Pace',
    impactValue: '₹7,600 buffer',
    isActionable: false,
  },
  {
    id: 'insight-2',
    type: 'logistics',
    headline: 'Hotel check-in is tomorrow at 2 PM',
    subtext: 'Ahilya by the Sea has confirmed early bag drop access starting 11:30 AM.',
    badgeText: 'Priority Key',
    impactValue: 'Confirmed',
    isActionable: true,
    actionLabel: 'View Hotel Voucher',
  },
  {
    id: 'insight-3',
    type: 'savings',
    headline: 'I found a ₹1,200 cheaper airport transfer',
    subtext: 'Direct executive EV sedan via Razorpay Auto-Reserve with flight delay protection.',
    badgeText: 'Smart Saving',
    impactValue: 'Save ₹1,200',
    isActionable: true,
    actionLabel: 'Switch & Save',
  },
];

export const mockExploreItems: ExploreItem[] = [
  {
    id: 'exp-h1',
    category: 'hotels',
    name: 'The Postcard Hideaway',
    location: 'Netravali, South Goa',
    rating: 4.9,
    reviewCount: 342,
    price: 16500,
    currency: '₹',
    priceUnit: 'night',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Secluded luxury pavilion nestled amidst 20 acres of lush spice plantations and pristine Western Ghats rainforest.',
    tags: ['Eco-luxury', 'Private Pool', 'Curated Dining'],
    matchScore: 98,
    aiEvaluation: {
      whyRecommended: [
        'Matches your preference for calm, boutique luxury away from commercial crowds',
        'Includes complimentary 24/7 check-in matching your late arrival flight',
        'Direct Razorpay VIP perks: complimentary gourmet breakfast for two'
      ],
      itineraryFit: 'Flawless fit for Day 3 & 4 rest cycle',
      budgetImpact: 'Fits comfortably within your ₹40,000 trip margin'
    }
  },
  {
    id: 'exp-h2',
    category: 'hotels',
    name: 'Le Pavillon de la Reine',
    location: 'Place des Vosges, Paris',
    rating: 4.8,
    reviewCount: 213,
    price: 34200,
    currency: '₹',
    priceUnit: 'night',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Hidden 17th-century luxury residence situated on historical Place des Vosges with private leafy courtyard and Codage spa.',
    tags: ['# Historic', 'Michelin Dining', 'Spa'],
    matchScore: 94,
    aiEvaluation: {
      whyRecommended: [
        'Walking distance to 4 of your pinned art galleries in Le Marais',
        'Offers quiet interior garden suites secluded from city noise'
      ],
      itineraryFit: 'Ideal for Paris Art Week itinerary',
      budgetImpact: 'Requires modest adjustment from shopping allocation'
    }
  },
  {
    id: 'exp-h3',
    category: 'hotels',
    name: 'Alila Villas Uluwatu',
    location: 'Bali, Indonesia',
    rating: 4.7,
    reviewCount: 189,
    price: 28900,
    currency: '₹',
    priceUnit: 'night',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Spectacular cliffside villas perched on an elevated plateau overlooking the Indian Ocean.',
    tags: ['Cliff View', 'Private Villa', 'Wellness'],
    matchScore: 95,
    aiEvaluation: {
      whyRecommended: [
        'Unmatched private infinity pool views over Bali coastline',
        'Dedicated 24-hour butler service included'
      ],
      itineraryFit: 'Ideal for relaxation days in Bali',
      budgetImpact: 'Excellent value for premium cliff villa'
    }
  },
  {
    id: 'exp-h4',
    category: 'hotels',
    name: 'Taj Lake Palace',
    location: 'Udaipur, India',
    rating: 4.8,
    reviewCount: 620,
    price: 26400,
    currency: '₹',
    priceUnit: 'night',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Iconic 18th-century marble palace floating peacefully on Lake Pichola with royal butler service.',
    tags: ['Lake View', 'Royal Heritage', 'Fine Dining'],
    matchScore: 96,
    aiEvaluation: {
      whyRecommended: [
        'Private boat arrival across Lake Pichola',
        'Authentic Mewari royal heritage hospitality'
      ],
      itineraryFit: 'Signature stay experience',
      budgetImpact: 'Balanced against regional excursions'
    }
  },
  {
    id: 'exp-h5',
    category: 'hotels',
    name: 'Six Senses Zighy Bay',
    location: 'Oman',
    rating: 4.9,
    reviewCount: 150,
    price: 52300,
    currency: '₹',
    priceUnit: 'night',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Dramatic rustic-chic resort set between rugged mountains and a private sandy cove.',
    tags: ['Beachfront Villa', 'Mountain Oasis', 'Luxury Spa'],
    matchScore: 97,
    aiEvaluation: {
      whyRecommended: [
        'Paraglide check-in option into secluded bay',
        'Award-winning wellness sanctuary'
      ],
      itineraryFit: 'Ultimate secluded retreat',
      budgetImpact: 'Ultra-luxury category'
    }
  },
  {
    id: 'exp-h6',
    category: 'hotels',
    name: 'The Ritz-Carlton',
    location: 'Kyoto, Japan',
    rating: 4.9,
    reviewCount: 295,
    price: 48700,
    currency: '₹',
    priceUnit: 'night',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Exquisite modern sanctuary built on the tranquil banks of the Kamogawa River in downtown Kyoto.',
    tags: ['Riverfront', 'Zen Garden', 'Michelin Dining'],
    matchScore: 98,
    aiEvaluation: {
      whyRecommended: [
        'Prime riverside location close to Gion historic district',
        'Exceptional Pierre Hermé breakfast & afternoon tea'
      ],
      itineraryFit: 'Centerpiece for autumn foliage trip',
      budgetImpact: 'Within luxury Japan trip bracket'
    }
  },
  {
    id: 'exp-f1',
    category: 'flights',
    name: 'IndiGo Premier (DEL ⇄ GOI)',
    location: 'Delhi to North Goa',
    rating: 4.7,
    reviewCount: 890,
    price: 5800,
    currency: '₹',
    priceUnit: 'per passenger',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Priority boarding, extra legroom row 3, complimentary hot gourmet meal and 25kg luggage allowance.',
    tags: ['Direct 2h 25m', 'Priority Bag', 'Refundable'],
    matchScore: 96,
    aiEvaluation: {
      whyRecommended: [
        'Arrives 2 hours earlier than scheduled hotel check-in for smooth transfer',
        'Includes free flight change flexibility via Razorpay Travel Shield'
      ],
      itineraryFit: 'Optimizes Day 1 daylight hours',
      budgetImpact: '₹1,400 lower than peak weekend average'
    }
  },
  {
    id: 'exp-r1',
    category: 'restaurants',
    name: 'Le Cinq Gourmet Dinner',
    location: 'Four Seasons George V, Paris',
    rating: 4.9,
    reviewCount: 540,
    price: 6800,
    currency: '₹',
    priceUnit: 'tasting menu / person',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Three-Michelin-star haute French gastronomy by Chef Christian Le Squer in opulent golden salon.',
    tags: ['3 Michelin Stars', 'Wine Pairing', 'Haute Cuisine'],
    matchScore: 99,
    aiEvaluation: {
      whyRecommended: [
        'Exact match for your gastronomic journey in Paris',
        'Voyage has pre-reserved an exclusive table'
      ],
      itineraryFit: 'Scheduled for 8:00 PM on Day 2',
      budgetImpact: 'Fits remaining dining budget buffer perfectly'
    }
  },
  {
    id: 'exp-a1',
    category: 'activities',
    name: 'Sunset Cruise',
    location: 'Mandovi River / Mobor Coast, Goa',
    rating: 4.8,
    reviewCount: 96,
    price: 6200,
    currency: '₹',
    priceUnit: 'private charter',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Exclusive 2-hour sunset cruise along coastal Goa with artisanal refreshments and music.',
    tags: ['Private Cruise', 'Champagne Included', 'Sunset Golden Hour'],
    matchScore: 97,
    aiEvaluation: {
      whyRecommended: [
        'Highest customer satisfaction rating for coastal charters',
        'Private pickup from hotel lobby'
      ],
      itineraryFit: 'Scheduled for Day 1 6:00 PM - 8:00 PM',
      budgetImpact: 'Covered in activity buffer'
    }
  },
  {
    id: 'exp-t1',
    category: 'transport',
    name: 'Goa Airport Transfer',
    location: 'Goa Airport ⇄ The Leela Goa',
    rating: 4.9,
    reviewCount: 280,
    price: 2400,
    currency: '₹',
    priceUnit: 'private cab',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Quiet electric executive transfer with flight tracker integration and dedicated chauffeur.',
    tags: ['Flight Tracked', 'Zero Surge', 'Instant Receipt'],
    matchScore: 99,
    aiEvaluation: {
      whyRecommended: [
        'Autonomous flight delay sync automatically adjusts driver pickup time'
      ],
      itineraryFit: 'Confirmed for 1:30 PM pickup',
      budgetImpact: 'Direct transport savings'
    }
  }
];

export const mockSpendingCategories: SpendingCategoryItem[] = [
  { name: 'Hotels', spent: 40000, allocated: 40000, percentage: 30, color: '#EF4444' },
  { name: 'Flights', spent: 34000, allocated: 55000, percentage: 22, color: '#F59E0B' },
  { name: 'Food', spent: 18300, allocated: 25000, percentage: 14, color: '#3B82F6' },
  { name: 'Activities', spent: 8200, allocated: 20000, percentage: 16, color: '#10B981' },
  { name: 'Transport', spent: 4000, allocated: 10000, percentage: 10, color: '#6366F1' },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Le Cinq Gourmet Dinner',
    category: 'Food',
    date: 'Sep 15, 2024',
    amount: 6800,
    currency: '₹',
    status: 'Settled',
    razorpayPaymentId: 'pay_RZP928371829',
    method: 'Paid',
  },
  {
    id: 'tx-2',
    title: 'Goa Airport Transfer',
    category: 'Transport',
    date: 'Sep 14, 2024',
    amount: 2400,
    currency: '₹',
    status: 'Settled',
    razorpayPaymentId: 'pay_RZP819203912',
    method: 'Paid',
  },
  {
    id: 'tx-3',
    title: 'The Leela Goa - 4 Nights',
    category: 'Hotels',
    date: 'Sep 14, 2024',
    amount: 40000,
    currency: '₹',
    status: 'Settled',
    razorpayPaymentId: 'pay_RZP746192834',
    method: 'Paid',
  },
];


export const mockUserProfile: UserPreferences = {
  name: 'Advait Sharma',
  email: 'advait.sharma@voyage.luxury',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  travelStyle: ['Boutique Luxury Hotels', 'Culinary & Wine Exploration', 'Architectural & Cultural Heritage', 'High-speed Rail'],
  preferredDestinations: ['Paris, France', 'Goa & Kerala, India', 'Kyoto, Japan', 'Amalfi Coast, Italy', 'Zurich, Switzerland'],
  foodPreferences: ['Farm-to-table Gastronomy', 'Coastal Seafood', 'Natural Wine Pairings', 'Michelin Guide Curation'],
  typicalTripBudget: 150000,
  currency: '₹',
  aiPreferences: {
    askBeforePurchases: true,
    alertBudgetRisks: true,
    suggestItineraryChanges: true,
    autoOptimizeRecommendations: true,
  },
  paymentPreferences: {
    preferredMethod: 'Razorpay Vault Card (•••• 4242)',
    savedCards: [
      {
        id: 'card-1',
        brand: 'Visa',
        last4: '4242',
        expiry: '09/29',
        holderName: 'ADVAIT SHARMA',
        isDefault: true,
      },
      {
        id: 'card-2',
        brand: 'Mastercard',
        last4: '8831',
        expiry: '12/28',
        holderName: 'ADVAIT SHARMA',
        isDefault: false,
      },
    ],
    savedUpi: [
      {
        id: 'upi-1',
        upiId: 'advait.sharma@razorpay',
        provider: 'Razorpay Smart UPI',
        isDefault: true,
      },
      {
        id: 'upi-2',
        upiId: 'voyage.travel@okhdfcbank',
        provider: 'HDFC Bank VIP',
        isDefault: false,
      },
    ],
  },
};

export const defaultAgentWorkflowSteps: AgentWorkflowStep[] = [
  { id: 's1', label: 'Understanding request', status: 'complete', activeDescription: 'Parsing intent...', completedDescription: 'Identified: Romantic dinner in Paris near Eiffel Tower for 2 guests' },
  { id: 's2', label: 'Checking trip preferences', status: 'complete', activeDescription: 'Checking profile...', completedDescription: 'Found: Foodie preference, Michelin-level curation, budget allocation: ₹16,000' },
  { id: 's3', label: 'Searching external travel services', status: 'complete', activeDescription: 'Querying partners...', completedDescription: 'Scanned 18 verified rooftop restaurants with Eiffel views' },
  { id: 's4', label: 'Comparing options', status: 'complete', activeDescription: 'Filtering results...', completedDescription: 'Filtered by 4.5+ rating, table availability at 8:30 PM, transit time < 25 min' },
  { id: 's5', label: 'Checking budget', status: 'complete', activeDescription: 'Verifying budget...', completedDescription: '€82 (₹7,400) fits remaining Paris dining buffer without reallocation' },
  { id: 's6', label: 'Preparing recommendation', status: 'complete', activeDescription: 'Synthesizing...', completedDescription: 'Ready for user authorization' },
];

export const defaultRecommendation: RecommendationProposal = {
  id: 'rec-eiffel-dinner',
  title: 'Romantic dinner near Eiffel Tower',
  category: 'Fine Dining Rooftop',
  price: 7400,
  currency: '€82 (₹7,400)',
  rating: 4.6,
  distance: '20 min from hotel',
  location: 'Les Ombres, 27 Quai Branly, Paris',
  image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
  reasons: [
    'Fits your budget comfortably (₹7,400 / ₹17,600 buffer)',
    'Matches your romantic dining preference with panoramic tower view',
    'Fits your itinerary: 20 mins from Hôtel Madame Rêve',
  ],
  savingsAmount: 1200,
};
