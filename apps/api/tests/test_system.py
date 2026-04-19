from fastapi.testclient import TestClient
from app.main import app


def test_system_info() -> None:
    client = TestClient(app)
    response = client.get("/system/info")
    assert response.status_code == 200
    data = response.json()
    assert data["app_name"] == "ReliaVue API"
    assert data["environment"] == "local"
