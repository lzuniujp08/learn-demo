var that, map;

var app = new Vue({
  el: '#app',
  data: {
    playInterval: 500,
    playFlag: 0,
    isplay: false,
    images: [],
    current: 0,
    currentTime: '',
    markers: []
  },
  mounted: function() {
    that = this;
    that.initMap();
  },
  methods: {
    initMap: function() {
      const token = 'pk.eyJ1IjoibHp1bml1anAwOCIsImEiOiJjam5iZmZwamMwN3RnM2twOHByeHJ4NzJoIn0.IVVIcCdRmFQE8-nQF-8wTA';
      mapboxgl.accessToken = token;
      var mapStyle = {
        "version": 8,
        "name": "Dark",
        "sources": {
          "mapbox": {
            "type": "vector",
            "url": "mapbox://mapbox.mapbox-streets-v6"
          },
          "OSM": {
            "type": "raster",
            "tiles": ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            "tileSize": 256,
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
            "id": "OSM",
            "type": "raster",
            "source": "OSM",
            "minzoom": 0,
            "maxzoom": 22
          },
          {
            "id": "boundaries",
            "source": "mapbox",
            "source-layer": "admin",
            "type": "line",
            "paint": {
              "line-color": "#797979"
            }
          }
        ]
      };

      map = new mapboxgl.Map({
        container: 'map',
        maxZoom: 18,
        minZoom: 0,
        zoom: 3,
        center: [109.1699, 45.9719],
        style: mapStyle,
        attributionControl: false
      });
      let firstInit = true;
      map.on('styledata', function() {
        if (firstInit) {
          that.getImageData();
          firstInit = false;
          map.loadImage('../css/lightning.png', function(error, image) {
            if (error) throw error;
            map.addImage('lightning', image);
          });
        }
      });
    },
    getImageData() {
      $.get('../data/tem.json', res => {
        that.images = res.data.list;
        that.play();

        that.addMarkers();
      });
    },
    play() {
      that.currentTime = that.images[that.current].time;
      var coords = [
        [70, 65],
        [145, 65],
        [145, 15],
        [70, 15]
      ];
      const source = map.getSource('loopimage');
      if (!source) {
        map.addSource('loopimage', {
          type: 'image',
          url: that.images[that.current].url,
          coordinates: coords
        });
        map.addLayer({
          'id': 'loopimage',
          'source': 'loopimage',
          'type': 'raster',
          'paint': {
            'raster-opacity': 0.65,
            'raster-fade-duration': 0
          }
        });
      } else {
        source.updateImage({
          url: that.images[that.current].url,
          coordinates: coords
        })
      }
    },
    stopPlay() {
      window.clearInterval(that.playFlag);
    },
    togglePlay() {
      if (that.isplay) {
        that.stopPlay();
      } else {
        that.playFlag = setInterval(function() {
          that.current++;
          that.play();
          if (that.current === that.images.length) {
            that.stopPlay();
          }
        }, that.playInterval);
      }
      that.isplay = !that.isplay;
    },
    addMarkers() {
      $.get('../data/capital.json', res => {
        var geojson = {
          'type': 'FeatureCollection',
          'features': []
        };
        for (var i = 0; i < res.length; i++) {
          const r = res[i];
          const ele = document.createElement('div');
          ele.setAttribute('class', 'map-label');
          ele.innerHTML = r.name;
          const option = {
            element: ele,
            anchor: 'bottom',
            offset: [0, -10]
          }
          // var marker = new mapboxgl.Marker(option).setLngLat([r.lon, r.lat]).addTo(map);
          // that.markers.push(marker);

          geojson.features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [r.lon, r.lat],
              properties: {
                name: r.name
              }
            }
          });
        }
        that.addGeojson(geojson);
      })
    },
    toggleMarkers() {
      if (that.markers.length > 0) {
        const layer = map.getLayer('points');
        if(layer) {
          map.removeLayer('points');
          map.removeSource('points');
        }
        for (var i = 0; i < that.markers.length; i++) {
          var marker = that.markers[i];
          marker.remove();
        }
        that.markers = [];
      } else {
        that.addMarkers();
      }
    },
    addGeojson(geojson) {
      map.addSource('points', {
        type: 'geojson',
        data: geojson
      });
      // map.addLayer({
      //   id: 'points',
      //   type: 'circle',
      //   source: 'points',
      //   paint: {
      //     'circle-color': '#ff0000',
      //     'circle-radius': 3,
      //     'circle-stroke-width': 0
      //   }
      // });
      map.addLayer({
        'id': 'points',
        'type': 'symbol',
        'source': 'points',
        'layout': {
          'icon-image': 'lightning',
          'icon-size': 0.45,
          'text-field': ['get', 'name'],
          'text-offset': [0, 0],
          'text-anchor': 'bottom'
        }
      });
    }
  }
});
