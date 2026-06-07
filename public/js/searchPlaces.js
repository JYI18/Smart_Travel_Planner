console.log("searchPlaces.js loaded");

const form = document.getElementById("placeSearchForm");
const cityInput = document.getElementById("cityInput");
const categorySelect = document.getElementById("categorySelect");
const radiusSelect = document.getElementById("radiusSelect");
const statusMessage = document.getElementById("statusMessage");
const resultSubtitle = document.getElementById("resultSubtitle");
const placesGrid = document.getElementById("placesGrid");

let map;
let markersLayer;

function initMap() {
  map = L.map("map").setView([35.6762, 139.6503], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showPlacesOnMap(places) {
  markersLayer.clearLayers();

  const validPlaces = places.filter((place) => place.lat && place.lon);

  if (validPlaces.length === 0) {
    return;
  }

  validPlaces.forEach((place) => {
    const marker = L.marker([place.lat, place.lon]).addTo(markersLayer);

    marker.bindPopup(`
      <strong>${escapeHtml(place.name)}</strong><br>
      ${escapeHtml(place.address || "Address not available")}
    `);
  });

  const bounds = L.latLngBounds(
    validPlaces.map((place) => [place.lat, place.lon])
  );

  map.fitBounds(bounds, {
    padding: [30, 30]
  });
}

function showLoading() {
  statusMessage.textContent = "Loading results...";
  resultSubtitle.textContent = "Please wait...";
  placesGrid.innerHTML = "";
}

function showError(message) {
  statusMessage.textContent = message;
  resultSubtitle.textContent = "Something went wrong.";
  placesGrid.innerHTML = "";
}

function formatDistance(distance) {
  if (!distance && distance !== 0) {
    return "";
  }

  if (distance < 1000) {
    return `${Math.round(distance)} m away`;
  }

  return `${(distance / 1000).toFixed(1)} km away`;
}

function formatCategoryText(place) {
  if (place.isEvent) {
    return "Event";
  }

  if (place.categoryLabel) {
    return place.categoryLabel;
  }

  if (place.selectedCategory) {
    return place.selectedCategory.replaceAll("_", " ");
  }

  if (place.categories && place.categories.length > 0) {
    return place.categories[0].replaceAll("_", " ");
  }

  return "Place";
}

function showPlaces(data) {
  const places = data.places || [];

  statusMessage.textContent = `Showing ${places.length} results for ${data.city}.`;
  resultSubtitle.textContent = `Category: ${data.selectedCategory || data.category}`;

  if (places.length === 0) {
    placesGrid.innerHTML = `
      <div class="col-span-full rounded-2xl bg-white p-6 text-center shadow-card ring-1 ring-slate-200">
        <p class="font-semibold text-slate-800">No results found.</p>
        <p class="mt-2 text-sm text-slate-500">
          Try a different city, category, or a bigger radius.
        </p>
      </div>
    `;
    showPlacesOnMap([]);
    return;
  }

  placesGrid.innerHTML = places
    .map((place) => {
      const categoryText = formatCategoryText(place);
      const distanceText = formatDistance(place.distance);
      const image = place.image || "/img/FlyAway_Background.jpg";

      return `
        <article class="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200">
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(place.name)}"
            class="h-48 w-full object-cover"
            onerror="this.src='/img/FlyAway_Background.jpg'"
          />

          <div class="p-4">
            <div class="flex items-center justify-between gap-3">
              <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 capitalize">
                ${escapeHtml(categoryText)}
              </span>

              <span class="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                Score ${escapeHtml(place.score)}
              </span>
            </div>

            <h3 class="mt-3 text-lg font-bold">
              ${escapeHtml(place.name)}
            </h3>

            <p class="mt-2 text-sm text-slate-600">
              ${escapeHtml(place.address || "Address not available")}
            </p>

            ${
              place.dateText
                ? `
                  <p class="mt-3 text-sm font-medium text-purple-700">
                    <i class="fa-solid fa-calendar-days mr-1"></i>
                    ${escapeHtml(place.dateText)}
                  </p>
                `
                : ""
            }

            ${
              place.description
                ? `
                  <p class="mt-3 line-clamp-3 text-sm text-slate-500">
                    ${escapeHtml(place.description)}
                  </p>
                `
                : ""
            }

            ${
              distanceText
                ? `
                  <p class="mt-3 text-sm font-medium text-sky-700">
                    <i class="fa-solid fa-location-dot mr-1"></i>
                    ${escapeHtml(distanceText)}
                  </p>
                `
                : ""
            }

            ${
              place.url
                ? `
                  <a
                    href="${escapeHtml(place.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-3 inline-flex items-center text-sm font-semibold text-sky-700 hover:underline"
                  >
                    Learn more
                    <i class="fa-solid fa-arrow-up-right-from-square ml-1 text-xs"></i>
                  </a>
                `
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  showPlacesOnMap(places);
}

async function searchPlaces(city, category, radius) {
  try {
    showLoading();

    const response = await fetch(
      `/api/search-places?city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}&radius=${encodeURIComponent(radius)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to search places.");
    }

    showPlaces(data);
  } catch (error) {
    console.error(error);
    showError(error.message || "Failed to load results. Please try again.");
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const city = cityInput.value.trim();
  const category = categorySelect.value;
  const radius = radiusSelect.value;

  if (!city) {
    showError("Please enter a city.");
    return;
  }

  searchPlaces(city, category, radius);
});

initMap();