// ==============================
// WhaleData Frontend (Mapbox GL)
// ==============================

// Your API endpoint (you already set this)
const API_URL = "https://api.whaledata.org/population";

// Mapbox token
mapboxgl.accessToken = "pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWsyMWxuOWcwYnpnM2pwbjA1ZHk3Y3VrIn0.DClObJNmvE3cXpa24y48cw";

// (Optional) If you want to silence Mapbox telemetry network calls:
// mapboxgl.setTelemetryEnabled(false);

// ---------- DOM ----------
const speciesSelect = document.getElementById("species-filter");
const regionSelect = document.getElementById("region-filter");
const resetBtn = document.getElementById("reset-btn");
const resultCountEl = document.getElementById("result-count");
const emptyStateEl = document.getElementById("empty-state");
const whaleListEl = document.getElementById("whale-list");

// ---------- State ----------
let allRows = [];
let currentMarkers = [];

// ---------- Helpers ----------
function safeText(value, fallback = "—") {
  const v = (value ?? "").toString().trim();
  return v.length ? v : fallback;
}

function getScientificName(row) {
  return row.species || row.scientific_name || row.scientificName || "";
}

function getCommonName(row) {
  return row.common_name || row.vernacularName || row.commonName || "";
}

function getLat(row) {
  return row.lat ?? row.latitude ?? row.y ?? null;
}

function getLng(row) {
  return row.lng ?? row.longitude ?? row.lon ?? row.x ?? null;
}

function isValidCoord(lng, lat) {
  const Lng = Number(lng);
  const Lat = Number(lat);
  return (
    Number.isFinite(Lng) &&
    Number.isFinite(Lat) &&
    Lng >= -180 && Lng <= 180 &&
    Lat >= -90 && Lat <= 90
  );
}

function normalizeRow(row) {
  // Normalize fields so rendering and filtering are stable
  const scientific = safeText(getScientificName(row), "");
  const common = safeText(getCommonName(row), "");
  const region = safeText(row.region, "");
  const population = row.population ?? "";
  const lastUpdated = safeText(row.last_updated || row.lastUpdated, "");

  const lat = getLat(row);
  const lng = getLng(row);

  return {
    ...row,
    _scientific: scientific,
    _common: common,
    _region: region,
    _population: population,
    _lastUpdated: lastUpdated,
    _lat: lat,
    _lng: lng,
    _hasValidCoord: isValidCoord(lng, lat),
  };
}

function clearMarkers() {
  currentMarkers.forEach((m) => m.remove());
  currentMarkers = [];
}

function setEmptyState(show) {
  if (show) emptyStateEl.classList.remove("hidden");
  else emptyStateEl.classList.add("hidden");
}

function setCount(n) {
  resultCountEl.textContent = String(n);
}

// ---------- Map ----------
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/dark-v11",
  center: [0, 20],
  zoom: 1.2,
  projection: "globe",
});

map.addControl(new mapboxgl.NavigationControl(), "top-right");

// Prevent repeated world copies
map.on("style.load", () => {
  map.setRenderWorldCopies(false);
});

// ---------- Rendering ----------
function renderSidebarList(rows) {
  whaleListEl.innerHTML = "";

  rows.forEach((row) => {
    const li = document.createElement("li");

    const common = safeText(row._common, ""); // show blank as "—" in UI below
    const scientific = safeText(row._scientific);
    const population = safeText(row._population);
    const region = safeText(row._region);
    const lastUpdated = safeText(row._lastUpdated);

    li.innerHTML = `
      <div class="row-meta">
        <div class="kv"><span class="k">Common Name:</span> <span class="v">${safeText(common)}</span></div>
        <div class="kv"><span class="k">Scientific Name:</span> <span class="v">${scientific}</span></div>
        <div class="kv"><span class="k">Population:</span> <span class="v">${population}</span></div>
        <div class="kv"><span class="k">Region:</span> <span class="v">${region}</span></div>
        <div class="kv"><span class="k">Last Updated:</span> <span class="v">${lastUpdated}</span></div>
      </div>
    `;

    // Click -> fly to marker (only if coords valid)
    li.addEventListener("click", () => {
      if (!row._hasValidCoord) return;

      const lng = Number(row._lng);
      const lat = Number(row._lat);

      map.flyTo({
        center: [lng, lat],
        zoom: 4.5,
        speed: 1.2,
        curve: 1.2,
        essential: true,
      });
    });

    whaleListEl.appendChild(li);
  });
}

function buildPopupHTML(row) {
  // Scientific name on one line (CSS will enforce no-wrap on desktop)
  const scientific = safeText(row._scientific);
  const common = safeText(row._common);
  const region = safeText(row._region);
  const population = safeText(row._population);
  const lastUpdated = safeText(row._lastUpdated);

  return `
    <div class="popup-wrap">
      <div class="popup-scientific" title="${scientific}">${scientific}</div>

      <div class="popup-line"><strong>Common Name:</strong> ${safeText(common)}</div>
      <div class="popup-line"><strong>Population:</strong> ${population}</div>
      <div class="popup-line"><strong>Region:</strong> ${region}</div>
      <div class="popup-line"><strong>Last Updated:</strong> ${lastUpdated}</div>
    </div>
  `;
}

function renderMarkers(rows) {
  clearMarkers();

  // Only use valid coords for markers + bounds
  const validRows = rows.filter((r) => r._hasValidCoord);

  // Render markers
  validRows.forEach((row) => {
    const lng = Number(row._lng);
    const lat = Number(row._lat);

    const popup = new mapboxgl.Popup({
      offset: 18,
      closeButton: true,
      closeOnClick: true,
      maxWidth: "260px",
    }).setHTML(buildPopupHTML(row));

    const marker = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);

    currentMarkers.push(marker);
  });

  // Fit bounds if there are valid points
  if (validRows.length) {
    const bounds = new mapboxgl.LngLatBounds();
    validRows.forEach((row) => {
      bounds.extend([Number(row._lng), Number(row._lat)]);
    });

    map.fitBounds(bounds, {
      padding: 70,
      maxZoom: 5.5,
      duration: 900,
    });
  }
}

function populateFilters(rows) {
  // Unique species + regions from data
  const speciesSet = new Set();
  const regionSet = new Set();

  rows.forEach((r) => {
    if (r._scientific) speciesSet.add(r._scientific);
    if (r._region) regionSet.add(r._region);
  });

  const species = Array.from(speciesSet).sort((a, b) => a.localeCompare(b));
  const regions = Array.from(regionSet).sort((a, b) => a.localeCompare(b));

  // Preserve current selection if possible
  const currentSpecies = speciesSelect.value;
  const currentRegion = regionSelect.value;

  // Rebuild options
  speciesSelect.innerHTML = `<option value="">All species</option>`;
  species.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    speciesSelect.appendChild(opt);
  });

  regionSelect.innerHTML = `<option value="">All regions</option>`;
  regions.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    regionSelect.appendChild(opt);
  });

  // Restore selection if still present
  if (speciesSet.has(currentSpecies)) speciesSelect.value = currentSpecies;
  if (regionSet.has(currentRegion)) regionSelect.value = currentRegion;
}

function applyFiltersAndRender() {
  const speciesValue = speciesSelect.value.trim();
  const regionValue = regionSelect.value.trim();

  let filtered = allRows;

  if (speciesValue) {
    filtered = filtered.filter((r) => r._scientific === speciesValue);
  }

  if (regionValue) {
    filtered = filtered.filter((r) => r._region === regionValue);
  }

  setCount(filtered.length);
  setEmptyState(filtered.length === 0);

  renderSidebarList(filtered);
  renderMarkers(filtered);
}

// ---------- Data load ----------
async function loadData() {
  try {
    const res = await fetch(API_URL, { method: "GET" });
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("API response is not an array.");
    }

    allRows = data.map(normalizeRow);

    populateFilters(allRows);
    applyFiltersAndRender();
  } catch (err) {
    console.error("Failed to load whale data:", err);
    setCount(0);
    setEmptyState(true);
    whaleListEl.innerHTML = "";
  }
}

// ---------- Events ----------
speciesSelect.addEventListener("change", applyFiltersAndRender);
regionSelect.addEventListener("change", applyFiltersAndRender);

resetBtn.addEventListener("click", () => {
  speciesSelect.value = "";
  regionSelect.value = "";
  applyFiltersAndRender();
});

// Load once map is ready (safe even if map takes a moment)
map.on("load", () => {
  loadData();
});
