import type { BadgeDTO, EventDTO, PassportDTO, VerifyDataDTO } from "@kolibri/types";
import { eventLabel } from "@kolibri/types";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { AnchorBadge, EventPill } from "../components/badges";
import { CircularGauge } from "../components/passport/CircularGauge";
import { api } from "../lib/api";
import { explorerAddr, explorerTx, fmtDate, shortAddr } from "../lib/format";
import { type VerifyResult, verifyPassport } from "../lib/verify";

const TABS = ["Geral", "Genética", "Certificados", "Documentos", "Linha do tempo"] as const;
type Tab = (typeof TABS)[number];

const toneCls: Record<BadgeDTO["tone"], string> = {
  anvisa: "bg-brand-50 text-brand-700 ring-brand-600/20",
  lab: "bg-sky-50 text-sky-700 ring-sky-600/20",
  iso: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  quality: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function Passport() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["passport", id],
    queryFn: () => api.get<PassportDTO>(`/passport/${id}`),
  });
  const [tab, setTab] = useState<Tab>("Geral");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  const runVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const vd = await api.get<VerifyDataDTO>(`/passport/${id}/verify-data`);
      setVerifyResult(await verifyPassport(vd));
    } catch {
      setVerifyResult(null);
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading) {
    return <Centered>Carregando passaporte…</Centered>;
  }
  if (isError || !data) {
    return <Centered>Passaporte não encontrado.</Centered>;
  }

  const { batch, events, gauges, badges, publishedAt } = data;
  const origin = events.find((e) => e.index === 0) ?? events[0];
  const image = batch.imageUri ?? "/be-the-change.svg";
  const passportUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-dvh bg-neutral-50 py-8 text-ink">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header card */}
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1.2fr_auto_1fr]">
            {/* esquerda */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Product Passport ID
                </span>
                <AnchorBadge anchoredAt={publishedAt} />
              </div>
              <div className="mt-1 font-mono text-lg font-bold tracking-tight">
                {batch.id.slice(0, 16)}
              </div>
              <div className="mt-4 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Produto
              </div>
              <div className="text-lg font-semibold">{batch.cultivarFull ?? batch.cultivarCode}</div>
              <div className="mt-4 flex gap-6 text-xs text-neutral-400">
                <span>Criado {fmtDate(batch.createdAt)}</span>
                <span>Publicado {fmtDate(publishedAt)}</span>
              </div>
            </div>
            {/* QR */}
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-xl border-2 border-brand-500 p-2">
                <QRCodeSVG value={passportUrl} size={128} bgColor="#ffffff" fgColor="#0b1f17" />
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="mt-2 text-xs text-neutral-400 hover:text-neutral-600"
              >
                Imprimir
              </button>
            </div>
            {/* imagem + emissor */}
            <div className="flex flex-col gap-4">
              <div className="grid h-28 place-items-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                <img src={image} alt="" className="max-h-24 object-contain" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Responsável (DPP)
                </div>
                <div className="text-sm font-semibold">
                  {batch.dispensaryName ?? shortAddr(batch.dispensaryWallet, 5)}
                </div>
                <div className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Emissor
                </div>
                <div className="text-sm font-semibold">Kolibri</div>
              </div>
            </div>
          </div>

          {/* Sustentabilidade + Compliance */}
          <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-6">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Sustentabilidade & rastreabilidade
            </div>
            <div className="mt-4 flex flex-wrap items-start gap-8">
              {gauges.map((g) => (
                <CircularGauge key={g.key} value={g.value} label={g.label} />
              ))}
            </div>

            <div className="mt-6 text-xs font-medium uppercase tracking-wide text-neutral-400">
              Conformidade
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b.key}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${
                    b.active ? toneCls[b.tone] : "bg-neutral-100 text-neutral-400 ring-neutral-300"
                  }`}
                >
                  <span>{b.active ? "✓" : "○"}</span>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Verify */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm text-neutral-600">
            Prova de existência (PoE) ancorada na Solana — recalcule os hashes e confira on-chain.
          </div>
          <button
            type="button"
            onClick={runVerify}
            disabled={verifying}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {verifying ? "Verificando…" : "Verificar on-chain"}
          </button>
        </div>
        {verifyResult && <VerifyBanner result={verifyResult} pda={batch.anchor.pda} />}

        {/* Tabs */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-1 border-b border-neutral-200">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                  tab === t
                    ? "border-b-2 border-brand-600 text-brand-700"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="rounded-b-2xl border border-t-0 border-neutral-200 bg-white p-6">
            <TabContent tab={tab} data={data} origin={origin} />
          </div>
        </div>

        <div className="py-8 text-center text-xs text-neutral-400">
          Imagem meramente ilustrativa. Kolibri • rastreabilidade da planta.
        </div>
      </div>
    </div>
  );
}

function VerifyBanner({ result, pda }: { result: VerifyResult; pda: string | null }) {
  const ok = result.ok;
  return (
    <div
      className={`mt-3 rounded-2xl border p-4 text-sm ${
        ok ? "border-brand-200 bg-brand-50 text-brand-800" : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <div className="font-semibold">
        {ok ? "✓ Verificado on-chain" : "⚠ Verificação parcial"}
      </div>
      <ul className="mt-1 space-y-0.5 text-xs">
        <li>
          {result.matched}/{result.total} eventos com sha256 conferido (recomputado no navegador).
        </li>
        <li>
          Conta Batch on-chain: {result.onChainFound ? "encontrada" : "não encontrada"}
          {pda && (
            <>
              {" "}
              <a className="underline" href={explorerAddr(pda)} target="_blank" rel="noreferrer">
                ver no Explorer ↗
              </a>
            </>
          )}
        </li>
        {result.lastHashMatches !== null && (
          <li>Hash do último evento on-chain: {result.lastHashMatches ? "confere" : "divergente"}.</li>
        )}
      </ul>
    </div>
  );
}

function TabContent({
  tab,
  data,
  origin,
}: {
  tab: Tab;
  data: PassportDTO;
  origin: EventDTO | undefined;
}) {
  const { batch, events } = data;
  if (tab === "Geral") {
    return (
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Row label="Responsável" value={batch.dispensaryName ?? shortAddr(batch.dispensaryWallet, 6)} />
        <Row label="Emissor" value="Kolibri" />
        <Row label="Origem" value={eventLabel(batch.originEventType)} />
        <Row label="Cluster" value={batch.anchor.cluster} />
        <Row
          label="Programa"
          value={
            batch.anchor.programId ? (
              <a className="text-brand-600 hover:underline" href={explorerAddr(batch.anchor.programId)} target="_blank" rel="noreferrer">
                {shortAddr(batch.anchor.programId, 6)}
              </a>
            ) : (
              "—"
            )
          }
        />
        <Row
          label="PDA"
          value={
            batch.anchor.pda ? (
              <a className="text-brand-600 hover:underline" href={explorerAddr(batch.anchor.pda)} target="_blank" rel="noreferrer">
                {shortAddr(batch.anchor.pda, 6)}
              </a>
            ) : (
              "pendente"
            )
          }
        />
      </dl>
    );
  }
  if (tab === "Genética") {
    const p = (origin?.payload ?? {}) as Record<string, unknown>;
    return (
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Row label="Cultivar" value={batch.cultivarFull ?? batch.cultivarCode} />
        <Row label="Genótipo" value={batch.genotype ?? (p.genotype as string) ?? "—"} />
        <Row label="Fenótipo / origem" value={(p.phenotype_notes as string) ?? "—"} />
      </dl>
    );
  }
  if (tab === "Certificados") {
    const labs = events.filter((e) => e.eventType === 10);
    if (!labs.length) return <Empty>Nenhum laudo (COA) registrado.</Empty>;
    return (
      <div className="space-y-3">
        {labs.map((e) => {
          const p = (e.payload ?? {}) as Record<string, unknown>;
          return (
            <div key={e.id} className="rounded-xl border border-neutral-200 p-4 text-sm">
              <div className="font-medium">Laudo laboratorial (COA)</div>
              <div className="mt-1 text-neutral-500">
                THC {String(p.thc_pct ?? "—")}% · CBD {String(p.cbd_pct ?? "—")}%
              </div>
              {typeof p.coa_uri === "string" && (
                <a className="mt-1 inline-block text-brand-600 hover:underline" href={p.coa_uri} target="_blank" rel="noreferrer">
                  Abrir COA ↗
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  if (tab === "Documentos") {
    const docs: string[] = [];
    for (const e of events) {
      const p = (e.payload ?? {}) as Record<string, unknown>;
      if (Array.isArray(p.photos)) docs.push(...(p.photos as string[]));
      if (typeof p.coa_uri === "string") docs.push(p.coa_uri);
    }
    if (!docs.length) return <Empty>Nenhum documento anexado.</Empty>;
    return (
      <ul className="space-y-2 text-sm">
        {docs.map((d, i) => (
          <li key={i}>
            <a className="text-brand-600 hover:underline" href={d} target="_blank" rel="noreferrer">
              {d.split("/").pop() ?? d} ↗
            </a>
          </li>
        ))}
      </ul>
    );
  }
  // Linha do tempo
  return (
    <ol className="space-y-3">
      {events.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
              {e.index}
            </span>
            <div>
              <EventPill eventType={e.eventType} />
              <div className="mt-1 font-mono text-[11px] text-neutral-400">
                sha256 {e.payloadHash.slice(0, 20)}…
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
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-sm text-neutral-400">{children}</div>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-dvh place-items-center text-neutral-400">{children}</div>;
}
