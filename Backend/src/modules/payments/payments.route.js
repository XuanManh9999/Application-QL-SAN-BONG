const express = require("express");
const controller = require("./payments.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createVnpayPaymentSchema } = require("./payments.schema");

const router = express.Router();

router.post(
  "/vnpay/create-url",
  protect,
  authorize("SUPER_ADMIN", "OWNER", "STAFF", "CUSTOMER"),
  validate(createVnpayPaymentSchema),
  controller.createVnpayUrl
);

router.get("/vnpay/return", controller.vnpayReturn);
router.get("/vnpay/ipn", controller.vnpayIpn);

module.exports = router;
