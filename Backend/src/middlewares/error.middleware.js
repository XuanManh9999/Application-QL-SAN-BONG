const ApiError = require("../utils/apiError");

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err?.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.issues,
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

module.exports = errorMiddleware;
