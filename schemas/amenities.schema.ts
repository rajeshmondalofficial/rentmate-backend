import zod from "zod";

export const AmenitiesSchema = zod.object({
  title: zod.string(),
  isActive: zod.boolean().default(true).optional(),
});

export type AmenitiesI = zod.infer<typeof AmenitiesSchema>;

export const UpdateAmenitiesSchema = AmenitiesSchema.partial();
export type UpdateAmenitiesSchemaI = zod.infer<typeof UpdateAmenitiesSchema>;
