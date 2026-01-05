// map and sidebar
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [0, 20],
  zoom: 2
});

const sidebar = document.getElementById('whale-list');

// Fetch whale data
fetch('http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population')
  .then(res => res.json())
  .then(json => {
    const whales = json.data;
    whales.forEach(w => {
      // Add marker
      if (w.latitude && w.longitude) {
        const marker = new mapboxgl.Marker()
          .setLngLat([w.longitude, w.latitude])
          .addTo(map);

        // Bind popup
        marker.setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div>
              ${w.common_name ? `<strong>Common Name:</strong> ${w.common_name}<br>` : ''}
              <strong>Scientific Name:</strong> ${w.species}<br>
              <strong>Population:</strong> ${w.population}<br>
              <strong>Region:</strong> ${w.region}<br>
              <strong>Last Updated:</strong> ${w.last_updated}
            </div>
          `));
      }

      // Add to sidebar
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
        if (w.latitude && w.longitude) {
          map.flyTo({ center: [w.longitude, w.latitude], zoom: 5 });
        }
      });
      sidebar.appendChild(li);
    });
  })
  .catch(err => console.error('Failed to fetch whale data:', err));
