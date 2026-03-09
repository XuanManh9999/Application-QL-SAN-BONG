const z = require("zod");

const createPromotionSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(32).transform((v) => v.toUpperCase()),
    name: z.string().min(2),
    description: z.string().optional(),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.number().positive(),
    maxDiscount: z.number().positive().optional(),
    minOrderValue: z.number().positive().optional(),
    startAt: z.iso.datetime(),
    endAt: z.iso.datetime(),
    usageLimit: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const updatePromotionSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      type: z.enum(["PERCENT", "FIXED"]).optional(),
      value: z.number().positive().optional(),
      maxDiscount: z.number().positive().optional(),
      minOrderValue: z.number().positive().optional(),
      startAt: z.iso.datetime().optional(),
      endAt: z.iso.datetime().optional(),
      usageLimit: z.number().int().positive().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
  query: z.object({}),
  params: z.object({ id: z.string().min(5) }),
});

const applyPromotionSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(32),
    amount: z.number().positive(),
  }),
  query: z.object({}),
  params: z.object({}),
});

module.exports = {
  createPromotionSchema,
  updatePromotionSchema,
  applyPromotionSchema,
};
