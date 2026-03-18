const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const routes = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(
  helmet({
    // Allow embedding uploaded images/files from the admin origin.
    // Otherwise browsers may block /uploads resources due to CORP: same-origin.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors());
// Support large payloads (e.g. articles with base64 images)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(morgan("dev"));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/v1", routes);

app.use(errorMiddleware);

module.exports = app;
