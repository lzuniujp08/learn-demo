var that, map;
var app = new Vue({
  el: '#app',
  data: {
    carsData: [],
    pixiApp: null,
    num: 1000,
    count: 0,
    canvas: null,
    extent: null
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
          center: ol.proj.fromLonLat([114.251702,30.552128]),
          zoom: 8
        })
      });
      that.addPoints();
    },
    addPoints() {
      $.get('../data/sfcars.csv', res => {
        res = res.split('\n');
        res.splice(0, 1);
        that.carsData = res;
        that.count = Math.floor(res.length / that.num) + 1
        const source = new ol.source.ImageCanvas({
          canvasFunction: that.canvasFunction
        });
        let image = new ol.layer.Image({
          source: source,
          opacity: 1
        })
        map.addLayer(image);
      });
    },
    drawCircles(index) {
      let start = index * that.num;
      let end = (index + 1) * that.num;
      end = (that.count - 1) === index ? that.carsData.length : end;
      const ctx = that.canvas.getContext('2d');
      const _topLeft = [that.extent[0], that.extent[3]];
      const _srcTopLeft = map.getPixelFromCoordinate(_topLeft);
      for (let i = start; i < end; i++) {
        const d = that.carsData[i];
        const ds = d.split(',');
        const coord = [Number(ds[0]), Number(ds[1])];
        const pos = map.getPixelFromCoordinate(ol.proj.fromLonLat(coord));
        ctx.beginPath();
        const x = pos[0] - _srcTopLeft[0];
        const y = pos[1] - _srcTopLeft[1];
        ctx.arc(x, y, 4, 0, 2*Math.PI);
        //从左上角到右下角
        var radialGradient = ctx.createRadialGradient(x,y,0,x,y,2);
        radialGradient.addColorStop(0, 'rgba(255, 0, 0, 0.95)');
        radialGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = radialGradient;
        ctx.fill();
      }
    },
    canvasFunction: function(extent, res, pixelRatio, imgSize) {
      that.extent = extent;
      var canvas = document.createElement('canvas');
      canvas.width = imgSize[0];
      canvas.height = imgSize[1];
      that.canvas = canvas;
      for (let i = 0; i < that.count; i++) {
      // for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          that.drawCircles(i);
        })
      }
      return canvas;
    }
  }
});
