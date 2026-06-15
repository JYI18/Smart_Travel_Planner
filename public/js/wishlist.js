const particles = document.getElementById("particles");
const wishlistGrid = document.getElementById("wishlistGrid");
const wishlistSummary = document.getElementById("wishlistSummary");

let wishlistItems = [];
let activeFilter = "all";

if (particles) {
  for (let i = 0; i < 30; i += 1) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "vw";
    particle.style.top = Math.random() * 80 + 10 + "vh";
    particle.style.animationDelay = Math.random() * 8 + "s";
    particle.style.animationDuration = Math.random() * 6 + 6 + "s";
    particles.appendChild(particle);
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatEventDate(date, time) {
  if (!date) return "Date not available";

  const parsedDate = new Date(`${date}T${time || "00:00"}`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  const dateText = parsedDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!time) return dateText;

  return `${dateText} · ${String(time).slice(0, 5)}`;
}

function formatSavedDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function stripKinds(kinds) {
  return String(kinds || "")
    .split(",")
    .map((kind) => kind.replaceAll("_", " "))
    .filter(Boolean)
    .slice(0, 3);
}

function formatDistance(distance) {
  if (distance === null || distance === undefined || distance === "") return "";

  const meters = Number(distance);

  if (Number.isNaN(meters)) return "";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km away`;

  return `${Math.round(meters)} m away`;
}

function setGridLoading() {
  wishlistGrid.innerHTML = `
    <div class="md:col-span-2 lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/55">
      <i class="fa-solid fa-spinner fa-spin mr-2"></i>
      Loading wishlist.
    </div>
  `;
}

function setGridMessage(icon, title, message) {
  wishlistGrid.innerHTML = `
    <div class="md:col-span-2 lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
      <i class="fa-solid ${escapeHtml(icon)} mb-4 block text-4xl text-white/35"></i>
      <p class="font-bold text-white/75">${escapeHtml(title)}</p>
      <p class="mt-2 text-sm text-white/42">${escapeHtml(message)}</p>

      <div class="mt-5 flex flex-wrap justify-center gap-3">
        <a
          href="/attraction.html"
          class="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400"
        >
          Explore attractions and events
          <i class="fa-solid fa-arrow-right text-xs"></i>
        </a>

        <a
          href="/food.html"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/[0.1] hover:text-white"
        >
          Find food spots
          <i class="fa-solid fa-utensils text-xs"></i>
        </a>
      </div>
    </div>
  `;
}

function setGridError(error) {
  wishlistGrid.innerHTML = `
    <div class="md:col-span-2 lg:col-span-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center text-red-100">
      <i class="fa-solid fa-triangle-exclamation mb-3 block text-3xl"></i>
      ${escapeHtml(error)}
    </div>
  `;
}

function updateSummary(items) {
  const attractionCount = items.filter((item) => item.itemType === "attraction").length;
  const eventCount = items.filter((item) => item.itemType === "event").length;
  const foodCount = items.filter((item) => item.itemType === "food").length;

  wishlistSummary.textContent =
    `${items.length} saved item${items.length === 1 ? "" : "s"} · ` +
    `${attractionCount} attraction${attractionCount === 1 ? "" : "s"} · ` +
    `${eventCount} event${eventCount === 1 ? "" : "s"} · ` +
    `${foodCount} food spot${foodCount === 1 ? "" : "s"}`;
}

function getFilteredItems() {
  if (activeFilter === "all") {
    return wishlistItems;
  }

  return wishlistItems.filter((item) => item.itemType === activeFilter);
}

function renderTypeBadge(item) {
  if (item.itemType === "event") {
    return `
      <span class="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-200">
        <i class="fa-solid fa-calendar-days mr-1"></i>
        Event
      </span>
    `;
  }

  if (item.itemType === "food") {
    return `
      <span class="rounded-full border border-pink-400/30 bg-pink-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-pink-200">
        <i class="fa-solid fa-utensils mr-1"></i>
        Food Spot
      </span>
    `;
  }

  return `
    <span class="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-200">
      <i class="fa-solid fa-mountain-sun mr-1"></i>
      Attraction
    </span>
  `;
}

function renderAttractionMeta(item) {
  const tags = stripKinds(item.kinds);
  const distance = formatDistance(item.distance);

  return `
    <div class="mb-3 flex flex-wrap gap-2">
      ${renderTypeBadge(item)}

      ${
        tags.length
          ? tags
              .map(
                (tag) => `
                  <span class="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
                    ${escapeHtml(tag)}
                  </span>
                `
              )
              .join("")
          : ""
      }
    </div>

    <p class="mt-3 line-clamp-3 text-sm leading-relaxed text-white/55">
      ${
        item.description
          ? escapeHtml(item.description)
          : "Description not available yet."
      }
    </p>

    <p class="mt-4 text-xs font-semibold text-white/38">
      ${
        distance
          ? `<i class="fa-solid fa-location-dot mr-1 text-amber-400"></i>${escapeHtml(distance)}`
          : `<i class="fa-solid fa-map-location-dot mr-1 text-amber-400"></i>OpenTripMap`
      }
    </p>
  `;
}

function renderEventMeta(item) {
  return `
    <div class="mb-3 flex flex-wrap gap-2">
      ${renderTypeBadge(item)}
    </div>

    <p class="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-400">
      ${escapeHtml(formatEventDate(item.date, item.time))}
    </p>

    <p class="mt-3 text-sm leading-relaxed text-white/55">
      <i class="fa-solid fa-location-dot mr-1 text-amber-400"></i>
      ${escapeHtml(item.venue || "Venue not available")}
      ${item.city ? ` · ${escapeHtml(item.city)}` : ""}
      ${item.country ? ` · ${escapeHtml(item.country)}` : ""}
    </p>
  `;
}

function renderFoodMeta(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];

  return `
    <div class="mb-3 flex flex-wrap gap-2">
      ${renderTypeBadge(item)}

      ${
        tags.length
          ? tags
              .map(
                (tag) => `
                  <span class="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
                    ${escapeHtml(tag)}
                  </span>
                `
              )
              .join("")
          : ""
      }
    </div>

    <p class="mt-3 text-sm leading-relaxed text-white/55">
      <i class="fa-solid fa-utensils mr-1 text-amber-400"></i>
      ${escapeHtml(item.cuisine || item.foodType || "Food")}
      ${item.foodType && item.cuisine ? ` · ${escapeHtml(item.foodType)}` : ""}
    </p>

    <p class="mt-2 line-clamp-3 text-sm leading-relaxed text-white/55">
      <i class="fa-solid fa-location-dot mr-1 text-amber-400"></i>
      ${escapeHtml(item.location || "Location unavailable")}
    </p>

    ${
      item.open
        ? `<p class="mt-2 text-xs text-white/40">
            <i class="fa-regular fa-clock mr-1 text-amber-400"></i>
            ${escapeHtml(item.open)}
          </p>`
        : ""
    }

    ${
      item.price
        ? `<p class="mt-2 text-xs font-semibold text-white/38">
            ${escapeHtml(item.price)}
          </p>`
        : ""
    }
  `;
}

function getCardImageIcon(item) {
  if (item.itemType === "event") return "fa-calendar-days";
  if (item.itemType === "food") return "fa-utensils";
  return "fa-mountain-sun";
}

function getItemUrl(item) {
  return item.url || item.website || "";
}

function createWishlistCard(item) {
  const card = document.createElement("article");

  card.className =
    "glass-card overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-amber-400/35";

  const savedDate = formatSavedDate(item.createdAt);
  const imageIcon = getCardImageIcon(item);
  const itemUrl = getItemUrl(item);

  card.innerHTML = `
    <div class="h-48 overflow-hidden bg-white/[0.04]">
      ${
        item.image
          ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="h-full w-full object-cover transition duration-500 hover:scale-105" />`
          : `<div class="flex h-full items-center justify-center text-white/35">
              <i class="fa-solid ${imageIcon} text-4xl"></i>
            </div>`
      }
    </div>

    <div class="p-5">
      ${
        item.itemType === "event"
          ? renderEventMeta(item)
          : item.itemType === "food"
            ? renderFoodMeta(item)
            : renderAttractionMeta(item)
      }

      <h3 class="mt-3 line-clamp-2 text-lg font-extrabold text-white">
        ${escapeHtml(item.name)}
      </h3>

      ${
        savedDate
          ? `<p class="mt-2 text-xs text-white/35">Saved on ${escapeHtml(savedDate)}</p>`
          : ""
      }

      <div class="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <button
          type="button"
          class="remove-wishlist-btn inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500 hover:text-white"
        >
          <i class="fa-solid fa-trash-can text-xs"></i>
          Remove
        </button>

        ${
          itemUrl
            ? `<a href="${escapeHtml(itemUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400">
                View
                <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
              </a>`
            : `<span class="text-sm text-white/35">No link</span>`
        }
      </div>
    </div>
  `;

  const removeButton = card.querySelector(".remove-wishlist-btn");

  removeButton.addEventListener("click", () => {
    removeFromWishlist(item, removeButton);
  });

  return card;
}

function getEmptyFilterIcon() {
  if (activeFilter === "event") return "fa-calendar-xmark";
  if (activeFilter === "food") return "fa-utensils";
  return "fa-map-location-dot";
}

function renderWishlist() {
  updateSummary(wishlistItems);

  const filteredItems = getFilteredItems();

  if (!wishlistItems.length) {
    setGridMessage(
      "fa-heart-crack",
      "Your wishlist is empty.",
      "Save attractions, events, and food spots from the Explore and Food pages."
    );
    return;
  }

  if (!filteredItems.length) {
    setGridMessage(
      getEmptyFilterIcon(),
      "No items in this filter.",
      "Try switching to All, or save more items from the Explore or Food page."
    );
    return;
  }

  wishlistGrid.innerHTML = "";

  filteredItems.forEach((item) => {
    wishlistGrid.appendChild(createWishlistCard(item));
  });
}

async function loadWishlist() {
  setGridLoading();

  try {
    const response = await fetch("/api/wishlist");
    const data = await response.json();

    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to load wishlist.");
    }

    wishlistItems = Array.isArray(data.wishlist) ? data.wishlist : [];

    renderWishlist();
  } catch (error) {
    console.error(error);
    setGridError(error.message);
  }
}

async function removeFromWishlist(item, button) {
  const confirmed = confirm(`Remove "${item.name}" from your wishlist?`);

  if (!confirmed) return;

  try {
    button.disabled = true;
    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Removing`;

    const itemType = encodeURIComponent(item.itemType);
    const externalId = encodeURIComponent(item.externalId);

    const response = await fetch(`/api/wishlist/${itemType}/${externalId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to remove wishlist item.");
    }

    wishlistItems = wishlistItems.filter((wishlistItem) => {
      return !(
        wishlistItem.itemType === item.itemType &&
        wishlistItem.externalId === item.externalId
      );
    });

    renderWishlist();
  } catch (error) {
    console.error(error);
    alert(error.message);

    button.disabled = false;
    button.innerHTML = `<i class="fa-solid fa-trash-can text-xs"></i> Remove`;
  }
}

document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    document.querySelectorAll(".filter-btn").forEach((item) => {
      item.setAttribute(
        "aria-selected",
        item.dataset.filter === activeFilter ? "true" : "false"
      );
    });

    renderWishlist();
  });
});

loadWishlist();