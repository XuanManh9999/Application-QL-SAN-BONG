const express = require("express");
const controller = require("./users.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createUserSchema, updateUserSchema, updateMeSchema } = require("./users.schema");

const router = express.Router();

router.get("/me", protect, controller.me);
router.patch("/me", protect, validate(updateMeSchema), controller.updateMe);
router.get("/", protect, authorize("SUPER_ADMIN"), controller.listUsers);
router.post("/", protect, authorize("SUPER_ADMIN"), validate(createUserSchema), controller.createUser);
router.patch("/:id", protect, authorize("SUPER_ADMIN"), validate(updateUserSchema), controller.updateUser);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), controller.deleteUser);

module.exports = router;
