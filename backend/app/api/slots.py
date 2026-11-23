from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.profile import Profile, UserRole
from app.models.meal_slot import MealSlot
from app.models.booking import MealBooking, BookingStatus
from app.schemas import MealSlotCreate, MealSlotUpdate, MealSlotOut
from app.api.deps import get_current_user, require_role, record_audit_event

router = APIRouter(prefix="/slots", tags=["Meal Slots"])

@router.get("", response_model=List[MealSlotOut])
def get_slots(
    date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    query = db.query(MealSlot)
    if date:
        query = query.filter(MealSlot.date == date)
    slots = query.order_by(MealSlot.date.desc(), MealSlot.meal_type.asc()).all()
    
    now = datetime.now(timezone.utc)
    # Check current user's bookings if student
    user_bookings_map = {}
    if current_user.role == UserRole.STUDENT:
        user_bookings = db.query(MealBooking).filter(
            MealBooking.student_id == current_user.id
        ).all()
        for b in user_bookings:
            user_bookings_map[b.slot_id] = b

    results = []
    for s in slots:
        # Check cutoff
        cutoff_aware = s.cutoff_time
        if cutoff_aware.tzinfo is None:
            cutoff_aware = cutoff_aware.replace(tzinfo=timezone.utc)
        is_passed = now > cutoff_aware
        
        booking = user_bookings_map.get(s.id)
        booked = booking is not None and booking.status != BookingStatus.CANCELLED
        
        slot_dict = {
            "id": s.id,
            "date": s.date,
            "meal_type": s.meal_type,
            "menu": s.menu,
            "dietary_tags": s.dietary_tags,
            "price_paise": s.price_paise,
            "cutoff_time": s.cutoff_time,
            "created_by": s.created_by,
            "created_at": s.created_at,
            "is_cutoff_passed": is_passed,
            "booked_by_user": booked,
            "booking_id": booking.id if booking else None,
            "booking_status": booking.status if booking else None
        }
        results.append(slot_dict)
        
    return results

@router.post("", response_model=MealSlotOut)
def create_slot(
    slot_in: MealSlotCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.MESS_MANAGER, UserRole.COLLEGE_ADMIN]))
):
    slot = MealSlot(
        date=slot_in.date,
        meal_type=slot_in.meal_type,
        menu=slot_in.menu,
        dietary_tags=slot_in.dietary_tags,
        price_paise=slot_in.price_paise,
        cutoff_time=slot_in.cutoff_time,
        created_by=current_user.id
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    record_audit_event(
        db, current_user, "create_meal_slot",
        details=f"Created {slot.meal_type} slot for {slot.date} at ₹{slot.price_paise/100:.2f}"
    )

    return slot

@router.put("/{slot_id}", response_model=MealSlotOut)
def update_slot(
    slot_id: int,
    slot_in: MealSlotUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.MESS_MANAGER, UserRole.COLLEGE_ADMIN]))
):
    slot = db.query(MealSlot).filter(MealSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Meal slot not found")

    old_price = slot.price_paise
    if slot_in.menu is not None:
        slot.menu = slot_in.menu
    if slot_in.dietary_tags is not None:
        slot.dietary_tags = slot_in.dietary_tags
    if slot_in.cutoff_time is not None:
        slot.cutoff_time = slot_in.cutoff_time
    if slot_in.price_paise is not None and slot_in.price_paise != old_price:
        record_audit_event(
            db, current_user, "price_change",
            old_value=str(old_price),
            new_value=str(slot_in.price_paise),
            details=f"Changed price of slot {slot_id} from {old_price}p to {slot_in.price_paise}p"
        )
        slot.price_paise = slot_in.price_paise

    db.commit()
    db.refresh(slot)
    return slot

