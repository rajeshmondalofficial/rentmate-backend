import { ObjectId } from "@fastify/mongodb";
import {
  ApprovePropertySchema,
  PropertySchema,
  UpdatePropertySchema,
} from "./../../schemas/property.schema";
import { FastifyInstance, FastifyRequest } from "fastify";
import { getAuthUser } from "../../utils";

type GetParams = {
  Params: { id: string; amenitiesId: string };
  Querystring: { status: string };
};

export default async function (fastify: FastifyInstance, opt: any) {
  const PropertyCollection = fastify.mongo.db?.collection("property");
  const PropertyNotes = fastify.mongo.db?.collection("property_notes");

  /**
   * Method: POST
   * URL: /property/approve-property
   * Role: ADMIN
   */
  fastify.post("/approve-property", async (req, res) => {
    const user = await getAuthUser(fastify, req);
    if (!user?.role || user?.role !== "ADMIN") {
      return res.status(403).send({
        message: "You don't have permission to access this api resources",
      });
    }
    const property = ApprovePropertySchema.safeParse(req.body);
    if (!property.success) {
      return res.status(400).send(property.error.issues);
    }
    await PropertyCollection?.updateOne(
      { _id: new ObjectId(property?.data?.propertyId) },
      {
        $set: { status: property.data?.status },
      }
    );
    if (property?.data?.status) {
      await PropertyNotes?.insertOne({
        note: property?.data?.note,
        propertyId: new ObjectId(property?.data?.propertyId),
      });
    }
    return res
      .status(200)
      .send({ message: "Property status updated successfully" });
  });

  /**
   * Method: GET
   * URL: /property/all-properties
   * Role: ADMIN
   */
  fastify.get(
    "/all-properties",
    async (req: FastifyRequest<GetParams>, res) => {
      const user = await getAuthUser(fastify, req);
      if (!user?.role || user?.role !== "ADMIN") {
        return res.status(403).send({
          message: "You don't have permission to access this api resources",
        });
      }
      let property = await PropertyCollection?.aggregate([
        {
          $match: { status: req.query.status },
        },
        {
          $lookup: {
            from: "category",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "amenities",
            localField: "amenities",
            foreignField: "_id",
            as: "amenities",
          },
        },
        {
          $lookup: {
            from: "property_notes",
            localField: "_id",
            foreignField: "propertyId",
            as: "property_notes",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $unwind: "$category",
        },
      ]).toArray();

      return res.status(200).send({
        message: "Property required pending fetched successfully",
        data: property,
      });
    }
  );
  /**
   * Method: GET
   * URL: /peroperty
   * @param {PropertySchema}
   */
  fastify.get("/:id", async (req: FastifyRequest<GetParams>, res) => {
    const user = await getAuthUser(fastify, req);
    if (req.params.id) {
      let property = await PropertyCollection?.aggregate([
        {
          $match: {
            _id: new ObjectId(req.params.id),
            user: new ObjectId(user?._id),
          },
        },
        {
          $lookup: {
            from: "category",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "amenities",
            localField: "amenities",
            foreignField: "_id",
            as: "amenities",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $unwind: "$category",
        },
      ]).toArray();
      return res
        .status(200)
        .send({ message: "Property fetched successfully", data: property });
    }
    let property = await PropertyCollection?.aggregate([
      { $match: { user: new ObjectId(user?._id) } },
      {
        $lookup: {
          from: "category",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "amenities",
          localField: "amenities",
          foreignField: "_id",
          as: "amenities",
        },
      },
      {
        $unwind: "$user",
      },
    ]).toArray();
    return res
      .status(200)
      .send({ message: "Property fetched successfully", data: property });
  });

  /**
   * Method: POST
   * URL: /property
   * @param {PropertySchema}
   */
  fastify.post("/", async (req, res) => {
    const user = await getAuthUser(fastify, req);
    let property = PropertySchema.safeParse(req.body);
    if (!property.success) {
      return res.status(400).send(property.error.issues);
    }
    const { category, amenities, location, ...rest } = property.data;
    PropertyCollection?.insertOne({
      category: new ObjectId(category),
      ...rest,
      user: new ObjectId(user?._id),
      amenities: amenities?.map((amenity) => new ObjectId(amenity)),
      location: { type: "Point", coordinates: location },
    });
    res.status(200).send({
      status: 200,
      message: "Property created successfully",
    });
  });

  /**
   * Method: PATCH
   * URL: /property/:id
   * @param {PropertySchema}
   */
  fastify.patch("/:id", async (req: FastifyRequest<GetParams>, res) => {
    const property = UpdatePropertySchema.safeParse(req.body);
    if (!property.success) {
      return res.status(400).send(property.error.issues);
    }

    await PropertyCollection?.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: { ...property.data },
      }
    );

    return res.status(200).send({ message: "Property updated successfully" });
  });

  /**
   * Method: DELETE
   * URL: /property/:id
   * @param {id}
   */
  fastify.delete("/:id", async (req: FastifyRequest<GetParams>, res) => {
    if (req.params.id) {
      PropertyCollection?.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.status(200).send({ message: "Property deleted successfully" });
    } else {
      res.status(400).send({ message: "Invalid id" });
    }
  });

  /**
   * Method: POST
   * URL: /property/amenities/:id
   * @param {id}
   */
  fastify.post(
    "/:id/amenities/:amenitiesId",
    async (req: FastifyRequest<GetParams>, res) => {
      const { id, amenitiesId } = req.params;
      const update: any = { $push: { amenities: new ObjectId(amenitiesId) } };
      PropertyCollection?.updateOne({ _id: new ObjectId(id) }, update);
      res
        .status(200)
        .send({ message: "Amenities added to property successfully" });
    }
  );

  /**
   * Method: DELETE
   * URL: /property/amenities/:id
   * @param {id}
   */
  fastify.delete(
    "/:id/amenities/:amenitiesId",
    async (req: FastifyRequest<GetParams>, res) => {
      const { id, amenitiesId } = req.params;
      const update: any = { $pull: { amenities: new ObjectId(amenitiesId) } };
      PropertyCollection?.updateOne({ _id: new ObjectId(id) }, update);
      res
        .status(200)
        .send({ message: "Amenities removed from property successfully" });
    }
  );
}
