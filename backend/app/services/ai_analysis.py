from __future__ import annotations

import json
from typing import Any, Dict, List

import httpx

from app.core.config import Settings


class AIAnalysisService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def analyze_workout(
        self,
        user_context: Dict[str, Any],
        structured_analysis: Dict[str, Any],
        recommendation: Dict[str, Any],
        progress_snapshot: Dict[str, Any],
    ) -> str:
        if not self.settings.ai_api_key:
            return self._fallback_text(structured_analysis, recommendation)

        payload = {
            "model": self.settings.ai_model,
            "input": [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "You are a strength-coaching assistant. Return concise, safe, practical "
                                "feedback based on workout data, fatigue, and progression signals."
                            ),
                        }
                    ],
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": self._build_prompt(
                                user_context=user_context,
                                structured_analysis=structured_analysis,
                                recommendation=recommendation,
                                progress_snapshot=progress_snapshot,
                            ),
                        }
                    ],
                },
            ],
            "max_output_tokens": 350,
        }
        headers = {
            "Authorization": f"Bearer {self.settings.ai_api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=25) as client:
                response = await client.post(
                    f"{self.settings.ai_base_url.rstrip('/')}/responses",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except Exception:
            return self._fallback_text(structured_analysis, recommendation)

        text = self._extract_text(data)
        return text if text else self._fallback_text(structured_analysis, recommendation)

    @staticmethod
    def _build_prompt(
        user_context: Dict[str, Any],
        structured_analysis: Dict[str, Any],
        recommendation: Dict[str, Any],
        progress_snapshot: Dict[str, Any],
    ) -> str:
        return "\n".join(
            [
                "User profile and training context:",
                json.dumps(user_context, ensure_ascii=True),
                "Structured session analysis:",
                json.dumps(structured_analysis, ensure_ascii=True),
                "Suggested next workout:",
                json.dumps(recommendation, ensure_ascii=True),
                "Progress snapshot:",
                json.dumps(progress_snapshot, ensure_ascii=True),
                "Provide: 1) short summary, 2) key risk if any, 3) specific next-session action list.",
            ]
        )

    @staticmethod
    def _extract_text(response_json: Dict[str, Any]) -> str:
        if isinstance(response_json.get("output_text"), str):
            return response_json["output_text"]

        output = response_json.get("output", [])
        texts: List[str] = []
        for item in output:
            for content in item.get("content", []):
                text = content.get("text")
                if isinstance(text, str):
                    texts.append(text)
        return "\n".join(texts).strip()

    @staticmethod
    def _fallback_text(
        structured_analysis: Dict[str, Any],
        recommendation: Dict[str, Any],
    ) -> str:
        positives = structured_analysis.get("positives") or []
        warnings = structured_analysis.get("warnings") or []
        focus = recommendation.get("focus_muscles") or []
        exercises = recommendation.get("exercises") or []

        lines = ["Session summary:"]
        if positives:
            lines.append(f"- Positives: {', '.join(positives)}")
        if warnings:
            lines.append(f"- Warnings: {', '.join(warnings)}")
        if focus:
            lines.append(f"- Next focus muscles: {', '.join(focus[:4])}")
        if exercises:
            lines.append(f"- Suggested exercises: {', '.join(exercises[:5])}")
        if not positives and not warnings:
            lines.append("- No major performance flags detected.")
        lines.append("Action: keep 1-3 RIR on compounds and avoid failure if fatigue remains high.")
        return "\n".join(lines)
