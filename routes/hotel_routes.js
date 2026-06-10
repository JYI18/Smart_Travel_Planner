const express = require("express");
const router = express.Router();

const Room = require("../models/room");
const Hotel = require("../models/hotel");
const getCountryCode = require("../utils/getCNcode");

// ============================
// SEARCH HOTELS (CLEAN + FIXED)
// ============================
router.get("/", async (req, res) => {
  try {
    const queryParams = new URLSearchParams();

    // 🌍 Get country safely
    let country = req.query.country || req.query.countryCode;

    if (country) {
      // convert "Malaysia" → "MY"
      if (country.length > 2) {
        country = await getCountryCode(country);
      }

      if (country) {
        queryParams.append("countryCode", country);
      }
    }

    // add other query params
    Object.keys(req.query).forEach((key) => {
      if (
        key !== "country" &&
        key !== "countryCode" &&
        req.query[key] !== ""
      ) {
        queryParams.append(key, req.query[key]);
      }
    });

    console.log("FINAL QUERY SENT TO LITEAPI:", queryParams.toString());

    const response = await fetch(
      `https://api.liteapi.travel/v3.0/data/hotels?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": process.env.LITEAPI_KEY,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    console.log("============== HOTEL RESPONSE ==============");
    console.log(JSON.stringify(data, null, 2));
    console.log("============================================");

    // ============================
    // SAVE TO MONGO
    // ============================
    if (data.data && data.data.length > 0) {
      for (const hotel of data.data) {
        await Hotel.findOneAndUpdate(
          { hotelId: hotel.id },
          {
            hotelId: hotel.id,
            name: hotel.name,
            city: hotel.city,
            country: hotel.country,
            address: hotel.address,
            starRating: hotel.stars,
            data: hotel,
          },
          { upsert: true, new: true }
        );
      }

      console.log(`${data.data.length} hotels saved to MongoDB`);
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

// ============================
// HOTEL ROOMS
// ============================
router.get("/availability", async (req, res) => {

  try {

    const { hotelId } = req.query;

    let rooms = await Room.find({
      hotelId
    });

    if (rooms.length === 0) {

      await Room.insertMany([

        {
          hotelId,
          roomType: "Standard Room",
          price: 200,
          maxGuests: 2,
          availableRooms: 10,
          image:
            "https://images.unsplash.com/photo-1566073771259-6a8506099945",
          amenities: [
            "WiFi",
            "Air Conditioning",
            "TV"
          ]
        },

        {
          hotelId,
          roomType: "Deluxe Room",
          price: 350,
          maxGuests: 2,
          availableRooms: 5,
          image:
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
          amenities: [
            "WiFi",
            "Breakfast",
            "TV"
          ]
        },

        {
          hotelId,
          roomType: "Family Suite",
          price: 600,
          maxGuests: 4,
          availableRooms: 3,
          image:
            "https://images.unsplash.com/photo-1590490360182-c33d57733427",
          amenities: [
            "WiFi",
            "Breakfast",
            "Bathtub"
          ]
        },

        {
          hotelId,
          roomType: "Presidential Suite",
          price: 1200,
          maxGuests: 6,
          availableRooms: 1,
          image:
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461",
          amenities: [
            "WiFi",
            "Private Pool",
            "Jacuzzi"
          ]
        }

      ]);

      rooms = await Room.find({
        hotelId
      });

    }

    res.json({
      success: true,
      hotelId,
      rooms
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms"
    });

  }

});

// ============================
// HOTEL DETAILS
// ============================
router.get("/details", async (req, res) => {
  try {
    const { hotelId } = req.query;

    const response = await fetch(
      `https://api.liteapi.travel/v3.0/data/hotel?hotelId=${hotelId}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": process.env.LITEAPI_KEY,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();
    const hotel = data.data;

    if (hotel) {
      await Hotel.findOneAndUpdate(
        { hotelId: hotel.id },
        {
          hotelId: hotel.id,
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          address: hotel.address,
          starRating: hotel.stars,
          data: hotel,
        },
        { upsert: true, new: true }
      );

      console.log("HOTEL SAVED:", hotel.name);
    }

    console.log("============== HOTEL DETAILS ==============");
    console.log(JSON.stringify(data, null, 2));
    console.log("===========================================");

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch hotel details" });
  }
});

// ============================
// VIEW SAVED HOTELS
// ============================
router.get("/saved", async (req, res) => {
  try {
    const hotels = await Hotel.find().limit(100);

    res.json({
      total: hotels.length,
      hotels,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch saved hotels" });
  }
});

module.exports = router;