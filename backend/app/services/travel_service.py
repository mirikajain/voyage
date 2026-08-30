from typing import List, Dict, Any, Optional

class MockTravelService:
    """
    Simulated External Travel Provider Layer.
    In production, these methods will connect to live partner APIs (Amadeus, Booking.com, Viator, etc.).
    """
    
    @staticmethod
    def get_hotels(destination: str, duration_days: int, tier: str = "boutique") -> List[Dict[str, Any]]:
        dest_lower = destination.lower()
        if "goa" in dest_lower:
            return [
                {
                    "id": "htl-aria-001",
                    "name": "Aria Beach Resort",
                    "location": "Morjim & Ashwem Coast, North Goa",
                    "total_cost": 12800.0,
                    "cost_per_night": 4266.67,
                    "rating": 4.8,
                    "review_count": 312,
                    "currency": "INR",
                    "tier": "luxury_boutique",
                    "amenities": ["Beachfront Access", "Infinity Pool", "Artisanal Breakfast"],
                    "provider": "Mock Partner Hospitality Network"
                },
                {
                    "id": "htl-ahilya-002",
                    "name": "Ahilya by the Sea",
                    "location": "Nerul Bay, Goa",
                    "total_cost": 18400.0,
                    "cost_per_night": 6133.33,
                    "rating": 4.9,
                    "review_count": 184,
                    "currency": "INR",
                    "tier": "ultra_luxury",
                    "amenities": ["Private Heritage Villa", "Seafront Dining", "Spa Codage"],
                    "provider": "Mock Partner Hospitality Network"
                },
                {
                    "id": "htl-budget-003",
                    "name": "Fontainhas Heritage Inn",
                    "location": "Panjim, Goa",
                    "total_cost": 7200.0,
                    "cost_per_night": 2400.0,
                    "rating": 4.5,
                    "review_count": 98,
                    "currency": "INR",
                    "tier": "value_heritage",
                    "amenities": ["Historic Quarter", "Breakfast included"],
                    "provider": "Mock Partner Hospitality Network"
                }
            ]
        elif "paris" in dest_lower:
            return [
                {
                    "id": "htl-paris-001",
                    "name": "Hôtel Madame Rêve",
                    "location": "Louvre District, Paris",
                    "total_cost": 48000.0,
                    "cost_per_night": 8000.0,
                    "rating": 4.8,
                    "review_count": 420,
                    "currency": "INR",
                    "tier": "luxury_boutique",
                    "amenities": ["Eiffel Tower View", "Michelin Dining"],
                    "provider": "Mock Partner Hospitality Network"
                }
            ]
        else:
            return [
                {
                    "id": f"htl-{dest_lower}-001",
                    "name": f"{destination} Grand Residence",
                    "location": f"Central {destination}",
                    "total_cost": 14000.0,
                    "cost_per_night": 4666.67,
                    "rating": 4.7,
                    "review_count": 150,
                    "currency": "INR",
                    "tier": "luxury_boutique",
                    "amenities": ["Concierge Suite", "Complimentary Lounge"],
                    "provider": "Mock Partner Hospitality Network"
                }
            ]

    @staticmethod
    def get_flights(destination: str, origin: str = "Mumbai") -> Dict[str, Any]:
        dest_lower = destination.lower()
        if "goa" in dest_lower:
            return {
                "id": "flt-indigo-001",
                "airline": "IndiGo Premier / Vistara Club",
                "origin": origin,
                "destination": "Goa (GOX)",
                "route": "BOM ⇄ GOX (Direct 1h 15m)",
                "price": 8000.0,
                "currency": "INR",
                "provider": "Mock Flight Aggregator"
            }
        elif "paris" in dest_lower:
            return {
                "id": "flt-airfrance-001",
                "airline": "Air France Priority",
                "origin": origin,
                "destination": "Paris (CDG)",
                "route": "BOM ⇄ CDG Return",
                "price": 54000.0,
                "currency": "INR",
                "provider": "Mock Flight Aggregator"
            }
        else:
            return {
                "id": f"flt-{dest_lower}-001",
                "airline": "Air India Premier",
                "origin": origin,
                "destination": destination,
                "route": f"{origin} ⇄ {destination}",
                "price": 12000.0,
                "currency": "INR",
                "provider": "Mock Flight Aggregator"
            }

    @staticmethod
    def get_dining(destination: str, duration_days: int) -> Dict[str, Any]:
        dest_lower = destination.lower()
        if "goa" in dest_lower:
            return {
                "total_estimated": 7000.0,
                "currency": "INR",
                "items": [
                    {"name": "Beachfront Sunset Tasting at Cavatina", "type": "Dinner Tasting", "estimated_cost": 2400.0},
                    {"name": "Assagao Garden Bistro (Jamun)", "type": "Heritage Dinner", "estimated_cost": 2000.0},
                    {"name": "Fontainhas Artisanal Breakfasts & Cafés", "type": "Daily Cafés", "estimated_cost": 1600.0},
                    {"name": "Curated Beach Bar Sundowners", "type": "Cocktails & Mezze", "estimated_cost": 1000.0}
                ]
            }
        else:
            return {
                "total_estimated": 12000.0,
                "currency": "INR",
                "items": [
                    {"name": f"Curated Chef Tasting in {destination}", "type": "Fine Dining", "estimated_cost": 7000.0},
                    {"name": "Local Bistros & Breakfasts", "type": "Daily Gastronomy", "estimated_cost": 5000.0}
                ]
            }

    @staticmethod
    def get_activities(destination: str, duration_days: int) -> Dict[str, Any]:
        dest_lower = destination.lower()
        if "goa" in dest_lower:
            return {
                "total_estimated": 6500.0,
                "currency": "INR",
                "items": [
                    {"id": "act-1", "title": "Private Mandovi River Sunset Catamaran Cruise", "day": 1, "cost": 2500.0},
                    {"id": "act-2", "title": "Fontainhas Latin Quarter Guided Architectural Walk", "day": 2, "cost": 1200.0},
                    {"id": "act-3", "title": "Grand Island Backwaters Sea Kayaking & Snorkeling", "day": 3, "cost": 2000.0},
                    {"id": "act-4", "title": "Local Spice Plantation & Spice Trail Excursion", "day": 4, "cost": 800.0}
                ]
            }
        else:
            return {
                "total_estimated": 9000.0,
                "currency": "INR",
                "items": [
                    {"id": "act-gen-1", "title": f"Historic Highlights Tour of {destination}", "day": 2, "cost": 4500.0},
                    {"id": "act-gen-2", "title": "Private Sunset Scenic Cruise", "day": 3, "cost": 4500.0}
                ]
            }

    @staticmethod
    def get_transport(destination: str, duration_days: int) -> Dict[str, Any]:
        dest_lower = destination.lower()
        if "goa" in dest_lower:
            return {
                "total_estimated": 3500.0,
                "currency": "INR",
                "items": [
                    {"type": "Airport Inbound & Outbound Executive EV Sedan (MOPA ⇄ Resort)", "estimated_cost": 2200.0},
                    {"type": "Local Chauffeur & Coastal Transit Credits", "estimated_cost": 1300.0}
                ]
            }
        else:
            return {
                "total_estimated": 4500.0,
                "currency": "INR",
                "items": [
                    {"type": f"Airport Transfer Sedan ({destination})", "estimated_cost": 3000.0},
                    {"type": "Local Transit & Metro Pass", "estimated_cost": 1500.0}
                ]
            }
