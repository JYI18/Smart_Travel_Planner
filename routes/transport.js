const express = require("express");

const router = express.Router();

const SEARCH_RADIUS_METERS = 7000;
const RESULT_LIMIT = 24;

const categoryConfig = {
  all: [
    "public_transport",
    "rental.car",
    "rental.bicycle",
    "parking",
  ].join(","),

  public_transport: "public_transport",
  "rental.car": "rental.car",
  "rental.bicycle": "rental.bicycle",
  parking: "parking",

  car_rental: "rental.car",
  bicycle_rental: "rental.bicycle",
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
          `Geoapify request failed with status ${response.status}`
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// GET /api/transport/geocode?text=Penang
router.get("/geocode", async (req, res) => {
  try {
    const text = String(req.query.text || "").trim();

    if (!text) {
      return res.status(400).json({
        error: "Missing text",
      });
    }

    if (!process.env.GEOAPIFY_API_KEY) {
      return res.status(500).json({
        error: "Missing GEOAPIFY_API_KEY in .env file",
      });
    }

    const geocodeUrl = new URL("https://api.geoapify.com/v1/geocode/search");

    geocodeUrl.searchParams.set("text", text);
    geocodeUrl.searchParams.set("format", "geojson");
    geocodeUrl.searchParams.set("limit", "1");
    geocodeUrl.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY);

    const data = await fetchJsonWithTimeout(geocodeUrl);

    if (!data.features || data.features.length === 0) {
      return res.status(404).json({
        error: "Destination not found",
      });
    }

    const feature = data.features[0];
    const [lon, lat] = feature.geometry.coordinates;

    res.json({
      name: feature.properties.formatted || text,
      lat,
      lon,
    });
  } catch (error) {
    console.error("Transport geocode error:", error);

    res.status(500).json({
      error: error.message || "Failed to geocode destination",
    });
  }
});

// GET /api/transport/nearby?lat=5.4141&lon=100.3288&category=all
router.get("/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const category = String(req.query.category || "all");
    const radius = Number(req.query.radius || SEARCH_RADIUS_METERS);
    const limit = Math.min(Number(req.query.limit || RESULT_LIMIT), 50);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({
        error: "Missing or invalid lat/lon",
      });
    }

    if (!process.env.GEOAPIFY_API_KEY) {
      return res.status(500).json({
        error: "Missing GEOAPIFY_API_KEY in .env file",
      });
    }

    const selectedCategories = categoryConfig[category] || categoryConfig.all;

    const placesUrl = new URL("https://api.geoapify.com/v2/places");

    placesUrl.searchParams.set("categories", selectedCategories);
    placesUrl.searchParams.set("filter", `circle:${lon},${lat},${radius}`);
    placesUrl.searchParams.set("bias", `proximity:${lon},${lat}`);
    placesUrl.searchParams.set("limit", String(limit));
    placesUrl.searchParams.set("lang", "en");
    placesUrl.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY);

    const data = await fetchJsonWithTimeout(placesUrl);

    const places = (data.features || []).map((place) => {
      const [placeLon, placeLat] = place.geometry.coordinates;

      return {
        id:
          place.properties.place_id ||
          place.properties.datasource?.raw?.osm_id ||
          `${placeLat}-${placeLon}`,
        name:
          place.properties.name ||
          place.properties.address_line1 ||
          "Unnamed transport place",
        address:
          place.properties.address_line2 ||
          place.properties.formatted ||
          "Address unavailable",
        categories: place.properties.categories || [],
        distance: place.properties.distance || null,
        lat: placeLat,
        lon: placeLon,
      };
    });

    res.json({
      lat,
      lon,
      category,
      radius,
      source: "Geoapify",
      places,
    });
  } catch (error) {
    console.error("Nearby transport error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch nearby transport places",
    });
  }
});

// GET /api/transport/route?fromLat=5.4141&fromLon=100.3288&toLat=5.42&toLon=100.34&mode=walk
router.get("/route", async (req, res) => {
  try {
    const fromLat = Number(req.query.fromLat);
    const fromLon = Number(req.query.fromLon);
    const toLat = Number(req.query.toLat);
    const toLon = Number(req.query.toLon);
    const mode = String(req.query.mode || "walk");

    if (
      !Number.isFinite(fromLat) ||
      !Number.isFinite(fromLon) ||
      !Number.isFinite(toLat) ||
      !Number.isFinite(toLon)
    ) {
      return res.status(400).json({
        error: "Missing or invalid route coordinates",
      });
    }

    if (!process.env.GEOAPIFY_API_KEY) {
      return res.status(500).json({
        error: "Missing GEOAPIFY_API_KEY in .env file",
      });
    }

    const routeUrl = new URL("https://api.geoapify.com/v1/routing");

    routeUrl.searchParams.set(
      "waypoints",
      `${fromLat},${fromLon}|${toLat},${toLon}`
    );
    routeUrl.searchParams.set("mode", mode);
    routeUrl.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY);

    const data = await fetchJsonWithTimeout(routeUrl);

    res.json(data);
  } catch (error) {
    console.error("Transport route error:", error);

    res.status(500).json({
      error: error.message || "Failed to calculate route",
    });
  }
});

module.exports = router;