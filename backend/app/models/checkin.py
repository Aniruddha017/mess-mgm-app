from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class MealCheckin(Base):
    __tablename__ = "meal_checkins"

    # booking_id is the primary key and unique constraint: allows exactly ONE check-in per booking!
    booking_id = Column(Integer, ForeignKey("meal_bookings.id", ondelete="CASCADE"), primary_key=True, unique=True, index=True)
    time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    staff_id = Column(String(36), ForeignKey("profiles.id"), nullable=False)
    verification_method = Column(String(20), nullable=False, default="qr_scan") # qr_scan or manual_code

    # Relationships
    booking = relationship("MealBooking", back_populates="checkin")
    staff = relationship("Profile")
    feedback = relationship("MealFeedback", back_populates="checkin", uselist=False, cascade="all, delete-orphan")
    bill_item = relationship("BillItem", back_populates="checkin", uselist=False, cascade="all, delete-orphan")

