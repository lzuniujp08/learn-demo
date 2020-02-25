var that, map;

var app = new Vue({
  el: '#app',
  data: {
    vector: null
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
      that.vector = new ol.layer.Vector({
        source: null,
        style: that.styleFunction
      });
      // var image = new ol.layer.Image({
      //   source: new ol.source.ImageStatic({
      //     imageExtent: [12631979.217766721,4505524.1013878435,13274849.277097877,5251284.6049773842],
      //     url: '../css/tem.png'
      //   }),
      //   opacity: 0.6
      // })
      map = new ol.Map({
        controls: ol.control.defaults({
          attribution: false
        }),
        target: 'map',
        layers: [osm, that.vector],
        view: new ol.View({
          minZoom: 2,
          maxZoom: 18,
          center: [0, 0],
          zoom: 3
        })
      });
      that.setDayNightSource();
    },
    styleFunction() {
      return new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 0, 0.5)'
        })
        // stroke: new ol.style.Stroke({
        //   color: '#ffffff',
        //   width: 0
        // })
      });
    },
    setDayNightSource() {
      let coords = that.getCoordinates();
      coords = [coords];
      console.log(coords);
      const geom = new ol.geom.Polygon(coords);
      const proj = map.getView().getProjection();
      geom.transform('EPSG:4326', proj);
      const feature = new ol.Feature({
        geometry: geom
      });
      const source = new ol.source.Vector({
        features: [feature]
      });
      that.vector.setSource(source);
    },
    // 此处开始与计算白天黑夜坐标点有关系的
    getCoordinates(time, options) {
      var rad2deg = 180 / Math.PI;
      var deg2rad = Math.PI / 180;

      var date = time ? new Date(time) : new Date();

      // Calculate the present UTC Julian Date.
      // Function is valid after the beginning of the UNIX epoch 1970-01-01 and ignores leap seconds.
      var julianDay = (date / 86400000) + 2440587.5;

      // Calculate Greenwich Mean Sidereal Time (low precision equation).
      // http://aa.usno.navy.mil/faq/docs/GAST.php
      var gst = (18.697374558 + 24.06570982441908 * (julianDay - 2451545.0)) % 24;
      var lonlat = [];

      var sunEclPos = that._sunEclipticPosition(julianDay);
      var eclObliq = that._eclipticObliquity(julianDay);
      var sunEqPos = that._sunEquatorialPosition(sunEclPos.lambda, eclObliq);

      var step = 1;
      for (var i = -180; i <= 180; i += step) {
        var lon = i;
        // Hour angle (indegrees) of the sun for a longitude on Earth.
        var ha = (gst * 15 + lon) - sunEqPos.alpha;
        // Latitude
        var lat = Math.atan(-Math.cos(ha * deg2rad) /
          Math.tan(sunEqPos.delta * deg2rad)) * rad2deg;
        // New point
        lonlat.push([lon, lat]);
      }
      switch (options) {
        case 'line': break;
        case 'day': sunEqPos.delta *= -1;
        // fallthrough
        default: {
          // Close polygon
          lat = (sunEqPos.delta < 0) ? 90 : -90;
          lonlat.unshift([-180, lat]);
          lonlat.push([180, lat]);
          lonlat.push(lonlat[0])
          break;
        }
      }
      // Return night + day polygon
      if (options === 'daynight') {
        var day = [];
        lonlat.forEach(function (t) { day.push(t.slice()); });
        day[0][1] = -day[0][1];
        day[day.length-1][1] = -day[0][1];
        day[day.length-1][1] = -day[0][1];
        lonlat = [ lonlat, day ];
      }
      // Return polygon
      return lonlat;
    },
    _sunEclipticPosition(julianDay) {
      var deg2rad = Math.PI / 180;
      // Days since start of J2000.0
      var n = julianDay - 2451545.0;
      // mean longitude of the Sun
      var L = 280.460 + 0.9856474 * n;
      L %= 360;
      // mean anomaly of the Sun
      var g = 357.528 + 0.9856003 * n;
      g %= 360;
      // ecliptic longitude of Sun
      var lambda = L + 1.915 * Math.sin(g * deg2rad) +
        0.02 * Math.sin(2 * g * deg2rad);
      // distance from Sun in AU
      var R = 1.00014 - 0.01671 * Math.cos(g * deg2rad) -
        0.0014 * Math.cos(2 * g * deg2rad);
      return { lambda: lambda, R: R };
    },
    _eclipticObliquity(julianDay) {
      var n = julianDay - 2451545.0;
      // Julian centuries since J2000.0
      var T = n / 36525;
      var epsilon = 23.43929111 -
        T * (46.836769 / 3600
          - T * (0.0001831 / 3600
            + T * (0.00200340 / 3600
              - T * (0.576e-6 / 3600
                - T * 4.34e-8 / 3600))));
      return epsilon;
    },
    _sunEquatorialPosition(sunEclLon, eclObliq) {
      var rad2deg = 180 / Math.PI;
      var deg2rad = Math.PI / 180;

      var alpha = Math.atan(Math.cos(eclObliq * deg2rad)
        * Math.tan(sunEclLon * deg2rad)) * rad2deg;
      var delta = Math.asin(Math.sin(eclObliq * deg2rad)
        * Math.sin(sunEclLon * deg2rad)) * rad2deg;

      var lQuadrant = Math.floor(sunEclLon / 90) * 90;
      var raQuadrant = Math.floor(alpha / 90) * 90;
      alpha = alpha + (lQuadrant - raQuadrant);

      return {alpha: alpha, delta: delta};
    }
  }
});
