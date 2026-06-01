import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { sha256Hex } from "@kolibri/sdk";
import type { UploadResultDTO } from "@kolibri/types";
import { env } from "../env.js";

/** Salva um arquivo no storage local (MVP) e devolve URI pública + hash. */
export async function saveUpload(
  buf: Buffer,
  ext: string,
  contentType: string,
): Promise<UploadResultDTO> {
  await mkdir(env.UPLOAD_DIR, { recursive: true });
  const sha = sha256Hex(new Uint8Array(buf));
  const filename = `${sha}${ext}`;
  await writeFile(path.join(env.UPLOAD_DIR, filename), buf);
  return {
    storageUri: `${env.API_PUBLIC_URL}/uploads/${filename}`,
    sha256Hex: sha,
    bytes: buf.length,
    contentType,
  };
}
