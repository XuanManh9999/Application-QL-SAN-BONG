const z = require("zod");

const timeRegex = /^\d{2}:\d{2}$/;

const createBookingSchema = z.object({
  body: z.object({
    pitchId: z.string().min(5),
    bookingDate: z.iso.date(),
    startTime: z.string().regex(timeRegex),
    endTime: z.string().regex(timeRegex),
    subtotalPrice: z.number().positive(),
    promotionCode: z.string().min(3).max(32).optional(),
    note: z.string().optional(),
    userId: z.string().min(5).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
    paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID", "REFUNDED"]).optional(),
  }),
  query: z.object({}),
  params: z.object({
    id: z.string().min(5),
  }),
});

const updateBookingSchema = z.object({
  body: z
    .object({
      pitchId: z.string().min(5).optional(),
      bookingDate: z.iso.date().optional(),
      startTime: z.string().regex(timeRegex).optional(),
      endTime: z.string().regex(timeRegex).optional(),
      subtotalPrice: z.number().positive().optional(),
      totalPrice: z.number().positive().optional(),
      discountAmount: z.number().nonnegative().optional(),
      promotionId: z.string().min(5).optional().nullable(),
      promotionCode: z.string().min(3).max(32).optional(),
      note: z.string().optional(),
      status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
      paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID", "REFUNDED"]).optional(),
      userId: z.string().min(5).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
  query: z.object({}),
  params: z.object({
    id: z.string().min(5),
  }),
});

module.exports = {
  createBookingSchema,
  updateBookingStatusSchema,
  updateBookingSchema,
};
