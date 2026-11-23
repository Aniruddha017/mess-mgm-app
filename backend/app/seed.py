from datetime import datetime, timedelta, timezone
from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.profile import Profile, UserRole, DietaryPreference, UserStatus
from app.models.meal_slot import MealSlot, MealType
from app.models.booking import MealBooking, BookingStatus
from app.models.checkin import MealCheckin
from app.models.feedback import MealFeedback
from app.models.billing import BillItem

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Checking if database already seeded...")
    if db.query(Profile).first():
        print("Database already contains data. Skipping full seed.")
        db.close()
        return

    print("Seeding MessMate database with initial users and meal slots...")

    # 1. Users
    admin = Profile(
        id="ADMIN001",
        name="Chief Warden (College Admin)",
        email="admin@messmate.knit.ac.in",
        hashed_password=hash_password("admin123"),
        role=UserRole.COLLEGE_ADMIN,
        dietary_pref=DietaryPreference.VEG,
        status=UserStatus.ACTIVE
    )

    manager = Profile(
        id="MGR001",
        name="Ramesh Kumar (Mess Manager)",
        email="manager@messmate.knit.ac.in",
        hashed_password=hash_password("manager123"),
        role=UserRole.MESS_MANAGER,
        dietary_pref=DietaryPreference.VEG,
        status=UserStatus.ACTIVE
    )

    students = [
        Profile(
            id="23210",
            name="Aman Saini",
            email="aman@knit.ac.in",
            hashed_password=hash_password("student123"),
            role=UserRole.STUDENT,
            dietary_pref=DietaryPreference.VEG,
            status=UserStatus.ACTIVE
        ),
        Profile(
            id="23211",
            name="Aniruddha Shukla",
            email="aniruddha@knit.ac.in",
            hashed_password=hash_password("student123"),
            role=UserRole.STUDENT,
            dietary_pref=DietaryPreference.VEG,
            status=UserStatus.ACTIVE
        ),
        Profile(
            id="23220",
            name="Ashi Verma",
            email="ashi@knit.ac.in",
            hashed_password=hash_password("student123"),
            role=UserRole.STUDENT,
            dietary_pref=DietaryPreference.NON_VEG,
            status=UserStatus.ACTIVE
        ),
        Profile(
            id="23225",
            name="Bushra Siddique",
            email="bushra@knit.ac.in",
            hashed_password=hash_password("student123"),
            role=UserRole.STUDENT,
            dietary_pref=DietaryPreference.JAIN,
            status=UserStatus.ACTIVE
        ),
    ]

    db.add(admin)
    db.add(manager)
    for s in students:
        db.add(s)
    db.commit()

    # 2. Meal Slots
    today = datetime.now(timezone.utc)
    today_str = today.strftime("%Y-%m-%d")
    tomorrow_str = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")

    # Cutoffs
    # For today: breakfast cutoff passed, lunch cutoff in future, snacks & dinner future
    slots_data = [
        # Today
        {
            "date": today_str,
            "meal_type": MealType.BREAKFAST,
            "menu": "Aloo Pyaz Paratha, Curd, Mixed Pickle, Mint Chutney, Tea / Coffee",
            "dietary_tags": "Veg, North Indian",
            "price_paise": 3500, # Rs 35.00
            "cutoff_time": today - timedelta(hours=2) # passed
        },
        {
            "date": today_str,
            "meal_type": MealType.LUNCH,
            "menu": "Paneer Butter Masala / Egg Curry, Dal Makhani, Jeera Rice, Tawa Roti, Green Salad, Gulab Jamun",
            "dietary_tags": "Veg, Non-Veg Option, High-Protein",
            "price_paise": 5500, # Rs 55.00
            "cutoff_time": today + timedelta(hours=3) # open
        },
        {
            "date": today_str,
            "meal_type": MealType.SNACKS,
            "menu": "Hot Vegetable Pakora / Samosa, Green Chutney, Masala Chai",
            "dietary_tags": "Veg, Quick Bite",
            "price_paise": 2500, # Rs 25.00
            "cutoff_time": today + timedelta(hours=6) # open
        },
        {
            "date": today_str,
            "meal_type": MealType.DINNER,
            "menu": "Kadai Paneer, Mix Veg, Steamed Basmati Rice, Butter Roti, Dal Tadka, Kheer",
            "dietary_tags": "Veg, Jain Friendly",
            "price_paise": 5000, # Rs 50.00
            "cutoff_time": today + timedelta(hours=8) # open
        },
        # Tomorrow
        {
            "date": tomorrow_str,
            "meal_type": MealType.BREAKFAST,
            "menu": "Idli Sambhar, Coconut Chutney, Medu Vada, Filter Coffee",
            "dietary_tags": "Veg, South Indian",
            "price_paise": 4000, # Rs 40.00
            "cutoff_time": today + timedelta(hours=14)
        },
        {
            "date": tomorrow_str,
            "meal_type": MealType.LUNCH,
            "menu": "Rajma Masala, Dum Aloo, Fragrant Basmati Rice, Phulka, Boondi Raita",
            "dietary_tags": "Veg, Traditional",
            "price_paise": 5000,
            "cutoff_time": today + timedelta(hours=18)
        },
        # Yesterday (for past billing and feedback test)
        {
            "date": yesterday_str,
            "meal_type": MealType.DINNER,
            "menu": "Shahi Paneer, Dal Fry, Pulao, Naan, Ice Cream",
            "dietary_tags": "Veg, Special Feast",
            "price_paise": 6000, # Rs 60.00
            "cutoff_time": today - timedelta(hours=24)
        }
    ]

    saved_slots = []
    for sd in slots_data:
        slot = MealSlot(
            date=sd["date"],
            meal_type=sd["meal_type"],
            menu=sd["menu"],
            dietary_tags=sd["dietary_tags"],
            price_paise=sd["price_paise"],
            cutoff_time=sd["cutoff_time"],
            created_by=manager.id
        )
        db.add(slot)
        saved_slots.append(slot)
    db.commit()

    # 3. Create a past booking & checkin for Aman Saini on yesterday's dinner to test feedback & billing
    yesterday_dinner = saved_slots[-1]
    past_booking = MealBooking(
        slot_id=yesterday_dinner.id,
        student_id="23210",
        status=BookingStatus.COLLECTED,
        manual_code="KNIT01"
    )
    db.add(past_booking)
    db.commit()

    past_checkin = MealCheckin(
        booking_id=past_booking.id,
        time=today - timedelta(hours=22),
        staff_id=manager.id,
        verification_method="qr_scan"
    )
    db.add(past_checkin)

    past_bill = BillItem(
        student_id="23210",
        checkin_id=past_booking.id,
        price_paise=yesterday_dinner.price_paise,
        period=yesterday_dinner.date[:7]
    )
    db.add(past_bill)
    db.commit()

    # Pre-book today's lunch for Aman and Aniruddha
    today_lunch = saved_slots[1]
    booking_today = MealBooking(
        slot_id=today_lunch.id,
        student_id="23210",
        status=BookingStatus.BOOKED,
        manual_code="LUNCH1"
    )
    booking_today2 = MealBooking(
        slot_id=today_lunch.id,
        student_id="23211",
        status=BookingStatus.BOOKED,
        manual_code="LUNCH2"
    )
    db.add(booking_today)
    db.add(booking_today2)
    db.commit()

    print("Database seeding successfully completed!")
    db.close()

if __name__ == "__main__":
    seed_database()

