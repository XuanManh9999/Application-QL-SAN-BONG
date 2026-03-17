const express = require("express");

const authRoutes = require("../modules/auth/auth.route");
const userRoutes = require("../modules/users/users.route");
const venueRoutes = require("../modules/venues/venues.route");
const pitchRoutes = require("../modules/pitches/pitches.route");
const bookingRoutes = require("../modules/bookings/bookings.route");
const promotionRoutes = require("../modules/promotions/promotions.route");
const paymentRoutes = require("../modules/payments/payments.route");
const articleRoutes = require("../modules/articles/articles.route");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "API is healthy" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/venues", venueRoutes);
router.use("/pitches", pitchRoutes);
router.use("/bookings", bookingRoutes);
router.use("/promotions", promotionRoutes);
router.use("/payments", paymentRoutes);
router.use("/articles", articleRoutes);

module.exports = router;
