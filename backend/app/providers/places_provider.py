import os
import json
import urllib.request
import urllib.parse
from typing import List, Optional, Dict, Any
from app.providers.base import RestaurantOption, ActivityOption

class GooglePlacesProvider:
    """
    Google Places API Provider for live restaurants, dining venues, and attractions.
    """

    @classmethod
    def is_configured(cls) -> bool:
        key = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()
        return bool(key)

    @classmethod
    def search_restaurants(
        cls,
        destination: str,
        cuisine_or_query: str = "romantic restaurants and beach cafes",
        duration_days: int = 4
    ) -> Optional[List[RestaurantOption]]:
        api_key = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()
        if not api_key:
            return None

        try:
            query = f"{cuisine_or_query} in {destination}"
            params = {
                "query": query,
                "key": api_key
            }
            url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?{urllib.parse.urlencode(params)}"

            req = urllib.request.Request(url, headers={"User-Agent": "Voyage-AI-Concierge/1.0"})
            with urllib.request.urlopen(req, timeout=5.0) as response:
                payload = json.loads(response.read().decode("utf-8"))
                results_data = payload.get("results", [])
                if not results_data:
                    return None

                restaurants: List[RestaurantOption] = []
                for idx, place in enumerate(results_data[:4]):
                    place_id = place.get("place_id", f"gp_rest_{idx}")
                    name = place.get("name", "Curated Dining Venue")
                    address = place.get("formatted_address", f"{destination}")
                    rating = float(place.get("rating", 4.7))
                    price_level_num = place.get("price_level", 2)
                    price_symbol = "$" * max(1, min(4, price_level_num))

                    # Estimated meal for two based on price level
                    base_est = 1800.0 * max(1, price_level_num)

                    restaurants.append(RestaurantOption(
                        id=f"rest-gp-{place_id[:10]}",
                        provider="Google Places",
                        name=name,
                        location=address,
                        rating=rating,
                        cuisine="Coastal & Regional Dining",
                        price_level=price_symbol,
                        estimated_cost=base_est,
                        currency="INR",
                        distance=f"{idx * 1.5 + 1:.1f} km from center",
                        source="Google Places",
                        is_live=True
                    ))

                return restaurants if restaurants else None
        except Exception as e:
            print(f"[GooglePlacesProvider] Restaurant search failed: {e}")
            return None

    @classmethod
    def search_attractions(
        cls,
        destination: str,
        query: str = "top sightseeing and attractions",
        duration_days: int = 4
    ) -> Optional[List[ActivityOption]]:
        api_key = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()
        if not api_key:
            return None

        try:
            full_query = f"{query} in {destination}"
            params = {
                "query": full_query,
                "key": api_key
            }
            url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?{urllib.parse.urlencode(params)}"

            req = urllib.request.Request(url, headers={"User-Agent": "Voyage-AI-Concierge/1.0"})
            with urllib.request.urlopen(req, timeout=5.0) as response:
                payload = json.loads(response.read().decode("utf-8"))
                results_data = payload.get("results", [])
                if not results_data:
                    return None

                activities: List[ActivityOption] = []
                for idx, place in enumerate(results_data[:duration_days]):
                    place_id = place.get("place_id", f"gp_act_{idx}")
                    name = place.get("name", "Curated Attraction")
                    address = place.get("formatted_address", destination)
                    rating = float(place.get("rating", 4.8))

                    cost_by_idx = [2500.0, 1200.0, 2000.0, 800.0, 1500.0]
                    cost = cost_by_idx[idx % len(cost_by_idx)]

                    activities.append(ActivityOption(
                        id=f"act-gp-{place_id[:10]}",
                        provider="Google Places",
                        title=name,
                        name=name,
                        location=address,
                        rating=rating,
                        duration="3 hours",
                        cost=cost,
                        price=cost,
                        currency="INR",
                        day=idx + 1,
                        source="Google Places",
                        is_live=True
                    ))

                return activities if activities else None
        except Exception as e:
            print(f"[GooglePlacesProvider] Attraction search failed: {e}")
            return None
