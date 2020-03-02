var that, map;
var bounds = [12434387.12160866, 2368046.639617785, 12556838.561481258, 2499523.266067402];
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

      map = new ol.Map({
        controls: ol.control.defaults({
          attribution: false
        }),
        target: 'map',
        layers: [osm],
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
      // setTimeout(() => {
      //   const source = new ol.source.ImageStatic({
      //     url: '../css/wind.svg',
      //     imageExtent: bounds
      //   });
      //   let image = new ol.layer.Image({
      //     source: source,
      //     opacity: 0.6
      //   })
      //   map.addLayer(image);
      // }, 1000)
    },
    canvasFunction(extent, res, pixelRatio, imgSize) {
      const size = map.getSize();
      const topLeft = [bounds[0], bounds[3]];
      const bottomRight = [bounds[2], bounds[1]];
      const srcTopLeft = map.getPixelFromCoordinate(topLeft);
      const srcBottomRight = map.getPixelFromCoordinate(bottomRight);
      const width = Math.round(srcBottomRight[0] - srcTopLeft[0]);
      const height = Math.round(srcBottomRight[1] - srcTopLeft[1]);
      var canvas = document.createElement('canvas');
      canvas.width = size[0];
      canvas.height = size[1];
      var ctx = canvas.getContext('2d');
      console.log('srcTopLeft', srcTopLeft);
      console.log('size', [width, height]);
      const x = srcTopLeft[0];
      const y = size[1] - srcTopLeft[1];
      console.log('xy', [x, y]);
      ctx.drawImage(that.img, x, y, width, height);
      return canvas;
    },
    getImageSize(bounds) {
      var res = map.getView().getResolution();
      var _min = [bounds[0], bounds[1]],
        _max = [bounds[2], bounds[3]];
      var aa = 100;
      var _w = Math.round((_max[0] - _min[0])/aa),
        _h = Math.round((_max[1] - _min[1])/aa);
      return [_w, _h];
    }
  }
});
