const express = require("express");
const controller = require("./promotions.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createPromotionSchema, updatePromotionSchema, applyPromotionSchema } = require("./promotions.schema");

const router = express.Router();

router.get("/", protect, authorize("SUPER_ADMIN"), controller.listPromotions);
router.get("/available", protect, authorize("SUPER_ADMIN", "CUSTOMER"), controller.listPromotions);
router.post("/", protect, authorize("SUPER_ADMIN"), validate(createPromotionSchema), controller.createPromotion);
router.patch("/:id", protect, authorize("SUPER_ADMIN"), validate(updatePromotionSchema), controller.updatePromotion);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), controller.deletePromotion);
router.post("/apply", protect, authorize("SUPER_ADMIN", "CUSTOMER"), validate(applyPromotionSchema), controller.applyPromotion);

module.exports = router;
