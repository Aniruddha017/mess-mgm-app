from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class AbsenceRequest(Base):
    __tablename__ = "absence_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(String(10), nullable=False) # YYYY-MM-DD
    end_date = Column(String(10), nullable=False)   # YYYY-MM-DD
    meals = Column(String(100), nullable=False, default="all") # "all" or "breakfast,lunch,dinner"
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Profile")

