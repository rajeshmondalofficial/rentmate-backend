import { ObjectId } from "@fastify/mongodb";
import bcrypt from "bcrypt";
import { FastifyInstance, FastifyRequest } from "fastify";

export const hashPassword = (plainPassword: string) => {
  return bcrypt.hash(plainPassword, 12);
};

export const checkPassword = (
  planPassword: string,
  encodedPassword: string
) => {
  return bcrypt.compare(planPassword, encodedPassword);
};

export const getAuthUser = async (i: FastifyInstance, req: FastifyRequest) => {
  const UserCollection = i.mongo.db?.collection("users");

  if (req.headers["authorization"]) {
    const tokenPayload: any = i.jwt.verify(
      req.headers["authorization"].split(" ")[1]
    );
    const user = await UserCollection?.findOne({
      _id: new ObjectId(tokenPayload?._id),
    });
    return user;
  }
  return null;
};
