import { FastifyInstance } from "fastify";

export default async function (fastify: FastifyInstance, opts: any) {
  fastify.get("/", async function (request, response) {
    return response.status(200).send({ name: "Root" });
  });
}
