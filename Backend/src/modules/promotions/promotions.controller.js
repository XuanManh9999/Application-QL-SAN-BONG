const asyncHandler = require("../../utils/asyncHandler");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const { validatePromotion } = require("./promotions.service");

const listPromotions = asyncHandler(async (req, res) => {
  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: promotions });
});

const createPromotion = asyncHandler(async (req, res) => {
  const { startAt, endAt, code, ...rest } = req.body;

  if (new Date(startAt) >= new Date(endAt)) {
    throw new ApiError(400, "startAt must be earlier than endAt");
  }

  const exists = await prisma.promotion.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (exists) throw new ApiError(409, "Promotion code already exists");

  const promotion = await prisma.promotion.create({
    data: {
      ...rest,
      code: code.toUpperCase(),
      startAt: new Date(startAt),
      endAt: new Date(endAt),
    },
  });

  res.status(201).json({ success: true, data: promotion });
});

const updatePromotion = asyncHandler(async (req, res) => {
  const existing = await prisma.promotion.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Promotion not found");

  const data = { ...req.body };
  if (data.startAt) data.startAt = new Date(data.startAt);
  if (data.endAt) data.endAt = new Date(data.endAt);

  const mergedStart = data.startAt || existing.startAt;
  const mergedEnd = data.endAt || existing.endAt;
  if (mergedStart >= mergedEnd) throw new ApiError(400, "startAt must be earlier than endAt");

  const updated = await prisma.promotion.update({
    where: { id: req.params.id },
    data,
  });

  res.json({ success: true, data: updated });
});

const applyPromotion = asyncHandler(async (req, res) => {
  const result = await validatePromotion(req.body.code, req.body.amount);

  res.json({
    success: true,
    data: {
      promotionId: result.promotion.id,
      code: result.promotion.code,
      type: result.promotion.type,
      originalAmount: result.original,
      discountAmount: result.discount,
      finalAmount: result.finalAmount,
    },
  });
});

const deletePromotion = asyncHandler(async (req, res) => {
  const existing = await prisma.promotion.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Promotion not found");

  await prisma.promotion.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});

module.exports = {
  listPromotions,
  createPromotion,
  updatePromotion,
  applyPromotion,
  deletePromotion,
};
