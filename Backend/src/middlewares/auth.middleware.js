const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const env = require("../config/env");
const ApiError = require("../utils/apiError");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Unauthorized"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || !user.isActive) {
      return next(new ApiError(401, "Unauthorized"));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return next(new ApiError(401, "Invalid token"));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "Forbidden"));
  }

  next();
};

module.exports = {
  protect,
  authorize,
};
