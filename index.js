const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const hotelRoutes = require("./routes/hotel_routes");
const weatherRoutes = require("./routes/weater_routes");
const cors = require("cors");


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/hotels", hotelRoutes);
app.use("/api/weather", weatherRoutes);

// Test API route
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "not connected"
  });
});

function getGeoapifyCategories(category) {
  const categoryMap = {
    all: [
      "tourism",
      "tourism.sights",
      "tourism.attraction",
      "heritage",
      "entertainment",
      "entertainment.museum",
      "catering.restaurant",
      "catering.cafe",
      "commercial.shopping_mall",
      "accommodation.hotel",
      "natural",
      "beach",
      "public_transport"
    ],

    must_see: [
      "tourism.sights",
      "tourism.attraction",
      "tourism.attraction.viewpoint",
      "heritage"
    ],

    culture: [
      "heritage",
      "tourism.sights",
      "tourism.sights.memorial",
      "tourism.sights.building",
      "tourism.attraction.artwork",
      "religion"
    ],

    museums: [
      "entertainment.museum"
    ],

    food: [
      "catering.restaurant",
      "catering.cafe",
      "catering.fast_food"
    ],

    shopping: [
      "commercial.shopping_mall",
      "commercial.marketplace",
      "commercial.department_store",
      "commercial.supermarket"
    ],

    nature: [
      "natural",
      "beach",
      "leisure.park",
      "tourism.attraction.viewpoint"
    ],

    hotels: [
      "accommodation.hotel",
      "accommodation.hostel",
      "accommodation.guest_house",
      "accommodation.apartment"
    ],

    nightlife: [
      "catering.bar",
      "catering.pub",
      "entertainment"
    ],

    transport: [
      "public_transport",
      "airport"
    ]
  };

  return (categoryMap[category] || categoryMap.must_see).join(",");
}

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
  if (categories.includes("catering.cafe")) score += 15;
  if (categories.includes("accommodation.hotel")) score += 15;
  if (categories.includes("commercial.shopping_mall")) score += 15;
  if (categories.includes("natural")) score += 15;
  if (categories.includes("beach")) score += 15;

  if (distance < 2000) score += 20;
  else if (distance < 5000) score += 10;

  return score;
}

async function getUnsplashImage(query) {
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    return "/img/FlyAway_Background.jpg";
  }

  const url = new URL("https://api.unsplash.com/search/photos");

  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "landscape");

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      "Accept-Version": "v1"
    }
  });

  if (!response.ok) {
    console.log("Unsplash error:", response.status);
    return "/img/FlyAway_Background.jpg";
  }

  const data = await response.json();
  const photo = data.results && data.results[0];

  if (!photo) {
    return "/img/FlyAway_Background.jpg";
  }

  return photo.urls.regular;
}

app.get("/api/search-places", async (req, res) => {
  try {
    const city = req.query.city || "Tokyo";
    const category = req.query.category || "all";
    const radius = Number(req.query.radius) || 10000;

    if (!process.env.GEOAPIFY_API_KEY) {
      return res.status(500).json({
        error: "Missing GEOAPIFY_API_KEY in .env file"
      });
    }

    console.log("Searching city:", city);
    console.log("Category:", category);

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

    const placesUrl = new URL("https://api.geoapify.com/v2/places");

    placesUrl.searchParams.set("categories", getGeoapifyCategories(category));
    placesUrl.searchParams.set("filter", `circle:${lon},${lat},${radius}`);
    placesUrl.searchParams.set("bias", `proximity:${lon},${lat}`);
    placesUrl.searchParams.set("limit", "12");
    placesUrl.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY);

    const placesResponse = await fetch(placesUrl);

    if (!placesResponse.ok) {
      return res.status(500).json({
        error: `Geoapify places failed with status ${placesResponse.status}`
      });
    }

    const placesData = await placesResponse.json();

    const places = await Promise.all(
      placesData.features.map(async (place) => {
        const name =
          place.properties.name ||
          place.properties.address_line1 ||
          "Unknown place";

        const imageQuery = `${name} ${city} travel landmark`;
        const image = await getUnsplashImage(imageQuery);

        return {
          id: place.properties.place_id,
          name: name,
          address: place.properties.formatted || "Address not available",
          selectedCategory: category,
          categories: place.properties.categories || [],
          score: calculateScore(place),
          distance: place.properties.distance,
          lat: place.properties.lat,
          lon: place.properties.lon,
          image: image
        };
      })
    );

    places.sort((a, b) => b.score - a.score);

    const categoriesFound = [
      ...new Set(
        placesData.features.flatMap((place) => place.properties.categories || [])
      )
    ].sort();

    res.json({
      city: cityResult.formatted,
      selectedCategory: category,
      radius: radius,
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