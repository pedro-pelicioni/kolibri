import { randomBytes } from "node:crypto";
import { verifySignIn } from "@solana/wallet-standard-util";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../env.js";

function b64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

export async function authRoutes(app: FastifyInstance) {
  // 1) CHALLENGE — emite o SolanaSignInInput e guarda o nonce single-use.
  app.post("/auth/siws/challenge", async (req) => {
    const { pubkey, domain, uri } = z
      .object({
        pubkey: z.string().min(32),
        domain: z.string().optional(),
        uri: z.string().optional(),
      })
      .parse(req.body);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60_000);
    const nonce = randomBytes(16).toString("hex"); // 32 chars (>=8)
    // domain/uri vêm do navegador (window.location) p/ casar com a origem real e
    // evitar mismatch no Phantom; fallback p/ o env.
    const dom = domain ?? env.APP_DOMAIN;

    const input = {
      domain: dom,
      address: pubkey,
      // ASCII puro: o SIWS (EIP-4361) não aceita Unicode no statement — Phantom
      // rejeita com "invalid formatting" se houver travessão/acento aqui.
      statement: "Entrar no Kolibri - rastreabilidade da planta.",
      uri: uri ?? `http://${dom}`,
      version: "1",
      chainId: env.SOLANA_CLUSTER,
      nonce,
      issuedAt: now.toISOString(),
      expirationTime: expiresAt.toISOString(),
    };

    await app.prisma.authNonce.create({
      data: { nonce, pubkey, inputJson: input, expiresAt },
    });

    return { input };
  });

  // 2) VERIFY — valida a assinatura usando o input ARMAZENADO (anti-tamper) e emite JWT.
  app.post("/auth/siws/verify", async (req, reply) => {
    const body = z
      .object({
        input: z.object({ nonce: z.string() }).passthrough(),
        output: z.object({
          account: z.object({ address: z.string(), publicKey: z.string() }),
          signature: z.string(),
          signedMessage: z.string(),
          signatureType: z.string().optional(),
        }),
      })
      .parse(req.body);

    const row = await app.prisma.authNonce.findUnique({
      where: { nonce: body.input.nonce },
    });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      return reply.code(400).send({ error: "nonce inválido ou expirado" });
    }

    const output = {
      account: {
        address: body.output.account.address,
        publicKey: b64ToBytes(body.output.account.publicKey),
      },
      signature: b64ToBytes(body.output.signature),
      signedMessage: b64ToBytes(body.output.signedMessage),
      signatureType: "ed25519" as const,
    };

    // usa o input do servidor (não o do cliente) pra verificar
    const ok = verifySignIn(
      row.inputJson as never,
      output as never,
    );
    if (!ok) return reply.code(401).send({ error: "assinatura inválida" });
    if (body.output.account.address !== row.pubkey) {
      return reply.code(401).send({ error: "endereço não confere" });
    }

    await app.prisma.authNonce.update({
      where: { nonce: row.nonce },
      data: { usedAt: new Date() },
    });

    const dispensary = await app.prisma.dispensary.upsert({
      where: { walletPubkey: row.pubkey! },
      update: {},
      create: { walletPubkey: row.pubkey! },
    });

    const accessToken = app.jwt.sign(
      { sub: dispensary.walletPubkey, did: dispensary.id },
      { expiresIn: "15m" },
    );
    const refreshToken = app.jwt.sign(
      { sub: dispensary.walletPubkey, did: dispensary.id, typ: "refresh" },
      { expiresIn: "7d" },
    );

    return {
      accessToken,
      refreshToken,
      dispensary: {
        id: dispensary.id,
        walletPubkey: dispensary.walletPubkey,
        name: dispensary.name,
      },
    };
  });

  // 3) REFRESH
  app.post("/auth/refresh", async (req, reply) => {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    try {
      const payload = app.jwt.verify<{ sub: string; did: string }>(refreshToken);
      const accessToken = app.jwt.sign(
        { sub: payload.sub, did: payload.did },
        { expiresIn: "15m" },
      );
      return { accessToken };
    } catch {
      return reply.code(401).send({ error: "refresh inválido" });
    }
  });
}
