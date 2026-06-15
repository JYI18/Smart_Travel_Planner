const mongoose = require("mongoose");

const tripSpotSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["attraction", "event", "food"],
      required: true,
    },

    externalId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    image: String,
    url: String,
    description: String,
    source: String,

    // Itinerary planning fields
    dayIndex: {
      type: Number,
      default: 0,
    },

    startTime: {
      type: String,
      default: "",
    },

    endTime: {
      type: String,
      default: "",
    },

    activityNotes: {
      type: String,
      default: "",
    },

    // attraction
    kinds: String,
    lat: Number,
    lon: Number,
    distance: Number,

    // event
    date: String,
    time: String,
    venue: String,
    city: String,
    country: String,

    // food
    cuisine: String,
    foodType: String,
    location: String,
    price: String,
    open: String,
    tags: [String],
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    trip_name: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    departure_date: {
      type: Date,
      default: null,
    },

    return_date: {
      type: Date,
      default: null,
    },

    trip_style: {
      type: String,
      default: "City",
    },

    travelers: {
      type: Number,
      default: 1,
    },

    budget: {
      type: Number,
      default: null,
    },

    currency: {
      type: String,
      default: "USD",
    },

    notes: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "planned",
    },

    favorite: {
      type: Boolean,
      default: false,
    },

    spots: {
      type: [tripSpotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Trip", tripSchema);
