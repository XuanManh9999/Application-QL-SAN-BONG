const z = require("zod");

const createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    slug: z.string().min(3).max(160),
    summary: z.string().optional(),
    content: z.string().min(10),
    coverUrl: z.string().url().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    authorId: z.string().min(5).optional(),
    publishedAt: z.iso.datetime().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const updateArticleSchema = z.object({
  body: z
    .object({
      title: z.string().min(3).optional(),
      slug: z.string().min(3).max(160).optional(),
      summary: z.string().optional(),
      content: z.string().min(10).optional(),
      coverUrl: z.string().url().optional(),
      status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
      authorId: z.string().min(5).optional(),
      publishedAt: z.iso.datetime().optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
  query: z.object({}),
  params: z.object({ id: z.string().min(5) }),
});

module.exports = {
  createArticleSchema,
  updateArticleSchema,
};
