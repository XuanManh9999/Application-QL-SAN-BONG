const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

const validatePromotion = async (code, amount) => {
  const upperCode = code.toUpperCase();
  const now = new Date();

  const promotion = await prisma.promotion.findUnique({
    where: { code: upperCode },
  });

  if (!promotion || !promotion.isActive) {
    throw new ApiError(404, "Promotion code not found or inactive");
  }

  if (promotion.startAt > now || promotion.endAt < now) {
    throw new ApiError(400, "Promotion is out of valid time");
  }

  if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) {
    throw new ApiError(400, "Promotion usage limit exceeded");
  }

  if (promotion.minOrderValue !== null && Number(amount) < Number(promotion.minOrderValue)) {
    throw new ApiError(400, `Minimum order value is ${promotion.minOrderValue}`);
  }

  const original = Number(amount);
  let discount = 0;

  if (promotion.type === "PERCENT") {
    discount = (original * Number(promotion.value)) / 100;
    if (promotion.maxDiscount !== null) {
      discount = Math.min(discount, Number(promotion.maxDiscount));
    }
  } else {
    discount = Number(promotion.value);
  }

  discount = Math.min(discount, original);
  const finalAmount = Math.max(original - discount, 0);

  return {
    promotion,
    original,
    discount,
    finalAmount,
  };
};

module.exports = {
  validatePromotion,
};
