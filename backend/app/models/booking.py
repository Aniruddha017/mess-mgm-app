from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
import secrets
from app.core.database import Base

class BookingStatus(str, enum.Enum):
    BOOKED = "booked"
    CANCELLED = "cancelled"
    COLLECTED = "collected"
    NO_SHOW = "no_show"

def generate_manual_code() -> str:
    # 6-character uppercase alphanumeric code for backup counter checkin
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(chars) for _ in range(6))

class MealBooking(Base):
    __tablename__ = "meal_bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    slot_id = Column(Integer, ForeignKey("meal_slots.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default=BookingStatus.BOOKED)
    manual_code = Column(String(10), unique=True, index=True, default=generate_manual_code)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('slot_id', 'student_id', name='uq_slot_student_booking'),
    )

    # Relationships
    slot = relationship("MealSlot", back_populates="bookings")
    student = relationship("Profile")
    checkin = relationship("MealCheckin", back_populates="booking", uselist=False, cascade="all, delete-orphan")

