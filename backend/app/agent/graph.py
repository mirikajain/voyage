from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from app.agent.state import AgentState
from app.agent.nodes import (
    parse_request_node,
    load_preferences_node,
    search_travel_node,
    compare_options_node,
    check_budget_node,
    optimize_budget_node,
    build_itinerary_node,
    prepare_recommendation_node
)

def should_optimize(state: AgentState) -> Literal["optimize_budget", "build_itinerary"]:
    """
    Conditional edge:
    If total cost exceeds requested budget and we haven't reached 3 attempts, try optimization.
    Otherwise proceed to build itinerary.
    """
    is_exceeded = state.get("is_budget_exceeded", False)
    attempts = state.get("optimization_attempts", 0)

    if is_exceeded and attempts < 3:
        return "optimize_budget"
    return "build_itinerary"

def create_voyage_agent_graph():
    """
    Constructs the compiled LangGraph StateGraph with conditional budget loop
    and in-memory checkpointing.
    """
    workflow = StateGraph(AgentState)

    # Register all nodes
    workflow.add_node("parse_request", parse_request_node)
    workflow.add_node("load_preferences", load_preferences_node)
    workflow.add_node("search_travel", search_travel_node)
    workflow.add_node("compare_options", compare_options_node)
    workflow.add_node("check_budget", check_budget_node)
    workflow.add_node("optimize_budget", optimize_budget_node)
    workflow.add_node("build_itinerary", build_itinerary_node)
    workflow.add_node("prepare_recommendation", prepare_recommendation_node)

    # Define sequential edges
    workflow.add_edge(START, "parse_request")
    workflow.add_edge("parse_request", "load_preferences")
    workflow.add_edge("load_preferences", "search_travel")
    workflow.add_edge("search_travel", "compare_options")
    workflow.add_edge("compare_options", "check_budget")

    # Conditional branching for budget check
    workflow.add_conditional_edges(
        "check_budget",
        should_optimize,
        {
            "optimize_budget": "optimize_budget",
            "build_itinerary": "build_itinerary"
        }
    )

    # Loop back from optimize_budget to check_budget
    workflow.add_edge("optimize_budget", "check_budget")

    # Finalization edges
    workflow.add_edge("build_itinerary", "prepare_recommendation")
    workflow.add_edge("prepare_recommendation", END)

    # Attach in-memory checkpointer
    checkpointer = MemorySaver()
    compiled_app = workflow.compile(checkpointer=checkpointer)
    
    return compiled_app, checkpointer

# Singleton instance
voyage_agent_app, voyage_checkpointer = create_voyage_agent_graph()
