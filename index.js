const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Test API route
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "not connected"
  });
});

// Helper: convert your dropdown category into Geoapify categories
function getGeoapifyCategories(category) {
  if (category === "museums") {
    return "entertainment.museum";
  }

  if (category === "food") {
    return "catering.restaurant";
  }

  return "tourism.sights,tourism.attraction,heritage";
}

// Helper: simple ranking score
function calculateScore(place) {
  let score = 0;

  const name = place.properties.name;
  const categories = place.properties.categories || [];
  const distance = place.properties.distance || 999999;

  if (name) score += 30;

  if (categories.includes("tourism.sights")) score += 30;
  if (categories.includes("tourism.attraction")) score += 25;
  if (categories.includes("heritage")) score += 20;
  if (categories.includes("entertainment.museum")) score += 25;
  if (categories.includes("catering.restaurant")) score += 20;

  if (distance < 2000) score += 20;
  else if (distance < 5000) score += 10;

  return score;
}

// Search places API route
app.get("/api/search-places", async (req, res) => {
  try {
    const city = req.query.city || "Tokyo";
    const category = req.query.category || "attractions";

    if (!process.env.GEOAPIFY_API_KEY) {
      return res.status(500).json({
        error: "Missing GEOAPIFY_API_KEY in .env file"
      });
    }

    console.log("Searching city:", city);
    console.log("Category:", category);

    // 1. Convert city name into latitude and longitude
    const geocodeUrl = new URL("https://api.geoapify.com/v1/geocode/search");

    geocodeUrl.searchParams.set("text", city);
    geocodeUrl.searchParams.set("format", "json");
    geocodeUrl.searchParams.set("limit", "1");
    geocodeUrl.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY);

    const geocodeResponse = await fetch(geocodeUrl);

    if (!geocodeResponse.ok) {
      return res.status(500).json({
        error: `Geoapify geocode failed with status ${geocodeResponse.status}`
      });
    }

    const geocodeData = await geocodeResponse.json();
    const cityResult = geocodeData.results && geocodeData.results[0];

    if (!cityResult) {
      return res.status(404).json({
        error: "City not found"
      });
    }

    const lat = cityResult.lat;
    const lon = cityResult.lon;

    // 2. Search nearby places
    const placesUrl = new URL("https://api.geoapify.com/v2/places");

    placesUrl.searchParams.set("categories", getGeoapifyCategories(category));
    placesUrl.searchParams.set("filter", `circle:${lon},${lat},10000`);
    placesUrl.searchParams.set("bias", `proximity:${lon},${lat}`);
    placesUrl.searchParams.set("limit", "50");
    placesUrl.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY);

    const placesResponse = await fetch(placesUrl);

    if (!placesResponse.ok) {
      return res.status(500).json({
        error: `Geoapify places failed with status ${placesResponse.status}`
      });
    }

    const placesData = await placesResponse.json();

    const places = placesData.features.map((place) => {
      const name =
        place.properties.name ||
        place.properties.address_line1 ||
        "Unknown place";

      // return {
      //   id: place.properties.place_id,
      //   name: name,
      //   address: place.properties.formatted || "Address not available",
      //   category: category,
      //   score: calculateScore(place),
      //   distance: place.properties.distance,
      //   lat: place.properties.lat,
      //   lon: place.properties.lon,
      //   image: "/img/FlyAway_Background.jpg"
      // };
      return {
      id: place.properties.place_id,
      name: name,
      address: place.properties.formatted || "Address not available",

      // This is what the user selected in the dropdown
      selectedCategory: category,

      // These are the real categories from Geoapify
      categories: place.properties.categories || [],

      score: calculateScore(place),
      distance: place.properties.distance,
      lat: place.properties.lat,
      lon: place.properties.lon,
      image: "/img/FlyAway_Background.jpg"
    };
    });

    places.sort((a, b) => b.score - a.score);

    const categoriesFound = [
      ...new Set(
        placesData.features.flatMap((place) => place.properties.categories || [])
      )
    ].sort();
    
    res.json({
      city: cityResult.formatted,
      selectedCategory: category,
      categoriesFound: categoriesFound,
      places: places
    });
  } catch (error) {
    console.error("Search places error:", error);

    res.status(500).json({
      error: error.message || "Failed to search places"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});