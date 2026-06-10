const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  hotelId: String,

  roomId: String,

  userId: String,

  customerName: String,

  email: String,

  checkIn: Date,

  checkOut: Date,

  totalPrice: Number,

  bookingDate: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Booking", bookingSchema);