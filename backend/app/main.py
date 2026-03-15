from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy import text

from app.api.routes import router
from app.core.config import get_settings
from app.core.security import get_password_hash
from app.db import models
from app.db.base import Base
from app.db.session import SessionLocal
from app.db.session import engine

# Import models to ensure metadata registration before create_all.
from app.db import models as _models  # noqa: F401


settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE account_profiles ADD COLUMN IF NOT EXISTS sex VARCHAR(16) DEFAULT 'female'")
        )
    db = SessionLocal()
    try:
        admin = db.scalar(select(models.Account).where(models.Account.email == "admin"))
        if admin is None:
            admin = models.Account(
                email="admin",
                password_hash=get_password_hash("admin"),
                full_name="Admin",
                auth_provider="local",
            )
            db.add(admin)
            db.commit()
        elif not admin.password_hash:
            admin.password_hash = get_password_hash("admin")
            db.commit()
    finally:
        db.close()


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(router)
