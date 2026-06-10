const express = require("express");
const router = express.Router();

const rooms = require("../data/room.json");

/**
 * GET ROOMS BY HOTEL
 */
router.get("/", (req, res) => {
  try {
    const { hotelId } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "hotelId is required",
      });
    }

    const filteredRooms = rooms.filter(
      (room) => room.hotelId === hotelId
    );

    res.json({
      success: true,
      data: filteredRooms,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to load rooms",
    });
  }
});

module.exports = router;