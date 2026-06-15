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
