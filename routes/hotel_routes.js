const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const queryParams = new URLSearchParams();

    Object.keys(req.query).forEach((key) => {
      if (req.query[key] !== "") {
        queryParams.append(key, req.query[key]);
      }
    });

    const response = await fetch(
      `https://api.liteapi.travel/v3.0/data/hotels?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": process.env.LITEAPI_KEY,
          "Accept": "application/json",
        },
      }
    );

    const data = await response.json();

    // DEBUG
    console.log("============== HOTEL RESPONSE ==============");
    console.log(JSON.stringify(data, null, 2));
    console.log("============================================");

    res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch hotels",
    });
  }
});

module.exports = router;
router.get("/details", async (req, res) => {
  try {

    const { hotelId } = req.query;

    const response = await fetch(
      `https://api.liteapi.travel/v3.0/data/hotel?hotelId=${hotelId}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": process.env.LITEAPI_KEY,
          "Accept": "application/json",
        },
      }
    );

    const data = await response.json();

    console.log("HOTEL DETAILS:");
    console.log(JSON.stringify(data, null, 2));

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to fetch hotel details",
    });

  }
});