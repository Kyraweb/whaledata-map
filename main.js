document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------
  // Mapbox Setup
  // -----------------------------
  mapboxgl.accessToken = 'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWswdWRjaDQwdmwwM2RxMzhqdXVwNmFoIn0.wJ5_grZwyYNMBJRzfcMptw';
  
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [0, 20],  // center on equator
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

      if (!listEl) return; // safety check if sidebar missing

      whales.forEach(w => {
        if (w.latitude && w.longitude) {
          // Add marker on map
          new mapboxgl.Marker({ color: '#1E90FF' })
            .setLngLat([w.longitude, w.latitude])
            .addTo(map);

          // Add entry in sidebar
          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${w.common_name || w.species}</strong> 
            (<em>${w.species}</em>)<br>
            Population: ${w.population}<br>
            Region: ${w.region}<br>
            Last Updated: ${w.last_updated}
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
