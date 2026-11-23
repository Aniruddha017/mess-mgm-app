from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.profile import Profile, UserRole, UserStatus
from app.models.meal_slot import MealSlot
from app.models.booking import MealBooking, BookingStatus
from app.models.absence import AbsenceRequest
from app.models.checkin import MealCheckin
from app.models.billing import BillItem
from app.models.audit import AuditEvent
from app.schemas import ProfileOut, AuditEventOut
from app.api.deps import require_role, record_audit_event

router = APIRouter(prefix="/admin", tags=["College Admin & Reports"])

@router.get("/users", response_model=List[ProfileOut])
def list_users(
    role: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.COLLEGE_ADMIN]))
):
    query = db.query(Profile)
    if role:
        query = query.filter(Profile.role == role)
    if status_filter:
        query = query.filter(Profile.status == status_filter)
    return query.order_by(Profile.created_at.desc()).all()

@router.post("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.COLLEGE_ADMIN]))
):
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_status = user.status
    user.status = new_status
    db.commit()

    record_audit_event(
        db, current_user, "user_status_update",
        old_value=old_status,
        new_value=new_status,
        details=f"Updated status for user {user.name} ({user.id}) to {new_status}"
    )
    return {"message": f"User status updated to {new_status}", "user_id": user.id}

@router.get("/audit-logs", response_model=List[AuditEventOut])
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.COLLEGE_ADMIN]))
):
    return db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit).all()

@router.get("/reports/demand")
def get_demand_report(
    date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.COLLEGE_ADMIN, UserRole.MESS_MANAGER]))
):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    slots = db.query(MealSlot).filter(MealSlot.date == target_date).order_by(MealSlot.meal_type.asc()).all()

    report = []
    for s in slots:
        total_booked = db.query(MealBooking).filter(
            MealBooking.slot_id == s.id,
            MealBooking.status != BookingStatus.CANCELLED
        ).count()

        total_cancelled = db.query(MealBooking).filter(
            MealBooking.slot_id == s.id,
            MealBooking.status == BookingStatus.CANCELLED
        ).count()

        total_collected = db.query(MealCheckin).join(MealBooking).filter(
            MealBooking.slot_id == s.id
        ).count()

        # Check declared absences covering this slot date and meal
        absences_count = db.query(AbsenceRequest).filter(
            AbsenceRequest.start_date <= s.date,
            AbsenceRequest.end_date >= s.date
        ).count()

        expected = max(0, total_booked - absences_count)

        report.append({
            "slot_id": s.id,
            "meal_type": s.meal_type.title(),
            "menu": s.menu,
            "price_rupees": s.price_paise / 100.0,
            "total_booked": total_booked,
            "absences_declared": absences_count,
            "cancelled_bookings": total_cancelled,
            "expected_headcount": expected,
            "actually_collected": total_collected,
            "no_shows": max(0, total_booked - total_collected)
        })

    return {
        "date": target_date,
        "demand_summary": report
    }

@router.get("/reports/financial")
def get_financial_report(
    period: Optional[str] = Query(None, description="YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.COLLEGE_ADMIN]))
):
    target_period = period or datetime.now().strftime("%Y-%m")
    total_collections = db.query(BillItem).filter(BillItem.period == target_period).count()
    total_revenue_paise = db.query(func.sum(BillItem.price_paise)).filter(BillItem.period == target_period).scalar() or 0

    return {
        "period": target_period,
        "total_meals_served": total_collections,
        "total_revenue_paise": total_revenue_paise,
        "total_revenue_rupees": round(total_revenue_paise / 100.0, 2)
    }

