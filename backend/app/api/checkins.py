from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_qr_token
from app.models.profile import Profile, UserRole
from app.models.booking import MealBooking, BookingStatus
from app.models.checkin import MealCheckin
from app.models.billing import BillItem
from app.models.meal_slot import MealSlot
from app.schemas import CheckinRequest, CheckinOut
from app.api.deps import require_role, record_audit_event

router = APIRouter(prefix="/checkins", tags=["Meal Check-ins"])

@router.post("/verify", response_model=CheckinOut)
def verify_and_checkin(
    checkin_in: CheckinRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.MESS_MANAGER, UserRole.COLLEGE_ADMIN]))
):
    booking_id = None
    verification_method = "qr_scan"

    if checkin_in.token:
        # Decrypt & verify HMAC signature + expiry
        payload = verify_qr_token(checkin_in.token)
        booking_id = payload.get("b_id")
        verification_method = "qr_scan"
    elif checkin_in.manual_code:
        # Fallback manual 6-character code
        code = checkin_in.manual_code.strip().upper()
        booking = db.query(MealBooking).filter(MealBooking.manual_code == code).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid manual booking code. No matching booking found."
            )
        booking_id = booking.id
        verification_method = "manual_code"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either QR token or manual_code must be provided."
        )

    # Fetch booking with slot and student
    booking = db.query(MealBooking).filter(MealBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking record not found in system."
        )

    # Check if already checked in (Module 02: unique constraint allows exactly one check-in)
    existing_checkin = db.query(MealCheckin).filter(MealCheckin.booking_id == booking.id).first()
    if existing_checkin:
        # Log duplicate scan attempt in audit
        record_audit_event(
            db, current_user, "duplicate_scan_attempt",
            details=f"Duplicate check-in attempted for booking #{booking.id} (student: {booking.student.name})"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ALREADY COLLECTED: This meal was already collected on {existing_checkin.time.strftime('%I:%M %p')}."
        )

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="REJECTED: This booking was cancelled by the student."
        )

    now = datetime.now(timezone.utc)
    # Create checkin record
    checkin = MealCheckin(
        booking_id=booking.id,
        time=now,
        staff_id=current_user.id,
        verification_method=verification_method
    )
    db.add(checkin)

    # Update booking status
    booking.status = BookingStatus.COLLECTED

    # Module 05 • Billing: Charges calculated from recorded collections.
    # The price at the time of collection is saved with each bill item in integer paise.
    slot_price_paise = booking.slot.price_paise
    period = booking.slot.date[:7] # YYYY-MM
    
    bill_item = BillItem(
        student_id=booking.student_id,
        checkin_id=booking.id,
        price_paise=slot_price_paise,
        period=period,
        created_at=now
    )
    db.add(bill_item)
    
    # Audit event for manual code override if used
    if verification_method == "manual_code":
        record_audit_event(
            db, current_user, "manual_checkin_override",
            details=f"Manual code check-in used for student {booking.student.name} (#{booking.id})"
        )

    db.commit()
    db.refresh(checkin)

    return {
        "booking_id": booking.id,
        "time": checkin.time,
        "staff_id": current_user.id,
        "verification_method": verification_method,
        "student_name": booking.student.name,
        "student_roll": booking.student.id,
        "meal_type": booking.slot.meal_type.title(),
        "menu": booking.slot.menu,
        "price_paise": slot_price_paise,
        "status": "success"
    }

