const asyncHandler = require("../../utils/asyncHandler");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const { buildBookingCode, isOverlap } = require("../../utils/booking");
const { validatePromotion } = require("../promotions/promotions.service");

const createBooking = asyncHandler(async (req, res) => {
  const { pitchId, bookingDate, startTime, endTime, subtotalPrice, promotionCode, note, userId } = req.body;

  if (startTime >= endTime) {
    throw new ApiError(400, "startTime must be earlier than endTime");
  }

  const pitch = await prisma.pitch.findUnique({
    where: { id: pitchId },
    include: {
      venue: {
        select: { id: true, openTime: true, closeTime: true, status: true },
      },
    },
  });
  if (!pitch) throw new ApiError(404, "Pitch not found");
  if (pitch.status !== "ACTIVE") throw new ApiError(400, "Pitch is not available");
  if (pitch.venue.status !== "ACTIVE") throw new ApiError(400, "Venue is not active");

  if (startTime < pitch.venue.openTime || endTime > pitch.venue.closeTime) {
    throw new ApiError(400, "Booking time must be within venue operating hours");
  }

  const date = new Date(`${bookingDate}T00:00:00.000Z`);

  const existing = await prisma.booking.findMany({
    where: {
      pitchId,
      bookingDate: date,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  const hasConflict = existing.some((item) => isOverlap(startTime, endTime, item.startTime, item.endTime));
  if (hasConflict) throw new ApiError(409, "Time slot already booked");

  let promotion = null;
  let discountAmount = 0;
  let totalPrice = Number(subtotalPrice);

  if (promotionCode) {
    const promotionResult = await validatePromotion(promotionCode, Number(subtotalPrice));
    promotion = promotionResult.promotion;
    discountAmount = promotionResult.discount;
    totalPrice = promotionResult.finalAmount;
  }

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        bookingCode: buildBookingCode(),
        userId: userId || req.user.id,
        pitchId,
        bookingDate: date,
        startTime,
        endTime,
        subtotalPrice,
        discountAmount,
        totalPrice,
        promotionId: promotion?.id,
        note,
        status: "PENDING",
        paymentStatus: "UNPAID",
      },
      include: {
        pitch: { select: { id: true, name: true, venueId: true } },
        user: { select: { id: true, fullName: true, email: true } },
        promotion: { select: { id: true, code: true, type: true, value: true } },
      },
    });

    if (promotion?.id) {
      await tx.promotion.update({
        where: { id: promotion.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    return created;
  });

  res.status(201).json({ success: true, data: booking });
});

const listBookings = asyncHandler(async (req, res) => {
  const { date, pitchId, status } = req.query;

  // Customer app: allow checking availability by date + pitchId.
  // Return minimal booking info to compute free time slots.
  if (req.user?.role === "CUSTOMER") {
    if (!date || !pitchId) {
      throw new ApiError(400, "date and pitchId are required for customer availability");
    }
    const where = {
      bookingDate: new Date(`${date}T00:00:00.000Z`),
      pitchId: String(pitchId),
      status: { in: ["PENDING", "CONFIRMED"] },
    };

    const bookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: [{ startTime: "asc" }],
    });

    return res.json({ success: true, data: bookings });
  }

  const where = {};

  if (date) {
    where.bookingDate = new Date(`${date}T00:00:00.000Z`);
  }

  if (pitchId) where.pitchId = pitchId;
  if (status) where.status = status;

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      pitch: {
        select: { id: true, name: true, venueId: true },
      },
      user: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      promotion: {
        select: { id: true, code: true, type: true, value: true },
      },
      paymentTransactions: {
        select: {
          id: true,
          provider: true,
          status: true,
          amount: true,
          txnRef: true,
          providerTxnNo: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
  });

  res.json({ success: true, data: bookings });
});

const listMyBookings = asyncHandler(async (req, res) => {
  const where = { userId: req.user.id };
  const bookings = await prisma.booking.findMany({
    where,
    include: {
      pitch: {
        select: {
          id: true,
          name: true,
          pitchType: true,
          basePrice: true,
          venue: { select: { id: true, name: true, address: true } },
        },
      },
      promotion: { select: { id: true, code: true, type: true, value: true } },
      paymentTransactions: {
        select: {
          id: true,
          provider: true,
          status: true,
          amount: true,
          txnRef: true,
          providerTxnNo: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
  });

  res.json({ success: true, data: bookings });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Booking not found");

  // Prevent confirming/pending an overlapping booking (server-side guarantee).
  if (["PENDING", "CONFIRMED"].includes(req.body.status)) {
    const others = await prisma.booking.findMany({
      where: {
        id: { not: existing.id },
        pitchId: existing.pitchId,
        bookingDate: existing.bookingDate,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startTime: true, endTime: true },
    });
    const hasConflict = others.some((b) => isOverlap(existing.startTime, existing.endTime, b.startTime, b.endTime));
    if (hasConflict) throw new ApiError(409, "Time slot already booked");
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: {
      status: req.body.status,
      paymentStatus: req.body.paymentStatus,
    },
  });

  res.json({ success: true, data: updated });
});

const updateBooking = asyncHandler(async (req, res) => {
  const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Booking not found");

  const data = { ...req.body };
  if (data.bookingDate) data.bookingDate = new Date(`${data.bookingDate}T00:00:00.000Z`);
  if (data.promotionCode) {
    const promo = await prisma.promotion.findUnique({ where: { code: data.promotionCode.toUpperCase() } });
    data.promotionId = promo ? promo.id : null;
    delete data.promotionCode;
  }

  // Server-side overlap protection when changing time/date/pitch and the booking is (or becomes) active.
  const nextPitchId = data.pitchId || existing.pitchId;
  const nextBookingDate = data.bookingDate || existing.bookingDate;
  const nextStartTime = data.startTime || existing.startTime;
  const nextEndTime = data.endTime || existing.endTime;
  const nextStatus = data.status || existing.status;

  if (nextStartTime >= nextEndTime) {
    throw new ApiError(400, "startTime must be earlier than endTime");
  }

  if (["PENDING", "CONFIRMED"].includes(nextStatus)) {
    const others = await prisma.booking.findMany({
      where: {
        id: { not: existing.id },
        pitchId: nextPitchId,
        bookingDate: nextBookingDate,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startTime: true, endTime: true },
    });
    const hasConflict = others.some((b) => isOverlap(nextStartTime, nextEndTime, b.startTime, b.endTime));
    if (hasConflict) throw new ApiError(409, "Time slot already booked");
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data,
    include: {
      pitch: { select: { id: true, name: true, venueId: true } },
      user: { select: { id: true, fullName: true, email: true } },
      promotion: { select: { id: true, code: true, type: true, value: true } },
    },
  });

  res.json({ success: true, data: updated });
});

const deleteBooking = asyncHandler(async (req, res) => {
  const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Booking not found");

  await prisma.booking.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});

module.exports = {
  createBooking,
  listBookings,
  listMyBookings,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
};
