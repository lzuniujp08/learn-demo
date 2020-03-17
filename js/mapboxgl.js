var that, map;

var app = new Vue({
  el: '#app',
  data: {
    vector: null
  },
  mounted: function() {
    that = this;
    that.initMap();
  },
  methods: {
    initMap: function() {
      const token = 'pk.eyJ1IjoibHp1bml1anAwOCIsImEiOiJjam5iZmZwamMwN3RnM2twOHByeHJ4NzJoIn0.IVVIcCdRmFQE8-nQF-8wTA';
      mapboxgl.accessToken = token;
      var url = 'http://10.30.17.59:8000///public/gdfs/meter/20200317/GDFS_meter_202003161200_202003171200_TEM.png';
      var mapStyle = {
        "version": 8,
        "name": "Dark",
        "sources": {
          "mapbox": {
            "type": "vector",
            "url": "mapbox://mapbox.mapbox-streets-v6"
          },
          "overlay": {
            "type": "image",
            "url": url,
            "coordinates": [
              [70, 65],
              [145, 65],
              [145, 15],
              [70, 15]
            ]
          }
        },
        "sprite": "mapbox://sprites/mapbox/dark-v9",
        "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
        "layers": [{
            "id": "background",
            "type": "background",
            "paint": {
              "background-color": "#111"
            }
          },
          {
            "id": "water",
            "source": "mapbox",
            "source-layer": "water",
            "type": "fill",
            "paint": {
              "fill-color": "#2c2c2c"
            }
          },
          {
            "id": "boundaries",
            "source": "mapbox",
            "source-layer": "admin",
            "type": "line",
            "paint": {
              "line-color": "#797979",
              "line-dasharray": [2, 2, 6, 2]
            },
            "filter": ["all", ["==", "maritime", 0]]
          },
          {
            "id": "overlay",
            "source": "overlay",
            "type": "raster",
            "paint": {
              "raster-opacity": 0.65
            }
          }
        ]
      };

      map = new mapboxgl.Map({
        container: 'map',
        maxZoom: 18,
        minZoom: 0,
        zoom: 5,
        center: [107.5, 40],
        style: mapStyle
      });
    }
  }
});
