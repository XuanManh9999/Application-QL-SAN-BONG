const z = require("zod");

const createVnpayPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().min(5),
    amount: z.number().positive().optional(),
    bankCode: z.string().min(2).max(20).optional(),
    locale: z.enum(["vn", "en"]).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

module.exports = {
  createVnpayPaymentSchema,
};
