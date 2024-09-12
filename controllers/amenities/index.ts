import { ObjectId } from "@fastify/mongodb";
import { FastifyInstance, FastifyRequest } from "fastify";
import {
  AmenitiesSchema,
  UpdateAmenitiesSchema,
} from "../../schemas/amenities.schema";
import { upload } from "../../utils";

type GetParams = {
  Params: { id: string };
  file?: any;
};

export default async function (fastify: FastifyInstance, opt: any) {
  const AmenitiesCollection = fastify.mongo.db?.collection("amenities");

  /**
   * Method: GET
   * URL: /amenities/{id}
   * @param {id}
   */
  fastify.get("/:id", async (req: FastifyRequest<GetParams>, res) => {
    if (req.params.id) {
      const amenities = await AmenitiesCollection?.findOne({
        _id: new ObjectId(req.params.id),
      });
      return {
        data: amenities,
        message: "Amenity fetched successfully",
      };
    }
    const amenities = await AmenitiesCollection?.find({
      isActive: true,
    }).toArray();
    return res
      .status(200)
      .send({ message: "All Amenities Fetched", data: amenities });
  });

  /**
   * Method: POST
   * URL: /amenities
   * @param {id}
   */
  fastify.post(
    "/",
    { preHandler: upload.single("icon") },
    async (req: any, res) => {
      const validation = AmenitiesSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).send(validation.error.issues);
      }

      if (!req?.file) {
        return res.status(400).send({ message: "Amenities icon is required" });
      }

      const amenitiesData = {
        ...validation.data,
        icon: req.file?.filename,
        isActive: true,
      };

      let amenities = await AmenitiesCollection?.insertOne(amenitiesData);
      return res.status(201).send({
        message: "Amenity created successfully",
        data: { ...amenitiesData, _id: amenities?.insertedId },
      });
    }
  );

  /**
   * Method: PATCH
   * URL: /amenities
   * @param {AmenitiesSchema}
   */
  fastify.patch(
    "/:id",
    { preHandler: upload.single("icon") },
    async (req: any, res) => {
      let validation = UpdateAmenitiesSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).send(validation.error.issues);
      }

      if (req?.file) {
        AmenitiesCollection?.findOneAndUpdate(
          {
            _id: new ObjectId(req.params?.id),
          },
          { $set: { ...validation.data, icon: req?.file?.filename } }
        );
        return res
          .status(200)
          .send({ message: "Amenities Updated Successfully" });
      } else {
        AmenitiesCollection?.findOneAndUpdate(
          {
            _id: new ObjectId(req.params?.id),
          },
          { $set: { ...validation.data, icon: req?.file?.filename } }
        );
        return res.status(200).send({});
      }
    }
  );
}
