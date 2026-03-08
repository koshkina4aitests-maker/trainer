# trainer

Strength training assistant with:
- reusable AI training engine
- FastAPI backend + PostgreSQL
- React web frontend (v1)
- integration interfaces for HealthKit / Google Fit / Fitbit

## Project structure

```text
backend/
  app/
    api/
      routes.py
    core/
      config.py
    db/
      base.py
      models.py
      session.py
    integrations/
      base.py
      providers.py
    services/
      engine_service.py
      ai_analysis.py
    schemas.py
    main.py
  requirements.txt
  docker-compose.yml
  .env.example

frontend/
  src/
    components/
      Navigation.jsx
    pages/
      DashboardPage.jsx
      TodaysWorkoutPage.jsx
      WorkoutSessionPage.jsx
      ProgressAnalyticsPage.jsx
      BodyVisualizationPage.jsx
    api.js
    App.jsx
    main.jsx
    styles.css
  package.json
  .env.example

training_engine/
  __init__.py

trainer_ai/
  __init__.py
  models.py
  engine.py

tests/
  test_engine.py
```

## Backend API

Base URL: `http://localhost:8000`

Endpoints:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `GET /auth/me`
- `POST /users`
- `POST /workouts`
- `GET /recommended-workout?user_id=<id>`
- `GET /analysis?user_id=<id>[&workout_id=<id>]`

Extras:
- `GET /health`
- Swagger docs: `http://localhost:8000/docs`

### Heart-rate attachment

Heart-rate values are stored on each set:
- `heart_rate_after_set`
- `heart_rate_recovery`
- `heart_rate_source` (`manual`, `healthkit`, `google_fit`, `fitbit`)

## AI analysis service

`backend/app/services/ai_analysis.py` sends structured workout context to an OpenAI-compatible Responses API and returns textual coaching feedback.

If `AI_API_KEY` is missing, backend returns a deterministic local fallback analysis.

## Integrations (prepared interfaces)

`backend/app/integrations/providers.py` provides pluggable provider classes:
- `HealthKitProvider`
- `GoogleFitProvider`
- `FitbitProvider`

These are ready extension points for production auth/data-sync flows.

## Web UI (v1)

React app pages:
- Dashboard
- Today's workout
- Workout session
- Progress analytics
- Body muscle visualization

The frontend calls the same backend API that mobile clients can use later.

## Authentication

Supported methods:
- local email/password
- Google OAuth (ID token exchange)

Frontend:
- `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`

Backend:
- `GOOGLE_CLIENT_ID`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` in `backend/.env`

### Google OAuth setup checklist

1. Open Google Cloud Console.
2. Create/select project.
3. Configure **OAuth consent screen** (app name + test users).
4. Create OAuth 2.0 Client ID (**Web application**).
5. Add authorized origin:
   - `http://localhost:5173`
6. (Optional) Add redirect URI:
   - `http://localhost:5173`
7. Put created client id into:
   - `frontend/.env` -> `VITE_GOOGLE_CLIENT_ID=...`
   - `backend/.env` -> `GOOGLE_CLIENT_ID=...`

## Run locally

### 1) Start PostgreSQL

```bash
cd backend
docker compose up -d
```

### 2) Start backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 3) Start frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Engine tests

```bash
python3 -m unittest discover -s tests -p "test_*.py"
```