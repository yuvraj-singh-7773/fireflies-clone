
import json
import math
from datetime import datetime
from sqlalchemy.orm import Session
from app.repositories.repositories import (
    MeetingRepository, TagRepository, UserRepository,
    TranscriptRepository, SummaryRepository, ActionItemRepository, ChapterRepository,
    HighlightRepository, CommentRepository,
)
from app.models.models import Participant
from app.schemas.schemas import (
    MeetingCreate, MeetingUpdate, TagCreate, TranscriptSegmentCreate,
    SummaryCreate, ActionItemCreate, ActionItemUpdate, ChapterCreate, ChapterUpdate,
    HighlightCreate, CommentCreate, RegisterRequest, LoginRequest,
)
from app.security import hash_password, verify_password, create_access_token, revoke_access_token
from fastapi import HTTPException

def require_meeting_access(meeting_repo: MeetingRepository, meeting_id: str, user_id: str):
    meeting = meeting_repo.get_by_id(meeting_id)
    if not meeting or meeting.owner_id is None or meeting.owner_id != user_id:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


class AuthService:
    def __init__(self, session: Session):
        self.repo = UserRepository(session)
        self.session = session

    def register(self, data: RegisterRequest):
        email = data.email.strip().lower()
        display_name = data.display_name.strip()
        if not display_name:
            raise HTTPException(status_code=422, detail="Display name is required")
        if len(data.password) < 8:
            raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
        if self.repo.get_by_email(email):
            raise HTTPException(status_code=409, detail="Email already registered")
        user = self.repo.create(
            email=email,
            display_name=display_name,
            password_hash=hash_password(data.password),
        )
        self.session.commit()
        return {
            "access_token": create_access_token(user.id),
            "token_type": "bearer",
            "user": user,
        }

    def login(self, data: LoginRequest):
        email = data.email.strip().lower()
        user = self.repo.get_by_email(email)
        if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return {
            "access_token": create_access_token(user.id),
            "token_type": "bearer",
            "user": user,
        }

    def logout(self, token: str):
        revoke_access_token(self.session, token)


class MeetingService:
    def __init__(self, session: Session):
        self.repo = MeetingRepository(session)
        self.tag_repo = TagRepository(session)
        self.session = session

    def get_meeting(self, meeting_id: str, user_id: str):
        return require_meeting_access(self.repo, meeting_id, user_id)

    def list_meetings(
        self,
        page: int,
        size: int,
        search_title: str = None,
        search_participant: str = None,
        date_from: datetime = None,
        date_to: datetime = None,
        sort: str = "date_desc",
        tag_id: str = None,
        owner_id: str = None,
    ):
        items, total = self.repo.list_meetings(
            page=page, size=size, search_title=search_title,
            search_participant=search_participant, date_from=date_from,
            date_to=date_to, sort=sort, tag_id=tag_id, owner_id=owner_id,
        )
        pages = math.ceil(total / size) if size > 0 else 0
        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages
        }

    def global_search(self, query: str, page: int, size: int, owner_id: str):
        """
        Unified global search across meeting titles and transcript text.
        Returns paginated meeting-title hits and transcript-text hits.
        """
        query = query.strip()
        if not query:
            return {
                "query": query,
                "total": 0,
                "page": page,
                "size": size,
                "pages": 0,
                "meeting_hits": [],
                "transcript_hits": [],
            }

        # Meeting title matches (page 1 of meeting results)
        meeting_items, meeting_total = self.repo.list_meetings(
            page=1, size=20, search_title=query, owner_id=owner_id,
        )

        # Transcript segment text matches (paginated)
        transcript_hits_raw, transcript_total = self.repo.search_transcripts(
            query=query, page=page, size=size, owner_id=owner_id
        )

        total = meeting_total + transcript_total
        pages = math.ceil(transcript_total / size) if size > 0 else 0

        return {
            "query": query,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages,
            "meeting_hits": meeting_items,
            "transcript_hits": transcript_hits_raw,
        }

    def create_meeting(self, data: MeetingCreate, owner_id: str):
        payload = data.model_dump()
        payload["owner_id"] = owner_id
        meeting = self.repo.create(**payload)
        self.session.commit()
        return self.get_meeting(meeting.id, owner_id)

    def update_meeting(self, meeting_id: str, data: MeetingUpdate, user_id: str):
        meeting = self.get_meeting(meeting_id, user_id)
        payload = data.model_dump(exclude_unset=True)
        participants = payload.pop("participants", None)
        self.repo.update(meeting, **payload)
        if participants is not None:
            meeting.participants.clear()
            self.session.flush()
            for participant in participants:
                meeting.participants.append(Participant(**participant))
        self.session.commit()
        return self.get_meeting(meeting.id, user_id)

    def delete_meeting(self, meeting_id: str, user_id: str):
        meeting = self.get_meeting(meeting_id, user_id)
        self.repo.delete(meeting)
        self.session.commit()

    def add_tag(self, meeting_id: str, tag_id: str, user_id: str):
        meeting = self.get_meeting(meeting_id, user_id)
        tag = self.tag_repo.get_by_id(tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        if tag not in meeting.tags:
            meeting.tags.append(tag)
            self.session.commit()
        return meeting

    def remove_tag(self, meeting_id: str, tag_id: str, user_id: str):
        meeting = self.get_meeting(meeting_id, user_id)
        tag = self.tag_repo.get_by_id(tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        if tag in meeting.tags:
            meeting.tags.remove(tag)
            self.session.commit()
        return meeting

class TranscriptService:
    def __init__(self, session: Session):
        self.repo = TranscriptRepository(session)
        self.meeting_repo = MeetingRepository(session)
        self.session = session
    
    def get_by_meeting(self, meeting_id: str, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        return self.repo.get_by_meeting(meeting_id)
        
    def add_segment(self, meeting_id: str, data: TranscriptSegmentCreate, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        ts = self.repo.create_segment(meeting_id=meeting_id, **data.model_dump())
        self.session.commit()
        return ts

class SummaryService:
    def __init__(self, session: Session):
        self.repo = SummaryRepository(session)
        self.meeting_repo = MeetingRepository(session)
        self.session = session

    def get(self, meeting_id: str, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        return self.repo.get_by_meeting(meeting_id)
        
    def create(self, meeting_id: str, data: SummaryCreate, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        dump = data.model_dump()
        dump["key_topics"] = json.dumps(dump["key_topics"])
        s = self.repo.create(meeting_id=meeting_id, **dump)
        self.session.commit()
        return s

class ActionItemService:
    def __init__(self, session: Session):
        self.repo = ActionItemRepository(session)
        self.meeting_repo = MeetingRepository(session)
        self.session = session

    def get_by_meeting(self, meeting_id: str, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        return self.repo.get_by_meeting(meeting_id)
        
    def create(self, meeting_id: str, data: ActionItemCreate, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        ai = self.repo.create(meeting_id=meeting_id, **data.model_dump())
        self.session.commit()
        return ai
        
    def update(self, meeting_id: str, ai_id: str, data: ActionItemUpdate, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        ai = self.repo.get_by_id(ai_id)
        if not ai or ai.meeting_id != meeting_id:
            raise HTTPException(status_code=404, detail="Action Item not found")
        self.repo.update(ai, **data.model_dump(exclude_unset=True))
        self.session.commit()
        return ai
        
    def delete(self, meeting_id: str, ai_id: str, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        ai = self.repo.get_by_id(ai_id)
        if not ai or ai.meeting_id != meeting_id:
            raise HTTPException(status_code=404, detail="Action Item not found")
        self.repo.delete(ai)
        self.session.commit()

class ChapterService:
    def __init__(self, session: Session):
        self.repo = ChapterRepository(session)
        self.meeting_repo = MeetingRepository(session)
        self.session = session
        
    def get_by_meeting(self, meeting_id: str, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        return self.repo.get_by_meeting(meeting_id)

    def create(self, meeting_id: str, data: ChapterCreate, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        c = self.repo.create(meeting_id=meeting_id, **data.model_dump())
        self.session.commit()
        return c
        
    def update(self, meeting_id: str, cid: str, data: ChapterUpdate, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)
        c = self.repo.get_by_id(cid)
        if not c or c.meeting_id != meeting_id:
            raise HTTPException(status_code=404, detail="Chapter not found")
        self.repo.update(c, **data.model_dump(exclude_unset=True))
        self.session.commit()
        return c

class TagService:
    def __init__(self, session: Session):
        self.repo = TagRepository(session)
        self.session = session

    def list_tags(self):
        return self.repo.get_all()

    def create(self, data: TagCreate):
        t = self.repo.create(**data.model_dump())
        self.session.commit()
        return t


class HighlightService:
    def __init__(self, session: Session):
        self.repo = HighlightRepository(session)
        self.meeting_repo = MeetingRepository(session)
        self.transcript_repo = TranscriptRepository(session)
        self.session = session

    def _validate_meeting(self, meeting_id: str, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)

    def _validate_segment(self, meeting_id: str, segment_id: str):
        seg = self.transcript_repo.get_by_id(segment_id)
        if not seg or seg.meeting_id != meeting_id:
            raise HTTPException(status_code=404, detail="Transcript segment not found in this meeting")
        return seg

    def get_by_meeting(self, meeting_id: str, user_id: str):
        self._validate_meeting(meeting_id, user_id)
        return self.repo.get_by_meeting(meeting_id)

    def create(self, meeting_id: str, data: HighlightCreate, user_id: str):
        self._validate_meeting(meeting_id, user_id)
        self._validate_segment(meeting_id, data.segment_id)

        # Idempotent: if already highlighted, return existing
        existing = self.repo.get_by_segment(meeting_id, data.segment_id)
        if existing:
            return existing

        h = self.repo.create(meeting_id=meeting_id, segment_id=data.segment_id)
        self.session.commit()
        return h

    def delete(self, meeting_id: str, highlight_id: str, user_id: str):
        self._validate_meeting(meeting_id, user_id)
        h = self.repo.get_by_id(highlight_id)
        if not h or h.meeting_id != meeting_id:
            raise HTTPException(status_code=404, detail="Highlight not found")
        self.repo.delete(h)
        self.session.commit()


class CommentService:
    def __init__(self, session: Session):
        self.repo = CommentRepository(session)
        self.meeting_repo = MeetingRepository(session)
        self.transcript_repo = TranscriptRepository(session)
        self.session = session

    def _validate_meeting(self, meeting_id: str, user_id: str):
        require_meeting_access(self.meeting_repo, meeting_id, user_id)

    def _validate_segment(self, meeting_id: str, segment_id: str):
        seg = self.transcript_repo.get_by_id(segment_id)
        if not seg or seg.meeting_id != meeting_id:
            raise HTTPException(status_code=404, detail="Transcript segment not found in this meeting")
        return seg

    def get_by_meeting(self, meeting_id: str, user_id: str):
        self._validate_meeting(meeting_id, user_id)
        return self.repo.get_by_meeting(meeting_id)

    def create(self, meeting_id: str, data: CommentCreate, user_id: str, default_author: str | None = None):
        self._validate_meeting(meeting_id, user_id)
        self._validate_segment(meeting_id, data.segment_id)
        text = data.text.strip()
        if not text:
            raise HTTPException(status_code=422, detail="Comment text cannot be empty")
        author_name = (data.author_name or "").strip() or (default_author or "").strip() or None
        c = self.repo.create(
            meeting_id=meeting_id,
            segment_id=data.segment_id,
            text=text,
            author_name=author_name,
        )
        self.session.commit()
        return c

    def delete(self, meeting_id: str, comment_id: str, user_id: str):
        self._validate_meeting(meeting_id, user_id)
        c = self.repo.get_by_id(comment_id)
        if not c or c.meeting_id != meeting_id:
            raise HTTPException(status_code=404, detail="Comment not found")
        self.repo.delete(c)
        self.session.commit()
