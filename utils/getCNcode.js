const Country = require("../models/country");

async function getCountryCode(input) {
  if (!input) return null;

  const country = await Country.findOne({
    $or: [
      { name: input },
      { code: input }
    ]
  });

  return country ? country.code : input;
}

module.exports = getCountryCode;