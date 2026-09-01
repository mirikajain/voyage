from typing import Dict, Any, Tuple, Optional

def calculate_total_cost(
    flight_cost: float,
    hotel_cost: float,
    dining_cost: float,
    activities_cost: float,
    transport_cost: float
) -> float:
    """Calculate the total estimated trip cost across all categories."""
    return round(float(flight_cost) + float(hotel_cost) + float(dining_cost) + float(activities_cost) + float(transport_cost), 2)

def evaluate_budget_cushion(total_cost: float, budget: float) -> Tuple[bool, float]:
    """
    Returns (is_within_budget, remaining_buffer_or_overage).
    """
    diff = round(float(budget) - float(total_cost), 2)
    is_within = diff >= 0
    return is_within, diff

def generate_optimized_options(
    hotel_cost: float,
    flight_cost: float,
    dining_cost: float,
    activity_cost: float = 0.0,
    transport_cost: float = 0.0,
    total_budget: float = 40000.0,
    duration_days: int = 4,
    attempt: int = 0,
    activities_cost: Optional[float] = None,
    **kwargs: Any
) -> Dict[str, Any]:
    """
    Attempt to reduce category costs to fit within total_budget without compromising essentials.
    Supports iterative optimization across attempts.
    """
    # Defensive parameter resolution
    h_cost = float(hotel_cost or 0.0)
    f_cost = float(flight_cost or 0.0)
    d_cost = float(dining_cost or 0.0)
    
    if activities_cost is not None:
        a_cost = float(activities_cost)
    elif "activities_cost" in kwargs:
        a_cost = float(kwargs["activities_cost"])
    else:
        a_cost = float(activity_cost or 0.0)
        
    t_cost = float(transport_cost or 0.0)
    
    if "user_budget" in kwargs:
        t_budget = float(kwargs["user_budget"])
    elif "budget" in kwargs:
        t_budget = float(kwargs["budget"])
    else:
        t_budget = float(total_budget or 0.0)
        
    days = max(1, int(duration_days or kwargs.get("duration", 4)))
    att = int(attempt or kwargs.get("attempts", 0))
    
    current_total = h_cost + f_cost + d_cost + a_cost + t_cost

    opt_hotel = h_cost
    opt_flight = f_cost
    opt_dining = d_cost
    opt_activity = a_cost
    opt_transport = t_cost
    change_desc = "No cost reduction needed"

    if current_total > t_budget and t_budget > 0:
        if att == 0:
            # Attempt 1 (attempt index 0): Optimize lodging to value boutique tier
            opt_hotel = round(max(h_cost * 0.70, 1200.0 * days), 2) if h_cost > 0 else 0.0
            saved = round(h_cost - opt_hotel, 2)
            change_desc = f"Selected value tier boutique lodging (saved ₹{int(saved):,})"
        elif att == 1:
            # Attempt 2 (attempt index 1): Optimize lodging + dining & activities
            opt_hotel = round(max(h_cost * 0.65, 1000.0 * days), 2) if h_cost > 0 else 0.0
            opt_dining = round(max(d_cost * 0.70, 600.0 * days), 2) if d_cost > 0 else 0.0
            opt_activity = round(max(a_cost * 0.60, 400.0 * days), 2) if a_cost > 0 else 0.0
            saved = round((h_cost + d_cost + a_cost) - (opt_hotel + opt_dining + opt_activity), 2)
            change_desc = f"Optimized dining & selective excursion package (saved ₹{int(saved):,})"
        else:
            # Attempt 3+ (attempt index 2+): Full package optimization with saver flights and transit
            opt_hotel = round(max(h_cost * 0.60, 900.0 * days), 2) if h_cost > 0 else 0.0
            opt_flight = round(max(f_cost * 0.85, 3000.0), 2) if f_cost > 0 else 0.0
            opt_dining = round(max(d_cost * 0.60, 500.0 * days), 2) if d_cost > 0 else 0.0
            opt_activity = round(max(a_cost * 0.50, 300.0 * days), 2) if a_cost > 0 else 0.0
            opt_transport = round(max(t_cost * 0.60, 400.0 * days), 2) if t_cost > 0 else 0.0
            saved = round(current_total - (opt_hotel + opt_flight + opt_dining + opt_activity + opt_transport), 2)
            change_desc = f"Applied saver airfare & shared transit passes (saved ₹{int(saved):,})"

    new_total = round(opt_hotel + opt_flight + opt_dining + opt_activity + opt_transport, 2)
    total_savings = round(max(0.0, current_total - new_total), 2)

    return {
        "hotel_cost": opt_hotel,
        "flight_cost": opt_flight,
        "dining_cost": opt_dining,
        "activity_cost": opt_activity,
        "activities_cost": opt_activity,
        "transport_cost": opt_transport,
        "total": new_total,
        "total_cost": new_total,
        "savings": total_savings,
        "change_description": change_desc
    }
