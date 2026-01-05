// -----------------------------
// Mapbox Access Token
// -----------------------------
mapboxgl.accessToken = 'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWswdWRjaDQwdmwwM2RxMzhqdXVwNmFoIn0.wJ5_grZwyYNMBJRzfcMptw';

// -----------------------------
// Initialize map
// -----------------------------
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [0, 20],
  zoom: 1.5
});

// -----------------------------
// Fetch whale data from API
// -----------------------------
const apiUrl = 'http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population';

fetch(apiUrl)
  .then(res => res.json())
  .then(json => {
    const whales = json.data;
    const listEl = document.getElementById('whale-list');

    whales.forEach(w => {
      // Add marker to map
      if (w.latitude && w.longitude) {
        const marker = new mapboxgl.Marker({ color: '#1E90FF' })
          .setLngLat([w.longitude, w.latitude])
          .addTo(map);

        // Sidebar entry
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${w.common_name || w.species}</strong> 
          (<em>${w.species}</em>)<br>
          Population: ${w.population}<br>
          Region: ${w.region}<br>
          Last Updated: ${w.last_updated}
        `;

        li.addEventListener('click', () => {
          map.flyTo({ center: [w.longitude, w.latitude], zoom: 4 });
        });

        listEl.appendChild(li);
      }
    });
  })
  .catch(err => {
    console.error('Failed to load whale data:', err);
    alert('Could not load whale data. Check API connection.');
  });
