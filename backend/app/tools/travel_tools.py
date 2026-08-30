from typing import List, Dict, Any
from app.services.travel_service import MockTravelService

def search_flights(destination: str, origin: str = "Mumbai") -> Dict[str, Any]:
    """Search for flights between origin and destination."""
    return MockTravelService.get_flights(destination=destination, origin=origin)

def search_hotels(destination: str, duration_days: int = 4, tier: str = "boutique") -> List[Dict[str, Any]]:
    """Search for accommodations in the target destination."""
    return MockTravelService.get_hotels(destination=destination, duration_days=duration_days, tier=tier)

def search_restaurants(destination: str, duration_days: int = 4) -> Dict[str, Any]:
    """Search curated dining and gastronomic options."""
    return MockTravelService.get_dining(destination=destination, duration_days=duration_days)

def search_activities(destination: str, duration_days: int = 4) -> Dict[str, Any]:
    """Search curated experiences, tours, and activities."""
    return MockTravelService.get_activities(destination=destination, duration_days=duration_days)

def search_transport(destination: str, duration_days: int = 4) -> Dict[str, Any]:
    """Search executive EV transfers and local transit."""
    return MockTravelService.get_transport(destination=destination, duration_days=duration_days)
