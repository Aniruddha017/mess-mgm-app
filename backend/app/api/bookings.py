from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import generate_qr_token
from app.models.profile import Profile, UserRole
from app.models.meal_slot import MealSlot
from app.models.booking import MealBooking, BookingStatus
from app.models.absence import AbsenceRequest
from app.schemas import MealBookingCreate, MealBookingOut, QRTokenOut
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/bookings", tags=["Meal Bookings"])

@router.post("", response_model=MealBookingOut)
def create_booking(
    booking_in: MealBookingCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.STUDENT]))
):
    slot = db.query(MealSlot).filter(MealSlot.id == booking_in.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Meal slot not found")

    # Business Rule: Reject booking if past cutoff
    now = datetime.now(timezone.utc)
    cutoff = slot.cutoff_time
    if cutoff.tzinfo is None:
        cutoff = cutoff.replace(tzinfo=timezone.utc)
    if now > cutoff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking deadline has passed for this {slot.meal_type}. Cutoff was at {slot.cutoff_time.strftime('%I:%M %p')}."
        )

    # Business Rule: Check if student has declared absence covering this date & meal
    absence = db.query(AbsenceRequest).filter(
        AbsenceRequest.student_id == current_user.id,
        AbsenceRequest.start_date <= slot.date,
        AbsenceRequest.end_date >= slot.date
    ).first()
    if absence:
        if absence.meals == "all" or slot.meal_type in absence.meals:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have an approved absence declared from {absence.start_date} to {absence.end_date}. Booking blocked."
            )

    # Check existing booking
    existing = db.query(MealBooking).filter(
        MealBooking.slot_id == slot.id,
        MealBooking.student_id == current_user.id
    ).first()

    if existing:
        if existing.status == BookingStatus.BOOKED:
            raise HTTPException(status_code=400, detail="You have already booked this meal slot.")
        elif existing.status == BookingStatus.COLLECTED:
            raise HTTPException(status_code=400, detail="This meal has already been collected.")
        elif existing.status == BookingStatus.CANCELLED:
            # Re-activate booking
            existing.status = BookingStatus.BOOKED
            db.commit()
            db.refresh(existing)
            return existing

    booking = MealBooking(
        slot_id=slot.id,
        student_id=current_user.id,
        status=BookingStatus.BOOKED
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking

@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.STUDENT]))
):
    booking = db.query(MealBooking).filter(
        MealBooking.id == booking_id,
        MealBooking.student_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == BookingStatus.COLLECTED:
        raise HTTPException(status_code=400, detail="Cannot cancel a meal that was already collected.")

    # Cutoff check
    slot = booking.slot
    now = datetime.now(timezone.utc)
    cutoff = slot.cutoff_time
    if cutoff.tzinfo is None:
        cutoff = cutoff.replace(tzinfo=timezone.utc)
    if now > cutoff:
        raise HTTPException(
            status_code=400,
            detail="Cancellation cutoff deadline has passed for this meal slot."
        )

    booking.status = BookingStatus.CANCELLED
    db.commit()
    return {"message": "Booking successfully cancelled", "booking_id": booking.id}

@router.get("/my", response_model=List[MealBookingOut])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.STUDENT]))
):
    bookings = db.query(MealBooking).filter(
        MealBooking.student_id == current_user.id
    ).order_by(MealBooking.id.desc()).all()
    return bookings

@router.get("/{booking_id}/qr-token", response_model=QRTokenOut)
def get_booking_qr_token(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.STUDENT]))
):
    booking = db.query(MealBooking).filter(
        MealBooking.id == booking_id,
        MealBooking.student_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="This booking has been cancelled.")
    if booking.status == BookingStatus.COLLECTED:
        raise HTTPException(status_code=400, detail="This meal has already been collected.")

    qr_data = generate_qr_token(booking.id, current_user.id, booking.slot_id)
    return {
        "token": qr_data["token"],
        "booking_id": booking.id,
        "expiry": qr_data["expiry"],
        "expires_in": qr_data["expires_in"],
        "manual_code": booking.manual_code
    }

