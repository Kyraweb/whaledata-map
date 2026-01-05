mapboxgl.accessToken = 'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWswdWRjaDQwdmwwM2RxMzhqdXVwNmFoIn0.wJ5_grZwyYNMBJRzfcMptw';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [0, 20],
  zoom: 2
});

let allData = [];

async function fetchData() {
  try {
    const res = await fetch('http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population');
    const json = await res.json();
    allData = json.data;
    populateDropdowns();
    renderMap();
    renderSidebar();
  } catch (err) {
    console.error('Error fetching data', err);
  }
}

// Populate species and region dropdowns dynamically
function populateDropdowns() {
  const speciesSet = new Set(allData.map(w => w.scientific_name).filter(Boolean));
  const regionSet = new Set(allData.map(w => w.region).filter(Boolean));

  const speciesSelect = document.getElementById('species-select');
  speciesSelect.innerHTML = '<option value="">All</option>';
  speciesSet.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    speciesSelect.appendChild(opt);
  });

  const regionSelect = document.getElementById('region-select');
  regionSelect.innerHTML = '<option value="">All</option>';
  regionSet.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    regionSelect.appendChild(opt);
  });

  speciesSelect.addEventListener('change', filterData);
  regionSelect.addEventListener('change', filterData);
}

function filterData() {
  const speciesVal = document.getElementById('species-select').value;
  const regionVal = document.getElementById('region-select').value;

  const filtered = allData.filter(w =>
    (!speciesVal || w.scientific_name === speciesVal) &&
    (!regionVal || w.region === regionVal)
  );

  renderMap(filtered);
  renderSidebar(filtered);
}

// Render markers on map
function renderMap(data = allData) {
  // Clear existing markers
  if (window.markers) {
    window.markers.forEach(m => m.remove());
  }
  window.markers = [];

  data.forEach(w => {
    if (!w.latitude || !w.longitude) return;
    const popupHTML = `
      <div>
        ${w.common_name ? `<strong>Common Name:</strong> ${w.common_name}<br>` : ''}
        ${w.scientific_name ? `<strong>Scientific Name:</strong> ${w.scientific_name}<br>` : ''}
        <strong>Population:</strong> ${w.population}<br>
        <strong>Region:</strong> ${w.region}<br>
        <strong>Last Updated:</strong> ${w.last_updated}<br>
      </div>
    `;
    const popup = new mapboxgl.Popup().setHTML(popupHTML);
    const marker = new mapboxgl.Marker()
      .setLngLat([w.longitude, w.latitude])
      .setPopup(popup)
      .addTo(map);
    window.markers.push(marker);
  });
}

// Render sidebar
function renderSidebar(data = allData) {
  const container = document.getElementById('whale-info');
  container.innerHTML = '';
  if (!data.length) {
    container.innerHTML = '<p>No whale data available for selected filters.</p>';
    return;
  }

  data.forEach(w => {
    const div = document.createElement('div');
    div.className = 'whale-entry';
    div.innerHTML = `
      ${w.common_name ? `<strong>Common Name:</strong> ${w.common_name}<br>` : ''}
      ${w.scientific_name ? `<strong>Scientific Name:</strong> ${w.scientific_name}<br>` : ''}
      <strong>Population:</strong> ${w.population}<br>
      <strong>Region:</strong> ${w.region}<br>
      <strong>Last Updated:</strong> ${w.last_updated}<br>
    `;
    container.appendChild(div);
  });
}

// Initial fetch
fetchData();
