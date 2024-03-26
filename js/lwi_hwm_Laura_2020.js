import MapLibreStyleSwitcherControl from './MapStyleSwitcher.js'
// import layerControlSimple from './layerControlSimple.js'
// import layerControlGrouped from './layerControlGrouped.js'
import * as Markers from './markers.js'


const apiKey = 'G28Wx0TEh00gRJifwBmD'
  
// https://cloud.maptiler.com/maps/
// https://github.com/maplibre/demotiles
var styles = [
    {
      title: "Topo",
      uri:
        "https://api.maptiler.com/maps/topo-v2/style.json?key=" +
        apiKey,
    },
    {
      title: "Satellite",
      uri:
        "https://api.maptiler.com/maps/hybrid/style.json?key=" +
        apiKey,
    },
    {
      title: "Toner",
      uri:
        "https://api.maptiler.com/maps/toner-v2/style.json?key=" +
        apiKey,
    },
    {
      title: "Voyager",
      uri:
        "https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    },
    {
      title: "Positron",
      uri:
        "https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    },
    {
      "uri": "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      "title": "Dark Matter"
    },
  ];

  styles.sort((a,b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0))

var map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json', // stylesheet location
  center: [-91, 30.5], // starting position [lng, lat]
  zoom: 7 // starting zoom
  });

map.addControl(new maplibregl.NavigationControl(), 'top-right');

// fetch('../config/mapStyles.json')
// .then(response => response.json())
// .then(data => console.log(Object.values(data)))
// // .then(data => data.sort((a,b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)))
// .then(data => map.addControl(new MapLibreStyleSwitcherControl(Object.values(data), apiKey)))
// .catch(error => console.log(error));

map.addControl(new MapLibreStyleSwitcherControl(styles, apiKey))

// Create a popup, but don't add it to the map yet.
var popup = new maplibregl.Popup({
  closeButton: false
});

map.on('style.load', function () {

  map.addLayer({
    'id': 'ModelDomain',
    'type': 'line',
    'source': {
      type: "geojson",
      data: "../data/LWI RAS Domain.geojson"
    },
    // 'layout': {
    //   'visibility': 'none'
    // },
    'paint': {
      // 'fill-pattern': 'bluehatch',
      'line-color': 'blue',
      'line-width': 4,
      'line-opacity': 0.5
    }
  });

  map.addLayer({
    'id': 'timeseries',
    'type': 'circle',
    'source': {
      type: "geojson",
      data: "../output/mapByHWM/all_points/Laura_2020_HWMs.geojson"
    },
    'paint': {
      'circle-radius': 6,
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'diff_min'],
        -100, '#d73027',
        -1, '#fc8d59',
        -.5, '#fee08b',
        -.25, '#3288bd',
        0, '#99d594',
        .25, '#fee08b',
        .5, '#1a9850',
        1, '#fc8d59',
        100, '#d73027'
      ],
      'circle-opacity': 0.75
    }
  });
  
  // When a click event occurs on a feature in the places layer, open a popup at the
  // location of the feature, with description HTML from its properties.
  map.on('click', 'timeseries', function (e) {

    // remove any existing popups
    const popups = document.getElementsByClassName("maplibregl-popup");
    // const plots = document.getElementById("plotlyPlot");

    if (popups.length) {
        popups[0].remove();
    }

    //Get point info to get plot data json.
    // console.log(e.features[0].properties)
    console.log(e.features[0].properties.site_no)
    var point_id = e.features[0].properties.site_no;

    var coordinates = e.features[0].geometry.coordinates.slice();
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    
    // console.log(coordinates);
    
    new maplibregl.Popup({className: "plotly-popup"})
    .setLngLat(coordinates)
    // .setMaxWidth("1000px")
    // add div to DOM before creating plotly plot
    .setHTML('<div id="plotlyPlot"/>')
    .addTo(map);
    
    // Get timeseries json data
    fetch(`../output/mapByHWM/point_jsons/${point_id}.json`)
    .then(response => response.json())
    .then(data => {
      // console.log(data)
      // console.log(Object.keys(data));
      // for each event, create plotly trace
      var tracedata = [];
      Object.keys(data).forEach(key => {
        console.log(key, data[key]);
        var values = data[key]['wse'];
        var times = data[key]['datetime'];
        var trace =
          {
            x: times,
            y: values,
            yaxis: 'WSE (ft)',
            type: 'scatter',
            name: key
          }
        tracedata.push(trace)
      });
      // console.log(tracedata);
      var layout = {
        title: {
          text: `<b>WSE at point ${point_id}</b><br>`,
          xref: 'paper',
          x: 0.05,
        },
        xaxis: {
          title: {
            text: 'Date',
            },
        },
        yaxis: {
          title: {
            text: 'WSE (ft)',
          }
        },
        autosize: false,
        width: 1000,
        height: 700,
        margin: {
          l: 50,
          r: 50,
          b: 200,
          t: 100,
          pad: 4
        },
        hovermode: 'x',
      };

      // for each key in tracedata, if times is defined, then get the startTime and endTime.
      console.log(tracedata)
      var times = []
      Object.keys(tracedata).forEach(key => {
        // console.log(tracedata[key].x)
        if (tracedata[key].x) {
          times[0] = tracedata[key].x[0]
          times[1] = tracedata[key].x[tracedata[key].x.length-1];
          // console.log(tracedata[key].x[0], tracedata[key].x[tracedata[key].x.length-1])
        }
      });

      // add a horiztonal line to trace data
      // var hwm_times = data['datetime'];
      // console.log(tracedata)
      var hwm_line = {
        name: `HWM = ${data['properties']['elev']} ft`,
        x: [times[0], times[1]],
        y: [data['properties']['elev'], data['properties']['elev']],
        type: 'scatter',
        mode: 'lines',
        line: {
          color: 'red',
          width: 4,
          dash: 'dashdot'
        }
      };
      tracedata.push(hwm_line);      
      console.log(tracedata)

      var fig = Plotly.newPlot('plotlyPlot', tracedata, layout);
    
    });

  });


  // Store all added markers to be able remove them later
  // var marker_list = [];

  // fetch('../data/westPark/Timeseries_Locations.geojson').then(response => response.json()).then(places => {
  //   marker_list = showGeoJSONPoints(places);
  // });

}) // end map.on('load')

function showGeoJSONPoints(geojson) {

  // if (markers.length) {
  //   markers.forEach(marker => marker.remove());
  var  markers = [];
  // }

  // each feature contains 1 place
  geojson.features.forEach((feature, index) => {
    console.log(feature);
    
    // create icon
    var markerIcon = document.createElement('div');
    markerIcon.classList.add("my-marker");
    // Icon size: 31 x 46px, shadow adds: 4px
    markerIcon.style.backgroundImage = `url(https://api.geoapify.com/v1/icon/?type=awesome&color=%233f99b1&text=${index + 1}&noWhiteCircle&apiKey=2dd96c68f3bc4562b6d8365176dbaffb)`;
    // markerIcon.style.backgroundImage = '../data/img/bluepin.png';
    console.log(markerIcon);

    var marker_popup = new maplibregl.Popup({
        anchor: 'bottom',
        offset: [0, -42] // height - shadow
      })
      .setText(feature.properties.Name);

    var marker = new maplibregl.Marker(markerIcon, {
        anchor: 'bottom',
        offset: [0, 4] // shadow
      })
      .setLngLat(feature.geometry.coordinates)
      // .setPopup(marker_popup)
      .addTo(map);

    markers.push(marker);
    console.log(marker);
  });
  return markers
};

function getColor() {

}

  