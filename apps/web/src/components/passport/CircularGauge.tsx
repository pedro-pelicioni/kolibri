export function CircularGauge({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="9" />
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke="#059669"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-lg font-bold text-ink">
          {clamped}%
        </div>
      </div>
      <div className="mt-2 max-w-[120px] text-xs font-medium text-neutral-500">{label}</div>
    </div>
  );
}
