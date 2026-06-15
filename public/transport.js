const DEFAULT_DESTINATION = "George Town, Penang";
const DEFAULT_CENTER = [5.4141, 100.3288];

let map;
let destinationMarker;
let markerLayerGroup;
let routeLayer;
let placeMarkers = [];

let currentCenter = DEFAULT_CENTER;
let currentDestinationName = DEFAULT_DESTINATION;
let currentCategory = "all";
let currentResults = [];

const searchForm = document.getElementById("searchForm");
const destinationInput = document.getElementById("destinationInput");
const statusText = document.getElementById("statusText");
const transportList = document.getElementById("transportList");
const resultCount = document.getElementById("resultCount");
const categoryChips = document.querySelectorAll(".category-chip");
const nearMeBtn = document.getElementById("nearMeBtn");

const categoryLabels = {
  all: "All Transport",
  public_transport: "Public Transport",
  airport: "Airport",
  "service.taxi": "Taxi",
  "rental.car": "Car Rental",
  "rental.bicycle": "Bicycle Rental",
  parking: "Parking",
};

function initMap() {
  map = L.map("transportMap", {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView(DEFAULT_CENTER, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  markerLayerGroup = L.layerGroup().addTo(map);

  destinationMarker = L.marker(DEFAULT_CENTER).addTo(map);
  destinationMarker.bindPopup(
    `<strong>${DEFAULT_DESTINATION}</strong><br>Your selected destination.`
  );

  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.className = `mt-4 text-sm font-medium ${
    isError ? "text-red-600" : "text-slate-500"
  }`;
}

function setLoading(isLoading) {
  const searchBtn = document.getElementById("searchBtn");

  searchBtn.disabled = isLoading;
  searchBtn.innerHTML = isLoading
    ? `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Searching...`
    : `Search Transport`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDistance(meters) {
  const value = Number(meters);

  if (!Number.isFinite(value)) return "Distance unavailable";
  if (value < 1000) return `${Math.round(value)} m away`;

  return `${(value / 1000).toFixed(1)} km away`;
}

function formatDuration(seconds) {
  const value = Number(seconds);

  if (!Number.isFinite(value)) return "Time unavailable";

  const minutes = Math.round(value / 60);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours} hr ${remainingMinutes} min`;
}

function getIconForPlace(place) {
  const categories = place.categories || [];

  if (categories.some((cat) => cat.includes("airport"))) {
    return "fa-plane-departure";
  }

  if (categories.some((cat) => cat.includes("taxi"))) {
    return "fa-taxi";
  }

  if (categories.some((cat) => cat.includes("rental.car"))) {
    return "fa-car-side";
  }

  if (categories.some((cat) => cat.includes("rental.bicycle"))) {
    return "fa-bicycle";
  }

  if (categories.some((cat) => cat.includes("parking"))) {
    return "fa-square-parking";
  }

  if (categories.some((cat) => cat.includes("ferry"))) {
    return "fa-ferry";
  }

  if (categories.some((cat) => cat.includes("bus"))) {
    return "fa-bus";
  }

  if (
    categories.some(
      (cat) =>
        cat.includes("train") ||
        cat.includes("subway") ||
        cat.includes("rail")
    )
  ) {
    return "fa-train-subway";
  }

  return "fa-location-dot";
}

function createTransportMarkerIcon(iconClass) {
  return L.divIcon({
    html: `<div class="transport-marker"><i class="fa-solid ${iconClass}"></i></div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function clearRoute() {
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
}

async function geocodeDestination(query) {
  const url = `/api/transport/geocode?text=${encodeURIComponent(query)}`;
  return fetchJson(url);
}

async function fetchNearbyTransport(lat, lon, category = "all") {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    category,
    radius: "7000",
    limit: "24",
  });

  const data = await fetchJson(`/api/transport/nearby?${params.toString()}`);
  return data.places || [];
}

async function fetchRouteToPlace(place, mode = "walk") {
  const params = new URLSearchParams({
    fromLat: String(currentCenter[0]),
    fromLon: String(currentCenter[1]),
    toLat: String(place.lat),
    toLon: String(place.lon),
    mode,
  });

  return fetchJson(`/api/transport/route?${params.toString()}`);
}

function updateDestinationMarker(lat, lon, name) {
  currentCenter = [lat, lon];
  currentDestinationName = name;

  destinationMarker.setLatLng(currentCenter);
  destinationMarker.bindPopup(
    `<strong>${escapeHtml(name)}</strong><br>Your selected destination.`
  );

  map.setView(currentCenter, 13);
}

function renderMarkers(places) {
  markerLayerGroup.clearLayers();
  clearRoute();

  placeMarkers = [];

  const bounds = L.latLngBounds([currentCenter]);

  places.forEach((place, index) => {
    if (
      !Number.isFinite(Number(place.lat)) ||
      !Number.isFinite(Number(place.lon))
    ) {
      return;
    }

    const iconClass = getIconForPlace(place);

    const marker = L.marker([place.lat, place.lon], {
      icon: createTransportMarkerIcon(iconClass),
    });

    marker.bindPopup(`
      <div>
        <strong>${escapeHtml(place.name)}</strong><br>
        <span>${escapeHtml(place.address)}</span><br>
        <span style="color:#64748b;">${formatDistance(place.distance)}</span><br>
        <button
          onclick="showRoute(${index})"
          style="margin-top:10px;background:#2563eb;color:white;border:0;border-radius:999px;padding:8px 12px;font-weight:700;cursor:pointer;"
        >
          Show walking route
        </button>
      </div>
    `);

    marker.addTo(markerLayerGroup);

    placeMarkers[index] = marker;

    bounds.extend([place.lat, place.lon]);
  });

  setTimeout(() => {
    map.invalidateSize();

    if (places.length > 0) {
      map.fitBounds(bounds, { padding: [45, 45] });
    } else {
      map.setView(currentCenter, 13);
    }
  }, 100);
}

function renderTransportList(places) {
  resultCount.textContent = `${places.length} found`;

  if (places.length === 0) {
    transportList.innerHTML = `
      <div class="rounded-3xl border border-dashed border-slate-300 p-6 text-center">
        <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <h4 class="font-extrabold text-slate-900">No transport places found</h4>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          Try another category or search a larger nearby city.
        </p>
      </div>
    `;
    return;
  }

  transportList.innerHTML = places
    .map((place, index) => {
      const iconClass = getIconForPlace(place);

      return `
        <article class="rounded-3xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
          <div class="flex gap-4">
            <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white">
              <i class="fa-solid ${iconClass}"></i>
            </div>

            <div class="min-w-0 flex-1">
              <h4 class="line-clamp-1 font-extrabold text-slate-950">
                ${escapeHtml(place.name)}
              </h4>

              <p class="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                ${escapeHtml(place.address)}
              </p>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  ${formatDistance(place.distance)}
                </span>

                <button
                  type="button"
                  class="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white transition hover:bg-blue-600"
                  onclick="focusPlace(${index})"
                >
                  View on map
                </button>

                <button
                  type="button"
                  class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                  onclick="showRoute(${index})"
                >
                  Route
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        reject(new Error("Location permission was denied."));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

async function runNearMeSearch(categoryKey = currentCategory) {
  setStatus("Getting your current location...");

  const location = await getUserLocation();

  updateDestinationMarker(
    location.lat,
    location.lon,
    "Your current location"
  );

  destinationInput.value = "Near me";

  const places = await fetchNearbyTransport(
    location.lat,
    location.lon,
    categoryKey
  );

  currentResults = places;

  renderTransportList(places);
  renderMarkers(places);

  const label = categoryLabels[categoryKey] || "Transport";
  setStatus(`Showing ${label.toLowerCase()} options near you.`);
}

async function runSearch(
  destinationName = destinationInput.value.trim(),
  categoryKey = currentCategory
) {
  if (!destinationName) {
    setStatus("Please enter a destination.", true);
    return;
  }

  const normalizedDestination = destinationName.toLowerCase();

  const isNearMeSearch =
    normalizedDestination === "near me" ||
    normalizedDestination === "my location" ||
    normalizedDestination === "current location";

  try {
    setLoading(true);

    if (isNearMeSearch) {
      await runNearMeSearch(categoryKey);
      return;
    }

    setStatus(`Searching transport options around ${destinationName}...`);

    const destination = await geocodeDestination(destinationName);

    updateDestinationMarker(destination.lat, destination.lon, destination.name);

    const places = await fetchNearbyTransport(
      destination.lat,
      destination.lon,
      categoryKey
    );

    currentResults = places;

    renderTransportList(places);
    renderMarkers(places);

    const label = categoryLabels[categoryKey] || "Transport";
    setStatus(`Showing ${label.toLowerCase()} options around ${destination.name}.`);
  } catch (error) {
    console.error(error);

    currentResults = [];
    renderTransportList([]);
    markerLayerGroup.clearLayers();
    clearRoute();

    setStatus(
      error.message || "Something went wrong while loading transport data.",
      true
    );
  } finally {
    setLoading(false);
  }
}

window.focusPlace = function focusPlace(index) {
  const place = currentResults[index];
  const marker = placeMarkers[index];

  if (!place || !marker) return;

  map.setView([place.lat, place.lon], 16);

  setTimeout(() => {
    marker.openPopup();
  }, 250);
};

window.showRoute = async function showRoute(index) {
  const place = currentResults[index];

  if (!place) return;

  try {
    setStatus(`Calculating walking route to ${place.name}...`);
    clearRoute();

    const routeData = await fetchRouteToPlace(place, "walk");

    routeLayer = L.geoJSON(routeData, {
      style: {
        weight: 5,
        opacity: 0.9,
      },
    }).addTo(map);

    const routeProperties = routeData.features?.[0]?.properties || {};
    const distance = formatDistance(routeProperties.distance);
    const duration = formatDuration(routeProperties.time);

    map.fitBounds(routeLayer.getBounds(), { padding: [45, 45] });

    setStatus(`Walking route to ${place.name}: ${distance}, around ${duration}.`);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Could not calculate route.", true);
  }
};

nearMeBtn.addEventListener("click", () => {
  destinationInput.value = "Near me";
  runSearch("Near me", currentCategory);
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(destinationInput.value.trim(), currentCategory);
});

categoryChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    categoryChips.forEach((item) => item.classList.remove("active-chip"));
    chip.classList.add("active-chip");

    currentCategory = chip.dataset.category;
    runSearch(destinationInput.value.trim() || currentDestinationName, currentCategory);
  });
});

initMap();
renderTransportList([]);
runSearch("Near me", "all");