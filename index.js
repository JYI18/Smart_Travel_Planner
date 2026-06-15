const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const hotelRoutes = require("./routes/hotel_routes");
const weatherRoutes = require("./routes/weater_routes");
const bookingRoutes = require("./routes/book.route");
const flightRoutes = require("./routes/flight_route");
const cors = require("cors");

const connectDB = require("./config/db");
const hotelRoutes = require("./routes/hotel_routes");
const weatherRoutes = require("./routes/weater_routes");
const bookingRoutes = require("./routes/book.route");
const flightRoutes = require("./routes/flight_route");
const cors = require("cors");


dotenv.config();

<<<<<<< HEAD
const connectDB = require("./config/db");
const signupRoutes = require("./routes/signup");
const foodRoutes = require("./routes/food");
const attractionRoutes = require("./routes/attraction");
const transportRoutes = require("./routes/transport");
const wishlistRoutes = require("./routes/wishlist_routes");
const tripRoutes = require("./routes/trip");

=======
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// ==========================================
// MONGOOSE SCHEMA & MODEL FOR TRIPS
// ==========================================
const tripSchema = new mongoose.Schema({
  trip_name: { type: String, required: true },
  destination: { type: String, required: true },
  departure_date: String,
  return_date: String,
  trip_style: String,
  travelers: Number,
  budget: Number,
  currency: String,
  notes: String,
  status: { type: String, default: 'planned' },
  favorite: { type: Boolean, default: false }
}, { timestamps: true });

const Trip = mongoose.model('Trip', tripSchema);

// ==========================================
// MONGOOSE SCHEMA & MODEL FOR TRIPS
// ==========================================
const tripSchema = new mongoose.Schema({
  trip_name: { type: String, required: true },
  destination: { type: String, required: true },
  departure_date: String,
  return_date: String,
  trip_style: String,
  travelers: Number,
  budget: Number,
  currency: String,
  notes: String,
  status: { type: String, default: 'planned' },
  favorite: { type: Boolean, default: false }
}, { timestamps: true });

const Trip = mongoose.model('Trip', tripSchema);

// Middleware
app.use(cors());
app.use(express.json());
<<<<<<< HEAD

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "flyaway-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use("/api", tripRoutes);

app.use("/api/wishlist", wishlistRoutes);

function requirePageLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    const redirectTo = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login.html?redirect=${redirectTo}`);
  }

  next();
}

app.get("/PlanNewTrip.html", requirePageLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "PlanNewTrip.html"));
});

app.get("/myTripList.html", requirePageLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "myTripList.html"));
});

app.get("/itenary.html", requirePageLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "itenary.html"));
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      loggedIn: false,
      error: "Please log in first.",
    });
  }

  res.json({
    loggedIn: true,
    userId: req.session.userId,
    userName: req.session.userName || "",
  });
});

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/hotels", hotelRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/flights", flightRoutes);
// Use food routes
app.use("/api", foodRoutes);

// Use attraction routes
app.use("/api", attractionRoutes);

app.use("/api/transport", transportRoutes);

=======
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/hotels", hotelRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/flights", flightRoutes);
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
// Test API route
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "not connected"
  });
});

<<<<<<< HEAD
// Destination dropdown API cache
const destinationCache = new Map();
const destinationCacheTtlMs = 1000 * 60 * 60 * 24; // 24 hours

function getCachedDestinationData(key) {
  const cached = destinationCache.get(key);

  if (!cached) return null;

  if (Date.now() - cached.createdAt > destinationCacheTtlMs) {
    destinationCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedDestinationData(key, value) {
  destinationCache.set(key, {
    value,
    createdAt: Date.now(),
  });
}

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
      console.error("External API returned non-JSON:", {
        url: String(url),
        status: response.status,
        rawText,
      });

      throw new Error("External API returned invalid JSON");
    }

    if (!response.ok) {
      console.error("External API error:", {
        url: String(url),
        status: response.status,
        data,
      });

      throw new Error(
        data.message ||
          data.msg ||
          data.error ||
          data.errors?.[0]?.message ||
          data.fault?.faultstring ||
          `Request failed with status ${response.status}`
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function extractRestCountriesObjects(payload) {
  if (Array.isArray(payload?.data?.objects)) return payload.data.objects;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.objects)) return payload.objects;
  if (Array.isArray(payload)) return payload;
  return [];
}

function getCountryName(country) {
  return (
    country?.names?.common ||
    country?.name?.common ||
    country?.["names.common"] ||
    country?.commonName ||
    country?.name ||
    null
  );
}

function getCountryCode(country) {
  return (
    country?.codes?.alpha_2 ||
    country?.cca2 ||
    country?.["codes.alpha_2"] ||
    country?.alpha2Code ||
    null
  );
}

// Destination regions
app.get("/api/destinations/regions", (req, res) => {
  res.json({
    regions: ["Africa", "Americas", "Asia", "Europe", "Oceania"],
  });
});

// Destination countries from REST Countries v5
app.get("/api/destinations/countries", async (req, res) => {
  try {
    const regionKey = normalizeText(req.query.region);

    if (!regionKey) {
      return res.status(400).json({
        error: "Missing region",
      });
    }

    const regionMap = {
      africa: "Africa",
      americas: "Americas",
      asia: "Asia",
      europe: "Europe",
      oceania: "Oceania",
    };

    const selectedRegion = regionMap[regionKey];

    if (!selectedRegion) {
      return res.status(400).json({
        error: "Invalid region",
      });
    }

    if (!process.env.REST_COUNTRIES_API_KEY) {
      return res.status(500).json({
        error: "Missing REST_COUNTRIES_API_KEY in .env file",
      });
    }

    const cacheKey = `countries:${regionKey}`;
    const cachedCountries = getCachedDestinationData(cacheKey);

    if (cachedCountries) {
      return res.json({ countries: cachedCountries });
    }

    const countriesUrl = new URL("https://api.restcountries.com/countries/v5");

    countriesUrl.searchParams.set("region", selectedRegion);
    countriesUrl.searchParams.set("limit", "100");
    countriesUrl.searchParams.set("response_fields", "names,codes,region");

    const countriesPayload = await fetchJsonWithTimeout(countriesUrl, {
      headers: {
        Authorization: `Bearer ${process.env.REST_COUNTRIES_API_KEY}`,
      },
    });

    const countriesData = extractRestCountriesObjects(countriesPayload);

    if (!Array.isArray(countriesData)) {
      console.error("Unexpected REST Countries v5 response:", countriesPayload);

      return res.status(502).json({
        error: "REST Countries returned an unexpected response",
        details: countriesPayload,
      });
    }

    const countries = countriesData
      .map((country) => {
        const name = getCountryName(country);
        const code = getCountryCode(country);

        return {
          name,
          code,
          region: country.region || selectedRegion,
        };
      })
      .filter((country) => country.name && country.code)
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log("Countries loaded:", selectedRegion, countries.length);

    setCachedDestinationData(cacheKey, countries);

    res.json({ countries });
  } catch (error) {
    console.error("Destination countries error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch countries",
    });
  }
});

// Destination states from CountriesNow
// Example: /api/destinations/states?country=Malaysia
app.get("/api/destinations/states", async (req, res) => {
  try {
    const country = String(req.query.country || "").trim();

    if (!country) {
      return res.status(400).json({
        error: "Missing country",
      });
    }

    const cacheKey = `states:${country.toLowerCase()}`;
    const cachedStates = getCachedDestinationData(cacheKey);

    if (cachedStates) {
      return res.json({ states: cachedStates });
    }

    const statesData = await fetchJsonWithTimeout(
      "https://countriesnow.space/api/v0.1/countries/states",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country }),
      }
    );

    if (statesData.error) {
      return res.status(404).json({
        error: statesData.msg || "States not found",
      });
    }

    const states = (statesData.data?.states || [])
      .map((state) => state.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    setCachedDestinationData(cacheKey, states);

    res.json({ states });
  } catch (error) {
    console.error("Destination states error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch states",
    });
  }
});

// Destination cities from CountriesNow
// Kept for weather / backwards compatibility.
// The attraction showcase should now use states instead.
app.get("/api/destinations/cities", async (req, res) => {
  try {
    const country = String(req.query.country || "").trim();

    if (!country) {
      return res.status(400).json({
        error: "Missing country",
      });
    }

    const cacheKey = `cities:${country.toLowerCase()}`;
    const cachedCities = getCachedDestinationData(cacheKey);

    if (cachedCities) {
      return res.json({ cities: cachedCities });
    }

    const citiesData = await fetchJsonWithTimeout(
      "https://countriesnow.space/api/v0.1/countries/cities",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country }),
      }
    );

    if (citiesData.error) {
      return res.status(404).json({
        error: citiesData.msg || "Cities not found",
      });
    }

    const cities = (citiesData.data || [])
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    setCachedDestinationData(cacheKey, cities);

    res.json({ cities });
  } catch (error) {
    console.error("Destination cities error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch cities",
    });
  }
});

// Weather API route
app.get("/api/weather", async (req, res) => {
  try {
    const city = req.query.city || "Tokyo";
    const date = req.query.date;

    if (!process.env.WEATHER_API_KEY) {
      return res.status(500).json({
        error: "Missing WEATHER_API_KEY in .env file",
      });
    }

    const weatherUrl = new URL("https://api.weatherapi.com/v1/forecast.json");

    weatherUrl.searchParams.set("key", process.env.WEATHER_API_KEY);
    weatherUrl.searchParams.set("q", city);
    weatherUrl.searchParams.set("aqi", "no");
    weatherUrl.searchParams.set("alerts", "no");

    if (date) {
      weatherUrl.searchParams.set("dt", date);
    } else {
      weatherUrl.searchParams.set("days", "3");
    }

    const weatherData = await fetchJsonWithTimeout(weatherUrl);

    res.json(weatherData);
  } catch (error) {
    console.error("Weather API error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch weather data",
    });
  }
});

// Currency API route
app.get("/api/currency", async (req, res) => {
  try {
    const amount = Number(req.query.amount || 1);
    const from = req.query.from || "MYR";
    const to = req.query.to || "JPY";

    if (!process.env.CURRENCY_API_KEY) {
      return res.status(500).json({
        error: "Missing CURRENCY_API_KEY in .env file",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Amount must be greater than 0",
      });
    }

    if (from === to) {
      return res.json({
        amount,
        from,
        to,
        rate: 1,
        result: amount,
        date: new Date().toISOString(),
      });
    }

    const currencyUrl = new URL("https://api.currencyapi.com/v3/latest");

    currencyUrl.searchParams.set("base_currency", from);
    currencyUrl.searchParams.set("currencies", to);

    const currencyData = await fetchJsonWithTimeout(currencyUrl, {
      headers: {
        apikey: process.env.CURRENCY_API_KEY,
      },
    });

    const rate = currencyData.data?.[to]?.value;

    if (!rate) {
      return res.status(404).json({
        error: "Currency rate not found",
      });
    }

    res.json({
      amount,
      from,
      to,
      rate,
      result: amount * rate,
      date: currencyData.meta?.last_updated_at || null,
    });
  } catch (error) {
    console.error("Currency API error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch currency data",
    });
  }
});

// Location defaults route
app.get("/api/location-defaults", async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;

    if (!lat || !lon) {
      return res.status(400).json({
        error: "Missing lat or lon",
      });
    }

    if (!process.env.WEATHER_API_KEY) {
      return res.status(500).json({
        error: "Missing WEATHER_API_KEY in .env file",
      });
    }

    const weatherUrl = new URL("https://api.weatherapi.com/v1/forecast.json");

    weatherUrl.searchParams.set("key", process.env.WEATHER_API_KEY);
    weatherUrl.searchParams.set("q", `${lat},${lon}`);
    weatherUrl.searchParams.set("days", "3");
    weatherUrl.searchParams.set("aqi", "no");
    weatherUrl.searchParams.set("alerts", "no");

    const weatherData = await fetchJsonWithTimeout(weatherUrl);

    const countryName = weatherData.location.country;
    const currencyCode = await getCurrencyCodeFromCountry(countryName);

    res.json({
      weather: weatherData,
      currencyCode: currencyCode || "USD",
    });
  } catch (error) {
    console.error("Location defaults error:", error);

    res.status(500).json({
      error: error.message || "Failed to get location defaults",
    });
  }
});

async function getCurrencyCodeFromCountry(countryName) {
  const fallbackMap = {
    Malaysia: "MYR",
    Japan: "JPY",
    Singapore: "SGD",
    "United States of America": "USD",
    "United States": "USD",
    "United Kingdom": "GBP",
    France: "EUR",
    Germany: "EUR",
    Italy: "EUR",
    Spain: "EUR",
    China: "CNY",
    "South Korea": "KRW",
    Australia: "AUD",
    Canada: "CAD",
    Switzerland: "CHF",
    Thailand: "THB",
    Indonesia: "IDR",
    Philippines: "PHP",
    "New Zealand": "NZD",
    "Hong Kong": "HKD",
    Iceland: "ISK",
  };

  if (fallbackMap[countryName]) {
    return fallbackMap[countryName];
  }

  return null;
}

function normalizeWikimediaImageUrl(imageUrl) {
  if (!imageUrl) return "";

  try {
    const url = new URL(imageUrl);

    if (
      url.hostname === "upload.wikimedia.org" &&
      url.pathname.includes("/wikipedia/commons/thumb/")
    ) {
      const originalPath = url.pathname
        .replace("/wikipedia/commons/thumb/", "/wikipedia/commons/")
        .replace(/\/[^/]+$/, "");

      return `${url.origin}${originalPath}`;
    }

    return imageUrl;
  } catch (error) {
    return imageUrl;
  }
}

function getOpenTripMapImage(details) {
  const image =
    details?.preview?.source ||
    details?.image ||
    "";

  return normalizeWikimediaImageUrl(image);
}

function getOpenTripMapDescription(details) {
  return (
    details?.wikipedia_extracts?.text ||
    details?.info?.descr ||
    details?.description ||
    ""
  );
}

function getOpenTripMapUrl(details) {
  return details?.otm || details?.wikipedia || details?.url || "";
}

async function getOpenTripMapPlaceDetails(xid) {
  if (!xid) return null;

  const detailsUrl = new URL(
    `https://api.opentripmap.com/0.1/en/places/xid/${encodeURIComponent(xid)}`
  );

  detailsUrl.searchParams.set("apikey", process.env.OPENTRIPMAP_API_KEY);

  try {
    return await fetchJsonWithTimeout(detailsUrl);
  } catch (error) {
    console.error("OpenTripMap details error:", {
      xid,
      error: error.message,
    });

    return null;
  }
}

// Popular attractions showcase using OpenTripMap only
// State/province-focused version.
// Examples:
// /api/popular-attractions?state=Penang&country=Malaysia&countryCode=MY&radius=50000
// /api/popular-attractions?city=Tokyo&country=Japan&countryCode=JP&radius=10000
app.get("/api/popular-attractions", async (req, res) => {
=======
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
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
  try {
    const city = String(req.query.city || "").trim();
    const state = String(req.query.state || "").trim();
    const country = String(req.query.country || "").trim();
    const countryCode = String(req.query.countryCode || "").trim().toUpperCase();

<<<<<<< HEAD
    const locationName = state || city;
    const radius = Number(req.query.radius || (state ? 50000 : 10000));
    const limit = Math.min(Number(req.query.limit || 12), 20);

    if (!locationName) {
      return res.status(400).json({
        error: "Missing city or state",
      });
    }

    if (!countryCode) {
      return res.status(400).json({
        error: "Missing countryCode",
=======
    if (!process.env.GEOAPIFY_API_KEY) {
      return res.status(500).json({
        error: "Missing GEOAPIFY_API_KEY in .env file"
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
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
      });
    }

    if (!process.env.OPENTRIPMAP_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENTRIPMAP_API_KEY in .env file",
      });
    }

    const geonameUrl = new URL(
      "https://api.opentripmap.com/0.1/en/places/geoname"
    );

    geonameUrl.searchParams.set("name", locationName);
    geonameUrl.searchParams.set("country", countryCode);
    geonameUrl.searchParams.set("apikey", process.env.OPENTRIPMAP_API_KEY);

    const geonameData = await fetchJsonWithTimeout(geonameUrl);

    const lat = geonameData.lat;
    const lon = geonameData.lon;

    if (!lat || !lon || geonameData.status === "NOT_FOUND") {
      return res.status(404).json({
<<<<<<< HEAD
        error: `Location not found in OpenTripMap for ${locationName}, ${country || countryCode}`,
        matched: geonameData,
      });
    }

    if (
      geonameData.country &&
      geonameData.country.toUpperCase() !== countryCode
    ) {
      return res.status(404).json({
        error: `OpenTripMap matched ${geonameData.name}, ${geonameData.country}, not ${locationName}, ${country || countryCode}.`,
        matched: geonameData,
=======
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
        error: `Geoapify places failed with status ${placesResponse.status}`,
      });
    }

    const attractionsUrl = new URL(
      "https://api.opentripmap.com/0.1/en/places/radius"
    );

    attractionsUrl.searchParams.set("radius", String(radius));
    attractionsUrl.searchParams.set("lon", String(lon));
    attractionsUrl.searchParams.set("lat", String(lat));
    attractionsUrl.searchParams.set("limit", String(limit));
    attractionsUrl.searchParams.set("rate", "2");
    attractionsUrl.searchParams.set("format", "json");
    attractionsUrl.searchParams.set(
      "kinds",
      [
        "interesting_places",
        "cultural",
        "historic",
        "architecture",
        "museums",
        "natural",
      ].join(",")
    );
    attractionsUrl.searchParams.set("apikey", process.env.OPENTRIPMAP_API_KEY);

    const attractionsData = await fetchJsonWithTimeout(attractionsUrl);

    const baseAttractions = (attractionsData || [])
      .filter((place) => place.name && place.xid)
      .sort((a, b) => {
        const rateA = Number(a.rate || 0);
        const rateB = Number(b.rate || 0);
        const distanceA = Number(a.dist || 999999);
        const distanceB = Number(b.dist || 999999);

        if (rateB !== rateA) return rateB - rateA;
        return distanceA - distanceB;
      })
      .slice(0, limit);

    const attractions = await Promise.all(
      baseAttractions.map(async (place) => {
        const details = await getOpenTripMapPlaceDetails(place.xid);

        return {
<<<<<<< HEAD
          id: place.xid,
          name: details?.name || place.name,
          kinds: details?.kinds || place.kinds || "",
          rate: details?.rate || place.rate || null,
          distance: place.dist || null,
          lat: place.point?.lat || details?.point?.lat || null,
          lon: place.point?.lon || details?.point?.lon || null,
          image: details ? getOpenTripMapImage(details) : "",
          description: details ? getOpenTripMapDescription(details) : "",
          url: details ? getOpenTripMapUrl(details) : "",
=======
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
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
        };
      })
    );

<<<<<<< HEAD
    res.json({
      location: geonameData.name || locationName,
      state,
      city,
      country: geonameData.country || countryCode,
      coordinates: {
        lat,
        lon,
      },
      radius,
      source: "OpenTripMap",
      attractions,
=======
    places.sort((a, b) => b.score - a.score);

    const categoriesFound = [
      ...new Set(
        placesData.features.flatMap((place) => place.properties.categories || [])
      )
      )
    ].sort();

    res.json({
      city: cityResult.formatted,
      selectedCategory: category,
      radius: radius,
      categoriesFound: categoriesFound,
      places: places
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
    });
  } catch (error) {
    console.error("Popular attractions error:", error);

    res.status(500).json({
<<<<<<< HEAD
      error: error.message || "Failed to fetch popular attractions",
=======
      error: error.message || "Failed to search places"
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
    });
  }
});

<<<<<<< HEAD
// Upcoming events route from Ticketmaster
// Country-focused version.
// Example: /api/events?countryCode=JP
app.get("/api/events", async (req, res) => {
  try {
    const countryCode = String(req.query.countryCode || "").trim().toUpperCase();

    if (!countryCode) {
      return res.status(400).json({
        error: "Missing countryCode",
      });
    }

    if (!process.env.TICKETMASTER_API_KEY) {
      return res.status(500).json({
        error: "Missing TICKETMASTER_API_KEY in .env file",
      });
    }

    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

    const eventsUrl = new URL(
      "https://app.ticketmaster.com/discovery/v2/events.json"
    );

    eventsUrl.searchParams.set("apikey", process.env.TICKETMASTER_API_KEY);
    eventsUrl.searchParams.set("countryCode", countryCode);
    eventsUrl.searchParams.set("startDateTime", now);
    eventsUrl.searchParams.set("sort", "date,asc");
    eventsUrl.searchParams.set("size", "12");

    const eventsData = await fetchJsonWithTimeout(eventsUrl);

    const rawEvents = eventsData._embedded?.events || [];

    const events = rawEvents.map((event) => {
      const venue = event._embedded?.venues?.[0];

      return {
        id: event.id,
        name: event.name,
        url: event.url,
        image:
          event.images?.find((img) => img.ratio === "16_9")?.url ||
          event.images?.[0]?.url ||
          "",
        date: event.dates?.start?.localDate || "",
        time: event.dates?.start?.localTime || "",
        venue: venue?.name || "Venue not available",
        city: venue?.city?.name || "",
        country: venue?.country?.name || "",
      };
    });

    res.json({
      countryCode,
      events,
    });
  } catch (error) {
    console.error("Events API error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch events",
    });
  }
});

function shuffleArray(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function uniqueById(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

async function fetchTicketmasterEventsByCountry(countryCode, limit = 4) {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const eventsUrl = new URL(
    "https://app.ticketmaster.com/discovery/v2/events.json"
  );

  eventsUrl.searchParams.set("apikey", process.env.TICKETMASTER_API_KEY);
  eventsUrl.searchParams.set("countryCode", countryCode);
  eventsUrl.searchParams.set("startDateTime", now);
  eventsUrl.searchParams.set("sort", "relevance,desc");
  eventsUrl.searchParams.set("size", String(limit));

  const eventsData = await fetchJsonWithTimeout(eventsUrl);
  const rawEvents = eventsData._embedded?.events || [];

  return rawEvents.map((event) => {
    const venue = event._embedded?.venues?.[0];

    return {
      id: event.id,
      name: event.name,
      url: event.url,
      image:
        event.images?.find((img) => img.ratio === "16_9")?.url ||
        event.images?.[0]?.url ||
        "",
      date: event.dates?.start?.localDate || "",
      time: event.dates?.start?.localTime || "",
      venue: venue?.name || "Venue not available",
      city: venue?.city?.name || "",
      country: venue?.country?.name || "",
      countryCode,
    };
  });
}

async function fetchOpenTripMapAttractionsBySeed(seed, limit = 4) {
  const geonameUrl = new URL(
    "https://api.opentripmap.com/0.1/en/places/geoname"
  );

  geonameUrl.searchParams.set("name", seed.name);
  geonameUrl.searchParams.set("country", seed.countryCode);
  geonameUrl.searchParams.set("apikey", process.env.OPENTRIPMAP_API_KEY);

  const geonameData = await fetchJsonWithTimeout(geonameUrl);

  const lat = geonameData.lat;
  const lon = geonameData.lon;

  if (!lat || !lon || geonameData.status === "NOT_FOUND") {
    return [];
  }

  const attractionsUrl = new URL(
    "https://api.opentripmap.com/0.1/en/places/radius"
  );

  attractionsUrl.searchParams.set("radius", String(seed.radius || 25000));
  attractionsUrl.searchParams.set("lon", String(lon));
  attractionsUrl.searchParams.set("lat", String(lat));
  attractionsUrl.searchParams.set("limit", String(limit));
  attractionsUrl.searchParams.set("rate", "3");
  attractionsUrl.searchParams.set("format", "json");
  attractionsUrl.searchParams.set(
    "kinds",
    [
      "interesting_places",
      "cultural",
      "historic",
      "architecture",
      "museums",
      "natural",
    ].join(",")
  );
  attractionsUrl.searchParams.set("apikey", process.env.OPENTRIPMAP_API_KEY);

  const attractionsData = await fetchJsonWithTimeout(attractionsUrl);

  const baseAttractions = (attractionsData || [])
    .filter((place) => place.name && place.xid)
    .sort((a, b) => {
      const rateA = Number(a.rate || 0);
      const rateB = Number(b.rate || 0);
      const distanceA = Number(a.dist || 999999);
      const distanceB = Number(b.dist || 999999);

      if (rateB !== rateA) return rateB - rateA;
      return distanceA - distanceB;
    })
    .slice(0, limit);

  return Promise.all(
    baseAttractions.map(async (place) => {
      const details = await getOpenTripMapPlaceDetails(place.xid);

      return {
        id: place.xid,
        name: details?.name || place.name,
        kinds: details?.kinds || place.kinds || "",
        rate: details?.rate || place.rate || null,
        distance: place.dist || null,
        lat: place.point?.lat || details?.point?.lat || null,
        lon: place.point?.lon || details?.point?.lon || null,
        image: details ? getOpenTripMapImage(details) : "",
        description: details ? getOpenTripMapDescription(details) : "",
        url: details ? getOpenTripMapUrl(details) : "",
        sourceLocation: `${seed.name}, ${seed.country}`,
      };
    })
  );
}

// Random global inspiration for the Anywhere card.
// Combines famous upcoming events from Ticketmaster and famous attractions from OpenTripMap.
app.get("/api/explore/anywhere", async (req, res) => {
  try {
    const eventLimit = Math.min(Number(req.query.eventLimit || 12), 20);
    const attractionLimit = Math.min(Number(req.query.attractionLimit || 12), 20);

    if (!process.env.TICKETMASTER_API_KEY && !process.env.OPENTRIPMAP_API_KEY) {
      return res.status(500).json({
        error:
          "Missing TICKETMASTER_API_KEY and OPENTRIPMAP_API_KEY in .env file",
      });
    }

    const eventCountrySeeds = shuffleArray([
      "US",
      "GB",
      "JP",
      "FR",
      "DE",
      "ES",
      "IT",
      "AU",
      "CA",
      "SG",
    ]).slice(0, 5);

    const attractionSeeds = shuffleArray([
      { name: "Tokyo", country: "Japan", countryCode: "JP", radius: 25000 },
      { name: "Paris", country: "France", countryCode: "FR", radius: 25000 },
      { name: "London", country: "United Kingdom", countryCode: "GB", radius: 25000 },
      { name: "New York", country: "United States", countryCode: "US", radius: 30000 },
      { name: "Rome", country: "Italy", countryCode: "IT", radius: 25000 },
      { name: "Barcelona", country: "Spain", countryCode: "ES", radius: 25000 },
      { name: "Sydney", country: "Australia", countryCode: "AU", radius: 30000 },
      { name: "Bangkok", country: "Thailand", countryCode: "TH", radius: 25000 },
      { name: "Singapore", country: "Singapore", countryCode: "SG", radius: 20000 },
    ]).slice(0, 5);

    const eventResults = process.env.TICKETMASTER_API_KEY
      ? await Promise.allSettled(
          eventCountrySeeds.map((countryCode) =>
            fetchTicketmasterEventsByCountry(countryCode, 4)
          )
        )
      : [];

    const attractionResults = process.env.OPENTRIPMAP_API_KEY
      ? await Promise.allSettled(
          attractionSeeds.map((seed) =>
            fetchOpenTripMapAttractionsBySeed(seed, 4)
          )
        )
      : [];

    const events = shuffleArray(
      uniqueById(
        eventResults.flatMap((result) =>
          result.status === "fulfilled" ? result.value : []
        )
      )
    ).slice(0, eventLimit);

    const attractions = shuffleArray(
      uniqueById(
        attractionResults.flatMap((result) =>
          result.status === "fulfilled" ? result.value : []
        )
      )
    ).slice(0, attractionLimit);

    res.json({
      source: {
        events: "Ticketmaster",
        attractions: "OpenTripMap",
      },
      events,
      attractions,
    });
  } catch (error) {
    console.error("Anywhere explore error:", error);

    res.status(500).json({
      error: error.message || "Failed to load Anywhere inspiration",
    });
  }
});

=======
>>>>>>> 6ee5284739e3c48884286e541c452d21ca9bd2b3
// ==========================================
// PART A: RESTful API ENDPOINTS (CRUD)
// ==========================================

// 1. CREATE: POST /api/trips
app.post('/api/trips', async (req, res) => {
  try {
    const newTrip = new Trip(req.body);
    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip); 
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. READ ALL: GET /api/trips
app.get('/api/trips', async (req, res) => {
  try {
    const trips = await Trip.find();
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. READ ONE: GET /api/trips/:id
app.get('/api/trips/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE: PUT /api/trips/:id
app.put('/api/trips/:id', async (req, res) => {
  try {
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true } 
    );
    if (!updatedTrip) return res.status(404).json({ error: 'Trip not found' });
    res.json(updatedTrip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. DELETE: DELETE /api/trips/:id
app.delete('/api/trips/:id', async (req, res) => {
  try {
    const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
    if (!deletedTrip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// TRAVEL BUDDY & SUGGESTIONS (MODELS)
// ==========================================
const buddySchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Buddy = mongoose.model('Buddy', buddySchema);
const suggestionSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  placeName: { type: String, required: true },
  votes: { type: Number, default: 0 },
  voters: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});
const Suggestion = mongoose.model('Suggestion', suggestionSchema);

function getValidatedTripId(req, res) {
  const tripId = req.query.tripId || req.body.tripId;
  if (!tripId) {
    res.status(400).json({ error: 'Missing tripId' });
    return null;
  }
  if (!mongoose.isValidObjectId(tripId)) {
    res.status(400).json({ error: 'Invalid tripId' });
    return null;
  }
  return tripId;
}

// ==========================================
// TRAVEL BUDDY (API ENDPOINTS)
// ==========================================
// Get all friends for a shared trip
app.get('/api/buddies', async (req, res) => {
  const tripId = getValidatedTripId(req, res);
  if (!tripId) return;
  const buddies = await Buddy.find({ tripId }).sort({ createdAt: 1 });
  res.json(buddies);
});
// Add a friend to a shared trip
app.post('/api/buddies', async (req, res) => {
  const tripId = getValidatedTripId(req, res);
  const { name } = req.body;
  if (!tripId) return;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const newBuddy = new Buddy({ tripId, name: name.trim() });
  await newBuddy.save();
  res.json(newBuddy);
});
// Remove a friend
app.delete('/api/buddies/:id', async (req, res) => {
  await Buddy.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
// Get all suggestions for a shared trip
app.get('/api/suggestions', async (req, res) => {
  const tripId = getValidatedTripId(req, res);
  if (!tripId) return;
  const suggestions = await Suggestion.find({ tripId }).sort({ votes: -1, createdAt: 1 });
  res.json(suggestions);
});
// Add a suggestion to a shared trip
app.post('/api/suggestions', async (req, res) => {
  const tripId = getValidatedTripId(req, res);
  const { placeName } = req.body;
  if (!tripId) return;
  if (!placeName || !placeName.trim()) {
    return res.status(400).json({ error: 'Place name is required' });
  }

  const newSuggestion = new Suggestion({ tripId, placeName: placeName.trim() });
  await newSuggestion.save();
  res.json(newSuggestion);
});
// Vote for a suggestion in a shared trip
app.put('/api/suggestions/:id/vote', async (req, res) => {
  const tripId = getValidatedTripId(req, res);
  if (!tripId) return;

  const suggestion = await Suggestion.findOne({ _id: req.params.id, tripId });
  if (!suggestion) {
    return res.status(404).json({ error: 'Suggestion not found' });
  }

  const voterKey = req.sessionID || 'anonymous';
  if (suggestion.voters.includes(voterKey)) {
    return res.status(400).json({ error: 'You already voted for this place.' });
  }

  suggestion.votes += 1;
  suggestion.voters.push(voterKey);
  await suggestion.save();
  res.json(suggestion);
});

// ==========================================
// TRAVEL ADVISORIES (MODEL & AUTO-SEED)
// ==========================================
const advisorySchema = new mongoose.Schema({
  country: { type: String, required: true, unique: true },
  level: String,
  msg: String
});
const Advisory = mongoose.model('Advisory', advisorySchema);

// Auto-seed the database if it is empty so you don't have to type them all manually!
async function seedAdvisories() {
  try {
    const count = await Advisory.countDocuments();
    if (count === 0) {
      console.log("Seeding Travel Advisories into MongoDB...");
      const initialData = [
        { country: "ukraine", level: "EXTREME", msg: "WAR ZONE: Active conflict, avoid travel." },
        { country: "russia", level: " HIGH", msg: "Geopolitical tensions, travel advisory." },
        { country: "israel", level: " ELEVATED", msg: "Regional conflict, stay vigilant." },
        { country: "afghanistan", level: " EXTREME", msg: "Do not travel — extreme danger." },
        { country: "syria", level: " EXTREME", msg: "War zone, no travel advised." },
        { country: "mexico", level: " MEDIUM", msg: "Certain regions: increased caution." },
        { country: "thailand", level: " LOW", msg: "Generally safe, watch for petty theft." },
        { country: "japan", level: " VERY LOW", msg: "Extremely safe, earthquake aware." },
        { country: "indonesia", level: " LOW", msg: "Natural disaster prep recommended." },
        { country: "philippines", level: " MEDIUM", msg: "Some areas have restrictions." },
        { country: "brazil", level: " MEDIUM", msg: "Urban crime in major cities." },
        { country: "usa", level: " LOW", msg: "General precautions, weather alerts." },
        { country: "spain", level: " LOW", msg: "Pickpocket alert, but safe." },
        { country: "france", level: " LOW", msg: "Strike disruptions possible." }
      ];
      await Advisory.insertMany(initialData);
      console.log("Advisories successfully saved to database!");
    }
  } catch (err) {
    console.log("Seed error:", err);
  }
}
seedAdvisories();

// ==========================================
// TRAVEL ADVISORY (API ENDPOINT)
// ==========================================

// Get a specific country's advisory
app.get('/api/advisories/:country', async (req, res) => {
  try {
    const countryQuery = req.params.country.toLowerCase();
    // Search MongoDB for the specific country
    const advisory = await Advisory.findOne({ country: countryQuery });
    
    if (advisory) {
      res.json(advisory); // Found in database
    } else {
      // Not found in database, default to safe
      res.json({ level: "LOW", msg: `No major warnings for ${req.params.country}. Stay aware.` });
    }
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PART A: RESTful API ENDPOINTS (CRUD)
// ==========================================

// 1. CREATE: POST /api/trips
app.post('/api/trips', async (req, res) => {
  try {
    const newTrip = new Trip(req.body);
    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip); 
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. READ ALL: GET /api/trips
app.get('/api/trips', async (req, res) => {
  try {
    const trips = await Trip.find();
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. READ ONE: GET /api/trips/:id
app.get('/api/trips/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE: PUT /api/trips/:id
app.put('/api/trips/:id', async (req, res) => {
  try {
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true } 
    );
    if (!updatedTrip) return res.status(404).json({ error: 'Trip not found' });
    res.json(updatedTrip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. DELETE: DELETE /api/trips/:id
app.delete('/api/trips/:id', async (req, res) => {
  try {
    const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
    if (!deletedTrip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// TRAVEL BUDDY & SUGGESTIONS (MODELS)
// ==========================================
const buddySchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Buddy = mongoose.model('Buddy', buddySchema);
const suggestionSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  placeName: { type: String, required: true },
  votes: { type: Number, default: 0 },
  voters: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});
const Suggestion = mongoose.model('Suggestion', suggestionSchema);

function getValidatedTripId(req, res) {
  const tripId = req.query.tripId || req.body.tripId;
  if (!tripId) {
    res.status(400).json({ error: 'Missing tripId' });
    return null;
  }
  if (!mongoose.isValidObjectId(tripId)) {
    res.status(400).json({ error: 'Invalid tripId' });
    return null;
  }
  return tripId;
}

// ==========================================
// TRAVEL BUDDY (API ENDPOINTS)
// ==========================================
// Get all friends for a shared trip
app.get('/api/buddies', async (req, res) => {
  const tripId = getValidatedTripId(req, res);
  if (!tripId) return;
  const buddies = await Buddy.find({ tripId }).sort({ createdAt: 1 });
  res.json(buddies);
});
// Add a friend to a shared trip
app.post('/api/buddies', async (req, res) => {
  const tripId = getValidatedTripId(req, res);
  const { name } = req.body;
  if (!tripId) return;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const newBuddy = new Buddy({ tripId, name: name.trim() });
  await newBuddy.save();
  res.json(newBuddy);
});
// Remove a friend
app.delete('/api/buddies/:id', async (req, res) => {
  await Buddy.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
// Get all suggestions for a shared trip
app.get('/api/suggestions', async (req, res) => {
  const tripId = getValidatedTripId(req, res);
  if (!tripId) return;
  const suggestions = await Suggestion.find({ tripId }).sort({ votes: -1, createdAt: 1 });
  res.json(suggestions);
});
// Add a suggestion to a shared trip
app.post('/api/suggestions', async (req, res) => {
  const tripId = getValidatedTripId(req, res);
  const { placeName } = req.body;
  if (!tripId) return;
  if (!placeName || !placeName.trim()) {
    return res.status(400).json({ error: 'Place name is required' });
  }

  const newSuggestion = new Suggestion({ tripId, placeName: placeName.trim() });
  await newSuggestion.save();
  res.json(newSuggestion);
});
// Vote for a suggestion in a shared trip
app.put('/api/suggestions/:id/vote', async (req, res) => {
  const tripId = getValidatedTripId(req, res);
  if (!tripId) return;

  const suggestion = await Suggestion.findOne({ _id: req.params.id, tripId });
  if (!suggestion) {
    return res.status(404).json({ error: 'Suggestion not found' });
  }

  const voterKey = req.sessionID || 'anonymous';
  if (suggestion.voters.includes(voterKey)) {
    return res.status(400).json({ error: 'You already voted for this place.' });
  }

  suggestion.votes += 1;
  suggestion.voters.push(voterKey);
  await suggestion.save();
  res.json(suggestion);
});

// ==========================================
// TRAVEL ADVISORIES (MODEL & AUTO-SEED)
// ==========================================
const advisorySchema = new mongoose.Schema({
  country: { type: String, required: true, unique: true },
  level: String,
  msg: String
});
const Advisory = mongoose.model('Advisory', advisorySchema);

// Auto-seed the database if it is empty so you don't have to type them all manually!
async function seedAdvisories() {
  try {
    const count = await Advisory.countDocuments();
    if (count === 0) {
      console.log("Seeding Travel Advisories into MongoDB...");
      const initialData = [
        { country: "ukraine", level: "EXTREME", msg: "WAR ZONE: Active conflict, avoid travel." },
        { country: "russia", level: " HIGH", msg: "Geopolitical tensions, travel advisory." },
        { country: "israel", level: " ELEVATED", msg: "Regional conflict, stay vigilant." },
        { country: "afghanistan", level: " EXTREME", msg: "Do not travel — extreme danger." },
        { country: "syria", level: " EXTREME", msg: "War zone, no travel advised." },
        { country: "mexico", level: " MEDIUM", msg: "Certain regions: increased caution." },
        { country: "thailand", level: " LOW", msg: "Generally safe, watch for petty theft." },
        { country: "japan", level: " VERY LOW", msg: "Extremely safe, earthquake aware." },
        { country: "indonesia", level: " LOW", msg: "Natural disaster prep recommended." },
        { country: "philippines", level: " MEDIUM", msg: "Some areas have restrictions." },
        { country: "brazil", level: " MEDIUM", msg: "Urban crime in major cities." },
        { country: "usa", level: " LOW", msg: "General precautions, weather alerts." },
        { country: "spain", level: " LOW", msg: "Pickpocket alert, but safe." },
        { country: "france", level: " LOW", msg: "Strike disruptions possible." }
      ];
      await Advisory.insertMany(initialData);
      console.log("Advisories successfully saved to database!");
    }
  } catch (err) {
    console.log("Seed error:", err);
  }
}
seedAdvisories();

// ==========================================
// TRAVEL ADVISORY (API ENDPOINT)
// ==========================================

// Get a specific country's advisory
app.get('/api/advisories/:country', async (req, res) => {
  try {
    const countryQuery = req.params.country.toLowerCase();
    // Search MongoDB for the specific country
    const advisory = await Advisory.findOne({ country: countryQuery });
    
    if (advisory) {
      res.json(advisory); // Found in database
    } else {
      // Not found in database, default to safe
      res.json({ level: "LOW", msg: `No major warnings for ${req.params.country}. Stay aware.` });
    }
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});