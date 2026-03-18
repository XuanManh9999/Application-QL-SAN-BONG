const express = require("express");
const controller = require("./bookings.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createBookingSchema, updateBookingStatusSchema, updateBookingSchema } = require("./bookings.schema");

const router = express.Router();

router.get("/", protect, authorize("SUPER_ADMIN", "CUSTOMER"), controller.listBookings);
router.get("/me", protect, authorize("CUSTOMER"), controller.listMyBookings);
router.post("/", protect, authorize("SUPER_ADMIN", "CUSTOMER"), validate(createBookingSchema), controller.createBooking);
router.patch(
  "/:id/status",
  protect,
  authorize("SUPER_ADMIN"),
  validate(updateBookingStatusSchema),
  controller.updateBookingStatus
);
router.patch(
  "/:id",
  protect,
  authorize("SUPER_ADMIN"),
  validate(updateBookingSchema),
  controller.updateBooking
);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), controller.deleteBooking);

module.exports = router;
