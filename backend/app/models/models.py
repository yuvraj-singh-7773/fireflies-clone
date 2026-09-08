
import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, ForeignKey, Table, Column, Boolean, DateTime, Enum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)

meeting_tag = Table(
    "meeting_tag",
    Base.metadata,
    Column("meeting_id", String(36), ForeignKey("meetings.id"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id"), primary_key=True),
)

class MeetingStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    done = "done"

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
    
    meetings: Mapped[List["Meeting"]] = relationship("Meeting", back_populates="owner")
    revoked_tokens: Mapped[List["RevokedToken"]] = relationship("RevokedToken", back_populates="user", cascade="all, delete-orphan")


class RevokedToken(Base):
    """Persisted JWT revocations, removed opportunistically after expiry."""
    __tablename__ = "revoked_tokens"
    jti: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    revoked_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="revoked_tokens")

class Meeting(Base):
    __tablename__ = "meetings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String, index=True)
    date: Mapped[datetime] = mapped_column(DateTime)
    duration_sec: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    audio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[MeetingStatus] = mapped_column(Enum(MeetingStatus), default=MeetingStatus.done)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    owner: Mapped[Optional["User"]] = relationship("User", back_populates="meetings")
    participants: Mapped[List["Participant"]] = relationship("Participant", back_populates="meeting", cascade="all, delete-orphan")
    transcript: Mapped[List["TranscriptSegment"]] = relationship("TranscriptSegment", back_populates="meeting", cascade="all, delete-orphan")
    summary: Mapped[Optional["Summary"]] = relationship("Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    action_items: Mapped[List["ActionItem"]] = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    chapters: Mapped[List["Chapter"]] = relationship("Chapter", back_populates="meeting", cascade="all, delete-orphan")
    tags: Mapped[List["Tag"]] = relationship("Tag", secondary=meeting_tag, back_populates="meetings")
    highlights: Mapped[List["TranscriptHighlight"]] = relationship("TranscriptHighlight", back_populates="meeting", cascade="all, delete-orphan")
    comments: Mapped[List["TranscriptComment"]] = relationship("TranscriptComment", back_populates="meeting", cascade="all, delete-orphan")

class Participant(Base):
    __tablename__ = "participants"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id"))
    name: Mapped[str] = mapped_column(String)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    speaker_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="participants")
    segments: Mapped[List["TranscriptSegment"]] = relationship("TranscriptSegment", back_populates="participant")

class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id"))
    participant_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("participants.id"), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    start_ms: Mapped[int] = mapped_column(Integer)
    end_ms: Mapped[int] = mapped_column(Integer)
    sequence: Mapped[int] = mapped_column(Integer)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="transcript")
    participant: Mapped[Optional["Participant"]] = relationship("Participant", back_populates="segments")
    highlights: Mapped[List["TranscriptHighlight"]] = relationship("TranscriptHighlight", back_populates="segment", cascade="all, delete-orphan")
    comments: Mapped[List["TranscriptComment"]] = relationship("TranscriptComment", back_populates="segment", cascade="all, delete-orphan")

class Summary(Base):
    __tablename__ = "summaries"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id"), unique=True)
    overview: Mapped[str] = mapped_column(Text)
    key_topics: Mapped[str] = mapped_column(Text) # storing JSON as string for SQLite simplicity
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="summary")

class ActionItem(Base):
    __tablename__ = "action_items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id"))
    assignee: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    task: Mapped[str] = mapped_column(Text)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="action_items")

class Chapter(Base):
    __tablename__ = "chapters"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id"))
    title: Mapped[str] = mapped_column(String)
    start_ms: Mapped[int] = mapped_column(Integer)
    end_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sequence: Mapped[int] = mapped_column(Integer)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="chapters")

class Tag(Base):
    __tablename__ = "tags"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    color: Mapped[str] = mapped_column(String)

    meetings: Mapped[List["Meeting"]] = relationship("Meeting", secondary=meeting_tag, back_populates="tags")


class TranscriptHighlight(Base):
    """Marks a transcript segment as highlighted by the user. Persisted in SQLite."""
    __tablename__ = "transcript_highlights"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id"), nullable=False)
    segment_id: Mapped[str] = mapped_column(String(36), ForeignKey("transcript_segments.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="highlights")
    segment: Mapped["TranscriptSegment"] = relationship("TranscriptSegment", back_populates="highlights")

    __table_args__ = (
        # Unique: one highlight per segment per meeting
        Index("ix_highlight_meeting_segment", "meeting_id", "segment_id", unique=True),
    )


class TranscriptComment(Base):
    """A user comment attached to a specific transcript segment. Persisted in SQLite."""
    __tablename__ = "transcript_comments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id"), nullable=False)
    segment_id: Mapped[str] = mapped_column(String(36), ForeignKey("transcript_segments.id"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    author_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="comments")
    segment: Mapped["TranscriptSegment"] = relationship("TranscriptSegment", back_populates="comments")

    __table_args__ = (
        Index("ix_comment_meeting_id", "meeting_id"),
        Index("ix_comment_segment_id", "segment_id"),
    )
