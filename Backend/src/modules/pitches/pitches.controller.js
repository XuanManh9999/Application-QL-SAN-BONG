const asyncHandler = require("../../utils/asyncHandler");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

const createPitch = asyncHandler(async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.body.venueId } });
  if (!venue) throw new ApiError(404, "Venue not found");

  const pitch = await prisma.pitch.create({
    data: {
      venueId: req.body.venueId,
      name: req.body.name,
      pitchType: req.body.pitchType,
      basePrice: req.body.basePrice,
      status: req.body.status,
    },
  });

  res.status(201).json({ success: true, data: pitch });
});

const listPitches = asyncHandler(async (req, res) => {
  const venueId = req.query.venueId;

  const pitches = await prisma.pitch.findMany({
    where: venueId ? { venueId } : undefined,
    include: {
      venue: {
        select: { id: true, name: true, address: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: pitches });
});

const getPitchById = asyncHandler(async (req, res) => {
  const pitch = await prisma.pitch.findUnique({
    where: { id: req.params.id },
    include: {
      venue: {
        select: { id: true, name: true, address: true, openTime: true, closeTime: true },
      },
    },
  });

  if (!pitch) throw new ApiError(404, "Pitch not found");

  res.json({ success: true, data: pitch });
});

const updatePitch = asyncHandler(async (req, res) => {
  const existing = await prisma.pitch.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Pitch not found");

  const updated = await prisma.pitch.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({ success: true, data: updated });
});

const deletePitch = asyncHandler(async (req, res) => {
  const existing = await prisma.pitch.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Pitch not found");

  await prisma.pitch.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});

module.exports = {
  createPitch,
  listPitches,
  getPitchById,
  updatePitch,
  deletePitch,
};
