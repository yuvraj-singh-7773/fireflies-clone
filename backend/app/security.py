import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.models import RevokedToken, User

_bearer = HTTPBearer(auto_error=False)
_PBKDF2_ITERATIONS = 120_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERATIONS)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    if not stored or "$" not in stored:
        return False
    salt, expected = stored.split("$", 1)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERATIONS)
    return hmac.compare_digest(digest.hex(), expected)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "exp": expire, "jti": str(uuid.uuid4())}
    return jwt.encode(payload, settings.resolved_jwt_secret, algorithm="HS256")


def decode_access_token_payload(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.resolved_jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    token_id = payload.get("jti")
    if not user_id or not isinstance(user_id, str) or not token_id or not isinstance(token_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def decode_access_token(token: str) -> str:
    return decode_access_token_payload(token)["sub"]


def revoke_access_token(db: Session, token: str) -> None:
    payload = decode_access_token_payload(token)
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    db.query(RevokedToken).filter(RevokedToken.expires_at <= datetime.now(timezone.utc)).delete()
    if db.get(RevokedToken, payload["jti"]) is None:
        db.add(RevokedToken(jti=payload["jti"], user_id=payload["sub"], expires_at=expires_at))
    db.commit()


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None or creds.scheme.lower() != "bearer" or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Protected traffic also prunes expired revocations, keeping the persistent
    # blacklist bounded by the configured JWT lifetime.
    db.query(RevokedToken).filter(RevokedToken.expires_at <= datetime.now(timezone.utc)).delete()
    db.commit()
    payload = decode_access_token_payload(creds.credentials)
    if db.get(RevokedToken, payload["jti"]) is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked", headers={"WWW-Authenticate": "Bearer"})
    user_id = payload["sub"]
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
