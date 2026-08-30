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
    Central Travel Service Orchestrator for Voyage.
    Routes queries to Aviationstack (flights), Google Places (restaurants/attractions),
    and Voyage Demo Provider (hotels, activities, transport).
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

        # Curated / Demo fallback based on destination
        dest_lower = destination.lower()
        if "goa" in dest_lower:
            return [
                FlightOption(
                    id="flt-indigo-001",
                    provider="IndiGo Premier / Vistara",
                    airline="IndiGo Premier / Vistara Club",
                    flight_number="6E-241",
                    origin=f"{origin} (BOM)",
                    destination="Goa (GOX)",
                    departure_time="08:45 AM",
                    arrival_time="10:05 AM",
                    duration="1h 20m",
                    status="scheduled",
                    stops=0,
                    price=8000.0,
                    total_price=8000.0,
                    currency="INR",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "jaipur" in dest_lower:
            return [
                FlightOption(
                    id="flt-indigo-jai-001",
                    provider="IndiGo Premier / Air India",
                    airline="IndiGo Premier 6E-552",
                    flight_number="6E-552",
                    origin=f"{origin} (BOM)",
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
                )
            ]
        elif "paris" in dest_lower:
            return [
                FlightOption(
                    id="flt-airfrance-001",
                    provider="Air France Priority",
                    airline="Air France AF-217",
                    flight_number="AF-217",
                    origin=f"{origin} (BOM)",
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
        else:
            return [
                FlightOption(
                    id=f"flt-{dest_lower}-001",
                    provider="Air India Premier",
                    airline="Air India Premier",
                    flight_number="AI-204",
                    origin=origin,
                    destination=destination,
                    departure_time="09:00 AM",
                    arrival_time="11:30 AM",
                    duration="2h 30m",
                    status="scheduled",
                    stops=0,
                    price=9000.0,
                    total_price=9000.0,
                    currency="INR",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]

    @classmethod
    def search_hotels(
        cls,
        destination: str,
        duration_days: int = 4,
        tier: str = "boutique"
    ) -> List[HotelOption]:
        """
        Hotel search with dynamic duration pricing and destination-specific inventory.
        """
        nights = max(1, duration_days - 1)
        dest_lower = destination.lower()

        if "goa" in dest_lower:
            rate_aria = 4266.67
            rate_ahilya = 6133.33
            rate_fontainhas = 2400.0

            return [
                HotelOption(
                    id="htl-aria-001",
                    provider="Aria Luxury Hospitality",
                    name="Aria Beach Resort",
                    location="Morjim & Ashwem Coast, North Goa",
                    rating=4.8,
                    review_count=312,
                    room_type="Oceanfront Pavilion",
                    amenities=["Beachfront Access", "Infinity Pool", "Artisanal Breakfast"],
                    price_per_night=rate_aria,
                    total_price=round(rate_aria * nights, 2),
                    currency="INR",
                    tier="luxury_boutique",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                HotelOption(
                    id="htl-ahilya-002",
                    provider="Heritage Retreats",
                    name="Ahilya by the Sea",
                    location="Nerul Bay, Goa",
                    rating=4.9,
                    review_count=184,
                    room_type="Sunrise Suite with Ocean Balcony",
                    amenities=["Private Heritage Villa", "Seafront Dining", "Spa Codage"],
                    price_per_night=rate_ahilya,
                    total_price=round(rate_ahilya * nights, 2),
                    currency="INR",
                    tier="ultra_luxury",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                HotelOption(
                    id="htl-budget-003",
                    provider="Heritage Stays",
                    name="Fontainhas Heritage Inn",
                    location="Panjim Latin Quarter, Goa",
                    rating=4.5,
                    review_count=98,
                    room_type="Standard Heritage Room",
                    amenities=["Historic Quarter", "Breakfast included"],
                    price_per_night=rate_fontainhas,
                    total_price=round(rate_fontainhas * nights, 2),
                    currency="INR",
                    tier="value_heritage",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "jaipur" in dest_lower:
            rate_samode = 4800.0
            rate_raj = 7200.0
            rate_alsisar = 2600.0

            return [
                HotelOption(
                    id="htl-samode-001",
                    provider="Heritage Haveli Collection",
                    name="Samode Haveli",
                    location="Old City, Gangapole, Jaipur",
                    rating=4.8,
                    review_count=290,
                    room_type="Deluxe Heritage Suite with Courtyard View",
                    amenities=["Mughal Pool", "Royal Courtyard", "Artisanal Breakfast"],
                    price_per_night=rate_samode,
                    total_price=round(rate_samode * nights, 2),
                    currency="INR",
                    tier="luxury_boutique",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                HotelOption(
                    id="htl-raj-002",
                    provider="Grand Royal Palaces",
                    name="The Raj Palace Heritage Residence",
                    location="Amer Road, Jaipur",
                    rating=4.9,
                    review_count=175,
                    room_type="Maharaja Royal Pavilion",
                    amenities=["Private Butler", "Museum Tour", "Palace Spa"],
                    price_per_night=rate_raj,
                    total_price=round(rate_raj * nights, 2),
                    currency="INR",
                    tier="ultra_luxury",
                    source="Voyage Demo Provider",
                    is_live=False
                ),
                HotelOption(
                    id="htl-alsisar-003",
                    provider="Heritage Stays Rajasthan",
                    name="Alsisar Haveli Heritage Stay",
                    location="Sansar Chandra Road, Jaipur",
                    rating=4.6,
                    review_count=120,
                    room_type="Standard Heritage Deluxe",
                    amenities=["Historic Haveli", "Pool & Breakfast included"],
                    price_per_night=rate_alsisar,
                    total_price=round(rate_alsisar * nights, 2),
                    currency="INR",
                    tier="value_heritage",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        elif "paris" in dest_lower:
            rate_madame = 8000.0
            return [
                HotelOption(
                    id="htl-paris-001",
                    provider="Parisian Collection",
                    name="Hôtel Madame Rêve",
                    location="Louvre District, Paris",
                    rating=4.8,
                    review_count=420,
                    room_type="Deluxe Courtyard King",
                    amenities=["Eiffel Tower View", "Michelin Dining"],
                    price_per_night=rate_madame,
                    total_price=round(rate_madame * nights, 2),
                    currency="INR",
                    tier="luxury_boutique",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]
        else:
            rate_gen = 4500.0
            return [
                HotelOption(
                    id=f"htl-{dest_lower}-001",
                    provider="Voyage Partner Collection",
                    name=f"{destination} Grand Residence & Suites",
                    location=f"Central {destination}",
                    rating=4.7,
                    review_count=150,
                    room_type="Executive Boutique Suite",
                    amenities=["Concierge Suite", "Complimentary Breakfast", "Terrace Lounge"],
                    price_per_night=rate_gen,
                    total_price=round(rate_gen * nights, 2),
                    currency="INR",
                    tier="luxury_boutique",
                    source="Voyage Demo Provider",
                    is_live=False
                )
            ]

    @classmethod
    def search_restaurants(
        cls,
        destination: str,
        duration_days: int = 4
    ) -> Dict[str, Any]:
        mode = cls.get_api_mode()

        # Try live Google Places provider when configured
        if mode == "live" and GooglePlacesProvider.is_configured():
            live_dining = GooglePlacesProvider.search_restaurants(
                destination=destination,
                duration_days=duration_days
            )
            if live_dining:
                total_est = sum(d.estimated_cost for d in live_dining)
                return {
                    "total_estimated": total_est,
                    "currency": "INR",
                    "source": "Google Places",
                    "is_live": True,
                    "items": [d.model_dump() for d in live_dining]
                }

        # Scaled Demo fallback
        dest_lower = destination.lower()
        if "goa" in dest_lower:
            base_items = [
                {"name": "Beachfront Sunset Tasting at Cavatina", "type": "Dinner Tasting", "estimated_cost": 2400.0},
                {"name": "Assagao Garden Bistro (Jamun)", "type": "Heritage Dinner", "estimated_cost": 2000.0},
                {"name": "Fontainhas Artisanal Breakfasts & Cafés", "type": "Daily Cafés", "estimated_cost": 1600.0},
                {"name": "Curated Beach Bar Sundowners", "type": "Cocktails & Mezze", "estimated_cost": 1000.0}
            ]
            selected_items = base_items[:max(2, duration_days)]
            total = sum(i["estimated_cost"] for i in selected_items)
            return {
                "total_estimated": total,
                "currency": "INR",
                "source": "Voyage Demo Provider",
                "is_live": False,
                "items": selected_items
            }
        elif "jaipur" in dest_lower:
            base_items = [
                {"name": "1135 AD Amber Fort Candlelight Dinner", "type": "Royal Rajasthani Tasting", "estimated_cost": 2400.0},
                {"name": "Caffé Palladio Garden & Mezze Lunch", "type": "Heritage Café", "estimated_cost": 1600.0},
                {"name": "Baradari City Palace Courtyard Dining", "type": "Palace Gastronomy", "estimated_cost": 2000.0},
                {"name": "Laxmi Mishthan Bhandar (LMB) Heritage Breakfast", "type": "Local Breakfast", "estimated_cost": 800.0}
            ]
            selected_items = base_items[:max(2, duration_days)]
            total = sum(i["estimated_cost"] for i in selected_items)
            return {
                "total_estimated": total,
                "currency": "INR",
                "source": "Voyage Demo Provider",
                "is_live": False,
                "items": selected_items
            }
        else:
            daily_rate = 1800.0
            return {
                "total_estimated": daily_rate * duration_days,
                "currency": "INR",
                "source": "Voyage Demo Provider",
                "is_live": False,
                "items": [
                    {"name": f"Curated Chef Tasting in {destination}", "type": "Fine Dining", "estimated_cost": round(daily_rate * 0.6 * duration_days, 2)},
                    {"name": f"Local {destination} Bistros & Breakfasts", "type": "Daily Gastronomy", "estimated_cost": round(daily_rate * 0.4 * duration_days, 2)}
                ]
            }

    @classmethod
    def search_activities(
        cls,
        destination: str,
        duration_days: int = 4
    ) -> Dict[str, Any]:
        mode = cls.get_api_mode()

        # Try live Google Places provider for attractions when configured
        if mode == "live" and GooglePlacesProvider.is_configured():
            live_acts = GooglePlacesProvider.search_attractions(
                destination=destination,
                duration_days=duration_days
            )
            if live_acts:
                total_est = sum(a.cost for a in live_acts)
                return {
                    "total_estimated": total_est,
                    "currency": "INR",
                    "source": "Google Places",
                    "is_live": True,
                    "items": [a.model_dump() for a in live_acts]
                }

        # Scaled Demo fallback
        dest_lower = destination.lower()
        if "goa" in dest_lower:
            base_acts = [
                {"id": "act-1", "title": "Private Mandovi River Sunset Catamaran Cruise", "name": "Private Mandovi River Sunset Catamaran Cruise", "day": 1, "cost": 2500.0, "price": 2500.0},
                {"id": "act-2", "title": "Fontainhas Latin Quarter Guided Architectural Walk", "name": "Fontainhas Latin Quarter Guided Architectural Walk", "day": 2, "cost": 1200.0, "price": 1200.0},
                {"id": "act-3", "title": "Grand Island Backwaters Sea Kayaking & Snorkeling", "name": "Grand Island Backwaters Sea Kayaking & Snorkeling", "day": 3, "cost": 2000.0, "price": 2000.0},
                {"id": "act-4", "title": "Local Spice Plantation & Spice Trail Excursion", "name": "Local Spice Plantation & Spice Trail Excursion", "day": 4, "cost": 800.0, "price": 800.0},
                {"id": "act-5", "title": "Anjuna Coastal Cliff Yoga & Sunset Trail", "name": "Anjuna Coastal Cliff Yoga & Sunset Trail", "day": 5, "cost": 1200.0, "price": 1200.0}
            ]
            selected = base_acts[:max(1, duration_days)]
            total = sum(a["cost"] for a in selected)
            return {
                "total_estimated": total,
                "currency": "INR",
                "source": "Voyage Demo Provider",
                "is_live": False,
                "items": selected
            }
        elif "jaipur" in dest_lower:
            base_acts = [
                {"id": "act-jai-1", "title": "Amber Fort Private Guided Heritage & Nahargarh Sunset Tour", "name": "Amber Fort & Nahargarh Sunset", "day": 1, "cost": 1800.0, "price": 1800.0},
                {"id": "act-jai-2", "title": "City Palace & Hawa Mahal Royal Photography Walk", "name": "City Palace & Hawa Mahal Walk", "day": 2, "cost": 1200.0, "price": 1200.0},
                {"id": "act-jai-3", "title": "Jantar Mantar & Johari Bazaar Gemstone Trail", "name": "Johari Bazaar Gemstone Trail", "day": 3, "cost": 1000.0, "price": 1000.0},
                {"id": "act-jai-4", "title": "Elefantastic Ethical Elephant Sanctuary Excursion", "name": "Elephant Sanctuary Excursion", "day": 4, "cost": 2200.0, "price": 2200.0},
                {"id": "act-jai-5", "title": "Galta Ji (Monkey Temple) & Stepwell Tour", "name": "Stepwell & Temple Tour", "day": 5, "cost": 900.0, "price": 900.0}
            ]
            selected = base_acts[:max(1, duration_days)]
            total = sum(a["cost"] for a in selected)
            return {
                "total_estimated": total,
                "currency": "INR",
                "source": "Voyage Demo Provider",
                "is_live": False,
                "items": selected
            }
        else:
            daily_act = 1200.0
            return {
                "total_estimated": daily_act * duration_days,
                "currency": "INR",
                "source": "Voyage Demo Provider",
                "is_live": False,
                "items": [
                    {"id": "act-gen-1", "title": f"Historic Highlights & Cultural Tour of {destination}", "name": f"Historic Highlights of {destination}", "day": 1, "cost": daily_act * duration_days, "price": daily_act * duration_days}
                ]
            }

    @classmethod
    def search_transport(
        cls,
        destination: str,
        duration_days: int = 4
    ) -> Dict[str, Any]:
        dest_lower = destination.lower()
        if "goa" in dest_lower:
            transfer_cost = 2200.0
            local_transit = 400.0 * duration_days
            return {
                "total_estimated": transfer_cost + local_transit,
                "currency": "INR",
                "source": "Voyage Demo Provider",
                "is_live": False,
                "items": [
                    {"type": "Airport Inbound & Outbound Executive EV Sedan (MOPA ⇄ Resort)", "estimated_cost": transfer_cost},
                    {"type": "Local Chauffeur & Coastal Transit Credits", "estimated_cost": local_transit}
                ]
            }
        elif "jaipur" in dest_lower:
            transfer_cost = 1600.0
            local_transit = 350.0 * duration_days
            return {
                "total_estimated": transfer_cost + local_transit,
                "currency": "INR",
                "source": "Voyage Demo Provider",
                "is_live": False,
                "items": [
                    {"type": "Airport Inbound & Outbound Chauffeur Sedan (JAI ⇄ Haveli)", "estimated_cost": transfer_cost},
                    {"type": "City Heritage Transit & Tuk-Tuk Pass", "estimated_cost": local_transit}
                ]
            }
        else:
            return {
                "total_estimated": 2000.0 + (400.0 * duration_days),
                "currency": "INR",
                "source": "Voyage Demo Provider",
                "is_live": False,
                "items": [
                    {"type": f"Airport Transfer Sedan ({destination})", "estimated_cost": 2000.0},
                    {"type": "Local Transit Pass", "estimated_cost": 400.0 * duration_days}
                ]
            }

    @classmethod
    def build_provider_summary(
        cls,
        flights: List[FlightOption],
        hotels: List[HotelOption],
        dining: Dict[str, Any],
        activities: Dict[str, Any],
        transport: Dict[str, Any]
    ) -> Dict[str, Any]:
        flight_live = bool(flights and flights[0].is_live)
        dining_live = bool(dining.get("is_live", False))
        act_live = bool(activities.get("is_live", False))

        return {
            "flights": {
                "provider": flights[0].source if flights else "Voyage Demo Provider",
                "is_live": flight_live
            },
            "restaurants": {
                "provider": dining.get("source", "Voyage Demo Provider"),
                "is_live": dining_live
            },
            "hotels": {
                "provider": "Voyage Demo Provider",
                "is_live": False
            },
            "activities": {
                "provider": activities.get("source", "Voyage Demo Provider"),
                "is_live": act_live
            },
            "transport": {
                "provider": "Voyage Demo Provider",
                "is_live": False
            },
            "any_live": flight_live or dining_live or act_live
        }
