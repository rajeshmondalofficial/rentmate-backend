import { FastifyInstance } from "fastify";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  UpdateUserSchema,
  UserSchema,
  VerifyEmailOTPSchema,
  VerifyOTPSchema,
} from "../../schemas/user.schema";
import { checkPassword, getAuthUser, hashPassword } from "../../utils/helpers";
import { upload } from "../../utils";
import { ObjectId } from "@fastify/mongodb";

export default async function (fastify: FastifyInstance, opt: any) {
  const UserCollection = fastify.mongo.db?.collection("users");
  const OTPCollection = fastify.mongo.db?.collection("user_otps");

  /**
   * Method: POST
   * URL: /auth/register
   * body: @param {UserI}
   */
  fastify.post("/register", async (request, response) => {
    const validation = UserSchema.safeParse(request.body);
    if (!validation.success) {
      return response.status(400).send(validation.error.errors);
    }
    const { password, confirmPassword, dateOfBirth, ...rest } = validation.data;
    if (password !== confirmPassword) {
      return response
        .status(400)
        .send({ message: "Password and Confirm Password must be same" });
    }
    const existingUser = await UserCollection?.findOne({
      $or: [{ email: rest.email }, { phone: rest.phone }],
    });
    if (existingUser) {
      return response
        .status(400)
        .send({ message: "User with this email or phone already exists" });
    }
    const passwordHash = await hashPassword(password);
    const user = {
      password: passwordHash,
      dateOfBirth: new Date(dateOfBirth),
      ...rest,
    };
    let createdUser = await UserCollection?.insertOne(user);
    OTPCollection?.insertMany([
      {
        identifier: user?.email,
        userId: createdUser?.insertedId,
        type: "email",
        otp: Math.floor(Math.random() * 10000),
        expiresAt: new Date(
          new Date().setMinutes(new Date().getMinutes() + 10)
        ),
      },
      {
        identifier: user?.phone,
        type: "phone",
        userId: createdUser?.insertedId,
        otp: Math.floor(Math.random() * 10000),
        expiresAt: new Date(
          new Date().setMinutes(new Date().getMinutes() + 10)
        ),
      },
    ]);
    return response
      .status(201)
      .send({ message: "User created successfully", user });
  });

  /**
   * Method: POST
   * URL: /auth/verify-otp
   * body: @param {VerifyOTPSchema}
   */
  fastify.post("/verify-otp", async (request, response) => {
    const validation = VerifyOTPSchema.safeParse(request.body);
    if (!validation.success) {
      return response.status(400).send(validation.error.errors);
    }
    const { phoneOtp, userId } = validation.data;
    const UserOTP = await OTPCollection?.findOne({
      userId: new ObjectId(userId),
      type: "phone",
      expiresAt: { $gte: new Date() },
    });

    if (UserOTP?.otp == phoneOtp) {
      UserCollection?.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { isPhoneVerified: true },
        }
      );
      OTPCollection?.deleteOne({ _id: UserOTP?._id });
      return response
        .status(200)
        .send({ message: "Phone number verified successfully" });
    }

    return response.status(400).send({ message: "Invalid OTP" });
  });

  /**
   * Method: POST
   * URL: /auth/verify-email-otp
   * Body: @param {VerifyEmailOTPSchema}
   */
  fastify.post("/verify-email-otp", async (request, response) => {
    const validation = VerifyEmailOTPSchema.safeParse(request.body);
    if (!validation.success) {
      return response.status(400).send(validation.error.errors);
    }
    const { emailOtp, userId } = validation.data;
    const UserOTP = await OTPCollection?.findOne({
      userId: new ObjectId(userId),
      type: "email",
      expiresAt: { $gte: new Date() },
    });

    if (UserOTP?.otp == emailOtp) {
      UserCollection?.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { isEmailVerified: true },
        }
      );
      return response
        .status(200)
        .send({ message: "Email address verified successfully" });
    }

    return response.status(400).send({ message: "Invalid OTP" });
  });

  /**
   * Method: POST
   * URL: /auth/login
   * body: @param {LoginI}
   */
  fastify.post("/login", async (request, response) => {
    const validation = LoginSchema.safeParse(request.body);
    if (!validation.success) {
      return response.status(400).send(validation.error.errors);
    }
    const user = await UserCollection?.findOne({
      email: validation.data.email,
    });
    if (!user) {
      return response
        .status(404)
        .send({ message: "User with this email not found" });
    }
    const isPasswordMatched = await checkPassword(
      validation.data.password,
      user.password
    );
    if (!isPasswordMatched) {
      return response.status(401).send({ message: "Password does'nt matched" });
    }
    const token = fastify.jwt.sign(user, {});
    return response
      .status(200)
      .send({ token, user, message: "Login Successfully" });
  });

  /**
   * Method: GET
   * URL: /auth/profile
   */
  fastify.get("/profile", async (request, response) => {
    const user = await getAuthUser(fastify, request);
    return response
      .status(200)
      .send({ message: "User profile fetched successfully", user });
  });

  /**
   * Method: POST
   * URL: /auth/profile
   * @param {UserSchema}
   */
  fastify.post(
    "/profile",
    { preHandler: upload.single("profileImage") },
    async (request: any, response) => {
      const profileImage = request.file?.filename;
      const user = await getAuthUser(fastify, request);
      const validation = UpdateUserSchema.safeParse(request.body);
      if (!validation.success) {
        return response.status(400).send(validation.error.errors);
      }
      if (profileImage) {
        const UpdatedUser = await UserCollection?.findOneAndUpdate(
          { _id: new ObjectId(user?._id) },
          { $set: { ...validation.data, profileImage: profileImage } }
        );
        return response.status(200).send({
          message: "User profile updated successfully",
          user: { ...UpdatedUser, ...validation.data, profileImage },
        });
      } else {
        const UpdatedUser = await UserCollection?.findOneAndUpdate(
          { _id: new ObjectId(user?._id) },
          { $set: { ...validation.data } }
        );
        return response.status(200).send({
          message: "User profile updated successfully",
          user: { ...UpdatedUser, ...validation.data, profileImage },
        });
      }
    }
  );

  /**
   * Method: POST
   * URL: /auth/forgot-password
   * @param {ForgotPasswordSchema}
   */
  fastify.post("/forgot-password", async (request, response) => {
    const validation = ForgotPasswordSchema.safeParse(request.body);
    if (!validation.success) {
      return response.status(400).send(validation.error.issues);
    }

    const user = await UserCollection?.findOne({
      $or: [
        {
          email: validation.data.identifier,
        },
        {
          phone: validation.data.identifier,
        },
      ],
    });

    if (!user) {
      return response.status(404).send({ message: "User not found" });
    }

    const otp = Math.floor(Math.random() * 10000);
    OTPCollection?.insertOne({
      userId: new ObjectId(user._id),
      type: "forgot",
      otp,
      identifier: validation.data.identifier,
      expiresAt: new Date(new Date().setMinutes(new Date().getMinutes() + 10)),
    });

    return response.status(200).send({ message: "OTP send sucessfully" });
  });

  /**
   * Method: POST
   * URL: /auth/reset-password
   * @param {ResetPasswordSchema}
   */
  fastify.post("/reset-password", async (request, response) => {
    const validation = ResetPasswordSchema.safeParse(request.body);
    if (!validation.success) {
      return response.status(400).send(validation.error.issues);
    }

    const userOTP = await OTPCollection?.findOne({
      type: "forgot",
      identifier: validation.data.identifier,
      expiresAt: { $gte: new Date() },
    });
    if (userOTP?.otp != validation.data.token) {
      return response.status(400).send({ message: "Invalid OTP" });
    }

    if (validation.data.confirmPassword !== validation.data.password) {
      return response.status(400).send({ message: "Passwords do not match" });
    }

    let newPassword = await hashPassword(validation.data.password);
    UserCollection?.updateOne(
      {
        _id: userOTP?.userId,
      },
      { $set: { password: newPassword } }
    );
    OTPCollection?.deleteOne({ _id: userOTP._id });

    return response
      .status(200)
      .send({ message: "Password updated successfully" });
  });
}
