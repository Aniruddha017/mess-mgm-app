from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class MealFeedback(Base):
    __tablename__ = "meal_feedback"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    checkin_id = Column(Integer, ForeignKey("meal_checkins.booking_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    rating = Column(Integer, nullable=False) # 1 to 5 stars
    tags = Column(String(255), default="") # e.g. "Cold food, Hygiene issue, Great taste"
    comment = Column(Text, nullable=True)
    is_hygiene_flagged = Column(Boolean, default=False, nullable=False) # Flagged to College Admin
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    checkin = relationship("MealCheckin", back_populates="feedback")

