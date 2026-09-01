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

from fastapi.testclient import TestClient
from app.main import app
from app.agent.prompts import parse_request_deterministic

client = TestClient(app)

def test_budget_extraction_patterns():
    print("\n--- 1. TESTING BUDGET EXTRACTION PATTERNS ---")
    cases = [
        ("Plan a 4-day Goa trip under ₹40,000", 40000.0, "Goa", 4),
        ("Plan a Goa trip with a budget of ₹40,000", 40000.0, "Goa", None),
        ("Plan a Goa trip for 40000", 40000.0, "Goa", None),
        ("My budget is ₹20,000", 20000.0, None, None),
        ("Plan it under 20000", 20000.0, None, None),
        ("Plan a 2-day Jaipur trip under ₹20,000", 20000.0, "Jaipur", 2),
        ("Plan a 4-day Goa trip with 40k budget", 40000.0, "Goa", 4),
        ("Plan a 3-day trip to Paris under 1.5 lakh", 150000.0, "Paris", 3),
    ]
    for text, exp_budget, exp_dest, exp_dur in cases:
        parsed = parse_request_deterministic(text)
        if exp_budget is not None:
            assert parsed.get("budget") == exp_budget, f"Failed budget for '{text}': expected {exp_budget}, got {parsed.get('budget')}"
        if exp_dest is not None:
            assert parsed.get("destination") == exp_dest, f"Failed destination for '{text}': expected {exp_dest}, got {parsed.get('destination')}"
        if exp_dur is not None:
            assert parsed.get("duration_days") == exp_dur, f"Failed duration for '{text}': expected {exp_dur}, got {parsed.get('duration_days')}"
        print(f"[PASS] Parsed '{text}' -> budget={parsed.get('budget')}, destination={parsed.get('destination')}, duration={parsed.get('duration_days')}")

def test_full_budget_api_regression():
    print("\n--- 2. TESTING API /api/agent/run ENDPOINTS FOR BUDGET & RECOMMENDATION ---")

    # 1. Plan a 4-day Goa trip under ₹40,000
    print("\n>>> Request 1: Plan a 4-day Goa trip under ₹40,000")
    thread_1 = "test_budget_flow_1"
    r1 = client.post("/api/agent/run", json={"message": "Plan a 4-day Goa trip from Mumbai from September 14 to September 18 under ₹40,000", "thread_id": thread_1})
    assert r1.status_code == 200, f"Error: {r1.status_code}, {r1.text}"
    d1 = r1.json()
    assert d1["status"] in ["completed", "awaiting_approval"], f"Expected completed/awaiting_approval, got {d1['status']}"
    assert d1["destination"] == "Goa"
    assert d1["duration_days"] == 4
    assert d1["budget"] == 40000.0, f"Expected budget 40000, got {d1.get('budget')}"
    assert d1["estimated_total"] > 0, f"Expected positive estimated_total, got {d1.get('estimated_total')}"
    assert d1["breakdown"] is not None, "Breakdown must be present in recommendation"
    assert d1["breakdown"]["requested_budget"] == 40000.0
    assert d1["breakdown"]["total_estimated_cost"] > 0
    print(f"[PASS] Request 1: status={d1['status']}, dest={d1['destination']}, duration={d1['duration_days']}, budget={d1['budget']}, total={d1['estimated_total']}")

    # 2. Plan a 4-day Goa trip under ₹20,000
    print("\n>>> Request 2: Plan a 4-day Goa trip under ₹20,000 (Budget optimization)")
    thread_2 = "test_budget_flow_2"
    r2 = client.post("/api/agent/run", json={"message": "Plan a 4-day Goa trip from Mumbai from September 14 to September 18 under ₹20,000", "thread_id": thread_2})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["status"] in ["completed", "awaiting_approval"]
    assert d2["destination"] == "Goa"
    assert d2["duration_days"] == 4
    assert d2["budget"] == 20000.0
    assert d2["estimated_total"] <= 20000.0, f"Expected total <= 20000, got {d2['estimated_total']}"
    print(f"[PASS] Request 2: budget={d2['budget']}, total={d2['estimated_total']} (optimized within 20k)")

    # 3. Plan a 2-day Jaipur trip under ₹20,000
    print("\n>>> Request 3: Plan a 2-day Jaipur trip under ₹20,000")
    thread_3 = "test_budget_flow_3"
    r3 = client.post("/api/agent/run", json={"message": "Plan a 2-day Jaipur trip from Delhi from September 14 to September 16 under ₹20,000", "thread_id": thread_3})
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["status"] in ["completed", "awaiting_approval"]
    assert d3["destination"] == "Jaipur", f"Destination must be Jaipur, not {d3.get('destination')}"
    assert d3["duration_days"] == 2, f"Duration must be 2, not {d3.get('duration_days')}"
    assert d3["budget"] == 20000.0
    assert len(d3["itinerary"]) == 2
    print(f"[PASS] Request 3: dest={d3['destination']}, duration={d3['duration_days']}, budget={d3['budget']}")

    # 4. Multi-turn Follow-up Sequence with state preservation
    print("\n>>> Request 4: Multi-turn State & Budget Preservation")
    thread_chain = "test_budget_chain_4"
    # Turn 1
    c1 = client.post("/api/agent/run", json={"message": "Plan a 4-day Goa trip from Mumbai from September 14 to September 18 under ₹40,000", "thread_id": thread_chain}).json()
    assert c1["budget"] == 40000.0
    assert c1["destination"] == "Goa"

    # Turn 2: Change hotel stay budget to ₹2,000
    c2 = client.post("/api/agent/run", json={"message": "Change hotel stay budget to ₹2,000", "thread_id": thread_chain}).json()
    assert c2["budget"] == 40000.0, f"Total budget must remain 40000, got {c2.get('budget')}"
    assert c2["destination"] == "Goa"
    assert c2["duration_days"] == 4

    # Turn 3: Make flights ₹6,000 and transport ₹2,000
    c3 = client.post("/api/agent/run", json={"message": "Make flights ₹6,000 and transport ₹2,000", "thread_id": thread_chain}).json()
    assert c3["budget"] == 40000.0, f"Total budget must remain 40000, got {c3.get('budget')}"
    assert c3["budget_envelopes"]["flights"] <= 8000.0
    assert c3["destination"] == "Goa"
    assert c3["duration_days"] == 4

    # Turn 4: make it to 2 days
    c4 = client.post("/api/agent/run", json={"message": "make it to 2 days", "thread_id": thread_chain}).json()
    assert c4["budget"] == 40000.0, f"Total budget must remain 40000, got {c4.get('budget')}"
    assert c4["duration_days"] == 2
    assert len(c4["itinerary"]) == 2
    # Recalculated total for 2 days should be strictly lower than 4 days
    assert c4["estimated_total"] < c1["estimated_total"]
    print(f"[PASS] Request 4: Multi-turn chain preserved all state and recalculated 2-day trip total {c4['estimated_total']}")

    # 5. Clarification Question for missing details
    print("\n>>> Request 5: Plan a trip to Paris (Missing duration and budget)")
    thread_paris = "test_paris_clarify"
    rp = client.post("/api/agent/run", json={"message": "Plan a trip to Paris", "thread_id": thread_paris}).json()
    assert rp["status"] == "needs_input"
    assert rp["destination"] == "Paris"
    assert rp["destination"] != "Goa"
    assert rp["question"] is not None and len(rp["question"]) > 0
    print(f"[PASS] Request 5: Clarification correctly requested for Paris: '{rp['question']}'")

    print("\n========================================================")
    print("ALL BUDGET & STATE FLOW REGRESSION TESTS PASSED 100%!")
    print("========================================================\n")

if __name__ == "__main__":
    test_budget_extraction_patterns()
    test_full_budget_api_regression()
