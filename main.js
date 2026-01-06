// =============================
// CONFIG
// =============================
const MAPBOX_TOKEN =
  'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWsyMWxuOWcwYnpnM2pwbjA1ZHk3Y3VrIn0.DClObJNmvE3cXpa24y48cw';

const API_URL =
  'https://api.whaledata.org/population';

// =============================
// HELPERS
// =============================
function isNum(x) {
  return typeof x === 'number' && !Number.isNaN(x);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ✅ Scientific name may come as scientific_name OR species (depending on your API)
function getScientificName(w) {
  const v = w?.scientific_name ?? w?.species ?? w?.scientificName ?? '';
  const s = String(v).trim();
  return s;
}

// ✅ Common name may come as common_name OR commonName OR vernacularName
function getCommonName(w) {
  const v = w?.common_name ?? w?.commonName ?? w?.vernacularName ?? '';
  const s = String(v).trim();
  return s.length ? s : null;
}

function getRegion(w) {
  const v = w?.region ?? w?.country ?? '';
  return String(v).trim() || 'Unknown';
}

// =============================
// APP STATE
// =============================
let allWhales = [];
let markers = [];

// =============================
// DOM
// =============================
const speciesSel = document.getElementById('species-filter');
const regionSel = document.getElementById('region-filter');
const resetBtn = document.getElementById('reset-btn');
const whaleList = document.getElementById('whale-list');
const countEl = document.getElementById('result-count');
const emptyState = document.getElementById('empty-state');

// =============================
// MAP INIT
// =============================
mapboxgl.accessToken = MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [0, 20],
  zoom: 1.6,
});

map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

// =============================
// DATA LOAD
// =============================
async function loadData() {
  try {
    const res = await fetch(API_URL, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`API failed: HTTP ${res.status}`);

    const json = await res.json();
    if (json.error) throw new Error(json.error);
    if (!Array.isArray(json.data)) throw new Error('API response missing `data` array');

    allWhales = json.data;

    populateDropdownsFromData(allWhales);
    applyFiltersAndRender();
  } catch (err) {
    console.error('Failed to load whale data:', err);
    emptyState.classList.remove('hidden');
    emptyState.textContent =
      'Could not load whale data. Check API connection and console logs.';
  }
}

function populateDropdownsFromData(data) {
  const speciesSet = new Set();
  const regionSet = new Set();

  data.forEach((w) => {
    const sci = getScientificName(w);
    const reg = getRegion(w);
    if (sci) speciesSet.add(sci);
    if (reg) regionSet.add(reg);
  });

  // reset dropdowns
  speciesSel.innerHTML = '<option value="">All species</option>';
  regionSel.innerHTML = '<option value="">All regions</option>';

  [...speciesSet].sort().forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    speciesSel.appendChild(opt);
  });

  [...regionSet].sort().forEach((r) => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    regionSel.appendChild(opt);
  });
}

// =============================
// FILTER + RENDER
// =============================
function getFilteredData() {
  const selectedSpecies = speciesSel.value;
  const selectedRegion = regionSel.value;

  return allWhales.filter((w) => {
    const sci = getScientificName(w);
    const reg = getRegion(w);

    const okSpecies = !selectedSpecies || sci === selectedSpecies;
    const okRegion = !selectedRegion || reg === selectedRegion;
    return okSpecies && okRegion;
  });
}

function clearMarkers() {
  markers.forEach((m) => m.remove());
  markers = [];
}

function renderMarkers(data) {
  clearMarkers();

  const bounds = new mapboxgl.LngLatBounds();
  let hasAny = false;

  data.forEach((w) => {
    const lat = w?.latitude;
    const lon = w?.longitude;

    if (!isNum(lat) || !isNum(lon)) return;

    hasAny = true;
    bounds.extend([lon, lat]);

    const commonName = getCommonName(w);
    const scientificName = getScientificName(w);
    const region = getRegion(w);

    const popupHtml = `
      <div>
        ${commonName ? `<div><strong>Common Name</strong>: ${escapeHtml(commonName)}</div>` : ''}
        <div><strong>Scientific Name</strong>: ${escapeHtml(scientificName || '-')}</div>
        <div><strong>Population</strong>: ${escapeHtml(w.population ?? '-')}</div>
        <div><strong>Region</strong>: ${escapeHtml(region)}</div>
        <div><strong>Last Updated</strong>: ${escapeHtml(w.last_updated ?? '-')}</div>
      </div>
    `;

    const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(popupHtml);

    const marker = new mapboxgl.Marker()
      .setLngLat([lon, lat])
      .setPopup(popup)
      .addTo(map);

    markers.push(marker);
  });

  if (hasAny) {
    map.fitBounds(bounds, { padding: 60, maxZoom: 6, duration: 900 });
  }
}

function renderSidebar(data) {
  whaleList.innerHTML = '';
  countEl.textContent = String(data.length);

  if (!data.length) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  data.forEach((w, idx) => {
    const commonName = getCommonName(w);
    const scientificName = getScientificName(w);
    const region = getRegion(w);
    const lat = w?.latitude;
    const lon = w?.longitude;

    const li = document.createElement('li');
    li.className = 'whale-item';

    li.innerHTML = `
      <div class="badge">Record #${idx + 1}</div>
      ${commonName ? `
        <div class="row">
          <div class="key">Common Name</div>
          <div class="val">${escapeHtml(commonName)}</div>
        </div>
      ` : ''}
      <div class="row">
        <div class="key">Scientific Name</div>
        <div class="val">${escapeHtml(scientificName || '-')}</div>
      </div>
      <div class="row">
        <div class="key">Population</div>
        <div class="val">${escapeHtml(w.population ?? '-')}</div>
      </div>
      <div class="row">
        <div class="key">Region</div>
        <div class="val">${escapeHtml(region)}</div>
      </div>
      <div class="row">
        <div class="key">Last Updated</div>
        <div class="val">${escapeHtml(w.last_updated ?? '-')}</div>
      </div>
    `;

    li.addEventListener('click', () => {
      if (!isNum(lat) || !isNum(lon)) return;

      map.flyTo({
        center: [lon, lat],
        zoom: 5,
        speed: 0.9,
        curve: 1.2,
      });

      const found = markers.find((m) => {
        const p = m.getLngLat();
        return p && Math.abs(p.lng - lon) < 1e-9 && Math.abs(p.lat - lat) < 1e-9;
      });
      if (found) found.togglePopup();
    });

    whaleList.appendChild(li);
  });
}

function applyFiltersAndRender() {
  const filtered = getFilteredData();
  renderMarkers(filtered);
  renderSidebar(filtered);
}

// =============================
// EVENTS
// =============================
speciesSel.addEventListener('change', applyFiltersAndRender);
regionSel.addEventListener('change', applyFiltersAndRender);

resetBtn.addEventListener('click', () => {
  speciesSel.value = '';
  regionSel.value = '';
  applyFiltersAndRender();
});

// =============================
// START
// =============================
loadData();
