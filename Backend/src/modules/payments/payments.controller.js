const asyncHandler = require("../../utils/asyncHandler");
const { createVnpayPaymentUrl, processVnpayCallback } = require("./payments.service");

const prisma = require("../../config/prisma");

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

const listPayments = asyncHandler(async (req, res) => {
  const payments = await prisma.paymentTransaction.findMany({
    include: {
      booking: {
        select: {
          id: true,
          bookingCode: true,
          totalPrice: true,
          paymentStatus: true,
          bookingDate: true,
          startTime: true,
          endTime: true,
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          pitch: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: payments });
});

const createPayment = asyncHandler(async (req, res) => {
  const { bookingId, provider, status, amount, txnRef, providerTxnNo, paidAt } = req.body;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

  const payment = await prisma.paymentTransaction.create({
    data: {
      bookingId,
      provider: provider || "VNPAY",
      status: status || "PENDING",
      amount,
      txnRef: txnRef || `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      providerTxnNo,
      paidAt: paidAt ? new Date(paidAt) : null,
    },
  });

  res.status(201).json({ success: true, data: payment });
});

const updatePayment = asyncHandler(async (req, res) => {
  const existing = await prisma.paymentTransaction.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Payment not found" });

  const data = { ...req.body };
  if (data.paidAt) data.paidAt = new Date(data.paidAt);

  const updated = await prisma.paymentTransaction.update({
    where: { id: req.params.id },
    data,
  });

  res.json({ success: true, data: updated });
});

const deletePayment = asyncHandler(async (req, res) => {
  const existing = await prisma.paymentTransaction.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "Payment not found" });

  await prisma.paymentTransaction.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});

module.exports = {
  createVnpayUrl,
  vnpayReturn,
  vnpayIpn,
  listPayments,
  createPayment,
  updatePayment,
  deletePayment,
};
