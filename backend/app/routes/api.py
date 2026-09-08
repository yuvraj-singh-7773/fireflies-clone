from fastapi import APIRouter, Depends, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.models import User
from app.security import _bearer, get_current_user
from app.schemas.schemas import (
    MeetingOut, MeetingDetailOut, MeetingCreate, MeetingUpdate, MeetingListResponse,
    TranscriptSegmentOut, TranscriptSegmentCreate, SummaryOut, SummaryCreate,
    ActionItemOut, ActionItemCreate, ActionItemUpdate, ChapterOut, ChapterCreate, ChapterUpdate,
    TagOut, TagCreate,
    HighlightOut, HighlightCreate,
    CommentOut, CommentCreate,
    GlobalSearchResponse,
    RegisterRequest, LoginRequest, AuthTokenResponse, UserOut,
)
from app.services.services import (
    MeetingService, TranscriptService, SummaryService, ActionItemService, ChapterService, TagService,
    HighlightService, CommentService, AuthService,
)

api_router = APIRouter()

# --- AUTH ---
@api_router.post("/auth/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    return AuthService(db).register(data)

@api_router.post("/auth/login", response_model=AuthTokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).login(data)

@api_router.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user

@api_router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(credentials: HTTPAuthorizationCredentials = Depends(_bearer), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    AuthService(db).logout(credentials.credentials)

# --- MEETINGS ---
@api_router.get("/meetings", response_model=MeetingListResponse)
def list_meetings(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    q: Optional[str] = Query(None, description="Title search"),
    participant: Optional[str] = Query(None, description="Participant search"),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    sort: str = Query("date_desc", pattern="^(date_desc|date_asc|title_asc)$"),
    tag_id: Optional[str] = Query(None, description="Filter by tag ID"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = MeetingService(db)
    return service.list_meetings(page, size, q, participant, date_from, date_to, sort, tag_id, user.id)

@api_router.post("/meetings", response_model=MeetingDetailOut, status_code=status.HTTP_201_CREATED)
def create_meeting(data: MeetingCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return MeetingService(db).create_meeting(data, user.id)

@api_router.get("/meetings/{id}", response_model=MeetingDetailOut)
def get_meeting(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return MeetingService(db).get_meeting(id, user.id)

@api_router.put("/meetings/{id}", response_model=MeetingDetailOut)
def update_meeting(id: str, data: MeetingUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return MeetingService(db).update_meeting(id, data, user.id)

@api_router.delete("/meetings/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    MeetingService(db).delete_meeting(id, user.id)

# --- GLOBAL SEARCH ---
@api_router.get("/search", response_model=GlobalSearchResponse)
def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return MeetingService(db).global_search(q, page, size, user.id)

# --- TAGS ---
@api_router.get("/tags", response_model=List[TagOut])
def list_tags(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return TagService(db).list_tags()

@api_router.post("/tags", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(data: TagCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return TagService(db).create(data)

@api_router.post("/meetings/{id}/tags", response_model=MeetingDetailOut)
def add_tag_to_meeting(id: str, tag_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return MeetingService(db).add_tag(id, tag_id, user.id)

@api_router.delete("/meetings/{id}/tags/{tag_id}", response_model=MeetingDetailOut)
def remove_tag_from_meeting(id: str, tag_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return MeetingService(db).remove_tag(id, tag_id, user.id)

# --- TRANSCRIPTS ---
@api_router.get("/meetings/{id}/transcript", response_model=List[TranscriptSegmentOut])
def get_transcript(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return TranscriptService(db).get_by_meeting(id, user.id)

@api_router.post("/meetings/{id}/transcript", response_model=TranscriptSegmentOut, status_code=status.HTTP_201_CREATED)
def create_transcript_segment(id: str, data: TranscriptSegmentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return TranscriptService(db).add_segment(id, data, user.id)

# --- SUMMARY ---
@api_router.get("/meetings/{id}/summary", response_model=Optional[SummaryOut])
def get_summary(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return SummaryService(db).get(id, user.id)

@api_router.post("/meetings/{id}/summary", response_model=SummaryOut, status_code=status.HTTP_201_CREATED)
def create_summary(id: str, data: SummaryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return SummaryService(db).create(id, data, user.id)

# --- ACTION ITEMS ---
@api_router.get("/meetings/{id}/action-items", response_model=List[ActionItemOut])
def list_action_items(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return ActionItemService(db).get_by_meeting(id, user.id)

@api_router.post("/meetings/{id}/action-items", response_model=ActionItemOut, status_code=status.HTTP_201_CREATED)
def create_action_item(id: str, data: ActionItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return ActionItemService(db).create(id, data, user.id)

@api_router.put("/meetings/{id}/action-items/{aid}", response_model=ActionItemOut)
def update_action_item(id: str, aid: str, data: ActionItemUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return ActionItemService(db).update(id, aid, data, user.id)

@api_router.delete("/meetings/{id}/action-items/{aid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action_item(id: str, aid: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ActionItemService(db).delete(id, aid, user.id)

# --- CHAPTERS ---
@api_router.get("/meetings/{id}/chapters", response_model=List[ChapterOut])
def get_chapters(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return ChapterService(db).get_by_meeting(id, user.id)

@api_router.post("/meetings/{id}/chapters", response_model=ChapterOut, status_code=status.HTTP_201_CREATED)
def create_chapter(id: str, data: ChapterCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return ChapterService(db).create(id, data, user.id)

@api_router.put("/meetings/{id}/chapters/{cid}", response_model=ChapterOut)
def update_chapter(id: str, cid: str, data: ChapterUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return ChapterService(db).update(id, cid, data, user.id)

# --- HIGHLIGHTS ---
@api_router.get("/meetings/{id}/highlights", response_model=List[HighlightOut])
def list_highlights(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return HighlightService(db).get_by_meeting(id, user.id)

@api_router.post("/meetings/{id}/highlights", response_model=HighlightOut, status_code=status.HTTP_201_CREATED)
def create_highlight(id: str, data: HighlightCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return HighlightService(db).create(id, data, user.id)

@api_router.delete("/meetings/{id}/highlights/{hid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_highlight(id: str, hid: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    HighlightService(db).delete(id, hid, user.id)

# --- COMMENTS ---
@api_router.get("/meetings/{id}/comments", response_model=List[CommentOut])
def list_comments(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return CommentService(db).get_by_meeting(id, user.id)

@api_router.post("/meetings/{id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(id: str, data: CommentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return CommentService(db).create(id, data, user.id, default_author=user.display_name)

@api_router.delete("/meetings/{id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(id: str, comment_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    CommentService(db).delete(id, comment_id, user.id)
