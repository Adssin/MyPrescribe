// Google Maps Integration
let map;
let infowindow;

function initMap() {
    // Initialize the map (will be centered on user's location)
    infowindow = new google.maps.InfoWindow();
}

function searchNearbyHospitals(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const location = new google.maps.LatLng(latitude, longitude);

    map = new google.maps.Map(document.getElementById("map"), {
        center: location,
        zoom: 13,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
            mapTypeIds: ["roadmap", "satellite"]
        }
    });

    // Add user's location marker
    const userMarker = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Your Location',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
        }
    });

    // Create info card for user's location
    createLocationCard('Your Location', latitude, longitude);

    // Add some predefined hospitals in different directions (for demonstration)
    const nearbyLocations = [
        {
            name: 'City General Hospital',
            lat: latitude + 0.01,
            lng: longitude + 0.01,
            type: 'Hospital'
        },
        {
            name: 'Medical Center',
            lat: latitude - 0.01,
            lng: longitude + 0.01,
            type: 'Medical Center'
        },
        {
            name: 'Skin Care Clinic',
            lat: latitude + 0.01,
            lng: longitude - 0.01,
            type: 'Clinic'
        },
        {
            name: 'Community Health Center',
            lat: latitude - 0.01,
            lng: longitude - 0.01,
            type: 'Health Center'
        }
    ];

    // Add markers for nearby locations
    nearbyLocations.forEach(location => {
        const position = new google.maps.LatLng(location.lat, location.lng);
        createMarker(position, location);
    });
}

function createMarker(position, location) {
    const marker = new google.maps.Marker({
        map: map,
        position: position,
        title: location.name
    });

    google.maps.event.addListener(marker, "click", () => {
        const content = `
            <div>
                <h3>${location.name}</h3>
                <p>${location.type}</p>
                <p>Approximately ${calculateDistance(
                    map.getCenter().lat(),
                    map.getCenter().lng(),
                    position.lat(),
                    position.lng()
                )} km away</p>
            </div>
        `;
        infowindow.setContent(content);
        infowindow.open(map, marker);
    });

    createLocationCard(location.name, position.lat(), position.lng(), location.type);
}

function createLocationCard(name, lat, lng, type = '') {
    const card = document.createElement('div');
    card.className = 'dermatologist-card';
    
    const distance = type ? calculateDistance(
        map.getCenter().lat(),
        map.getCenter().lng(),
        lat,
        lng
    ) : 0;

    card.innerHTML = `
        <h3>${name}</h3>
        ${type ? `<p><i class="fas fa-hospital"></i> ${type}</p>` : ''}
        <p><i class="fas fa-map-marker-alt"></i> Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
        ${type ? `<p><i class="fas fa-route"></i> Approximately ${distance} km away</p>` : ''}
        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" 
           target="_blank" class="directions-btn">
           <i class="fas fa-directions"></i> Get Directions
        </a>
    `;
    document.getElementById('dermatologists-list').appendChild(card);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d.toFixed(1);
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function findNearbyDermatologists() {
    // Clear previous results
    document.getElementById('dermatologists-list').innerHTML = '';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            searchNearbyHospitals,
            (error) => {
                console.error("Error getting location:", error);
                document.getElementById('dermatologists-list').innerHTML = 
                    '<p class="error">Error getting your location. Please enable location services.</p>';
            }
        );
    } else {
        document.getElementById('dermatologists-list').innerHTML = 
            '<p class="error">Geolocation is not supported by your browser.</p>';
    }
} 