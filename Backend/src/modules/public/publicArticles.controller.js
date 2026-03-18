const asyncHandler = require("../../utils/asyncHandler");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

const list = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const where = { status: "PUBLISHED" };
  if (q) {
    where.OR = [
      { title: { contains: String(q), mode: "insensitive" } },
      { slug: { contains: String(q), mode: "insensitive" } },
      { summary: { contains: String(q), mode: "insensitive" } },
    ];
  }

  const articles = await prisma.article.findMany({
    where,
    include: {
      author: { select: { id: true, fullName: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  res.json({ success: true, data: articles });
});

const getById = asyncHandler(async (req, res) => {
  const article = await prisma.article.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { id: true, fullName: true } },
    },
  });

  if (!article) throw new ApiError(404, "Article not found");
  if (article.status !== "PUBLISHED") throw new ApiError(404, "Article not found");

  res.json({ success: true, data: article });
});

module.exports = { list, getById };

