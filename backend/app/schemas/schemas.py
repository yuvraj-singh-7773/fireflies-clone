from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional, Any
from datetime import datetime
from app.models.models import MeetingStatus
import json

class TagBase(BaseModel):
    name: str
    color: str
class TagCreate(TagBase): pass
class TagOut(TagBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class ParticipantBase(BaseModel):
    name: str
    email: Optional[str] = None
    speaker_id: Optional[str] = None
class ParticipantCreate(ParticipantBase): pass
class ParticipantOut(ParticipantBase):
    id: str
    meeting_id: str
    model_config = ConfigDict(from_attributes=True)

class TranscriptSegmentBase(BaseModel):
    text: str
    start_ms: int
    end_ms: int
    sequence: int
    participant_id: Optional[str] = None
class TranscriptSegmentCreate(TranscriptSegmentBase): pass
class TranscriptSegmentOut(TranscriptSegmentBase):
    id: str
    meeting_id: str
    model_config = ConfigDict(from_attributes=True)

class SummaryBase(BaseModel):
    overview: str
    key_topics: List[str]
class SummaryCreate(SummaryBase): pass
class SummaryOut(SummaryBase):
    id: str
    meeting_id: str
    created_at: datetime
    
    @field_validator('key_topics', mode='before')
    @classmethod
    def parse_key_topics(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v
        
    model_config = ConfigDict(from_attributes=True)

class ActionItemBase(BaseModel):
    task: str
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: bool = False
class ActionItemCreate(ActionItemBase): pass
class ActionItemUpdate(BaseModel):
    task: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
class ActionItemOut(ActionItemBase):
    id: str
    meeting_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ChapterBase(BaseModel):
    title: str
    start_ms: int
    end_ms: Optional[int] = None
    sequence: int
class ChapterCreate(ChapterBase): pass
class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    start_ms: Optional[int] = None
    end_ms: Optional[int] = None
    sequence: Optional[int] = None
class ChapterOut(ChapterBase):
    id: str
    meeting_id: str
    model_config = ConfigDict(from_attributes=True)

class MeetingBase(BaseModel):
    title: str
    date: datetime
    duration_sec: Optional[int] = None
    audio_url: Optional[str] = None
    status: MeetingStatus = MeetingStatus.done
    owner_id: Optional[str] = None

class MeetingCreate(BaseModel):
    title: str
    date: datetime
    duration_sec: Optional[int] = None
    audio_url: Optional[str] = None
    status: MeetingStatus = MeetingStatus.done

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    duration_sec: Optional[int] = None
    audio_url: Optional[str] = None
    status: Optional[MeetingStatus] = None
    participants: Optional[List[ParticipantCreate]] = None

class MeetingOut(MeetingBase):
    id: str
    created_at: datetime
    updated_at: datetime
    participants: List[ParticipantOut] = []
    tags: List[TagOut] = []
    model_config = ConfigDict(from_attributes=True)

class MeetingDetailOut(MeetingOut):
    transcript: List[TranscriptSegmentOut] = []
    summary: Optional[SummaryOut] = None
    action_items: List[ActionItemOut] = []
    chapters: List[ChapterOut] = []

class MeetingListResponse(BaseModel):
    items: List[MeetingOut]
    total: int
    page: int
    size: int
    pages: int

# --- HIGHLIGHT SCHEMAS ---
class HighlightCreate(BaseModel):
    segment_id: str

class HighlightOut(BaseModel):
    id: str
    meeting_id: str
    segment_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- COMMENT SCHEMAS ---
class CommentCreate(BaseModel):
    segment_id: str
    text: str
    author_name: Optional[str] = None

class CommentOut(BaseModel):
    id: str
    meeting_id: str
    segment_id: str
    text: str
    author_name: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- GLOBAL SEARCH SCHEMAS ---
class TranscriptSearchHit(BaseModel):
    meeting_id: str
    meeting_title: str
    meeting_date: datetime
    segment_id: str
    start_ms: int
    snippet: str
    participant_name: Optional[str] = None

class GlobalSearchResponse(BaseModel):
    query: str
    total: int
    page: int
    size: int
    pages: int
    meeting_hits: List[MeetingOut]       # meetings whose title matched
    transcript_hits: List[TranscriptSearchHit]  # transcript segments that matched


class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
