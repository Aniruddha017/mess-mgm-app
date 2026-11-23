from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from app.core.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    actor_id = Column(String(36), nullable=False)
    actor_name = Column(String(100), nullable=True)
    actor_role = Column(String(20), nullable=False)
    action = Column(String(50), nullable=False, index=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

