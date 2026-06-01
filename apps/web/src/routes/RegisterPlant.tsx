import type { BatchDTO } from "@kolibri/types";
import { EventType, eventLabel } from "@kolibri/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventForm } from "../components/EventForm";
import { Layout } from "../components/Layout";
import { api } from "../lib/api";

const ORIGIN_TYPES = [EventType.MOTHER_REGISTERED, EventType.SEED_PLANTED];

const inputCls =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

export function RegisterPlant() {
  const [cultivarCode, setCultivarCode] = useState("");
  const [originType, setOriginType] = useState<number>(EventType.MOTHER_REGISTERED);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();
  const qc = useQueryClient();

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (!cultivarCode.trim()) {
      setErr("Informe o código do cultivar.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const body = {
        cultivarCode: cultivarCode.trim().slice(0, 16),
        cultivarFull: (payload.cultivar_full as string | undefined) ?? undefined,
        genotype: (payload.genotype as string | undefined) ?? undefined,
        originEventType: originType,
        imageUri: (payload.photos as string[] | undefined)?.[0],
        payload,
      };
      const batch = await api.post<BatchDTO>("/plants", body);
      await qc.invalidateQueries({ queryKey: ["plants"] });
      nav(`/plant/${batch.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold tracking-tight">Nova planta</h1>
      <p className="text-sm text-neutral-500">
        Registra a origem da planta — o início da rastreabilidade.
      </p>

      <div className="mt-6 max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Código do cultivar <span className="text-red-500">*</span>
            </span>
            <input
              className={inputCls}
              value={cultivarCode}
              maxLength={16}
              placeholder="HEM:CBD1"
              onChange={(e) => setCultivarCode(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Tipo de origem</span>
            <select
              className={inputCls}
              value={originType}
              onChange={(e) => setOriginType(Number(e.target.value))}
            >
              {ORIGIN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {eventLabel(t)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="my-5 border-t border-neutral-100" />

        <EventForm
          key={originType}
          eventType={originType}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Registrar planta"
        />
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      </div>
    </Layout>
  );
}
