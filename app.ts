import path from "path";
import AutoLoad from "@fastify/autoload";
import fastifyJwt from "@fastify/jwt";
import fastify from "fastify";

const server = fastify();

server.register(AutoLoad, {
  dir: path.join(__dirname, "plugins"),
  options: {},
});

server.register(AutoLoad, {
  dir: path.join(__dirname, "controllers"),
  options: {},
});

server.register(fastifyJwt, { secret: "supersecretkey" });

server.addHook("onRequest", async function (request, reply) {
  const { url } = request.routeOptions;
  if (url && /(documentation)|(auth)/g.test(url)) {
    return true;
  }
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
