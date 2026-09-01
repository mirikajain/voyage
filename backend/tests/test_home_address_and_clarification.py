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

client = TestClient(app)

def test_scenario_1_no_home_no_origin_no_dates():
    """Test 1 — No Home, no origin, no dates: Asks for source city and travel dates."""
    thread_id = "test_scen_1_no_home"
    res = client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip under ₹40,000",
        "thread_id": thread_id
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "needs_input", f"Expected needs_input, got {data['status']}"
    assert "origin" in data["missing_fields"]
    assert "dates" in data["missing_fields"]
    assert "city" in data["question"].lower() and "dates" in data["question"].lower()
    print("[PASS] Test 1: No Home, no origin, no dates -> Prompted for source city and travel dates.")

def test_scenario_2_home_exists_resolves_origin():
    """Test 2 — Home exists (Delhi): Resolves origin=Delhi and asks only for dates."""
    thread_id = "test_scen_2_home_exists"
    res = client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip under ₹40,000",
        "thread_id": thread_id,
        "home_address": {
            "address": "123 Amrita Shergill Marg",
            "city": "Delhi",
            "state": "Delhi",
            "country": "India",
            "postal_code": "110003"
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "needs_input"
    assert data["origin"] == "Delhi", f"Expected origin Delhi, got {data.get('origin')}"
    assert "dates" in data["missing_fields"]
    assert "origin" not in data["missing_fields"]
    assert "dates" in data["question"].lower()
    print("[PASS] Test 2: Home exists -> Origin resolved to Delhi, asked only for dates.")

def test_scenario_3_explicit_origin_overrides_home():
    """Test 3 — Explicit origin in prompt (Mumbai) overrides Home (Delhi)."""
    thread_id = "test_scen_3_override_home"
    res = client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip from Mumbai under ₹40,000",
        "thread_id": thread_id,
        "home_address": {
            "address": "123 Amrita Shergill Marg",
            "city": "Delhi",
            "state": "Delhi",
            "country": "India",
            "postal_code": "110003"
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "needs_input"
    assert data["origin"] == "Mumbai", f"Expected origin Mumbai, got {data.get('origin')}"
    assert "dates" in data["missing_fields"]
    print("[PASS] Test 3: Explicit origin (Mumbai) overrode saved Home (Delhi), asked only for dates.")

def test_scenario_4_origin_and_dates_supplied_direct_plan():
    """Test 4 — Origin and dates supplied: Plans trip directly without clarification."""
    thread_id = "test_scen_4_complete_info"
    res = client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip from Delhi from September 15 to September 18 under ₹40,000",
        "thread_id": thread_id
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["completed", "awaiting_approval"], f"Expected direct planning, got {data['status']}"
    assert data["destination"] == "Goa"
    assert data["origin"] == "Delhi"
    assert data["departure_date"] == "2026-09-15"
    assert data["return_date"] == "2026-09-18"
    assert data["duration_days"] == 4
    assert data["budget"] == 40000.0
    print("[PASS] Test 4: Complete info -> Planned trip directly without clarification.")

def test_scenario_5_partial_clarification_flow():
    """Test 5 — Partial clarification: Question -> 'Delhi' -> 'September 15 to September 18' -> Direct plan."""
    thread_id = "test_scen_5_partial_flow"
    
    # Step 1: Initial prompt (no origin, no dates)
    res1 = client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip under ₹40,000",
        "thread_id": thread_id
    })
    assert res1.json()["status"] == "needs_input"
    
    # Step 2: User provides only origin "Delhi"
    res2 = client.post("/api/agent/run", json={
        "message": "Delhi",
        "thread_id": thread_id
    })
    d2 = res2.json()
    assert d2["status"] == "needs_input"
    assert d2["origin"] == "Delhi"
    assert "dates" in d2["missing_fields"]
    assert "origin" not in d2["missing_fields"]
    
    # Step 3: User provides dates "September 15 to September 18"
    res3 = client.post("/api/agent/run", json={
        "message": "September 15 to September 18",
        "thread_id": thread_id
    })
    d3 = res3.json()
    assert d3["status"] in ["completed", "awaiting_approval"]
    assert d3["origin"] == "Delhi"
    assert d3["departure_date"] == "2026-09-15"
    assert d3["return_date"] == "2026-09-18"
    print("[PASS] Test 5: Multi-step partial clarification resolved seamlessly and continued planning.")

def test_scenario_6_home_persistence_across_turns():
    """Test 6 — Home persistence across requests."""
    thread_id = "test_scen_6_home_persist"
    home_obj = {
        "address": "42 Connaught Place",
        "city": "Delhi",
        "state": "Delhi",
        "country": "India",
        "postal_code": "110001"
    }
    res = client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip under ₹40,000",
        "thread_id": thread_id,
        "user_preferences": {
            "homeAddress": home_obj
        }
    })
    d = res.json()
    assert d["origin"] == "Delhi"
    print("[PASS] Test 6: Home address persistence in user preferences verified.")

def test_scenario_7_clear_home_resets_default():
    """Test 7 — Clear Home: Clearing address asks for source city again."""
    thread_id = "test_scen_7_clear_home"
    res = client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip under ₹40,000",
        "thread_id": thread_id,
        "home_address": None
    })
    d = res.json()
    assert d["status"] == "needs_input"
    assert "origin" in d["missing_fields"]
    assert "dates" in d["missing_fields"]
    print("[PASS] Test 7: Cleared Home address prompts for origin and dates.")

def test_scenario_8_existing_followup_duration_recalc():
    """Test 8 — Follow-up after plan: 'make it 2 days' recalculates duration and costs."""
    thread_id = "test_scen_8_followup"
    # Step 1: Complete trip plan
    client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip from Delhi from September 15 to September 18 under ₹40,000",
        "thread_id": thread_id
    })
    # Step 2: Follow-up duration change
    res = client.post("/api/agent/run", json={
        "message": "make it 2 days",
        "thread_id": thread_id
    })
    d = res.json()
    assert d["duration_days"] == 2
    assert len(d["itinerary"]) == 2
    assert d["origin"] == "Delhi"
    assert d["budget"] == 40000.0
    print("[PASS] Test 8: Follow-up duration change preserved origin, budget, and recalculated stay.")

def test_scenario_9_hotel_search_no_origin_required():
    """Test 9 — Hotel search: Does NOT ask for origin."""
    thread_id = "test_scen_9_hotels"
    res = client.post("/api/agent/run", json={
        "message": "Find available hotels in Goa",
        "thread_id": thread_id
    })
    assert res.status_code == 200
    d = res.json()
    assert d["intent"] == "hotel_search"
    assert d["status"] == "completed"
    assert d["search_results"] is not None
    assert d["search_results"]["type"] == "hotels"
    print("[PASS] Test 9: Hotel search executed directly without asking for source city.")

def test_scenario_10_flight_search_direct_search():
    """Test 10 — Flight search: 'Find flights from Delhi to Goa' executes directly."""
    thread_id = "test_scen_10_flights"
    res = client.post("/api/agent/run", json={
        "message": "Find flights from Delhi to Goa",
        "thread_id": thread_id
    })
    assert res.status_code == 200
    d = res.json()
    assert d["intent"] == "flight_search"
    assert d["status"] == "completed"
    assert d["origin"] == "Delhi"
    assert d["destination"] == "Goa"
    assert d["search_results"] is not None
    assert d["search_results"]["type"] == "flights"
    print("[PASS] Test 10: Flight search executed directly with origin and destination.")

def run_all_tests():
    test_scenario_1_no_home_no_origin_no_dates()
    test_scenario_2_home_exists_resolves_origin()
    test_scenario_3_explicit_origin_overrides_home()
    test_scenario_4_origin_and_dates_supplied_direct_plan()
    test_scenario_5_partial_clarification_flow()
    test_scenario_6_home_persistence_across_turns()
    test_scenario_7_clear_home_resets_default()
    test_scenario_8_existing_followup_duration_recalc()
    test_scenario_9_hotel_search_no_origin_required()
    test_scenario_10_flight_search_direct_search()
    print("\nALL 10 HOME ADDRESS & CLARIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_all_tests()
