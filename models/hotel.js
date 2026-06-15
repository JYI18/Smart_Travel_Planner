const mongoose = require("mongoose");

<<<<<<< HEAD
const hotelSchema = new mongoose.Schema({
  name: String,
  location: String,
  price: Number,
  rating: Number,
  image: String,
  description: String
});

module.exports = mongoose.model("Hotel", hotelSchema);
=======
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
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
