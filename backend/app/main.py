from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, slots, bookings, checkins, absences, feedback, billing, admin, sync

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MessMate - Smart Mess Management System (B.Tech KNIT Sultanpur)"
)

# CORS configuration for mobile and web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API Routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(slots.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(checkins.router, prefix=settings.API_V1_STR)
app.include_router(absences.router, prefix=settings.API_V1_STR)
app.include_router(feedback.router, prefix=settings.API_V1_STR)
app.include_router(billing.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(sync.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": "MessMate Backend API",
        "status": "online",
        "docs_url": "/docs",
        "version": settings.VERSION
    }

