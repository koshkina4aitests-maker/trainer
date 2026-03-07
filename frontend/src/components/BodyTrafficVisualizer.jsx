import { ZONE_DEFINITIONS } from "../utils/trainingModel";

function colorClass(color) {
  if (color === "green") return "traffic-green";
  if (color === "yellow") return "traffic-yellow";
  return "traffic-red";
}

function Figure({ view, zones }) {
  const filtered = ZONE_DEFINITIONS.filter((zone) => zone.view === view);

  return (
    <div className={`body-figure ${view}`}>
      <div className="figure-canvas">
        <div className="body-silhouette" />
        {filtered.map((zone) => {
          const zoneData = zones?.[zone.id] ?? { color: "green", label: "0" };
          return (
            <div
              key={zone.id}
              className={`zone-dot ${colorClass(zoneData.color)}`}
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
              title={`${zone.label}: ${zoneData.label}`}
            >
              <span>{zone.label}</span>
            </div>
          );
        })}
      </div>
      <p className="figure-caption">{view === "front" ? "Вид спереди" : "Вид сзади"}</p>
    </div>
  );
}

export default function BodyTrafficVisualizer({ zones, subtitle }) {
  return (
    <div className="traffic-visualizer card">
      <div className="section-header">
        <h3>Визуализация тела</h3>
        <p className="subtle">{subtitle}</p>
      </div>

      <div className="traffic-legend">
        <span><i className="legend-dot traffic-green" /> Низкая нагрузка</span>
        <span><i className="legend-dot traffic-yellow" /> Средняя нагрузка</span>
        <span><i className="legend-dot traffic-red" /> Высокая нагрузка</span>
      </div>

      <div className="figures-grid">
        <Figure view="front" zones={zones} />
        <Figure view="back" zones={zones} />
      </div>
    </div>
  );
}
