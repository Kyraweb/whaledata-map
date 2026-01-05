// Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1Ijoia3lyYXdlYmluYyIsImEiOiJjbWswdWRjaDQwdmwwM2RxMzhqdXVwNmFoIn0.wJ5_grZwyYNMBJRzfcMptw';

// Initialize Map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [0, 20],
    zoom: 1.5
});

let markers = [];

// Fetch whale data
async function fetchWhales(species='', region='') {
    let url = `http://h00ws84ww08c4cw804go8444.142.171.41.4.sslip.io/population?species=${encodeURIComponent(species)}&region=${encodeURIComponent(region)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.data || [];
}

// Render whales on map
function renderWhales(whales) {
    // Clear existing markers
    markers.forEach(m => m.remove());
    markers = [];

    whales.forEach(w => {
        if (w.latitude && w.longitude) {
            const el = document.createElement('div');
            el.className = 'marker';
            el.style.background = '#FF5733';
            el.style.width = '15px';
            el.style.height = '15px';
            el.style.borderRadius = '50%';

            const marker = new mapboxgl.Marker(el)
                .setLngLat([w.longitude, w.latitude])
                .setPopup(new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<strong>${w.species}</strong><br>Population: ${w.population}<br>Region: ${w.region}<br>Last Updated: ${w.last_updated}`))
                .addTo(map);

            el.addEventListener('click', () => {
                document.getElementById('whaleDetails').innerHTML = `
                    <strong>${w.species}</strong><br>
                    Population: ${w.population}<br>
                    Region: ${w.region}<br>
                    Last Updated: ${w.last_updated}
                `;
            });

            markers.push(marker);
        }
    });
}

// Apply filters
document.getElementById('applyFilters').addEventListener('click', async () => {
    const species = document.getElementById('speciesFilter').value;
    const region = document.getElementById('regionFilter').value;
    const whales = await fetchWhales(species, region);
    renderWhales(whales);
});

// Initial load
fetchWhales().then(renderWhales);
