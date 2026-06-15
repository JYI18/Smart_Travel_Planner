const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema({
  hotelId: {
    type: String,
    unique: true
  },

  name: String,

  city: String,

  country: String,

  address: String,

  starRating: Number,

  data: Object,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Hotel", HotelSchema);