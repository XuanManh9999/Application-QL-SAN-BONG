const express = require("express");
const controller = require("./auth.controller");
const validate = require("../../middlewares/validate.middleware");
const { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } = require("./auth.schema");

const router = express.Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.post("/logout", validate(refreshSchema), controller.logout);
router.post("/forgot-password", validate(forgotPasswordSchema), controller.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), controller.resetPassword);

module.exports = router;
