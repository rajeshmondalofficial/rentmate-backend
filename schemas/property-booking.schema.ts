import zod from "zod";

export const PropertyBooking = zod.object({
  propertyId: zod.string(),
  bookingTime: zod.string(),
  status: zod
    .enum(["pending", "accepted", "rejected", "re-schedule"])
    .default("pending"),
});
export type PropertyBookingI = zod.infer<typeof PropertyBooking>;

export const UpdatePropertyBooking = PropertyBooking.partial();
export type UpdatePropertyBookingI = zod.infer<typeof UpdatePropertyBooking>;
