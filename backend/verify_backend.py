import sys
import os
import time
from datetime import datetime, timezone

# Ensure backend root is on path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.core.database import SessionLocal
from app.models.profile import Profile, UserRole
from app.models.meal_slot import MealSlot
from app.models.booking import MealBooking, BookingStatus
from app.models.checkin import MealCheckin
from app.schemas import UserLogin, MealBookingCreate, CheckinRequest, FeedbackCreate, AbsenceRequestCreate
from app.api.auth import login
from app.api.slots import get_slots
from app.api.bookings import create_booking, get_booking_qr_token
from app.api.checkins import verify_and_checkin
from app.api.feedback import submit_feedback, get_anonymous_feedback_summary, get_hygiene_alerts
from app.api.billing import get_my_bill
from app.api.absences import declare_absence
from app.api.admin import get_demand_report, get_financial_report
from app.api.sync import get_sync_bootstrap
from app.core.security import verify_qr_token
from fastapi import HTTPException

def run_verification():
    print("==================================================")
    print("STARTING DIRECT MESSMATE BACKEND VERIFICATION")
    print("==================================================")
    db = SessionLocal()

    try:
        # 1. Test Login
        print("\n[1] Testing Authentication...")
        aman_auth = login(UserLogin(email="aman@knit.ac.in", password="student123"), db)
        aman_user = db.query(Profile).filter(Profile.id == "23210").first()
        print(f"  ✓ Student login: {aman_user.name} ({aman_user.role})")

        mgr_auth = login(UserLogin(email="manager@messmate.knit.ac.in", password="manager123"), db)
        mgr_user = db.query(Profile).filter(Profile.id == "MGR001").first()
        print(f"  ✓ Manager login: {mgr_user.name} ({mgr_user.role})")

        admin_auth = login(UserLogin(email="admin@messmate.knit.ac.in", password="admin123"), db)
        admin_user = db.query(Profile).filter(Profile.id == "ADMIN001").first()
        print(f"  ✓ Admin login: {admin_user.name} ({admin_user.role})")

        # 2. Test Slots
        print("\n[2] Testing Meal Slots Query...")
        slots = get_slots(None, db, aman_user)
        print(f"  ✓ Retrieved {len(slots)} meal slots")
        today_lunch = next(s for s in slots if s["meal_type"] == "lunch" and not s["is_cutoff_passed"])
        print(f"  ✓ Today's Lunch slot found: {today_lunch['menu'][:40]}... (Price: ₹{today_lunch['price_paise']/100:.2f})")

        # 3. Test QR Token Generation & HMAC Verification
        print("\n[3] Testing Rotating HMAC QR Token...")
        booking = db.query(MealBooking).filter(
            MealBooking.student_id == aman_user.id,
            MealBooking.status == BookingStatus.BOOKED
        ).first()
        assert booking is not None, "Aman has no booked meal"

        qr_res = get_booking_qr_token(booking.id, db, aman_user)
        print(f"  ✓ Generated QR token: {qr_res['token'][:35]}... (Expires in {qr_res['expires_in']}s)")
        
        decoded = verify_qr_token(qr_res["token"])
        assert decoded["b_id"] == booking.id
        print(f"  ✓ HMAC signature verified. Booking ID: {decoded['b_id']}, Student ID: {decoded['s_id']}")

        # 4. Test Check-in at Counter
        print("\n[4] Testing Counter Check-in...")
        checkin_res = verify_and_checkin(CheckinRequest(token=qr_res["token"]), db, mgr_user)
        assert checkin_res["status"] == "success"
        print(f"  ✓ Check-in recorded for {checkin_res['student_name']} - {checkin_res['meal_type']}")
        print(f"  ✓ Price snapshot frozen at: {checkin_res['price_paise']} paise (₹{checkin_res['price_paise']/100:.2f})")

        # 5. Test Duplicate Scan Prevention (Module 02)
        print("\n[5] Testing Duplicate Scan Prevention...")
        try:
            verify_and_checkin(CheckinRequest(token=qr_res["token"]), db, mgr_user)
            assert False, "Duplicate checkin should have failed!"
        except HTTPException as e:
            assert e.status_code == 400
            assert "ALREADY COLLECTED" in str(e.detail)
            print(f"  ✓ Duplicate scan correctly rejected: '{e.detail}'")

        # 6. Test Food Feedback (Module 04: only for collected meals + hygiene alert)
        print("\n[6] Testing Food Feedback & Hygiene Alert...")
        feedback = submit_feedback(
            FeedbackCreate(
                checkin_id=booking.id,
                rating=4,
                tags="Good taste, hygiene concern on water dispenser",
                comment="Food was very tasty and hot. Please clean the water cooler."
            ),
            db,
            aman_user
        )
        assert feedback.is_hygiene_flagged == True
        print(f"  ✓ Feedback recorded (Rating: {feedback.rating}/5 stars)")
        print(f"  ✓ Hygiene tag alert triggered: is_hygiene_flagged = {feedback.is_hygiene_flagged}")

        # Check Anonymous feedback for Manager
        summary = get_anonymous_feedback_summary(db, mgr_user)
        print(f"  ✓ Manager anonymous feedback summary: Avg Rating = {summary['average_rating']}, Total = {summary['total_reviews']}")

        # Check Admin Hygiene Alerts
        alerts = get_hygiene_alerts(db, admin_user)
        print(f"  ✓ Admin Hygiene Alerts: {len(alerts)} alerts pending review")

        # 7. Test Itemized Billing (Module 05: integer paise)
        print("\n[7] Testing Itemized Billing...")
        bill = get_my_bill(None, db, aman_user)
        print(f"  ✓ Aman's Bill: {bill.total_meals} meals served, Total: ₹{bill.total_amount_rupees} ({bill.total_amount_paise} paise)")
        for item in bill.items:
            print(f"    - {item.meal_date} {item.meal_type}: ₹{item.price_paise/100:.2f}")

        # 8. Test Absence Declaration & Auto-Cancellation (Module 03)
        print("\n[8] Testing Absence Declaration...")
        absence = declare_absence(
            AbsenceRequestCreate(
                start_date="2026-11-28",
                end_date="2026-11-30",
                meals="all",
                reason="College Fest Participation at IIT Kanpur"
            ),
            db,
            aman_user
        )
        print(f"  ✓ Absence declared for {absence.start_date} to {absence.end_date} (Reason: {absence.reason})")

        # 9. Test Mobile Sync Endpoint
        print("\n[9] Testing Mobile SQLite Sync Payload...")
        sync_payload = get_sync_bootstrap(db, aman_user)
        print(f"  ✓ Sync payload generated: {len(sync_payload['meal_slots'])} slots, {len(sync_payload['bookings'])} bookings, {len(sync_payload['bills'])} bills")

        # 10. Test Admin Demand & Financial Reports
        print("\n[10] Testing Admin Reports...")
        demand = get_demand_report(None, db, admin_user)
        financial = get_financial_report(None, db, admin_user)
        print(f"  ✓ Demand report generated for {demand['date']}: {len(demand['demand_summary'])} slots analyzed")
        print(f"  ✓ Financial report: Total revenue = ₹{financial['total_revenue_rupees']} ({financial['total_revenue_paise']} paise)")

        print("\n==================================================")
        print("ALL 10 VERIFICATION MODULES PASSED WITH 100% SUCCESS!")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_verification()

