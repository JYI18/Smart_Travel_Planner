const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      default: "Prefer not to say",
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    current_country: {
      type: String,
      required: true,
      trim: true,
      default: "Malaysia",
    },

    current_city: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatarUrl: {
      type: String,
      default: "https://i.pravatar.cc/160?img=47",
    },

    aboutMe: {
      type: String,
      trim: true,
      default: "",
    },

    preferredCurrency: {
      type: String,
      enum: ["MYR", "USD", "EUR"],
      default: "MYR",
    },

    language: {
      type: String,
      enum: ["English", "Bahasa Malaysia", "Mandarin"],
      default: "English",
    },

    travelPreferences: {
      type: [String],
      default: [],
    },

    totalTrips: {
      type: Number,
      default: 0,
    },

    countriesVisited: {
      type: Number,
      default: 0,
    },

    memberTier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);