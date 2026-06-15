const express = require("express");
const Wishlist = require("../models/Wishlist");

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Please log in first.",
    });
  }

  next();
}

function toNumberOrUndefined(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function buildExternalId(item) {
  return String(
    item.id ||
      item.externalId ||
      item.xid ||
      item.place_id ||
      item.website ||
      item.url ||
      item.name
  ).trim();
}

router.get("/", requireLogin, async (req, res) => {
  try {
    const wishlist = await Wishlist.find({
      userId: req.session.userId,
    }).sort({ createdAt: -1 });

    res.json({ wishlist });
  } catch (error) {
    console.error("Get wishlist error:", error);

    res.status(500).json({
      error: "Failed to load wishlist.",
    });
  }
});

router.post("/", requireLogin, async (req, res) => {
  try {
    const { itemType, item } = req.body;

    if (!["attraction", "event", "food"].includes(itemType)) {
      return res.status(400).json({
        error: "Invalid wishlist item type.",
      });
    }

    if (!item || !item.name) {
      return res.status(400).json({
        error: "Missing wishlist item data.",
      });
    }

    const externalId = buildExternalId(item);

    if (!externalId) {
      return res.status(400).json({
        error: "Missing item id.",
      });
    }

    const savedItem = await Wishlist.findOneAndUpdate(
      {
        userId: req.session.userId,
        itemType,
        externalId,
      },
      {
        $set: {
          name: item.name,

          image: item.image || "",
          url: item.url || item.website || "",
          description: item.description || "",
          source: item.source || "",

          // Attraction
          kinds: item.kinds || "",
          lat: toNumberOrUndefined(item.lat || item.latitude),
          lon: toNumberOrUndefined(item.lon || item.longitude),
          distance: toNumberOrUndefined(item.distance),

          // Event
          date: item.date || "",
          time: item.time || "",
          venue: item.venue || "",
          city: item.city || "",
          country: item.country || "",

          // Food
          cuisine: item.cuisine || "",
          foodType: item.type || item.foodType || "",
          location: item.location || "",
          price: item.price || "",
          open: item.open || "",
          rating: toNumberOrUndefined(item.rating),
          reviews: toNumberOrUndefined(item.reviews) || 0,
          tags: Array.isArray(item.tags) ? item.tags : [],
        },

        $setOnInsert: {
          userId: req.session.userId,
          itemType,
          externalId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(201).json({
      message: "Saved to wishlist.",
      item: savedItem,
    });
  } catch (error) {
    console.error("Save wishlist error:", error);

    res.status(500).json({
      error: "Failed to save wishlist item.",
    });
  }
});

router.delete("/:itemType/:externalId", requireLogin, async (req, res) => {
  try {
    const { itemType, externalId } = req.params;

    await Wishlist.findOneAndDelete({
      userId: req.session.userId,
      itemType,
      externalId,
    });

    res.json({
      message: "Removed from wishlist.",
    });
  } catch (error) {
    console.error("Delete wishlist error:", error);

    res.status(500).json({
      error: "Failed to remove wishlist item.",
    });
  }
});

module.exports = router;