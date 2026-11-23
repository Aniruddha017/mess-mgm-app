from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Auth Schemas ---
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student" # student, mess_manager, college_admin
    dietary_pref: str = "veg" # veg, non_veg, jain, vegan

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ProfileOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    dietary_pref: str
    status: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Meal Slot Schemas ---
class MealSlotCreate(BaseModel):
    date: str # YYYY-MM-DD
    meal_type: str # breakfast, lunch, snacks, dinner
    menu: str
    dietary_tags: str = "Veg"
    price_paise: int = 5000 # 5000 paise = Rs 50.00
    cutoff_time: datetime

class MealSlotUpdate(BaseModel):
    menu: Optional[str] = None
    dietary_tags: Optional[str] = None
    price_paise: Optional[int] = None
    cutoff_time: Optional[datetime] = None

class MealSlotOut(BaseModel):
    id: int
    date: str
    meal_type: str
    menu: str
    dietary_tags: str
    price_paise: int
    cutoff_time: datetime
    created_by: Optional[str]
    created_at: Optional[datetime]
    # Calculated fields
    is_cutoff_passed: Optional[bool] = False
    booked_by_user: Optional[bool] = False
    booking_id: Optional[int] = None
    booking_status: Optional[str] = None

    class Config:
        from_attributes = True

# --- Meal Booking Schemas ---
class MealBookingCreate(BaseModel):
    slot_id: int

class MealBookingOut(BaseModel):
    id: int
    slot_id: int
    student_id: str
    status: str
    manual_code: str
    created_at: Optional[datetime]
    slot: Optional[MealSlotOut] = None

    class Config:
        from_attributes = True

# --- QR & Checkin Schemas ---
class QRTokenOut(BaseModel):
    token: str
    booking_id: int
    expiry: int
    expires_in: int
    manual_code: str

class CheckinRequest(BaseModel):
    token: Optional[str] = None
    manual_code: Optional[str] = None

class CheckinOut(BaseModel):
    booking_id: int
    time: datetime
    staff_id: str
    verification_method: str
    student_name: str
    student_roll: str
    meal_type: str
    menu: str
    price_paise: int
    status: str # "success", "already_collected", etc.

# --- Absence Schemas ---
class AbsenceRequestCreate(BaseModel):
    start_date: str # YYYY-MM-DD
    end_date: str   # YYYY-MM-DD
    meals: str = "all" # "all", "breakfast,lunch,dinner", etc.
    reason: str

class AbsenceRequestOut(BaseModel):
    id: int
    student_id: str
    start_date: str
    end_date: str
    meals: str
    reason: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Feedback Schemas ---
class FeedbackCreate(BaseModel):
    checkin_id: int
    rating: int # 1 to 5
    tags: Optional[str] = ""
    comment: Optional[str] = None

class FeedbackOut(BaseModel):
    id: int
    checkin_id: int
    rating: int
    tags: str
    comment: Optional[str]
    is_hygiene_flagged: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Billing Schemas ---
class BillItemOut(BaseModel):
    id: int
    student_id: str
    checkin_id: int
    price_paise: int
    period: str
    created_at: Optional[datetime]
    meal_type: Optional[str] = None
    meal_date: Optional[str] = None

    class Config:
        from_attributes = True

class MonthlyBillSummary(BaseModel):
    student_id: str
    period: str
    total_meals: int
    total_amount_paise: int
    total_amount_rupees: float
    items: List[BillItemOut]

# --- Admin & Audit Schemas ---
class UserApprovalRequest(BaseModel):
    user_id: str
    approve: bool

class AuditEventOut(BaseModel):
    id: int
    actor_id: str
    actor_name: Optional[str]
    actor_role: str
    action: str
    old_value: Optional[str]
    new_value: Optional[str]
    details: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True
