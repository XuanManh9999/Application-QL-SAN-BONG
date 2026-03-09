const asyncHandler = require("../../utils/asyncHandler");
const { createVnpayPaymentUrl, processVnpayCallback } = require("./payments.service");

const createVnpayUrl = asyncHandler(async (req, res) => {
  const result = await createVnpayPaymentUrl({
    req,
    bookingId: req.body.bookingId,
    amount: req.body.amount,
    bankCode: req.body.bankCode,
    locale: req.body.locale,
  });

  res.json({ success: true, data: result });
});

const vnpayReturn = asyncHandler(async (req, res) => {
  const result = await processVnpayCallback(req.query);
  res.json({ success: true, data: result });
});

const vnpayIpn = asyncHandler(async (req, res) => {
  try {
    await processVnpayCallback(req.query);
    res.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    res.json({ RspCode: "97", Message: error.message || "Invalid signature" });
  }
});

module.exports = {
  createVnpayUrl,
  vnpayReturn,
  vnpayIpn,
};
