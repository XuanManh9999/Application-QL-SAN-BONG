const prisma = require("../../config/prisma");
const env = require("../../config/env");
const ApiError = require("../../utils/apiError");
const { createSecureHash, buildQueryString, formatDateTime } = require("../../utils/vnpay");

const buildClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
};

const createVnpayPaymentUrl = async ({ req, bookingId, amount, bankCode, locale }) => {
  if (!env.vnpayTmnCode || !env.vnpayHashSecret) {
    throw new ApiError(500, "VNPay config is missing");
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new ApiError(404, "Booking not found");

  const payableAmount = Number(amount || booking.totalPrice);
  if (payableAmount <= 0) throw new ApiError(400, "Invalid amount");

  const txnRef = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const createDate = formatDateTime(new Date());

  await prisma.paymentTransaction.create({
    data: {
      bookingId: booking.id,
      provider: "VNPAY",
      status: "PENDING",
      amount: payableAmount,
      txnRef,
      providerPayload: {
        initBy: req.user?.id || null,
      },
    },
  });

  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: env.vnpayTmnCode,
    vnp_Amount: Math.round(payableAmount * 100),
    vnp_CreateDate: createDate,
    vnp_CurrCode: "VND",
    vnp_IpAddr: buildClientIp(req),
    vnp_Locale: locale || "vn",
    vnp_OrderInfo: `Thanh toan dat san ${booking.bookingCode}`,
    vnp_OrderType: "other",
    vnp_ReturnUrl: env.vnpayReturnUrl,
    vnp_IpnUrl: env.vnpayIpnUrl,
    vnp_TxnRef: txnRef,
  };

  if (bankCode) params.vnp_BankCode = bankCode;

  const secureHash = createSecureHash(params, env.vnpayHashSecret);
  const paymentUrl = `${env.vnpayUrl}?${buildQueryString({ ...params, vnp_SecureHash: secureHash })}`;

  return {
    paymentUrl,
    txnRef,
  };
};

const processVnpayCallback = async (queryParams) => {
  const cloned = { ...queryParams };
  const secureHash = cloned.vnp_SecureHash;
  delete cloned.vnp_SecureHash;
  delete cloned.vnp_SecureHashType;

  const verifyHash = createSecureHash(cloned, env.vnpayHashSecret);
  if (verifyHash !== secureHash) {
    throw new ApiError(400, "Invalid VNPay signature");
  }

  const txnRef = cloned.vnp_TxnRef;
  const responseCode = cloned.vnp_ResponseCode;
  const transactionNo = cloned.vnp_TransactionNo;

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { txnRef },
    include: { booking: true },
  });

  if (!transaction) throw new ApiError(404, "Transaction not found");

  if (transaction.status === "SUCCESS") {
    return { success: true, message: "Transaction already processed", transaction };
  }

  if (responseCode === "00") {
    const updated = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          providerTxnNo: transactionNo,
          paidAt: new Date(),
          providerPayload: cloned,
        },
      });

      await tx.booking.update({
        where: { id: transaction.bookingId },
        data: {
          paymentStatus: "PAID",
          status: transaction.booking.status === "PENDING" ? "CONFIRMED" : transaction.booking.status,
        },
      });

      return updatedTx;
    });

    return { success: true, message: "Payment success", transaction: updated };
  }

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: "FAILED",
      providerTxnNo: transactionNo,
      providerPayload: cloned,
    },
  });

  return { success: false, message: `Payment failed with code ${responseCode}` };
};

module.exports = {
  createVnpayPaymentUrl,
  processVnpayCallback,
};
