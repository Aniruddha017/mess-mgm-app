from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.profile import Profile, UserRole
from app.models.checkin import MealCheckin
from app.models.booking import MealBooking
from app.models.feedback import MealFeedback
from app.schemas import FeedbackCreate, FeedbackOut
from app.api.deps import require_role

router = APIRouter(prefix="/feedback", tags=["Food Feedback"])

HYGIENE_KEYWORDS = ["hygiene", "insect", "cockroach", "hair", "uncooked", "raw", "dirty", "pest", "stale", "spoiled", "smell"]

@router.post("", response_model=FeedbackOut)
def submit_feedback(
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.STUDENT]))
):
    # Module 04: Only students with a recorded collection can rate that meal, once.
    checkin = db.query(MealCheckin).filter(MealCheckin.booking_id == feedback_in.checkin_id).first()
    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="REJECTED: Rating without collection is not permitted. Only collected meals can be rated."
        )

    # Check that this checkin belongs to the current student
    booking = checkin.booking
    if booking.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit feedback for meals you personally collected."
        )

    # Check if already rated
    existing_fb = db.query(MealFeedback).filter(MealFeedback.checkin_id == feedback_in.checkin_id).first()
    if existing_fb:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted feedback for this meal collection."
        )

    if feedback_in.rating < 1 or feedback_in.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5 stars.")

    # Flag hygiene issues to College Admin
    tags_str = feedback_in.tags or ""
    comment_str = feedback_in.comment or ""
    combined_text = (tags_str + " " + comment_str).lower()
    
    is_hygiene = any(word in combined_text for word in HYGIENE_KEYWORDS)

    feedback = MealFeedback(
        checkin_id=feedback_in.checkin_id,
        rating=feedback_in.rating,
        tags=tags_str,
        comment=feedback_in.comment,
        is_hygiene_flagged=is_hygiene
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

@router.get("/summary")
def get_anonymous_feedback_summary(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.MESS_MANAGER, UserRole.COLLEGE_ADMIN]))
):
    # Module 04: Managers see anonymous aggregate scores
    avg_rating = db.query(func.avg(MealFeedback.rating)).scalar() or 0.0
    total_feedbacks = db.query(func.count(MealFeedback.id)).scalar() or 0

    all_feedbacks = db.query(MealFeedback).order_by(MealFeedback.id.desc()).limit(50).all()
    
    tag_counts = {}
    feedback_list = []
    for f in all_feedbacks:
        if f.tags:
            for tag in f.tags.split(','):
                cleaned = tag.strip()
                if cleaned:
                    tag_counts[cleaned] = tag_counts.get(cleaned, 0) + 1
                    
        feedback_list.append({
            "id": f.id,
            "rating": f.rating,
            "tags": f.tags,
            "comment": f.comment,
            "is_hygiene_flagged": f.is_hygiene_flagged,
            "created_at": f.created_at
            # Student identity is intentionally omitted for manager anonymity
        })

    return {
        "average_rating": round(float(avg_rating), 2),
        "total_reviews": total_feedbacks,
        "tag_breakdown": tag_counts,
        "recent_reviews": feedback_list
    }

@router.get("/hygiene-alerts")
def get_hygiene_alerts(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_role([UserRole.COLLEGE_ADMIN]))
):
    # Flagged to the college administrator
    alerts = db.query(MealFeedback).filter(MealFeedback.is_hygiene_flagged == True).order_by(MealFeedback.id.desc()).all()
    return alerts

