# ProoF Backend API

FastAPI + Supabase 기반 백엔드 API 서버

## 기술 스택

- **언어**: Python 3.11.4
- **프레임워크**: FastAPI
- **데이터베이스**: Supabase
- **스키마**: Pydantic
- **서버**: Uvicorn (개발), Gunicorn + Uvicorn workers (프로덕션)

## 프로젝트 구조

```
back/
├── app/
│   ├── routes/          # API 라우터
│   │   ├── users.py     # 사용자 관리
│   │   ├── logs.py      # 경험 로그
│   │   ├── projects.py  # 프로젝트
│   │   └── keywords.py  # 키워드
│   ├── config.py        # 환경 설정
│   ├── database.py      # Supabase 클라이언트
│   ├── schemas.py       # Pydantic 스키마
│   └── main.py          # FastAPI 앱
├── docs/                # 문서
├── requirements.txt     # Python 의존성
├── run.py              # 개발 서버 실행 스크립트
└── .env                # 환경 변수
```

## 설치 및 실행

### 1. Python 가상환경 생성 (Python 3.11.4 사용)

```powershell
cd "c:\Users\gudrb\OneDrive\바탕 화면\코코네\새롭게\back"
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. 의존성 설치

```powershell
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 Supabase 정보를 입력하세요:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
PORT=5000
HOST=0.0.0.0
ENV=development
```

### 4. 개발 서버 실행

```powershell
python run.py
```

또는

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

서버가 http://localhost:5000 에서 실행됩니다.

## API 엔드포인트

### 기본
- `GET /` - API 정보
- `GET /api/v1/health` - 헬스체크

### 사용자
- `POST /api/v1/users/register` - 회원가입
- `GET /api/v1/users/me` - 사용자 정보 조회
- `PATCH /api/v1/users/me` - 사용자 정보 수정

### 경험 로그
- `POST /api/v1/logs` - 로그 생성
- `GET /api/v1/logs` - 로그 목록 조회
- `GET /api/v1/logs/{log_id}` - 로그 상세 조회
- `PATCH /api/v1/logs/{log_id}` - 로그 수정
- `DELETE /api/v1/logs/{log_id}` - 로그 삭제

### 프로젝트
- `POST /api/v1/projects` - 프로젝트 생성
- `GET /api/v1/projects` - 프로젝트 목록 조회
- `GET /api/v1/projects/{project_id}` - 프로젝트 상세 조회
- `PATCH /api/v1/projects/{project_id}` - 프로젝트 수정
- `DELETE /api/v1/projects/{project_id}` - 프로젝트 삭제

### 키워드
- `GET /api/v1/keywords` - 키워드 목록 조회
- `POST /api/v1/keywords` - 키워드 생성
- `GET /api/v1/keywords/{keyword_id}` - 키워드 상세 조회

## API 문서

서버 실행 후 다음 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:

- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## 프로덕션 배포

### Gunicorn으로 실행

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000
```

### Render 배포

`render.yaml` 파일을 참고하여 Render에 배포하세요.

## 참고 문서

- [backend-requirements.md](docs/backend-requirements.md) - API 요구사항 명세
- [implementation-log.md](docs/implementation-log.md) - 구현 로그
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Supabase Python 문서](https://supabase.com/docs/reference/python/introduction)
