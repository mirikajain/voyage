import os
from typing import List, Dict, Any, Optional
from app.providers.base import (
    FlightOption,
    HotelOption,
    RestaurantOption,
    ActivityOption,
    TransportOption
)
from app.providers.aviationstack_provider import AviationstackProvider
from app.providers.places_provider import GooglePlacesProvider

class TravelService:
    """
    Central router for Voyage travel services.
    Dispatches to real providers (Aviationstack, Google Places) when configured & live,
    falling back seamlessly to verified simulated data in demo mode.
    """

    @classmethod
    def get_api_mode(cls) -> str:
        return os.getenv("TRAVEL_API_MODE", "demo").strip().lower()

    @classmethod
    def search_flights(
        cls,
        destination: str,
        origin: str = "Mumbai",
        departure_date: Optional[str] = None,
        return_date: Optional[str] = None
    ) -> List[FlightOption]:
        mode = cls.get_api_mode()
        
        # Try live Aviationstack provider when live mode is enabled
        if mode == "live" and AviationstackProvider.is_configured():
            live_flights = AviationstackProvider.search_flights(
                origin=origin,
                destination=destination,
                departure_date=departure_date
            )
            if live_flights:
                return live_flights

        # Curated / Demo fallback based on origin & destination
        dest_lower = destination.lower()
        orig_lower = origin.lower()

        # Delhi -> Mumbai route
        if "delhi" in orig_lower and "mumbai" in dest_lower:
            return [
                FlightOption(
                    id="flt-del-bom-001",
                    provider="IndiGo Premier",
                    airline="IndiGo (6E-5022)",
                    flight_number="6E-5022",
                    origin=f"{origin} (DEL)",
                    destination=f"{destination} (BOM)",
                    departure_time="07:15 AM",
                    arrival_time="09:25 AM",
                    duration="2h 10m",
                    status="scheduled",
                    stops=0,
                    price=5400.0,
                    total_price=5400.0,
                    currency="INR",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                FlightOption(
                    id="flt-del-bom-002",
                    provider="Vistara Club",
                    airline="Vistara (UK-955)",
                    flight_number="UK-955",
                    origin=f"{origin} (DEL)",
                    destination=f"{destination} (BOM)",
                    departure_time="09:30 AM",
                    arrival_time="11:45 AM",
                    duration="2h 15m",
                    status="scheduled",
                    stops=0,
                    price=6800.0,
                    total_price=6800.0,
                    currency="INR",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                FlightOption(
                    id="flt-del-bom-003",
                    provider="Air India Premier",
                    airline="Air India (AI-805)",
                    flight_number="AI-805",
                    origin=f"{origin} (DEL)",
                    destination=f"{destination} (BOM)",
                    departure_time="06:00 PM",
                    arrival_time="08:15 PM",
                    duration="2h 15m",
                    status="scheduled",
                    stops=0,
                    price=5900.0,
                    total_price=5900.0,
                    currency="INR",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]

        # Delhi -> Goa or Mumbai -> Goa route
        if "goa" in dest_lower:
            orig_iata = "DEL" if "delhi" in orig_lower else "BOM"
            return [
                FlightOption(
                    id="flt-indigo-goa-001",
                    provider="IndiGo Premier",
                    airline="IndiGo Premier (6E-241)",
                    flight_number="6E-241",
                    origin=f"{origin} ({orig_iata})",
                    destination="Goa (GOX)",
                    departure_time="08:45 AM",
                    arrival_time="10:05 AM",
                    duration="1h 20m" if orig_iata == "BOM" else "2h 30m",
                    status="scheduled",
                    stops=0,
                    price=8000.0,
                    total_price=8000.0,
                    currency="INR",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                FlightOption(
                    id="flt-airindia-goa-002",
                    provider="Air India Express",
                    airline="Air India Express (IX-114)",
                    flight_number="IX-114",
                    origin=f"{origin} ({orig_iata})",
                    destination="Goa (GOI)",
                    departure_time="01:15 PM",
                    arrival_time="03:40 PM",
                    duration="2h 25m",
                    status="scheduled",
                    stops=0,
                    price=7400.0,
                    total_price=7400.0,
                    currency="INR",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]

        # Jaipur route
        if "jaipur" in dest_lower:
            orig_iata = "DEL" if "delhi" in orig_lower else "BOM"
            return [
                FlightOption(
                    id="flt-indigo-jai-001",
                    provider="IndiGo Premier",
                    airline="IndiGo (6E-552)",
                    flight_number="6E-552",
                    origin=f"{origin} ({orig_iata})",
                    destination="Jaipur (JAI)",
                    departure_time="07:30 AM",
                    arrival_time="09:15 AM",
                    duration="1h 45m",
                    status="scheduled",
                    stops=0,
                    price=6500.0,
                    total_price=6500.0,
                    currency="INR",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                FlightOption(
                    id="flt-airindia-jai-002",
                    provider="Air India Direct",
                    airline="Air India (AI-491)",
                    flight_number="AI-491",
                    origin=f"{origin} ({orig_iata})",
                    destination="Jaipur (JAI)",
                    departure_time="05:20 PM",
                    arrival_time="06:55 PM",
                    duration="1h 35m",
                    status="scheduled",
                    stops=0,
                    price=5800.0,
                    total_price=5800.0,
                    currency="INR",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]

        # Paris route
        if "paris" in dest_lower:
            return [
                FlightOption(
                    id="flt-airfrance-001",
                    provider="Air France Priority",
                    airline="Air France (AF-217)",
                    flight_number="AF-217",
                    origin=f"{origin} (BOM/DEL)",
                    destination="Paris (CDG)",
                    departure_time="02:15 AM",
                    arrival_time="08:00 AM",
                    duration="9h 45m",
                    status="scheduled",
                    stops=0,
                    price=54000.0,
                    total_price=54000.0,
                    currency="INR",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]

        # Generic route
        return [
            FlightOption(
                id=f"flt-generic-{destination.lower()[:3]}-001",
                provider="Premier Partner Airlines",
                airline=f"Direct Premier Flight to {destination}",
                flight_number="6E-108",
                origin=f"{origin}",
                destination=f"{destination}",
                departure_time="08:30 AM",
                arrival_time="10:45 AM",
                duration="2h 15m",
                status="scheduled",
                stops=0,
                price=8500.0,
                total_price=8500.0,
                currency="INR",
                source="Voyage Demo Provider",
                is_live=False
            )
        ]

    @classmethod
    def search_hotels(cls, destination: str, duration_days: int = 4, tier: str = "luxury_boutique", **kwargs) -> List[HotelOption]:
        dest_lower = destination.lower()
        nights = max(1, duration_days - 1)

        if "goa" in dest_lower:
            return [
                HotelOption(
                    id="htl-aria-001",
                    name="Aria Beach Resort & Spa",
                    location="Morjim Beach, North Goa",
                    rating=4.8,
                    price_per_night=3200.0,
                    cost_per_night=3200.0,
                    nights=nights,
                    total_cost=round(3200.0 * nights, 2),
                    total_price=round(3200.0 * nights, 2),
                    currency="INR",
                    amenities=["Private Beach Access", "Infinity Pool", "Ayurvedic Spa", "Breakfast Included"],
                    image="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                HotelOption(
                    id="htl-w-002",
                    name="W Goa Retreat",
                    location="Vagator Beach, North Goa",
                    rating=4.9,
                    price_per_night=6500.0,
                    cost_per_night=6500.0,
                    nights=nights,
                    total_cost=round(6500.0 * nights, 2),
                    total_price=round(6500.0 * nights, 2),
                    currency="INR",
                    amenities=["Rock Pool", "Private Cabanas", "VIP Concierge"],
                    image="https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=800&auto=format&fit=crop",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "jaipur" in dest_lower:
            return [
                HotelOption(
                    id="htl-samode-001",
                    name="Samode Haveli",
                    location="Gangapole, Old City, Jaipur",
                    rating=4.9,
                    price_per_night=4200.0,
                    cost_per_night=4200.0,
                    nights=nights,
                    total_cost=round(4200.0 * nights, 2),
                    total_price=round(4200.0 * nights, 2),
                    currency="INR",
                    amenities=["Royal Courtyard Pool", "Heritage Frescoes", "Artisanal Breakfast", "Palace Spa"],
                    image="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                HotelOption(
                    id="htl-rajpalace-002",
                    name="The Raj Palace Grand Heritage",
                    location="Zorawer Singh Gate, Amer Road, Jaipur",
                    rating=4.8,
                    price_per_night=6800.0,
                    cost_per_night=6800.0,
                    nights=nights,
                    total_cost=round(6800.0 * nights, 2),
                    total_price=round(6800.0 * nights, 2),
                    currency="INR",
                    amenities=["Museum Suites", "Royal Dining Pavilion", "Chauffeur Service"],
                    image="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "paris" in dest_lower:
            return [
                HotelOption(
                    id="htl-paris-001",
                    name="Hôtel Madame Rêve",
                    location="1st Arrondissement, Louvre, Paris",
                    rating=4.9,
                    price_per_night=18000.0,
                    cost_per_night=18000.0,
                    nights=nights,
                    total_cost=round(18000.0 * nights, 2),
                    total_price=round(18000.0 * nights, 2),
                    currency="INR",
                    amenities=["Eiffel View Rooftop", "Michelin Dining", "Private Terrace"],
                    image="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "kyoto" in dest_lower:
            return [
                HotelOption(
                    id="htl-kyoto-001",
                    name="Kyoto Grand Ryokan & Residence",
                    location="Gion Heritage District, Kyoto",
                    rating=4.9,
                    price_per_night=9500.0,
                    cost_per_night=9500.0,
                    nights=nights,
                    total_cost=round(9500.0 * nights, 2),
                    total_price=round(9500.0 * nights, 2),
                    currency="INR",
                    amenities=["Private Onsen Bath", "Zen Garden", "Traditional Kaiseki Breakfast"],
                    image="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        else:
            return [
                HotelOption(
                    id=f"htl-{destination.lower()[:3]}-001",
                    name=f"{destination} Boutique Residence & Spa",
                    location=f"Central District, {destination}",
                    rating=4.8,
                    price_per_night=3800.0,
                    cost_per_night=3800.0,
                    nights=nights,
                    total_cost=round(3800.0 * nights, 2),
                    total_price=round(3800.0 * nights, 2),
                    currency="INR",
                    amenities=["City Views", "Spa & Wellness", "Curated Breakfast", "Concierge"],
                    image="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]

    @classmethod
    def search_restaurants(cls, destination: str, duration_days: int = 4) -> Dict[str, Any]:
        mode = cls.get_api_mode()
        if mode == "live" and GooglePlacesProvider.is_configured():
            live_dining = GooglePlacesProvider.search_restaurants(destination=destination)
            if live_dining:
                total_est = sum(item.cost for item in live_dining)
                return {
                    "source": "Google Places",
                    "is_live": True,
                    "items": [item.model_dump() for item in live_dining],
                    "total_estimated": float(total_est)
                }

        dest_lower = destination.lower()
        if "jaipur" in dest_lower:
            items = [
                RestaurantOption(
                    id="din-jai-1",
                    name="1135 AD Amber Fort",
                    cuisine="Royal Rajasthani Fine Dining",
                    meal_type="Dinner",
                    price_category="Fine Dining",
                    rating=4.9,
                    cost=2400.0,
                    location="Amer Fort Palace, Jaipur",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                RestaurantOption(
                    id="din-jai-2",
                    name="Caffé Palladio",
                    cuisine="Heritage Mediterranean & Mezze",
                    meal_type="Lunch",
                    price_category="Curated",
                    rating=4.8,
                    cost=1600.0,
                    location="Narain Niwas, Jaipur",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                RestaurantOption(
                    id="din-jai-3",
                    name="Baradari City Palace",
                    cuisine="Contemporary Indian & High Tea",
                    meal_type="Dinner",
                    price_category="Fine Dining",
                    rating=4.7,
                    cost=2000.0,
                    location="City Palace, Jaipur",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "paris" in dest_lower:
            items = [
                RestaurantOption(
                    id="din-par-1",
                    name="Le Jules Verne (Eiffel Tower)",
                    cuisine="Michelin Haute French Cuisine",
                    meal_type="Dinner",
                    price_category="Ultra Fine Dining",
                    rating=4.9,
                    cost=12000.0,
                    location="Champ de Mars, Eiffel Tower, Paris",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                RestaurantOption(
                    id="din-par-2",
                    name="Café de Flore",
                    cuisine="Iconic Parisian Bistro & Wine",
                    meal_type="Lunch",
                    price_category="Curated",
                    rating=4.7,
                    cost=3200.0,
                    location="Saint-Germain-des-Prés, Paris",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                RestaurantOption(
                    id="din-par-3",
                    name="Girafe Paris",
                    cuisine="Seafood & Terrace Views of Eiffel Tower",
                    meal_type="Dinner",
                    price_category="Fine Dining",
                    rating=4.8,
                    cost=7500.0,
                    location="Place du Trocadéro, Paris",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "goa" in dest_lower:
            items = [
                RestaurantOption(
                    id="din-1",
                    name="Cavatina Cuchina",
                    cuisine="Contemporary Goan Chef Tasting",
                    meal_type="Dinner",
                    price_category="Fine Dining",
                    rating=4.9,
                    cost=2400.0,
                    location="Benaulim, Goa",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                RestaurantOption(
                    id="din-2",
                    name="Gunpowder Assagao",
                    cuisine="South Indian Coastal & Cocktails",
                    meal_type="Lunch",
                    price_category="Casual Fine",
                    rating=4.8,
                    cost=1200.0,
                    location="Assagao, North Goa",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                RestaurantOption(
                    id="din-3",
                    name="Jamun Goa",
                    cuisine="Artisanal Heritage Dining",
                    meal_type="Dinner",
                    price_category="Fine Dining",
                    rating=4.7,
                    cost=2000.0,
                    location="Assagao, North Goa",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        else:
            items = [
                RestaurantOption(
                    id=f"din-{destination.lower()[:3]}-1",
                    name=f"The Heritage Bistro {destination}",
                    cuisine=f"Curated {destination} Gastronomy",
                    meal_type="Dinner",
                    price_category="Fine Dining",
                    rating=4.8,
                    cost=2200.0,
                    location=f"Old Town, {destination}",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                RestaurantOption(
                    id=f"din-{destination.lower()[:3]}-2",
                    name=f"Café Promenade {destination}",
                    cuisine="Artisanal Coffee & Local Brunch",
                    meal_type="Lunch",
                    price_category="Curated",
                    rating=4.7,
                    cost=1200.0,
                    location=f"Central Square, {destination}",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]

        total_est = sum(item.cost for item in items)
        return {
            "source": "Voyage Demo Provider",
            "is_live": False,
            "items": [item.model_dump() for item in items],
            "total_estimated": float(total_est)
        }

    @classmethod
    def search_activities(cls, destination: str, duration_days: int = 4) -> Dict[str, Any]:
        mode = cls.get_api_mode()
        if mode == "live" and GooglePlacesProvider.is_configured():
            live_acts = GooglePlacesProvider.search_attractions(destination=destination)
            if live_acts:
                total_est = sum(item.cost for item in live_acts)
                return {
                    "source": "Google Places",
                    "is_live": True,
                    "items": [item.model_dump() for item in live_acts],
                    "total_estimated": float(total_est)
                }

        dest_lower = destination.lower()
        if "jaipur" in dest_lower:
            items = [
                ActivityOption(
                    id="act-jai-1",
                    name="Amber Fort & Nahargarh Fort Sunset Tour",
                    category="Heritage & Culture",
                    rating=4.9,
                    cost=1800.0,
                    duration="3.5 hours",
                    location="Amer, Jaipur",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                ActivityOption(
                    id="act-jai-2",
                    name="City Palace & Hawa Mahal Photography Walk",
                    category="Sightseeing & Photography",
                    rating=4.8,
                    cost=1200.0,
                    duration="2.5 hours",
                    location="Old City, Jaipur",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                ActivityOption(
                    id="act-jai-3",
                    name="Johari Bazaar Gemstone & Artisanal Textile Trail",
                    category="Culture & Shopping",
                    rating=4.7,
                    cost=1000.0,
                    duration="2.0 hours",
                    location="Johari Bazaar, Jaipur",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "paris" in dest_lower:
            items = [
                ActivityOption(
                    id="act-par-1",
                    name="Louvre Museum Masterpieces VIP Tour",
                    category="Art & History",
                    rating=4.9,
                    cost=4500.0,
                    duration="3 hours",
                    location="Louvre Museum, Paris",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                ActivityOption(
                    id="act-par-2",
                    name="Seine River Sunset Champagne Cruise",
                    category="Cruise & Sightseeing",
                    rating=4.8,
                    cost=3200.0,
                    duration="1.5 hours",
                    location="Eiffel Tower Pier, Paris",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "kyoto" in dest_lower:
            items = [
                ActivityOption(
                    id="act-kyo-1",
                    name="Fushimi Inari Taisha Early Morning Shrine Walk",
                    category="Cultural Heritage",
                    rating=4.9,
                    cost=1200.0,
                    duration="3 hours",
                    location="Fushimi Ward, Kyoto",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                ActivityOption(
                    id="act-kyo-2",
                    name="Arashiyama Bamboo Grove & Tenryu-ji Temple",
                    category="Nature & Zen Gardens",
                    rating=4.8,
                    cost=1500.0,
                    duration="2.5 hours",
                    location="Arashiyama, Kyoto",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "goa" in dest_lower:
            items = [
                ActivityOption(
                    id="act-1",
                    name="Private Mandovi Catamaran Sunset Cruise",
                    category="Yachting",
                    rating=4.9,
                    cost=2500.0,
                    duration="2 hours",
                    location="Panjim, Goa",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                ActivityOption(
                    id="act-2",
                    name="Fontainhas Latin Quarter Heritage Walk",
                    category="Culture",
                    rating=4.8,
                    cost=1200.0,
                    duration="2 hours",
                    location="Panjim, Goa",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                ActivityOption(
                    id="act-3",
                    name="Backwaters Sea Kayaking & Snorkeling",
                    category="Adventure",
                    rating=4.7,
                    cost=2000.0,
                    duration="3 hours",
                    location="Grand Island, Goa",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        else:
            items = [
                ActivityOption(
                    id=f"act-{destination.lower()[:3]}-1",
                    name=f"Historic Highlights & Landmark Walk in {destination}",
                    category="Sightseeing & Culture",
                    rating=4.8,
                    cost=1500.0,
                    duration="2.5 hours",
                    location=f"{destination}",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                ActivityOption(
                    id=f"act-{destination.lower()[:3]}-2",
                    name=f"Sunset Panorama & Photography Excursion",
                    category="Experiences",
                    rating=4.7,
                    cost=1200.0,
                    duration="2.0 hours",
                    location=f"{destination}",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]

        total_est = sum(item.cost for item in items)
        return {
            "source": "Voyage Demo Provider",
            "is_live": False,
            "items": [item.model_dump() for item in items],
            "total_estimated": float(total_est)
        }

    @classmethod
    def search_transport(cls, destination: str, duration_days: int = 4) -> Dict[str, Any]:
        dest_lower = destination.lower()
        if "jaipur" in dest_lower:
            items = [
                TransportOption(
                    id="trn-jai-1",
                    name="Airport Chauffeur Sedan (JAI)",
                    vehicle_type="Chauffeur Sedan",
                    cost=800.0,
                    duration="45 mins",
                    route="Jaipur Airport (JAI) ⇄ Hotel",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                TransportOption(
                    id="trn-jai-2",
                    name="Jaipur Heritage City Day Cab",
                    vehicle_type="Private SUV",
                    cost=1600.0,
                    duration="Full Day",
                    route="Old City & Amer Fort Exploration",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "goa" in dest_lower:
            items = [
                TransportOption(
                    id="trn-1",
                    name="Airport Executive EV Sedan",
                    vehicle_type="Electric Sedan",
                    cost=1100.0,
                    duration="45 mins",
                    route="Airport ⇄ Resort",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                TransportOption(
                    id="trn-2",
                    name="North Goa Day Chauffeur Pass",
                    vehicle_type="SUV",
                    cost=1500.0,
                    duration="Full Day",
                    route="Assagao, Morjim, Vagator Circuit",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        else:
            items = [
                TransportOption(
                    id=f"trn-{destination.lower()[:3]}-1",
                    name=f"Airport Executive Transfer ({destination})",
                    vehicle_type="Chauffeur Sedan",
                    cost=1000.0,
                    duration="45 mins",
                    route=f"Airport ⇄ {destination}",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]

        total_est = sum(item.cost for item in items)
        return {
            "source": "Voyage Demo Provider",
            "is_live": False,
            "items": [item.model_dump() for item in items],
            "total_estimated": float(total_est)
        }
