const asyncHandler = require("../../utils/asyncHandler");
const authService = require("./auth.service");

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ success: true, data: user });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.json({ success: true, data: result });
});

const refresh = asyncHandler(async (req, res) => {
  const accessToken = await authService.refreshAccessToken(req.body.refreshToken);
  res.json({ success: true, data: { accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.json({ success: true, message: "Logged out" });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.json({
    success: true,
    message: "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu",
  });
});

const forgotPasswordOtp = asyncHandler(async (req, res) => {
  await authService.forgotPasswordOtp(req.body.email);
  res.json({
    success: true,
    message: "Nếu email tồn tại, hệ thống đã gửi mã OTP đặt lại mật khẩu",
  });
});

const resetPasswordOtp = asyncHandler(async (req, res) => {
  await authService.resetPasswordOtp(req.body.email, req.body.otp, req.body.newPassword);
  res.json({ success: true, message: "Đổi mật khẩu thành công" });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.json({ success: true, message: "Đặt lại mật khẩu thành công" });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  forgotPasswordOtp,
  resetPasswordOtp,
  resetPassword,
};
