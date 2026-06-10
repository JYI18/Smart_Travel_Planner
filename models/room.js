const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  hotelId: {
    type: String,
    required: true
  },

  roomType: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  maxGuests: {
    type: Number,
    default: 2
  },

  availableRooms: {
    type: Number,
    default: 5
  },

  image: {
    type: String,
    default: ""
  },

  amenities: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model("Room", roomSchema);