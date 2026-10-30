from __future__ import annotations

import base64
import csv
import hashlib
import hmac
import io
import json
import mimetypes
import os
import re
import secrets
import shutil
import sqlite3
import threading
import time
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
if DATABASE_URL.startswith("sqlite:///"):
    sqlite_path = Path(DATABASE_URL.removeprefix("sqlite:///"))
    if not sqlite_path.is_absolute():
        sqlite_path = BACKEND_DIR / sqlite_path
    DATABASE_URL = f"sqlite:///{sqlite_path.as_posix()}"

def backend_path_from_env(name: str, default: str) -> Path:
    path = Path(os.getenv(name, default))
    return path.resolve() if path.is_absolute() else (BACKEND_DIR / path).resolve()

UPLOAD_DIR = backend_path_from_env("UPLOAD_DIR", "./private_uploads")
PROFILE_IMAGE_DIR = backend_path_from_env("PROFILE_IMAGE_DIR", "./profile_images")
GALLERY_IMAGE_DIR = backend_path_from_env("GALLERY_IMAGE_DIR", "./gallery_images")
BACKUP_DIR = backend_path_from_env("BACKUP_DIR", "./backups")
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
TOKEN_TTL_SECONDS = 8 * 60 * 60

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required. Copy backend/.env.example to backend/.env and configure the local database file.")
if not JWT_SECRET_KEY or len(JWT_SECRET_KEY) < 32 or JWT_SECRET_KEY == "replace-with-a-long-random-secret":
    raise RuntimeError("Set JWT_SECRET_KEY to a unique random value of at least 32 characters.")

engine_options: dict[str, Any] = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    engine_options["pool_recycle"] = 1800
engine: Engine = create_engine(DATABASE_URL, **engine_options)
app = FastAPI(title="BGI Alumento API", version="1.0.0")
_backup_worker_started = False

origins = [value.strip() for value in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if value.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_origin_regex=r"^https?://([a-zA-Z0-9-]+\.)*(ngrok-free\.(app|dev)|ngrok\.io|localhost)(:[0-9]+)?$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

PROFILE_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
GALLERY_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/media/profiles", StaticFiles(directory=PROFILE_IMAGE_DIR), name="profiles")
app.mount("/media/gallery", StaticFiles(directory=GALLERY_IMAGE_DIR), name="gallery")


class ReviewRequest(BaseModel):
    status: str = Field(pattern="^(ACTIVE|REJECTED)$")
    rejection_reason: str | None = Field(default=None, max_length=1000)


class AlumniVerificationRequest(BaseModel):
    verified: bool


class RsvpRequest(BaseModel):
    attendee_name: str = Field(min_length=2, max_length=150)
    enrollment_number: str = Field(min_length=1, max_length=50)
    email: str = Field(min_length=5, max_length=250)
    guest_count: int = Field(default=1, ge=1, le=4)


class AdminEventRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(default="", max_length=5000)
    schedule: str = Field(min_length=10, max_length=40)
    banner: str = Field(default="", max_length=1000)


class AdminCourseRequest(BaseModel):
    course: str = Field(min_length=2, max_length=180)
    about: str = Field(default="", max_length=2000)


class AdminAccountRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=200)
    role: str = Field(default="reviewer", pattern="^(super_admin|reviewer|content_manager|read_only)$")


class AdminPasswordRequest(BaseModel):
    password: str = Field(min_length=8, max_length=200)


class AdminRoleRequest(BaseModel):
    role: str = Field(pattern="^(super_admin|reviewer|content_manager|read_only)$")


class GalleryUpdateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    category: str = Field(default="Campus Life", max_length=100)
    description: str = Field(default="", max_length=1000)
    sort_order: int = Field(default=0, ge=0, le=100000)
    featured: bool = False


class AdminAlumniUpdate(BaseModel):
    firstname: str = Field(min_length=1, max_length=100)
    lastname: str = Field(min_length=1, max_length=100)
    college: str = Field(min_length=1, max_length=100)
    batch: int = Field(ge=1980, le=2100)
    course_id: int = Field(ge=1)
    email: str = Field(min_length=5, max_length=250)
    pos: str = Field(default="", max_length=200)
    connected_to: str = Field(default="", max_length=250)
    companyloc: str = Field(default="", max_length=200)
    companysector: str = Field(default="", max_length=100)
    bio: str = Field(default="", max_length=2000)


class AdminBistaaMemberUpdate(BaseModel):
    profile_id: int | None = Field(default=None, ge=1)
    name: str = Field(min_length=2, max_length=200)
    enrollment: str = Field(min_length=1, max_length=50)
    membership_id: str = Field(min_length=1, max_length=150)
    branch: str = Field(default="", max_length=180)
    college: str | None = Field(default=None, max_length=100)
    batch: int | None = Field(default=None, ge=1980, le=2100)
    email: str | None = Field(default=None, max_length=250)
    phone: str | None = Field(default=None, max_length=30)
    employer: str | None = Field(default=None, max_length=250)
    job_title: str | None = Field(default=None, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    sector: str | None = Field(default=None, max_length=100)


def ensure_backend_tables() -> None:
    if engine.dialect.name == "sqlite":
        ddl = [
            """CREATE TABLE IF NOT EXISTS api_admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'super_admin',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS bistaa_application_reviews (
                submission_id INTEGER PRIMARY KEY, status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
                membership_id TEXT NULL, rejection_reason TEXT NULL, verified_by TEXT NULL, reviewed_at TEXT NULL,
                FOREIGN KEY (submission_id) REFERENCES bistaa_submissions(id) ON DELETE CASCADE
            )""",
            """CREATE TABLE IF NOT EXISTS alumni_registration_details (
                alumnus_id INTEGER PRIMARY KEY, native_state TEXT NULL, bio TEXT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (alumnus_id) REFERENCES alumnus_bio(id) ON DELETE CASCADE
            )""",
            """CREATE TABLE IF NOT EXISTS event_rsvps (
                id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL,
                attendee_name TEXT NOT NULL, enrollment_number TEXT NOT NULL, email TEXT NOT NULL,
                guest_count INTEGER NOT NULL DEFAULT 1, pass_code TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS managed_gallery (
                id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Campus Life',
                description TEXT NOT NULL DEFAULT '', image_path TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
                featured INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS admin_audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL,
                entity_type TEXT NOT NULL, entity_id TEXT NULL, details TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS admin_notification_reads (
                username TEXT NOT NULL, notification_id TEXT NOT NULL, read_count INTEGER NOT NULL DEFAULT 0,
                read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (username, notification_id)
            )""",
        ]
    else:
        ddl = [
        """CREATE TABLE IF NOT EXISTS api_admins (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(190) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(30) NOT NULL DEFAULT 'super_admin',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
        """CREATE TABLE IF NOT EXISTS bistaa_application_reviews (
            submission_id INT NOT NULL PRIMARY KEY,
            status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
            membership_id VARCHAR(150) NULL,
            rejection_reason TEXT NULL,
            verified_by VARCHAR(190) NULL,
            reviewed_at DATETIME NULL,
            CONSTRAINT fk_review_submission FOREIGN KEY (submission_id)
              REFERENCES bistaa_submissions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
        """CREATE TABLE IF NOT EXISTS alumni_registration_details (
            alumnus_id INT NOT NULL PRIMARY KEY,
            native_state VARCHAR(120) NULL,
            bio TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_registration_alumnus FOREIGN KEY (alumnus_id)
              REFERENCES alumnus_bio(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
        """CREATE TABLE IF NOT EXISTS event_rsvps (
            id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            attendee_name VARCHAR(150) NOT NULL,
            enrollment_number VARCHAR(50) NOT NULL,
            email VARCHAR(250) NOT NULL,
            guest_count TINYINT NOT NULL DEFAULT 1,
            pass_code VARCHAR(40) NOT NULL UNIQUE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_event_rsvps_event (event_id),
            INDEX idx_event_rsvps_enrollment (enrollment_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
        """CREATE TABLE IF NOT EXISTS managed_gallery (
            id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, title VARCHAR(200) NOT NULL,
            category VARCHAR(100) NOT NULL DEFAULT 'Campus Life', description TEXT NOT NULL,
            image_path VARCHAR(500) NOT NULL, sort_order INT NOT NULL DEFAULT 0,
            featured TINYINT NOT NULL DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
        """CREATE TABLE IF NOT EXISTS admin_audit_logs (
            id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, actor VARCHAR(190) NOT NULL,
            action VARCHAR(100) NOT NULL, entity_type VARCHAR(100) NOT NULL,
            entity_id VARCHAR(190) NULL, details TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_admin_audit_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
        """CREATE TABLE IF NOT EXISTS admin_notification_reads (
            username VARCHAR(190) NOT NULL, notification_id VARCHAR(80) NOT NULL,
            read_count INT NOT NULL DEFAULT 0, read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (username, notification_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
        ]
    with engine.begin() as connection:
        # The supplied dump contains the legacy tables and records. These
        # additive tables keep modern review/auth/RVSP data separate.
        for statement in ddl:
            connection.execute(text(statement))

        if engine.dialect.name == "sqlite":
            admin_columns = {row["name"] for row in connection.execute(text("PRAGMA table_info(api_admins)")).mappings()}
            gallery_columns = {row["name"] for row in connection.execute(text("PRAGMA table_info(managed_gallery)")).mappings()}
        else:
            admin_columns = {row["Field"] for row in connection.execute(text("SHOW COLUMNS FROM api_admins")).mappings()}
            gallery_columns = {row["Field"] for row in connection.execute(text("SHOW COLUMNS FROM managed_gallery")).mappings()}
        if "role" not in admin_columns:
            connection.execute(text("ALTER TABLE api_admins ADD COLUMN role VARCHAR(30) NOT NULL DEFAULT 'super_admin'"))
        if "sort_order" not in gallery_columns:
            connection.execute(text("ALTER TABLE managed_gallery ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0"))
        if "featured" not in gallery_columns:
            connection.execute(text("ALTER TABLE managed_gallery ADD COLUMN featured INTEGER NOT NULL DEFAULT 0"))

        username = os.getenv("BOOTSTRAP_ADMIN_USERNAME", "").strip()
        password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
        if username or password:
            if not username or len(password) < 8:
                raise RuntimeError("Configure both bootstrap admin credentials; password must be at least 8 characters.")
            password_hash = hash_password(password)
            if engine.dialect.name == "sqlite":
                query = """INSERT INTO api_admins (username, password_hash) VALUES (:username, :password_hash)
                    ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash"""
            else:
                query = """INSERT INTO api_admins (username, password_hash) VALUES (:username, :password_hash)
                    ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)"""
            connection.execute(text(query), {"username": username, "password_hash": password_hash})


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"pbkdf2_sha256${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, encoded_salt, encoded_digest = stored.split("$", 2)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.urlsafe_b64decode(encoded_salt.encode())
        expected = base64.urlsafe_b64decode(encoded_digest.encode())
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def encode_token(username: str) -> str:
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({"sub": username, "exp": int(time.time()) + TOKEN_TTL_SECONDS}).encode()).decode().rstrip("=")
    body = f"{header}.{payload}"
    signature = base64.urlsafe_b64encode(hmac.new(JWT_SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest()).decode().rstrip("=")
    return f"{body}.{signature}"


def token_username(token: str) -> str:
    try:
        header, payload, signature = token.split(".")
        body = f"{header}.{payload}"
        expected = base64.urlsafe_b64encode(hmac.new(JWT_SECRET_KEY.encode(), body.encode(), hashlib.sha256).digest()).decode().rstrip("=")
        if not hmac.compare_digest(signature, expected):
            raise ValueError("bad signature")
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if int(claims["exp"]) <= int(time.time()):
            raise ValueError("expired")
        return str(claims["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Admin session is invalid or expired.")


def require_admin(authorization: str | None = Header(default=None, alias="Authorization")) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Admin authentication is required.")
    return token_username(authorization.split(" ", 1)[1].strip())


def require_roles(*allowed_roles: str):
    def check_role(username: str = Depends(require_admin)) -> str:
        with engine.connect() as connection:
            row = connection.execute(text("SELECT role FROM api_admins WHERE username=:username"), {"username": username}).first()
        if not row:
            raise HTTPException(401, "Admin account is no longer active.")
        if row[0] != "super_admin" and row[0] not in allowed_roles:
            raise HTTPException(403, "Your administrator role does not allow this action.")
        return username
    return check_role


def audit(actor: str, action: str, entity_type: str, entity_id: Any = None, details: str = "") -> None:
    with engine.begin() as connection:
        connection.execute(text("""INSERT INTO admin_audit_logs
          (actor, action, entity_type, entity_id, details) VALUES (:actor, :action, :type, :id, :details)"""), {
            "actor": actor, "action": action, "type": entity_type,
            "id": str(entity_id) if entity_id is not None else None, "details": details[:2000],
        })


def persist_upload(upload: UploadFile | None, destination: Path) -> str | None:
    if upload is None or not upload.filename:
        return None
    suffix = ALLOWED_IMAGE_TYPES.get(upload.content_type or "")
    if not suffix:
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, or WebP image.")
    content = upload.file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image uploads must be 5 MB or smaller.")
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    filename = f"{uuid.uuid4().hex}{suffix}"
    destination.mkdir(parents=True, exist_ok=True)
    (destination / filename).write_bytes(content)
    return filename


def profile_image_url(value: Any) -> str | None:
    image = str(value or "").strip()
    if not image:
        return None
    if image.startswith(("http://", "https://", "/")):
        return image
    return f"/media/profiles/{Path(image).name}"


def alumni_payload(row: dict[str, Any], member_ids: dict[str, str] | None = None, details: dict[str, Any] | None = None) -> dict[str, Any]:
    enrollment = str(row.get("enroll_no") or "")
    member_id = (member_ids or {}).get(enrollment.upper())
    avatar = profile_image_url(row.get("avatar")) or ""
    location_type = str(row.get("comploc") or "")
    extras = details or {}
    return {
        "id": f"alum-{row['id']}",
        "enroll_no": enrollment,
        "firstname": row.get("firstname") or "",
        "lastname": row.get("lastname") or "",
        "gender": row.get("gender") or "",
        "college": row.get("college") or "BIST",
        "batch": int(row["batch"]) if row.get("batch") else None,
        "course": row.get("course") or "",
        "companysector": row.get("companysector") or "",
        "connected_to": row.get("connected_to") or "",
        "pos": row.get("pos") or "",
        "comploc": row.get("comploc") or "",
        "companyloc": row.get("companyloc") or "",
        "img_url": avatar or None,
        "native_place": row.get("native") or "",
        "native_state": extras.get("native_state") or row.get("navstate") or "",
        "bio": extras.get("bio") or "",
        "is_abroad": str(row.get("comploc") or "").upper() == "ABROAD",
        "country_flag": "🌐" if location_type.upper() == "ABROAD" else "🇮🇳",
        "country_name": "International" if location_type.upper() == "ABROAD" else "India",
        "is_elite": False,
        "is_bistaa_member": bool(member_id),
        "bistaa_id": member_id,
        "skills": [],
    }


def get_alumni_rows(connection) -> list[dict[str, Any]]:
    rows = connection.execute(text("""SELECT a.*, c.course AS course_name,
        d.native_state AS registration_native_state, d.bio AS registration_bio
        FROM alumnus_bio a LEFT JOIN courses c ON c.id = a.course_id
        LEFT JOIN alumni_registration_details d ON d.alumnus_id = a.id
        WHERE a.status = 1 ORDER BY a.lastname, a.firstname""")).mappings().all()
    active = connection.execute(text("SELECT enrollment_number, alumni_registration_number FROM vista_active_members")).mappings().all()
    member_ids = {str(row["enrollment_number"]).upper(): row["alumni_registration_number"] for row in active}
    return [alumni_payload({**dict(row), "course": row.get("course_name")}, member_ids,
        {"native_state": row.get("registration_native_state"), "bio": row.get("registration_bio")}) for row in rows]


def safe_application(connection, row: dict[str, Any]) -> dict[str, Any]:
    enrollment = str(row.get("enrollment_number") or "")
    review = connection.execute(text("SELECT status, membership_id, rejection_reason, verified_by, reviewed_at FROM bistaa_application_reviews WHERE submission_id=:id"), {"id": row["id"]}).mappings().first()
    active = connection.execute(text("SELECT alumni_registration_number FROM vista_active_members WHERE enrollment_number=:enrollment"), {"enrollment": enrollment}).mappings().first()
    status = "ACTIVE" if active else (review["status"] if review else "PENDING_VERIFICATION")
    return {
        "id": str(row["id"]), "enrollment": enrollment, "name": row.get("name") or "",
        "branch": row.get("branch") or "", "college": "BIST", "amount": float(row.get("amount") or 300),
        "upi_transaction_id": row.get("upi_transaction_id") or "", "transaction_slip": None,
        "has_transaction_slip": bool(row.get("transaction_slip")),
        "status": status, "membership_id": (active or {}).get("alumni_registration_number") or (review or {}).get("membership_id"),
        "rejection_reason": (review or {}).get("rejection_reason"), "verified_by": (review or {}).get("verified_by"),
        "submitted_at": str(row.get("submitted_at") or ""), "verified_at": str((review or {}).get("reviewed_at") or "") or None,
    }


@app.on_event("startup")
def startup() -> None:
    ensure_backend_tables()
    global _backup_worker_started
    if engine.dialect.name == "sqlite" and not _backup_worker_started:
        threading.Thread(target=scheduled_backup_worker, name="bgi-sqlite-backup", daemon=True).start()
        _backup_worker_started = True


@app.get("/api/health")
def health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@app.get("/api/public/bootstrap")
def public_bootstrap():
    """Fetch the public app datasets together, reducing startup HTTP round trips."""
    return {
        "alumni": list_alumni(),
        "members": list_active_members(),
        "events": list_events(),
        "gallery": list_gallery(),
    }


@app.get("/api/alumni")
def list_alumni(search: str | None = None, college: str | None = None, batch: int | None = None):
    with engine.connect() as connection:
        results = get_alumni_rows(connection)
    if college:
        results = [item for item in results if item["college"].lower() == college.lower()]
    if batch:
        results = [item for item in results if item["batch"] == batch]
    if search:
        query = search.strip().lower()
        results = [item for item in results if query in " ".join(str(item.get(key) or "") for key in ("firstname", "lastname", "connected_to", "pos", "course", "companyloc", "bistaa_id")).lower()]
    return results


@app.get("/api/members")
def list_active_members(search: str | None = None, college: str | None = None, batch: int | None = None):
    with engine.connect() as connection:
        alumni = get_alumni_rows(connection)
        active = connection.execute(text("SELECT id, student_name, enrollment_number, branch, alumni_registration_number FROM vista_active_members ORDER BY student_name")).mappings().all()

    def normalize_key(value: Any) -> str:
        return re.sub(r"[^A-Z0-9]", "", str(value or "").upper())

    def unique_index(rows: list[dict[str, Any]], key_fn):
        grouped: dict[str, list[dict[str, Any]]] = {}
        for row in rows:
            key = normalize_key(key_fn(row))
            if key:
                grouped.setdefault(key, []).append(row)
        return {key: matches[0] for key, matches in grouped.items() if len(matches) == 1}

    by_enrollment = unique_index(alumni, lambda row: row.get("enroll_no"))
    by_name = unique_index(alumni, lambda row: f"{row.get('firstname') or ''} {row.get('lastname') or ''}")
    members = []
    for entry in active:
        enrollment_key = normalize_key(entry.get("enrollment_number"))
        composite_prefix = str(entry.get("alumni_registration_number") or "").split("/", 1)[0]
        profile = by_enrollment.get(enrollment_key) or by_enrollment.get(normalize_key(composite_prefix))
        full_name = str(entry.get("student_name") or "").strip()
        if not profile:
            profile = by_name.get(normalize_key(full_name), {})
        names = full_name.split(" ", 1)
        item = {
            **profile,
            "id": f"member-{entry['id']}",
            "enroll_no": entry["enrollment_number"],
            "firstname": profile.get("firstname") or names[0],
            "lastname": profile.get("lastname") or (names[1] if len(names) > 1 else ""),
            "college": profile.get("college") or "BIST",
            "course": profile.get("course") or entry.get("branch") or "",
            "batch": profile.get("batch"),
            "bistaa_id": entry.get("alumni_registration_number") or "",
            "is_bistaa_member": True,
        }
        members.append(item)

    def profile_identity_key(member: dict[str, Any]) -> tuple[str, ...]:
        name = normalize_key(f"{member.get('firstname') or ''} {member.get('lastname') or ''}")
        if not name:
            return ("member", normalize_key(member.get("enroll_no") or member.get("bistaa_id") or member.get("id")))
        return (
            "profile", name, normalize_key(member.get("college")), normalize_key(member.get("course")),
            normalize_key(member.get("batch")),
        )

    def profile_completeness(member: dict[str, Any]) -> int:
        return sum(bool(str(member.get(key) or "").strip()) for key in (
            "connected_to", "pos", "companyloc", "course", "batch", "companysector", "img_url", "bio",
        ))

    # Multiple legacy membership rows can point to the same displayed alumni
    # profile. Keep one representative, preferring the row with richer data.
    members.sort(key=lambda member: (
        -profile_completeness(member),
        normalize_key(member.get("firstname")),
        normalize_key(member.get("enroll_no")),
    ))
    unique_members = []
    seen_profiles: set[tuple[str, ...]] = set()
    for member in members:
        key = profile_identity_key(member)
        if key in seen_profiles:
            continue
        seen_profiles.add(key)
        unique_members.append(member)
    members = unique_members

    if college:
        members = [item for item in members if item.get("college", "").lower() == college.lower()]
    if batch:
        members = [item for item in members if item.get("batch") == batch]
    if search:
        query = search.strip().lower()
        members = [item for item in members if query in " ".join(str(item.get(key) or "") for key in ("firstname", "lastname", "connected_to", "pos", "course", "companyloc", "bistaa_id")).lower()]
    return members


@app.get("/api/courses")
def list_courses():
    with engine.connect() as connection:
        rows = connection.execute(text("SELECT id, course, about FROM courses ORDER BY course")).mappings().all()
    return [dict(row) for row in rows]


@app.get("/api/events")
def list_events():
    with engine.connect() as connection:
        rows = connection.execute(text("""SELECT e.id, e.title, e.content, e.schedule, e.banner,
          (SELECT COUNT(*) FROM event_rsvps r WHERE r.event_id=e.id) AS rsvp_count
          FROM events e ORDER BY e.schedule""")).mappings().all()
    result = []
    for row in rows:
        scheduled = row["schedule"]
        if isinstance(scheduled, str):
            scheduled = datetime.fromisoformat(scheduled)
        if isinstance(scheduled, date) and not isinstance(scheduled, datetime):
            scheduled = datetime.combine(scheduled, datetime.min.time())
        result.append({
            "id": str(row["id"]), "title": row["title"], "description": row.get("content") or "",
            "subtitle": "Official BGI Alumni Gathering", "date": scheduled.strftime("%A, %B %d, %Y"),
            "time": scheduled.strftime("%I:%M %p"), "schedule": scheduled.isoformat(),
            "venue": "Bansal Institute of Science & Technology, Bhopal",
            "image": row.get("banner") or None, "capacity": 0, "registered": int(row.get("rsvp_count") or 0),
            "category": "Campus Reunion", "highlights": [],
        })
    return result


@app.get("/api/gallery")
def list_gallery():
    with engine.connect() as connection:
        rows = connection.execute(text("SELECT id, about FROM gallery ORDER BY id DESC")).mappings().all()
        managed = connection.execute(text("SELECT id, title, category, description, image_path, sort_order, featured FROM managed_gallery ORDER BY featured DESC, sort_order, id DESC")).mappings().all()
    result = []
    for row in rows:
        about = str(row.get("about") or "").strip()
        image = about if re.search(r"\.(jpg|jpeg|png|webp|gif)(\?.*)?$", about, re.I) or about.startswith(("https://", "http://", "/")) else None
        result.append({"id": str(row["id"]), "title": about or "Campus memory", "subtitle": "From the alumni archive", "category": "Campus Life", "image": image})
    result.extend({"id": f"managed-{row['id']}", "title": row["title"], "subtitle": row["description"],
        "description": row["description"], "category": row["category"], "image": row["image_path"],
        "sort_order": row["sort_order"], "featured": bool(row["featured"])} for row in managed)
    return result


@app.post("/api/register", status_code=201)
def register_alumnus(
    firstname: str = Form(...), lastname: str = Form(...), gender: str = Form(...),
    native_state: str = Form(...), native_place: str = Form(...), college: str = Form(...),
    batch: int = Form(...), course: str = Form(...), enroll_no: str = Form(""),
    companysector: str = Form(...), connected_to: str = Form(...), pos: str = Form(...),
    comploc: str = Form(...), companyloc: str = Form(...), email: str = Form(...),
    phone_no: str = Form(...), linkedinid: str = Form(""), bio: str = Form(""),
    avatar: UploadFile | None = File(default=None),
):
    enrollment = enroll_no.strip().upper()
    if enrollment and (len(enrollment) > 12 or not re.fullmatch(r"[A-Z0-9-]{5,12}", enrollment)):
        raise HTTPException(422, "Enrollment number must contain 5–12 letters, digits, or hyphens.")
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email.strip()):
        raise HTTPException(422, "Enter a valid email address.")
    digits = re.sub(r"\D", "", phone_no)
    if not 10 <= len(digits) <= 15:
        raise HTTPException(422, "Enter a valid phone number.")
    avatar_name = persist_upload(avatar, PROFILE_IMAGE_DIR)
    with engine.begin() as connection:
        existing = connection.execute(text("SELECT id FROM alumnus_bio WHERE enroll_no=:enrollment"), {"enrollment": enrollment}).first() if enrollment else None
        if existing:
            raise HTTPException(409, "This enrollment number is already registered.")
        course_aliases = {
            "Master of Business Administration": "MBA",
            "Master of Computer Applications": "MCA",
        }
        database_course = course_aliases.get(course, course)
        course_row = connection.execute(text("SELECT id FROM courses WHERE LOWER(course)=LOWER(:course) LIMIT 1"), {"course": database_course}).mappings().first()
        if not course_row:
            raise HTTPException(422, "Choose a course available in the database.")
        result = connection.execute(text("""INSERT INTO alumnus_bio
          (firstname, native, lastname, enroll_no, gender, college, batch, course_id, phone_no,
           email, pos, navstate, connected_to, comploc, companyloc, companysector, linkedinid, avatar, status)
          VALUES (:firstname, :native, :lastname, :enrollment, :gender, :college, :batch, :course_id,
           :phone, :email, :position, :native_state, :employer, :location_type, :company_location,
           :sector, :linkedin, :avatar, 0)"""), {
            "firstname": firstname.strip(), "native": native_place.strip(), "lastname": lastname.strip(),
            "enrollment": enrollment, "gender": gender, "college": college, "batch": batch,
            "course_id": course_row["id"], "phone": int(digits), "email": email.strip(), "position": pos.strip(),
            "native_state": native_state.strip(), "employer": connected_to.strip(), "location_type": comploc,
            "company_location": companyloc.strip(), "sector": companysector, "linkedin": linkedinid.strip(),
            "avatar": avatar_name or "",
        })
        alumnus_id = result.lastrowid
        connection.execute(text("INSERT INTO alumni_registration_details (alumnus_id, native_state, bio) VALUES (:id, :state, :bio)"), {"id": alumnus_id, "state": native_state.strip(), "bio": bio.strip()})
    return {"id": f"alum-{alumnus_id}", "enroll_no": enrollment, "status": "PENDING_VERIFICATION"}


@app.post("/api/bistaa/applications", status_code=201)
def submit_bistaa_application(
    enrollment: str = Form(...), name: str = Form(...), branch: str = Form(...),
    college: str = Form("BIST"), upi_transaction_id: str = Form(...),
    transaction_slip: UploadFile = File(...),
):
    enrollment = enrollment.strip().upper()
    utr = upi_transaction_id.strip()
    if not re.fullmatch(r"\d{12}", utr):
        raise HTTPException(422, "UPI transaction ID must be exactly 12 digits.")
    slip_name = persist_upload(transaction_slip, UPLOAD_DIR)
    if not slip_name:
        raise HTTPException(400, "Payment slip is required.")
    with engine.begin() as connection:
        if connection.execute(text("SELECT id FROM bistaa_submissions WHERE upi_transaction_id=:utr"), {"utr": utr}).first():
            raise HTTPException(409, "This UPI transaction ID has already been submitted.")
        result = connection.execute(text("""INSERT INTO bistaa_submissions
          (enrollment_number, name, branch, amount, upi_transaction_id, transaction_slip)
          VALUES (:enrollment, :name, :branch, 300.00, :utr, :slip)"""), {
            "enrollment": enrollment, "name": name.strip(), "branch": branch.strip(), "utr": utr, "slip": slip_name,
        })
        application_id = result.lastrowid
        connection.execute(text("INSERT INTO bistaa_application_reviews (submission_id) VALUES (:id)"), {"id": application_id})
    return {"id": str(application_id), "enrollment": enrollment, "status": "PENDING_VERIFICATION"}


def find_application(query: str) -> dict[str, Any] | None:
    term = query.strip().upper()
    with engine.connect() as connection:
        row = connection.execute(text("""SELECT * FROM bistaa_submissions
          WHERE UPPER(enrollment_number)=:term OR UPPER(upi_transaction_id)=:term
          ORDER BY submitted_at DESC, id DESC LIMIT 1"""), {"term": term}).mappings().first()
        if row:
            return safe_application(connection, dict(row))
        active = connection.execute(text("""SELECT v.*, a.college, a.course_id, a.batch FROM vista_active_members v
          LEFT JOIN alumnus_bio a ON UPPER(a.enroll_no)=UPPER(v.enrollment_number)
          WHERE UPPER(v.enrollment_number)=:term"""), {"term": term}).mappings().first()
        if active:
            course_row = connection.execute(text("SELECT course FROM courses WHERE id=:id"), {"id": active["course_id"]}).mappings().first() if active.get("course_id") else None
            return {"id": str(active["id"]), "enrollment": active["enrollment_number"], "name": active["student_name"],
                "branch": active.get("branch") or (course_row or {}).get("course") or "", "college": active.get("college") or "BIST",
                "amount": float(active.get("amount") or 300), "upi_transaction_id": "", "transaction_slip": None,
                "status": "ACTIVE", "membership_id": active.get("alumni_registration_number"), "verified_by": "BISTAA Desk",
                "submitted_at": "", "verified_at": None}
    return None


@app.get("/api/bistaa/status")
def bistaa_status(query: str = Query(min_length=1, max_length=100)):
    application = find_application(query)
    if not application:
        raise HTTPException(404, "No BISTAA application or active membership matched that enrollment number or transaction ID.")
    if application.get("transaction_slip"):
        expires = int(time.time()) + 300
        message = f"{application['id']}:{expires}"
        signature = hmac.new(JWT_SECRET_KEY.encode(), message.encode(), hashlib.sha256).hexdigest()
        application["transaction_slip"] = f"/api/bistaa/slips/{application['id']}?expires={expires}&signature={signature}"
    return application


@app.get("/api/bistaa/slips/{application_id}")
def view_bistaa_slip(application_id: int, expires: int, signature: str):
    message = f"{application_id}:{expires}"
    expected = hmac.new(JWT_SECRET_KEY.encode(), message.encode(), hashlib.sha256).hexdigest()
    if expires < int(time.time()) or not hmac.compare_digest(signature, expected):
        raise HTTPException(403, "This payment slip link has expired.")
    with engine.connect() as connection:
        row = connection.execute(text("SELECT transaction_slip FROM bistaa_submissions WHERE id=:id"), {"id": application_id}).mappings().first()
    if not row or not row["transaction_slip"]:
        raise HTTPException(404, "Payment slip not found.")
    path = UPLOAD_DIR / Path(row["transaction_slip"]).name
    if not path.is_file():
        raise HTTPException(404, "The payment slip file is unavailable.")
    return FileResponse(path, media_type=mimetypes.guess_type(path.name)[0] or "application/octet-stream")


@app.get("/api/verify")
@app.get("/api/verify/{identifier}")
def verify_alumnus_record(
    identifier: str | None = None,
    query: str | None = Query(default=None),
    enrollment: str | None = Query(default=None),
    membership_id: str | None = Query(default=None),
    id: str | None = Query(default=None),
):
    """
    Public verification endpoint to verify an alumnus or BISTAA member credential
    via QR code scan or direct query.
    """
    search_term = (identifier or query or enrollment or membership_id or id or "").strip()
    if not search_term:
        raise HTTPException(400, "Please provide an enrollment number, membership ID, or name to verify.")

    clean_term = search_term.upper()
    digits_match = re.search(r"\d+", search_term)
    digits_id = int(digits_match.group()) if digits_match and (search_term.startswith("alum-") or search_term.startswith("member-") or search_term.isdigit()) else None

    with engine.connect() as connection:
        # 1. Search active BISTAA members
        active = connection.execute(text("""
            SELECT v.*, a.id AS alum_id, a.firstname, a.lastname, a.gender, a.college, a.batch,
                   a.pos, a.connected_to, a.companyloc, a.companysector, a.avatar, a.native, a.navstate,
                   c.course AS course_title, d.bio AS registration_bio, d.native_state AS reg_native_state
            FROM vista_active_members v
            LEFT JOIN alumnus_bio a ON (UPPER(a.enroll_no) = UPPER(v.enrollment_number) OR UPPER(v.alumni_registration_number) LIKE '%' || UPPER(a.enroll_no) || '%')
            LEFT JOIN courses c ON c.id = a.course_id
            LEFT JOIN alumni_registration_details d ON d.alumnus_id = a.id
            WHERE UPPER(v.enrollment_number) = :term
               OR UPPER(v.alumni_registration_number) = :term
               OR (:digits_id IS NOT NULL AND v.id = :digits_id)
               OR UPPER(v.student_name) = :term
            LIMIT 1
        """), {"term": clean_term, "digits_id": digits_id}).mappings().first()

        # 2. If not found in active members, search alumnus_bio
        alum = None
        if not active:
            alum = connection.execute(text("""
                SELECT a.*, c.course AS course_title,
                       d.native_state AS reg_native_state, d.bio AS registration_bio,
                       v.alumni_registration_number, v.id AS active_id
                FROM alumnus_bio a
                LEFT JOIN courses c ON c.id = a.course_id
                LEFT JOIN alumni_registration_details d ON d.alumnus_id = a.id
                LEFT JOIN vista_active_members v ON UPPER(v.enrollment_number) = UPPER(a.enroll_no)
                WHERE (a.status = 1 OR a.status = 0)
                  AND (UPPER(a.enroll_no) = :term
                       OR (:digits_id IS NOT NULL AND a.id = :digits_id)
                       OR UPPER(a.firstname) = :term
                       OR UPPER(a.lastname) = :term)
                ORDER BY a.status DESC, a.id DESC
                LIMIT 1
            """), {"term": clean_term, "digits_id": digits_id}).mappings().first()

        # 3. Partial / name matching fallback
        if not active and not alum and len(clean_term) >= 3:
            active = connection.execute(text("""
                SELECT v.*, a.id AS alum_id, a.firstname, a.lastname, a.gender, a.college, a.batch,
                       a.pos, a.connected_to, a.companyloc, a.companysector, a.avatar, a.native, a.navstate,
                       c.course AS course_title, d.bio AS registration_bio, d.native_state AS reg_native_state
                FROM vista_active_members v
                LEFT JOIN alumnus_bio a ON UPPER(a.enroll_no) = UPPER(v.enrollment_number)
                LEFT JOIN courses c ON c.id = a.course_id
                LEFT JOIN alumni_registration_details d ON d.alumnus_id = a.id
                WHERE UPPER(v.student_name) LIKE :like_term
                   OR UPPER(v.enrollment_number) LIKE :like_term
                   OR UPPER(v.alumni_registration_number) LIKE :like_term
                LIMIT 1
            """), {"like_term": f"%{clean_term}%"}).mappings().first()

            if not active:
                alum = connection.execute(text("""
                    SELECT a.*, c.course AS course_title,
                           d.native_state AS reg_native_state, d.bio AS registration_bio,
                           v.alumni_registration_number, v.id AS active_id
                    FROM alumnus_bio a
                    LEFT JOIN courses c ON c.id = a.course_id
                    LEFT JOIN alumni_registration_details d ON d.alumnus_id = a.id
                    LEFT JOIN vista_active_members v ON UPPER(v.enrollment_number) = UPPER(a.enroll_no)
                    WHERE UPPER(a.firstname) LIKE :like_term
                       OR UPPER(a.lastname) LIKE :like_term
                       OR UPPER(a.enroll_no) LIKE :like_term
                    ORDER BY a.status DESC, a.id DESC
                    LIMIT 1
                """), {"like_term": f"%{clean_term}%"}).mappings().first()

    if not active and not alum:
        return {
            "verified": False,
            "query": search_term,
            "message": "No matching verified alumni or member record was found for this identifier.",
        }

    if active:
        names = str(active.get("student_name") or "").strip().split(" ", 1)
        first_name = active.get("firstname") or names[0]
        last_name = active.get("lastname") or (names[1] if len(names) > 1 else "")
        full_name = f"{first_name} {last_name}".strip()
        enrollment_num = active.get("enrollment_number") or ""
        membership_id_val = active.get("alumni_registration_number") or f"BISTAA-{active['id']}"
        branch_val = active.get("course_title") or active.get("branch") or ""
        college_val = active.get("college") or "BIST"
        batch_val = active.get("batch")
        avatar_val = profile_image_url(active.get("avatar"))
        employer_val = active.get("connected_to") or ""
        role_val = active.get("pos") or ""
        loc_val = active.get("companyloc") or ""
        sec_val = active.get("companysector") or ""
        state_val = active.get("reg_native_state") or active.get("navstate") or ""
        place_val = active.get("native") or ""
        bio_val = active.get("registration_bio") or ""
        is_member = True
        verification_type = "BISTAA_LIFETIME_MEMBER"
        badge_label = "Officially Verified BISTAA Lifetime Member"
    else:
        first_name = alum.get("firstname") or ""
        last_name = alum.get("lastname") or ""
        full_name = f"{first_name} {last_name}".strip()
        enrollment_num = alum.get("enroll_no") or ""
        membership_id_val = alum.get("alumni_registration_number") or ""
        branch_val = alum.get("course_title") or ""
        college_val = alum.get("college") or "BIST"
        batch_val = alum.get("batch")
        avatar_val = profile_image_url(alum.get("avatar"))
        employer_val = alum.get("connected_to") or ""
        role_val = alum.get("pos") or ""
        loc_val = alum.get("companyloc") or ""
        sec_val = alum.get("companysector") or ""
        state_val = alum.get("reg_native_state") or alum.get("navstate") or ""
        place_val = alum.get("native") or ""
        bio_val = alum.get("registration_bio") or ""
        is_member = bool(membership_id_val)
        verification_type = "BISTAA_LIFETIME_MEMBER" if is_member else "VERIFIED_ALUMNUS"
        badge_label = "Officially Verified BISTAA Lifetime Member" if is_member else "Officially Verified BGI Alumnus"

    code_seed = f"{enrollment_num}:{membership_id_val}:{full_name}".encode()
    hash_code = hashlib.sha256(code_seed).hexdigest()[:8].upper()
    verif_code = f"BGI-VRF-{hash_code}"

    return {
        "verified": True,
        "verification_type": verification_type,
        "badge_label": badge_label,
        "verification_code": verif_code,
        "verified_at": datetime.now().strftime("%d %B %Y, %I:%M %p IST"),
        "alumnus": {
            "name": full_name,
            "firstname": first_name,
            "lastname": last_name,
            "enrollment": enrollment_num,
            "enroll_no": enrollment_num,
            "membership_id": membership_id_val,
            "bistaa_id": membership_id_val,
            "college": college_val,
            "course": branch_val,
            "branch": branch_val,
            "batch": batch_val,
            "employer": employer_val,
            "connected_to": employer_val,
            "position": role_val,
            "pos": role_val,
            "location": loc_val,
            "companyloc": loc_val,
            "sector": sec_val,
            "companysector": sec_val,
            "img_url": avatar_val,
            "avatar": avatar_val,
            "native_place": place_val,
            "native_state": state_val,
            "bio": bio_val,
            "is_bistaa_member": is_member,
            "status": "ACTIVE" if is_member else "VERIFIED",
        },
        "institution": {
            "name": "Bansal Institute of Science & Technology (BIST)",
            "group": "Bansal Group of Institutions (BGI), Bhopal",
            "council": "BIST Alumni Association (BISTAA) Executive Council",
            "affiliations": "AICTE Approved • NAAC Accredited • Affiliated to RGPV & Barkatullah University",
            "campus": "Kokta, Anand Nagar, Bhopal, Madhya Pradesh 462021",
        }
    }


@app.post("/api/events/{event_id}/rsvp", status_code=201)
def create_event_rsvp(event_id: int, payload: RsvpRequest):
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", payload.email.strip()):
        raise HTTPException(422, "Enter a valid email address.")
    pass_code = f"BGI-PASS-{secrets.token_hex(3).upper()}"
    with engine.begin() as connection:
        event = connection.execute(text("SELECT id FROM events WHERE id=:id"), {"id": event_id}).first()
        if not event:
            raise HTTPException(404, "Event not found.")
        result = connection.execute(text("""INSERT INTO event_rsvps
          (event_id, attendee_name, enrollment_number, email, guest_count, pass_code)
          VALUES (:event_id, :name, :enrollment, :email, :guests, :pass_code)"""), {
            "event_id": event_id, "name": payload.attendee_name.strip(), "enrollment": payload.enrollment_number.strip().upper(),
            "email": payload.email.strip(), "guests": payload.guest_count, "pass_code": pass_code,
        })
    return {"id": result.lastrowid, "passId": pass_code, **payload.dict()}


@app.post("/api/admin/login")
def admin_login(username: str = Form(...), password: str = Form(...)):
    with engine.connect() as connection:
        admin = connection.execute(text("SELECT username, password_hash, role FROM api_admins WHERE username=:username"), {"username": username.strip()}).mappings().first()
    if not admin or not verify_password(password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Username or password is incorrect.")
    return {"access_token": encode_token(admin["username"]), "token_type": "bearer", "expires_in": TOKEN_TTL_SECONDS, "role": admin["role"]}


@app.get("/api/admin/applications")
def admin_applications(username: str = Depends(require_admin)):
    with engine.connect() as connection:
        rows = connection.execute(text("SELECT * FROM bistaa_submissions ORDER BY submitted_at DESC, id DESC")).mappings().all()
        applications = [safe_application(connection, dict(row)) for row in rows]
    return {"applications": applications, "verified_by": username}


@app.get("/api/admin/bistaa/members")
def admin_bistaa_members(username: str = Depends(require_admin)):
    """Return active BISTAA members with any safely linked alumni profile details."""
    with engine.connect() as connection:
        active_rows = connection.execute(text("""SELECT id, student_name, enrollment_number, branch,
          amount, alumni_registration_number FROM vista_active_members ORDER BY student_name, id""")).mappings().all()
        profile_rows = connection.execute(text("""SELECT a.id, a.firstname, a.lastname, a.enroll_no, a.college,
          a.batch, a.email, a.phone_no, a.pos, a.connected_to, a.companyloc, a.companysector,
          a.status, a.course_id, a.avatar, c.course FROM alumnus_bio a LEFT JOIN courses c ON c.id=a.course_id""")).mappings().all()

    def normalize_key(value: Any) -> str:
        return re.sub(r"[^A-Z0-9]", "", str(value or "").upper())

    def unique_index(key_fn):
        grouped: dict[str, list[dict[str, Any]]] = {}
        for row in profile_rows:
            key = normalize_key(key_fn(row))
            if key:
                grouped.setdefault(key, []).append(dict(row))
        return {key: records[0] for key, records in grouped.items() if len(records) == 1}

    by_enrollment = unique_index(lambda row: row.get("enroll_no"))
    by_name = unique_index(lambda row: f"{row.get('firstname') or ''} {row.get('lastname') or ''}")
    members = []
    for entry in active_rows:
        entry = dict(entry)
        full_name = str(entry.get("student_name") or "").strip()
        prefix = str(entry.get("alumni_registration_number") or "").split("/", 1)[0]
        profile = by_enrollment.get(normalize_key(entry.get("enrollment_number")))
        if not profile:
            profile = by_enrollment.get(normalize_key(prefix))
        if not profile:
            profile = by_name.get(normalize_key(full_name))
        profile = profile or {}
        names = full_name.split(" ", 1)
        raw_profile_status = int(profile.get("status") or 0) if profile else None
        profile_status = "Verified" if raw_profile_status == 1 else "Rejected" if raw_profile_status == 2 else "Profile pending" if profile else "No linked profile"
        members.append({
            "id": f"member-{entry['id']}",
            "active_member_id": entry["id"],
            "profile_id": profile.get("id"),
            "name": f"{profile.get('firstname') or (names[0] if names else '')} {profile.get('lastname') or (names[1] if len(names) > 1 else '')}".strip(),
            "membership_id": entry.get("alumni_registration_number") or "",
            "enrollment": entry.get("enrollment_number") or "",
            "college": profile.get("college") or "BIST",
            "branch": profile.get("course") or entry.get("branch") or "",
            "batch": profile.get("batch"),
            "email": profile.get("email") or "",
            "phone": profile.get("phone_no") or "",
            "employer": profile.get("connected_to") or "",
            "job_title": profile.get("pos") or "",
            "location": profile.get("companyloc") or "",
            "sector": profile.get("companysector") or "",
            "photo_url": profile_image_url(profile.get("avatar")),
            "profile_status": profile_status,
            "profile_linked": bool(profile),
        })
    return members


@app.put("/api/admin/bistaa/members/{member_id}")
def update_admin_bistaa_member(member_id: int, payload: AdminBistaaMemberUpdate, username: str = Depends(require_roles("reviewer"))):
    name_parts = payload.name.strip().split(None, 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    enrollment = payload.enrollment.strip().upper()
    membership_id = payload.membership_id.strip()
    email = (payload.email or "").strip()
    if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(422, "Enter a valid email address.")
    phone_digits = re.sub(r"\D", "", payload.phone or "")
    if phone_digits and len(phone_digits) > 15:
        raise HTTPException(422, "Phone number must be 15 digits or fewer.")

    with engine.begin() as connection:
        current = connection.execute(text("SELECT id FROM vista_active_members WHERE id=:id"), {"id": member_id}).first()
        if not current:
            raise HTTPException(404, "BISTAA member not found.")
        duplicate = connection.execute(text("SELECT id FROM vista_active_members WHERE UPPER(enrollment_number)=:enrollment AND id<>:id LIMIT 1"), {"enrollment": enrollment, "id": member_id}).first()
        if duplicate:
            raise HTTPException(409, "Another BISTAA member already uses this enrollment number.")
        profile = connection.execute(text("SELECT id FROM alumnus_bio WHERE id=:id"), {"id": payload.profile_id}).first() if payload.profile_id else None
        if not profile:
            profile = connection.execute(text("SELECT id FROM alumnus_bio WHERE UPPER(enroll_no)=:enrollment ORDER BY CASE WHEN status=1 THEN 0 ELSE 1 END LIMIT 1"), {"enrollment": enrollment}).first()
        connection.execute(text("""UPDATE vista_active_members SET student_name=:name,
          enrollment_number=:enrollment, branch=:branch, alumni_registration_number=:membership_id WHERE id=:id"""), {
            "name": payload.name.strip(), "enrollment": enrollment, "branch": payload.branch.strip(),
            "membership_id": membership_id, "id": member_id,
        })
        if profile:
            course_row = connection.execute(text("SELECT id FROM courses WHERE UPPER(course)=UPPER(:course) LIMIT 1"), {"course": payload.branch.strip()}).first() if payload.branch.strip() else None
            connection.execute(text("""UPDATE alumnus_bio SET firstname=:firstname, lastname=:lastname,
              enroll_no=:enrollment, college=:college, batch=:batch, email=:email, phone_no=:phone,
              connected_to=:employer, pos=:job_title, companyloc=:location, companysector=:sector,
              course_id=COALESCE(:course_id, course_id) WHERE id=:profile_id"""), {
                "firstname": first_name, "lastname": last_name, "enrollment": enrollment,
                "college": (payload.college or "BIST").strip(), "batch": payload.batch,
                "email": email, "phone": int(phone_digits) if phone_digits else None,
                "employer": (payload.employer or "").strip(), "job_title": (payload.job_title or "").strip(),
                "location": (payload.location or "").strip(), "sector": (payload.sector or "").strip(),
                "course_id": course_row[0] if course_row else None, "profile_id": profile[0],
            })
    audit(username, "updated", "bistaa_member", member_id, f"Updated member record {membership_id}")
    return {"id": member_id, "updated": True, "profile_updated": bool(profile), "updated_by": username}


@app.get("/api/admin/alumni/pending")
def pending_alumni(username: str = Depends(require_admin)):
    with engine.connect() as connection:
        rows = connection.execute(text("""SELECT a.id, a.firstname, a.lastname, a.enroll_no, a.college,
          a.batch, a.email, a.phone_no, c.course FROM alumnus_bio a
          LEFT JOIN courses c ON c.id=a.course_id WHERE a.status=0
          ORDER BY a.id DESC LIMIT 500""")).mappings().all()
    return [dict(row) for row in rows]


@app.get("/api/admin/alumni")
def admin_alumni_list(username: str = Depends(require_admin)):
    with engine.connect() as connection:
        rows = connection.execute(text("""SELECT a.id, a.firstname, a.lastname, a.enroll_no, a.college,
          a.batch, a.course_id, c.course, a.email, a.phone_no, a.pos, a.connected_to,
          a.companyloc, a.companysector, a.status, a.avatar, d.bio
          FROM alumnus_bio a LEFT JOIN courses c ON c.id=a.course_id
          LEFT JOIN alumni_registration_details d ON d.alumnus_id=a.id
          ORDER BY a.lastname, a.firstname""")).mappings().all()
    return [{**dict(row), "photo_url": profile_image_url(row.get("avatar"))} for row in rows]


@app.put("/api/admin/alumni/{alumnus_id}")
def update_admin_alumnus(alumnus_id: int, payload: AdminAlumniUpdate, username: str = Depends(require_roles("reviewer"))):
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", payload.email.strip()):
        raise HTTPException(422, "Enter a valid email address.")
    with engine.begin() as connection:
        if not connection.execute(text("SELECT 1 FROM courses WHERE id=:id"), {"id": payload.course_id}).first():
            raise HTTPException(422, "Select a valid department or course.")
        current_profile = connection.execute(text("SELECT firstname, lastname, enroll_no FROM alumnus_bio WHERE id=:id"), {"id": alumnus_id}).mappings().first()
        if not current_profile:
            raise HTTPException(404, "Alumni profile not found.")
        course_name = connection.execute(text("SELECT course FROM courses WHERE id=:id"), {"id": payload.course_id}).scalar_one()
        result = connection.execute(text("""UPDATE alumnus_bio SET firstname=:firstname, lastname=:lastname,
          college=:college, batch=:batch, course_id=:course_id, email=:email, pos=:pos,
          connected_to=:connected_to, companyloc=:companyloc, companysector=:companysector
          WHERE id=:id"""), {**payload.model_dump(exclude={"bio"}), "id": alumnus_id, "email": payload.email.strip()})
        if not result.rowcount:
            raise HTTPException(404, "Alumni profile not found.")
        # Keep the stable identity fields in the BISTAA register aligned when
        # this profile belongs to exactly one active member.
        normalize_member_key = lambda value: re.sub(r"[^A-Z0-9]", "", str(value or "").upper())
        profile_enrollment = normalize_member_key(current_profile["enroll_no"])
        active_rows = connection.execute(text("SELECT id, enrollment_number, alumni_registration_number FROM vista_active_members")).mappings().all()
        exact_matches = [row for row in active_rows if profile_enrollment and normalize_member_key(row["enrollment_number"]) == profile_enrollment]
        if not exact_matches and profile_enrollment:
            exact_matches = [row for row in active_rows if normalize_member_key(str(row["alumni_registration_number"] or "").split("/", 1)[0]) == profile_enrollment]
        if len(exact_matches) == 1:
            connection.execute(text("""UPDATE vista_active_members SET student_name=:name, branch=:branch WHERE id=:id"""), {
                "name": f"{payload.firstname.strip()} {payload.lastname.strip()}".strip(),
                "branch": course_name, "id": exact_matches[0]["id"],
            })
        if engine.dialect.name == "sqlite":
            details_sql = """INSERT INTO alumni_registration_details (alumnus_id, bio) VALUES (:id, :bio)
              ON CONFLICT(alumnus_id) DO UPDATE SET bio=excluded.bio"""
        else:
            details_sql = """INSERT INTO alumni_registration_details (alumnus_id, bio) VALUES (:id, :bio)
              ON DUPLICATE KEY UPDATE bio=VALUES(bio)"""
        connection.execute(text(details_sql), {"id": alumnus_id, "bio": payload.bio.strip()})
    audit(username, "updated", "alumni_profile", alumnus_id)
    return {"id": alumnus_id, "updated": True, "membership_synced": len(exact_matches) == 1, "updated_by": username}


@app.put("/api/admin/alumni/{alumnus_id}/photo")
def update_admin_alumnus_photo(
    alumnus_id: int,
    photo_url: str = Form(default=""),
    avatar: UploadFile | None = File(default=None),
    username: str = Depends(require_roles("reviewer")),
):
    """Set or clear an alumni profile photo using an uploaded image or an image URL."""
    image_value = ""
    if avatar is not None and avatar.filename:
        image_value = persist_upload(avatar, PROFILE_IMAGE_DIR) or ""
    else:
        image_value = photo_url.strip()
        if image_value and not (
            re.match(r"^https?://[^\s]+$", image_value, re.IGNORECASE)
            or (image_value.startswith("/media/profiles/") and ".." not in image_value)
        ):
            raise HTTPException(422, "Use an http(s) image URL or a profile image URL from this site.")
        if len(image_value) > 1000:
            raise HTTPException(422, "The image URL is too long.")
    with engine.begin() as connection:
        result = connection.execute(text("UPDATE alumnus_bio SET avatar=:avatar WHERE id=:id"), {
            "avatar": image_value or None, "id": alumnus_id,
        })
        if not result.rowcount:
            raise HTTPException(404, "Alumni profile not found.")
    audit(username, "updated", "alumni_profile_photo", alumnus_id, "Updated profile photo")
    return {"id": alumnus_id, "photo_url": profile_image_url(image_value), "updated": True}


@app.get("/api/admin/rsvps")
def admin_rsvps(username: str = Depends(require_admin)):
    """List event reservations for the authenticated administration panel."""
    with engine.connect() as connection:
        rows = connection.execute(text("""SELECT r.id, r.event_id, r.attendee_name, r.enrollment_number,
          r.email, r.guest_count, r.pass_code, r.created_at, e.title AS event_title
          FROM event_rsvps r LEFT JOIN events e ON e.id=r.event_id
          ORDER BY r.created_at DESC, r.id DESC LIMIT 2000""")).mappings().all()
    return [dict(row) for row in rows]


@app.delete("/api/admin/rsvps/{rsvp_id}")
def delete_admin_rsvp(rsvp_id: int, username: str = Depends(require_roles("reviewer"))):
    with engine.begin() as connection:
        result = connection.execute(text("DELETE FROM event_rsvps WHERE id=:id"), {"id": rsvp_id})
        if not result.rowcount:
            raise HTTPException(404, "RSVP not found.")
    audit(username, "cancelled", "event_rsvp", rsvp_id)
    return {"id": rsvp_id, "deleted": True}


@app.post("/api/admin/events", status_code=201)
def create_admin_event(payload: AdminEventRequest, username: str = Depends(require_roles("content_manager"))):
    try:
        scheduled = datetime.fromisoformat(payload.schedule.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(422, "Enter a valid event date and time.")
    with engine.begin() as connection:
        result = connection.execute(text("INSERT INTO events (title, content, schedule, banner) VALUES (:title, :content, :schedule, :banner)"), {
            "title": payload.title.strip(), "content": payload.description.strip(),
            "schedule": scheduled.replace(tzinfo=None).isoformat(sep=" "), "banner": payload.banner.strip(),
        })
    audit(username, "created", "event", result.lastrowid, payload.title)
    return {"id": result.lastrowid, "created": True}


@app.put("/api/admin/events/{event_id}")
def update_admin_event(event_id: int, payload: AdminEventRequest, username: str = Depends(require_roles("content_manager"))):
    try:
        scheduled = datetime.fromisoformat(payload.schedule.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(422, "Enter a valid event date and time.")
    with engine.begin() as connection:
        result = connection.execute(text("UPDATE events SET title=:title, content=:content, schedule=:schedule, banner=:banner WHERE id=:id"), {
            "id": event_id, "title": payload.title.strip(), "content": payload.description.strip(),
            "schedule": scheduled.replace(tzinfo=None).isoformat(sep=" "), "banner": payload.banner.strip(),
        })
        if not result.rowcount:
            raise HTTPException(404, "Event not found.")
    audit(username, "updated", "event", event_id, payload.title)
    return {"id": event_id, "updated": True}


@app.delete("/api/admin/events/{event_id}")
def delete_admin_event(event_id: int, username: str = Depends(require_roles("content_manager"))):
    with engine.begin() as connection:
        count = connection.execute(text("SELECT COUNT(*) FROM event_rsvps WHERE event_id=:id"), {"id": event_id}).scalar_one()
        if count:
            raise HTTPException(409, "This event has RSVP records. Remove those reservations before deleting the event.")
        result = connection.execute(text("DELETE FROM events WHERE id=:id"), {"id": event_id})
        if not result.rowcount:
            raise HTTPException(404, "Event not found.")
    audit(username, "deleted", "event", event_id)
    return {"id": event_id, "deleted": True}


@app.post("/api/admin/gallery", status_code=201)
def create_gallery_item(title: str = Form(...), category: str = Form("Campus Life"),
                        description: str = Form(""), image: UploadFile = File(...),
                        username: str = Depends(require_roles("content_manager"))):
    if len(title.strip()) < 2 or len(title) > 200 or len(category) > 100 or len(description) > 1000:
        raise HTTPException(422, "Check the gallery title, category, and description lengths.")
    filename = persist_upload(image, GALLERY_IMAGE_DIR)
    image_path = f"/media/gallery/{filename}"
    with engine.begin() as connection:
        result = connection.execute(text("INSERT INTO managed_gallery (title, category, description, image_path) VALUES (:title, :category, :description, :image)"), {
            "title": title.strip(), "category": category.strip() or "Campus Life", "description": description.strip(), "image": image_path,
        })
    audit(username, "uploaded", "gallery_item", result.lastrowid, title.strip())
    return {"id": result.lastrowid, "image": image_path, "created": True}


@app.put("/api/admin/gallery/{gallery_id}")
def update_gallery_item(gallery_id: int, payload: GalleryUpdateRequest, username: str = Depends(require_roles("content_manager"))):
    with engine.begin() as connection:
        result = connection.execute(text("UPDATE managed_gallery SET title=:title, category=:category, description=:description, sort_order=:sort, featured=:featured WHERE id=:id"), {
            "id": gallery_id, "title": payload.title.strip(), "category": payload.category.strip() or "Campus Life", "description": payload.description.strip(), "sort": payload.sort_order, "featured": int(payload.featured),
        })
        if not result.rowcount:
            raise HTTPException(404, "Managed gallery item not found.")
    audit(username, "updated", "gallery_item", gallery_id, payload.title)
    return {"id": gallery_id, "updated": True}


@app.delete("/api/admin/gallery/{gallery_id}")
def delete_gallery_item(gallery_id: int, username: str = Depends(require_roles("content_manager"))):
    with engine.begin() as connection:
        row = connection.execute(text("SELECT image_path FROM managed_gallery WHERE id=:id"), {"id": gallery_id}).mappings().first()
        if not row:
            raise HTTPException(404, "Managed gallery item not found.")
        connection.execute(text("DELETE FROM managed_gallery WHERE id=:id"), {"id": gallery_id})
    image_file = (GALLERY_IMAGE_DIR / Path(row["image_path"]).name).resolve()
    if image_file.parent == GALLERY_IMAGE_DIR and image_file.is_file():
        image_file.unlink()
    audit(username, "deleted", "gallery_item", gallery_id)
    return {"id": gallery_id, "deleted": True}


@app.post("/api/admin/departments", status_code=201)
def create_department(payload: AdminCourseRequest, username: str = Depends(require_roles("content_manager"))):
    with engine.begin() as connection:
        result = connection.execute(text("INSERT INTO courses (course, about) VALUES (:course, :about)"), {"course": payload.course.strip(), "about": payload.about.strip()})
    audit(username, "created", "department", result.lastrowid, payload.course)
    return {"id": result.lastrowid, "created": True}


@app.put("/api/admin/departments/{department_id}")
def update_department(department_id: int, payload: AdminCourseRequest, username: str = Depends(require_roles("content_manager"))):
    with engine.begin() as connection:
        result = connection.execute(text("UPDATE courses SET course=:course, about=:about WHERE id=:id"), {"id": department_id, "course": payload.course.strip(), "about": payload.about.strip()})
        if not result.rowcount:
            raise HTTPException(404, "Department not found.")
    audit(username, "updated", "department", department_id, payload.course)
    return {"id": department_id, "updated": True}


@app.delete("/api/admin/departments/{department_id}")
def delete_department(department_id: int, username: str = Depends(require_roles("content_manager"))):
    with engine.begin() as connection:
        count = connection.execute(text("SELECT COUNT(*) FROM alumnus_bio WHERE course_id=:id"), {"id": department_id}).scalar_one()
        if count:
            raise HTTPException(409, "This department is assigned to alumni profiles and cannot be removed.")
        result = connection.execute(text("DELETE FROM courses WHERE id=:id"), {"id": department_id})
        if not result.rowcount:
            raise HTTPException(404, "Department not found.")
    audit(username, "deleted", "department", department_id)
    return {"id": department_id, "deleted": True}


@app.get("/api/admin/accounts")
def list_admin_accounts(username: str = Depends(require_admin)):
    with engine.connect() as connection:
        rows = connection.execute(text("SELECT username, role, created_at FROM api_admins ORDER BY username")).mappings().all()
    return [{**dict(row), "is_current": row["username"] == username} for row in rows]


@app.post("/api/admin/accounts", status_code=201)
def create_admin_account(payload: AdminAccountRequest, username: str = Depends(require_roles("super_admin"))):
    clean_username = payload.username.strip()
    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,100}", clean_username):
        raise HTTPException(422, "Username may contain letters, numbers, dots, underscores, and hyphens.")
    with engine.begin() as connection:
        if connection.execute(text("SELECT 1 FROM api_admins WHERE username=:username"), {"username": clean_username}).first():
            raise HTTPException(409, "That admin username already exists.")
        connection.execute(text("INSERT INTO api_admins (username, password_hash, role) VALUES (:username, :password, :role)"), {"username": clean_username, "password": hash_password(payload.password), "role": payload.role})
    audit(username, "created", "admin_account", clean_username, payload.role)
    return {"username": clean_username, "created": True}


@app.put("/api/admin/accounts/{account_username}/password")
def reset_admin_password(account_username: str, payload: AdminPasswordRequest, username: str = Depends(require_roles("super_admin"))):
    with engine.begin() as connection:
        result = connection.execute(text("UPDATE api_admins SET password_hash=:password WHERE username=:username"), {"username": account_username, "password": hash_password(payload.password)})
        if not result.rowcount:
            raise HTTPException(404, "Admin account not found.")
    audit(username, "reset_password", "admin_account", account_username)
    return {"username": account_username, "password_updated": True}


@app.delete("/api/admin/accounts/{account_username}")
def delete_admin_account(account_username: str, username: str = Depends(require_roles("super_admin"))):
    if account_username == username:
        raise HTTPException(409, "You cannot delete the account currently signed in.")
    with engine.begin() as connection:
        count = connection.execute(text("SELECT COUNT(*) FROM api_admins")).scalar_one()
        if count <= 1:
            raise HTTPException(409, "At least one administrator account must remain.")
        result = connection.execute(text("DELETE FROM api_admins WHERE username=:username"), {"username": account_username})
        if not result.rowcount:
            raise HTTPException(404, "Admin account not found.")
    audit(username, "deleted", "admin_account", account_username)
    return {"username": account_username, "deleted": True}


@app.put("/api/admin/accounts/{account_username}/role")
def change_admin_role(account_username: str, payload: AdminRoleRequest, username: str = Depends(require_roles("super_admin"))):
    if account_username == username and payload.role != "super_admin":
        raise HTTPException(409, "You cannot remove your own super-admin access.")
    with engine.begin() as connection:
        result = connection.execute(text("UPDATE api_admins SET role=:role WHERE username=:username"), {"username": account_username, "role": payload.role})
        if not result.rowcount:
            raise HTTPException(404, "Admin account not found.")
    audit(username, "changed_role", "admin_account", account_username, payload.role)
    return {"username": account_username, "role": payload.role}


@app.get("/api/admin/audit")
def get_admin_audit(limit: int = Query(default=100, ge=1, le=500), username: str = Depends(require_admin)):
    with engine.connect() as connection:
        rows = connection.execute(text("SELECT actor, action, entity_type, entity_id, details, created_at FROM admin_audit_logs ORDER BY id DESC LIMIT :limit"), {"limit": limit}).mappings().all()
    return [dict(row) for row in rows]


def _admin_notification_items(connection) -> list[dict]:
    pending_profiles = connection.execute(text("SELECT COUNT(*) FROM alumnus_bio WHERE status=0")).scalar_one()
    pending_memberships = connection.execute(text("""SELECT COUNT(*) FROM bistaa_submissions s
      LEFT JOIN bistaa_application_reviews r ON r.submission_id=s.id
      LEFT JOIN vista_active_members m ON m.enrollment_number=s.enrollment_number
      WHERE m.id IS NULL AND (r.status IS NULL OR r.status='PENDING_VERIFICATION')""")).scalar_one()
    rsvp_total = connection.execute(text("SELECT COUNT(*) FROM event_rsvps WHERE created_at >= :since"), {"since": datetime.now().date().isoformat()}).scalar_one()
    upcoming_events = connection.execute(text("SELECT COUNT(*) FROM events WHERE schedule >= CURRENT_TIMESTAMP")).scalar_one()
    notices = []
    notices.extend([
        {"id": "profiles", "title": "Alumni profiles need review", "count": int(pending_profiles), "section": "unverified", "tone": "gold"},
        {"id": "memberships", "title": "BISTAA applications need review", "count": int(pending_memberships), "section": "bistaa", "tone": "blue"},
        {"id": "rsvps", "title": "New event RSVPs today", "count": int(rsvp_total), "section": "rsvps", "tone": "teal"},
        {"id": "events", "title": "Upcoming events", "count": int(upcoming_events), "section": "events", "tone": "blue"},
    ])
    return notices


def _unread_admin_notifications(connection, username: str) -> dict:
    notices = _admin_notification_items(connection)
    reads = connection.execute(text("SELECT notification_id, read_count FROM admin_notification_reads WHERE username=:username"), {"username": username}).mappings().all()
    read_counts = {row["notification_id"]: int(row["read_count"]) for row in reads}
    unread = []
    for item in notices:
        current_count = int(item["count"])
        stored_read_count = read_counts.get(item["id"], 0)
        if current_count < stored_read_count:
            connection.execute(text("UPDATE admin_notification_reads SET read_count=:count WHERE username=:username AND notification_id=:id"), {"count": current_count, "username": username, "id": item["id"]})
            stored_read_count = current_count
        unread_count = max(0, current_count - stored_read_count)
        if unread_count:
            unread.append({**item, "count": unread_count})
    return {"count": sum(item["count"] for item in unread), "items": unread}


@app.get("/api/admin/notifications")
def get_admin_notifications(username: str = Depends(require_admin)):
    with engine.begin() as connection:
        return _unread_admin_notifications(connection, username)


@app.post("/api/admin/notifications/{notification_id}/read")
def mark_admin_notification_read(notification_id: str, username: str = Depends(require_admin)):
    with engine.begin() as connection:
        item = next((notice for notice in _admin_notification_items(connection) if notice["id"] == notification_id), None)
        if not item or not item["count"]:
            raise HTTPException(404, "This notification is no longer available.")
        params = {"username": username, "notification_id": notification_id, "read_count": int(item["count"])}
        if engine.dialect.name == "sqlite":
            statement = """INSERT INTO admin_notification_reads (username, notification_id, read_count)
                VALUES (:username, :notification_id, :read_count)
                ON CONFLICT(username, notification_id) DO UPDATE SET read_count=excluded.read_count, read_at=CURRENT_TIMESTAMP"""
        else:
            statement = """INSERT INTO admin_notification_reads (username, notification_id, read_count)
                VALUES (:username, :notification_id, :read_count)
                ON DUPLICATE KEY UPDATE read_count=VALUES(read_count), read_at=CURRENT_TIMESTAMP"""
        connection.execute(text(statement), params)
        return _unread_admin_notifications(connection, username)


@app.get("/api/admin/analytics")
def get_admin_analytics(username: str = Depends(require_admin)):
    with engine.connect() as connection:
        batches = connection.execute(text("SELECT batch, COUNT(*) AS total FROM alumnus_bio WHERE status=1 GROUP BY batch ORDER BY batch DESC LIMIT 20")).mappings().all()
        colleges = connection.execute(text("SELECT college, COUNT(*) AS total FROM alumnus_bio GROUP BY college ORDER BY total DESC LIMIT 10")).mappings().all()
        event_rows = connection.execute(text("""SELECT e.title, COUNT(r.id) AS rsvps FROM events e
          LEFT JOIN event_rsvps r ON r.event_id=e.id GROUP BY e.id, e.title ORDER BY rsvps DESC LIMIT 10""")).mappings().all()
    return {"alumni_by_batch": [dict(row) for row in batches], "profiles_by_college": [dict(row) for row in colleges], "rsvps_by_event": [dict(row) for row in event_rows]}


@app.get("/api/admin/backup")
def download_database_backup(username: str = Depends(require_roles("super_admin"))):
    if engine.dialect.name != "sqlite" or not engine.url.database:
        raise HTTPException(501, "On-demand downloads are available for the local SQLite database only.")
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = BACKUP_DIR / f"alumni-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.sqlite3"
    with sqlite3.connect(engine.url.database) as source, sqlite3.connect(backup_path) as target:
        source.backup(target)
    audit(username, "downloaded_backup", "database", backup_path.name)
    return FileResponse(backup_path, media_type="application/vnd.sqlite3", filename=backup_path.name)


def create_sqlite_snapshot(prefix: str = "alumni-backup") -> Path:
    if engine.dialect.name != "sqlite" or not engine.url.database:
        raise RuntimeError("Scheduled backup requires a file-backed SQLite database.")
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    output = BACKUP_DIR / f"{prefix}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.sqlite3"
    with sqlite3.connect(engine.url.database, timeout=30) as source, sqlite3.connect(output) as target:
        source.backup(target)
    return output


def scheduled_backup_worker() -> None:
    while True:
        try:
            BACKUP_DIR.mkdir(parents=True, exist_ok=True)
            today = datetime.now().strftime("%Y%m%d")
            exists_today = any(BACKUP_DIR.glob(f"scheduled-{today}-*.sqlite3"))
            if not exists_today:
                create_sqlite_snapshot("scheduled")
            scheduled = sorted(BACKUP_DIR.glob("scheduled-*.sqlite3"), key=lambda path: path.stat().st_mtime, reverse=True)
            for old_backup in scheduled[14:]:
                old_backup.unlink(missing_ok=True)
        except Exception:
            # Backup errors must not stop the API; manual download remains available.
            pass
        time.sleep(60 * 60)


@app.get("/api/admin/backups")
def list_database_backups(username: str = Depends(require_roles("super_admin"))):
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(BACKUP_DIR.glob("*.sqlite3"), key=lambda path: path.stat().st_mtime, reverse=True)
    return [{"name": path.name, "size": path.stat().st_size, "modified": datetime.fromtimestamp(path.stat().st_mtime).isoformat()} for path in files[:30]]


@app.get("/api/admin/backups/{filename}")
def download_saved_backup(filename: str, username: str = Depends(require_roles("super_admin"))):
    if not re.fullmatch(r"(?:alumni-backup|scheduled|pre-restore)-[0-9a-fA-F-]+\.sqlite3", filename):
        raise HTTPException(400, "Invalid backup filename.")
    path = (BACKUP_DIR / filename).resolve()
    if path.parent != BACKUP_DIR or not path.is_file():
        raise HTTPException(404, "Backup file not found.")
    return FileResponse(path, media_type="application/vnd.sqlite3", filename=path.name)


@app.post("/api/admin/restore")
def restore_database_backup(file: UploadFile = File(...), username: str = Depends(require_roles("super_admin"))):
    if engine.dialect.name != "sqlite" or not engine.url.database:
        raise HTTPException(501, "Restore is available for the local SQLite database only.")
    raw = file.file.read(100 * 1024 * 1024 + 1)
    if len(raw) > 100 * 1024 * 1024 or not raw:
        raise HTTPException(413, "Choose a valid SQLite backup smaller than 100 MB.")
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    candidate = BACKUP_DIR / f"restore-{uuid.uuid4().hex}.sqlite3"
    candidate.write_bytes(raw)
    try:
        with sqlite3.connect(candidate) as check:
            if check.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise HTTPException(422, "The uploaded database did not pass SQLite integrity validation.")
            names = {row[0] for row in check.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            if not {"alumnus_bio", "courses", "events"}.issubset(names):
                raise HTTPException(422, "This file is not a compatible alumni database backup.")
        current = Path(engine.url.database)
        safety = BACKUP_DIR / f"pre-restore-{datetime.now().strftime('%Y%m%d-%H%M%S')}.sqlite3"
        with sqlite3.connect(current) as source, sqlite3.connect(safety) as target:
            source.backup(target)
        engine.dispose()
        os.replace(candidate, current)
        ensure_backend_tables()
    finally:
        candidate.unlink(missing_ok=True)
    audit(username, "restored_backup", "database", file.filename or "uploaded database")
    return {"restored": True, "safety_backup": safety.name, "message": "Database restored. Reload the admin panel."}


def read_alumni_csv(content: bytes) -> tuple[list[dict[str, str]], dict[str, int]]:
    try:
        text_content = content.decode("utf-8-sig")
        rows = list(csv.DictReader(io.StringIO(text_content)))
    except (UnicodeDecodeError, csv.Error):
        raise HTTPException(422, "Upload a UTF-8 CSV file with a header row.")
    if len(rows) > 10000:
        raise HTTPException(413, "CSV import is limited to 10,000 rows.")
    required = {"firstname", "lastname", "enroll_no", "college", "batch", "course", "email", "phone_no"}
    if not rows or not required.issubset({(key or "").strip().lower() for key in (rows[0].keys() if rows else [])}):
        raise HTTPException(422, "CSV headers required: firstname, lastname, enroll_no, college, batch, course, email, phone_no.")
    normalized = [{(key or "").strip().lower(): (value or "").strip() for key, value in row.items()} for row in rows]
    with engine.connect() as connection:
        existing = connection.execute(text("SELECT UPPER(enroll_no) AS enroll_no, LOWER(email) AS email FROM alumnus_bio")).mappings().all()
        course_names = {str(row["course"]).strip().lower() for row in connection.execute(text("SELECT course FROM courses")).mappings().all()}
    enrollments = {str(row["enroll_no"]).upper() for row in existing}
    emails = {str(row["email"]).lower() for row in existing}
    seen_enrollments: set[str] = set()
    seen_emails: set[str] = set()
    issues: dict[str, int] = {"duplicate_enrollment": 0, "duplicate_email": 0, "invalid_rows": 0, "unknown_course": 0}
    for row in normalized:
        enrollment, email = row.get("enroll_no", "").upper(), row.get("email", "").lower()
        row_issues = []
        if enrollment in enrollments or enrollment in seen_enrollments:
            issues["duplicate_enrollment"] += 1
            row_issues.append("duplicate enrollment")
        if email in emails or email in seen_emails:
            issues["duplicate_email"] += 1
            row_issues.append("duplicate email")
        if row.get("course", "").lower() not in course_names:
            issues["unknown_course"] += 1
            row_issues.append("unknown course")
        try:
            valid = bool(row.get("firstname") and row.get("lastname") and enrollment
                and re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email)
                and 10 <= len(re.sub(r"\D", "", row.get("phone_no", ""))) <= 15
                and 1980 <= int(row.get("batch", "0")) <= 2100)
        except ValueError:
            valid = False
        if not valid:
            issues["invalid_rows"] += 1
            row_issues.append("invalid required fields")
        row["_issues"] = ", ".join(dict.fromkeys(row_issues))
        seen_enrollments.add(enrollment)
        seen_emails.add(email)
    return normalized, issues


@app.post("/api/admin/alumni/import/preview")
def preview_alumni_import(file: UploadFile = File(...), username: str = Depends(require_roles("reviewer"))):
    content = file.file.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(413, "CSV files must be 5 MB or smaller.")
    rows, issues = read_alumni_csv(content)
    return {"total": len(rows), "importable": sum(not row["_issues"] for row in rows), "issues": issues, "preview": rows[:25]}


@app.post("/api/admin/alumni/import")
def commit_alumni_import(file: UploadFile = File(...), username: str = Depends(require_roles("reviewer"))):
    content = file.file.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(413, "CSV files must be 5 MB or smaller.")
    rows, issues = read_alumni_csv(content)
    inserted = 0
    skipped = 0
    with engine.begin() as connection:
        courses = {str(row["course"]).strip().lower(): row["id"] for row in connection.execute(text("SELECT id, course FROM courses")).mappings().all()}
        for row in rows:
            if row.get("_issues"):
                skipped += 1
                continue
            result = connection.execute(text("""INSERT INTO alumnus_bio
              (firstname,native,lastname,enroll_no,gender,college,batch,course_id,phone_no,email,pos,navstate,connected_to,comploc,companyloc,companysector,linkedinid,avatar,status)
              VALUES (:first,'',:last,:enroll,'Unspecified',:college,:batch,:course,:phone,:email,'','','','','','','','',0)"""), {
                "first": row["firstname"], "last": row["lastname"], "enroll": row["enroll_no"].upper(),
                "college": row["college"], "batch": int(row["batch"]), "course": courses[row["course"].lower()],
                "phone": int(re.sub(r"\D", "", row["phone_no"])), "email": row["email"],
            })
            connection.execute(text("INSERT INTO alumni_registration_details (alumnus_id, bio) VALUES (:id, '')"), {"id": result.lastrowid})
            inserted += 1
    audit(username, "csv_import", "alumni_profiles", inserted, f"Imported {inserted}; skipped {skipped} duplicate or invalid rows")
    return {"imported": inserted, "skipped": skipped, "status": "pending_verification"}


@app.post("/api/admin/alumni/{alumnus_id}/verify")
def verify_alumnus(alumnus_id: int, payload: AlumniVerificationRequest, username: str = Depends(require_roles("reviewer"))):
    with engine.begin() as connection:
        result = connection.execute(text("UPDATE alumnus_bio SET status=:status WHERE id=:id"), {"status": 1 if payload.verified else 0, "id": alumnus_id})
        if result.rowcount == 0:
            raise HTTPException(404, "Alumni registration not found.")
    audit(username, "verified" if payload.verified else "returned_to_pending", "alumni_profile", alumnus_id)
    return {"id": alumnus_id, "verified": payload.verified, "verified_by": username}


@app.post("/api/admin/alumni/{alumnus_id}/reject")
def reject_alumnus(alumnus_id: int, username: str = Depends(require_roles("reviewer"))):
    with engine.begin() as connection:
        result = connection.execute(text("UPDATE alumnus_bio SET status=2 WHERE id=:id AND status=0"), {"id": alumnus_id})
        if result.rowcount == 0:
            exists = connection.execute(text("SELECT status FROM alumnus_bio WHERE id=:id"), {"id": alumnus_id}).first()
            if not exists:
                raise HTTPException(404, "Alumni registration not found.")
            raise HTTPException(409, "Only profiles waiting for review can be rejected.")
    audit(username, "rejected", "alumni_profile", alumnus_id)
    return {"id": alumnus_id, "status": "REJECTED"}


@app.delete("/api/admin/alumni/{alumnus_id}")
def delete_alumnus(alumnus_id: int, username: str = Depends(require_roles("reviewer"))):
    with engine.begin() as connection:
        result = connection.execute(text("DELETE FROM alumnus_bio WHERE id=:id"), {"id": alumnus_id})
        if result.rowcount == 0:
            raise HTTPException(404, "Alumni profile not found.")
    audit(username, "deleted", "alumni_profile", alumnus_id)
    return {"id": alumnus_id, "deleted": True}


@app.post("/api/admin/applications/{application_id}/review")
def review_application(application_id: int, payload: ReviewRequest, username: str = Depends(require_roles("reviewer"))):
    with engine.begin() as connection:
        lock_clause = "" if engine.dialect.name == "sqlite" else " FOR UPDATE"
        submission = connection.execute(text(f"SELECT * FROM bistaa_submissions WHERE id=:id{lock_clause}"), {"id": application_id}).mappings().first()
        if not submission:
            raise HTTPException(404, "Application not found.")
        member_id = None
        if payload.status == "ACTIVE":
            active = connection.execute(text("SELECT id, alumni_registration_number FROM vista_active_members WHERE enrollment_number=:enrollment"), {"enrollment": submission["enrollment_number"]}).mappings().first()
            if active:
                member_id = active["alumni_registration_number"] or f"BISTAA-{date.today().year}-{int(active['id']):04d}"
                if not active["alumni_registration_number"]:
                    connection.execute(text("UPDATE vista_active_members SET alumni_registration_number=:member_id WHERE id=:id"), {"member_id": member_id, "id": active["id"]})
            else:
                result = connection.execute(text("INSERT INTO vista_active_members (student_name, enrollment_number, branch, amount, alumni_registration_number) VALUES (:name, :enrollment, :branch, 300.00, '')"), {
                    "name": submission["name"], "enrollment": submission["enrollment_number"], "branch": submission["branch"],
                })
                member_id = f"BISTAA-{date.today().year}-{int(result.lastrowid):04d}"
                connection.execute(text("UPDATE vista_active_members SET alumni_registration_number=:member_id WHERE id=:id"), {"member_id": member_id, "id": result.lastrowid})
        if engine.dialect.name == "sqlite":
            review_sql = """INSERT INTO bistaa_application_reviews
              (submission_id, status, membership_id, rejection_reason, verified_by, reviewed_at)
              VALUES (:id, :status, :member_id, :reason, :verified_by, CURRENT_TIMESTAMP)
              ON CONFLICT(submission_id) DO UPDATE SET status=excluded.status,
              membership_id=excluded.membership_id, rejection_reason=excluded.rejection_reason,
              verified_by=excluded.verified_by, reviewed_at=excluded.reviewed_at"""
        else:
            review_sql = """INSERT INTO bistaa_application_reviews
              (submission_id, status, membership_id, rejection_reason, verified_by, reviewed_at)
              VALUES (:id, :status, :member_id, :reason, :verified_by, CURRENT_TIMESTAMP)
              ON DUPLICATE KEY UPDATE status=VALUES(status), membership_id=VALUES(membership_id),
              rejection_reason=VALUES(rejection_reason), verified_by=VALUES(verified_by), reviewed_at=VALUES(reviewed_at)"""
        connection.execute(text(review_sql), {
            "id": application_id, "status": payload.status, "member_id": member_id,
            "reason": payload.rejection_reason if payload.status == "REJECTED" else None, "verified_by": username,
        })
    audit(username, payload.status.lower(), "bistaa_application", application_id, payload.rejection_reason or "")
    return {"id": str(application_id), "status": payload.status, "membership_id": member_id, "verified_by": username}


@app.get("/api/admin/slips/{application_id}")
def admin_slip(application_id: int, username: str = Depends(require_admin)):
    with engine.connect() as connection:
        row = connection.execute(text("SELECT transaction_slip FROM bistaa_submissions WHERE id=:id"), {"id": application_id}).mappings().first()
    if not row or not row["transaction_slip"]:
        raise HTTPException(404, "Payment slip not found.")
    path = UPLOAD_DIR / Path(row["transaction_slip"]).name
    if not path.is_file():
        raise HTTPException(404, "The payment slip file is unavailable.")
    return FileResponse(path, media_type=mimetypes.guess_type(path.name)[0] or "application/octet-stream")

