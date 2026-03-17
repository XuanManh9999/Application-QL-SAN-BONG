const z = require("zod");

const createUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
    role: z.enum(["SUPER_ADMIN", "OWNER", "STAFF", "CUSTOMER"]).optional(),
    isActive: z.boolean().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const updateUserSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      password: z.string().min(8).optional(),
      role: z.enum(["SUPER_ADMIN", "OWNER", "STAFF", "CUSTOMER"]).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
  query: z.object({}),
  params: z.object({ id: z.string().min(5) }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
