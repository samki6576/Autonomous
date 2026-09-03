"use client";

import { PORTS, SUPPLIERS } from "@/lib/mockData";

// Simple equirectangular projection over a stylized Europe/Asia crop.
// This avoids any external map SDK / API key so the app deploys with zero config.
const VIEW_W = 900;
const VIEW_H = 420;
const LAT_MIN = 20,
  LAT_MAX = 60;
const LNG_MIN = -10,
  LNG_MAX = 125;

function project(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VIEW_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VIEW_H;
  return { x, y };
}

const congestionColor: Record<string, string> = {
  LOW: "#34d399",
  MEDIUM: "#fbbf24",
  HIGH: "#f87171",
};

export default function Heatmap({
  onSelectPort,
  onSelectSupplier,
  highlightPortCodes = [],
}: {
  onSelectPort: (code: string) => void;
  onSelectSupplier: (id: string) => void;
  highlightPortCodes?: string[];
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-base-700 bg-base-900">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-[320px] md:h-[380px]">
        <defs>
          <radialGradient id="glow" r="70%">
            <stop offset="0%" stopColor="#22314a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#05070a" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#141b26" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />
        <rect width={VIEW_W} height={VIEW_H} fill="url(#glow)" />

        {/* shipping lanes between ports */}
        {PORTS.map((a, i) =>
          PORTS.slice(i + 1).map((b) => {
            const pa = project(a.lat, a.lng);
            const pb = project(b.lat, b.lng);
            return (
              <line
                key={`${a.code}-${b.code}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="#1e2733"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            );
          })
        )}

        {/* suppliers */}
        {SUPPLIERS.map((s) => {
          const { x, y } = project(s.lat, s.lng);
          const color = s.healthScore >= 80 ? "#34d399" : s.healthScore >= 65 ? "#fbbf24" : "#f87171";
          return (
            <g
              key={s.id}
              transform={`translate(${x},${y})`}
              className="cursor-pointer"
              onClick={() => onSelectSupplier(s.id)}
            >
              <rect x={-5} y={-5} width={10} height={10} fill={color} rx={2} stroke="#05070a" strokeWidth={1.5} />
              <text x={8} y={4} fontSize={10} fill="#9fb0c3">
                {s.name.split(" ")[0]}
              </text>
            </g>
          );
        })}

        {/* ports */}
        {PORTS.map((p) => {
          const { x, y } = project(p.lat, p.lng);
          const isHighlighted = highlightPortCodes.includes(p.code);
          return (
            <g
              key={p.code}
              transform={`translate(${x},${y})`}
              className="cursor-pointer"
              onClick={() => onSelectPort(p.code)}
            >
              {p.congestion === "HIGH" && (
                <circle r={12} fill={congestionColor[p.congestion]} opacity={0.25} className="pulse-dot" />
              )}
              <circle
                r={isHighlighted ? 7 : 5.5}
                fill={congestionColor[p.congestion]}
                stroke="#05070a"
                strokeWidth={1.5}
              />
              <text x={9} y={-6} fontSize={11} fill="#e6ebf2" fontWeight={600}>
                {p.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs text-base-600 bg-base-950/80 px-3 py-1.5 rounded-lg border border-base-700">
        {Object.entries(congestionColor).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 text-[11px] text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
            {label} congestion
          </span>
        ))}
      </div>
    </div>
  );
}
