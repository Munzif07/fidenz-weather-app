"use client";

interface ComfortGaugeProps {
  score: number; // 0-100
  size?: number;
}

function tierColor(score: number): string {
  if (score >= 70) return "var(--color-comfort-high)";
  if (score >= 40) return "var(--color-comfort-mid)";
  return "var(--color-comfort-low)";
}

export function ComfortGauge({ score, size = 88 }: ComfortGaugeProps) {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Gauge sweeps 270deg (like an analog dial), starting at -225deg
  const sweep = 0.75 * circumference;
  const offset = sweep - (score / 100) * sweep;
  const color = tierColor(score);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Comfort score ${score} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-[225deg]"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${sweep} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${sweep} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-data font-semibold tabular-nums"
          style={{ fontSize: size * 0.26, color }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
