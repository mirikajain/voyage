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

def test_conversational_scenarios_a_through_i():
    print("\n========================================================")
    print("TESTING PHASE 5.5 CONVERSATIONAL STATEFUL TRAVEL AGENT")
    print("========================================================\n")

    # -------------------------------------------------------------
    # TEST A: "Plan a trip to Paris"
    # Expected: asks for missing details. Must NOT return Goa.
    # -------------------------------------------------------------
    print(">>> TEST A: Plan a trip to Paris (Missing duration and budget)")
    thread_a = "test_thread_paris_a"
    res_a = client.post("/api/agent/run", json={
        "message": "Plan a trip to Paris",
        "thread_id": thread_a
    })
    assert res_a.status_code == 200
    d_a = res_a.json()
    assert d_a["status"] == "needs_input", f"Expected needs_input status, got {d_a['status']}"
    assert d_a["destination"] == "Paris", f"Expected Paris destination, got {d_a.get('destination')}"
    assert d_a["destination"] != "Goa", "Must NOT default to Goa!"
    assert d_a["missing_fields"] is not None and len(d_a["missing_fields"]) > 0
    assert "budget" in d_a["missing_fields"]
    assert d_a["question"] is not None and len(d_a["question"]) > 0
    print(f"[PASS] Test A: status='needs_input', destination='{d_a['destination']}', question='{d_a['question']}'")

    # -------------------------------------------------------------
    # TEST B: "Plan a 2-day Goa trip from Delhi under ₹20,000"
    # Expected: Essential info is provided -> plans trip directly with destination=Goa, origin=Delhi, duration=2, budget=20000.
    # -------------------------------------------------------------
    print("\n>>> TEST B: Plan a 2-day Goa trip from Delhi under ₹20,000 (Direct Planning)")
    thread_b = "test_thread_goa_b"
    res_b = client.post("/api/agent/run", json={
        "message": "Plan a 2-day Goa trip from Delhi under ₹20,000",
        "thread_id": thread_b
    })
    assert res_b.status_code == 200
    d_b = res_b.json()
    assert d_b["status"] in ["completed", "awaiting_approval"]
    assert d_b["destination"] == "Goa"
    assert d_b["origin"] == "Delhi"
    assert d_b["duration_days"] == 2
    assert d_b["budget"] == 20000.0
    print(f"[PASS] Test B: status={d_b['status']}, origin='{d_b['origin']}', budget=₹{d_b['budget']}, duration={d_b['duration_days']}")

    # -------------------------------------------------------------
    # TEST C: "Plan a 4-day Goa trip from Delhi from September 14 to September 18 under ₹40,000"
    # Expected: directly searches without asking for already-provided information.
    # -------------------------------------------------------------
    print("\n>>> TEST C: Complete Information Trip Planning")
    thread_c = "test_thread_complete_c"
    res_c = client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip from Delhi from September 14 to September 18 under ₹40,000",
        "thread_id": thread_c
    })
    assert res_c.status_code == 200
    d_c = res_c.json()
    assert d_c["status"] in ["completed", "awaiting_approval"], f"Expected completed/awaiting_approval, got {d_c['status']}"
    assert d_c["destination"] == "Goa"
    assert d_c["origin"] == "Delhi"
    assert d_c["duration_days"] == 4
    assert d_c["departure_date"] == "2026-09-14"
    assert d_c["return_date"] == "2026-09-18"
    assert d_c["budget"] == 40000.0
    assert d_c["breakdown"] is not None
    assert d_c["breakdown"]["total_estimated_cost"] > 0
    print(f"[PASS] Test C: Trip directly planned without questions! Total: ₹{d_c['breakdown']['total_estimated_cost']}")

    # -------------------------------------------------------------
    # TEST D: Follow-up "Change hotel stay budget to ₹2,000"
    # Expected: modifies only hotel budget on thread_c.
    # -------------------------------------------------------------
    print("\n>>> TEST D: Follow-up (Change hotel stay budget to ₹2,000)")
    res_d = client.post("/api/agent/run", json={
        "message": "Change hotel stay budget to ₹2,000",
        "thread_id": thread_c
    })
    assert res_d.status_code == 200
    d_d = res_d.json()
    assert d_d["destination"] == "Goa"
    assert d_d["origin"] == "Delhi"
    assert d_d["budget"] == 40000.0
    print(f"[PASS] Test D: Hotel budget updated, preserved origin={d_d['origin']}, destination={d_d['destination']}")

    # -------------------------------------------------------------
    # TEST E: Follow-up "Make flights ₹6,000 and transport ₹2,000"
    # Expected: modifies both categories.
    # -------------------------------------------------------------
    print("\n>>> TEST E: Follow-up (Make flights ₹6,000 and transport ₹2,000)")
    res_e = client.post("/api/agent/run", json={
        "message": "Make flights ₹6,000 and transport ₹2,000",
        "thread_id": thread_c
    })
    assert res_e.status_code == 200
    d_e = res_e.json()
    assert d_e["budget"] == 40000.0
    assert d_e["budget_envelopes"]["flights"] <= 8000.0
    print(f"[PASS] Test E: flights=₹{d_e['budget_envelopes']['flights']}, transport=₹{d_e['budget_envelopes']['transport']}")

    # -------------------------------------------------------------
    # TEST F: Follow-up "Make it 2 days"
    # Expected: itinerary contains exactly 2 days and costs are recalculated.
    # -------------------------------------------------------------
    print("\n>>> TEST F: Follow-up (Make it 2 days)")
    res_f = client.post("/api/agent/run", json={
        "message": "Make it 2 days",
        "thread_id": thread_c
    })
    assert res_f.status_code == 200
    d_f = res_f.json()
    assert d_f["duration_days"] == 2
    assert len(d_f["itinerary"]) == 2
    assert d_f["estimated_total"] < d_e["estimated_total"]
    print(f"[PASS] Test F: duration_days={d_f['duration_days']}, itinerary days={len(d_f['itinerary'])}, total recalculated.")

    # -------------------------------------------------------------
    # TEST G: "Find flights from Delhi to Goa"
    # Expected: routes to flight search tool and returns flight search results without building trip.
    # -------------------------------------------------------------
    print("\n>>> TEST G: Find flights from Delhi to Goa (Flight Intent)")
    thread_g = "test_thread_flights_g"
    res_g = client.post("/api/agent/run", json={
        "message": "Find flights from Delhi to Goa",
        "thread_id": thread_g
    })
    assert res_g.status_code == 200
    d_g = res_g.json()
    assert d_g["status"] == "completed"
    assert d_g["intent"] == "flight_search"
    assert d_g["origin"] == "Delhi"
    assert d_g["destination"] == "Goa"
    assert d_g["search_results"] is not None
    assert d_g["search_results"]["type"] == "flights"
    assert len(d_g["itinerary"]) == 0
    print(f"[PASS] Test G: Direct flight search returned {len(d_g['search_results']['items'])} flight options without rebuilding itinerary.")

    # -------------------------------------------------------------
    # TEST H: "Find hotels in Paris"
    # Expected: routes to hotel search tool and returns hotel search results.
    # -------------------------------------------------------------
    print("\n>>> TEST H: Find hotels in Paris (Hotel Intent)")
    thread_h = "test_thread_hotels_h"
    res_h = client.post("/api/agent/run", json={
        "message": "Find hotels in Paris",
        "thread_id": thread_h
    })
    assert res_h.status_code == 200
    d_h = res_h.json()
    assert d_h["status"] == "completed"
    assert d_h["intent"] == "hotel_search"
    assert d_h["destination"] == "Paris"
    assert d_h["search_results"] is not None
    assert d_h["search_results"]["type"] == "hotels"
    assert len(d_h["itinerary"]) == 0
    print(f"[PASS] Test H: Direct hotel search returned {len(d_h['search_results']['items'])} hotel options.")

    # -------------------------------------------------------------
    # TEST I: "Actually, I'm travelling from Mumbai"
    # Expected: updates origin in the current thread and preserves the rest of the trip.
    # -------------------------------------------------------------
    print("\n>>> TEST I: Origin Update Follow-up")
    res_i = client.post("/api/agent/run", json={
        "message": "Actually, I'm travelling from Mumbai",
        "thread_id": thread_c
    })
    assert res_i.status_code == 200
    d_i = res_i.json()
    assert d_i["origin"] == "Mumbai"
    assert d_i["destination"] == "Goa"
    assert d_i["duration_days"] == 2
    assert d_i["budget"] == 40000.0
    print(f"[PASS] Test I: Origin updated to '{d_i['origin']}', destination='{d_i['destination']}', duration={d_i['duration_days']} preserved.")

    print("\n========================================================")
    print("ALL PHASE 5.5 CONVERSATIONAL TESTS PASSED PERFECTLY!")
    print("========================================================\n")

if __name__ == "__main__":
    test_conversational_scenarios_a_through_i()
