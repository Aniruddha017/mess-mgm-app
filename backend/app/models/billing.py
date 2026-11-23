from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    checkin_id = Column(Integer, ForeignKey("meal_checkins.booking_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    price_paise = Column(Integer, nullable=False) # Snapshot of price at collection time (immutable integer paise)
    period = Column(String(7), nullable=False, index=True) # YYYY-MM
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("Profile")
    checkin = relationship("MealCheckin", back_populates="bill_item")

