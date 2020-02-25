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
      const warnLineData = [{
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
      nameDom.innerHTML = typhoonData.name;
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

      if (type === 'live' && index === that._typhoonPlayIndex[attr.tfbh]) {
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
