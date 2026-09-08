import os
import tempfile
import uuid
from httpx import AsyncClient

# Keep the suite isolated from a developer's SQLite file and make tests
# repeatable without modifying real local data.
TEST_DATABASE = os.path.join(tempfile.gettempdir(), f"firefiles-tests-{uuid.uuid4().hex}.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE.replace(os.sep, '/')}"
os.environ.setdefault("CORS_ORIGINS", '["http://testserver"]')
os.environ["JWT_SECRET"] = "test-only-secret-with-at-least-thirty-two-characters"

import app.models  # noqa: F401 — register SQLAlchemy models on Base
from app.database import init_db

init_db()


async def auth_headers(ac: AsyncClient) -> dict[str, str]:
    email = f"user-{uuid.uuid4().hex[:12]}@example.com"
    response = await ac.post(
        "/api/auth/register",
        json={"email": email, "password": "testpass123", "display_name": "Test User"},
    )
    assert response.status_code == 201, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
