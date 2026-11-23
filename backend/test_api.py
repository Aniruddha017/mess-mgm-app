import sys
import os
import asyncio
import httpx

# Ensure backend root is on path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.main import app
from app.seed import seed_database
from app.core.security import verify_qr_token

async def run_tests():
    print("========================================")
    print("RUNNING COMPREHENSIVE MESSMATE TEST SUITE")
    print("========================================")

    seed_database()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Test Root
        root_res = await client.get("/")
        assert root_res.status_code == 200
        print("\n[Step 1] Server online and responsive")

        # 2. Test Login
        print("\n[Step 2] Testing Auth for Student, Manager, Admin...")
        student_res = await client.post("/api/v1/auth/login", json={"email": "aman@knit.ac.in", "password": "student123"})
        assert student_res.status_code == 200, f"Student login failed: {student_res.text}"
        student_token = student_res.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        print("  ✓ Student login successful")

        mgr_res = await client.post("/api/v1/auth/login", json={"email": "manager@messmate.knit.ac.in", "password": "manager123"})
        assert mgr_res.status_code == 200, f"Manager login failed: {mgr_res.text}"
        mgr_token = mgr_res.json()["access_token"]
        mgr_headers = {"Authorization": f"Bearer {mgr_token}"}
        print("  ✓ Mess Manager login successful")

        admin_res = await client.post("/api/v1/auth/login", json={"email": "admin@messmate.knit.ac.in", "password": "admin123"})
        assert admin_res.status_code == 200, f"Admin login failed: {admin_res.text}"
        admin_token = admin_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("  ✓ College Admin login successful")

        # 3. Test Role Permissions (Section 8)
        print("\n[Step 3] Testing Role Access Control...")
        denied_res = await client.get("/api/v1/admin/audit-logs", headers=student_headers)
        assert denied_res.status_code == 403
        print("  ✓ Role check strictly enforced: Student blocked from Admin routes")

        # 4. Meal Slots & Cutoff Rule
        print("\n[Step 4] Testing Meal Slots & Cutoff Rules...")
        slots_res = await client.get("/api/v1/slots", headers=student_headers)
        assert slots_res.status_code == 200
        slots = slots_res.json()
        print(f"  ✓ Retrieved {len(slots)} meal slots")

        breakfast_slot = next((s for s in slots if s["meal_type"] == "breakfast" and s["is_cutoff_passed"]), None)
        if breakfast_slot:
            late_booking = await client.post("/api/v1/bookings", json={"slot_id": breakfast_slot["id"]}, headers=student_headers)
            assert late_booking.status_code == 400
            print("  ✓ Cutoff enforced: Booking rejected after cutoff deadline")

        # 5. QR HMAC Token Generation & Verification
        print("\n[Step 5] Testing Rotating HMAC QR Token Generation & Verification...")
        my_bookings = (await client.get("/api/v1/bookings/my", headers=student_headers)).json()
        open_booking = next(b for b in my_bookings if b["status"] == "booked")

        qr_res = await client.get(f"/api/v1/bookings/{open_booking['id']}/qr-token", headers=student_headers)
        assert qr_res.status_code == 200
        qr_payload = qr_res.json()
        assert "token" in qr_payload
        print(f"  ✓ QR Token generated. Valid for {qr_payload['expires_in']}s")

        decoded = verify_qr_token(qr_payload["token"])
        assert decoded["b_id"] == open_booking["id"]
        print("  ✓ QR Token HMAC signature verified successfully")

        # 6. Counter QR Check-in
        print("\n[Step 6] Testing Mess Counter QR Check-in...")
        checkin_res = await client.post("/api/v1/checkins/verify", json={"token": qr_payload["token"]}, headers=mgr_headers)
        assert checkin_res.status_code == 200
        checkin_data = checkin_res.json()
        assert checkin_data["status"] == "success"
        print(f"  ✓ Check-in recorded for {checkin_data['student_name']} - {checkin_data['meal_type']}")
        print(f"  ✓ Price frozen at {checkin_data['price_paise']} paise")

        # 7. Duplicate Check-in Prevention
        print("\n[Step 7] Testing Duplicate Scan Prevention...")
        dup_res = await client.post("/api/v1/checkins/verify", json={"token": qr_payload["token"]}, headers=mgr_headers)
        assert dup_res.status_code == 400
        assert "ALREADY COLLECTED" in dup_res.json()["detail"]
        print("  ✓ Duplicate check-in strictly rejected with 'ALREADY COLLECTED'")

        # 8. Food Feedback & Hygiene Flag
        print("\n[Step 8] Testing Food Feedback & Hygiene Alert...")
        fb_res = await client.post("/api/v1/feedback", json={
            "checkin_id": open_booking["id"],
            "rating": 4,
            "tags": "Good taste, Clean dining, slight hygiene concern on glasses",
            "comment": "Food was delicious, please ensure cleaner water glasses."
        }, headers=student_headers)
        assert fb_res.status_code == 200
        fb_data = fb_res.json()
        assert fb_data["is_hygiene_flagged"] == True
        print("  ✓ Feedback recorded and hygiene tag automatically flagged to Admin")

        # 9. Itemized Billing
        print("\n[Step 9] Testing Itemized Billing...")
        bill_res = await client.get("/api/v1/billing/my", headers=student_headers)
        assert bill_res.status_code == 200
        bill_data = bill_res.json()
        assert bill_data["total_meals"] >= 1
        assert bill_data["total_amount_paise"] > 0
        print(f"  ✓ Itemized bill generated: {bill_data['total_meals']} meals, Total: ₹{bill_data['total_amount_rupees']} ({bill_data['total_amount_paise']} paise)")

        # 10. Absence Declaration
        print("\n[Step 10] Testing Absence Declaration...")
        absence_res = await client.post("/api/v1/absences", json={
            "start_date": "2026-11-28",
            "end_date": "2026-11-30",
            "meals": "all",
            "reason": "Attending college technical festival at IIT Kanpur"
        }, headers=student_headers)
        assert absence_res.status_code == 200
        print("  ✓ Absence declared from 2026-11-28 to 2026-11-30")

        # 11. Mobile Sync Endpoint
        print("\n[Step 11] Testing Mobile SQLite Sync Bootstrap...")
        sync_res = await client.get("/api/v1/sync/bootstrap", headers=student_headers)
        assert sync_res.status_code == 200
        sync_data = sync_res.json()
        assert "user" in sync_data
        assert "meal_slots" in sync_data
        assert "bookings" in sync_data
        print(f"  ✓ Sync payload delivered with {len(sync_data['meal_slots'])} slots and {len(sync_data['bookings'])} bookings")

        print("\n========================================")
        print("ALL TESTS PASSED WITH 100% SUCCESS!")
        print("========================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
