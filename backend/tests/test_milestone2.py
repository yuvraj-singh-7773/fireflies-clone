import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from tests.conftest import auth_headers
from sqlalchemy.exc import IntegrityError
from app.database import SessionLocal
from app.models.models import Meeting
from datetime import datetime, timezone

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
        if response.status_code == 404:
            # maybe it's just /health
            response = await ac.get("/health")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_meetings_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        response = await ac.get("/api/meetings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

@pytest.mark.asyncio
async def test_create_meeting():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        payload = {
            "title": "Test Meeting",
            "date": "2023-10-10T10:00:00Z",
            "duration_sec": 3600
        }
        response = await ac.post("/api/meetings", json=payload, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Meeting"
        meeting_id = data["id"]

        # Get meeting
        resp_get = await ac.get(f"/api/meetings/{meeting_id}", headers=headers)
        assert resp_get.status_code == 200

@pytest.mark.asyncio
async def test_create_tag():
    import uuid
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        payload = {"name": f"Test Tag {uuid.uuid4()}", "color": "#000000"}
        response = await ac.post("/api/tags", json=payload, headers=headers)
        assert response.status_code == 201


@pytest.mark.asyncio
async def test_meeting_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        resp = await ac.get("/api/meetings/nonexistent-id", headers=headers)
        assert resp.status_code == 404

@pytest.mark.asyncio
async def test_update_delete_meeting():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        # Create
        resp = await ac.post("/api/meetings", json={"title": "To Update", "date": "2023-10-10T10:00:00Z"}, headers=headers)
        m_id = resp.json()["id"]
        # Update
        resp = await ac.put(f"/api/meetings/{m_id}", json={"title": "Updated Title"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"
        resp = await ac.put(f"/api/meetings/{m_id}", json={"participants": [{"name": "Edited Participant"}]}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["participants"][0]["name"] == "Edited Participant"
        # Delete
        resp = await ac.delete(f"/api/meetings/{m_id}", headers=headers)
        assert resp.status_code == 204
        # Verify 404
        resp = await ac.get(f"/api/meetings/{m_id}", headers=headers)
        assert resp.status_code == 404

@pytest.mark.asyncio
async def test_transcript():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        resp = await ac.post("/api/meetings", json={"title": "Transcript Test", "date": "2023-10-10T10:00:00Z"}, headers=headers)
        m_id = resp.json()["id"]
        
        # Add segment
        seg = {"text": "Hello world", "start_ms": 0, "end_ms": 1000, "sequence": 0}
        resp = await ac.post(f"/api/meetings/{m_id}/transcript", json=seg, headers=headers)
        assert resp.status_code == 201
        
        # Get
        resp = await ac.get(f"/api/meetings/{m_id}/transcript", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

@pytest.mark.asyncio
async def test_summary():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        resp = await ac.post("/api/meetings", json={"title": "Sum Test", "date": "2023-10-10T10:00:00Z"}, headers=headers)
        m_id = resp.json()["id"]
        
        sum_data = {"overview": "Great meeting", "key_topics": ["topic1"]}
        resp = await ac.post(f"/api/meetings/{m_id}/summary", json=sum_data, headers=headers)
        assert resp.status_code == 201

@pytest.mark.asyncio
async def test_action_item():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        resp = await ac.post("/api/meetings", json={"title": "AI Test", "date": "2023-10-10T10:00:00Z"}, headers=headers)
        m_id = resp.json()["id"]
        
        ai_data = {"task": "Do this"}
        resp = await ac.post(f"/api/meetings/{m_id}/action-items", json=ai_data, headers=headers)
        assert resp.status_code == 201
        ai_id = resp.json()["id"]
        
        resp = await ac.put(f"/api/meetings/{m_id}/action-items/{ai_id}", json={"completed": True}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["completed"] is True
        
        resp = await ac.delete(f"/api/meetings/{m_id}/action-items/{ai_id}", headers=headers)
        assert resp.status_code == 204

@pytest.mark.asyncio
async def test_chapters():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        resp = await ac.post("/api/meetings", json={"title": "Chapter Test", "date": "2023-10-10T10:00:00Z"}, headers=headers)
        m_id = resp.json()["id"]
        
        ch_data = {"title": "Intro", "start_ms": 0, "sequence": 0}
        resp = await ac.post(f"/api/meetings/{m_id}/chapters", json=ch_data, headers=headers)
        assert resp.status_code == 201
        ch_id = resp.json()["id"]
        
        resp = await ac.put(f"/api/meetings/{m_id}/chapters/{ch_id}", json={"title": "Introduction"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Introduction"

        resp = await ac.get(f"/api/meetings/{m_id}/chapters", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1

@pytest.mark.asyncio
async def test_validation_error():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        resp = await ac.post("/api/meetings", json={"title": "No Date"}, headers=headers) # missing date
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_authentication_and_meeting_ownership():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        owner_headers = await auth_headers(ac)
        created = await ac.post(
            "/api/meetings",
            json={"title": "Private Meeting", "date": "2023-10-10T10:00:00Z"},
            headers=owner_headers,
        )
        assert created.status_code == 201
        meeting_id = created.json()["id"]

        assert (await ac.get(f"/api/meetings/{meeting_id}")).status_code == 401
        other_headers = await auth_headers(ac)
        assert (await ac.get(f"/api/meetings/{meeting_id}", headers=other_headers)).status_code == 404
        assert (await ac.get("/api/auth/me", headers=owner_headers)).status_code == 200
        assert (await ac.get("/api/auth/me", headers={"Authorization": "Bearer invalid"})).status_code == 401

        segment = await ac.post(
            f"/api/meetings/{meeting_id}/transcript",
            json={"text": "Private transcript", "start_ms": 0, "end_ms": 1000, "sequence": 0},
            headers=owner_headers,
        )
        assert segment.status_code == 201
        segment_id = segment.json()["id"]
        assert (await ac.post(
            f"/api/meetings/{meeting_id}/chapters",
            json={"title": "Private chapter", "start_ms": 0, "sequence": 0},
            headers=owner_headers,
        )).status_code == 201
        assert (await ac.post(
            f"/api/meetings/{meeting_id}/summary",
            json={"overview": "Private summary", "key_topics": []},
            headers=owner_headers,
        )).status_code == 201
        assert (await ac.post(
            f"/api/meetings/{meeting_id}/action-items",
            json={"task": "Private action"},
            headers=owner_headers,
        )).status_code == 201
        assert (await ac.post(
            f"/api/meetings/{meeting_id}/comments",
            json={"segment_id": segment_id, "text": "Private comment"},
            headers=owner_headers,
        )).status_code == 201
        assert (await ac.post(
            f"/api/meetings/{meeting_id}/highlights",
            json={"segment_id": segment_id},
            headers=owner_headers,
        )).status_code == 201

        for path in (
            f"/api/meetings/{meeting_id}/transcript",
            f"/api/meetings/{meeting_id}/chapters",
            f"/api/meetings/{meeting_id}/summary",
            f"/api/meetings/{meeting_id}/action-items",
            f"/api/meetings/{meeting_id}/comments",
            f"/api/meetings/{meeting_id}/highlights",
        ):
            assert (await ac.get(path, headers=other_headers)).status_code == 404


@pytest.mark.asyncio
async def test_logout_revokes_only_current_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        first_headers = await auth_headers(ac)
        second_headers = await auth_headers(ac)
        assert (await ac.get("/api/meetings", headers=first_headers)).status_code == 200
        assert (await ac.post("/api/auth/logout", headers=first_headers)).status_code == 204
        assert (await ac.get("/api/meetings", headers=first_headers)).status_code == 401
        assert (await ac.get("/api/meetings", headers=second_headers)).status_code == 200
        assert (await ac.get("/api/meetings", headers={"Authorization": "Bearer invalid"})).status_code == 401


def test_ownerless_meeting_is_rejected_by_database():
    db = SessionLocal()
    try:
        db.add(Meeting(title="Ownerless", date=datetime.now(timezone.utc), owner_id=None))
        with pytest.raises(IntegrityError):
            db.commit()
    finally:
        db.rollback()
        db.close()


@pytest.mark.asyncio
async def test_highlight_persistence_and_deletion():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await auth_headers(ac)
        meeting = await ac.post("/api/meetings", json={"title": "Highlight Test", "date": "2023-10-10T10:00:00Z"}, headers=headers)
        meeting_id = meeting.json()["id"]
        segment = await ac.post(f"/api/meetings/{meeting_id}/transcript", json={"text": "Highlight this", "start_ms": 0, "end_ms": 1000, "sequence": 0}, headers=headers)
        highlight = await ac.post(f"/api/meetings/{meeting_id}/highlights", json={"segment_id": segment.json()["id"]}, headers=headers)
        assert highlight.status_code == 201
        assert len((await ac.get(f"/api/meetings/{meeting_id}/highlights", headers=headers)).json()) == 1
        assert (await ac.delete(f"/api/meetings/{meeting_id}/highlights/{highlight.json()['id']}", headers=headers)).status_code == 204
