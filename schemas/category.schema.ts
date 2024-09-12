import zod from "zod";

export const CategorySchema = zod.object({
  category: zod.string(),
  isActive: zod.boolean().default(true),
});
