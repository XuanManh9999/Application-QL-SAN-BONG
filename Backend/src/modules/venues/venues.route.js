const express = require("express");
const controller = require("./venues.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createVenueSchema, updateVenueSchema } = require("./venues.schema");

const router = express.Router();

router.get("/", protect, controller.listVenues);
router.get("/:id", protect, controller.getVenueById);
router.post("/", protect, authorize("SUPER_ADMIN", "OWNER"), validate(createVenueSchema), controller.createVenue);
router.patch("/:id", protect, authorize("SUPER_ADMIN", "OWNER"), validate(updateVenueSchema), controller.updateVenue);
router.delete("/:id", protect, authorize("SUPER_ADMIN", "OWNER"), controller.deleteVenue);

module.exports = router;
