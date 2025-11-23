# Backend Tech Stack

## 원칙

- **최대한 간단하게 구현**해야 함.
- 코드의 간결함을 위해 **api 인증 관련 내용은 제외** 시킬 것.
- 코드의 간결함을 위해 **docker 관련 내용은 제외** 시킬 것.
- 코드의 간결함을 위해 **테스트 관련 내용은 제외** 시킬 것.
  - 테스트 코드 작성하지 않음.
  - 테스트 관련 dependency 도 제거해야 함.

## 테크스택

- 데이터베이스: Supabase
- 언어: Python 3.11.4 ( 반드시 버전 준수할 것)
  - 가상환경 : venv
- 프레임워크: FastAPI
- 스키마 및 유효성 검사: Pydantic
- API 서버:
  - 개발: Uvicorn (ASGI)
  - 프로덕션: Gunicorn(워크 프로세스) + Uvicorn workers
- 배포: Render

## 환경설정

- 로컬: .env로 Supabase URL/Key 설정
