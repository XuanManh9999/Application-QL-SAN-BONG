const asyncHandler = require("../../utils/asyncHandler");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

const createVenue = asyncHandler(async (req, res) => {
  const venue = await prisma.venue.create({ data: req.body });
  res.status(201).json({ success: true, data: venue });
});

const listVenues = asyncHandler(async (req, res) => {
  const venues = await prisma.venue.findMany({
    include: {
      _count: {
        select: {
          pitches: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: venues });
});

const getVenueById = asyncHandler(async (req, res) => {
  const venue = await prisma.venue.findUnique({
    where: { id: req.params.id },
    include: {
      pitches: true,
    },
  });

  if (!venue) throw new ApiError(404, "Venue not found");

  res.json({ success: true, data: venue });
});

const updateVenue = asyncHandler(async (req, res) => {
  const existing = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Venue not found");

  const updated = await prisma.venue.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({ success: true, data: updated });
});

module.exports = {
  createVenue,
  listVenues,
  getVenueById,
  updateVenue,
};
