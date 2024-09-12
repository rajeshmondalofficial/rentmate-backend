import { FastifyInstance } from "fastify";

export default async function (fastify: FastifyInstance, opt: any) {
  /**
   * Method: GET
   * URL: /peroperty
   * @param {PropertySchema}
   */
  fastify.get("/:id", async (req, res) => {});

  /**
   * Method: POST
   * URL: /property
   * @param {PropertySchema}
   */
  fastify.post("/", async (req, res) => {});

  /**
   * Method: PATCH
   * URL: /property/:id
   * @param {PropertySchema}
   */
  fastify.patch("/:id", async (req, res) => {});

  /**
   * Method: DELETE
   * URL: /property/:id
   * @param {id}
   */
  fastify.delete("/:id", async (req, res) => {});
}
