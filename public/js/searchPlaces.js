const express = require("express");

const router = express.Router();

// Simple in-memory cache for destination data
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
    country?.name?.official ||
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
  const image = details?.preview?.source || details?.image || "";
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

function formatOpenTripMapAddress(details) {
  const address = details?.address || {};

  const parts = [
    address.house_number && address.road
      ? `${address.house_number} ${address.road}`
      : address.road,
    address.suburb,
    address.city || address.town || address.village,
    address.state,
    address.country,
  ].filter(Boolean);

  return parts.join(", ");
}

function formatTicketmasterAddress(venue) {
  return [
    venue?.address?.line1,
    venue?.city?.name,
    venue?.state?.name,
    venue?.country?.name,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatTicketmasterLocationDetails(venue) {
  return [
    venue?.name,
    venue?.address?.line1,
    venue?.city?.name,
    venue?.state?.name,
    venue?.country?.name,
  ]
    .filter(Boolean)
    .join(", ");
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

function shuffleArray(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function uniqueById(items) {
  const seen = new Set();

  return items.filter((item) => {
    const id = item.id || item.name;

    if (!id || seen.has(id)) return false;

    seen.add(id);
    return true;
  });
}

const ATTRACTION_CATEGORY_OPTIONS = {
  all: {
    key: "all",
    label: "All attractions",
    kinds: [
      "interesting_places",
      "cultural",
      "historic",
      "architecture",
      "museums",
      "natural",
    ],
  },
  must_see: {
    key: "must_see",
    label: "Must-see attractions",
    kinds: ["interesting_places"],
  },
  culture: {
    key: "culture",
    label: "Culture & heritage",
    kinds: ["cultural", "historic"],
  },
  museums: {
    key: "museums",
    label: "Museums",
    kinds: ["museums"],
  },
  architecture: {
    key: "architecture",
    label: "Architecture",
    kinds: ["architecture"],
  },
  nature: {
    key: "nature",
    label: "Nature & parks",
    kinds: ["natural"],
  },
  religion: {
    key: "religion",
    label: "Religious sites",
    kinds: ["religion"],
  },
  entertainment: {
    key: "entertainment",
    label: "Entertainment",
    kinds: ["amusements"],
  },
};

const EVENT_CATEGORY_OPTIONS = {
  all: {
    key: "all",
    label: "All events",
    classificationName: "",
  },
  music: {
    key: "music",
    label: "Music",
    classificationName: "Music",
  },
  sports: {
    key: "sports",
    label: "Sports",
    classificationName: "Sports",
  },
  arts: {
    key: "arts",
    label: "Arts & Theatre",
    classificationName: "Arts & Theatre",
  },
  film: {
    key: "film",
    label: "Film",
    classificationName: "Film",
  },
  miscellaneous: {
    key: "miscellaneous",
    label: "Miscellaneous",
    classificationName: "Miscellaneous",
  },
};

function normalizeCategory(value) {
  return String(value || "all").trim().toLowerCase();
}

function getAttractionCategoryConfig(value) {
  return ATTRACTION_CATEGORY_OPTIONS[normalizeCategory(value)] || null;
}

function getEventCategoryConfig(value) {
  return EVENT_CATEGORY_OPTIONS[normalizeCategory(value)] || null;
}

function categoryOptionsToArray(options) {
  return Object.values(options).map((option) => ({
    value: option.key,
    label: option.label,
  }));
}

// ===============================
// Valid Explore category APIs
// Mounted as:
// /api/explore/categories
// ===============================

router.get("/explore/categories", (req, res) => {
  res.json({
    attractionCategories: categoryOptionsToArray(ATTRACTION_CATEGORY_OPTIONS),
    eventCategories: categoryOptionsToArray(EVENT_CATEGORY_OPTIONS),
  });
});

// ===============================
// Destination dropdown APIs
// Mounted as:
// /api/destinations/regions
// /api/destinations/countries
// /api/destinations/states
// /api/destinations/cities
// ===============================

router.get("/destinations/regions", (req, res) => {
  res.json({
    regions: ["Africa", "Americas", "Asia", "Europe", "Oceania"],
  });
});

router.get("/destinations/countries", async (req, res) => {
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

    const cacheKey = `countries:${regionKey}`;
    const cachedCountries = getCachedDestinationData(cacheKey);

    if (cachedCountries) {
      return res.json({ countries: cachedCountries });
    }

    let countriesPayload;
    let countriesData;

    if (process.env.REST_COUNTRIES_API_KEY) {
      const countriesUrl = new URL("https://api.restcountries.com/countries/v5");

      countriesUrl.searchParams.set("region", selectedRegion);
      countriesUrl.searchParams.set("limit", "100");
      countriesUrl.searchParams.set("response_fields", "names,codes,region");

      countriesPayload = await fetchJsonWithTimeout(countriesUrl, {
        headers: {
          Authorization: `Bearer ${process.env.REST_COUNTRIES_API_KEY}`,
        },
      });

      countriesData = extractRestCountriesObjects(countriesPayload);
    } else {
      const publicCountriesUrl = new URL(
        `https://restcountries.com/v3.1/region/${encodeURIComponent(
          selectedRegion
        )}`
      );

      publicCountriesUrl.searchParams.set("fields", "name,cca2,region");

      countriesPayload = await fetchJsonWithTimeout(publicCountriesUrl);
      countriesData = extractRestCountriesObjects(countriesPayload);
    }

    if (!Array.isArray(countriesData)) {
      console.error("Unexpected countries response:", countriesPayload);

      return res.status(502).json({
        error: "Countries API returned an unexpected response",
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

    setCachedDestinationData(cacheKey, countries);

    res.json({ countries });
  } catch (error) {
    console.error("Destination countries error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch countries",
    });
  }
});

router.get("/destinations/states", async (req, res) => {
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

// Kept for backwards compatibility with your weather / older destination logic.
router.get("/destinations/cities", async (req, res) => {
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

// ===============================
// Attractions API
// Mounted as:
// /api/popular-attractions
// ===============================

router.get("/popular-attractions", async (req, res) => {
  try {
    const city = String(req.query.city || "").trim();
    const state = String(req.query.state || "").trim();
    const country = String(req.query.country || "").trim();
    const countryCode = String(req.query.countryCode || "").trim().toUpperCase();

    const locationName = state || city;
    const radius = Number(req.query.radius || (state ? 50000 : 10000));
    const limit = Math.min(Number(req.query.limit || 12), 20);
    const category = normalizeCategory(req.query.category);
    const attractionCategoryConfig = getAttractionCategoryConfig(category);

    if (!attractionCategoryConfig) {
      return res.status(400).json({
        error: "Invalid attraction category",
        validCategories: categoryOptionsToArray(ATTRACTION_CATEGORY_OPTIONS),
      });
    }

    if (!locationName) {
      return res.status(400).json({
        error: "Missing city or state",
      });
    }

    if (!countryCode) {
      return res.status(400).json({
        error: "Missing countryCode",
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
        error: `Location not found in OpenTripMap for ${locationName}, ${
          country || countryCode
        }`,
        matched: geonameData,
      });
    }

    if (
      geonameData.country &&
      geonameData.country.toUpperCase() !== countryCode
    ) {
      return res.status(404).json({
        error: `OpenTripMap matched ${geonameData.name}, ${geonameData.country}, not ${locationName}, ${
          country || countryCode
        }.`,
        matched: geonameData,
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
      attractionCategoryConfig.kinds.join(",")
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
        const formattedAddress = details ? formatOpenTripMapAddress(details) : "";

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
          address: formattedAddress,
          locationDetails: formattedAddress,
          category: attractionCategoryConfig.key,
          categoryLabel: attractionCategoryConfig.label,
        };
      })
    );

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
      category: attractionCategoryConfig.key,
      categoryLabel: attractionCategoryConfig.label,
      source: "OpenTripMap",
      attractions,
    });
  } catch (error) {
    console.error("Popular attractions error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch popular attractions",
    });
  }
});

// ===============================
// Upcoming Events API
// Mounted as:
// /api/events
//
// Supports optional date search:
// /api/events?countryCode=JP&startDate=2026-07-01&endDate=2026-07-31
// ===============================

function isValidDateOnly(value) {
  if (!value) return true;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsedDate.getTime());
}

function isEndDateBeforeStartDate(startDate, endDate) {
  if (!startDate || !endDate) return false;
  return new Date(`${endDate}T00:00:00Z`) < new Date(`${startDate}T00:00:00Z`);
}

router.get("/events", async (req, res) => {
  try {
    const countryCode = String(req.query.countryCode || "").trim().toUpperCase();
    const limit = Math.min(Number(req.query.limit || 12), 20);

    const startDate = String(req.query.startDate || "").trim();
    const endDate = String(req.query.endDate || "").trim();
    const category = normalizeCategory(req.query.category);
    const eventCategoryConfig = getEventCategoryConfig(category);

    if (!eventCategoryConfig) {
      return res.status(400).json({
        error: "Invalid event category",
        validCategories: categoryOptionsToArray(EVENT_CATEGORY_OPTIONS),
      });
    }

    if (!countryCode) {
      return res.status(400).json({
        error: "Missing countryCode",
      });
    }

    if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
      return res.status(400).json({
        error: "Invalid date format. Please use YYYY-MM-DD.",
      });
    }

    if (isEndDateBeforeStartDate(startDate, endDate)) {
      return res.status(400).json({
        error: "End date cannot be earlier than start date.",
      });
    }

    if (!process.env.TICKETMASTER_API_KEY) {
      return res.status(500).json({
        error: "Missing TICKETMASTER_API_KEY in .env file",
      });
    }

    const events = await fetchTicketmasterEventsByCountry(
      countryCode,
      limit,
      startDate,
      endDate,
      eventCategoryConfig.key
    );

    res.json({
      countryCode,
      startDate: startDate || null,
      endDate: endDate || null,
      category: eventCategoryConfig.key,
      categoryLabel: eventCategoryConfig.label,
      source: "Ticketmaster",
      events,
    });
  } catch (error) {
    console.error("Events API error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch events",
    });
  }
});

async function fetchTicketmasterEventsByCountry(
  countryCode,
  limit = 4,
  startDate = "",
  endDate = "",
  category = "all"
) {
  if (!process.env.TICKETMASTER_API_KEY) return [];

  const eventCategoryConfig = getEventCategoryConfig(category) || EVENT_CATEGORY_OPTIONS.all;
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const eventsUrl = new URL(
    "https://app.ticketmaster.com/discovery/v2/events.json"
  );

  eventsUrl.searchParams.set("apikey", process.env.TICKETMASTER_API_KEY);
  eventsUrl.searchParams.set("countryCode", countryCode);
  eventsUrl.searchParams.set("sort", "date,asc");
  eventsUrl.searchParams.set("size", String(limit));

  if (eventCategoryConfig.classificationName) {
    eventsUrl.searchParams.set(
      "classificationName",
      eventCategoryConfig.classificationName
    );
  }

  if (startDate) {
    eventsUrl.searchParams.set("startDateTime", `${startDate}T00:00:00Z`);
  } else {
    eventsUrl.searchParams.set("startDateTime", now);
  }

  if (endDate) {
    eventsUrl.searchParams.set("endDateTime", `${endDate}T23:59:59Z`);
  }

  const eventsData = await fetchJsonWithTimeout(eventsUrl);
  const rawEvents = eventsData._embedded?.events || [];

  return rawEvents.map((event) => {
    const venue = event._embedded?.venues?.[0];
    const classification = event.classifications?.[0];
    const address = formatTicketmasterAddress(venue);
    const locationDetails = formatTicketmasterLocationDetails(venue);

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
      lat: venue?.location?.latitude ? Number(venue.location.latitude) : null,
      lon: venue?.location?.longitude ? Number(venue.location.longitude) : null,
      address,
      locationDetails,
      category: eventCategoryConfig.key,
      categoryLabel:
        classification?.segment?.name || eventCategoryConfig.label,
      genre: classification?.genre?.name || "",
    };
  });
}

// ===============================
// Anywhere Explore API
// Mounted as:
// /api/explore/anywhere
// ===============================

async function fetchOpenTripMapAttractionsBySeed(
  seed,
  limit = 4,
  category = "all"
) {
  if (!process.env.OPENTRIPMAP_API_KEY) return [];

  const attractionCategoryConfig =
    getAttractionCategoryConfig(category) || ATTRACTION_CATEGORY_OPTIONS.all;

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
    attractionCategoryConfig.kinds.join(",")
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
      const formattedAddress = details ? formatOpenTripMapAddress(details) : "";

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
        address: formattedAddress,
        locationDetails: formattedAddress || `${seed.name}, ${seed.country}`,
        category: attractionCategoryConfig.key,
        categoryLabel: attractionCategoryConfig.label,
      };
    })
  );
}

router.get("/explore/anywhere", async (req, res) => {
  try {
    const eventLimit = Math.min(Number(req.query.eventLimit || 12), 20);
    const attractionLimit = Math.min(Number(req.query.attractionLimit || 12), 20);

    const startDate = String(req.query.startDate || "").trim();
    const endDate = String(req.query.endDate || "").trim();
    const attractionCategory = normalizeCategory(req.query.attractionCategory);
    const eventCategory = normalizeCategory(req.query.eventCategory);
    const attractionCategoryConfig = getAttractionCategoryConfig(attractionCategory);
    const eventCategoryConfig = getEventCategoryConfig(eventCategory);

    if (!attractionCategoryConfig) {
      return res.status(400).json({
        error: "Invalid attraction category",
        validCategories: categoryOptionsToArray(ATTRACTION_CATEGORY_OPTIONS),
      });
    }

    if (!eventCategoryConfig) {
      return res.status(400).json({
        error: "Invalid event category",
        validCategories: categoryOptionsToArray(EVENT_CATEGORY_OPTIONS),
      });
    }

    if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
      return res.status(400).json({
        error: "Invalid date format. Please use YYYY-MM-DD.",
      });
    }

    if (isEndDateBeforeStartDate(startDate, endDate)) {
      return res.status(400).json({
        error: "End date cannot be earlier than start date.",
      });
    }

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
      "SG",
      "AU",
      "CA",
      "FR",
      "DE",
      "ES",
      "IT",
      "NL",
      "NZ",
    ]).slice(0, 4);

    const attractionSeeds = shuffleArray([
      { name: "Tokyo", country: "Japan", countryCode: "JP", radius: 22000 },
      { name: "Paris", country: "France", countryCode: "FR", radius: 18000 },
      { name: "Rome", country: "Italy", countryCode: "IT", radius: 20000 },
      {
        name: "London",
        country: "United Kingdom",
        countryCode: "GB",
        radius: 22000,
      },
      {
        name: "New York",
        country: "United States",
        countryCode: "US",
        radius: 26000,
      },
      {
        name: "Singapore",
        country: "Singapore",
        countryCode: "SG",
        radius: 18000,
      },
      {
        name: "Sydney",
        country: "Australia",
        countryCode: "AU",
        radius: 26000,
      },
      {
        name: "Bangkok",
        country: "Thailand",
        countryCode: "TH",
        radius: 22000,
      },
      {
        name: "Kuala Lumpur",
        country: "Malaysia",
        countryCode: "MY",
        radius: 22000,
      },
      {
        name: "Barcelona",
        country: "Spain",
        countryCode: "ES",
        radius: 22000,
      },
    ]).slice(0, 4);

    const eventResults = process.env.TICKETMASTER_API_KEY
      ? await Promise.allSettled(
          eventCountrySeeds.map((countryCode) =>
            fetchTicketmasterEventsByCountry(
              countryCode,
              4,
              startDate,
              endDate,
              eventCategoryConfig.key
            )
          )
        )
      : [];

    const attractionResults = process.env.OPENTRIPMAP_API_KEY
      ? await Promise.allSettled(
          attractionSeeds.map((seed) =>
            fetchOpenTripMapAttractionsBySeed(
              seed,
              4,
              attractionCategoryConfig.key
            )
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
      startDate: startDate || null,
      endDate: endDate || null,
      attractionCategory: attractionCategoryConfig.key,
      attractionCategoryLabel: attractionCategoryConfig.label,
      eventCategory: eventCategoryConfig.key,
      eventCategoryLabel: eventCategoryConfig.label,
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

module.exports = router;