document.addEventListener("DOMContentLoaded", () => {
  // ✅ Mapbox token (must be in quotes)
  mapboxgl.accessToken = 'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWswdWRjaDQwdmwwM2RxMzhqdXVwNmFoIn0.wJ5_grZwyYNMBJRzfcMptw';

  // Initialize map
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [0, 20],
    zoom: 2,
    maxBounds: [[-180, -90], [180, 90]]
  });

  map.addControl(new mapboxgl.NavigationControl());

  // Fetch whale data from FastAPI
  const apiUrl = 'http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population';

  fetch(apiUrl)
    .then(res => res.json())
    .then(json => {
      const whales = json.data || [];

      whales.forEach(w => {
        if (w.latitude && w.longitude) {
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div>
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

  // Optional: globe rotation
  let rotate = true;
  map.on('load', () => {
    function rotateGlobe() {
      if (!rotate) return;
      const center = map.getCenter();
      map.setCenter([center.lng + 0.05, center.lat]);
      requestAnimationFrame(rotateGlobe);
    }
    rotateGlobe();
  });
  map.on('dragstart', () => rotate = false);
  map.on('zoomstart', () => rotate = false);
});
