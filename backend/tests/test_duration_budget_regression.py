import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.agent.graph import voyage_agent_app

def test_five_step_conversation_and_duration_budget_regression():
    """
    Tests the exact 5-step conversation from the user prompt + 6th step duration expansion:
    1. Plan a 4-day Goa trip under ₹40,000
    2. keep hotel budget under ₹6,000
    3. make plan for 2 days
    4. increase hotel stay budget to ₹15,000
    5. keep activity budget under ₹3,000
    6. make it 5 days
    """
    thread_id = "test-thread-duration-budget-5steps"
    config = {"configurable": {"thread_id": thread_id}}

    # -------------------------------------------------------------
    # STEP 1: Plan a 4-day Goa trip under ₹40,000
    # -------------------------------------------------------------
    res1 = voyage_agent_app.invoke({
        "request": "Plan a 4-day Goa trip from Mumbai from September 14 to September 18 under ₹40,000",
        "message": "Plan a 4-day Goa trip from Mumbai from September 14 to September 18 under ₹40,000",
        "thread_id": thread_id,
        "ai_mode": "demo"
    }, config=config)

    assert res1.get("destination") == "Goa"
    assert res1.get("duration") == 4
    assert res1.get("budget") == 40000.0
    assert len(res1.get("itinerary", [])) == 4
    
    envelopes1 = res1.get("budget_envelopes") or {}
    total1 = (
        float(envelopes1.get("hotel", 0.0)) +
        float(envelopes1.get("flights", 0.0)) +
        float(envelopes1.get("dining", 0.0)) +
        float(envelopes1.get("activities", 0.0)) +
        float(envelopes1.get("transport", 0.0))
    )
    assert abs(float(res1.get("estimated_total", 0.0)) - total1) < 0.01
    assert abs(float(res1.get("remaining_budget", 0.0)) - (40000.0 - total1)) < 0.01

    # -------------------------------------------------------------
    # STEP 2: keep hotel budget under ₹6,000
    # -------------------------------------------------------------
    res2 = voyage_agent_app.invoke({
        "request": "keep hotel budget under ₹6,000",
        "message": "keep hotel budget under ₹6,000",
        "thread_id": thread_id,
        "ai_mode": "demo"
    }, config=config)

    assert res2.get("destination") == "Goa"
    assert res2.get("duration") == 4
    assert res2.get("budget") == 40000.0 # Total budget preserved!
    assert res2.get("hotel_budget") == 6000.0
    
    envelopes2 = res2.get("budget_envelopes") or {}
    total2 = (
        float(envelopes2.get("hotel", 0.0)) +
        float(envelopes2.get("flights", 0.0)) +
        float(envelopes2.get("dining", 0.0)) +
        float(envelopes2.get("activities", 0.0)) +
        float(envelopes2.get("transport", 0.0))
    )
    assert abs(float(res2.get("estimated_total", 0.0)) - total2) < 0.01
    assert abs(float(res2.get("remaining_budget", 0.0)) - (40000.0 - total2)) < 0.01

    # -------------------------------------------------------------
    # STEP 3: make plan for 2 days (BUG 1 & BUG 6: duration recalculation)
    # -------------------------------------------------------------
    res3 = voyage_agent_app.invoke({
        "request": "make plan for 2 days",
        "message": "make plan for 2 days",
        "thread_id": thread_id,
        "ai_mode": "demo"
    }, config=config)

    assert res3.get("destination") == "Goa"
    assert res3.get("duration") == 2
    assert res3.get("budget") == 40000.0 # Preserves ₹40,000 total trip budget!
    assert res3.get("hotel_budget") == 6000.0 # Preserves hotel budget preference!
    assert len(res3.get("itinerary", [])) == 2 # Exactly 2 days!

    # Hotel nights should be 1 night for a 2-day trip
    selected_hotel3 = res3.get("selected_hotel") or {}
    assert selected_hotel3.get("nights", 1) == 1

    envelopes3 = res3.get("budget_envelopes") or {}
    total3 = (
        float(envelopes3.get("hotel", 0.0)) +
        float(envelopes3.get("flights", 0.0)) +
        float(envelopes3.get("dining", 0.0)) +
        float(envelopes3.get("activities", 0.0)) +
        float(envelopes3.get("transport", 0.0))
    )
    # Total for 2 days MUST be recalculated and strictly less than 4-day total
    assert total3 < total1
    assert abs(float(res3.get("estimated_total", 0.0)) - total3) < 0.01
    assert abs(float(res3.get("remaining_budget", 0.0)) - (40000.0 - total3)) < 0.01

    # -------------------------------------------------------------
    # STEP 4: increase hotel stay budget to ₹15,000
    # -------------------------------------------------------------
    res4 = voyage_agent_app.invoke({
        "request": "increase hotel stay budget to ₹15,000",
        "message": "increase hotel stay budget to ₹15,000",
        "thread_id": thread_id,
        "ai_mode": "demo"
    }, config=config)

    assert res4.get("destination") == "Goa"
    assert res4.get("duration") == 2
    assert res4.get("budget") == 40000.0 # Still preserved!
    assert res4.get("hotel_budget") == 15000.0
    assert len(res4.get("itinerary", [])) == 2

    envelopes4 = res4.get("budget_envelopes") or {}
    total4 = (
        float(envelopes4.get("hotel", 0.0)) +
        float(envelopes4.get("flights", 0.0)) +
        float(envelopes4.get("dining", 0.0)) +
        float(envelopes4.get("activities", 0.0)) +
        float(envelopes4.get("transport", 0.0))
    )
    assert abs(float(res4.get("estimated_total", 0.0)) - total4) < 0.01
    assert abs(float(res4.get("remaining_budget", 0.0)) - (40000.0 - total4)) < 0.01

    # -------------------------------------------------------------
    # STEP 5: keep activity budget under ₹3,000 (BUG 2 & 3: sum of activities <= ₹3,000)
    # -------------------------------------------------------------
    res5 = voyage_agent_app.invoke({
        "request": "keep activity budget under ₹3,000",
        "message": "keep activity budget under ₹3,000",
        "thread_id": thread_id,
        "ai_mode": "demo"
    }, config=config)

    assert res5.get("destination") == "Goa"
    assert res5.get("duration") == 2
    assert res5.get("budget") == 40000.0
    assert res5.get("hotel_budget") == 15000.0
    assert res5.get("activity_budget") == 3000.0
    assert len(res5.get("itinerary", [])) == 2

    # Verify activities sum <= ₹3,000
    envelopes5 = res5.get("budget_envelopes") or {}
    act_total5 = float(envelopes5.get("activities", 0.0))
    assert act_total5 <= 3000.0

    selected_acts5 = res5.get("selected_activities") or {}
    acts_list5 = selected_acts5.get("items", []) if isinstance(selected_acts5, dict) else selected_acts5
    sum_items5 = sum(float(a.get("cost", 0.0)) for a in acts_list5)
    assert sum_items5 <= 3000.0

    total5 = (
        float(envelopes5.get("hotel", 0.0)) +
        float(envelopes5.get("flights", 0.0)) +
        float(envelopes5.get("dining", 0.0)) +
        float(envelopes5.get("activities", 0.0)) +
        float(envelopes5.get("transport", 0.0))
    )
    assert abs(float(res5.get("estimated_total", 0.0)) - total5) < 0.01
    assert abs(float(res5.get("remaining_budget", 0.0)) - (40000.0 - total5)) < 0.01

    # -------------------------------------------------------------
    # STEP 6: make it 5 days
    # -------------------------------------------------------------
    res6 = voyage_agent_app.invoke({
        "request": "make it 5 days",
        "message": "make it 5 days",
        "thread_id": thread_id,
        "ai_mode": "demo"
    }, config=config)

    assert res6.get("destination") == "Goa"
    assert res6.get("duration") == 5
    assert res6.get("budget") == 40000.0
    assert len(res6.get("itinerary", [])) == 5
    
    # 5 days = 4 nights
    selected_hotel6 = res6.get("selected_hotel") or {}
    assert selected_hotel6.get("nights", 4) == 4

    envelopes6 = res6.get("budget_envelopes") or {}
    total6 = (
        float(envelopes6.get("hotel", 0.0)) +
        float(envelopes6.get("flights", 0.0)) +
        float(envelopes6.get("dining", 0.0)) +
        float(envelopes6.get("activities", 0.0)) +
        float(envelopes6.get("transport", 0.0))
    )
    assert abs(float(res6.get("estimated_total", 0.0)) - total6) < 0.01
    assert abs(float(res6.get("remaining_budget", 0.0)) - (40000.0 - total6)) < 0.01
    print("[PASS] test_five_step_conversation_and_duration_budget_regression passed 100%!")

if __name__ == "__main__":
    test_five_step_conversation_and_duration_budget_regression()

