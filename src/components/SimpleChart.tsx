interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface SimpleChartProps {
  data: ChartData[];
  type: 'bar' | 'pie' | 'donut' | 'line';
  height?: number;
  totalLabel?: string;
  labels?: string[];
}

const COLORS = [
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#6366f1', '#14b8a6', '#e11d48',
];

export default function SimpleChart({ data, type, height = 200, totalLabel }: SimpleChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-500 text-sm py-8">
        <p>📊 Sin datos para mostrar</p>
      </div>
    );
  }

  const coloredData = data.map((d, i) => ({
    ...d,
    color: d.color || COLORS[i % COLORS.length],
  }));

  if (type === 'line') {
    return <LineChart data={coloredData} height={height} />;
  }

  if (type === 'pie' || type === 'donut') {
    return <DonutChart data={coloredData} height={height} donut={type === 'donut'} totalLabel={totalLabel} />;
  }

  return <BarChart data={coloredData} height={height} />;
}

function BarChart({ data, height }: { data: ChartData[]; height: number }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartH = height - 40;

  return (
    <div style={{ height }}>
      <div className="flex items-end gap-2 h-full px-1" style={{ height: chartH }}>
        {data.map((d, i) => {
          const barH = Math.max((d.value / maxValue) * chartH, 4);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-[9px] text-slate-400 font-medium tabular-nums">
                ${d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value.toLocaleString()}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500 min-w-[16px] relative group cursor-pointer"
                style={{ height: barH, backgroundColor: d.color }}
              />
              <span className="text-[9px] text-slate-400 truncate w-full text-center leading-tight">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({ data, height }: { data: ChartData[]; height: number }) {
  const chartW = 300;
  const chartH = height - 30;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const stepX = chartW / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: chartH - (d.value / maxValue) * chartH,
    label: d.label,
    value: d.value,
    color: d.color,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${chartW} ${chartH} L 0 ${chartH} Z`;
  const gradientId = `lineGrad-${Math.random().toString(36).slice(2)}`;

  return (
    <div style={{ height }} className="overflow-hidden">
      <svg viewBox={`-5 -5 ${chartW + 10} ${chartH + 10}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1="0" y1={chartH * (1 - pct)}
            x2={chartW} y2={chartH * (1 - pct)}
            stroke="#1e293b"
            strokeWidth="0.5"
          />
        ))}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="flex justify-between px-1 -mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[8px] text-slate-500 tabular-nums">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({
  data,
  height,
  donut,
  totalLabel,
}: {
  data: ChartData[];
  height: number;
  donut: boolean;
  totalLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = height / 2;
  const cy = height / 2;
  const outerR = height * 0.42;
  const innerR = donut ? outerR * 0.58 : 0;

  let cumulative = 0;
  const slices = data.map((d) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumulative;
    cumulative += sliceAngle;
    return { ...d, startAngle, endAngle: cumulative };
  });

  function polarToCartesian(angle: number, radius: number) {
    return {
      x: cx + radius * Math.sin(angle),
      y: cy - radius * Math.cos(angle),
    };
  }

  function describeArc(startAngle: number, endAngle: number, radius: number) {
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const start = polarToCartesian(startAngle, radius);
    const end = polarToCartesian(endAngle, radius);
    const innerStart = polarToCartesian(startAngle, innerR);
    const innerEnd = polarToCartesian(endAngle, innerR);

    if (innerR === 0) {
      return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y} Z`;
    }

    return [
      `M ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={height} height={height} viewBox={`0 0 ${height} ${height}`}>
        {slices.map((s, i) => (
          <path
            key={i}
            d={describeArc(s.startAngle, s.endAngle, outerR)}
            fill={s.color}
            opacity={0.85}
            stroke="#0f172a"
            strokeWidth="1"
          />
        ))}
        {donut && (
          <>
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] font-medium"
            >
              {totalLabel || 'Total'}
            </text>
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              className="fill-white text-sm font-bold"
            >
              ${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString()}
            </text>
          </>
        )}
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px]">
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-slate-400">{d.label}</span>
            <span className="text-slate-500">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
