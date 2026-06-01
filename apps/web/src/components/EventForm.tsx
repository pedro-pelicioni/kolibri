import { useState } from "react";
import { api } from "../lib/api";
import {
  EVENT_FIELDS,
  type FieldSpec,
  type UploadArtifact,
  buildEventPayloadData,
} from "../lib/eventFields";

const inputCls =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

function Field({
  f,
  value,
  onChange,
  onFile,
  uploaded,
  uploading,
}: {
  f: FieldSpec;
  value: string;
  onChange: (v: string) => void;
  onFile: (file: File) => void;
  uploaded: boolean;
  uploading: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">
        {f.label}
        {f.required && <span className="text-red-500"> *</span>}
      </span>
      {f.kind === "select" ? (
        <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {f.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : f.kind === "photo" || f.kind === "coa" ? (
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept={f.kind === "coa" ? "application/pdf,image/*" : "image/*"}
            className="text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
          {uploading && <span className="text-xs text-neutral-400">enviando…</span>}
          {uploaded && <span className="text-xs text-brand-600">✓ enviado</span>}
        </div>
      ) : (
        <input
          className={inputCls}
          type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text"}
          step="any"
          value={value}
          placeholder={f.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {f.hint && <span className="mt-1 block text-xs text-neutral-400">{f.hint}</span>}
    </label>
  );
}

export function EventForm({
  eventType,
  onSubmit,
  submitting,
  submitLabel = "Registrar evento",
}: {
  eventType: number;
  onSubmit: (payload: Record<string, unknown>) => void;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const fields = EVENT_FIELDS[eventType] ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Record<string, UploadArtifact>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFile = async (f: FieldSpec, file: File) => {
    setUploading(f.key);
    try {
      const form = new FormData();
      form.append("file", file);
      const path = f.kind === "coa" ? "/upload/coa" : "/upload/photo";
      const res = await api.postForm<UploadArtifact>(path, form);
      setUploads((s) => ({ ...s, [f.key]: res }));
    } finally {
      setUploading(null);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(buildEventPayloadData(fields, values, uploads));
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <Field
            key={f.key}
            f={f}
            value={values[f.key] ?? ""}
            onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
            onFile={(file) => handleFile(f, file)}
            uploaded={!!uploads[f.key]}
            uploading={uploading === f.key}
          />
        ))}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}
