from sqlalchemy import Column, String, DateTime, Enum
from datetime import datetime, timezone
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    MESS_MANAGER = "mess_manager"
    COLLEGE_ADMIN = "college_admin"

class DietaryPreference(str, enum.Enum):
    VEG = "veg"
    NON_VEG = "non_veg"
    JAIN = "jain"
    VEGAN = "vegan"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING_APPROVAL = "pending_approval"
    SUSPENDED = "suspended"

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, index=True) # UUID or Roll No
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.STUDENT)
    dietary_pref = Column(String(20), nullable=False, default=DietaryPreference.VEG)
    status = Column(String(20), nullable=False, default=UserStatus.PENDING_APPROVAL)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

