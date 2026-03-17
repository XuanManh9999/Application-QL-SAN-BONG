const asyncHandler = require("../../utils/asyncHandler");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

const createArticle = asyncHandler(async (req, res) => {
  const { title, slug, summary, content, coverUrl, status, authorId, publishedAt } = req.body;

  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) throw new ApiError(409, "Slug already exists");

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      summary,
      content,
      coverUrl,
      status: status || "DRAFT",
      authorId: authorId || null,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    },
    include: {
      author: { select: { id: true, fullName: true, email: true } },
    },
  });

  res.status(201).json({ success: true, data: article });
});

const listArticles = asyncHandler(async (req, res) => {
  const { status, authorId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (authorId) where.authorId = authorId;

  const articles = await prisma.article.findMany({
    where,
    include: {
      author: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: articles });
});

const getArticleById = asyncHandler(async (req, res) => {
  const article = await prisma.article.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!article) throw new ApiError(404, "Article not found");

  res.json({ success: true, data: article });
});

const updateArticle = asyncHandler(async (req, res) => {
  const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Article not found");

  if (req.body.slug && req.body.slug !== existing.slug) {
    const slugExists = await prisma.article.findUnique({ where: { slug: req.body.slug } });
    if (slugExists) throw new ApiError(409, "Slug already exists");
  }

  const updated = await prisma.article.update({
    where: { id: req.params.id },
    data: {
      ...req.body,
      authorId: req.body.authorId || null,
      publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : req.body.publishedAt,
    },
    include: {
      author: { select: { id: true, fullName: true, email: true } },
    },
  });

  res.json({ success: true, data: updated });
});

const deleteArticle = asyncHandler(async (req, res) => {
  const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Article not found");

  await prisma.article.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});

module.exports = {
  createArticle,
  listArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
};
