const crypto = require("crypto");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

const randomToken = (size = 32) => crypto.randomBytes(size).toString("hex");

module.exports = {
  sha256,
  randomToken,
};
