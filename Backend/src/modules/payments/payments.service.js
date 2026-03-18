const prisma = require("../../config/prisma");
const env = require("../../config/env");
const ApiError = require("../../utils/apiError");
const { createSecureHash, buildQueryStringEncoded, formatDateTime } = require("../../utils/vnpay");

const buildClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const raw = forwarded.split(",")[0].trim();
    if (raw.startsWith("::ffff:")) return raw.slice("::ffff:".length);
    // VNPay thực tế chỉ cần giá trị hợp lệ; tránh IPv6/format lạ làm gateway báo chung "Sai chữ ký"
    if (raw.includes(":")) return "127.0.0.1";
    return raw;
  }
  const raw = req.socket.remoteAddress || "127.0.0.1";
  if (raw.startsWith("::ffff:")) return raw.slice("::ffff:".length);
  if (raw.includes(":")) return "127.0.0.1";
  return raw;
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

  // Ưu tiên baseUrl theo request host (để WebView trên emulator dùng được 10.0.2.2 thay vì localhost)
  const reqBaseUrl = (() => {
    try {
      const host = req.get("host");
      if (host) return `${req.protocol}://${host}`;
    } catch (_) {}
    return env.appBaseUrl;
  })();

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
    vnp_Amount: String(Math.round(payableAmount * 100)),
    vnp_CreateDate: createDate,
    vnp_CurrCode: "VND",
    vnp_IpAddr: buildClientIp(req),
    vnp_Locale: locale || "vn",
    vnp_OrderInfo: `Thanh toan dat san ${booking.bookingCode}`,
    vnp_OrderType: "other",
    vnp_ReturnUrl: `${reqBaseUrl}/api/v1/payments/vnpay/return`,
    vnp_IpnUrl: `${reqBaseUrl}/api/v1/payments/vnpay/ipn`,
    vnp_TxnRef: txnRef,
  };

  if (bankCode) params.vnp_BankCode = bankCode;

  // Hash calculation must exclude vnp_SecureHash & vnp_SecureHashType
  const secureHash = createSecureHash(params, env.vnpayHashSecret);
  const allParams = {
    ...params,
    vnp_SecureHashType: "SHA512",
    vnp_SecureHash: secureHash,
  };
  const sortedAllParams = Object.keys(allParams)
    .sort()
    .reduce((acc, k) => {
      acc[k] = allParams[k];
      return acc;
    }, {});
  const paymentUrl = `${env.vnpayUrl}?${buildQueryStringEncoded(sortedAllParams)}`;

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
  if (String(verifyHash).toLowerCase() !== String(secureHash).toLowerCase()) {
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
