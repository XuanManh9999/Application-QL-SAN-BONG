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

module.exports = {
  createBookingSchema,
  updateBookingStatusSchema,
};
