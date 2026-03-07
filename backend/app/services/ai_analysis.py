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
                                "Ты AI-тренер по силовым тренировкам. Отвечай только по-русски. "
                                "Давай краткие, безопасные и практичные рекомендации по данным тренировки, "
                                "усталости и прогрессии."
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
                "Профиль пользователя и контекст тренировок:",
                json.dumps(user_context, ensure_ascii=True),
                "Структурный анализ сессии:",
                json.dumps(structured_analysis, ensure_ascii=True),
                "Рекомендация на следующую тренировку:",
                json.dumps(recommendation, ensure_ascii=True),
                "Снимок прогресса:",
                json.dumps(progress_snapshot, ensure_ascii=True),
                "Дай: 1) краткую сводку, 2) главный риск (если есть), 3) конкретные действия на следующую тренировку.",
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

        lines = ["Сводка тренировки:"]
        if positives:
            lines.append(f"- Сильные стороны: {', '.join(positives)}")
        if warnings:
            lines.append(f"- Предупреждения: {', '.join(warnings)}")
        if focus:
            lines.append(f"- Фокус следующей тренировки: {', '.join(focus[:4])}")
        if exercises:
            lines.append(f"- Рекомендованные упражнения: {', '.join(exercises[:5])}")
        if not positives and not warnings:
            lines.append("- Критичных флагов по результативности не обнаружено.")
        lines.append("Действие: держите 1-3 RIR в базовых упражнениях и избегайте отказа при высокой усталости.")
        return "\n".join(lines)
