// Compliance relay — recall (todos os roles autorizados), score/dpia (admin).
// Bate em mcp.dpo2u.com via gateway, nunca direto pelo app.

import { config } from '../config';
import { api } from './client';

export interface RecallInput {
  mode: 'individual' | 'mass';
  reasonCode: string;
  reasonText: string;
  affectedBatchIds: string[];
  anvisaNoticeUri?: string;
}

export interface ComplianceScore {
  score: number;
  jurisdiction: string;
  gaps?: string[];
  [k: string]: unknown;
}

export async function openRecall(input: RecallInput): Promise<{ recall_id?: string }> {
  if (config.useStub) {
    return { recall_id: 'recall-stub-' + Date.now() };
  }
  return api('/compliance/recall', {
    method: 'POST',
    body: {
      mode: input.mode,
      reason_code: input.reasonCode,
      reason_text: input.reasonText,
      affected_batch_ids: input.affectedBatchIds,
      ...(input.anvisaNoticeUri ? { anvisa_notice_uri: input.anvisaNoticeUri } : {}),
    },
  });
}

export async function getComplianceScore(): Promise<ComplianceScore> {
  if (config.useStub) {
    return { score: 87, jurisdiction: 'LGPD' };
  }
  return api<ComplianceScore>('/compliance/score');
}

export async function runDpia(): Promise<unknown> {
  if (config.useStub) return { status: 'stub' };
  return api('/compliance/dpia');
}
