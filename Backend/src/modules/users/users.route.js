const express = require("express");
const controller = require("./users.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/me", protect, controller.me);
router.get("/", protect, authorize("SUPER_ADMIN", "OWNER"), controller.listUsers);

module.exports = router;
