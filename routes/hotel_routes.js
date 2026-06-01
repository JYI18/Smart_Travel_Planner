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

    res.json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch hotels",
    });
  }
});

module.exports = router;