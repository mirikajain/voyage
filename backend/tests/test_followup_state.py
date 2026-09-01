import sys
import os

# Ensure utf-8 encoding on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.agent.graph import voyage_agent_app
from app.agent.prompts import parse_request_deterministic
from app.models.schemas import AgentRunRequest
import asyncio

def test_deterministic_parser():
    print("\n--- TESTING DETERMINISTIC PARSER ---")
    
    # 1. New trip
    p1 = parse_request_deterministic("Plan a 4-day Goa trip under ₹40,000")
    assert p1["intent"] == "trip_planning", f"P1 intent wrong: {p1['intent']}"
    assert p1["destination"] == "Goa", f"P1 dest wrong: {p1['destination']}"
    assert p1["duration_days"] == 4, f"P1 duration wrong: {p1['duration_days']}"
    assert p1["budget"] == 40000.0, f"P1 budget wrong: {p1['budget']}"
    print("[PASS] P1 (4-day Goa trip under 40k)")

    # 2. Hotel follow-up
    p2 = parse_request_deterministic("Change hotel stay budget to ₹2,000")
    assert p2["intent"] in ["budget_adjustment", "follow_up"], f"P2 intent wrong: {p2['intent']}"
    assert p2["budget_updates"] == {"hotel": 2000.0}, f"P2 budget_updates wrong: {p2['budget_updates']}"
    print("[PASS] P2 (Change hotel stay budget to 2000)")

    # 3. Flights & transport follow-up
    p3 = parse_request_deterministic("Make flights ₹6,000 and transport ₹2,000")
    assert p3["intent"] in ["budget_adjustment", "follow_up"], f"P3 intent wrong: {p3['intent']}"
    assert p3["budget_updates"] == {"flights": 6000.0, "transport": 2000.0}, f"P3 budget_updates wrong: {p3['budget_updates']}"
    print("[PASS] P3 (Make flights 6000 and transport 2000)")

    # 4. Duration follow-up
    p4 = parse_request_deterministic("make it to 2 days")
    assert p4["intent"] == "follow_up", f"P4 intent wrong: {p4['intent']}"
    assert p4["duration_days"] == 2, f"P4 duration wrong: {p4['duration_days']}"
    print("[PASS] P4 (make it to 2 days)")

    p4_alt = parse_request_deterministic("make it 2 days")
    assert p4_alt["intent"] == "follow_up"
    assert p4_alt["duration_days"] == 2
    print("[PASS] P4 alternative ('make it 2 days')")

    # 5. Total trip budget update
    p5 = parse_request_deterministic("Increase the total trip budget to ₹50,000")
    assert p5["intent"] in ["budget_adjustment", "follow_up"], f"P5 intent wrong: {p5['intent']}"
    assert p5["total_budget_update"] == 50000.0, f"P5 total_budget_update wrong: {p5['total_budget_update']}"
    print("[PASS] P5 (Increase total trip budget to 50000)")

    # 6. Independent new trip
    p6 = parse_request_deterministic("Plan a 3-day Jaipur trip under ₹30,000")
    assert p6["intent"] == "trip_planning", f"P6 intent wrong: {p6['intent']}"
    assert p6["destination"] == "Jaipur", f"P6 destination wrong: {p6['destination']}"
    assert p6["duration_days"] == 3, f"P6 duration wrong: {p6['duration_days']}"
    assert p6["budget"] == 30000.0, f"P6 budget wrong: {p6['budget']}"
    print("[PASS] P6 (Plan a 3-day Jaipur trip under 30k)")

def test_full_conversational_state_workflow():
    print("\n--- TESTING FULL CONVERSATIONAL STATE ACROSS 5 TURNS ---")
    thread_id = "test_thread_chain_123"
    config = {"configurable": {"thread_id": thread_id}}

    def run_turn(message: str):
        existing_state = {}
        try:
            current_checkpoint = voyage_agent_app.get_state(config)
            if current_checkpoint and current_checkpoint.values:
                existing_state = dict(current_checkpoint.values)
        except Exception:
            pass

        initial_state = {
            **existing_state,
            "thread_id": thread_id,
            "request": message,
            "agent_events": existing_state.get("agent_events", []),
            "step_progress": [],
            "optimization_attempts": 0,
            "is_budget_exceeded": False,
            "payment_status": "not_started",
            "requires_approval": False
        }
        return voyage_agent_app.invoke(initial_state, config=config)

    # -------------------------------------------------------------
    # TURN 1: Plan a 4-day Goa trip from Mumbai from Sep 14 to Sep 18 under ₹40,000
    # -------------------------------------------------------------
    print("\n>>> TURN 1: Plan a 4-day Goa trip from Mumbai from Sep 14 to Sep 18 under ₹40,000")
    s1 = run_turn("Plan a 4-day Goa trip from Mumbai from September 14 to September 18 under ₹40,000")
    assert s1["destination"] == "Goa", f"Turn 1 destination: {s1.get('destination')}"
    assert s1["duration"] == 4, f"Turn 1 duration: {s1.get('duration')}"
    assert s1["budget"] == 40000.0, f"Turn 1 budget: {s1.get('budget')}"
    assert s1["budget_envelopes"]["hotel"] > 0, f"Turn 1 hotel envelope missing"
    assert s1["budget_envelopes"]["flights"] > 0, f"Turn 1 flights envelope missing"
    t1_dining = s1["budget_envelopes"]["dining"]
    t1_activities = s1["budget_envelopes"]["activities"]
    print(f"[PASS] Turn 1 complete. Envelopes: {s1['budget_envelopes']}, Estimated Total: {s1['estimated_total']}")

    # -------------------------------------------------------------
    # TURN 2: Change hotel stay budget to ₹2,000
    # -------------------------------------------------------------
    print("\n>>> TURN 2: Change hotel stay budget to ₹2,000")
    s2 = run_turn("Change hotel stay budget to ₹2,000")
    assert s2["destination"] == "Goa", f"Turn 2 destination reset to {s2.get('destination')}"
    assert s2["duration"] == 4, f"Turn 2 duration reset to {s2.get('duration')}"
    assert s2["budget"] == 40000.0, f"Turn 2 budget reset to {s2.get('budget')}"
    assert s2["budget_envelopes"]["hotel"] == 2000.0, f"Turn 2 hotel envelope: {s2['budget_envelopes'].get('hotel')}"
    assert s2["budget_envelopes"]["flights"] == s1["budget_envelopes"]["flights"], "Turn 2 flights envelope lost"
    assert s2["budget_envelopes"]["dining"] == t1_dining, "Turn 2 dining envelope lost"
    assert s2["budget_envelopes"]["activities"] == t1_activities, "Turn 2 activities envelope lost"
    print(f"[PASS] Turn 2 complete. Hotel envelope: {s2['budget_envelopes']['hotel']}, Estimated Total: {s2['estimated_total']}")

    # -------------------------------------------------------------
    # TURN 3: Make flights ₹6,000 and transport ₹2,000
    # -------------------------------------------------------------
    print("\n>>> TURN 3: Make flights ₹6,000 and transport ₹2,000")
    s3 = run_turn("Make flights ₹6,000 and transport ₹2,000")
    assert s3["destination"] == "Goa", f"Turn 3 destination reset to {s3.get('destination')}"
    assert s3["duration"] == 4, f"Turn 3 duration reset to {s3.get('duration')}"
    assert s3["budget"] == 40000.0, f"Turn 3 budget reset to {s3.get('budget')}"
    assert s3["budget_envelopes"]["hotel"] == 2000.0, f"Turn 3 hotel envelope reset: {s3['budget_envelopes'].get('hotel')}"
    assert s3["budget_envelopes"]["flights"] == 6000.0, f"Turn 3 flights envelope: {s3['budget_envelopes'].get('flights')}"
    assert s3["budget_envelopes"]["transport"] == 2000.0, f"Turn 3 transport envelope: {s3['budget_envelopes'].get('transport')}"
    assert s3["budget_envelopes"]["dining"] == t1_dining, "Turn 3 dining envelope lost"
    assert s3["budget_envelopes"]["activities"] == t1_activities, "Turn 3 activities envelope lost"
    print(f"[PASS] Turn 3 complete. Envelopes: {s3['budget_envelopes']}, Estimated Total: {s3['estimated_total']}")

    # -------------------------------------------------------------
    # TURN 4: make it to 2 days
    # -------------------------------------------------------------
    print("\n>>> TURN 4: make it to 2 days")
    s4 = run_turn("make it to 2 days")
    assert s4["destination"] == "Goa", f"Turn 4 destination reset to {s4.get('destination')}"
    assert s4["duration"] == 2, f"Turn 4 duration failed to update: {s4.get('duration')}"
    assert s4["budget"] == 40000.0, f"Turn 4 budget reset: {s4.get('budget')}"
    assert s4["budget_envelopes"]["hotel"] == 2000.0, f"Turn 4 hotel envelope reset to {s4['budget_envelopes'].get('hotel')}"
    assert s4["budget_envelopes"]["flights"] == 6000.0, f"Turn 4 flights envelope reset to {s4['budget_envelopes'].get('flights')}"
    assert s4["budget_envelopes"]["transport"] == 2000.0, f"Turn 4 transport envelope reset to {s4['budget_envelopes'].get('transport')}"
    assert s4["budget_envelopes"]["dining"] == t1_dining, "Turn 4 dining envelope lost"
    assert s4["budget_envelopes"]["activities"] == t1_activities, "Turn 4 activities envelope lost"
    assert s4["estimated_total"] != 37800.0, f"Turn 4 estimated_total reset to hardcoded 37,800!"
    assert s4["estimated_total"] == 2000.0 + 6000.0 + 2000.0 + t1_dining + t1_activities, f"Turn 4 calculation mismatch: {s4['estimated_total']}"
    assert len(s4["itinerary"]) == 2, f"Turn 4 itinerary length should be 2, got {len(s4['itinerary'])}"
    print(f"[PASS] Turn 4 complete! Duration: {s4['duration']}, Total: {s4['estimated_total']} (NOT 37800), Envelopes preserved: {s4['budget_envelopes']}")

    # -------------------------------------------------------------
    # TURN 5: Increase the total trip budget to ₹50,000
    # -------------------------------------------------------------
    print("\n>>> TURN 5: Increase the total trip budget to ₹50,000")
    s5 = run_turn("Increase the total trip budget to ₹50,000")
    assert s5["destination"] == "Goa", f"Turn 5 destination reset to {s5.get('destination')}"
    assert s5["duration"] == 2, f"Turn 5 duration reset to {s5.get('duration')}"
    assert s5["budget"] == 50000.0, f"Turn 5 budget failed to update to 50000: {s5.get('budget')}"
    assert s5["budget_envelopes"]["hotel"] == 2000.0, f"Turn 5 hotel envelope reset to {s5['budget_envelopes'].get('hotel')}"
    assert s5["budget_envelopes"]["flights"] == 6000.0, f"Turn 5 flights envelope reset to {s5['budget_envelopes'].get('flights')}"
    assert s5["budget_envelopes"]["transport"] == 2000.0, f"Turn 5 transport envelope reset to {s5['budget_envelopes'].get('transport')}"
    assert s5["remaining_budget"] == 50000.0 - s5["estimated_total"], f"Turn 5 remaining buffer mismatch"
    print(f"[PASS] Turn 5 complete! Budget: {s5['budget']}, Remaining Cushion: {s5['remaining_budget']}")

    # -------------------------------------------------------------
    # TURN 6: Independent new conversation (Thread B)
    # -------------------------------------------------------------
    print("\n>>> TURN 6: Independent new conversation (Thread B)")
    thread_b = "test_thread_jaipur_456"
    config_b = {"configurable": {"thread_id": thread_b}}
    init_b = {
        "thread_id": thread_b,
        "request": "Plan a 3-day Jaipur trip from Delhi from September 14 to September 17 under ₹30,000",
        "agent_events": [],
        "step_progress": [],
        "optimization_attempts": 0,
        "is_budget_exceeded": False,
        "payment_status": "not_started",
        "requires_approval": False
    }
    s6 = voyage_agent_app.invoke(init_b, config=config_b)
    assert s6["destination"] == "Jaipur", f"Thread B destination should be Jaipur, got {s6.get('destination')}"
    assert s6["duration"] == 3, f"Thread B duration should be 3, got {s6.get('duration')}"
    assert s6["budget"] == 30000.0, f"Thread B budget should be 30000, got {s6.get('budget')}"
    assert s6["budget_envelopes"]["hotel"] != 2000.0, f"Thread B must not inherit Goa hotel envelope of 2000!"
    assert s6["budget_envelopes"]["flights"] != 6000.0 or s6["selected_flight"]["airline"] != "IndiGo Premier (6E-241)", f"Thread B must not inherit Goa flights!"
    assert len(s6["itinerary"]) == 3, f"Thread B itinerary length should be 3, got {len(s6['itinerary'])}"
    print(f"[PASS] Turn 6 (Independent Jaipur Thread) complete! Destination: {s6['destination']}, Duration: {s6['duration']}, Budget: {s6['budget']}, Envelopes: {s6['budget_envelopes']}")

    print("\n========================================================")
    print("ALL MULTI-TURN REGRESSION TESTS PASSED PERFECTLY!")
    print("========================================================\n")

def test_fastapi_endpoints():
    print("\n--- TESTING FASTAPI /api/agent/run HTTP ENDPOINTS ---")
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    thread_id = "http_test_chain_789"

    # Turn 1
    r1 = client.post("/api/agent/run", json={"message": "Plan a 4-day Goa trip from Mumbai from September 14 to September 18 under ₹40,000", "thread_id": thread_id})
    assert r1.status_code == 200, f"Turn 1 status: {r1.status_code}, {r1.text}"
    d1 = r1.json()
    assert d1["destination"] == "Goa"
    assert d1["duration_days"] == 4
    assert d1["budget"] == 40000.0
    print(f"[PASS] HTTP Turn 1 (4-day Goa): total={d1['estimated_total']}, envelopes={d1['budget_envelopes']}")

    # Turn 2
    r2 = client.post("/api/agent/run", json={"message": "Change hotel stay budget to ₹2,000", "thread_id": thread_id})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["destination"] == "Goa"
    assert d2["duration_days"] == 4
    assert d2["budget"] == 40000.0
    assert d2["budget_envelopes"]["hotel"] == 2000.0
    print(f"[PASS] HTTP Turn 2 (hotel=2000): total={d2['estimated_total']}, hotel envelope={d2['budget_envelopes']['hotel']}")

    # Turn 3
    r3 = client.post("/api/agent/run", json={"message": "Make flights ₹6,000 and transport ₹2,000", "thread_id": thread_id})
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["destination"] == "Goa"
    assert d3["duration_days"] == 4
    assert d3["budget_envelopes"]["hotel"] == 2000.0
    assert d3["budget_envelopes"]["flights"] == 6000.0
    assert d3["budget_envelopes"]["transport"] == 2000.0
    print(f"[PASS] HTTP Turn 3 (flights=6000, transport=2000): total={d3['estimated_total']}")

    # Turn 4
    r4 = client.post("/api/agent/run", json={"message": "make it to 2 days", "thread_id": thread_id})
    assert r4.status_code == 200
    d4 = r4.json()
    assert d4["destination"] == "Goa"
    assert d4["duration_days"] == 2
    assert d4["budget"] == 40000.0
    assert d4["budget_envelopes"]["hotel"] == 2000.0
    assert d4["budget_envelopes"]["flights"] == 6000.0
    assert d4["budget_envelopes"]["transport"] == 2000.0
    assert d4["estimated_total"] != 37800.0
    assert len(d4["itinerary"]) == 2
    print(f"[PASS] HTTP Turn 4 (2 days): total={d4['estimated_total']} (NOT 37800), duration={d4['duration_days']}")

    # Turn 5
    r5 = client.post("/api/agent/run", json={"message": "Increase the total trip budget to ₹50,000", "thread_id": thread_id})
    assert r5.status_code == 200
    d5 = r5.json()
    assert d5["destination"] == "Goa"
    assert d5["duration_days"] == 2
    assert d5["budget"] == 50000.0
    assert d5["budget_envelopes"]["hotel"] == 2000.0
    assert d5["budget_envelopes"]["flights"] == 6000.0
    assert d5["budget_envelopes"]["transport"] == 2000.0
    assert d5["remaining_budget"] == 50000.0 - d5["estimated_total"]
    print(f"[PASS] HTTP Turn 5 (budget=50000): budget={d5['budget']}, buffer={d5['remaining_budget']}")

    # Turn 6: Independent Thread B
    r6 = client.post("/api/agent/run", json={"message": "Plan a 3-day Jaipur trip from Delhi from September 14 to September 17 under ₹30,000"})
    assert r6.status_code == 200
    d6 = r6.json()
    assert d6["destination"] == "Jaipur"
    assert d6["duration_days"] == 3
    assert d6["budget"] == 30000.0
    assert d6["budget_envelopes"]["hotel"] != 2000.0
    print(f"[PASS] HTTP Turn 6 (Independent Jaipur thread): dest={d6['destination']}, duration={d6['duration_days']}, budget={d6['budget']}")

    # Turn 7: Tight Budget Optimization
    r7 = client.post("/api/agent/run", json={"message": "Plan a 4-day Goa trip from Mumbai from September 14 to September 18 under ₹20,000"})
    assert r7.status_code == 200, f"Turn 7 status: {r7.status_code}, {r7.text}"
    d7 = r7.json()
    assert d7["destination"] == "Goa"
    assert d7["duration_days"] == 4
    assert d7["budget"] == 20000.0
    assert d7["estimated_total"] > 0
    print(f"[PASS] HTTP Tight Budget (Goa under 20k): total={d7['estimated_total']}, envelopes={d7['budget_envelopes']}, warning/reasons={len(d7['reasons'])}")

def test_generate_optimized_options_direct():
    print("\n--- TESTING generate_optimized_options DIRECT UNIT TEST ---")
    from app.tools.budget_tools import generate_optimized_options

    result = generate_optimized_options(
        hotel_cost=12800,
        flight_cost=8000,
        dining_cost=7000,
        activity_cost=6500,
        transport_cost=3500,
        total_budget=20000,
        duration_days=4,
    )
    assert isinstance(result, dict)
    assert "hotel_cost" in result
    assert "flight_cost" in result
    assert "dining_cost" in result
    assert "activity_cost" in result
    assert "transport_cost" in result
    assert "total" in result
    print(f"[PASS] Direct generate_optimized_options executed successfully without TypeError: {result}")

if __name__ == "__main__":
    test_generate_optimized_options_direct()
    test_deterministic_parser()
    test_full_conversational_state_workflow()
    test_fastapi_endpoints()


