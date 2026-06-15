const express = require("express");
const router = express.Router();

const rooms = require("../data/rooms.json");

router.get("/", (req, res) => {

  const { hotelId } = req.query;

  if (!hotelId) {
    return res.status(400).json({
      message: "hotelId required"
    });
  }

  const hotelRooms = rooms.filter(
    room => room.hotelId === hotelId
  );

  res.json({
    success: true,
    data: hotelRooms
  });
});

module.exports = router;