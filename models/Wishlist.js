const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

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

    // Attraction fields
    kinds: {
      type: String,
      default: "",
    },

    lat: Number,
    lon: Number,
    distance: Number,

    // Event fields
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

    // Food fields
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

    rating: {
      type: Number,
      default: null,
    },

    reviews: {
      type: Number,
      default: 0,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent same user from saving same attraction/event/food spot multiple times
wishlistSchema.index(
  { userId: 1, itemType: 1, externalId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Wishlist", wishlistSchema);