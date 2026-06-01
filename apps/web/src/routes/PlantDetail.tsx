import type { BatchDTO, EventDTO } from "@kolibri/types";
import { ALL_EVENT_TYPES, eventLabel } from "@kolibri/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnchorBadge, EventPill, StatusChip } from "../components/badges";
import { EventForm } from "../components/EventForm";
import { Layout } from "../components/Layout";
import { api } from "../lib/api";
import { explorerAddr, explorerTx, fmtDate, shortAddr } from "../lib/format";

interface PlantResp {
  batch: BatchDTO;
  events: EventDTO[];
}

const LIFECYCLE_TYPES = ALL_EVENT_TYPES.filter((t) => t > 2);

const inputCls =
  "rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

export function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["plant", id],
    queryFn: () => api.get<PlantResp>(`/plants/${id}`),
    refetchInterval: 5000,
  });

  const [eventType, setEventType] = useState<number>(6); // HARVEST
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addEvent = async (payload: Record<string, unknown>) => {
    setSubmitting(true);
    setErr(null);
    try {
      await api.post(`/plants/${id}/events`, { eventType, payload });
      await qc.invalidateQueries({ queryKey: ["plant", id] });
      setShowForm(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !data) {
    return (
      <Layout>
        <p className="text-neutral-400">Carregando…</p>
      </Layout>
    );
  }

  const { batch, events } = data;

  return (
    <Layout>
      <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Plantas
      </Link>

      <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {batch.cultivarFull ?? batch.cultivarCode}
            </h1>
            <div className="mt-1 font-mono text-xs text-neutral-400">{batch.id}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <StatusChip status={batch.status} />
              <AnchorBadge anchoredAt={batch.anchor.anchoredAt} />
            </div>
            <Link
              to={`/passport/${batch.id}`}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Ver passaporte público →
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 text-sm sm:grid-cols-4">
          <Info label="Genótipo" value={batch.genotype ?? "—"} />
          <Info
            label="PDA on-chain"
            value={
              batch.anchor.pda ? (
                <a className="text-brand-600 hover:underline" href={explorerAddr(batch.anchor.pda)} target="_blank" rel="noreferrer">
                  {shortAddr(batch.anchor.pda, 5)}
                </a>
              ) : (
                "pendente"
              )
            }
          />
          <Info
            label="NFT"
            value={
              batch.anchor.asset ? (
                <a className="text-brand-600 hover:underline" href={explorerAddr(batch.anchor.asset)} target="_blank" rel="noreferrer">
                  {shortAddr(batch.anchor.asset, 5)}
                </a>
              ) : (
                "—"
              )
            }
          />
          <Info label="Eventos" value={String(batch.eventCount)} />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Linha do tempo</h2>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {showForm ? "Cancelar" : "+ Registrar evento"}
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6">
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Tipo de evento</span>
            <select
              className={inputCls}
              value={eventType}
              onChange={(e) => setEventType(Number(e.target.value))}
            >
              {LIFECYCLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {eventLabel(t)}
                </option>
              ))}
            </select>
          </label>
          <EventForm key={eventType} eventType={eventType} onSubmit={addEvent} submitting={submitting} />
          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        </div>
      )}

      <ol className="mt-6 space-y-3">
        {events.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                {e.index}
              </span>
              <div>
                <EventPill eventType={e.eventType} />
                <div className="mt-1 font-mono text-[11px] text-neutral-400">
                  sha256 {e.payloadHash.slice(0, 16)}…
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span>{fmtDate(e.createdAt)}</span>
              <AnchorBadge anchoredAt={e.anchoredAt} />
              {e.solanaTxSig && (
                <a className="text-brand-600 hover:underline" href={explorerTx(e.solanaTxSig)} target="_blank" rel="noreferrer">
                  Ver transação ↗
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Layout>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-0.5 font-medium text-ink">{value}</div>
    </div>
  );
}
