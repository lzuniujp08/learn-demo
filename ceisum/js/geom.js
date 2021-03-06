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

      that.addGeometries();
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
    },
    addGeometries() {
      //添加面
      viewer.entities.add({
        name: '修文县面',
        polygon: {
          hierarchy: {
            positions: Cesium.Cartesian3.fromDegreesArray([106.77782, 26.880415, 106.767198, 26.878146, 106.765429, 26.869504, 106.754449, 26.872442, 106.74308, 26.86523, 106.745757, 26.86097, 106.756096, 26.864954, 106.766212, 26.860382, 106.764634, 26.855843, 106.756014, 26.850808, 106.77193, 26.838512, 106.766452, 26.837562, 106.769928, 26.830129, 106.752493, 26.815644, 106.739835, 26.810209, 106.704815, 26.804102, 106.701652, 26.792001, 106.696612, 26.791107, 106.696227, 26.794841, 106.692468, 26.790183, 106.678214, 26.791391, 106.659927, 26.784792, 106.652125, 26.786217, 106.651744, 26.789424, 106.637967, 26.790302, 106.639837, 26.787703, 106.634221, 26.782698, 106.624984, 26.779228, 106.623433, 26.782107, 106.614492, 26.781035, 106.60208, 26.766295, 106.593897, 26.761152, 106.585877, 26.761611, 106.583618, 26.754383, 106.573826, 26.755784, 106.568594, 26.763858, 106.558676, 26.762004, 106.553517, 26.757392, 106.538804, 26.75987, 106.535176, 26.771149, 106.538557, 26.78329, 106.535156, 26.789857, 106.542001, 26.795627, 106.547432, 26.807295, 106.531441, 26.813405, 106.522698, 26.805126, 106.506257, 26.804733, 106.499243, 26.800276, 106.491388, 26.806424, 106.484519, 26.805893, 106.475987, 26.800497, 106.466697, 26.786264, 106.459411, 26.790888, 106.443809, 26.79088, 106.434093, 26.796361, 106.43272, 26.801543, 106.44329, 26.814614, 106.435677, 26.82324, 106.435633, 26.843304, 106.44092, 26.855065, 106.453496, 26.864336, 106.453681, 26.868221, 106.44365, 26.87458, 106.42889, 26.870007, 106.421723, 26.859882, 106.414858, 26.859429, 106.415691, 26.866553, 106.40267, 26.875897, 106.390932, 26.895546, 106.389826, 26.915276, 106.356811, 26.935473, 106.357644, 26.950819, 106.368565, 26.961675, 106.373787, 26.979935, 106.413296, 26.991736, 106.429341, 27.00148, 106.434727, 27.009748, 106.443758, 27.012897, 106.442289, 27.018347, 106.425339, 27.020273, 106.417154, 27.036415, 106.402364, 27.047557, 106.408716, 27.067801, 106.389784, 27.099937, 106.390837, 27.116238, 106.402697, 27.135024, 106.404062, 27.146731, 106.414562, 27.156008, 106.43477, 27.159537, 106.443364, 27.190411, 106.450148, 27.194621, 106.451752, 27.191115, 106.460667, 27.189687, 106.466932, 27.177558, 106.463092, 27.154839, 106.472518, 27.146935, 106.487193, 27.145414, 106.493791, 27.151026, 106.497375, 27.148615, 106.496135, 27.137438, 106.484593, 27.122328, 106.49482, 27.112824, 106.491513, 27.108297, 106.495239, 27.106366, 106.494517, 27.099108, 106.499657, 27.095446, 106.508033, 27.096956, 106.521782, 27.079863, 106.516663, 27.074703, 106.498152, 27.068147, 106.500548, 27.058764, 106.497114, 27.054144, 106.50313, 27.044116, 106.513564, 27.039093, 106.513273, 27.030165, 106.566235, 27.016425, 106.566411, 27.012874, 106.559279, 27.011781, 106.554927, 27.005203, 106.569371, 26.997594, 106.579031, 26.986316, 106.598969, 26.988156, 106.596097, 26.972017, 106.604609, 26.974069, 106.624747, 26.967903, 106.629058, 26.971791, 106.646062, 26.973424, 106.656844, 26.979949, 106.658553, 26.971687, 106.67056, 26.966605, 106.682193, 26.970255, 106.683334, 26.975493, 106.692095, 26.979115, 106.710096, 26.973559, 106.725879, 26.978165, 106.740192, 26.977909, 106.744169, 26.973236, 106.742594, 26.966052, 106.754371, 26.965623, 106.760104, 26.961667, 106.773863, 26.961882, 106.772139, 26.974527, 106.787085, 26.979892, 106.802205, 26.978384, 106.829876, 26.987848, 106.835495, 26.987091, 106.846192, 26.992907, 106.855981, 26.986824, 106.865849, 26.989993, 106.869126, 26.978897, 106.874563, 26.973597, 106.872632, 26.960509, 106.878556, 26.950906, 106.87689, 26.937468, 106.86726, 26.930358, 106.869725, 26.921228, 106.877336, 26.916295, 106.864691, 26.908922, 106.857032, 26.908045, 106.857222, 26.904115, 106.849776, 26.897599, 106.844127, 26.900981, 106.831385, 26.892088, 106.81736, 26.888309, 106.813272, 26.890771, 106.804848, 26.882842, 106.79099, 26.884566, 106.77782, 26.880415]),
          },
          material: new Cesium.Color.fromCssColorString("#FFFF00").withAlpha(0.4),
          outline: false,
          extrudedHeight: 2000
        }
      });

      //添加文字
      viewer.entities.add({
        name: '文字',
        position: Cesium.Cartesian3.fromDegrees(106.591202, 26.841079),
        label: {
          text: '修文县',
          font: '19px Helvetica',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.AZURE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM, //垂直方向以底部来计算标签的位置  
        }
      });

      //添加图标点
      var arr = [
        {
          "id": 1,
          "name": "六桶镇",
          "remark": "备注信息",
          "x": 106.442389,
          "y": 27.096585,
          "z": 1115.7
        },
        {
          "id": 2,
          "name": "洒坪乡",
          "remark": "备注信息",
          "x": 106.465139,
          "y": 26.92945,
          "z": 1182.2
        },
        {
          "id": 3,
          "name": "扎佐镇",
          "remark": "备注信息",
          "x": 106.704667,
          "y": 26.852224,
          "z": 1292
        },
        {
          "id": 4,
          "name": "六屯镇",
          "remark": "备注信息",
          "x": 106.831209,
          "y": 26.969376,
          "z": 1283.4
        }
      ];
      for (var i = 0; i < arr.length; i++) {
        const val = arr[i];
        //添加实体
        var entitie = viewer.entities.add({
          name: val.name,
          position: Cesium.Cartesian3.fromDegrees(val.x, val.y),
          billboard: {
            image: '/ceisum/img/marker.png',
            scale: 0.8, //原始大小的缩放比例
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // default: CENTER
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND //CLAMP_TO_GROUND
          },
          data: val
        });
      }
      viewer.flyTo(viewer.entities, {
        duration: 3
      });
    }
  }
});
