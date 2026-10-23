import type { Trip, VoyageInsight, ExploreItem, SpendingCategoryItem, Transaction, UserPreferences, RecommendationProposal, AgentWorkflowStep } from '../types';

export const mockTrips: Trip[] = [
  {
    id: 'trip-goa-2026',
    destination: 'GOA',
    country: 'India',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    startDate: 'Sep 14',
    endDate: 'Sep 18',
    durationDays: 4,
    totalBudget: 40000,
    amountSpent: 32400,
    currency: '₹',
    status: 'Upcoming',
    travelVibe: 'Coastal Serenity & Heritage Dining',
    flightDetails: {
      airline: 'IndiGo Premier 6E-241',
      flightNumber: '6E-241',
      departure: '08:45 AM BOM',
      arrival: '10:05 AM GOX',
    },
    hotelDetails: {
      name: 'Ahilya by the Sea, Nerul',
      checkIn: 'Sep 14, 2:00 PM',
      checkOut: 'Sep 18, 11:00 AM',
      roomType: 'Sunrise Suite with Ocean Balcony',
    },
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Nerul Bay Sunset',
        items: [
          { time: '10:30 AM', title: 'Airport Private Transfer via Razorpay Auto-Reserve', location: 'Manohar Intl Airport (GOX)', cost: 1600, category: 'transport' },
          { time: '02:00 PM', title: 'Check-in at Ahilya by the Sea', location: 'Nerul, North Goa', cost: 18000, category: 'hotel' },
          { time: '07:30 PM', title: 'Sunset Coastal Tasting at Cavatina', location: 'Benaulim', cost: 4200, category: 'food' },
        ],
      },
      {
        day: 2,
        title: 'Old Goa Heritage & Spice Trail',
        items: [
          { time: '09:30 AM', title: 'Private Latin Quarter Walking Tour', location: 'Fontainhas, Panjim', cost: 2200, category: 'activity' },
          { time: '01:00 PM', title: 'Lunch at Joseph Bar & Kokum Kitchen', location: 'Panjim', cost: 1800, category: 'food' },
          { time: '05:30 PM', title: 'Mandovi River Luxury Catamaran Cruise', location: 'Panjim Jetty', cost: 4600, category: 'activity' },
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
    endDate: 'Oct 27',
    durationDays: 7,
    totalBudget: 150000,
    amountSpent: 132400,
    currency: '₹',
    status: 'Active Planning',
    travelVibe: 'Haute Gastronomy & Contemporary Art',
    flightDetails: {
      airline: 'Air France AF-217',
      flightNumber: 'AF-217',
      departure: '02:15 AM DEL',
      arrival: '08:00 AM CDG',
    },
    hotelDetails: {
      name: 'Hôtel Madame Rêve, Louvre District',
      checkIn: 'Oct 20, 3:00 PM',
      checkOut: 'Oct 27, 12:00 PM',
      roomType: 'Deluxe Courtyard King',
    },
    itinerary: [],
  },
  {
    id: 'trip-kyoto-2025',
    destination: 'KYOTO',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    startDate: 'Nov 02',
    endDate: 'Nov 09',
    durationDays: 8,
    totalBudget: 220000,
    amountSpent: 212500,
    currency: '₹',
    status: 'Past',
    travelVibe: 'Autumn Foliage & Zen Ryokans',
    itinerary: [],
  },
  {
    id: 'trip-amalfi-2025',
    destination: 'AMALFI COAST',
    country: 'Italy',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    startDate: 'Jun 10',
    endDate: 'Jun 17',
    durationDays: 7,
    totalBudget: 280000,
    amountSpent: 275000,
    currency: '₹',
    status: 'Past',
    travelVibe: 'Cliffside Villas & Mediterranean Dining',
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
    name: 'The Postcard Hideaway, Netravali',
    location: 'South Goa, India',
    rating: 4.9,
    reviewCount: 142,
    price: 16500,
    currency: '₹',
    priceUnit: 'night',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Secluded luxury pavilion nestled amidst 20 acres of lush spice plantations and pristine Western Ghats rainforest.',
    tags: ['Eco-Luxury', 'Private Pool', 'Curated Dining'],
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
    reviewCount: 318,
    price: 34200,
    currency: '₹',
    priceUnit: 'night',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Hidden 17th-century luxury residence situated on historical Place des Vosges with private leafy courtyard and Codage spa.',
    tags: ['Historic Marais', 'Michelin Star Dining', 'Spa Privé'],
    matchScore: 94,
    aiEvaluation: {
      whyRecommended: [
        'Walking distance to 4 of your pinned art galleries in Le Marais',
        'Offers quiet interior garden suites secluded from city noise',
        'Razorpay multi-currency card zero forex surcharge eligible'
      ],
      itineraryFit: 'Ideal for Paris Art Week itinerary',
      budgetImpact: 'Requires modest adjustment from shopping allocation'
    }
  },
  {
    id: 'exp-f1',
    category: 'flights',
    name: 'Vistara Club Premium (BOM ⇄ GOX)',
    location: 'Mumbai to North Goa',
    rating: 4.7,
    reviewCount: 890,
    price: 5800,
    currency: '₹',
    priceUnit: 'per passenger',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Priority boarding, extra legroom row 3, complimentary hot gourmet meal and 25kg luggage allowance.',
    tags: ['Direct 1h 15m', 'Priority Lounge', 'Refundable'],
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
    name: 'Les Ombres — Eiffel Panoramic',
    location: 'Quai Branly, 7th Arr., Paris',
    rating: 4.6,
    reviewCount: 540,
    price: 7400,
    currency: '₹',
    priceUnit: 'tasting menu / person',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Rooftop glass terrace offering an unobstructed vantage of the illuminated Eiffel Tower with modern French gastronomy.',
    tags: ['Romantic View', 'Wine Pairing', 'Contemporary French'],
    matchScore: 99,
    aiEvaluation: {
      whyRecommended: [
        'Exact match for your romantic evening request in Paris',
        'Only 20 minutes scenic river walk from your hotel',
        'Voyage has pre-reserved an exclusive terrace table'
      ],
      itineraryFit: 'Scheduled for 8:30 PM on Day 3 for the hourly light show',
      budgetImpact: 'Fits remaining dining budget buffer perfectly'
    }
  },
  {
    id: 'exp-r2',
    category: 'restaurants',
    name: 'Jamun — Regional Heritage Bistro',
    location: 'Assagao, North Goa',
    rating: 4.8,
    reviewCount: 420,
    price: 2600,
    currency: '₹',
    priceUnit: 'two persons',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'A restored 150-year-old Portuguese villa serving heirloom curries, coastal clay pot fish, and botanical gin cocktails.',
    tags: ['Heritage Villa', 'Craft Cocktails', 'Al Fresco Garden'],
    matchScore: 95,
    aiEvaluation: {
      whyRecommended: [
        'Aligns with your seafood & farm-to-table culinary profile',
        'Top recommended culinary stop by Goa resident chefs in 2026'
      ],
      itineraryFit: 'Perfect dinner spot after Old Goa sunset walk',
      budgetImpact: 'Under typical luxury dining average in Assagao'
    }
  },
  {
    id: 'exp-a1',
    category: 'activities',
    name: 'Private Sunset Yacht on Chapora River',
    location: 'Vagator Bay, Goa',
    rating: 4.9,
    reviewCount: 96,
    price: 8500,
    currency: '₹',
    priceUnit: 'private charter',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Exclusive 2.5-hour yacht cruise along secluded backwaters with artisanal mezze platter and sparkling wine.',
    tags: ['Private Cruise', 'Champagne Included', 'Sunset Golden Hour'],
    matchScore: 97,
    aiEvaluation: {
      whyRecommended: [
        'Highest customer satisfaction rating for private coastal charters in North Goa',
        'Includes dedicated captain and onboard safety gear'
      ],
      itineraryFit: 'Recommended for Day 3 golden hour (5:00 PM – 7:30 PM)',
      budgetImpact: 'Covers whole group charter within single activity budget'
    }
  },
  {
    id: 'exp-t1',
    category: 'transport',
    name: 'Executive Electric Transfer (Ioniq 5)',
    location: 'MOPA Airport ⇄ South Goa',
    rating: 4.9,
    reviewCount: 280,
    price: 1800,
    currency: '₹',
    priceUnit: 'single trip',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Quiet electric luxury transfer with flight tracker integration, onboard chilled bottled water, and zero surge pricing.',
    tags: ['Flight Tracked', 'Zero Surge', 'Instant Receipt'],
    matchScore: 99,
    aiEvaluation: {
      whyRecommended: [
        'Saves ₹1,200 compared to standard on-demand airport cab counter',
        'Autonomous flight delay sync automatically adjusts driver pickup time'
      ],
      itineraryFit: 'Locks in immediately upon flight touchdown',
      budgetImpact: 'Direct 40% transport savings'
    }
  }
];

export const mockSpendingCategories: SpendingCategoryItem[] = [
  { name: 'Flights', spent: 54000, allocated: 55000, percentage: 36, color: '#1E293B' },
  { name: 'Hotels', spent: 48000, allocated: 50000, percentage: 32, color: '#C5A059' },
  { name: 'Food', spent: 18200, allocated: 16000, percentage: 12, color: '#E11D48' },
  { name: 'Activities', spent: 8200, allocated: 15000, percentage: 6, color: '#0D9488' },
  { name: 'Transport', spent: 4000, allocated: 14000, percentage: 3, color: '#2563EB' },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Le Cinq Gourmet Dinner',
    category: 'Food',
    date: 'Today, 1:30 PM',
    amount: 6800,
    currency: '₹',
    status: 'Settled',
    razorpayPaymentId: 'pay_RZP928371829',
    method: 'Razorpay VIP Card •••• 4242',
  },
  {
    id: 'tx-2',
    title: 'Hôtel Madame Rêve Deposit',
    category: 'Hotels',
    date: 'Yesterday',
    amount: 48000,
    currency: '₹',
    status: 'Settled',
    razorpayPaymentId: 'pay_RZP819203912',
    method: 'Razorpay UPI (Smart AutoPay)',
  },
  {
    id: 'tx-3',
    title: 'Air France Priority Tickets',
    category: 'Flights',
    date: 'Aug 22, 2026',
    amount: 54000,
    currency: '₹',
    status: 'Settled',
    razorpayPaymentId: 'pay_RZP746192834',
    method: 'Razorpay Corporate Vault',
  },
  {
    id: 'tx-4',
    title: 'Louvre After-Hours Private Access',
    category: 'Activities',
    date: 'Aug 20, 2026',
    amount: 8200,
    currency: '₹',
    status: 'Settled',
    razorpayPaymentId: 'pay_RZP639201948',
    method: 'Razorpay VIP Card •••• 4242',
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
