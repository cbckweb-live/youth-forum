"use client";

import { useMemo } from "react";

type DataPoint = {
  month: string;
  count: number;
};

type EventsLineChartProps = {
  data: DataPoint[];
};

const LINE_COLOR = "#6B1F2A";
const LINE_COLOR_DARK = "#B84C5C";

// Chart layout constants — shared between SVG rendering and useMemo
const PAD_TOP = 6;
const PAD_BOTTOM = 10;
const DRAW_HEIGHT = 26;
const CHART_HEIGHT = PAD_TOP + DRAW_HEIGHT + PAD_BOTTOM;

const CHART_WIDTH = 100;
const PAD_LEFT = 0;
const PAD_RIGHT = 0;

export default function EventsLineChart({ data }: EventsLineChartProps) {
  const { pathD, areaD, dots, yTicks, yMax } = useMemo(() => {
    const maxVal = Math.max(1, ...data.map((d) => d.count));
    const paddedMax = maxVal + Math.max(1, Math.ceil(maxVal * 0.2));

    // Y-axis ticks — round to nice intervals
    const tickCount = 4;
    const rawStep = paddedMax / tickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
    const yTickValues: number[] = [];
    for (let v = 0; v <= paddedMax; v += niceStep) {
      yTickValues.push(v);
    }
    if (yTickValues[yTickValues.length - 1] < maxVal) {
      yTickValues.push(maxVal);
    }

    // Chart dimensions (viewBox)
    const drawW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
    const drawH = DRAW_HEIGHT;
    const points = data.length - 1;

    const xPos = (i: number) =>
      PAD_LEFT + (points > 0 ? (i / points) * drawW : drawW / 2);
    const yPos = (v: number) =>
      PAD_TOP + drawH - (paddedMax > 0 ? (v / paddedMax) * drawH : 0);

    // Build smooth path
    let path = "";
    data.forEach((d, i) => {
      const x = xPos(i);
      const y = yPos(d.count);
      if (i === 0) {
        path += `M${x},${y}`;
      } else {
        const prevX = xPos(i - 1);
        const prevY = yPos(data[i - 1].count);
        const cpx = (prevX + x) / 2;
        path += ` C${cpx},${prevY} ${cpx},${y} ${x},${y}`;
      }
    });

    // Area under the curve
    let area = "";
    if (dots.length > 1) {
      const firstX = xPos(0);
      const lastX = xPos(data.length - 1);
      const baselineY = yPos(0);
      area = `M${firstX},${baselineY} ${path} L${lastX},${baselineY} Z`;
    }

    const dotPoints = data.map((d, i) => ({
      x: xPos(i),
      y: yPos(d.count),
      count: d.count,
      month: d.month,
    }));

    return {
      pathD: path,
      areaD: area,
      dots: dotPoints,
      yTicks: yTickValues,
      yMax: paddedMax,
    };
  }, [data]);

  if (data.length === 0) return null;

  /** Determine if we should show this month label to avoid crowding */
  const shouldShowLabel = (i: number, total: number) => {
    // Always show first, last, and months with events
    if (i === 0 || i === total - 1 || dots[i].count > 0) return true;
    // For long series, show every other month
    if (total > 6 && i % 2 !== 0) return false;
    return true;
  };

  // Simplify month labels to 3 chars
  const shortMonths = dots.map((d) => d.month.slice(0, 3));

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Events per month chart: ${data.map((d) => `${d.month}: ${d.count}`).join(", ")}`}
      >
        {/* ── Gradient definitions ── */}
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.15} />
            <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="lineAreaGradDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINE_COLOR_DARK} stopOpacity={0.2} />
            <stop offset="100%" stopColor={LINE_COLOR_DARK} stopOpacity={0.03} />
          </linearGradient>
        </defs>

        {/* ── Y-axis grid lines (subtle) ── */}
        {yTicks.map((v) => {
          const y = PAD_TOP + DRAW_HEIGHT - (yMax > 0 ? (v / yMax) * DRAW_HEIGHT : 0);
          return (
            <line
              key={`grid-${v}`}
              x1={0}
              y1={y}
              x2={100}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.06}
              strokeWidth={0.3}
            />
          );
        })}

        {/* ── Area fill ── */}
        {areaD && (
          <>
            <path d={areaD} fill="url(#lineAreaGrad)" className="dark:hidden" />
            <path d={areaD} fill="url(#lineAreaGradDark)" className="hidden dark:block" />
          </>
        )}

        {/* ── The line ── */}
        <path
          d={pathD}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={1.0}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:stroke-[#B84C5C]"
        />

        {/* ── Dots with value labels ── */}
        {dots.map((dot, i) => (
          <g key={dot.month}>
            {/* Dot circle */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={dot.count > 0 ? 2 : 0}
              fill={dot.count > 0 ? LINE_COLOR : "none"}
              stroke="white"
              strokeWidth={0.6}
              className="dark:fill-[#B84C5C]"
            />
            {/* Value label (only for non-zero counts) */}
            {dot.count > 0 && (
              <text
                x={dot.x}
                y={dot.y - 4}
                textAnchor="middle"
                fill={LINE_COLOR}
                fillOpacity={0.75}
                fontSize={3.5}
                fontFamily="var(--font-body, Inter, sans-serif)"
                fontWeight={700}
                className="dark:fill-[#B84C5C]"
              >
                {dot.count}
              </text>
            )}
          </g>
        ))}

        {/* ── Month labels (bottom) ── */}
        {dots.map((dot, i) => {
          if (!shouldShowLabel(i, dots.length)) return null;
          return (
            <text
              key={`label-${dot.month}`}
              x={dot.x}
              y={39}
              textAnchor={
                i === 0 ? "start" : i === dots.length - 1 ? "end" : "middle"
              }
              fill="currentColor"
              fillOpacity={0.35}
              fontSize={3.2}
              fontFamily="var(--font-body, Inter, sans-serif)"
              fontWeight={500}
            >
              {shortMonths[i]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
