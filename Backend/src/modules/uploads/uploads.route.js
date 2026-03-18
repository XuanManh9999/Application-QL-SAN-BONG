const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { protect, authorize } = require("../../middlewares/auth.middleware");
const ApiError = require("../../utils/apiError");
const getOrigin = (req) => {
  const xfProto = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(xfProto) ? xfProto[0] : xfProto) || req.protocol || "http";
  const xfHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(xfHost) ? xfHost[0] : xfHost) || req.get("host");
  return `${proto}://${host}`;
};

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : "";
    const name = `img-${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = String(file.mimetype || "").startsWith("image/");
    cb(ok ? null : new ApiError(400, "Only image uploads are allowed"), ok);
  },
});

router.post("/images", protect, authorize("SUPER_ADMIN", "OWNER", "STAFF"), upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, "Missing file");
    const pathUrl = `/uploads/${req.file.filename}`;
    const url = `${getOrigin(req)}${pathUrl}`;
    res.status(201).json({ success: true, data: { url, path: pathUrl } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

