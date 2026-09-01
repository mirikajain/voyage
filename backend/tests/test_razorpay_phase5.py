import sys
import os
import hmac
import hashlib

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
from app.services.razorpay_service import RazorpayService

client = TestClient(app)

def test_razorpay_service_unit():
    print("\n--- 1. TESTING RAZORPAY SERVICE UNIT METHODS ---")

    # 1. Order Creation
    order = RazorpayService.create_razorpay_order(
        amount_in_rupees=37800.0,
        currency="INR",
        receipt="rcpt_test_001",
        notes={"trip": "Goa 4 Days"}
    )
    assert order["amount_in_rupees"] == 37800.0
    assert order["amount_in_paise"] == 3780000
    assert order["currency"] == "INR"
    assert "order_id" in order
    assert order["status"] == "created"
    print(f"[PASS] Order created successfully: {order['order_id']} ({order['amount_in_paise']} paise)")

    # 2. Cryptographic HMAC Signature Verification (with secret)
    test_secret = "test_secret_key_1234567890"
    os.environ["RAZORPAY_KEY_SECRET"] = test_secret
    os.environ["RAZORPAY_MODE"] = "test"

    order_id = "order_test_98765"
    payment_id = "pay_test_54321"
    valid_signature = hmac.new(
        test_secret.encode("utf-8"),
        f"{order_id}|{payment_id}".encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    is_valid, msg = RazorpayService.verify_payment_signature(
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        razorpay_signature=valid_signature
    )
    assert is_valid is True, f"Signature verification failed unexpectedly: {msg}"
    print(f"[PASS] Valid HMAC-SHA256 signature verified: {msg}")

    # 3. Tampered Signature Verification (Must fail)
    tampered_signature = valid_signature[:-4] + "ffff"
    is_tampered_valid, fail_msg = RazorpayService.verify_payment_signature(
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        razorpay_signature=tampered_signature
    )
    assert is_tampered_valid is False, "Tampered signature should NOT pass verification!"
    print(f"[PASS] Tampered signature rejected as expected: {fail_msg}")

    # 4. Demo Mode Verification
    os.environ["RAZORPAY_MODE"] = "demo"
    if "RAZORPAY_KEY_SECRET" in os.environ:
        del os.environ["RAZORPAY_KEY_SECRET"]

    is_demo_valid, demo_msg = RazorpayService.verify_payment_signature(
        razorpay_order_id="order_demo_123",
        razorpay_payment_id="pay_demo_456",
        razorpay_signature="demo_sig_abcdef123456"
    )
    assert is_demo_valid is True
    print(f"[PASS] Demo mode signature verified: {demo_msg}")

def test_payment_api_endpoints():
    print("\n--- 2. TESTING PAYMENT API ENDPOINTS (/create-order, /verify) ---")

    # 1. POST /api/payment/create-order
    res_order = client.post("/api/payment/create-order", json={
        "amount": 31500.0,
        "currency": "INR",
        "thread_id": "thread_payment_test_001",
        "receipt": "rcpt_test_002"
    })
    assert res_order.status_code == 200, f"Create order failed: {res_order.text}"
    order_data = res_order.json()
    assert order_data["amount_in_rupees"] == 31500.0
    assert order_data["amount_in_paise"] == 3150000
    assert "order_id" in order_data
    print(f"[PASS] POST /api/payment/create-order returned order_id: {order_data['order_id']}")

    # 2. POST /api/payment/verify (valid demo signature)
    res_verify = client.post("/api/payment/verify", json={
        "razorpay_order_id": order_data["order_id"],
        "razorpay_payment_id": "pay_test_demo_777",
        "razorpay_signature": "demo_sig_valid_12345678",
        "thread_id": "thread_payment_test_001",
        "amount": 31500.0
    })
    assert res_verify.status_code == 200, f"Verify failed: {res_verify.text}"
    verify_data = res_verify.json()
    assert verify_data["verified"] is True
    assert verify_data["status"] == "paid"
    assert verify_data["booking_status"] == "confirmed"
    assert "booking_reference" in verify_data
    print(f"[PASS] POST /api/payment/verify succeeded. Booking Ref: {verify_data['booking_reference']}")

def test_full_human_approval_to_confirmed_workflow():
    print("\n--- 3. TESTING FULL E2E WORKFLOW: PLANNING -> APPROVAL -> RAZORPAY -> CONFIRMED ---")
    thread_id = "thread_approval_flow_999"

    # Step 1: Initial Planning -> Graph transitions to requires_approval
    res1 = client.post("/api/agent/run", json={
        "message": "Plan a 4-day Goa trip from Mumbai from September 14 to September 18 under ₹40,000",
        "thread_id": thread_id
    })
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["destination"] == "Goa"
    assert d1["duration_days"] == 4
    assert d1["requires_approval"] is True, "Agent must require human approval before booking!"
    assert d1["approval_status"] == "pending", f"Approval status should be pending, got {d1.get('approval_status')}"
    assert d1["approval_request"] is not None, "approval_request data must be present!"
    assert d1["approval_request"]["total_estimated_cost"] == d1["estimated_total"]
    assert d1["approval_request"]["destination"] == "Goa"
    print(f"[PASS] Step 1: Trip planned & PAUSED at approval. Requires approval: {d1['requires_approval']}, Total: ₹{d1['estimated_total']}")

    # Step 2: User Approves Trip Booking via POST /api/agent/{thread_id}/approve
    r2 = client.post(f"/api/agent/{thread_id}/approve")
    assert r2.status_code == 200, f"Approve failed: {r2.text}"
    d2 = r2.json()
    assert d2["approval_status"] == "approved"
    assert d2["requires_approval"] is False
    assert d2["payment_status"] == "approved"
    print(f"[PASS] Step 2: Human approval granted. payment_status: {d2['payment_status']}")

    # Step 3: Create Razorpay Order
    r3 = client.post("/api/payment/create-order", json={
        "amount": d2["estimated_total"],
        "currency": "INR",
        "thread_id": thread_id
    })
    assert r3.status_code == 200
    order_data = r3.json()
    print(f"[PASS] Step 3: Razorpay order created: {order_data['order_id']}")

    # Step 4: Verify Payment via POST /api/payment/verify
    r4 = client.post("/api/payment/verify", json={
        "razorpay_order_id": order_data["order_id"],
        "razorpay_payment_id": "pay_live_test_888",
        "razorpay_signature": "demo_sig_test_verified_999",
        "thread_id": thread_id,
        "amount": d2["estimated_total"]
    })
    assert r4.status_code == 200
    d4 = r4.json()
    assert d4["verified"] is True
    assert d4["status"] == "paid"
    assert d4["booking_status"] == "confirmed"
    print(f"[PASS] Step 4: Payment verified and trip CONFIRMED. Booking reference: {d4['booking_reference']}")

def test_rejection_workflow():
    print("\n--- 4. TESTING REJECTION / CANCELLATION WORKFLOW ---")
    thread_id = "thread_reject_test_333"

    # Step 1: Plan trip
    r1 = client.post("/api/agent/run", json={
        "message": "Plan a 2-day Jaipur trip from Delhi from September 14 to September 16 under ₹20,000",
        "thread_id": thread_id
    })
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["destination"] == "Jaipur"
    assert d1["requires_approval"] is True

    # Step 2: User Rejects Trip Booking via POST /api/agent/{thread_id}/reject
    r2 = client.post(f"/api/agent/{thread_id}/reject")
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["approval_status"] == "rejected"
    assert d2["payment_status"] == "cancelled"
    assert d2["requires_approval"] is False
    assert d2["destination"] == "Jaipur", "Trip state must be preserved upon rejection"
    print(f"[PASS] Rejection completed safely: approval_status={d2['approval_status']}, payment_status={d2['payment_status']}")

if __name__ == "__main__":
    test_razorpay_service_unit()
    test_payment_api_endpoints()
    test_full_human_approval_to_confirmed_workflow()
    test_rejection_workflow()
    print("\n========================================================")
    print("ALL PHASE 5 RAZORPAY & APPROVAL TESTS PASSED PERFECTLY!")
    print("========================================================\n")
