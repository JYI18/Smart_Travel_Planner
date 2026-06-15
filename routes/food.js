const express = require("express");

const router = express.Router();

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop";

const IMAGE_BY_TYPE = {
  Restaurants:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop",
  Cafés:
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=500&fit=crop",
  "Fast Food":
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop",
  "Food Courts":
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop",
  Bakeries:
    "https://images.unsplash.com/photo-1509440159526-9eff2acc44e8?w=800&h=500&fit=crop",
  Bars:
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=500&fit=crop",
  Desserts:
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=500&fit=crop",
};

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (error) {
      console.error("Geoapify returned non-JSON:", {
        url: String(url),
        status: response.status,
        rawText,
      });

      throw new Error("Geoapify returned invalid JSON");
    }

    if (!response.ok) {
      console.error("Geoapify API error:", {
        url: String(url),
        status: response.status,
        data,
      });

      throw new Error(
        data.message ||
          data.error ||
          data.errors?.[0]?.message ||
          `Geoapify request failed with status ${response.status}`
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function getGeoapifyCategories(type) {
  switch (type) {
    case "Restaurants":
      return ["catering.restaurant"];

    case "Cafés":
      return ["catering.cafe"];

    case "Fast Food":
      return ["catering.fast_food"];

    case "Food Courts":
      return ["catering.food_court"];

    case "Bakeries":
      return ["commercial.food_and_drink.bakery"];

    case "Bars":
      return ["catering.bar", "catering.pub"];

    case "Desserts":
      return ["catering.ice_cream"];

    default:
      return [
        "catering.restaurant",
        "catering.cafe",
        "catering.fast_food",
        "catering.food_court",
        "commercial.food_and_drink.bakery",
        "catering.bar",
        "catering.pub",
        "catering.ice_cream",
      ];
  }
}

function inferDiningType(properties) {
  const categories = properties.categories || [];
  const joined = categories.join(" ").toLowerCase();

  if (joined.includes("catering.cafe")) return "Cafés";
  if (joined.includes("catering.fast_food")) return "Fast Food";
  if (joined.includes("catering.food_court")) return "Food Courts";
  if (joined.includes("bakery")) return "Bakeries";
  if (joined.includes("catering.bar") || joined.includes("catering.pub")) {
    return "Bars";
  }
  if (joined.includes("ice_cream")) return "Desserts";
  if (joined.includes("catering.restaurant")) return "Restaurants";

  return "Food";
}

function toTitleCase(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildCuisine(properties) {
  const raw = properties.datasource?.raw || {};

  if (raw.cuisine) {
    return String(raw.cuisine)
      .split(";")
      .map((item) => toTitleCase(item.trim()))
      .filter(Boolean)
      .slice(0, 2)
      .join(", ");
  }

  const category = properties.categories?.find((item) =>
    item.startsWith("catering.")
  );

  if (category) {
    return toTitleCase(category.replace("catering.", ""));
  }

  return "Food";
}

function buildOpeningStatus(properties) {
  const raw = properties.datasource?.raw || {};

  if (raw.opening_hours) {
    return raw.opening_hours;
  }

  return "";
}

function buildWebsite(properties) {
  const raw = properties.datasource?.raw || {};

  return (
    properties.website ||
    properties.contact?.website ||
    raw.website ||
    raw["contact:website"] ||
    ""
  );
}

function buildGeoapifyImage(properties) {
  const type = inferDiningType(properties);
  return IMAGE_BY_TYPE[type] || DEFAULT_IMAGE;
}

function normalizeGeoapifyPlace(feature) {
  const properties = feature.properties || {};
  const geometryCoords = feature.geometry?.coordinates || [];

  const cuisine = buildCuisine(properties);
  const type = inferDiningType(properties);
  const openingStatus = buildOpeningStatus(properties);

  return {
    id:
      properties.place_id ||
      properties.osm_id ||
      properties.name ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: properties.name || "Unnamed place",
    cuisine,
    type,
    location:
      properties.formatted ||
      properties.address_line2 ||
      properties.address_line1 ||
      "Location unavailable",
    rating: null,
    reviews: 0,
    price: "$$",
    image: buildGeoapifyImage(properties),
    tags: [type, cuisine].filter(Boolean).slice(0, 2),
    open: openingStatus,
    latitude: properties.lat || geometryCoords[1] || null,
    longitude: properties.lon || geometryCoords[0] || null,
    website: buildWebsite(properties),
    source: "Geoapify",
  };
}

async function geocodeNearLocation(near) {
  const geocodeUrl = new URL("https://api.geoapify.com/v1/geocode/search");

  geocodeUrl.searchParams.set("text", near);
  geocodeUrl.searchParams.set("limit", "1");
  geocodeUrl.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY);

  const geocodeData = await fetchJsonWithTimeout(geocodeUrl);
  const firstResult = geocodeData.features?.[0];

  if (!firstResult) {
    throw new Error(`Could not find coordinates for ${near}`);
  }

  const properties = firstResult.properties || {};
  const coordinates = firstResult.geometry?.coordinates || [];

  return {
    lat: properties.lat || coordinates[1],
    lon: properties.lon || coordinates[0],
    formatted: properties.formatted || near,
  };
}

function matchesSoftSearch(place, query, cuisine) {
  const queryLower = String(query || "").trim().toLowerCase();
  const cuisineLower = String(cuisine || "").trim().toLowerCase();

  const text = [
    place.name,
    place.cuisine,
    place.type,
    place.location,
    ...(place.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  const queryMatch =
    !queryLower ||
    queryLower === "restaurant" ||
    text.includes(queryLower);

  const cuisineMatch =
    !cuisineLower ||
    cuisineLower === "all" ||
    text.includes(cuisineLower);

  return queryMatch && cuisineMatch;
}

// GET /api/food-places
// Examples:
// /api/food-places?near=Tokyo,Japan&query=ramen
// /api/food-places?near=Penang,Malaysia&query=cafe
// /api/food-places?lat=35.6595&lon=139.7005&query=cafe
router.get("/food-places", async (req, res) => {
  try {
    if (!process.env.GEOAPIFY_API_KEY) {
      return res.status(500).json({
        error: "Missing GEOAPIFY_API_KEY in .env file",
      });
    }

    const query = String(req.query.query || "").trim();
    const type = String(req.query.type || "").trim();
    const cuisine = String(req.query.cuisine || "").trim();
    const near = String(req.query.near || "Tokyo, Japan").trim();
    const latParam = String(req.query.lat || "").trim();
    const lonParam = String(req.query.lon || "").trim();

    const radius = Math.min(Number(req.query.radius || 8000), 50000);
    const requestedLimit = Math.min(Number(req.query.limit || 18), 50);
    const apiLimit = Math.max(requestedLimit, 50);

    let lat = latParam;
    let lon = lonParam;
    let resolvedNear = near;

    if (!lat || !lon) {
      const geocoded = await geocodeNearLocation(near);
      lat = geocoded.lat;
      lon = geocoded.lon;
      resolvedNear = geocoded.formatted;
    }

    if (!lat || !lon) {
      return res.status(400).json({
        error: "Missing valid location coordinates",
      });
    }

    const categories = getGeoapifyCategories(type);

    const placesUrl = new URL("https://api.geoapify.com/v2/places");

    placesUrl.searchParams.set("categories", categories.join(","));
    placesUrl.searchParams.set("filter", `circle:${lon},${lat},${radius}`);
    placesUrl.searchParams.set("bias", `proximity:${lon},${lat}`);
    placesUrl.searchParams.set("limit", String(apiLimit));
    placesUrl.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY);

    const placesData = await fetchJsonWithTimeout(placesUrl);

    let places = Array.isArray(placesData.features)
      ? placesData.features.map(normalizeGeoapifyPlace)
      : [];

    const filteredPlaces = places.filter((place) =>
      matchesSoftSearch(place, query, cuisine)
    );

    if (filteredPlaces.length > 0) {
      places = filteredPlaces;
    }

    places = places.slice(0, requestedLimit);

    res.json({
      source: "Geoapify",
      query: query || "food places",
      type: type || "All",
      cuisine: cuisine || "All",
      near: latParam && lonParam ? `${lat},${lon}` : resolvedNear,
      count: places.length,
      places,
    });
  } catch (error) {
    console.error("Geoapify food places error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch food places from Geoapify",
    });
  }
});

module.exports = router;