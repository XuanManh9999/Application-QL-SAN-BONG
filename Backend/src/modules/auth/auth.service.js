const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../../config/prisma");
const env = require("../../config/env");
const ApiError = require("../../utils/apiError");
const { randomToken, sha256 } = require("../../utils/crypto");
const { sendMail } = require("../../utils/email");

const signAccessToken = (user) => {
  return jwt.sign({ role: user.role }, env.jwtAccessSecret, {
    subject: user.id,
    expiresIn: env.jwtAccessExpiresIn,
  });
};

const signRefreshToken = (user) => {
  return jwt.sign({ type: "refresh" }, env.jwtRefreshSecret, {
    subject: user.id,
    expiresIn: env.jwtRefreshExpiresIn,
  });
};

const parseExpiresInToDate = (expiresIn) => {
  const now = Date.now();

  if (typeof expiresIn === "string" && expiresIn.endsWith("d")) {
    return new Date(now + Number(expiresIn.replace("d", "")) * 24 * 60 * 60 * 1000);
  }
  if (typeof expiresIn === "string" && expiresIn.endsWith("h")) {
    return new Date(now + Number(expiresIn.replace("h", "")) * 60 * 60 * 1000);
  }
  if (typeof expiresIn === "string" && expiresIn.endsWith("m")) {
    return new Date(now + Number(expiresIn.replace("m", "")) * 60 * 1000);
  }

  return new Date(now + 7 * 24 * 60 * 60 * 1000);
};

const register = async (payload) => {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) throw new ApiError(409, "Email already exists");

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      passwordHash,
      role: payload.role || "CUSTOMER",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Invalid email or password");
  if (!user.isActive) throw new ApiError(403, "User account is inactive");

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new ApiError(401, "Invalid email or password");

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: parseExpiresInToDate(env.jwtRefreshExpiresIn),
    },
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

const refreshAccessToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtRefreshSecret);
  } catch (e) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const tokenInDb = await prisma.refreshToken.findUnique({ where: { token } });
  if (!tokenInDb) throw new ApiError(401, "Refresh token revoked");

  if (tokenInDb.expiresAt < new Date()) {
    await prisma.refreshToken.deleteMany({ where: { token } });
    throw new ApiError(401, "Refresh token expired");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || !user.isActive) throw new ApiError(401, "Unauthorized");

  return signAccessToken(user);
};

const logout = async (token) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return;
  }

  const rawToken = randomToken(24);
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  const resetLink = `${env.adminResetPasswordUrl}?token=${rawToken}`;

  await sendMail({
    to: user.email,
    subject: "Đặt lại mật khẩu - Nền tảng đặt sân bóng",
    html: `
      <p>Xin chào ${user.fullName},</p>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn vào liên kết bên dưới:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Liên kết có hiệu lực trong 15 phút.</p>
      <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    `,
  });
};

const resetPassword = async (token, newPassword) => {
  const tokenHash = sha256(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new ApiError(400, "Reset token is invalid or expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
};
