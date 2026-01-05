// 1️⃣ Mapbox Access Token (keep in quotes)
mapboxgl.accessToken = 'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWswdWRjaDQwdmwwM2RxMzhqdXVwNmFoIn0.wJ5_grZwyYNMBJRzfcMptw';

// 2️⃣ Initialize Map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11', // light, clean theme
  center: [0, 20], // world view
  zoom: 2
});

// Add zoom and rotation controls
map.addControl(new mapboxgl.NavigationControl());

// 3️⃣ Fetch whale population data
const apiUrl = 'http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population'; // replace with your API

fetch(apiUrl)
  .then(response => response.json())
  .then(json => {
    const whales = json.data || [];
    whales.forEach(w => {
      if (w.latitude && w.longitude) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="popup-content">
              <strong>Species:</strong> ${w.species}<br>
              <strong>Population:</strong> ${w.population}<br>
              <strong>Region:</strong> ${w.region}<br>
              <strong>Last Updated:</strong> ${w.last_updated}
            </div>
          `);

        new mapboxgl.Marker({ color: 'blue' })
          .setLngLat([w.longitude, w.latitude])
          .setPopup(popup)
          .addTo(map);
      }
    });
  })
  .catch(err => {
    console.error('Failed to load whale data:', err);
    alert('Could not load whale data. Check API connection.');
  });
