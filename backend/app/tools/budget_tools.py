from typing import Dict, Any, Tuple

def calculate_total_cost(
    flight_cost: float,
    hotel_cost: float,
    dining_cost: float,
    activities_cost: float,
    transport_cost: float
) -> float:
    """Calculate the total estimated trip cost across all categories."""
    return round(flight_cost + hotel_cost + dining_cost + activities_cost + transport_cost, 2)

def evaluate_budget_cushion(total_cost: float, budget: float) -> Tuple[bool, float]:
    """
    Returns (is_within_budget, remaining_buffer_or_overage).
    """
    diff = round(budget - total_cost, 2)
    is_within = diff >= 0
    return is_within, diff

def generate_optimized_options(
    destination: str,
    attempt: int,
    current_hotel: Dict[str, Any],
    current_dining: Dict[str, Any],
    current_activities: Dict[str, Any],
    current_transport: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Attempt to reduce costs without compromising safety or core comfort.
    Max 3 attempts.
    """
    if attempt == 1:
        # Attempt 1: Adjust hotel to heritage value tier
        new_hotel = {
            "id": "htl-budget-003",
            "name": "Fontainhas Heritage Inn",
            "location": f"Historic Quarter, {destination}",
            "total_cost": 7200.0,
            "cost_per_night": 2400.0,
            "rating": 4.5,
            "currency": "INR",
            "tier": "value_heritage",
            "provider": "Mock Partner Hospitality Network"
        }
        return {
            "hotel": new_hotel,
            "dining": current_dining,
            "activities": current_activities,
            "transport": current_transport,
            "change_description": "Switched to Fontainhas Heritage Inn (saved ₹5,600)"
        }
    elif attempt == 2:
        # Attempt 2: Rebalance dining & activities
        new_dining = {
            "total_estimated": 4500.0,
            "currency": "INR",
            "items": current_dining.get("items", [])[:2]
        }
        new_activities = {
            "total_estimated": 3500.0,
            "currency": "INR",
            "items": current_activities.get("items", [])[:2]
        }
        return {
            "hotel": current_hotel,
            "dining": new_dining,
            "activities": new_activities,
            "transport": current_transport,
            "change_description": "Optimized fine dining & excursion package (saved ₹5,500)"
        }
    else:
        # Attempt 3: Switch transport to local transit & consolidated schedule
        new_transport = {
            "total_estimated": 1800.0,
            "currency": "INR",
            "items": [{"type": "Shared EV Transfer & Metro Pass", "estimated_cost": 1800.0}]
        }
        return {
            "hotel": current_hotel,
            "dining": current_dining,
            "activities": current_activities,
            "transport": new_transport,
            "change_description": "Switched to shared EV transfer & transit pass (saved ₹1,700)"
        }
