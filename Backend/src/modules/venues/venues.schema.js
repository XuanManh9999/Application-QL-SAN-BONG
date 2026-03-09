const z = require("zod");

const timeRegex = /^\d{2}:\d{2}$/;

const createVenueSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    address: z.string().min(5),
    description: z.string().optional(),
    openTime: z.string().regex(timeRegex),
    closeTime: z.string().regex(timeRegex),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const updateVenueSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      address: z.string().min(5).optional(),
      description: z.string().optional(),
      openTime: z.string().regex(timeRegex).optional(),
      closeTime: z.string().regex(timeRegex).optional(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
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
  createVenueSchema,
  updateVenueSchema,
};
