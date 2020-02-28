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
      that.centerAtHome();
    },
    centerAtHome() {
      var centeropt = {
        "x": 106.627404,
        "y": 26.755607,
        "z": 30499.4,
        "heading": 356.3,
        "pitch": -70,
        "roll": 360
      };
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(centeropt.x, centeropt.y, centeropt.z || 0), //经度、纬度、高度
        orientation: {
          heading: Cesium.Math.toRadians(centeropt.heading || 0), //绕垂直于地心的轴旋转
          pitch: Cesium.Math.toRadians(centeropt.pitch || -Cesium.Math.PI_OVER_FOUR), //绕纬度线旋转
          roll: Cesium.Math.toRadians(centeropt.roll || 0) //绕经度线旋转
        },
        duration: 3,
      });
    }
  }
});
