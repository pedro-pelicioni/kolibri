import { BatchStatus, eventLabel, type EventType } from "@kolibri/types";

export function StatusChip({ status }: { status: number }) {
  const map: Record<number, { label: string; cls: string }> = {
    [BatchStatus.ACTIVE]: { label: "Ativo", cls: "bg-brand-50 text-brand-700 ring-brand-600/20" },
    [BatchStatus.RECALLED]: { label: "Recall", cls: "bg-red-50 text-red-700 ring-red-600/20" },
    [BatchStatus.DESTROYED]: { label: "Descartado", cls: "bg-neutral-100 text-neutral-600 ring-neutral-500/20" },
  };
  const s = map[status] ?? map[0]!;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function AnchorBadge({ anchoredAt }: { anchoredAt: string | null }) {
  return anchoredAt ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
      Publicado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      Pendente
    </span>
  );
}

export function EventPill({ eventType }: { eventType: EventType }) {
  return (
    <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
      {eventLabel(eventType)}
    </span>
  );
}
