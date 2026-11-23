from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base

class MealType(str, enum.Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    SNACKS = "snacks"
    DINNER = "dinner"

class MealSlot(Base):
    __tablename__ = "meal_slots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(String(10), nullable=False, index=True) # YYYY-MM-DD
    meal_type = Column(String(20), nullable=False) # breakfast, lunch, snacks, dinner
    menu = Column(Text, nullable=False)
    dietary_tags = Column(String(100), default="Veg")
    price_paise = Column(Integer, nullable=False, default=5000) # e.g. 5000 = Rs 50
    cutoff_time = Column(DateTime, nullable=False)
    created_by = Column(String(36), ForeignKey("profiles.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    bookings = relationship("MealBooking", back_populates="slot", cascade="all, delete-orphan")

