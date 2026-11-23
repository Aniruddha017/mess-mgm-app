import time
import hmac
import hashlib
import json
import base64
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_bearer = HTTPBearer()

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- Rotating HMAC QR Token Generation & Verification ---

def generate_qr_token(booking_id: int, student_id: str, slot_id: int) -> Dict[str, Any]:
    """
    Generates a secure, short-lived signed HMAC QR token valid for QR_EXPIRY_SECONDS (default 60s).
    Refreshes on mobile client every 30s.
    """
    now = int(time.time())
    expiry = now + settings.QR_EXPIRY_SECONDS
    payload = {
        "b_id": booking_id,
        "s_id": student_id,
        "slot_id": slot_id,
        "exp": expiry,
        "iat": now
    }
    
    payload_json = json.dumps(payload, separators=(',', ':'), sort_keys=True)
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode('utf-8')).decode('utf-8').rstrip('=')
    
    # Calculate HMAC SHA256
    signature = hmac.new(
        settings.QR_HMAC_SECRET.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode('utf-8').rstrip('=')
    
    token = f"{payload_b64}.{sig_b64}"
    return {
        "token": token,
        "booking_id": booking_id,
        "expiry": expiry,
        "expires_in": settings.QR_EXPIRY_SECONDS
    }

def verify_qr_token(token_string: str) -> Dict[str, Any]:
    """
    Validates token format, HMAC signature, and timestamp expiry.
    Returns decoded payload if valid, raises HTTPException if invalid or expired.
    """
    try:
        parts = token_string.split('.')
        if len(parts) != 2:
            raise ValueError("Malformed token format")
            
        payload_b64, sig_b64 = parts
        
        # Verify HMAC signature
        expected_sig = hmac.new(
            settings.QR_HMAC_SECRET.encode('utf-8'),
            payload_b64.encode('utf-8'),
            hashlib.sha256
        ).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode('utf-8').rstrip('=')
        
        if not hmac.compare_digest(sig_b64, expected_sig_b64):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid QR signature (Forged or invalid QR code)"
            )
            
        # Decode payload
        # Pad base64 if needed
        padding = 4 - (len(payload_b64) % 4)
        if padding != 4:
            payload_b64 += '=' * padding
            
        payload_json = base64.urlsafe_b64decode(payload_b64.encode('utf-8')).decode('utf-8')
        payload = json.loads(payload_json)
        
        # Check expiry
        now = int(time.time())
        if payload.get("exp", 0) < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code has expired. Please ask student to refresh the screen."
            )
            
        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid QR token: {str(e)}"
        )

