// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWswdWRjaDQwdmwwM2RxMzhqdXVwNmFoIn0.wJ5_grZwyYNMBJRzfcMptw';

// Initialize map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [0, 20],
  zoom: 2
});

const sidebar = document.getElementById('whale-list');
const speciesFilter = document.getElementById('species-filter');
const regionFilter = document.getElementById('region-filter');

let markers = [];
let whalesData = [];

// Fetch whale data
fetch('http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population')
  .then(res => res.json())
  .then(json => {
    whalesData = json.data;

    // Populate filters
    const uniqueSpecies = [...new Set(whalesData.map(w => w.species))];
    uniqueSpecies.forEach(s => {
      const option = document.createElement('option');
      option.value = s;
      option.textContent = s;
      speciesFilter.appendChild(option);
    });

    const uniqueRegions = [...new Set(whalesData.map(w => w.region))];
    uniqueRegions.forEach(r => {
      const option = document.createElement('option');
      option.value = r;
      option.textContent = r;
      regionFilter.appendChild(option);
    });

    renderWhales(whalesData);
  })
  .catch(err => console.error('Failed to fetch whale data:', err));

function renderWhales(data) {
  // Clear previous markers and sidebar
  markers.forEach(m => m.remove());
  markers = [];
  sidebar.innerHTML = '';

  data.forEach(w => {
    if (w.latitude && w.longitude) {
      // Marker
      const marker = new mapboxgl.Marker()
        .setLngLat([w.longitude, w.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            ${w.common_name ? `<strong>Common Name:</strong> ${w.common_name}<br>` : ''}
            <strong>Scientific Name:</strong> ${w.species}<br>
            <strong>Population:</strong> ${w.population}<br>
            <strong>Region:</strong> ${w.region}<br>
            <strong>Last Updated:</strong> ${w.last_updated}
          `)
        )
        .addTo(map);
      markers.push(marker);

      // Sidebar entry
      const li = document.createElement('li');
      li.className = 'whale-item';
      li.innerHTML = `
        ${w.common_name ? `<strong>Common Name:</strong> ${w.common_name}<br>` : ''}
        <strong>Scientific Name:</strong> ${w.species}<br>
        <strong>Population:</strong> ${w.population}<br>
        <strong>Region:</strong> ${w.region}<br>
        <strong>Last Updated:</strong> ${w.last_updated}
      `;
      li.addEventListener('click', () => {
        map.flyTo({ center: [w.longitude, w.latitude], zoom: 5 });
        marker.togglePopup();
      });
      sidebar.appendChild(li);
    }
  });
}

// Filter functionality
function applyFilters() {
  const species = speciesFilter.value;
  const region = regionFilter.value;

  const filtered = whalesData.filter(w => {
    return (!species || w.species === species) && (!region || w.region === region);
  });

  renderWhales(filtered);
}

speciesFilter.addEventListener('change', applyFilters);
regionFilter.addEventListener('change', applyFilters);
