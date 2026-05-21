console.log("searchPlaces.js loaded");

const form = document.getElementById("placeSearchForm");
const cityInput = document.getElementById("cityInput");
const categorySelect = document.getElementById("categorySelect");
const statusMessage = document.getElementById("statusMessage");
const resultSubtitle = document.getElementById("resultSubtitle");
const placesGrid = document.getElementById("placesGrid");

function showLoading() {
  statusMessage.textContent = "Loading places...";
  resultSubtitle.textContent = "Please wait...";
  placesGrid.innerHTML = "";
}

function showError(message) {
  statusMessage.textContent = message;
  resultSubtitle.textContent = "Something went wrong.";
  placesGrid.innerHTML = "";
}

function showPlaces(data) {
  const places = data.places;

  statusMessage.textContent = `Showing ${places.length} results for ${data.city}.`;
  resultSubtitle.textContent = `Category: ${data.category}`;

  placesGrid.innerHTML = places
    .map((place) => {
      return `
        <article class="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200">
          <img
            src="${place.image}"
            alt="${place.name}"
            class="h-48 w-full object-cover"
          />

          <div class="p-4">
            <div class="flex items-center justify-between gap-3">
              <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                ${place.category}
              </span>

              <span class="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                Score ${place.score}
              </span>
            </div>

            <h3 class="mt-3 text-lg font-bold">
              ${place.name}
            </h3>

            <p class="mt-2 text-sm text-slate-600">
              ${place.address}
            </p>
          </div>
        </article>
      `;
    })
    .join("");
}

async function searchPlaces(city, category) {
  try {
    showLoading();

    const response = await fetch(
      `/api/search-places?city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to search places.");
    }

    showPlaces(data);
  } catch (error) {
    console.error(error);
    showError("Failed to load places. Please try again.");
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const city = cityInput.value.trim();
  const category = categorySelect.value;

  if (!city) {
    showError("Please enter a city.");
    return;
  }

  searchPlaces(city, category);
});