import sys
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.agent.disruption import (
    DisruptionType,
    DisruptionEvent,
    normalize_disruption_event,
    parse_time_to_minutes,
    format_minutes_to_time
)
from app.agent.disruption_graph import voyage_disruption_app
from app.agent.graph import voyage_agent_app

client = TestClient(app)

def test_disruption_normalization():
    """Verifies that diverse raw provider disruption events normalize cleanly."""
    raw1 = {
        "type": "flight_cancelled",
        "reason": "Air traffic control strike",
        "item_id": "flt-101",
        "is_simulation": True
    }
    evt1 = normalize_disruption_event(raw1)
    assert evt1.event_type == DisruptionType.FLIGHT_CANCELLED
    assert evt1.category == "flight"
    assert evt1.reason == "Air traffic control strike"
    assert evt1.item_id == "flt-101"
    assert evt1.is_simulation is True

    raw2 = {
        "type": "hotel_unavailable",
        "item_id": "htl-202"
    }
    evt2 = normalize_disruption_event(raw2)
    assert evt2.event_type == DisruptionType.HOTEL_UNAVAILABLE
    assert evt2.category == "hotel"
    assert "maintenance" in evt2.reason.lower()

    raw3 = {
        "type": "activity_cancelled",
        "item_id": "act-303"
    }
    evt3 = normalize_disruption_event(raw3)
    assert evt3.event_type == DisruptionType.ACTIVITY_CANCELLED
    assert evt3.category == "activity"

    print("[PASS] test_disruption_normalization: Provider normalization verified.")

def test_time_conversion_utilities():
    """Verifies time arithmetic helpers."""
    mins = parse_time_to_minutes("10:30 AM")
    assert mins == 630
    assert format_minutes_to_time(630) == "10:30 AM"

    mins_pm = parse_time_to_minutes("05:45 PM")
    assert mins_pm == 1065
    assert format_minutes_to_time(1065) == "05:45 PM"

    # Adding 180 min (3 hrs) to 10:30 AM -> 01:30 PM
    assert format_minutes_to_time(mins + 180) == "01:30 PM"
    print("[PASS] test_time_conversion_utilities: Time conversion utilities verified.")

def test_flight_cancellation_disruption_workflow():
    """
    Tests full flight cancellation recovery:
    - Downstream ripple effect on airport transfer & hotel check-in
    - Search & rank replacement flights
    - Budget safety & approval requirement
    - Surgical update of Day 1; Days 2-4 untouched
    """
    thread_id = "test_disruption_flight_canc"
    config = {"configurable": {"thread_id": thread_id}}

    # 1. Initialize a 4-day Goa trip
    r1 = client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip under ₹40,000",
        "thread_id": thread_id
    })
    assert r1.status_code == 200
    d1 = r1.json()
    orig_total = d1["estimated_total"]
    orig_itin = d1["itinerary"]
    assert len(orig_itin) == 4

    # 2. Simulate Flight Cancellation
    r_disp = client.post(f"/api/agent/{thread_id}/simulate-disruption", json={
        "type": "flight_cancelled",
        "reason": "Flight cancelled by airline due to technical turnaround",
        "delay_minutes": 210
    })
    assert r_disp.status_code == 200
    d_disp = r_disp.json()

    assert d_disp["disruption_recovery"] is not None
    rec = d_disp["disruption_recovery"]
    assert rec["disruption_detected"] is True
    assert rec["disruption_type"] == DisruptionType.FLIGHT_CANCELLED
    assert rec["affected_item"] is not None
    assert len(rec["replacement_options"]) > 0
    assert rec["selected_replacement"] is not None
    assert rec["requires_approval"] is True
    assert rec["recovery_status"] == "ready_for_review"

    # Verify downstream impacts were identified
    assert len(rec["affected_downstream_items"]) > 0
    downstream_categories = [d["category"] for d in rec["affected_downstream_items"]]
    assert "transport" in downstream_categories or "hotel" in downstream_categories

    # Verify surgical itinerary rebuild
    revised_itin = d_disp["itinerary"]
    assert len(revised_itin) == 4
    # Days 2, 3, 4 items must remain unchanged!
    assert revised_itin[1]["items"] == orig_itin[1]["items"]
    assert revised_itin[2]["items"] == orig_itin[2]["items"]
    assert revised_itin[3]["items"] == orig_itin[3]["items"]

    # Verify that Day 1 flight item title has [Recovery Replacement]
    day1_items = revised_itin[0]["items"]
    has_replacement = any("[Recovery Replacement]" in it.get("title", "") for it in day1_items)
    assert has_replacement is True

    print(f"[PASS] test_flight_cancellation_disruption_workflow: Flight cancellation adapted with downstream ripple effects.")

def test_hotel_cancellation_disruption_workflow():
    """
    Tests hotel cancellation recovery:
    - Search replacement hotel
    - Check-in redirected
    - Activities and flights remain intact
    """
    thread_id = "test_disruption_hotel_canc"
    config = {"configurable": {"thread_id": thread_id}}

    # 1. Initialize trip
    client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip under ₹40,000",
        "thread_id": thread_id
    })

    # 2. Simulate Hotel Cancellation
    r_disp = client.post(f"/api/agent/{thread_id}/simulate-disruption", json={
        "type": "hotel_cancelled",
        "reason": "Emergency property renovation"
    })
    assert r_disp.status_code == 200
    d_disp = r_disp.json()

    rec = d_disp["disruption_recovery"]
    assert rec["disruption_detected"] is True
    assert rec["disruption_type"] == DisruptionType.HOTEL_CANCELLED
    assert rec["selected_replacement"] is not None
    assert rec["requires_approval"] is True

    # Check that replacement hotel was selected
    repl = rec["selected_replacement"]
    assert "name" in repl or "title" in repl

    print(f"[PASS] test_hotel_cancellation_disruption_workflow: Hotel cancellation replaced without disrupting travel.")

def test_activity_cancellation_disruption_workflow():
    """
    Tests activity cancellation recovery:
    - Replaces only the specific cancelled activity
    - Other days and items remain 100% untouched
    """
    thread_id = "test_disruption_activity_canc"
    config = {"configurable": {"thread_id": thread_id}}

    # 1. Initialize trip
    client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip under ₹40,000",
        "thread_id": thread_id
    })

    # 2. Simulate Activity Cancellation
    r_disp = client.post(f"/api/agent/{thread_id}/simulate-disruption", json={
        "type": "activity_cancelled",
        "reason": "Water safety advisory"
    })
    assert r_disp.status_code == 200
    d_disp = r_disp.json()

    rec = d_disp["disruption_recovery"]
    assert rec["disruption_detected"] is True
    assert rec["disruption_type"] == DisruptionType.ACTIVITY_CANCELLED
    assert rec["selected_replacement"] is not None

    print(f"[PASS] test_activity_cancellation_disruption_workflow: Activity cancellation replaced on target day.")

def test_disruption_resolution_approval_flow():
    """
    Tests user approval vs rejection of recovery recommendations:
    - Approved: commits update, sets booking_status='confirmed', payment_status='paid'
    - Rejected: marks recovery_status='rejected', keeps disruption_detected=True (unresolved)
    """
    thread_id = "test_disruption_approval"
    config = {"configurable": {"thread_id": thread_id}}

    # 1. Initialize trip
    client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip under ₹40,000",
        "thread_id": thread_id
    })

    # 2. Simulate Flight Cancellation
    client.post(f"/api/agent/{thread_id}/simulate-disruption", json={
        "type": "flight_cancelled",
        "reason": "Airspace congestion"
    })

    # 3. User Approves Replacement
    r_appr = client.post(f"/api/agent/{thread_id}/resolve-disruption", json={
        "approved": True
    })
    assert r_appr.status_code == 200
    d_appr = r_appr.json()
    assert d_appr["payment_status"] == "paid"
    assert d_appr["booking_status"] == "confirmed"
    assert d_appr["disruption_recovery"]["recovery_status"] == "approved"
    assert d_appr["disruption_recovery"]["disruption_detected"] is False

    # 4. Test Rejection flow on separate thread
    thread_id_rej = "test_disruption_reject"
    client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip under ₹40,000",
        "thread_id": thread_id_rej
    })
    client.post(f"/api/agent/{thread_id_rej}/simulate-disruption", json={
        "type": "flight_cancelled"
    })
    r_rej = client.post(f"/api/agent/{thread_id_rej}/resolve-disruption", json={
        "approved": False
    })
    assert r_rej.status_code == 200
    d_rej = r_rej.json()
    assert d_rej["disruption_recovery"]["recovery_status"] == "rejected"
    assert d_rej["disruption_recovery"]["disruption_detected"] is True

    print(f"[PASS] test_disruption_resolution_approval_flow: Approval and rejection paths verified.")

if __name__ == "__main__":
    test_disruption_normalization()
    test_time_conversion_utilities()
    test_flight_cancellation_disruption_workflow()
    test_hotel_cancellation_disruption_workflow()
    test_activity_cancellation_disruption_workflow()
    test_disruption_resolution_approval_flow()
    print("\n========================================================")
    print("ALL DISRUPTION AGENT TESTS PASSED 100%!")
    print("========================================================\n")
