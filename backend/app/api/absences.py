from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.profile import Profile, UserRole
from app.models.absence import AbsenceRequest
from app.models.booking import MealBooking, BookingStatus
from app.models.meal_slot import MealSlot
from app.schemas import AbsenceRequestCreate, AbsenceRequestOut
from app.api.deps import require_role

router = APIRouter(prefix="/absences", tags=["Absence Management"])

@router.post("", response_model=AbsenceRequestOut)
def declare_absence(
    absence_in: AbsenceRequestCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.STUDENT]))
):
    if absence_in.start_date > absence_in.end_date:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date.")

    absence = AbsenceRequest(
        student_id=current_user.id,
        start_date=absence_in.start_date,
        end_date=absence_in.end_date,
        meals=absence_in.meals,
        reason=absence_in.reason
    )
    db.add(absence)

    # Module 03 • Absence Management:
    # Bookings in that range are cancelled automatically and counted in the manager's demand view.
    existing_bookings = db.query(MealBooking).join(MealSlot).filter(
        MealBooking.student_id == current_user.id,
        MealBooking.status == BookingStatus.BOOKED,
        MealSlot.date >= absence_in.start_date,
        MealSlot.date <= absence_in.end_date
    ).all()

    for b in existing_bookings:
        if absence_in.meals == "all" or b.slot.meal_type in absence_in.meals:
            b.status = BookingStatus.CANCELLED

    db.commit()
    db.refresh(absence)
    return absence

@router.get("/my", response_model=List[AbsenceRequestOut])
def get_my_absences(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.STUDENT]))
):
    return db.query(AbsenceRequest).filter(
        AbsenceRequest.student_id == current_user.id
    ).order_by(AbsenceRequest.id.desc()).all()

@router.get("/all", response_model=List[AbsenceRequestOut])
def get_all_absences(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.MESS_MANAGER, UserRole.COLLEGE_ADMIN]))
):
    return db.query(AbsenceRequest).order_by(AbsenceRequest.id.desc()).all()

