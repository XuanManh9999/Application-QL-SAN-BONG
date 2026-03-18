const express = require("express");
const controller = require("./payments.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createPaymentSchema, updatePaymentSchema, createVnpayPaymentSchema } = require("./payments.schema");

const router = express.Router();

router.get("/", protect, authorize("SUPER_ADMIN"), controller.listPayments);
router.post("/", protect, authorize("SUPER_ADMIN"), validate(createPaymentSchema), controller.createPayment);
router.patch("/:id", protect, authorize("SUPER_ADMIN"), validate(updatePaymentSchema), controller.updatePayment);

router.post(
  "/vnpay/create-url",
  protect,
  authorize("SUPER_ADMIN", "CUSTOMER"),
  validate(createVnpayPaymentSchema),
  controller.createVnpayUrl
);
router.get("/vnpay/return", controller.vnpayReturn);
router.get("/vnpay/ipn", controller.vnpayIpn);

module.exports = router;
