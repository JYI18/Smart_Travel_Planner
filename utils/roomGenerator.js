function getRoomImages(hotel) {

  const defaultImages = [

    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",

    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",

    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",

    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",

    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800"

  ];

  const roomPhotos = [];

  const rooms = hotel?.data?.rooms || [];

  for (const room of rooms) {

    if (!room.photos) continue;

    for (const photo of room.photos) {

      if (
        photo.imageClass1?.toLowerCase() === "hotel room" &&
        photo.url
      ) {
        roomPhotos.push(photo.url);
      }

    }

  }

  return {

    standard:
      roomPhotos[0] || defaultImages[0],

    deluxe:
      roomPhotos[1] || roomPhotos[0] || defaultImages[1],

    family:
      roomPhotos[2] || roomPhotos[0] || defaultImages[2],

    executive:
      roomPhotos[3] || roomPhotos[0] || defaultImages[3],

    presidential:
      roomPhotos[4] || roomPhotos[0] || defaultImages[4]

  };

}

function generateRooms(hotel) {

  const stars = hotel?.starRating || 3;

  const roomImages = getRoomImages(hotel);

  let rooms = [];

  // ==========================
  // 1-2 STAR HOTEL
  // ==========================
  if (stars <= 2) {

    rooms = [

      {
        hotelId: hotel.hotelId,
        roomType: "Standard Room",
        price: 120,
        maxGuests: 2,
        availableRooms: 10,
        image: roomImages.standard,
        amenities: [
          "WiFi",
          "TV"
        ]
      },

      {
        hotelId: hotel.hotelId,
        roomType: "Deluxe Room",
        price: 180,
        maxGuests: 2,
        availableRooms: 5,
        image: roomImages.deluxe,
        amenities: [
          "WiFi",
          "TV",
          "Air Conditioning"
        ]
      }

    ];

  }

  // ==========================
  // 3-4 STAR HOTEL
  // ==========================
  else if (stars <= 4) {

    rooms = [

      {
        hotelId: hotel.hotelId,
        roomType: "Standard Room",
        price: 200,
        maxGuests: 2,
        availableRooms: 10,
        image: roomImages.standard,
        amenities: [
          "WiFi",
          "TV",
          "Air Conditioning"
        ]
      },

      {
        hotelId: hotel.hotelId,
        roomType: "Deluxe Room",
        price: 350,
        maxGuests: 2,
        availableRooms: 5,
        image: roomImages.deluxe,
        amenities: [
          "WiFi",
          "Breakfast",
          "TV"
        ]
      },

      {
        hotelId: hotel.hotelId,
        roomType: "Family Suite",
        price: 600,
        maxGuests: 4,
        availableRooms: 3,
        image: roomImages.family,
        amenities: [
          "WiFi",
          "Breakfast",
          "Bathtub"
        ]
      }

    ];

  }

  // ==========================
  // 5 STAR HOTEL
  // ==========================
  else {

    rooms = [

      {
        hotelId: hotel.hotelId,
        roomType: "Deluxe Room",
        price: 500,
        maxGuests: 2,
        availableRooms: 8,
        image: roomImages.deluxe,
        amenities: [
          "WiFi",
          "Breakfast",
          "Smart TV"
        ]
      },

      {
        hotelId: hotel.hotelId,
        roomType: "Executive Suite",
        price: 900,
        maxGuests: 4,
        availableRooms: 4,
        image: roomImages.executive,
        amenities: [
          "WiFi",
          "Breakfast",
          "Jacuzzi"
        ]
      },

      {
        hotelId: hotel.hotelId,
        roomType: "Presidential Suite",
        price: 1800,
        maxGuests: 6,
        availableRooms: 2,
        image: roomImages.presidential,
        amenities: [
          "WiFi",
          "Private Pool",
          "Jacuzzi"
        ]
      }

    ];

  }

  return rooms;

}

module.exports = generateRooms;