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

const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().min(5),
    provider: z.enum(["VNPAY"]).optional(),
    status: z.enum(["PENDING", "SUCCESS", "FAILED"]).optional(),
    amount: z.number().positive(),
    txnRef: z.string().min(6).optional(),
    providerTxnNo: z.string().optional(),
    paidAt: z.iso.datetime().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const updatePaymentSchema = z.object({
  body: z
    .object({
      status: z.enum(["PENDING", "SUCCESS", "FAILED"]).optional(),
      amount: z.number().positive().optional(),
      providerTxnNo: z.string().optional(),
      paidAt: z.iso.datetime().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
  query: z.object({}),
  params: z.object({ id: z.string().min(5) }),
});

module.exports = {
  createVnpayPaymentSchema,
  createPaymentSchema,
  updatePaymentSchema,
};
