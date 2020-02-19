var that, map;

var app = new Vue({
  el: '#app',
  data: {
    size: 20,
    padding: 2,
    overlays: [
      {
        id: 1,
        coords: [11760366.56, 4662347.84],
        level: 2
      },
      {
        id: 2,
        coords: [11760366.56, 4662347.84],
        level: 1
      },
      {
        id: 3,
        coords: [11760366.56, 4662347.84],
        level: 3
      },
      {
        id: 4,
        coords: [12760366.56, 4662347.84],
        level: 2
      },
      {
        id: 5,
        coords: [12760366.56, 4662347.84],
        level: 1
      },
      {
        id: 6,
        coords: [12760366.56, 4662347.84],
        level: 3
      }
    ],
    clusterData: [],
    mapOverlays: [],
    colorMap: {
      1: 'blue',
      2: 'orange',
      3: 'red'
    },
    mapZoom: -1,
    firstInit: false,
    selectedX: 0,
    selectedY: 0,
    selectedCluster: []
  },
  mounted() {
    that = this;
    that.initMap();
  },
  watch: {
    mapZoom(newVal, oldVal) {
      if (oldVal === -1) that.initOverlays();
    }
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
          minZoom: 3,
          maxZoom: 18,
          center: [11760366.56, 4662347.84],
          zoom: 4
        })
      });
      map.on('moveend', e => {
        that.mapZoom = map.getView().getZoom();
      });
    },
    // 创建新的聚类
    createCluster(d) {
      that.clusterData.push({
        p: d,
        data: [d]
      });
    },
    // 判断距离
    clusterTest(p1, p2) {
      const pixel1 = map.getPixelFromCoordinate(p1.coords);
      const pixel2 = map.getPixelFromCoordinate(p2.coords);
      // 判断两个点的屏幕距离是否小于图标大小:小于,是
      const dis = Math.abs(pixel1[0] - pixel2[0]);
      return dis < that.size;
    },
    // 处理聚类数据
    clusterOverlays() {
      for (var i = 0; i < that.overlays.length; i++) {
        const d = that.overlays[i];
        let _clustered = false;
        for (var j = 0;j < that.clusterData.length;j++) {
          const _d = that.clusterData[j].p;
          const isNear = that.clusterTest(d, _d);
          if (isNear) {
            that.clusterData[j].data.push(d);
            _clustered = true;
            break;
          }
        }
        if (!_clustered) that.createCluster(d);
      }
    },
    initOverlays() {
      that.clusterOverlays();
      // that.showAllOverlays();
      that.showFirstOverlay();
    },
    showFirstOverlay() {
      for (var i = 0; i < that.clusterData.length; i++) {
        const d = that.clusterData[i].p;
        const dom = document.createElement('div');
        dom.style.background = that.colorMap[d.level];
        dom.setAttribute('class', 'circle-overlay');
        dom.setAttribute('index', i);
        const overlay = new ol.Overlay({
          element: dom,
          position: d.coords,
          positioning: 'center-center',
          offset: [0, 0]
        });
        map.addOverlay(overlay);

        // 添加dom事件
        dom.addEventListener('mouseover', evt => {
          const index = evt.target.getAttribute("index");
          const coords = that.clusterData[index].p.coords;
          const pixel = map.getPixelFromCoordinate(coords);
          that.selectedX = pixel[0] + that.size / 2 + that.padding;
          that.selectedY = pixel[1] - that.size / 2;

          // 删除第一个div
          const cData = that.clusterData[index].data.concat([]);
          cData.splice(0, 1);
          that.selectedCluster = cData;
        });
        dom.addEventListener('mouseout', evt => {
          that.selectedCluster = [];
        });
      }
    },
    showAllOverlays() {
      for (var i = 0; i < that.clusterData.length; i++) {
        const d = that.clusterData[i].data;
        const coords = that.clusterData[i].p.coords;
        for (var j = 0; j < d.length; j++) {
          const _d = d[j];
          const _xOff = j * (that.size + that.padding);
          const dom = document.createElement('div');
          dom.style.background = that.colorMap[_d.level];
          dom.setAttribute('class', 'circle-overlay');
          const overlay = new ol.Overlay({
            element: dom,
            position: coords,
            positioning: 'center-center',
            offset: [_xOff, 0]
          });
          map.addOverlay(overlay);
        }
      }
    }
  }
});
