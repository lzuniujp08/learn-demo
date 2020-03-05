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
      Cesium.Math.setRandomNumberSeed(0); //设置随机数种子
      var promise = Cesium.GeoJsonDataSource.load('../../data/china.json'); //geojson面数据
      promise.then(function(dataSource) {
        viewer.dataSources.add(dataSource);
        var entities = dataSource.entities.values;
        var colorHash = {};
        var ellipsoid = viewer.scene.globe.ellipsoid;
        for (var i = 0; i < entities.length; i++) {
          var entity = entities[i];
          var color = Cesium.Color.fromRandom({
            alpha: 1
          });
          entity.polygon.material = color;
          entity.polygon.outline = false;
          var height = Math.floor(Math.random() * 400000 + 200000);
          entity.polygon.extrudedHeight = height;

          // entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN; //区块直接贴在地面上
          var polyPostions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions; //从多边形上取出他的顶点
          var polyCenter = Cesium.BoundingSphere.fromPoints(polyPostions).center; //通过顶点构建一个包围球
          polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter); //把包围球得中心做贴地得偏移
          var cartographic = ellipsoid.cartesianToCartographic(polyCenter);
          var lat = Cesium.Math.toDegrees(cartographic.latitude);
          var lon = Cesium.Math.toDegrees(cartographic.longitude);
          //添加标注
          var name = entity.properties.getValue().name;
          viewer.entities.add({
            position : Cesium.Cartesian3.fromDegrees(lon, lat,  height + 100000),
            label: {
              text: name,
              font: '15px Helvetica',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              showBackground : true,
              scale: 1
            }
          });

          viewer.zoomTo(promise);
        }
      });
    }
  }
});
