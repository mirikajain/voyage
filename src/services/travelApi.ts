/**
 * Simulated External Travel API Service Layer
 * 
 * In production, these methods will integrate with live partner inventory:
 * - Amadeus / Sabre / Skyscanner for Flights
 * - Booking.com / Hotelbeds for Accommodations
 * - OpenTable / Resy for Dining
 * - Viator / GetYourGuide for Curated Activities
 * - Uber for Business / Local fleet APIs for Transfers
 */

export interface ExternalHotelOption {
  id: string;
  name: string;
  location: string;
  totalCost: number;
  costPerNight: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  provider: string;
}

export interface ExternalFlightOption {
  id: string;
  airline: string;
  route: string;
  totalCost: number;
  provider: string;
}

export interface ExternalDiningOption {
  id: string;
  name: string;
  type: string;
  estimatedCost: number;
  provider: string;
}

export interface ExternalActivityOption {
  id: string;
  title: string;
  dayNumber: number;
  cost: number;
  provider: string;
}

export interface ExternalTransportOption {
  id: string;
  type: string;
  estimatedCost: number;
  provider: string;
}

// Simulated delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function searchHotels(
  destination: string,
  durationDays: number,
  targetHotelBudget?: number
): Promise<ExternalHotelOption[]> {
  await delay(120);

  const destLower = destination.toLowerCase();
  if (destLower.includes('goa')) {
    return [
      {
        id: 'htl-aria-goa',
        name: 'Aria Beach Resort',
        location: 'Morjim & Ashwem Coast, North Goa',
        totalCost: targetHotelBudget || 12800,
        costPerNight: Math.round((targetHotelBudget || 12800) / (durationDays - 1 || 3)),
        rating: 4.8,
        reviewCount: 312,
        amenities: ['Beachfront Access', 'Infinity Pool', 'Complimentary Artisanal Breakfast', 'High-speed Wi-Fi'],
        provider: 'Global Hospitality Network (Simulated)',
      },
      {
        id: 'htl-w-goa',
        name: 'Ahilya by the Sea',
        location: 'Nerul Bay, Goa',
        totalCost: 18400,
        costPerNight: 6133,
        rating: 4.9,
        reviewCount: 184,
        amenities: ['Private Heritage Villas', 'Spa Privé', 'Seafront Dining'],
        provider: 'Luxury Stays Partner API (Simulated)',
      },
    ];
  } else if (destLower.includes('paris')) {
    return [
      {
        id: 'htl-madame-reve',
        name: 'Hôtel Madame Rêve',
        location: 'Louvre District, Paris',
        totalCost: targetHotelBudget || 48000,
        costPerNight: 8000,
        rating: 4.8,
        reviewCount: 420,
        amenities: ['Eiffel Tower Terrace View', 'Michelin Restaurant on-site', 'Spa Codage'],
        provider: 'European Boutique GDS (Simulated)',
      },
    ];
  }

  // Generic fallback
  return [
    {
      id: 'htl-generic',
      name: `${destination} Luxury Haven`,
      location: `Central ${destination}`,
      totalCost: targetHotelBudget || 14000,
      costPerNight: Math.round((targetHotelBudget || 14000) / (durationDays - 1 || 3)),
      rating: 4.7,
      reviewCount: 210,
      amenities: ['Executive Suite', 'Concierge Service'],
      provider: 'Partner GDS (Simulated)',
    },
  ];
}

export async function searchFlights(
  destination: string,
  _origin = 'Mumbai'
): Promise<ExternalFlightOption> {
  await delay(100);
  const destLower = destination.toLowerCase();

  if (destLower.includes('goa')) {
    return {
      id: 'flt-indigo-goa',
      airline: 'IndiGo Premier / Vistara Club',
      route: 'BOM ⇄ GOX (Direct 1h 15m)',
      totalCost: 8000,
      provider: 'Global Flight Aggregator (Simulated)',
    };
  }

  return {
    id: 'flt-intl',
    airline: 'Air France / Emirates Premier',
    route: `Direct Return (${destination})`,
    totalCost: 48000,
    provider: 'Global Flight Aggregator (Simulated)',
  };
}

export async function searchDining(
  destination: string,
  _durationDays: number
): Promise<{ totalEstimated: number; breakdown: ExternalDiningOption[] }> {
  await delay(110);
  const destLower = destination.toLowerCase();

  if (destLower.includes('goa')) {
    return {
      totalEstimated: 7000,
      breakdown: [
        { id: 'din-1', name: 'Beachfront Sunset Tasting at Cavatina', type: 'Dinner Tasting', estimatedCost: 2400, provider: 'Dining Partner API' },
        { id: 'din-2', name: 'Assagao Garden Bistro (Jamun)', type: 'Heritage Dinner', estimatedCost: 2000, provider: 'Dining Partner API' },
        { id: 'din-3', name: 'Fontainhas Artisanal Breakfasts & Cafés', type: 'Daily Cafés', estimatedCost: 1600, provider: 'Dining Partner API' },
        { id: 'din-4', name: 'Curated Beach Bar Sundowners', type: 'Cocktails & Mezze', estimatedCost: 1000, provider: 'Dining Partner API' },
      ],
    };
  }

  return {
    totalEstimated: 18000,
    breakdown: [
      { id: 'din-p1', name: 'Les Ombres Rooftop Tasting', type: 'Fine Dining', estimatedCost: 7400, provider: 'Dining Partner API' },
      { id: 'din-p2', name: 'Le Marais Bistros & Patisseries', type: 'Casual Gastronomy', estimatedCost: 10600, provider: 'Dining Partner API' },
    ],
  };
}

export async function searchActivities(
  destination: string,
  _durationDays: number
): Promise<{ totalEstimated: number; activities: ExternalActivityOption[] }> {
  await delay(110);
  const destLower = destination.toLowerCase();

  if (destLower.includes('goa')) {
    return {
      totalEstimated: 6500,
      activities: [
        { id: 'act-1', title: 'Private Mandovi River Sunset Catamaran Cruise', dayNumber: 1, cost: 2500, provider: 'Curated Experiences Network' },
        { id: 'act-2', title: 'Fontainhas Latin Quarter Guided Architectural Walk', dayNumber: 2, cost: 1200, provider: 'Curated Experiences Network' },
        { id: 'act-3', title: 'Grand Island Backwaters Sea Kayaking & Snorkeling', dayNumber: 3, cost: 2000, provider: 'Curated Experiences Network' },
        { id: 'act-4', title: 'Local Spice Plantation & Spice Trail Excursion', dayNumber: 4, cost: 800, provider: 'Curated Experiences Network' },
      ],
    };
  }

  return {
    totalEstimated: 12000,
    activities: [
      { id: 'act-p1', title: 'Louvre Museum VIP After-Hours Access', dayNumber: 2, cost: 6000, provider: 'Curated Experiences Network' },
      { id: 'act-p2', title: 'Seine Private Electric Boat Cruise', dayNumber: 3, cost: 6000, provider: 'Curated Experiences Network' },
    ],
  };
}

export async function searchTransport(
  destination: string,
  _durationDays: number
): Promise<{ totalEstimated: number; transfers: ExternalTransportOption[] }> {
  await delay(100);
  const destLower = destination.toLowerCase();

  if (destLower.includes('goa')) {
    return {
      totalEstimated: 3500,
      transfers: [
        { id: 'tr-1', type: 'Airport Inbound & Outbound Executive EV Sedan (MOPA ⇄ Resort)', estimatedCost: 2200, provider: 'Razorpay Auto-Reserve Fleet' },
        { id: 'tr-2', type: 'Local Chauffeur & Coastal Transit Credits', estimatedCost: 1300, provider: 'Razorpay Auto-Reserve Fleet' },
      ],
    };
  }

  return {
    totalEstimated: 6000,
    transfers: [
      { id: 'tr-p1', type: 'Paris CDG Airport Private Black Car Transfer', estimatedCost: 4000, provider: 'Razorpay Auto-Reserve Fleet' },
      { id: 'tr-p2', type: 'Paris Metro Navigo Decouverte Pass', estimatedCost: 2000, provider: 'Razorpay Auto-Reserve Fleet' },
    ],
  };
}
