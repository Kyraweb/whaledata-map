document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------
  // Mapbox Setup
  // -----------------------------
  mapboxgl.accessToken = 'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWswdWRjaDQwdmwwM2RxMzhqdXVwNmFoIn0.wJ5_grZwyYNMBJRzfcMptw';
  
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [0, 20],
    zoom: 1.5
  });

  // -----------------------------
  // Fetch Whale Data
  // -----------------------------
  const apiUrl = 'http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population';
  const listEl = document.getElementById('whale-list');

  fetch(apiUrl)
    .then(res => res.json())
    .then(json => {
      const whales = json.data;

      if (!listEl) return; // safety check

      whales.forEach(w => {
        if (w.latitude && w.longitude) {
          // Add marker on map
          new mapboxgl.Marker({ color: '#1E90FF' })
            .setLngLat([w.longitude, w.latitude])
            .addTo(map);

          // Create sidebar entry
          const li = document.createElement('li');
          li.classList.add('whale-item'); // add class for CSS styling
          li.innerHTML = `
            <strong>Common Name:</strong> ${w.common_name || '-'}<br>
            <strong>Scientific Name:</strong> ${w.species}<br>
            <strong>Population:</strong> ${w.population}<br>
            <strong>Region:</strong> ${w.region}<br>
            <strong>Last Updated:</strong> ${w.last_updated}
          `;

          // Fly to whale location on click
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
});
