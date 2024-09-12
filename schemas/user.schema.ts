import zod, { z } from "zod";

export const UserSchema = zod.object({
  firstName: zod.string(),
  lastName: zod.string(),
  email: zod.string().email({ message: "Please enter valid email address" }),
  password: zod.string().min(8),
  phone: zod
    .string()
    .min(10)
    .regex(/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/),
  gender: zod.enum(["Male", "Female"]).default("Male"),
  dateOfBirth: zod.string().default(new Date().toISOString()),
  confirmPassword: zod.string().min(10),
  isEmailVerified: zod.boolean().default(false),
  isPhoneVerified: zod.boolean().default(false),
  twoStepEnabled: zod.boolean().default(false),
});

export type UserI = zod.infer<typeof UserSchema>;

export const LoginSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(8),
});

export type LoginI = zod.infer<typeof LoginSchema>;

export const UpdateUserSchema = UserSchema.partial();
export type UpdateUserSchemaI = zod.infer<typeof UpdateUserSchema>;

export const VerifyOTPSchema = zod.object({
  userId: z.string(),
  phoneOtp: zod.string().min(4).max(4),
});

export type VerifyOTPSchemaI = zod.infer<typeof VerifyOTPSchema>;

export const VerifyEmailOTPSchema = zod.object({
  userId: z.string(),
  emailOtp: zod.string().min(4).max(4),
});

export type VerifyEmailOTPSchema = zod.infer<typeof VerifyEmailOTPSchema>;

export const ForgotPasswordSchema = zod.object({
  identifier: z.string(),
});

export type ForgotPasswordSchemaI = zod.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = zod.object({
  password: zod.string().min(8),
  confirmPassword: zod.string().min(8),
  token: zod.string().min(4).max(4),
  identifier: zod.string(),
});

export type ResetPasswordSchema = zod.infer<typeof ResetPasswordSchema>;
