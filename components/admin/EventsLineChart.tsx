"use client";

import { useMemo } from "react";

type DataPoint = {
  month: string;
  count: number;
};

type EventsLineChartProps = {
  data: DataPoint[];
};

const GRID_COLOR = "currentColor";
const GRID_OPACITY = 0.08;
const LINE_COLOR = "#6B1F2A";
const LINE_COLOR_DARK = "#B84C5C";
const DOT_FILL = "#6B1F2A";
const DOT_FILL_DARK = "#B84C5C";
const DOT_STROKE = "#ffffff";
const AXIS_LABEL_COLOR = "currentColor";
const AXIS_LABEL_OPACITY = 0.4;
const VALUE_LABEL_OPACITY = 0.6;

export default function EventsLineChart({ data }: EventsLineChartProps) {
  const { pathD, dots, yLabels, yMax, yTicks } = useMemo(() => {
    const maxVal = Math.max(1, ...data.map((d) => d.count));
    const paddedMax = maxVal + Math.max(1, Math.ceil(maxVal * 0.15));
    const ticks = Math.min(5, paddedMax);

    // Figure out nice round tick values
    const step = Math.max(1, Math.ceil(paddedMax / ticks));
    const yTickValues: number[] = [];
    for (let v = 0; v <= paddedMax; v += step) {
      yTickValues.push(v);
    }
    // Ensure we always include maxVal
    if (yTickValues[yTickValues.length - 1] < maxVal) {
      yTickValues.push(maxVal);
    }

    const chartW = 100;
    const chartH = 38;
    const padL = 0;
    const padR = 0;
    const padT = 4;
    const padB = 8;
    const drawW = chartW - padL - padR;
    const drawH = chartH - padT - padB;
    const points = data.length - 1;

    const xPos = (i: number) =>
      padL + (points > 0 ? (i / points) * drawW : drawW / 2);
    const yPos = (v: number) =>
      padT + drawH - (paddedMax > 0 ? (v / paddedMax) * drawH : 0);

    // Build path
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

    const dotPoints = data.map((d, i) => ({
      x: xPos(i),
      y: yPos(d.count),
      count: d.count,
      month: d.month,
    }));

    return {
      pathD: path,
      dots: dotPoints,
      yLabels: yTickValues,
      yMax: paddedMax,
      yTicks: yTickValues,
    };
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 100 38"
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Events per month chart: ${data.map((d) => `${d.month}: ${d.count}`).join(", ")}`}
      >
        {/* Y-axis grid lines */}
        {yTicks.map((v) => {
          const y = 4 + 26 - (yMax > 0 ? (v / yMax) * 26 : 0);
          return (
            <line
              key={`grid-${v}`}
              x1={0}
              y1={y}
              x2={100}
              y2={y}
              stroke={GRID_COLOR}
              strokeOpacity={GRID_OPACITY}
              strokeWidth={0.4}
            />
          );
        })}

        {/* Area fill under the line */}
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.2} />
            <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="lineAreaGradDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINE_COLOR_DARK} stopOpacity={0.25} />
            <stop offset="100%" stopColor={LINE_COLOR_DARK} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        {dots.length > 1 && (
          <>
            <path
              d={`M${dots[0].x},34 L${pathD} L${dots[dots.length - 1].x},34 Z`}
              fill="url(#lineAreaGrad)"
              className="dark:hidden"
            />
            <path
              d={`M${dots[0].x},34 L${pathD} L${dots[dots.length - 1].x},34 Z`}
              fill="url(#lineAreaGradDark)"
              className="hidden dark:block"
            />
          </>
        )}

        {/* The line path */}
        <path
          d={pathD}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={1.0}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dark:stroke-[#B84C5C]"
        />

        {/* Data dots */}
        {dots.map((dot) => (
          <g key={dot.month}>
            {/* Invisible wider hit area for tooltip */}
            <rect
              x={dot.x - 5}
              y={dot.y - 6}
              width={10}
              height={12}
              fill="transparent"
              className="group"
            />
            {/* Dot */}
            <circle
              cx={dot.x}
              cy={dot.y}
              r={1.8}
              fill={DOT_FILL}
              stroke={DOT_STROKE}
              strokeWidth={0.7}
              className="dark:fill-[#B84C5C]"
            />
          </g>
        ))}

        {/* X-axis month labels */}
        {dots.map((dot, i) => (
          <text
            key={`label-${dot.month}`}
            x={dot.x}
            y={36}
            textAnchor={i === 0 ? "start" : i === dots.length - 1 ? "end" : "middle"}
            fill={AXIS_LABEL_COLOR}
            fillOpacity={AXIS_LABEL_OPACITY}
            fontSize={4}
            fontFamily="var(--font-body, Inter, sans-serif)"
            fontWeight={500}
          >
            {dot.month}
          </text>
        ))}

        {/* Value labels above dots */}
        {dots.map((dot) => (
          <text
            key={`val-${dot.month}`}
            x={dot.x}
            y={dot.y - 3}
            textAnchor="middle"
            fill={LINE_COLOR}
            fillOpacity={VALUE_LABEL_OPACITY}
            fontSize={4}
            fontFamily="var(--font-body, Inter, sans-serif)"
            fontWeight={700}
            className="dark:fill-[#B84C5C]"
          >
            {dot.count}
          </text>
        ))}
      </svg>
    </div>
  );
}
