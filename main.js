mapboxgl.accessToken = 'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWswdWRjaDQwdmwwM2RxMzhqdXVwNmFoIn0.wJ5_grZwyYNMBJRzfcMptw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [0, 20],
  zoom: 2
});

let allWhales = [];
const speciesFilter = document.getElementById('species-filter');
const regionFilter = document.getElementById('region-filter');
const statsDiv = document.getElementById('stats');

// Fetch whale data from API
async function fetchWhales() {
  try {
    const res = await fetch('http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population');
    const data = await res.json();
    allWhales = data.data;

    populateFilters(allWhales);
    renderMap(allWhales);
    updateStats(allWhales);
  } catch (err) {
    console.error('Failed to fetch whale data:', err);
    alert('Could not load whale data.');
  }
}

// Populate dropdown filters
function populateFilters(data) {
  const speciesSet = new Set();
  const regionSet = new Set();

  data.forEach(w => {
    if (w.species) speciesSet.add(w.species);
    if (w.region) regionSet.add(w.region);
  });

  speciesSet.forEach(spec => {
    const option = document.createElement('option');
    option.value = spec;
    option.textContent = spec;
    speciesFilter.appendChild(option);
  });

  regionSet.forEach(region => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    regionFilter.appendChild(option);
  });
}

// Render markers on map
let markers = [];

function renderMap(data) {
  // Remove previous markers
  markers.forEach(m => m.remove());
  markers = [];

  data.forEach(w => {
    if (w.latitude && w.longitude) {
      const popupHTML = `
        ${w.common_name ? `<strong>Common Name:</strong> ${w.common_name}<br>` : ''}
        <strong>Scientific Name:</strong> ${w.species}<br>
        <strong>Population:</strong> ${w.population}<br>
        <strong>Region:</strong> ${w.region}<br>
        <strong>Last Updated:</strong> ${w.last_updated}
      `;
      const marker = new mapboxgl.Marker()
        .setLngLat([w.longitude, w.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(popupHTML))
        .addTo(map);

      markers.push(marker);
    }
  });
}

// Update stats
function updateStats(data) {
  statsDiv.innerHTML = `<p>Total whales: ${data.length}</p>`;
}

// Filter event listeners
function applyFilters() {
  const speciesVal = speciesFilter.value;
  const regionVal = regionFilter.value;

  const filtered = allWhales.filter(w => {
    return (speciesVal === '' || w.species === speciesVal) &&
           (regionVal === '' || w.region === regionVal);
  });

  renderMap(filtered);
  updateStats(filtered);
}

speciesFilter.addEventListener('change', applyFilters);
regionFilter.addEventListener('change', applyFilters);

// Initial fetch
fetchWhales();
