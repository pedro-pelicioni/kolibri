import { mkdirSync } from "node:fs";
import path from "node:path";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fstatic from "@fastify/static";
import Fastify from "fastify";
import { ZodError } from "zod";
import { env } from "./env.js";
import authPlugin from "./plugins/auth.js";
import prismaPlugin from "./plugins/prisma.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { passportRoutes } from "./routes/passport.js";
import { plantRoutes } from "./routes/plants.js";
import { uploadRoutes } from "./routes/uploads.js";
import { startAnchorWorker } from "./services/anchor-worker.js";

async function main() {
  const app = Fastify({
    logger: {
      transport:
        env.NODE_ENV === "production"
          ? undefined
          : {
              target: "pino-pretty",
              options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" },
            },
    },
  });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({ error: "validação", details: err.issues });
    }
    req.log.error(err);
    const e = err as { statusCode?: number; message?: string };
    return reply.code(e.statusCode ?? 500).send({ error: e.message ?? "erro interno" });
  });

  await app.register(cors, { origin: true });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { max: 600, timeWindow: "1 minute" });
  await app.register(multipart, { limits: { fileSize: 15 * 1024 * 1024 } });

  await app.register(prismaPlugin);
  await app.register(authPlugin);

  const uploadRoot = path.resolve(env.UPLOAD_DIR);
  mkdirSync(uploadRoot, { recursive: true });
  await app.register(fstatic, { root: uploadRoot, prefix: "/uploads/" });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(plantRoutes);
  await app.register(passportRoutes);
  await app.register(uploadRoutes);

  const stopWorker = startAnchorWorker(app);
  app.addHook("onClose", async () => stopWorker());

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`kolibri-api on http://localhost:${env.PORT} (cluster=${env.SOLANA_CLUSTER})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
