import type { BatchDTO } from "@kolibri/types";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AnchorBadge, StatusChip } from "../components/badges";
import { Layout } from "../components/Layout";
import { api } from "../lib/api";
import { fmtDate } from "../lib/format";

interface PlantsResp {
  items: BatchDTO[];
  metrics: { total: number; active: number; recalled: number; anchoredPct: number };
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["plants"],
    queryFn: () => api.get<PlantsResp>("/plants"),
    refetchInterval: 5000,
  });

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plantas</h1>
          <p className="text-sm text-neutral-500">
            Rastreabilidade seed-to-sale ancorada na Solana.
          </p>
        </div>
        <Link
          to="/register"
          className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700"
        >
          + Nova planta
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Total" value={data?.metrics.total ?? "—"} />
        <Metric label="Ativas" value={data?.metrics.active ?? "—"} />
        <Metric label="Recalls" value={data?.metrics.recalled ?? "—"} />
        <Metric label="% ancorado" value={data ? `${data.metrics.anchoredPct}%` : "—"} />
      </div>

      <div className="mt-8">
        {isLoading ? (
          <p className="text-neutral-400">Carregando…</p>
        ) : !data?.items.length ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <p className="text-neutral-500">Nenhuma planta ainda.</p>
            <Link to="/register" className="mt-2 inline-block font-medium text-brand-600">
              Registrar a primeira planta →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((b) => (
              <PlantCard key={b.id} batch={b} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function PlantCard({ batch }: { batch: BatchDTO }) {
  return (
    <Link
      to={`/plant/${batch.id}`}
      className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-ink">{batch.cultivarFull ?? batch.cultivarCode}</div>
          <div className="font-mono text-xs text-neutral-400">{batch.id.slice(0, 12)}…</div>
        </div>
        <StatusChip status={batch.status} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <AnchorBadge anchoredAt={batch.anchor.anchoredAt} />
        <span className="text-xs text-neutral-400">{batch.eventCount} eventos</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-400">
        <span>{fmtDate(batch.createdAt)}</span>
        {batch.anchor.asset && <span className="font-medium text-brand-600">NFT ✓</span>}
      </div>
    </Link>
  );
}
