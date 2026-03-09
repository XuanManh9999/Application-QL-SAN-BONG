const z = require("zod");

const createPitchSchema = z.object({
  body: z.object({
    venueId: z.string().min(5),
    name: z.string().min(2),
    pitchType: z.string().min(1),
    basePrice: z.number().positive(),
    status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const updatePitchSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      pitchType: z.string().min(1).optional(),
      basePrice: z.number().positive().optional(),
      status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
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
  createPitchSchema,
  updatePitchSchema,
};
