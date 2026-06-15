const express = require("express");
const router = express.Router();
const axios = require("axios");


const API_KEY = process.env.OPENWEATHER_API_KEY;

router.get("/:city", async (req, res) => {

  try {

    const city = req.params.city;

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    res.json(response.data);

  } catch (error) {

    res.status(500).json({
      message: "Weather API Error"
    });

  }

});

module.exports = router;