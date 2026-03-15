from __future__ import annotations

from datetime import UTC, datetime
from typing import List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    sex: Mapped[str] = mapped_column(String(16), nullable=False)
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    training_level: Mapped[str] = mapped_column(String(32), nullable=False)
    training_style: Mapped[str] = mapped_column(String(32), nullable=False)
    goals_csv: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    workouts: Mapped[List["Workout"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_sub: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    auth_provider: Mapped[str] = mapped_column(String(32), nullable=False, default="local")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    profile: Mapped[Optional["AccountProfile"]] = relationship(
        back_populates="account",
        uselist=False,
        cascade="all, delete-orphan",
    )


class AccountProfile(Base):
    __tablename__ = "account_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), unique=True, nullable=False)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sex: Mapped[str] = mapped_column(String(16), nullable=False, default="female")
    training_style: Mapped[str] = mapped_column(String(32), nullable=False, default="split")
    workouts_per_week: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    goal: Mapped[str] = mapped_column(String(64), nullable=False, default="hypertrophy")
    height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    body_fat_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    experience_level: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    preferred_session_duration_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    account: Mapped["Account"] = relationship(back_populates="profile")


class CustomExercise(Base):
    __tablename__ = "custom_exercises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exercise_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    muscle_coefficients_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    technique_tip: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )


class Workout(Base):
    __tablename__ = "workouts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    user: Mapped["User"] = relationship(back_populates="workouts")
    exercises: Mapped[List["Exercise"]] = relationship(
        back_populates="workout",
        cascade="all, delete-orphan",
        order_by="Exercise.id",
    )


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workout_id: Mapped[int] = mapped_column(ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    rest_time_sec: Mapped[int] = mapped_column(Integer, nullable=False)
    rep_target_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rep_target_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    workout: Mapped["Workout"] = relationship(back_populates="exercises")
    sets: Mapped[List["ExerciseSet"]] = relationship(
        back_populates="exercise",
        cascade="all, delete-orphan",
        order_by="ExerciseSet.set_index",
    )


class ExerciseSet(Base):
    __tablename__ = "exercise_sets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    set_index: Mapped[int] = mapped_column(Integer, nullable=False)
    reps: Mapped[int] = mapped_column(Integer, nullable=False)
    rir: Mapped[float] = mapped_column(Float, nullable=False)
    heart_rate_after_set: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    heart_rate_recovery: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    heart_rate_source: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    exercise: Mapped["Exercise"] = relationship(back_populates="sets")
