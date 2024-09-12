import { getAuthUser } from "./../../utils/helpers";
import { FastifyInstance, FastifyRequest } from "fastify";
import { CategorySchema } from "../../schemas/category.schema";
import { ObjectId } from "@fastify/mongodb";

type GetParams = { Params: { id: string } };

export default async function (fastify: FastifyInstance, opt: any) {
  const CategoryCollection = fastify.mongo.db?.collection("category");

  /**
   * Method: POST
   * URL: /category
   * @param {CategorySchema}
   */
  fastify.put("/", async (req, res) => {
    const user = await getAuthUser(fastify, req);
    const validation = CategorySchema.safeParse(req.body);

    if (user?.role !== "ADMIN") {
      return res
        .status(403)
        .send({ message: "User don't have permission to call this Endpoint" });
    }

    if (!validation.success) {
      return res.status(400).send(validation.error.issues);
    }

    // let existingCategory = CategoryCollection?.findOne({
    //   $text: { $search: validation.data.category },
    // });

    // if (existingCategory) {
    //   return res
    //     .status(400)
    //     .send({ message: "Category already exists already" });
    // }

    let category = await CategoryCollection?.insertOne({ ...validation.data });
    return res.status(200).send({
      message: "Category created successfully",
      data: { ...validation.data, _id: category?.insertedId },
    });
  });

  /**
   * Method: GET
   * URL: /category/:id
   * @param {id}
   */
  fastify.get("/:id", async (req: FastifyRequest<GetParams>, res) => {
    if (!req.params?.id) {
      const category = await CategoryCollection?.find({
        isActive: true,
      }).toArray();

      return res
        .status(200)
        .send({ message: "All Category Fetched", data: category });
    }
    const category = await CategoryCollection?.findOne({
      _id: new ObjectId(req?.params?.id),
    });
    return {
      data: category,
      message: "Category fetched successfully",
    };
  });

  /**
   * Method: PATCH
   * URL: /category/:id
   * @param {id}
   */
  fastify.patch("/:id", async (req: FastifyRequest<GetParams>, res) => {
    const user = await getAuthUser(fastify, req);
    const validation = CategorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).send(validation.error?.issues);
    }

    if (user?.role != "ADMIN") {
      return res
        .status(403)
        .send({ message: "User don't have permission to call this Endpoint" });
    }
    CategoryCollection?.updateOne(
      { _id: new ObjectId(req?.params?.id) },
      { $set: { category: validation.data?.category } }
    );
    return res.status(200).send({ message: "Category updated successfully" });
  });

  /**
   * Method: DELETE
   * URL: /categoy/:id
   * @param {id}
   */
  fastify.delete("/:id", async (req: FastifyRequest<GetParams>, res) => {
    const user = await getAuthUser(fastify, req);
    if (user?.role != "ADMIN") {
      return res
        .status(403)
        .send({ message: "User don't have permission to call this Endpoint" });
    }
    CategoryCollection?.deleteOne({ _id: new ObjectId(req?.params?.id) });
    return res.status(200).send({ message: "Category deleted successfully" });
  });
}
