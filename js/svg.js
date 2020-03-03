var that, map;
var bounds = [12434387.12160866, 2368046.639617785, 12556838.561481258, 2499523.266067402];
var vecSource, _feature;
var app = new Vue({
  el: '#app',
  data: {
    img: null
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
      var feature = new ol.Feature({
        geometry: ol.geom.Polygon.fromExtent(bounds)
      });
      vecSource = new ol.source.Vector({
        features: [feature]
      });
      var vec = new ol.layer.Vector({
        source: vecSource,
        zIndex: 9,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'red',
            width: 1
          })
        })
      });
      map = new ol.Map({
        controls: ol.control.defaults({
          attribution: false
        }),
        target: 'map',
        layers: [osm, vec],
        view: new ol.View({
          minZoom: 2,
          maxZoom: 18,
          center: [0, 0],
          zoom: 3
        })
      });
      map.getView().fit(bounds);

      that.img = new Image();
      that.img.src = '../css/wind.svg';
      that.img.onload = function () {
        const source = new ol.source.ImageCanvas({
          canvasFunction: that.canvasFunction
        });
        let image = new ol.layer.Image({
          source: source,
          opacity: 0.6
        })
        map.addLayer(image);
      }
    },
    canvasFunction: function(extent, res, pixelRatio, imgSize) {
      const _topLeft = [extent[0], extent[3]];
      const _srcTopLeft = map.getPixelFromCoordinate(_topLeft);
      const topLeft = [bounds[0], bounds[3]];
      const bottomRight = [bounds[2], bounds[1]];
      const srcTopLeft = map.getPixelFromCoordinate(topLeft);
      const srcBottomRight = map.getPixelFromCoordinate(bottomRight);
      const width = Math.round(srcBottomRight[0] - srcTopLeft[0]);
      const height = Math.round(srcBottomRight[1] - srcTopLeft[1]);
      var canvas = document.createElement('canvas');
      canvas.width = imgSize[0];
      canvas.height = imgSize[1];
      var ctx = canvas.getContext('2d');
      ctx.scale(pixelRatio, pixelRatio);
      const x = srcTopLeft[0] - _srcTopLeft[0] ;
      const y = srcTopLeft[1] - _srcTopLeft[1];
      ctx.drawImage(that.img, x, y, width, height);
      return canvas;
    }
  }
});
