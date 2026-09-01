from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from app.agent.state import AgentState
from app.agent.nodes import (
    parse_request_node,
    collect_details_node,
    route_after_collect_details,
    route_intent,
    search_flights_node,
    search_hotels_node,
    search_restaurants_node,
    search_activities_node,
    prepare_search_results_node,
    update_hotel_node,
    update_flights_node,
    update_activities_node,
    update_dining_node,
    update_transport_node,
    recalculate_trip_node,
    load_preferences_node,
    search_travel_node,
    compare_options_node,
    check_budget_node,
    optimize_budget_node,
    build_itinerary_node,
    prepare_payment_node,
    prepare_recommendation_node,
    execute_payment_node
)

def should_optimize_or_build(state: AgentState) -> str:
    """
    Evaluates whether the trip proposal exceeds requested total budget ceiling.
    If total > total_budget and optimization attempts < 3, loops through deterministic budget reduction.
    Otherwise advances to itinerary generation.
    """
    user_budget = state.get("budget")
    total = float(state.get("estimated_total") or 0.0)
    if user_budget is not None and total > float(user_budget) and state.get("optimization_attempts", 0) < 3:
        return "optimize_budget"
    return "build_itinerary"

def create_voyage_agent_graph():
    """
    Constructs the Voyage autonomous LangGraph workflow with intent-based conditional routing,
    conversational missing detail collection, granular follow-up category budget updates,
    and spend guardrails + payment layer.
    """
    workflow = StateGraph(AgentState)

    # 1. Parsing and state merging node
    workflow.add_node("parse_request", parse_request_node)

    # 2. Conversational detail collection node
    workflow.add_node("collect_details", collect_details_node)

    # 3. Specific search nodes (direct to results, no itinerary, no payment)
    workflow.add_node("search_flights_node", search_flights_node)
    workflow.add_node("search_hotels_node", search_hotels_node)
    workflow.add_node("search_restaurants_node", search_restaurants_node)
    workflow.add_node("search_activities_node", search_activities_node)
    workflow.add_node("prepare_search_results_node", prepare_search_results_node)

    # 4. Granular budget update nodes
    workflow.add_node("update_hotel", update_hotel_node)
    workflow.add_node("update_flights", update_flights_node)
    workflow.add_node("update_activities", update_activities_node)
    workflow.add_node("update_dining", update_dining_node)
    workflow.add_node("update_transport", update_transport_node)
    workflow.add_node("recalculate_trip", recalculate_trip_node)

    # 5. Full trip planning nodes
    workflow.add_node("load_preferences", load_preferences_node)
    workflow.add_node("search_travel", search_travel_node)
    workflow.add_node("compare_options", compare_options_node)
    workflow.add_node("check_budget", check_budget_node)
    workflow.add_node("optimize_budget", optimize_budget_node)
    workflow.add_node("build_itinerary", build_itinerary_node)
    workflow.add_node("prepare_payment", prepare_payment_node)
    workflow.add_node("prepare_recommendation", prepare_recommendation_node)
    workflow.add_node("execute_payment", execute_payment_node)

    # Set start node
    workflow.set_entry_point("parse_request")
    workflow.add_edge("parse_request", "collect_details")

    # Conversational detail collection routing
    workflow.add_conditional_edges(
        "collect_details",
        route_after_collect_details,
        {
            "needs_input": END,
            "flight_search": "search_flights_node",
            "hotel_search": "search_hotels_node",
            "restaurant_search": "search_restaurants_node",
            "activity_search": "search_activities_node",
            "update_hotel": "update_hotel",
            "update_flights": "update_flights",
            "update_activities": "update_activities",
            "update_dining": "update_dining",
            "update_transport": "update_transport",
            "recalculate_trip": "recalculate_trip",
            "check_budget": "check_budget",
            "trip_planning": "load_preferences"
        }
    )

    # Search paths terminate after formatting results
    workflow.add_edge("search_flights_node", "prepare_search_results_node")
    workflow.add_edge("search_hotels_node", "prepare_search_results_node")
    workflow.add_edge("search_restaurants_node", "prepare_search_results_node")
    workflow.add_edge("search_activities_node", "prepare_search_results_node")
    workflow.add_edge("prepare_search_results_node", END)

    # Granular update paths connect to budget verification
    workflow.add_edge("update_hotel", "check_budget")
    workflow.add_edge("update_flights", "check_budget")
    workflow.add_edge("update_activities", "check_budget")
    workflow.add_edge("update_dining", "check_budget")
    workflow.add_edge("update_transport", "check_budget")
    workflow.add_edge("recalculate_trip", "check_budget")

    # Trip planning execution path
    workflow.add_edge("load_preferences", "search_travel")
    workflow.add_edge("search_travel", "compare_options")
    workflow.add_edge("compare_options", "check_budget")

    # Budget optimization loop
    workflow.add_conditional_edges(
        "check_budget",
        should_optimize_or_build,
        {
            "optimize_budget": "optimize_budget",
            "build_itinerary": "build_itinerary"
        }
    )
    workflow.add_edge("optimize_budget", "check_budget")
    workflow.add_edge("build_itinerary", "prepare_payment")
    workflow.add_edge("prepare_payment", "prepare_recommendation")
    workflow.add_edge("prepare_recommendation", END)
    workflow.add_edge("execute_payment", END)

    checkpointer = MemorySaver()
    return workflow.compile(checkpointer=checkpointer)

# Global compiled application
voyage_agent_app = create_voyage_agent_graph()
