const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    dob: {
      type: Date,
      required: function () {
        return this.authProvider === "local";
      },
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      default: "Prefer not to say",
    },

    contact: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      trim: true,
      default: "",
    },

    current_country: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      trim: true,
      default: "Malaysia",
    },

    current_city: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      trim: true,
      default: "",
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
      required: function () {
        return this.authProvider === "local";
      },
    },

    avatarUrl: {
      type: String,
      default: "",
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

    profileCompleted: {
      type: Boolean,
      default: false,
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