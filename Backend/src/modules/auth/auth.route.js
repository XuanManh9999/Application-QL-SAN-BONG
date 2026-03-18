const express = require("express");
const controller = require("./auth.controller");
const validate = require("../../middlewares/validate.middleware");
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  forgotPasswordOtpSchema,
  resetPasswordOtpSchema,
} = require("./auth.schema");

const router = express.Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.post("/logout", validate(refreshSchema), controller.logout);
router.post("/forgot-password", validate(forgotPasswordSchema), controller.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), controller.resetPassword);
router.post("/forgot-password-otp", validate(forgotPasswordOtpSchema), controller.forgotPasswordOtp);
router.post("/reset-password-otp", validate(resetPasswordOtpSchema), controller.resetPasswordOtp);

module.exports = router;
