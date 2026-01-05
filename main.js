// =============================
// CONFIG
// =============================
const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWswdWRjaDQwdmwwM2RxMzhqdXVwNmFoIn0.wJ5_grZwyYNMBJRzfcMptw';

// Your FastAPI endpoint:
const API_URL = 'http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population';

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

// =============================
// APP STATE
// =============================
let allWhales = [];
let markers = []; // Mapbox Marker instances

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
  // Globe-like feel: use a Mapbox style; you can swap later to 'satellite-streets-v12', 'light-v11', etc.
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

    // initial render
    applyFiltersAndRender();
  } catch (err) {
    console.error('Failed to load whale data:', err);
    emptyState.classList.remove('hidden');
    emptyState.textContent = 'Could not load whale data. Check API connection and console logs.';
  }
}

function populateDropdownsFromData(data) {
  // build sets from *existing DB data only*
  const speciesSet = new Set();
  const regionSet = new Set();

  data.forEach(w => {
    if (w?.species) speciesSet.add(w.species);
    if (w?.region) regionSet.add(w.region);
  });

  // reset
  speciesSel.innerHTML = '<option value="">All species</option>';
  regionSel.innerHTML = '<option value="">All regions</option>';

  [...speciesSet].sort().forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    speciesSel.appendChild(opt);
  });

  [...regionSet].sort().forEach(r => {
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

  return allWhales.filter(w => {
    const okSpecies = !selectedSpecies || w.species === selectedSpecies;
    const okRegion = !selectedRegion || w.region === selectedRegion;
    return okSpecies && okRegion;
  });
}

function clearMarkers() {
  markers.forEach(m => m.remove());
  markers = [];
}

function renderMarkers(data) {
  clearMarkers();

  // create bounds so we can fit results
  const bounds = new mapboxgl.LngLatBounds();
  let hasAny = false;

  data.forEach(w => {
    const lat = w?.latitude;
    const lon = w?.longitude;

    if (!isNum(lat) || !isNum(lon)) return;

    hasAny = true;
    bounds.extend([lon, lat]);

    const commonName = (w.common_name && String(w.common_name).trim()) ? w.common_name : null;
    const scientificName = w.species || '';

    const popupHtml = `
      <div>
        ${commonName ? `<div><strong>Common Name</strong>: ${escapeHtml(commonName)}</div>` : ''}
        <div><strong>Scientific Name</strong>: ${escapeHtml(scientificName)}</div>
        <div><strong>Population</strong>: ${escapeHtml(w.population)}</div>
        <div><strong>Region</strong>: ${escapeHtml(w.region)}</div>
        <div><strong>Last Updated</strong>: ${escapeHtml(w.last_updated)}</div>
      </div>
    `;

    const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(popupHtml);

    const marker = new mapboxgl.Marker()
      .setLngLat([lon, lat])
      .setPopup(popup)
      .addTo(map);

    markers.push(marker);
  });

  // fit to bounds if we have results
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
    const commonName = (w.common_name && String(w.common_name).trim()) ? w.common_name : null;
    const scientificName = w.species || '';
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
        <div class="val">${escapeHtml(scientificName)}</div>
      </div>
      <div class="row">
        <div class="key">Population</div>
        <div class="val">${escapeHtml(w.population)}</div>
      </div>
      <div class="row">
        <div class="key">Region</div>
        <div class="val">${escapeHtml(w.region)}</div>
      </div>
      <div class="row">
        <div class="key">Last Updated</div>
        <div class="val">${escapeHtml(w.last_updated)}</div>
      </div>
    `;

    li.addEventListener('click', () => {
      if (!isNum(lat) || !isNum(lon)) return;

      map.flyTo({
        center: [lon, lat],
        zoom: 5,
        speed: 0.9,
        curve: 1.2
      });

      // open matching marker popup (best effort: match by coords)
      const found = markers.find(m => {
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
