var that, viewer;

var app = new Vue({
  el: '#app',
  data: {},
  mounted() {
    that = this;
    that.initMap();
  },
  methods: {
    initMap() {
      imageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'http://mt{s}.google.cn/vt/lyrs=s&hl=zh-CN&gl=CN&x={x}&y={y}&z={z}&s=Gali',
        subdomains: ['1', '2', '3'],
        maximumLevel: 18
      });

      viewer = new Cesium.Viewer('map', {
        terrainProvider: Cesium.createWorldTerrain(),
        infoBox: false,
        animation: false, //是否创建动画小器件，左下角仪表
        timeline: false, //是否显示时间线控件
        geocoder: false, //是否显示地名查找控件
        baseLayerPicker: false, //是否显示图层选择控件
        imageryProvider: imageryProvider
      });

      viewer.cesiumWidget.creditContainer.style.display = "none"; //去cesium logo水印
      if (viewer.homeButton) {
        viewer.homeButton.viewModel.command.beforeExecute.addEventListener(commandInfo => {
          that.centerAtHome();
          commandInfo.cancel = true;
        });
      }

      that.addPoints();
    },
    addPoints() {
      $.get('../../data/capital.json', res => {
        for (var i = 1; i < res.length; i++) {
          var data = res[i];
          var longitude = data.lon;
          var latitude = data.lat;
          var height = Math.floor(Math.random() * 400000 + 200000);
          var color = Cesium.Color.fromHsl((0.6 - (height * 0.5)), 1.0, 0.5);
          var surfacePosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);
          var heightPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
          //WebGL Globe only contains lines, so that's the only graphics we create.
          var polyline = new Cesium.PolylineGraphics();
          polyline.material = new Cesium.ColorMaterialProperty(color);
          polyline.width = new Cesium.ConstantProperty(2);
          polyline.arcType = new Cesium.ConstantProperty(Cesium.ArcType.NONE);
          polyline.positions = new Cesium.ConstantProperty([surfacePosition, heightPosition]);
          //The polyline instance itself needs to be on an entity.
          var entity = new Cesium.Entity({
            id: ' index ' + i.toString(),
            polyline: polyline
          });
          viewer.entities.add(entity);
        }
        viewer.flyTo(viewer.entities, {
          duration: 3
        });
      });
    }
  }
});
