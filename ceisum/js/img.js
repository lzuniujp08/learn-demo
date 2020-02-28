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
      that.addImage();
    },
    addImage() {
      var url_root = "/ceisum/img/";
      var h = 500;
      var data_arr = [
        [100 * h, "tem_100.png"],
        [300 * h, "tem_300.png"],
        [500 * h, "tem_500.png"],
        [700 * h, "tem_700.png"],
        [900 * h, "tem_900.png"]
      ];
      var entities = viewer.entities;
      for (var i = 0; i < data_arr.length; i++) {
        entities.add({
          rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(113.207, 37.4351, 119.427, 42.7022),
            material: new Cesium.ImageMaterialProperty({
              image: url_root + data_arr[i][1],
              transparent: true
            }),
            height: data_arr[i][0]
          }
        });
      }
      viewer.flyTo(viewer.entities, {
        duration: 3
      });
    }
  }
});
