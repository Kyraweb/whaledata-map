// -----------------------------
// main.js
// -----------------------------

// 1️⃣ Initialize the map (centered at equator)
const map = L.map('map', {
  worldCopyJump: false // disables horizontal repetition
}).setView([0, 0], 2);

// 2️⃣ Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 3️⃣ Global variables
let allWhales = [];
let markers = [];

// 4️⃣ Fetch whale data from API
async function fetchWhales() {
  try {
    const res = await fetch('http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population');
    const json = await res.json();
    if (json.error) {
      console.error('API Error:', json.error);
      return;
    }

    allWhales = json.data;
    populateFilters(allWhales);
    renderMarkers(allWhales);
  } catch (err) {
    console.error('Failed to fetch whale data:', err);
  }
}

// 5️⃣ Populate sidebar dropdowns dynamically
function populateFilters(data) {
  const speciesSet = new Set();
  const regionSet = new Set();

  data.forEach(w => {
    if (w.scientific_name) speciesSet.add(w.scientific_name);
    if (w.region) regionSet.add(w.region);
  });

  const speciesSelect = document.getElementById('speciesFilter');
  const regionSelect = document.getElementById('regionFilter');

  // Clear old options
  speciesSelect.innerHTML = `<option value="">All Species</option>`;
  regionSelect.innerHTML = `<option value="">All Regions</option>`;

  speciesSet.forEach(s => {
    const option = document.createElement('option');
    option.value = s;
    option.textContent = s;
    speciesSelect.appendChild(option);
  });

  regionSet.forEach(r => {
    const option = document.createElement('option');
    option.value = r;
    option.textContent = r;
    regionSelect.appendChild(option);
  });
}

// 6️⃣ Render markers on map
function renderMarkers(data) {
  // Clear existing markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(w => {
    if (w.latitude == null || w.longitude == null) return;

    const marker = L.marker([w.latitude, w.longitude]).addTo(map);

    const popupContent = `
      <div class="popup-content">
        ${w.common_name ? `<strong>Common Name:</strong> ${w.common_name}<br>` : ''}
        ${w.scientific_name ? `<strong>Scientific Name:</strong> ${w.scientific_name}<br>` : ''}
        <strong>Population:</strong> ${w.population}<br>
        <strong>Region:</strong> ${w.region}<br>
        <strong>Last Updated:</strong> ${w.last_updated}
      </div>
    `;
    marker.bindPopup(popupContent);
    markers.push(marker);
  });
}

// 7️⃣ Apply filters
function applyFilters() {
  const species = document.getElementById('speciesFilter').value;
  const region = document.getElementById('regionFilter').value;

  const filtered = allWhales.filter(w => {
    return (!species || w.scientific_name === species) &&
           (!region || w.region === region);
  });

  renderMarkers(filtered);
}

// 8️⃣ Event listeners for filters
document.addEventListener('DOMContentLoaded', () => {
  fetchWhales();

  const speciesSelect = document.getElementById('speciesFilter');
  const regionSelect = document.getElementById('regionFilter');

  speciesSelect.addEventListener('change', applyFilters);
  regionSelect.addEventListener('change', applyFilters);
});
