const dotenv = require("dotenv");

dotenv.config();

const stripWrappedQuotes = (v) => {
  if (v === undefined || v === null) return "";
  const s = String(v).trim();
  // dotenv 有时会保留引号；把一层包裹引号去掉，避免参与签名造成 “Sai chữ ký”
  return s.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1").trim();
};

module.exports = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:4000",
  adminResetPasswordUrl: process.env.ADMIN_RESET_PASSWORD_URL || "http://localhost:5173/reset-password",
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "access_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "refresh_secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || "false") === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || "no-reply@football-booking.local",
  vnpayTmnCode: stripWrappedQuotes(process.env.VNPAY_TMN_CODE),
  vnpayHashSecret: stripWrappedQuotes(process.env.VNPAY_HASH_SECRET),
  vnpayUrl: stripWrappedQuotes(process.env.VNPAY_URL) || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnpayReturnUrl: stripWrappedQuotes(process.env.VNPAY_RETURN_URL) || "http://localhost:4000/api/v1/payments/vnpay/return",
  vnpayIpnUrl: stripWrappedQuotes(process.env.VNPAY_IPN_URL) || "http://localhost:4000/api/v1/payments/vnpay/ipn",
};

// Production safety: do not allow default JWT secrets.
if (module.exports.nodeEnv === "production") {
  if (module.exports.jwtAccessSecret === "access_secret" || module.exports.jwtRefreshSecret === "refresh_secret") {
    throw new Error("Missing JWT secrets. Please set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production.");
  }
}
