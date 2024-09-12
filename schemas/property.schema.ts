import zod from "zod";

export const PropertySchema = zod.object({
  title: zod.string(),
  category: zod.string(),
  price: zod.number(),
  priceUnit: zod.enum(["per night", "day", "week", "month"]).default("month"),
  bedrooms: zod.number(),
  bathrooms: zod.number(),
  sqft: zod.number(),
  description: zod.string(),
  location: zod.array(zod.number()).min(2).max(2),
  street_address: zod.string(),
  city: zod.string(),
  state: zod.string(),
  country: zod.string(),
  zipcode: zod.string(),
  amenities: zod.array(zod.string()),
  status: zod
    .enum(["pending", "approved", "modification", "rejected"])
    .default("pending"),
});
export type PropertySchemaI = zod.infer<typeof PropertySchema>;

export const UpdatePropertySchema = PropertySchema.partial();
export type UpdatePropertySchemaI = zod.infer<typeof UpdatePropertySchema>;

export const ApprovePropertySchema = zod.object({
  propertyId: zod.string(),
  status: zod
    .enum(["pending", "approved", "modification", "rejected"])
    .default("approved"),
  note: zod.string().optional(),
});
export type ApprovePropertySchemaI = zod.infer<typeof ApprovePropertySchema>;
