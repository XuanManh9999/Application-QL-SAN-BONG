const express = require("express");
const controller = require("./payments.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createPaymentSchema, updatePaymentSchema, createVnpayPaymentSchema } = require("./payments.schema");

const router = express.Router();

router.get("/", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), controller.listPayments);
router.post("/", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), validate(createPaymentSchema), controller.createPayment);
router.patch("/:id", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), validate(updatePaymentSchema), controller.updatePayment);
router.delete("/:id", protect, authorize("SUPER_ADMIN", "OWNER"), controller.deletePayment);

router.post(
  "/vnpay/create-url",
  protect,
  authorize("SUPER_ADMIN", "OWNER", "STAFF"),
  validate(createVnpayPaymentSchema),
  controller.createVnpayUrl
);
router.get("/vnpay/return", controller.vnpayReturn);
router.get("/vnpay/ipn", controller.vnpayIpn);

module.exports = router;
