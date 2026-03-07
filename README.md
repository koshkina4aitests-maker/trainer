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