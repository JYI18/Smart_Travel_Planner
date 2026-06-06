const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");

const User = require("../models/User");

const router = express.Router();

/* -----------------------------
   Avatar upload setup
----------------------------- */

const avatarUploadDir = path.join(
  __dirname,
  "..",
  "public",
  "uploads",
  "avatars"
);

if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarUploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const filename = `avatar-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;

    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

/* -----------------------------
   Pages
----------------------------- */

router.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "signup.html"));
});

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

router.get("/setup-profile", (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect("/login");
  }

  res.sendFile(path.join(__dirname, "..", "public", "setUpProfile.html"));
});

router.get("/profile", (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect("/login");
  }

  res.sendFile(path.join(__dirname, "..", "public", "profile.html"));
});

/* -----------------------------
   Signup POST route
----------------------------- */

router.post("/signup", async (req, res) => {
  try {
    console.log("Signup form data:", req.body);

    const {
      name,
      dob,
      gender,
      contact,
      current_country,
      current_city,
      email,
      password,
      confirm_password,
    } = req.body;

    if (
      !name ||
      !dob ||
      !gender ||
      !contact ||
      !current_country ||
      !current_city ||
      !email ||
      !password ||
      !confirm_password
    ) {
      return res.status(400).send("Please fill in all required fields.");
    }

    if (password !== confirm_password) {
      return res.status(400).send("Passwords do not match.");
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res
        .status(400)
        .send(
          "Password must have at least 8 characters, uppercase, lowercase, number, and special character."
        );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).send("Email already registered.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      dob,
      gender,
      contact: contact.trim(),
      current_country: current_country.trim(),
      current_city: current_city.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    req.session.userId = newUser._id;

    console.log("New user saved:", newUser.email);

    res.redirect("/setup-profile");
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === 11000) {
      return res.status(409).send("Email already registered.");
    }

    res.status(500).send("Server error during signup.");
  }
});

/* -----------------------------
   Setup Profile POST route
----------------------------- */

router.post("/setup-profile", (req, res) => {
  upload.single("avatar")(req, res, async (uploadError) => {
    try {
      if (uploadError) {
        console.error("Avatar upload error:", uploadError.message);
        return res.status(400).send(uploadError.message);
      }

      if (!req.session || !req.session.userId) {
        return res.redirect("/login");
      }

      const { aboutMe, preferredCurrency, language, travelPreferences } =
        req.body;

      const preferences = Array.isArray(travelPreferences)
        ? travelPreferences
        : travelPreferences
        ? [travelPreferences]
        : [];

      const updateData = {
        aboutMe: aboutMe ? aboutMe.trim() : "",
        preferredCurrency: preferredCurrency || "MYR",
        language: language || "English",
        travelPreferences: preferences,
      };

      if (req.file) {
        updateData.avatarUrl = `/uploads/avatars/${req.file.filename}`;
      }

      await User.findByIdAndUpdate(req.session.userId, updateData, {
        runValidators: true,
      });

      res.redirect("/profile");
    } catch (error) {
      console.error("Setup profile error:", error);
      res.status(500).send("Server error during profile setup.");
    }
  });
});

/* -----------------------------
   Profile API route
----------------------------- */

router.get("/api/profile", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: "Not logged in",
      });
    }

    const user = await User.findById(req.session.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Profile API error:", error);

    res.status(500).json({
      error: "Server error while loading profile.",
    });
  }
});

/* -----------------------------
   Logout route
----------------------------- */

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).send("Logout failed.");
    }

    res.redirect("/login");
  });
});

module.exports = router;