const express = require("express");
const router = express.Router();
const Booking = require("../models/book");
const jwt = require("jsonwebtoken");

/* 🔐 AUTH MIDDLEWARE */
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/* 🧾 CREATE BOOKING */
router.post("/create", auth, async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, guests } = req.body;

    const booking = await Booking.create({
      userId: req.user.id,
      hotelId,
      checkIn,
      checkOut,
      guests
    });

    res.json({
      success: true,
      booking
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;