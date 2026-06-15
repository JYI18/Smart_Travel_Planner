const express = require("express");
const Trip = require("../models/Trip");

const router = express.Router();

function buildExternalId(item) {
  return String(
    item.externalId ||
      item.id ||
      item.xid ||
      item.place_id ||
      item.website ||
      item.url ||
      item.name ||
      ""
  ).trim();
}

function toNumberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeSpot(item) {
  const itemType = item.itemType;

  if (!["attraction", "event", "food"].includes(itemType)) {
    return null;
  }

  const externalId = buildExternalId(item);
  const name = String(item.name || "").trim();

  if (!externalId || !name) {
    return null;
  }

  return {
    itemType,
    externalId,
    name,

    image: item.image || "",
    url: item.url || item.website || "",
    description: item.description || "",
    source: item.source || "",

    // Itinerary planning fields
    dayIndex: Number.isFinite(Number(item.dayIndex)) ? Number(item.dayIndex) : 0,
    startTime: item.startTime || "",
    endTime: item.endTime || "",
    activityNotes: item.activityNotes || "",

    // Attraction
    kinds: item.kinds || "",
    lat: toNumberOrNull(item.lat || item.latitude),
    lon: toNumberOrNull(item.lon || item.longitude),
    distance: toNumberOrNull(item.distance),

    // Event
    date: item.date || "",
    time: item.time || "",
    venue: item.venue || "",
    city: item.city || "",
    country: item.country || "",

    // Food
    cuisine: item.cuisine || "",
    foodType: item.foodType || item.type || "",
    location: item.location || "",
    price: item.price || "",
    open: item.open || "",
    tags: Array.isArray(item.tags) ? item.tags : [],
  };
}

function normalizeSpots(spots) {
  if (!Array.isArray(spots)) {
    return [];
  }

  const seen = new Set();
  const cleanedSpots = [];

  spots.forEach((item) => {
    const spot = normalizeSpot(item);

    if (!spot) return;

    const key = `${spot.itemType}:${spot.externalId}`;

    if (seen.has(key)) return;

    seen.add(key);
    cleanedSpots.push(spot);
  });

  return cleanedSpots;
}

function buildTripPayload(body) {
  return {
    trip_name: body.trip_name,
    destination: body.destination,
    departure_date: body.departure_date || null,
    return_date: body.return_date || null,
    trip_style: body.trip_style || "City",
    travelers: Number(body.travelers) || 1,
    budget:
      body.budget === null || body.budget === "" || body.budget === undefined
        ? null
        : Number(body.budget),
    currency: body.currency || "USD",
    notes: body.notes || "",
    status: body.status || "planned",
    favorite: Boolean(body.favorite),
    spots: normalizeSpots(body.spots),
  };
}

// GET /api/trips
router.get("/trips", async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    console.error("Get trips error:", error);

    res.status(500).json({
      error: "Failed to load trips.",
    });
  }
});

// GET /api/trips/:id
router.get("/trips/:id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found.",
      });
    }

    res.json(trip);
  } catch (error) {
    console.error("Get trip error:", error);

    res.status(500).json({
      error: "Failed to get trip.",
    });
  }
});

// POST /api/trips
router.post("/trips", async (req, res) => {
  try {
    const payload = buildTripPayload(req.body);

    if (!payload.trip_name || !payload.destination) {
      return res.status(400).json({
        error: "Trip name and destination are required.",
      });
    }

    const trip = await Trip.create(payload);

    res.status(201).json(trip);
  } catch (error) {
    console.error("Create trip error:", error);

    res.status(500).json({
      error: "Failed to create trip.",
    });
  }
});

// PUT /api/trips/:id
router.put("/trips/:id", async (req, res) => {
  try {
    const payload = buildTripPayload(req.body);

    if (!payload.trip_name || !payload.destination) {
      return res.status(400).json({
        error: "Trip name and destination are required.",
      });
    }

    const trip = await Trip.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found.",
      });
    }

    res.json(trip);
  } catch (error) {
    console.error("Update trip error:", error);

    res.status(500).json({
      error: "Failed to update trip.",
    });
  }
});

// DELETE /api/trips/:id
router.delete("/trips/:id", async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found.",
      });
    }

    res.json({
      message: "Trip deleted.",
    });
  } catch (error) {
    console.error("Delete trip error:", error);

    res.status(500).json({
      error: "Failed to delete trip.",
    });
  }
});

module.exports = router;
const express = require("express");
<<<<<<< HEAD
const mongoose = require("mongoose");
=======
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
const Trip = require("../models/Trip");

const router = express.Router();

<<<<<<< HEAD
function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Please log in first.",
    });
  }

  next();
}

=======
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
function buildExternalId(item) {
  return String(
    item.externalId ||
      item.id ||
      item.xid ||
      item.place_id ||
      item.website ||
      item.url ||
      item.name ||
      ""
  ).trim();
}

function toNumberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

<<<<<<< HEAD
function toBoolean(value) {
  return value === true || value === "true";
}

=======
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
function normalizeSpot(item) {
  const itemType = item.itemType;

  if (!["attraction", "event", "food"].includes(itemType)) {
    return null;
  }

  const externalId = buildExternalId(item);
  const name = String(item.name || "").trim();

  if (!externalId || !name) {
    return null;
  }

<<<<<<< HEAD
  const latValue = item.lat ?? item.latitude;
  const lonValue = item.lon ?? item.longitude;

=======
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
  return {
    itemType,
    externalId,
    name,

    image: item.image || "",
    url: item.url || item.website || "",
    description: item.description || "",
    source: item.source || "",

    // Itinerary planning fields
    dayIndex: Number.isFinite(Number(item.dayIndex)) ? Number(item.dayIndex) : 0,
    startTime: item.startTime || "",
    endTime: item.endTime || "",
    activityNotes: item.activityNotes || "",

    // Attraction
    kinds: item.kinds || "",
<<<<<<< HEAD
    lat: toNumberOrNull(latValue),
    lon: toNumberOrNull(lonValue),
=======
    lat: toNumberOrNull(item.lat || item.latitude),
    lon: toNumberOrNull(item.lon || item.longitude),
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
    distance: toNumberOrNull(item.distance),

    // Event
    date: item.date || "",
    time: item.time || "",
    venue: item.venue || "",
    city: item.city || "",
    country: item.country || "",

    // Food
    cuisine: item.cuisine || "",
    foodType: item.foodType || item.type || "",
    location: item.location || "",
    price: item.price || "",
    open: item.open || "",
    tags: Array.isArray(item.tags) ? item.tags : [],
  };
}

function normalizeSpots(spots) {
  if (!Array.isArray(spots)) {
    return [];
  }

  const seen = new Set();
  const cleanedSpots = [];

  spots.forEach((item) => {
    const spot = normalizeSpot(item);

    if (!spot) return;

    const key = `${spot.itemType}:${spot.externalId}`;

    if (seen.has(key)) return;

    seen.add(key);
    cleanedSpots.push(spot);
  });

  return cleanedSpots;
}

function buildTripPayload(body) {
  return {
<<<<<<< HEAD
    trip_name: String(body.trip_name || "").trim(),
    destination: String(body.destination || "").trim(),
=======
    trip_name: body.trip_name,
    destination: body.destination,
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
    departure_date: body.departure_date || null,
    return_date: body.return_date || null,
    trip_style: body.trip_style || "City",
    travelers: Number(body.travelers) || 1,
    budget:
      body.budget === null || body.budget === "" || body.budget === undefined
        ? null
        : Number(body.budget),
    currency: body.currency || "USD",
    notes: body.notes || "",
    status: body.status || "planned",
<<<<<<< HEAD
    favorite: toBoolean(body.favorite),
=======
    favorite: Boolean(body.favorite),
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
    spots: normalizeSpots(body.spots),
  };
}

<<<<<<< HEAD
function isValidTripId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/trips
// Get only the logged-in user's trips
router.get("/trips", requireLogin, async (req, res) => {
  try {
    const trips = await Trip.find({
      userId: req.session.userId,
    }).sort({ createdAt: -1 });
=======
// GET /api/trips
router.get("/trips", async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3

    res.json(trips);
  } catch (error) {
    console.error("Get trips error:", error);

    res.status(500).json({
      error: "Failed to load trips.",
    });
  }
});

// GET /api/trips/:id
<<<<<<< HEAD
// Get one trip only if it belongs to the logged-in user
router.get("/trips/:id", requireLogin, async (req, res) => {
  try {
    if (!isValidTripId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid trip ID.",
      });
    }

    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });
=======
router.get("/trips/:id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found.",
      });
    }

    res.json(trip);
  } catch (error) {
    console.error("Get trip error:", error);

    res.status(500).json({
      error: "Failed to get trip.",
    });
  }
});

// POST /api/trips
<<<<<<< HEAD
// Create a trip for the logged-in user
router.post("/trips", requireLogin, async (req, res) => {
=======
router.post("/trips", async (req, res) => {
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
  try {
    const payload = buildTripPayload(req.body);

    if (!payload.trip_name || !payload.destination) {
      return res.status(400).json({
        error: "Trip name and destination are required.",
      });
    }

<<<<<<< HEAD
    const trip = await Trip.create({
      ...payload,
      userId: req.session.userId,
    });
=======
    const trip = await Trip.create(payload);
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3

    res.status(201).json(trip);
  } catch (error) {
    console.error("Create trip error:", error);

    res.status(500).json({
      error: "Failed to create trip.",
    });
  }
});

// PUT /api/trips/:id
<<<<<<< HEAD
// Update a trip only if it belongs to the logged-in user
router.put("/trips/:id", requireLogin, async (req, res) => {
  try {
    if (!isValidTripId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid trip ID.",
      });
    }

=======
router.put("/trips/:id", async (req, res) => {
  try {
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
    const payload = buildTripPayload(req.body);

    if (!payload.trip_name || !payload.destination) {
      return res.status(400).json({
        error: "Trip name and destination are required.",
      });
    }

<<<<<<< HEAD
    const trip = await Trip.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.session.userId,
      },
      payload,
      {
        new: true,
        runValidators: true,
      }
    );
=======
    const trip = await Trip.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found.",
      });
    }

    res.json(trip);
  } catch (error) {
    console.error("Update trip error:", error);

    res.status(500).json({
      error: "Failed to update trip.",
    });
  }
});

// DELETE /api/trips/:id
<<<<<<< HEAD
// Delete a trip only if it belongs to the logged-in user
router.delete("/trips/:id", requireLogin, async (req, res) => {
  try {
    if (!isValidTripId(req.params.id)) {
      return res.status(400).json({
        error: "Invalid trip ID.",
      });
    }

    const trip = await Trip.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.userId,
    });
=======
router.delete("/trips/:id", async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found.",
      });
    }

    res.json({
      message: "Trip deleted.",
    });
  } catch (error) {
    console.error("Delete trip error:", error);

    res.status(500).json({
      error: "Failed to delete trip.",
    });
  }
});

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
