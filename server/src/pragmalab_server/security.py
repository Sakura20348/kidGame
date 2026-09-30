"""Passwords, tokens and email codes."""

import hashlib
import hmac
import secrets


# ------------------------------------------------------------ passwords (scrypt)

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${digest.hex()}"


def check_password(password: str, stored: str | None) -> bool:
    if not stored or not stored.startswith("scrypt$"):
        return False
    _, salt, digest = stored.split("$")
    test = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1, dklen=32)
    return hmac.compare_digest(test.hex(), digest)


def legacy_hash(login: str, password: str) -> str:
    """The SHA-256 the old browser-only app stored – lets existing accounts sign in once and be upgraded."""
    return hashlib.sha256(f"pragmalab:{login.strip().lower()}:{password}".encode()).hexdigest()


# ------------------------------------------------------------ tokens and codes

def new_token() -> str:
    return secrets.token_urlsafe(32)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def new_code() -> str:
    return f"{secrets.randbelow(900000) + 100000}"


def new_student_id() -> str:
    return f"{secrets.randbelow(900000) + 100000}"


CLASS_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O or 1/I – easy to read aloud


def new_class_code() -> str:
    return "".join(secrets.choice(CLASS_ALPHABET) for _ in range(6))
