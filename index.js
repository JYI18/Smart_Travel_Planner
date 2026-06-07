const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require("express-session");

dotenv.config();

const connectDB = require("./config/db");
const signupRoutes = require("./routes/signup");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
// This must be added BEFORE app.use("/", signupRoutes)
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

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Use signup routes
app.use("/", signupRoutes);

// Test API route
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "not connected",
  });
});

// Destination dropdown API routes
// Uses free public APIs with no API key required.
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || data.msg || `Request failed with status ${response.status}`
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

app.get("/api/destinations/regions", (req, res) => {
  res.json({
    regions: ["Africa", "Americas", "Asia", "Europe", "Oceania"],
  });
});

app.get("/api/destinations/countries", async (req, res) => {
  try {
    const region = req.query.region;

    if (!region) {
      return res.status(400).json({
        error: "Missing region",
      });
    }

    const cacheKey = `countries:${region}`;
    const cachedCountries = getCachedDestinationData(cacheKey);

    if (cachedCountries) {
      return res.json({ countries: cachedCountries });
    }

    const countriesUrl = new URL(
      `https://restcountries.com/v3.1/region/${encodeURIComponent(region)}`
    );
    countriesUrl.searchParams.set("fields", "name,cca2,region");

    const countriesData = await fetchJsonWithTimeout(countriesUrl);

    const countries = countriesData
      .map((country) => ({
        name: country.name?.common,
        code: country.cca2,
        region: country.region,
      }))
      .filter((country) => country.name)
      .sort((a, b) => a.name.localeCompare(b.name));

    setCachedDestinationData(cacheKey, countries);

    res.json({ countries });
  } catch (error) {
    console.error("Destination countries error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch countries",
    });
  }
});

app.get("/api/destinations/cities", async (req, res) => {
  try {
    const country = req.query.country;

    if (!country) {
      return res.status(400).json({
        error: "Missing country",
      });
    }

    const cacheKey = `cities:${country}`;
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

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      return res.status(weatherResponse.status).json({
        error: `WeatherAPI failed with status ${weatherResponse.status}`,
      });
    }

    const weatherData = await weatherResponse.json();

    res.json(weatherData);
  } catch (error) {
    console.error("Weather API error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch weather data",
    });
  }
});

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

    const currencyResponse = await fetch(currencyUrl, {
      headers: {
        apikey: process.env.CURRENCY_API_KEY,
      },
    });

    const currencyData = await currencyResponse.json();

    if (!currencyResponse.ok) {
      return res.status(currencyResponse.status).json({
        error: currencyData.message || "CurrencyAPI request failed",
      });
    }

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

    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (!weatherResponse.ok) {
      return res.status(weatherResponse.status).json({
        error: weatherData.error?.message || "WeatherAPI request failed",
      });
    }

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

  try {
    const countryUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(
      countryName
    )}`;
    const response = await fetch(countryUrl);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data) || !data[0]?.currencies) {
      return null;
    }

    return Object.keys(data[0].currencies)[0] || null;
  } catch (error) {
    console.error("Country currency lookup error:", error);
    return null;
  }
}

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
      "public_transport",
    ],

    must_see: [
      "tourism.sights",
      "tourism.attraction",
      "tourism.attraction.viewpoint",
      "heritage",
    ],

    culture: [
      "heritage",
      "tourism.sights",
      "tourism.sights.memorial",
      "tourism.sights.building",
      "tourism.attraction.artwork",
      "religion",
    ],

    museums: ["entertainment.museum"],

    food: ["catering.restaurant", "catering.cafe", "catering.fast_food"],

    shopping: [
      "commercial.shopping_mall",
      "commercial.marketplace",
      "commercial.department_store",
      "commercial.supermarket",
    ],

    nature: ["natural", "beach", "leisure.park", "tourism.attraction.viewpoint"],

    hotels: [
      "accommodation.hotel",
      "accommodation.hostel",
      "accommodation.guest_house",
      "accommodation.apartment",
    ],

    nightlife: ["catering.bar", "catering.pub", "entertainment"],

    transport: ["public_transport", "airport"],
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
      "Accept-Version": "v1",
    },
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
        error: "Missing GEOAPIFY_API_KEY in .env file",
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
        error: `Geoapify geocode failed with status ${geocodeResponse.status}`,
      });
    }

    const geocodeData = await geocodeResponse.json();
    const cityResult = geocodeData.results && geocodeData.results[0];

    if (!cityResult) {
      return res.status(404).json({
        error: "City not found",
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
          image: image,
        };
      })
    );

    places.sort((a, b) => b.score - a.score);

    const categoriesFound = [
      ...new Set(
        placesData.features.flatMap((place) => place.properties.categories || [])
      ),
    ].sort();

    res.json({
      city: cityResult.formatted,
      selectedCategory: category,
      radius: radius,
      categoriesFound: categoriesFound,
      places: places,
    });
  } catch (error) {
    console.error("Search places error:", error);

    res.status(500).json({
      error: error.message || "Failed to search places",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});