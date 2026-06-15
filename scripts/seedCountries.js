const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectDB = require("../config/db");
const Country = require("../models/country");
const countries = require("../data/countries");

async function seed() {
  try {
    console.log("Connecting to MongoDB...");

    await connectDB();

    console.log("Connected to MongoDB");

    await Country.deleteMany();
    await Country.insertMany(countries);

    console.log("Countries seeded successfully 🚀");

    process.exit();
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();