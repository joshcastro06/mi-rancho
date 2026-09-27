export default function WeightChart({
  points,
}: {
  points: { date: string; weight: number; label: string }[];
}) {
  if (points.length < 2) {
    return <p className="muted">Registra al menos dos pesajes para ver la evolución.</p>;
  }

  const width = 320;
  const height = 140;
  const pad = 18;
  const min = Math.min(...points.map((point) => point.weight));
  const max = Math.max(...points.map((point) => point.weight));
  const span = Math.max(max - min, 1);
  const coords = points.map((point, index) => {
    const x = pad + (index / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - ((point.weight - min) / span) * (height - pad * 2);
    return { ...point, x, y };
  });
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg className="weight-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución de peso">
      <path d={path} fill="none" stroke="#234c31" strokeWidth="2.5" />
      {coords.map((point) => (
        <g key={`${point.date}-${point.weight}`}>
          <circle cx={point.x} cy={point.y} r="4.5" fill="#173c29" />
          <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="9" fill="#405047">
            {point.weight}
          </text>
        </g>
      ))}
    </svg>
  );
}
