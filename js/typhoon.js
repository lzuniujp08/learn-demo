var that, map;

var app = new Vue({
  el: '#app',
  data: {
    center: [11760366.56, 4662347.84],
    zoom: 4
  },
  mounted() {
    that = this;
    that.initMap();
  },
  methods: {
    initMap() {
      var osm = new ol.layer.Tile({
        source: new ol.source.OSM()
      });
      map = new ol.Map({
        controls: ol.control.defaults({
          attribution: false
        }),
        target: 'map',
        layers: [osm],
        view: new ol.View({
          minZoom: 2,
          maxZoom: 18,
          center: that.center,
          zoom: that.zoom
        })
      });
      const typhoon = new Typhoon(map);
      typhoon.init();
    }
  }
});
