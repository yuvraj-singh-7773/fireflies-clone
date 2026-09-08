import uuid
from datetime import datetime, timezone

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=_connect_args)

if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
        del connection_record
        dbapi_connection.execute("PRAGMA foreign_keys=ON")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _ensure_sqlite_columns() -> None:
    """Add newly introduced nullable columns without dropping existing tables."""
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    if "transcript_comments" in tables:
        existing = {col["name"] for col in inspector.get_columns("transcript_comments")}
        if "author_name" not in existing:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE transcript_comments ADD COLUMN author_name VARCHAR"))

    if "users" in tables:
        existing = {col["name"] for col in inspector.get_columns("users")}
        if "password_hash" not in existing:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))

    if engine.dialect.name == "sqlite" and "meetings" in tables:
        owner_column = next((col for col in inspector.get_columns("meetings") if col["name"] == "owner_id"), None)
        if owner_column and owner_column["nullable"]:
            with engine.connect() as conn:
                ownerless_count = conn.execute(text("SELECT COUNT(*) FROM meetings WHERE owner_id IS NULL")).scalar_one()
            if ownerless_count:
                # Legacy ownerless records were already inaccessible through the
                # authorization layer. Preserve them without granting them to
                # an arbitrary real user: quarantine them under a non-loginable
                # migration account before enforcing the NOT NULL constraint.
                legacy_email = "legacy-orphaned-meetings@local.invalid"
                with engine.begin() as conn:
                    legacy_owner_id = conn.execute(
                        text("SELECT id FROM users WHERE email = :email"), {"email": legacy_email}
                    ).scalar_one_or_none()
                    if legacy_owner_id is None:
                        legacy_owner_id = str(uuid.uuid4())
                        now = datetime.now(timezone.utc)
                        conn.execute(
                            text("""
                                INSERT INTO users (id, email, display_name, password_hash, avatar_url, created_at, updated_at)
                                VALUES (:id, :email, :display_name, NULL, NULL, :created_at, :updated_at)
                            """),
                            {
                                "id": legacy_owner_id,
                                "email": legacy_email,
                                "display_name": "Legacy Meeting Archive",
                                "created_at": now,
                                "updated_at": now,
                            },
                        )
                    conn.execute(
                        text("UPDATE meetings SET owner_id = :owner_id WHERE owner_id IS NULL"),
                        {"owner_id": legacy_owner_id},
                    )
            with engine.connect() as conn:
                conn.execute(text("PRAGMA foreign_keys=OFF"))
                conn.commit()
                transaction = conn.begin()
                try:
                    conn.execute(text("CREATE TABLE meetings_new (id VARCHAR(36) NOT NULL PRIMARY KEY, title VARCHAR NOT NULL, date DATETIME NOT NULL, duration_sec INTEGER, audio_url VARCHAR, status VARCHAR(10) NOT NULL, owner_id VARCHAR(36) NOT NULL REFERENCES users(id), created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL)"))
                    conn.execute(text("INSERT INTO meetings_new (id, title, date, duration_sec, audio_url, status, owner_id, created_at, updated_at) SELECT id, title, date, duration_sec, audio_url, status, owner_id, created_at, updated_at FROM meetings"))
                    conn.execute(text("DROP TABLE meetings"))
                    conn.execute(text("ALTER TABLE meetings_new RENAME TO meetings"))
                    conn.execute(text("CREATE INDEX ix_meetings_title ON meetings (title)"))
                    conn.execute(text("CREATE INDEX ix_meetings_owner_id ON meetings (owner_id)"))
                    transaction.commit()
                except Exception:
                    transaction.rollback()
                    raise
                finally:
                    conn.execute(text("PRAGMA foreign_keys=ON"))


def init_db():
    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_columns()
