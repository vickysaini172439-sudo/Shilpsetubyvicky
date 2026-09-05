import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES


def hash_password(password: str) -> str:
    """Turn a plain-text password into a scrambled hash that's safe to store."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Check a plain-text password against a stored hash."""
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user_id: int) -> str:
    """
    Create a JWT (JSON Web Token): a signed piece of text that proves
    "this user logged in successfully" without the backend needing to
    remember a session. The frontend stores this and sends it back on
    every request that needs to know who's logged in.
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    """Reverse of create_access_token. Returns the user id, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("sub"))
    except JWTError:
        return None


def _normalise_answer(answer: str) -> str:
    """
    Security answers are compared forgivingly: we ignore capital letters
    and extra spaces, so "Sunita  Devi", "sunita devi" and " SUNITA DEVI "
    all count as the same answer. People should not be locked out of
    their livelihood because of a stray space.
    """
    return " ".join(answer.strip().lower().split())


def hash_security_answer(answer: str) -> str:
    """Store the answer scrambled, exactly like a password - so even
    someone reading the database cannot see it."""
    return bcrypt.hashpw(_normalise_answer(answer).encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_security_answer(answer: str, answer_hash: str) -> bool:
    """Check a typed answer against the stored hash."""
    if not answer_hash:
        return False
    return bcrypt.checkpw(_normalise_answer(answer).encode("utf-8"), answer_hash.encode("utf-8"))
