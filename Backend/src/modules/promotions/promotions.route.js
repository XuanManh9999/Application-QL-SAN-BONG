const express = require("express");
const controller = require("./promotions.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createPromotionSchema, updatePromotionSchema, applyPromotionSchema } = require("./promotions.schema");

const router = express.Router();

router.get("/", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), controller.listPromotions);
router.post("/", protect, authorize("SUPER_ADMIN", "OWNER"), validate(createPromotionSchema), controller.createPromotion);
router.patch("/:id", protect, authorize("SUPER_ADMIN", "OWNER"), validate(updatePromotionSchema), controller.updatePromotion);
router.post("/apply", protect, validate(applyPromotionSchema), controller.applyPromotion);

module.exports = router;
