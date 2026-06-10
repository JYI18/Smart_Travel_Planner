const express = require("express");
const router = express.Router();

const Booking = require("../models/book");
const Room = require("../models/room");

router.post("/", async (req, res) => {

  try {

    const {
      hotelId,
      roomId,
      customerName,
      email,
      checkIn,
      checkOut
    } = req.body;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    if (room.availableRooms <= 0) {
      return res.status(400).json({
        success: false,
        message: "No rooms available"
      });
    }

    const booking = await Booking.create({

      hotelId,

      roomId,

      customerName,

      email,

      checkIn,

      checkOut,

      totalPrice: room.price

    });

    room.availableRooms--;

    await room.save();

    res.json({
      success: true,
      booking
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Booking failed"
    });

  }

});

module.exports = router;