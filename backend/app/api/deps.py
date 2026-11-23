from typing import List, Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token, security_bearer
from app.models.profile import Profile, UserRole, UserStatus
from app.models.audit import AuditEvent

def get_current_user(
    credentials = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> Profile:
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found"
        )
    if user.status == UserStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is pending approval by College Administrator."
        )
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact administrator."
        )
    return user

def require_role(allowed_roles: List[str]) -> Callable:
    def role_checker(current_user: Profile = Depends(get_current_user)) -> Profile:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Required role '{allowed_roles}', but your role is '{current_user.role}'."
            )
        return current_user
    return role_checker

def record_audit_event(
    db: Session,
    actor: Profile,
    action: str,
    old_value: str = None,
    new_value: str = None,
    details: str = None
):
    """
    Records sensitive operations to audit_events table.
    """
    event = AuditEvent(
        actor_id=actor.id,
        actor_name=actor.name,
        actor_role=actor.role,
        action=action,
        old_value=old_value,
        new_value=new_value,
        details=details
    )
    db.add(event)
    db.commit()

