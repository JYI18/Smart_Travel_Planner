const express = require("express");
const router = express.Router();

const Airline = require("../models/airline");

// ============================
// SEARCH FLIGHTS
// ============================
router.post("/search", async (req, res) => {
  try {
    const {
      legs,
      adults = 1,
      children = 0,
      infants = 0,
      currency = "USD",
      country = "US",
      maxStops = -1
    } = req.body;

    // =====================================
    // VALIDATION
    // Ensure flight search data is valid
    // before calling LiteAPI
    // =====================================

    if (!legs || !Array.isArray(legs) || legs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one flight leg is required"
      });
    }

    const airportRegex = /^[A-Z]{3}$/;

    for (const leg of legs) {
      if (
        !leg.origin ||
        !leg.destination ||
        !leg.date
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each leg must contain origin, destination and date"
        });
      }

      // Validate airport codes
      if (!airportRegex.test(leg.origin.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid origin airport code: ${leg.origin}`
        });
      }

      if (!airportRegex.test(leg.destination.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid destination airport code: ${leg.destination}`
        });
      }

      // Prevent searching past dates
      const travelDate = new Date(leg.date);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (travelDate < today) {
        return res.status(400).json({
          success: false,
          message:
            "Flight date cannot be in the past"
        });
      }
    }

    // Passenger validation
    if (adults < 1 || adults > 9) {
      return res.status(400).json({
        success: false,
        message:
          "Adults must be between 1 and 9"
      });
    }

    // =====================================
    // TIMEOUT PROTECTION
    // Stops hanging API requests
    // =====================================

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      10000
    );

    const response = await fetch(
      "https://api.liteapi.travel/v3.0/flights/rates",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "X-API-Key": process.env.LITEAPI_KEY,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          legs,
          adults,
          children,
          infants,
          currency,
          country,
          maxStops,
          sort: {
            sortBy: "price",
            sortOrder: "asc",
          },
        }),
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    console.log("============== FLIGHT SEARCH ==============");
    console.log(JSON.stringify(data, null, 2));
    console.log("===========================================");

    res.json(data);

  } catch (error) {

    if (error.name === "AbortError") {
      return res.status(408).json({
        success: false,
        message:
          "Flight search timed out"
      });
    }

    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to search flights",
    });
  }
});

// ============================
// AIRLINE DETAILS BY IATA
// ============================
router.get("/airline/:iataCode", async (req, res) => {
  try {

    const iataCode =
      req.params.iataCode.toUpperCase();

    // =====================================
    // VALIDATION
    // Ensure valid airline IATA code
    // =====================================

    const iataRegex = /^[A-Z0-9]{2}$/;

    if (!iataRegex.test(iataCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid IATA code"
      });
    }

    // =====================================
    // CACHE CHECK
    // Use MongoDB before calling LiteAPI
    // =====================================

    const cachedAirline =
      await Airline.findOne({
        iataCode
      });

    if (cachedAirline) {

      console.log(
        "AIRLINE LOADED FROM CACHE"
      );

      return res.json({
        success: true,
        source: "cache",
        data: cachedAirline.data
      });
    }

    // =====================================
    // TIMEOUT PROTECTION
    // =====================================

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      10000
    );

    const response = await fetch(
      `https://api.liteapi.travel/v3.0/data/flights/airlines/iatas/${iataCode}`,
      {
        method: "GET",
        signal: controller.signal,
        headers: {
          "X-API-Key": process.env.LITEAPI_KEY,
          Accept: "application/json",
        },
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    // =====================================
    // SAVE AIRLINE TO CACHE
    // =====================================

    if (data.data) {
      await Airline.findOneAndUpdate(
        { iataCode },
        {
          iataCode,
          data: data.data,
        },
        {
          upsert: true,
          new: true,
        }
      );

      console.log(
        `AIRLINE SAVED TO CACHE: ${iataCode}`
      );
    }

    res.json(data);

  } catch (error) {

    if (error.name === "AbortError") {
      return res.status(408).json({
        success: false,
        message:
          "Airline lookup timed out"
      });
    }

    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch airline",
    });
  }
});
router.get("/airports/:keyword", async(req,res)=>{

    try{

        const keyword = req.params.keyword;


        const response = await fetch(
            `https://api.liteapi.travel/v3.0/data/flights/airports?q=${keyword}`,
            {
                method:"GET",
                headers:{
                    "X-API-Key":process.env.LITEAPI_KEY,
                    "Accept":"application/json"
                }
            }
        );


        const data = await response.json();


        console.log("AIRPORT SEARCH RESULT");
        console.log(JSON.stringify(data,null,2));


        res.json(data);


    }
    catch(error){

        console.error(error);

        res.status(500).json({
            message:"Airport search failed"
        });

    }

});

module.exports = router;