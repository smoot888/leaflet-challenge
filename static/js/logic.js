const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";
//Create initial map
let myMap = L.map("map", {
    center: [39.8282, -98.5795],
    zoom: 2
  });

//Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);


//Function for determining the color
function getColor(value) {
    // Define a color scale
    var colors = ['#00FF00', '#FFFF00', '#FF0000'];
    var limits = [0, 0.1, 1.0];

    for (var i = 0; i < limits.length - 1; i++) {
        if (value >= limits[i] && value <= limits[i + 1]) {
            var percent = (value - limits[i]) / (limits[i + 1] - limits[i]);
            var color1 = colors[i];
            var color2 = colors[i + 1];
            return interpolateColor(color1, color2, percent);
        }
    }
    if(value < 0){
        return colors[0];
    }
    // Default color if value is outside the defined range
    return 'gray';
}

function interpolateColor(color1, color2, percent) {
    // Interpolate between two colors
    return chroma.mix(color1, color2, percent, 'lch');
}

//Function for adding marker to map
function addMarker(coordinates, depth, magnitude, maxDepth){
    let adjustedDepth = depth/maxDepth;
    var circle = L.circleMarker(coordinates,{ 
        radius: magnitude*3,
        fillColor: getColor(adjustedDepth),
        fillOpacity: 0.7,
        color: "#000",
        weight: 1});
    let earthquakeInfo = "Magnitude = " + magnitude +"<br>"+
                        "Depth = " + depth+"<br>";
    circle.bindTooltip(earthquakeInfo, {
        permanent: false,
        direction: 'top'
                    });
    circle.addTo(myMap);
}

//Add markers to map
fetch(url)
    .then(response => response.json())
    .then(data => {
        let maxDepth = 0;
        for(let i=0;i<data.features.length;i++){
            let depth = data.features[i].geometry.coordinates[2];
            if(depth>maxDepth){
                maxDepth = depth;
            }
        }
        console.log("max depth= ",maxDepth);
        for(let i=0;i<data.features.length;i++){
            let magnitude = data.features[i].properties.mag;
            let depth = data.features[i].geometry.coordinates[2];
            let coordinates = data.features[i].geometry.coordinates.splice(0,2);
            let reverseCoordinates = [coordinates[1],coordinates[0]];
            addMarker(reverseCoordinates, depth, magnitude, maxDepth);
        }
        //Create a legend
        var legend = L.control({position: 'bottomright'});

        legend.onAdd = function (myMap) {
            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0,25,100,250,500,(Math.ceil(maxDepth / 10) * 10)-10],
                labels = [];
            console.log(grades);
            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(grades[i]/maxDepth) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }
            return div;
        };

        legend.addTo(myMap);
    }) 
    .catch(error => console.error('Error fetching data:', error));
