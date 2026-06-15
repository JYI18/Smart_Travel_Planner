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


dotenv.config();

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/hotels", hotelRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/flights", flightRoutes);
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