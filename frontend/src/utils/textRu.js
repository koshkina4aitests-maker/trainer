const directMap = new Map([
  ["Not enough consecutive sessions for progression check.", "Недостаточно последовательных тренировок для проверки прогрессии."],
  ["Rep target not consistently reached yet.", "Целевой диапазон повторений пока не достигается стабильно."],
  ["Insufficient training history for deload detection.", "Недостаточно истории тренировок для оценки необходимости deload."],
  ["Accumulated fatigue + performance drop detected.", "Обнаружены накопленная усталость и снижение результативности."],
  ["Fatigue is high; monitor one more session before deload.", "Усталость высокая: отследите еще одну тренировку перед deload."],
  ["No strong deload signals.", "Явных сигналов для deload не обнаружено."],
]);

const patternMap = [
  {
    regex: /^Top rep bound \((\d+)\) reached in 3 consecutive sessions\.$/,
    replace: (_, rep) => `Верхняя граница повторений (${rep}) достигнута в 3 тренировках подряд.`,
  },
  {
    regex: /^High fatigue muscles excluded:\s*(.+)\.$/,
    replace: (_, muscles) => `Из-за высокой усталости исключены мышцы: ${muscles}.`,
  },
  {
    regex: /^Undertrained recently:\s*(.+)\.$/,
    replace: (_, muscles) => `Недогруженные за последнее время: ${muscles}.`,
  },
];

export function ruText(source) {
  if (!source) return "";
  if (directMap.has(source)) return directMap.get(source);
  for (const item of patternMap) {
    if (item.regex.test(source)) {
      return source.replace(item.regex, item.replace);
    }
  }
  return source;
}
