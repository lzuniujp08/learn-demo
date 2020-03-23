var Typhoon = function(map) {
  {
    const that = this;
    that._map = map;
    that._speed = 200;
    that._typhoonList = [];
    that._typhoonData = {};
    that._nameOverlays = {};
    that._typhoonPlayFlag = {};
    that._typhoonPlayIndex = {};
    that._warnLines = null;
    that._typhoonLayers = {};
    that._forecastFeatures = {};
    that._forcColorDict = {
      '中国': '#ec5d72',
      '中国香港': '#ec7cfe',
      '中国台湾': '#ecaa65',
      '日本': '#56f66e',
      '美国': '#53dbfe',
      '韩国': '#72a4ac',
      '欧洲': '#4c54a6',
    };

    that.init = function() {
      that.addWarnLine();
      // 添加地图事件
      that.addMapEvent();

      $.get('../../data/201929.json', res => {
        that._typhoonList = res;
        that.showTyphoon(that._typhoonList[0]);

        setTimeout(function() {
          that.showTyphoon(that._typhoonList[1]);
          that.removeTyphoon(that._typhoonList[0].tfbh);
        }, 2000);
      })
    };

    that.addWarnLine = function() {
      const warnLineData = [
        {
          "color": "blue",
          "weight": 1,
          "opacity": 0.8,
          "dashArray": [0, 0],
          "points": [
            [
              105,
              0,

            ],
            [
              113,
              4.5

            ],
            [
              119,
              11
            ],
            [
              119,
              18
            ],
            [
              127,
              22
            ],
            [
              127,
              34
            ]
          ]
        },
        {
          "color": "green",
          "weight": 1,
          "opacity": 0.8,
          "dashArray": [10, 5],
          "points": [
            [
              105,
              0
            ],
            [
              120,
              0
            ],
            [
              132,
              15
            ],
            [
              132,
              34
            ]
          ]
        }
      ];
      const features = [];
      for (var i = 0; i < warnLineData.length; i++) {
        const d = warnLineData[i];
        const geometry = new ol.geom.LineString(d.points);
        geometry.transform('EPSG:4326', that._map.getView().getProjection());
        const feature = new ol.Feature({
          geometry: geometry,
          attr: d
        });
        features.push(feature);
      }
      const source = new ol.source.Vector({
        features: features
      });
      that._warnLines = new ol.layer.Vector({
        source: source,
        style: that.warnLineStyle,
        opacity: 0.8
      });
      that._map.addLayer(that._warnLines);
    };

    that.warnLineStyle = function(feat) {
      const attr = feat.get('attr');
      return new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: attr.color,
          width: attr.weight,
          lineDash: attr.dashArray
        })
      });
    };

    // 展示台风
    that.showTyphoon = function(typhoonData) {
      const tfbh = typhoonData.tfbh;

      that._typhoonData[tfbh] = typhoonData;

      // 1. 添加台风名称
      that.addNameOverlay(typhoonData);

      // 2. 创建展示图层
      that.addTyphoonLayer(tfbh);

      // 3.开始播放
      that.playTyphoon(tfbh);
    };

    // 移除台风
    that.removeTyphoon = function(tfbh) {
      // 删除台风名称
      that._map.removeOverlay(that._nameOverlays[tfbh]);
      // 删除展示图层
      that._map.removeLayer(that._typhoonLayers[tfbh].layer);
      // 消除定时器
      clearInterval(that._typhoonPlayFlag[tfbh]);
    };

    // 添加台风名称
    that.addNameOverlay = function(typhoonData) {
      const nameDom = document.createElement('div');
      nameDom.setAttribute('class', 'typhoon-name');
      nameDom.innerHTML = [typhoonData.tfbh, typhoonData.name].join('');
      const pointStart = typhoonData.points[0];
      const position = ol.proj.fromLonLat([pointStart.longitude, pointStart.latitude]);
      const nameOverlay = new ol.Overlay({
        element: nameDom,
        position: position,
        positioning: 'center-left',
        offset: [15, 0]
      });
      that._map.addOverlay(nameOverlay);
      that._nameOverlays[typhoonData.tfbh] = nameOverlay;
    };

    // 根据编号添加台风图层
    that.addTyphoonLayer = function(tfbh) {
      const source = new ol.source.Vector({
        features: []
      });
      const layer = new ol.layer.Vector({
        source: source,
        style: that.typhoonStyle
      });
      that._map.addLayer(layer);
      that._typhoonLayers[tfbh] = {
        source: source,
        layer: layer
      }
      that._forecastFeatures[tfbh] = [];
    };

    that.addMapEvent = function() {
      // 鼠标移动事件
      that._map.on('pointermove', function(evt) {
        const pixel = evt.pixel;
        const dom = that._map.getTargetElement();
        if(that._map.hasFeatureAtPixel(pixel)) {
          dom.style.cursor = 'pointer';
          const features = that._map.getFeaturesAtPixel(pixel);
          const feature = features[0];
          // console.log(feature.get('attr'));
        } else {
          dom.style.cursor = 'default';
        }
      });

      that._map.on('click', function(evt) {
        const pixel = evt.pixel;
        if(that._map.hasFeatureAtPixel(pixel)) {
          const features = that._map.getFeaturesAtPixel(pixel);
          const feature = features[0];
          const attr = feature.get('attr');
          that._typhoonPlayIndex[attr.tfbh] = attr.index;
          that.showForecast(attr.tfbh, attr);
        }
      });
    };

    // 播放台风
    that.playTyphoon = function(tfbh) {
      let index = 0;
      const typhoonData = that._typhoonData[tfbh];
      that.play(index, tfbh);
      that._typhoonPlayFlag[tfbh] = setInterval(function() {
        index++;
        if (index === typhoonData.points.length) {
          clearInterval(that._typhoonPlayFlag[tfbh]);
        } else {
          that.play(index, tfbh);
        }
      }, that._speed);
    };

    // 播放单个点
    that.play = function(index, tfbh) {
      // 删除预报
      that.removeForecast(tfbh);

      that._typhoonPlayIndex[tfbh] = index;
      const points = that._typhoonData[tfbh].points;
      const point = points[index];
      point.type = 'live';
      point.index = index;
      point.tfbh = tfbh;
      if (index > 0) {
        const prePoint = points[index - 1];
        point.start = [prePoint.longitude, prePoint.latitude];
      }
      point.end = [point.longitude, point.latitude];
      const coords = ol.proj.fromLonLat(point.end);
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(coords),
        attr: point
      });
      that._typhoonLayers[tfbh].source.addFeature(feature);

      // 最后一个实况点，展示预报路径
      if (index === that._typhoonData[tfbh].points.length - 1) {
        that.showForecast(tfbh, point);
      }
    };

    // 删除预报数据
    that.removeForecast = function(tfbh) {
      const source = that._typhoonLayers[tfbh].source;
      for (var i = 0; i < that._forecastFeatures[tfbh].length; i++) {
        const f = that._forecastFeatures[tfbh][i];
        source.removeFeature(f);
      }
      that._forecastFeatures[tfbh] = [];
    }

    // 展示预报数据
    that.showForecast = function(tfbh, livePoint) {
      const source = that._typhoonLayers[tfbh].source;
      // 1. 删除预报数据
      that.removeForecast(tfbh);
      // 2. 添加预报
      const forecast = livePoint.forecast;
      const features = [];
      for (var i = 0; i < forecast.length; i++) {
        const f = forecast[i];
        for (var j = 0; j < f.points.length; j++) {
          const point = f.points[j];
          const prePoint = f.points[j - 1];
          point.sets = f.sets;
          point.type = 'forc';
          point.index = j;
          point.start =
            j === 0 ?
            [livePoint.longitude, livePoint.latitude] :
            [prePoint.longitude, prePoint.latitude];
          point.end = [point.longitude, point.latitude];
          const coords = ol.proj.fromLonLat(point.end);
          const feature = new ol.Feature({
            geometry: new ol.geom.Point(coords),
            attr: point
          });
          features.push(feature);
        }
      }
      source.addFeatures(features);
      that._forecastFeatures[tfbh] = features;
    }

    // 台风展示样式
    that.typhoonStyle = function(feat) {
      const attr = feat.get('attr');
      const speed = attr.speed;
      const type = attr.type;
      const index = attr.index;
      const color = that.getPointColor(speed);
      let styles = [];

      // 线的样式
      const start = attr.start;
      const end = attr.end;
      const lineColor = that.getLineColor(type, attr.sets);
      const lineDash = type === 'live' ? [0] : [8];
      const lineWidth = type === 'live' ? 2 : 1;
      if(start && start.length > 0) {
        const coords = [start, end];
        const geometry = new ol.geom.LineString(coords);
        geometry.transform('EPSG:4326', that._map.getView().getProjection());
        const lineStyle = new ol.style.Style({
          geometry: geometry,
          stroke: new ol.style.Stroke({
            color: lineColor,
            width: lineWidth,
            lineDash: lineDash
          })
        });
        styles.push(lineStyle);
      }

      if (type === 'live' && index === that._typhoonPlayIndex[attr.tfbh]) {
        // 台风图标
        const icon = new ol.style.Style({
          image: new ol.style.Icon({
                scale: 0.7,
                src:
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAA5lGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMTQgNzkuMTUxNDgxLCAyMDEzLzAzLzEzLTEyOjA5OjE1ICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgICAgICAgICB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgICAgICAgICB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wNC0wN1QxMzo0OTo0NCswODowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE2LTA5LTI4VDE1OjAwOjA2KzA4OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNi0wOS0yOFQxNTowMDowNiswODowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDo4NzM4NmRmNy02MWMzLTA5NGYtODZmZi0xZjA1Y2M5ZDYwZjM8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPnhtcC5kaWQ6NjczRkU0ODkwNzVEMTFFNjhBRkFCNDY1OEI5NkE4Njk8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtcC5paWQ6NjczRkU0ODYwNzVEMTFFNjhBRkFCNDY1OEI5NkE4Njk8L3N0UmVmOmluc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZjpkb2N1bWVudElEPnhtcC5kaWQ6NjczRkU0ODcwNzVEMTFFNjhBRkFCNDY1OEI5NkE4Njk8L3N0UmVmOmRvY3VtZW50SUQ+CiAgICAgICAgIDwveG1wTU06RGVyaXZlZEZyb20+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo2NzNGRTQ4OTA3NUQxMUU2OEFGQUI0NjU4Qjk2QTg2OTwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ODczODZkZjctNjFjMy0wOTRmLTg2ZmYtMWYwNWNjOWQ2MGYzPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTA5LTI4VDE1OjAwOjA2KzA4OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+NzIwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjY1NTM1PC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj41MDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj41MDwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+9P/y2gAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAWj0lEQVR42uyaaZCdV3nnf8953/eufW/3vb2r1d1qqbVLlmXLmyRjjB0wYMAGHAqzDFOTgUplJkVNUhRDMpkkkxq+zOCqpKaGyQw1BBIoMCQBm+AtGPASb5IsS5bcLanV6lbvfbe++7ucZz50gy3ZMEvxIZWaU3XrvlX31lvnd57n/J/lHFFV/ikMwz+R4f7s4eP/cvmtSU2ciacfxJ49x+WDA3jjx9l1+hmenLhEGNlf/OJh0GW4Jp6W/uAGLnbM46yc08lOCCuve8E2Psf0D4u4A19h+D0fJV17inhmH9UtZ5lLNBnxM7y3VOBr88LNB/sIWwmWynDP0H1EGgLw+4//wesgv6rhESPAl5FsjqP7djKcv1nOnZnT3uk5oms3SVRcVKlErKMIHuMoz/7qLPKrGruHtzK6by+Hb71Fdg2lePrSPNVwlldn6pRmV5RyhAcEcaCvA5nthFhIFNN/LCAOPZ0DvP+z98vo2AHTlZ1mZmlenz1xXhee78StiybaDplkmnamzEfS8Pz+HNGswPk8PfU8ET7WWlQVNQJYVBTRCFXnVwNi1cFKDDUOoFypdsKBXffxmT94v+noGXaC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'
              })
        });
        styles.push(icon);
        // 风圈样式
        const center = feat.get('geometry').getCoordinates();
        const fillStyle = new ol.style.Fill({
          color: 'rgba(0, 0, 0, 0.2)'
        });
        // 7级风圈的样式
        if(attr.radius7 > 0) {
          const geometry = that.getCircleGeometry(center, attr.radius7_quad);
          const style = new ol.style.Style({
            geometry: geometry,
            stroke: new ol.style.Stroke({
              color: '#00bab2',
              width: 1
            }),
            fill: fillStyle
          });
          styles.push(style);
        }
        // 10级风圈的样式
        if(attr.radius10 > 0) {
          const geometry = that.getCircleGeometry(center, attr.radius10_quad);
          const style = new ol.style.Style({
            geometry: geometry,
            stroke: new ol.style.Stroke({
              color: '#ffff00',
              width: 1
            }),
            fill: fillStyle
          });
          styles.push(style);
        }
        // 12级风圈的样式
        if(attr.radius12 > 0) {
          const geometry = that.getCircleGeometry(center, attr.radius12_quad);
          const style = new ol.style.Style({
            geometry: geometry,
            stroke: new ol.style.Stroke({
              color: '#da7341',
              width: 1
            }),
            fill: fillStyle
          });
          styles.push(style);
        }
      }

      // 点的样式
      const radius = type === 'live' ? 4 : 3;
      const pointStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: radius,
          fill: new ol.style.Fill({
            color: color
          }),
          stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 0, 0.6)',
            width: 1
          })
        })
      });
      styles.push(pointStyle);

      return styles;
    };

    // 获取线的颜色
    that.getLineColor = function(type, sets) {
      if (type === 'live') {
        return 'rgba(0, 0, 0, .6)';
      } else {
        let color = that._forcColorDict[sets];
        if (!color) color = 'rgba(0, 0, 0, .3)';
        return color;
      }
    };

    // 根据风速获取点的颜色
    that.getPointColor = function(_speed) {
      let _color = '';
      if (_speed >= 10.8 && _speed < 17.2) {
        _color = 'rgba(153, 255, 153, .9)';
      } else if (_speed >= 17.2 && _speed < 24.5) {
        _color = 'rgba(102, 204, 255, .9)';
      } else if (_speed >= 24.5 && _speed < 32.7) {
        _color = 'rgba(255, 255, 102, .9)';
      } else if (_speed >= 32.7 && _speed < 41.5) {
        _color = 'rgba(253, 139, 0, .9)';
      } else if (_speed >= 41.5 && _speed < 50.1) {
        _color = 'rgba(255, 51, 0, .9)';
      } else {
        _color = 'rgba(255, 0, 255, .9)';
      }
      return _color;
    };

    that.getCircleGeometry = function(center, radiusData) {
      if (typeof radiusData === 'number') {
        return new ol.geom.Circle(center, radiusData * 1000);
      } else {
        if (radiusData['ne']) {
          let _coords = [];
          let _angInterval = 6;
          let _pointNums = 360 / (_angInterval * 4);
          let quadrant = {
            // 逆时针算角度
            '0': 'ne',
            '1': 'nw',
            '2': 'sw',
            '3': 'se'
          };
          for (let i = 0; i < 4; i++) {
            let _r = parseFloat(radiusData[quadrant[i]]) * 1000; // 单位是km
            if (!_r) _r = 0;
            for (let j = i * _pointNums; j <= (i + 1) * _pointNums; j++) {
              let _ang = _angInterval * j;
              let x = center[0] + _r * Math.cos((_ang * Math.PI) / 180);
              let y = center[1] + _r * Math.sin((_ang * Math.PI) / 180);
              _coords.push([x, y]);
            }
          }
          return new ol.geom.Polygon([_coords]);
        } else {
          return null;
        }
      }
    }
  }
}
