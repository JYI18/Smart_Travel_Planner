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

<<<<<<< HEAD
    image: {
      type: String,
      default: "",
    },

    url: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      default: "",
    },

=======
    image: String,
    url: String,
    description: String,
    source: String,

    // Itinerary planning fields
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
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

<<<<<<< HEAD
    kinds: {
      type: String,
      default: "",
    },

=======
    // attraction
    kinds: String,
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
    lat: Number,
    lon: Number,
    distance: Number,

<<<<<<< HEAD
    date: {
      type: String,
      default: "",
    },

    time: {
      type: String,
      default: "",
    },

    venue: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "",
    },

    cuisine: {
      type: String,
      default: "",
    },

    foodType: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    price: {
      type: String,
      default: "",
    },

    open: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  }
=======
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
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
);

const tripSchema = new mongoose.Schema(
  {
<<<<<<< HEAD
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

=======
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
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

<<<<<<< HEAD
module.exports = mongoose.model("Trip", tripSchema);
=======
module.exports = mongoose.model("Trip", tripSchema);
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
