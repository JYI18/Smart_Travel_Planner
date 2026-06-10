function generateRooms(hotel) {

  const stars = hotel?.starRating || 3;

  const defaultImage =
    "https://via.placeholder.com/400x250";

  const hotelImages =
    hotel?.data?.hotelImages || [];

  if (stars >= 5) {

    return [
      {
        hotelId: hotel.hotelId,
        roomType: "Deluxe Room",
        price: 500,
        image:
          hotelImages[0]?.url ||
          defaultImage
      },

      {
        hotelId: hotel.hotelId,
        roomType: "Executive Suite",
        price: 900,
        image:
          hotelImages[1]?.url ||
          defaultImage
      },

      {
        hotelId: hotel.hotelId,
        roomType: "Presidential Suite",
        price: 1800,
        image:
          hotelImages[2]?.url ||
          defaultImage
      }
    ];

  }

  return [
    {
      hotelId: hotel.hotelId,
      roomType: "Standard Room",
      price: 200,
      image:
        hotelImages[0]?.url ||
        defaultImage
    }
  ];

}

module.exports = generateRooms;