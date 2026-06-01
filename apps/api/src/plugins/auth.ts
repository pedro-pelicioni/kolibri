import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { env } from "../env.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; did: string; typ?: string };
    user: { sub: string; did: string; typ?: string };
  }
}

export default fp(async (app: FastifyInstance) => {
  await app.register(jwt, { secret: env.JWT_SECRET });
  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      await reply.code(401).send({ error: "unauthorized" });
    }
  });
});
