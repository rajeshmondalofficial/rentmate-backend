const fastifyPlugin = require("fastify-plugin");
const fastifyMulter = require("fastify-multer");

async function storageConnector(fastify, options) {
  fastify.register(fastifyMulter.contentParser);
}

module.exports = fastifyPlugin(storageConnector);
