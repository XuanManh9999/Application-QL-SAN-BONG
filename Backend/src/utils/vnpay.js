const crypto = require("crypto");

const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
};

const buildQueryString = (obj) => {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key]).replace(/%20/g, "+")}`)
    .join("&");
};

const createSecureHash = (params, secret) => {
  const sorted = sortObject(params);
  const signData = buildQueryString(sorted);
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
  buildQueryString,
  formatDateTime,
};
