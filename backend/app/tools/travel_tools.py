from typing import List, Dict, Any, Optional
from app.services.travel_service import TravelService

def search_flights(
    destination: str,
    origin: str = "Mumbai",
    departure_date: Optional[str] = None,
    return_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Search for flights via Aviationstack or curated fallback."""
    results = TravelService.search_flights(
        destination=destination,
        origin=origin,
        departure_date=departure_date,
        return_date=return_date
    )
    return [r.model_dump() for r in results]

def search_hotels(
    destination: str,
    duration_days: int = 4,
    tier: str = "boutique"
) -> List[Dict[str, Any]]:
    """Search for accommodations with dynamic duration scaling."""
    results = TravelService.search_hotels(
        destination=destination,
        duration_days=duration_days,
        tier=tier
    )
    return [r.model_dump() for r in results]

def search_restaurants(
    destination: str,
    duration_days: int = 4
) -> Dict[str, Any]:
    """Search curated dining and gastronomic options via Google Places or curated fallback."""
    return TravelService.search_restaurants(
        destination=destination,
        duration_days=duration_days
    )

def search_activities(
    destination: str,
    duration_days: int = 4
) -> Dict[str, Any]:
    """Search curated experiences and activities via Google Places or curated fallback."""
    return TravelService.search_activities(
        destination=destination,
        duration_days=duration_days
    )

def search_transport(
    destination: str,
    duration_days: int = 4
) -> Dict[str, Any]:
    """Search executive EV transfers and local transit."""
    return TravelService.search_transport(
        destination=destination,
        duration_days=duration_days
    )
