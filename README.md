# MessMate 🍽️
**Smart Mess Management — Full-Stack Android & Cloud System**  
*B.Tech Project Specification & Implementation • KNIT Sultanpur*

---

## 👥 Project Team
- **Aman Saini** (Roll No. 23210)
- **Aniruddha Shukla** (Roll No. 23211)
- **Ashi Verma** (Roll No. 23220)
- **Bushra Siddique** (Roll No. 23225)  
*Branch: Computer Science & Engineering • Institute: KNIT Sultanpur*

---

## 🏗️ Architecture Overview

MessMate connects student meal booking, rotating QR collection, absence management, food quality feedback, and itemized billing into a single role-based system.

```
┌─────────────────────────────────────────────────────────────┐
│                   Mobile Client (Android)                   │
│   React Native + Expo SDK 58 (TypeScript)                   │
│   Role Dashboards • QR Display & Scanner • Forms            │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│     Local SQLite Cache      │ │     FastAPI Cloud Backend   │
│ expo-sqlite (WAL Mode)      │ │ Python 3.12 + SQLAlchemy    │
│ Instant offline reading     │ │ Role & Cutoff Rule Checks   │
│ Bookings, Check-ins, Bills  │ │ HMAC Token Signing & Verify │
│ Local audit logging         │ │ Frozen Paise Billing Engine │
└─────────────────────────────┘ └──────────────┬──────────────┘
                                               ▼
                                ┌─────────────────────────────┐
                                │ Cloud Database (PostgreSQL) │
                                │ profiles, meal_slots,       │
                                │ checkins, feedback, audit   │
                                └─────────────────────────────┘
```

---

## 🌟 Implemented Core Modules

### 1. Meal Booking Module
- Managers publish slots with meal type (`breakfast`, `lunch`, `snacks`, `dinner`), menu description, price in integer paise, dietary tags, and booking cutoff deadlines.
- Students book or cancel before the cutoff. Past cutoff bookings are strictly rejected.

### 2. Secure Rotating QR Collection Module
- Student pass encodes a short-lived HMAC-SHA256 token valid for 30–60 seconds with an animated countdown ring.
- Anti-screenshot protection: screenshots expire rapidly.
- Counter scanner (`expo-camera`) validates cryptographic signatures.
- **Single-use constraint**: unique database index prevents duplicate collection. Scanning twice returns `ALREADY COLLECTED` and logs an attempt to the Admin audit trail.
- Fallback manual 6-character booking code (e.g., `KNIT01`) available if the counter camera fails.

### 3. Absence Management Module
- Students declare absence for date ranges and selected meals with a reason.
- Existing bookings in that range are **automatically cancelled** and deducted from the manager's preparation demand view.

### 4. Food Quality Feedback Module
- Restricted strictly to students with a verified meal collection.
- 1–5 star rating, issue tags (`Cold Food`, `Too Salty`, `Hygiene Concern`, `Clean Dining`), and comments.
- Anonymized aggregate scores for managers.
- Hygiene-related tags are **automatically flagged to College Administration**.

### 5. Itemized Billing Module
- All monetary transactions stored in **integer paise** (e.g. ₹55.00 = `5500` paise) to prevent floating-point rounding errors.
- Price snapshot is **permanently frozen at the moment of collection**. Subsequent price edits never alter past bills.

---

## 🔑 Pre-Seeded Test Credentials

Use these credentials or tap the **1-Tap Demo Buttons** on the login screen:

| Role | Email | Password | Name / Roll |
| :--- | :--- | :--- | :--- |
| **Student** | `aman@knit.ac.in` | `student123` | Aman Saini (Roll: 23210) |
| **Student** | `aniruddha@knit.ac.in` | `student123` | Aniruddha Shukla (Roll: 23211) |
| **Mess Manager** | `manager@messmate.knit.ac.in` | `manager123` | Ramesh Kumar |
| **College Admin** | `admin@messmate.knit.ac.in` | `admin123` | Chief Warden |

---

## 🚀 How to Run

### 1. Start the Backend API (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Run with virtual environment
.\venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive Swagger Documentation**: Open `http://localhost:8000/docs` in your browser.
- **Run Backend Verification Suite**:
  ```bash
  cd backend
  .\venv\Scripts\python verify_backend.py
  ```

---

### 2. Start the Mobile App (Expo / React Native)

```bash
# Navigate to mobile directory
cd mobile

# Start Expo dev server
npx expo start
```

#### How to Preview on Android:
1. **On Physical Android Phone**: Install **Expo Go** from the Google Play Store, open your camera or the Expo Go app, and scan the terminal QR code. Ensure your phone and PC are on the same Wi-Fi.
2. **On Android Emulator**: Press `a` in the terminal to launch on your Android Studio emulator.
3. **On Web Browser (for instant preview)**: Press `w` in the terminal to open the React Native Web preview.

---

## 📁 Repository Structure

```
mess-mgm-app/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, database, security (JWT & HMAC)
│   │   ├── models/         # SQLAlchemy models (8 core entities)
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── api/            # 9 Routers (auth, slots, checkins, etc.)
│   │   ├── seed.py         # Initial mock database seed
│   │   └── main.py         # FastAPI application entry
│   ├── verify_backend.py   # Comprehensive verification suite
│   └── requirements.txt    # Python dependencies
│
└── mobile/
    ├── src/
    │   ├── constants/      # Colors, API base URL, HMAC secret
    │   ├── types/          # Full TypeScript interfaces
    │   ├── database/       # expo-sqlite cache service
    │   ├── services/       # API client & HMAC QR decoder
    │   ├── context/        # AuthContext with session & quick login
    │   ├── screens/
    │   │   ├── auth/       # Login, Register, Pending Approval
    │   │   ├── student/    # Dashboard, Rotating QR, Absence, Feedback, Bills
    │   │   ├── manager/    # Demand, QR Scanner, Menus, Feedback
    │   │   └── admin/      # Approvals, Hygiene Alerts, Audit Trail
    │   └── navigation/     # Role-based Tab & Stack Navigator
    ├── App.tsx             # Root Application
    └── package.json        # Dependencies
```
