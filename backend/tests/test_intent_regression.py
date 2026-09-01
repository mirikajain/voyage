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

def test_intent_classification():
    print("\n--- 1. TESTING INTENT CLASSIFICATION TAXONOMY ---")
    cases = [
        ("Plan a 4-day Goa trip under ₹40,000", "trip_planning", "Goa", 40000.0, None),
        ("Change hotel stay budget to ₹2,000", "budget_adjustment", None, None, 2000.0),
        ("Make flights ₹6,000 and transport ₹2,000", "budget_adjustment", None, None, None),
        ("Find available hotels in Goa", "hotel_search", "Goa", None, None),
        ("Show hotels in Goa under ₹5,000", "hotel_search", "Goa", None, 5000.0),
        ("Find flights from Delhi to Goa", "flight_search", "Goa", None, None),
        ("What restaurants are available in Goa?", "restaurant_search", "Goa", None, None),
        ("Things to do in Kyoto", "activity_search", "Kyoto", None, None),
        ("make it to 2 days", "follow_up", None, None, None),
    ]

    for prompt, exp_intent, exp_dest, exp_total_budget, exp_hotel_budget in cases:
        parsed = parse_request_deterministic(prompt)
        assert parsed["intent"] == exp_intent, f"Failed intent for '{prompt}': expected '{exp_intent}', got '{parsed['intent']}'"
        if exp_dest:
            assert parsed["destination"] == exp_dest, f"Failed destination for '{prompt}': expected '{exp_dest}', got '{parsed.get('destination')}'"
        if exp_total_budget is not None:
            assert parsed.get("budget") == exp_total_budget, f"Failed total budget for '{prompt}': expected {exp_total_budget}, got {parsed.get('budget')}"
        if exp_hotel_budget is not None:
            assert parsed.get("hotel_budget") == exp_hotel_budget, f"Failed hotel budget for '{prompt}': expected {exp_hotel_budget}, got {parsed.get('hotel_budget')}"
        print(f"[PASS] Parsed '{prompt}' -> intent='{parsed['intent']}', dest='{parsed.get('destination')}', hotel_budget={parsed.get('hotel_budget')}, total_budget={parsed.get('budget')}")

def test_three_turn_conversation_flow():
    print("\n--- 2. TESTING 3-TURN CONVERSATION (Plan Trip -> Budget Adjustment -> Hotel Discovery) ---")
    thread_id = "test_three_turn_chain_conv"

    # Turn 1: "Plan a 4-day Goa trip under ₹40,000"
    print("\n>>> Turn 1: Plan a 4-day Goa trip under ₹40,000")
    r1 = client.post("/api/agent/run", json={"message": "Plan a 4-day Goa trip under ₹40,000", "thread_id": thread_id})
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["status"] in ["completed", "awaiting_approval"]
    assert d1["intent"] == "trip_planning"
    assert d1["destination"] == "Goa"
    assert d1["duration_days"] == 4
    assert d1["budget"] == 40000.0
    assert len(d1["itinerary"]) == 4
    print(f"[PASS] Turn 1: Trip planned for Goa. Total: ₹{d1['estimated_total']}, Itinerary days: {len(d1['itinerary'])}")

    # Turn 2: "Change hotel stay budget to ₹2,000"
    print("\n>>> Turn 2: Change hotel stay budget to ₹2,000")
    r2 = client.post("/api/agent/run", json={"message": "Change hotel stay budget to ₹2,000", "thread_id": thread_id})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["budget"] == 40000.0, f"Total trip budget must remain 40000, got {d2.get('budget')}"
    assert d2["destination"] == "Goa"
    assert d2["duration_days"] == 4
    # Hotel cost exceeds 2000 -> must have compromise notice or category warning
    assert d2.get("compromise_message") is not None or d2.get("is_budget_exceeded") is True or "low" in (d2.get("category_status") or {}).get("hotel", "").lower()
    print(f"[PASS] Turn 2: Hotel budget evaluated. Total budget preserved at ₹{d2['budget']}. Compromise msg: '{d2.get('compromise_message')}'")

    # Turn 3: "Find available hotels in Goa"
    print("\n>>> Turn 3: Find available hotels in Goa")
    r3 = client.post("/api/agent/run", json={"message": "Find available hotels in Goa", "thread_id": thread_id})
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["status"] == "completed"
    assert d3["intent"] == "hotel_search", f"Expected intent='hotel_search', got '{d3['intent']}'"
    assert d3["destination"] == "Goa"
    assert d3["search_results"] is not None, "search_results must be returned for hotel_search"
    assert d3["search_results"]["type"] == "hotels"
    assert len(d3["search_results"]["items"]) > 0
    # Must NOT build a full trip itinerary!
    assert len(d3["itinerary"]) == 0, f"Itinerary must be empty for hotel search, got {len(d3['itinerary'])} days"
    print(f"[PASS] Turn 3: Switched to hotel_search. Found {len(d3['search_results']['items'])} hotels in Goa. Itinerary NOT rebuilt!")

def test_dedicated_search_endpoints():
    print("\n--- 3. TESTING DEDICATED SEARCH INTENTS ---")

    # 1. Flight search
    print("\n>>> Testing: Find flights from Delhi to Goa")
    rf = client.post("/api/agent/run", json={"message": "Find flights from Delhi to Goa", "thread_id": "test_flt_direct"})
    assert rf.status_code == 200
    df = rf.json()
    assert df["intent"] == "flight_search"
    assert df["destination"] == "Goa"
    assert df["origin"] == "Delhi"
    assert df["search_results"] is not None
    assert df["search_results"]["type"] == "flights"
    assert len(df["itinerary"]) == 0
    print(f"[PASS] Flight search returned {len(df['search_results']['items'])} flight options.")

    # 2. Show hotels in Goa under ₹5,000
    print("\n>>> Testing: Show hotels in Goa under ₹5,000")
    rh = client.post("/api/agent/run", json={"message": "Show hotels in Goa under ₹5,000", "thread_id": "test_htl_5k"})
    assert rh.status_code == 200
    dh = rh.json()
    assert dh["intent"] == "hotel_search"
    assert dh["destination"] == "Goa"
    assert dh["search_results"] is not None
    assert dh["search_results"]["type"] == "hotels"
    assert len(dh["itinerary"]) == 0
    print(f"[PASS] Hotel search with budget returned {len(dh['search_results']['items'])} hotel options.")

    # 3. Restaurant search
    print("\n>>> Testing: What restaurants are available in Goa?")
    rr = client.post("/api/agent/run", json={"message": "What restaurants are available in Goa?", "thread_id": "test_rest_direct"})
    assert rr.status_code == 200
    dr = rr.json()
    assert dr["intent"] == "restaurant_search"
    assert dr["destination"] == "Goa"
    assert dr["search_results"] is not None
    assert dr["search_results"]["type"] == "restaurants"
    assert len(dr["itinerary"]) == 0
    print(f"[PASS] Restaurant search returned {len(dr['search_results']['items'])} dining options.")

if __name__ == "__main__":
    test_intent_classification()
    test_three_turn_conversation_flow()
    test_dedicated_search_endpoints()
    print("\n========================================================")
    print("ALL INTENT & STATE REGRESSION TESTS PASSED 100%!")
    print("========================================================\n")
