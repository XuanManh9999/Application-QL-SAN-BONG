const express = require("express");
const controller = require("./pitches.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createPitchSchema, updatePitchSchema } = require("./pitches.schema");

const router = express.Router();

router.get("/", protect, controller.listPitches);
router.get("/:id", protect, controller.getPitchById);
router.post("/", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), validate(createPitchSchema), controller.createPitch);
router.patch("/:id", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), validate(updatePitchSchema), controller.updatePitch);
router.delete("/:id", protect, authorize("SUPER_ADMIN", "OWNER"), controller.deletePitch);
router.delete("/:id", protect, authorize("SUPER_ADMIN", "OWNER"), controller.deletePitch);

module.exports = router;
