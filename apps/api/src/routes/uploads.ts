import path from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { saveUpload } from "../lib/storage.js";

export async function uploadRoutes(app: FastifyInstance) {
  const handler = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "sem arquivo" });
    const buf = await data.toBuffer();
    const ext = path.extname(data.filename ?? "") || ".bin";
    const result = await saveUpload(buf, ext, data.mimetype);
    await app.prisma.upload.create({
      data: {
        storageUri: result.storageUri,
        sha256Hex: result.sha256Hex,
        bytes: result.bytes,
        contentType: result.contentType,
      },
    });
    return result;
  };

  app.post("/upload/photo", { preHandler: [app.authenticate] }, handler);
  app.post("/upload/coa", { preHandler: [app.authenticate] }, handler);
}
