const mongoose = require("mongoose");

const airlineSchema = new mongoose.Schema(
  {
    iataCode: {
      type: String,
      required: true,
      unique: true,
    },

    data: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Airline",
    airlineSchema
  );