const crypto = require("crypto");

const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
};

// Encode VALUE only (VNPay hash rules), then replace %20 -> +
const encodeVnpayValue = (value) => encodeURIComponent(String(value)).replace(/%20/g, "+");

/**
 * Build hash data string for VNPay:
 * - Keys sorted alphabetically
 * - DO NOT encode key
 * - Encode VALUE only (like urllib.parse.quote(...).replace('%20','+'))
 * - Exclude empty values
 */
const buildHashDataString = (obj) => {
  return Object.keys(obj)
    .filter((k) => obj[k] !== undefined && obj[k] !== null && String(obj[k]).length > 0)
    .map((key) => `${key}=${encodeVnpayValue(obj[key])}`)
    .join("&");
};

// Query string for redirect URL (encode both key & value is OK; keys are safe anyway)
const buildQueryStringEncoded = (obj) => {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeVnpayValue(obj[key])}`)
    .join("&");
};

const createSecureHash = (params, secret) => {
  const sorted = sortObject(params);
  const signData = buildHashDataString(sorted);
  return crypto.createHmac("sha512", secret).update(Buffer.from(signData, "utf-8")).digest("hex");
};

const formatDateTime = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
};

module.exports = {
  createSecureHash,
  buildQueryStringEncoded,
  buildHashDataString,
  formatDateTime,
};
