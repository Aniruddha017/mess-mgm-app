from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.profile import Profile, UserRole
from app.models.billing import BillItem
from app.models.checkin import MealCheckin
from app.schemas import MonthlyBillSummary, BillItemOut
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/billing", tags=["Billing"])

@router.get("/my", response_model=MonthlyBillSummary)
def get_my_bill(
    period: Optional[str] = Query(None, description="YYYY-MM (e.g. 2026-11)"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.STUDENT]))
):
    target_period = period or datetime.now().strftime("%Y-%m")
    
    # Query bill items for this student and period
    items = db.query(BillItem).filter(
        BillItem.student_id == current_user.id,
        BillItem.period == target_period
    ).order_by(BillItem.id.desc()).all()

    bill_items_out = []
    total_paise = 0
    for item in items:
        total_paise += item.price_paise
        meal_type = item.checkin.booking.slot.meal_type.title() if item.checkin and item.checkin.booking else "Meal"
        meal_date = item.checkin.booking.slot.date if item.checkin and item.checkin.booking else ""
        bill_items_out.append(BillItemOut(
            id=item.id,
            student_id=item.student_id,
            checkin_id=item.checkin_id,
            price_paise=item.price_paise,
            period=item.period,
            created_at=item.created_at,
            meal_type=meal_type,
            meal_date=meal_date
        ))

    return MonthlyBillSummary(
        student_id=current_user.id,
        period=target_period,
        total_meals=len(items),
        total_amount_paise=total_paise,
        total_amount_rupees=round(total_paise / 100.0, 2),
        items=bill_items_out
    )

@router.get("/student/{student_id}", response_model=MonthlyBillSummary)
def get_student_bill_by_staff(
    student_id: str,
    period: Optional[str] = Query(None, description="YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.COLLEGE_ADMIN, UserRole.MESS_MANAGER]))
):
    target_period = period or datetime.now().strftime("%Y-%m")
    
    items = db.query(BillItem).filter(
        BillItem.student_id == student_id,
        BillItem.period == target_period
    ).order_by(BillItem.id.desc()).all()

    total_paise = sum(i.price_paise for i in items)
    items_out = [
        BillItemOut(
            id=i.id,
            student_id=i.student_id,
            checkin_id=i.checkin_id,
            price_paise=i.price_paise,
            period=i.period,
            created_at=i.created_at,
            meal_type=i.checkin.booking.slot.meal_type.title() if i.checkin else "Meal",
            meal_date=i.checkin.booking.slot.date if i.checkin else ""
        ) for i in items
    ]

    return MonthlyBillSummary(
        student_id=student_id,
        period=target_period,
        total_meals=len(items),
        total_amount_paise=total_paise,
        total_amount_rupees=round(total_paise / 100.0, 2),
        items=items_out
    )

