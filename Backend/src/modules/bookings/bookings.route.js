const express = require("express");
const controller = require("./bookings.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createBookingSchema, updateBookingStatusSchema } = require("./bookings.schema");

const router = express.Router();

router.get("/", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), controller.listBookings);
router.post("/", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF", "CUSTOMER"), validate(createBookingSchema), controller.createBooking);
router.patch(
  "/:id/status",
  protect,
  authorize("SUPER_ADMIN", "OWNER", "STAFF"),
  validate(updateBookingStatusSchema),
  controller.updateBookingStatus
);

module.exports = router;
