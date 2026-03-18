const z = require("zod");

const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.email(),
    phone: z.string().min(9).optional(),
    password: z.string().min(6),
    role: z.enum(["SUPER_ADMIN", "CUSTOMER"]).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(6),
  }),
  query: z.object({}),
  params: z.object({}),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
  query: z.object({}),
  params: z.object({}),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.email(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    newPassword: z.string().min(6),
  }),
  query: z.object({}),
  params: z.object({}),
});

const forgotPasswordOtpSchema = z.object({
  body: z.object({
    email: z.email(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const resetPasswordOtpSchema = z.object({
  body: z.object({
    email: z.email(),
    otp: z.string().min(4).max(10),
    newPassword: z.string().min(6),
  }),
  query: z.object({}),
  params: z.object({}),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  forgotPasswordOtpSchema,
  resetPasswordOtpSchema,
};
