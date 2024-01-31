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
      data: "../data/LWI points.geojson"
    },
    'paint': {
      'circle-radius': 6,
      'circle-color': 'purple',
      'circle-opacity': 0.5
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
    console.log(e.features[0].properties.Name)
    var point_id = e.features[0].properties.Name;

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

    let ml10_max = null;
    let ml50_max = null;
    let ml100_max = null;
    let ml500_max = null;
    
    let pd10_max = null;
    let pd50_max = null;
    let pd100_max = null;
    let pd500_max = null;

    let sd10_max = null;
    let sd50_max = null;
    let sd100_max = null;
    let sd500_max = null;

    let atlas10_max = null;
    let atlas50_max = null;
    let atlas100_max = null;
    let atlas500_max = null;

    
    // Get timeseries json data
    fetch(`../output/mapByReferencePoints/point_jsons/${point_id}.json`)
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
        
        
        // Get max values for plot title
        if (key == '010yr MostLikely Bivariate') {
          ml10_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '050yr MostLikely Bivariate') {
          ml50_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '100yr MostLikely Bivariate') {
          ml100_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '500yr MostLikely Bivariate') {
          ml500_max = parseFloat(Math.max(...values).toFixed(2));
        }

        if (key == '010yr Left PD Bivariate') {
          pd10_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '050y  Left PD Bivariate') {
          pd50_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '100yr Left PD Bivariate') {
          pd100_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '500yr Left PD Bivariate') {
          pd500_max = parseFloat(Math.max(...values).toFixed(2));
        }
        
        if (key == '010yr Right SD Bivariate') {
          sd10_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '050yr Right SD Bivariate') {
          sd50_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '100yr Right SD Bivariate') {
          sd100_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '500yr Right SD Bivariate') {
          sd500_max = parseFloat(Math.max(...values).toFixed(2));
        }
        
        if (key == '010yr Atlas 14') {
          atlas10_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '050yr Atlas 14') {
          atlas50_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '100yr Atlas 14') {
          atlas100_max = parseFloat(Math.max(...values).toFixed(2));
        }
        if (key == '500yr Atlas 14') {
          atlas500_max = parseFloat(Math.max(...values).toFixed(2));
        }

        // console.log(values);
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
          text: `<b>WSE at point ${point_id}</b><br>
          <i>Max ML:</i> 500yr=${ml500_max} , 100yr=${ml100_max} , 50yr=${ml50_max} ,10yr=${ml10_max}<br>
          <i>Max PD:</i> 500yr=${pd500_max} , 100yr=${pd100_max} , 50yr=${pd50_max} ,10yr=${pd10_max}<br>
          <i>Max SD:</i> 500yr=${sd500_max} , 100yr=${sd100_max} , 50yr=${sd50_max} ,10yr=${sd10_max}<br>
          <i>Atlas 14:</i> 500yr=${atlas500_max} , 100yr=${atlas100_max} , 50yr=${atlas50_max} ,10yr=${atlas10_max}<br>`,
          // text: `WSE at point ${point_id}`,
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


  