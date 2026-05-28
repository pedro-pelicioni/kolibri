// Upload de foto (multipart) + payload JSON canônico.
//
// Foto: usa o pattern do React Native pra fetch multipart (FormData com
//   { uri, type, name } — RN reconhece e empacota stream-friendly).
// Payload: chamada simples — gateway responde com hash canônico que o app
//   pode comparar com o `payload_hash` retornado pelo /tx/build/cannabis-event.

import { api, apiUpload } from './client';
import { config } from '../config';

export interface PhotoUploadResult {
  storage_uri: string;
  width?: number;
  height?: number;
  payload_hash?: string;
}

export interface PayloadUploadResult {
  storage_uri: string;
  payload_hash: string;
  canonical_bytes: number;
}

export async function uploadPhoto(
  localUri: string,
  mimetype: string = 'image/jpeg',
): Promise<PhotoUploadResult> {
  if (config.useStub) {
    return {
      storage_uri: `shdw://kolibri/stub/${Date.now()}.jpg`,
      payload_hash: 'stub-' + Math.random().toString(36).slice(2, 18),
    };
  }
  const form = new FormData();
  form.append('file', {
    uri: localUri,
    type: mimetype,
    name: 'photo.jpg',
  } as unknown as Blob);
  return apiUpload<PhotoUploadResult>('/upload/photo', form);
}

export async function uploadPayload(payload: Record<string, unknown>): Promise<PayloadUploadResult> {
  if (config.useStub) {
    return {
      storage_uri: `shdw://kolibri/stub/${Date.now()}.json`,
      payload_hash: 'stub-' + Math.random().toString(36).slice(2, 18),
      canonical_bytes: JSON.stringify(payload).length,
    };
  }
  return api<PayloadUploadResult>('/upload/payload', {
    method: 'POST',
    body: { payload },
  });
}
