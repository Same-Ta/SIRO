import requests
import json

# 스페이스 생성 테스트
print("=== 스페이스 생성 테스트 ===")
space_response = requests.post(
    "http://localhost:8000/api/spaces",
    headers={"Content-Type": "application/json", "x-user-id": "test_user"},
    json={
        "name": "테스트 스페이스",
        "description": "첫 번째 스페이스",
        "color": "#FF6B6B",
        "icon": "🚀"
    }
)
print(f"Status: {space_response.status_code}")
print(f"Response: {json.dumps(space_response.json(), indent=2, ensure_ascii=False)}")
print()

# 생성된 스페이스 ID 저장
space_id = space_response.json().get('space_id')

# 스페이스 목록 조회
print("=== 스페이스 목록 조회 ===")
spaces_response = requests.get(
    "http://localhost:8000/api/spaces",
    headers={"x-user-id": "test_user"}
)
print(f"Status: {spaces_response.status_code}")
print(f"Response: {json.dumps(spaces_response.json(), indent=2, ensure_ascii=False)}")
print()

# 회고 생성 테스트
print("=== 회고 생성 테스트 ===")
reflection_response = requests.post(
    "http://localhost:8000/api/reflections",
    headers={"Content-Type": "application/json", "x-user-id": "test_user"},
    json={
        "space_id": space_id,
        "title": "첫 번째 회고",
        "content": "오늘은 새로운 프로젝트를 시작했다. 매우 흥미롭고 도전적이었다.",
        "reflection_type": "daily",
        "emotion_score": 8,
        "achievement_score": 7
    }
)
print(f"Status: {reflection_response.status_code}")
print(f"Response: {json.dumps(reflection_response.json(), indent=2, ensure_ascii=False)}")
print()

# 회고 목록 조회
print("=== 회고 목록 조회 ===")
reflections_response = requests.get(
    "http://localhost:8000/api/reflections",
    headers={"x-user-id": "test_user"}
)
print(f"Status: {reflections_response.status_code}")
print(f"Response: {json.dumps(reflections_response.json(), indent=2, ensure_ascii=False)}")
