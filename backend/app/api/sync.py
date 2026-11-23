from typing import Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.profile import Profile, UserRole
from app.models.meal_slot import MealSlot
from app.models.booking import MealBooking
from app.models.checkin import MealCheckin
from app.models.absence import AbsenceRequest
from app.models.billing import BillItem
from app.api.deps import get_current_user

router = APIRouter(prefix="/sync", tags=["Mobile Sync Engine"])

@router.get("/bootstrap")
def get_sync_bootstrap(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns complete data payload for the mobile app to cache in local SQLite.
    Allows instant offline viewing and quick startup.
    """
    now = datetime.now(timezone.utc)
    
    # 1. User profile
    user_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "dietary_pref": current_user.dietary_pref,
        "status": current_user.status
    }
    
    # 2. Meal slots (today and future, plus recent past)
    slots = db.query(MealSlot).order_by(MealSlot.date.desc()).limit(30).all()
    slots_data = [
        {
            "id": s.id,
            "date": s.date,
            "meal_type": s.meal_type,
            "menu": s.menu,
            "dietary_tags": s.dietary_tags,
            "price_paise": s.price_paise,
            "cutoff_time": s.cutoff_time.isoformat() if s.cutoff_time else None,
            "created_by": s.created_by
        }
        for s in slots
    ]

    # 3. User's bookings
    bookings = db.query(MealBooking).filter(
        MealBooking.student_id == current_user.id
    ).order_by(MealBooking.id.desc()).all()
    bookings_data = [
        {
            "id": b.id,
            "slot_id": b.slot_id,
            "student_id": b.student_id,
            "status": b.status,
            "manual_code": b.manual_code,
            "created_at": b.created_at.isoformat() if b.created_at else None
        }
        for b in bookings
    ]

    # 4. User's absences
    absences = db.query(AbsenceRequest).filter(
        AbsenceRequest.student_id == current_user.id
    ).all()
    absences_data = [
        {
            "id": a.id,
            "student_id": a.student_id,
            "start_date": a.start_date,
            "end_date": a.end_date,
            "meals": a.meals,
            "reason": a.reason,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in absences
    ]

    # 5. User's bills
    bills = db.query(BillItem).filter(
        BillItem.student_id == current_user.id
    ).order_by(BillItem.id.desc()).all()
    bills_data = [
        {
            "id": bi.id,
            "student_id": bi.student_id,
            "checkin_id": bi.checkin_id,
            "price_paise": bi.price_paise,
            "period": bi.period,
            "created_at": bi.created_at.isoformat() if bi.created_at else None
        }
        for bi in bills
    ]

    return {
        "synced_at": now.isoformat(),
        "user": user_data,
        "meal_slots": slots_data,
        "bookings": bookings_data,
        "absences": absences_data,
        "bills": bills_data
    }

