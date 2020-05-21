var that;
var Typhoon = {
    typhoonData: {},
    popup: null,
    lineColorDict: {
        '中国': '#ec5d72',
        '中国香港': '#ec7cfe',
        '中国台湾': '#ecaa65',
        '日本': '#56f66e',
        '美国': '#53dbfe',
        '韩国': '#72a4ac',
        '欧洲': '#4c54a6'
    },
    interval: 200,
    init() {
        that = this;
        that.popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'my-popup',
            offset: [0, -10],
            anchor: 'bottom'
        });
        that._addWarnLine();
        that._getTyphoonData();
    },
    _addWarnLine() {
        const warnLineData = [
            {
                "color": "blue",
                "weight": 1,
                "opacity": 0.8,
                "dashArray": 0,
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
        var geojson = {
            'type': 'FeatureCollection',
            'features': []
        };
        for(var i = 0; i < warnLineData.length;i++) {
            var d = warnLineData[i];
            geojson.features.push({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: d.points
                },
                properties: d
            });
        }
        map.addSource('warn-line', {
            type: 'geojson',
            data: geojson
        });
        map.addLayer({
            id: 'warn-line',
            type: 'line',
            source: 'warn-line',
            paint: {
                'line-color': [
                    'match',
                    ['get', 'color'],
                    'blue', 'blue',
                    'green'
                ],
                'line-width': 2,
                'line-dasharray': [5, 3]
            }
        });
    },
    checkTyphoon(check, tfbh) {
        if(check) {
            that._addTyphoon(tfbh);
        } else {
            that._clearTyphoon(tfbh);
        }
    },
    _showTyphoon(tfbh, isPlay) {
        var index = that.typhoonData[tfbh]['playIndex'];
        // 台风风圈
        map.setFilter('circle-layer-' + tfbh, ['==', 'index', index]);
        // 设置风圈图片
        var points = that.typhoonData[tfbh]['data']['points'];
        var p = points[index];
        var marker = that.typhoonData[tfbh].marker;
        marker.getElement().style.display='block';
        marker.setLngLat([p.longitude, p.latitude]);

        // 播放状态
        if(isPlay) {
            map.setFilter('path-layer-live-' + tfbh, ['==', 'index', index]);
            map.setFilter('points-layer-live-' + tfbh, ['<=', 'index', index]);
            // 隐藏预报
            map.setFilter('path-layer-forc-' + tfbh, ['==', 'index', -1]);
            map.setFilter('points-layer-forc-' + tfbh, ['==', 'index', -1]);
        } else {
            map.setFilter('path-layer-forc-' + tfbh, ['==', 'index', index]);
            map.setFilter('points-layer-forc-' + tfbh, ['==', 'index', index]);
            // 展示完整的实况
            map.setFilter('path-layer-live-' + tfbh, ['==', 'index', points.length - 1]);
            map.setFilter('points-layer-live-' + tfbh, ['<=', 'index', points.length - 1]);
        }
    },
    _stopTyphoon(tfbh) {
        window.clearInterval(that.typhoonData[tfbh].playFlag);
    },
    _addMapEvent(tfbh) {
        map.on('mouseenter', 'points-layer-live-' + tfbh, function(e) {
            map.getCanvas().style.cursor = 'pointer';
            that._showPointInfo(e.features[0]);
        });
        map.on('mouseenter', 'points-layer-forc-' + tfbh, function(e) {
            map.getCanvas().style.cursor = 'pointer';
            that._showPointInfo(e.features[0]);
        });

        map.on('click', 'points-layer-live-' + tfbh, function(e) {
            var feature = e.features[0];
            var properties = feature.properties;
            var _tfbh = properties.tfbh;
            that.typhoonData[_tfbh]['playIndex'] = properties.index;
            that._stopTyphoon(_tfbh);
            that._showTyphoon(_tfbh);
        });

        map.on('mouseleave', 'points-layer-live-' + tfbh, function(e) {
            map.getCanvas().style.cursor = '';
            that.popup.remove();
        });
        map.on('mouseleave', 'points-layer-forc-' + tfbh, function(e) {
            map.getCanvas().style.cursor = '';
            that.popup.remove();
        });
    },
    _showPointInfo(feature) {
        var coordinates = feature.geometry.coordinates.slice();
        var properties = feature.properties;
        var date = new Date(properties.time).format('MM月dd日 hh:mm');
        var lon = properties.longitude, lat = properties.latitude;
        var strong = properties.strong;
        var speed = properties.speed;
        var move_dir = properties.move_dir;
        var move_speed = properties.move_speed;
        var pressure = properties.pressure;
        var typhoonLabel = properties.typhoonLabel;

        var circle7 = '';
        var circle10 = '';
        var circle12 = '';
        // 风圈数据处理
        if(properties.radius7 && properties.radius7 > 0) {
            var radius7_quad = JSON.parse(properties.radius7_quad);
            var radius10_quad = JSON.parse(properties.radius10_quad);
            var radius12_quad = JSON.parse(properties.radius12_quad);
            var radius7 = [], radius10 = [], radius12 = [];
            for(var key in radius7_quad) {
                radius7.push(radius7_quad[key]);
            }
            for(var key in radius10_quad) {
                radius10.push(radius10_quad[key]);
            }
            for(var key in radius12_quad) {
                radius12.push(radius12_quad[key]);
            }
            radius7 = radius7.sort((a, b) => {
                return a - b;
            });
            radius10 = radius10.sort((a, b) => {
                return a - b;
            });
            radius12 = radius12.sort((a, b) => {
                return a - b;
            });
            circle7 = radius7[0] === radius7[3] ? radius7[0] : radius7[0] + '—' + radius7[3];
            circle10 = radius10[0] === radius10[3] ? radius10[0] : radius10[0] + '—' + radius10[3];
            circle12 = radius12[0] === radius12[3] ? radius12[0] : radius12[0] + '—' + radius12[3];
        }
        var description = `
            <h5>${typhoonLabel}</h5>
            <ul>
              <li><label>过去时间：</label> ${date}</li>
              <li><label>中心位置：</label> ${lat}N, ${lon}E</li>
              <li><label>风速：</label> ${speed}米/秒</li>
              <li><label>气压：</label> ${pressure}百帕</li>`;
        if (move_speed && move_speed > 0) {
            description += `
              <li><label>移速：</label> ${move_speed}米/秒</li>
              <li><label>移向：</label> ${move_dir}</li>
              <li><label>7级风圈：</label> ${circle7}公里</li>
              <li><label>10级风圈：</label> ${circle10}公里</li>
              <li><label>12级风圈：</label> ${circle12}公里</li>
            `;
        }
        description += '</ul>';
        that.popup.setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    },
    _getTyphoonData() {
        $.get('../data/2019291.json', function(res) {
            that.typhoonList = res;
            for(var i = 0; i < res.length; i++) {
                var r = res[i];
                that.typhoonData[r.tfbh] = {
                    data: r,
                    playFlag: 0,
                    playIndex: 0
                };
            }
        })
    },
    _clearTyphoon(tfbh) {
        // 1、删除台风标签
        var label = that.typhoonData[tfbh]['label'];
        if(label) label.remove();
        var marker = that.typhoonData[tfbh]['marker'];
        if(marker) marker.remove();
        // 2、删除风圈
        map.removeLayer('circle-layer-' + tfbh);
        map.removeSource('circle-source-' + tfbh);
        // 3、删除台风路径
        map.removeLayer('path-layer-live-' + tfbh);
        map.removeLayer('path-layer-forc-' + tfbh);
        map.removeSource('path-source-live-' + tfbh);
        map.removeSource('path-source-forc-' + tfbh);
        // 4、删除台风点
        map.removeLayer('points-layer-live-' + tfbh);
        map.removeLayer('points-layer-forc-' + tfbh);
        map.removeSource('points-source-live-' + tfbh);
        map.removeSource('points-source-forc-' + tfbh);
        // 5、停止播放
        that._stopTyphoon(tfbh);
    },
    _addTyphoon(tfbh) {
        // 1、添加台风标签和风圈图片
        that._addTyphoonLabel(tfbh);
        // 2、添加风圈
        that._addTyphoonCircle(tfbh);
        // 3、添加台风路径
        that._addTyphoonPath(tfbh);
        // 4、添加台风点
        that._addTyphoonPoints(tfbh);
        // 5、默认展示最后一个
        var data = that.typhoonData[tfbh].data;
        // that.typhoonData[tfbh]['playIndex'] = data['points'].length - 1;
        that._showTyphoon(tfbh, true);
        // 6、添加地图事件
        that._addMapEvent(tfbh);
        that._startPlay(tfbh);
    },
    _startPlay(tfbh) {
        that.typhoonData[tfbh].playFlag = setInterval(function () {
            var points = that.typhoonData[tfbh].data.points;
            that.typhoonData[tfbh]['playIndex'] = that.typhoonData[tfbh]['playIndex'] + 1;
            // 停止播放
            if(that.typhoonData[tfbh]['playIndex'] === points.length) {
                that._stopTyphoon(tfbh);
            } else {
                that._showTyphoon(tfbh, true);
            }
        }, that.interval)
    },
    _addTyphoonCircle(tfbh) {
        var data = that.typhoonData[tfbh].data;
        var points = data.points;
        var geojson = {
            'type': 'FeatureCollection',
            'features': []
        };
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            var center = [p.longitude, p.latitude];
            // 7级风圈
            if (p.radius7 > 0) {
                var coords = that._getCircleCoords(center, p.radius7_quad);
                geojson.features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: coords
                    },
                    properties: {
                        index: i,
                        radius: '7'
                    }
                });
            }
            // 10级风圈
            if (p.radius10 > 0) {
                var coords = that._getCircleCoords(center, p.radius10_quad);
                geojson.features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: coords
                    },
                    properties: {
                        index: i,
                        radius: '10'
                    }
                });
            }
            // 12级风圈
            if (p.radius12 > 0) {
                var coords = that._getCircleCoords(center, p.radius12_quad);
                geojson.features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: coords
                    },
                    properties: {
                        index: i,
                        radius: '12'
                    }
                });
            }
        }
        map.addSource('circle-source-' + data.tfbh, {
            type: 'geojson',
            data: geojson
        });
        map.addLayer({
            id: 'circle-layer-' + data.tfbh,
            type: 'fill',
            source: 'circle-source-' + data.tfbh,
            paint: {
                'fill-color': [
                    'match',
                    ['get', 'radius'],
                    '7', '#00bab2',
                    '10', '#ffff00',
                    '#da7341' // other
                ],
                'fill-opacity': 0.2,
                'fill-outline-color': [
                    'match',
                    ['get', 'radius'],
                    '7', '#00bab2',
                    '10', '#ffff00',
                    '#da7341' // other
                ]
            }
        });
    },
    _getCircleCoords(center, radiusData) {
        center = proj4(proj4('EPSG:4326'), proj4('EPSG:3857'), center);
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
                var coord = proj4(proj4('EPSG:3857'), proj4('EPSG:4326'), [x, y]);
                _coords.push(coord);
            }
        }

        return [_coords];
    },
    _addTyphoonPoints(tfbh) {
        var data = that.typhoonData[tfbh].data;
        var points = data.points;
        var geojsonLive = {
            'type': 'FeatureCollection',
            'features': []
        };
        var geojsonForc = {
            'type': 'FeatureCollection',
            'features': []
        };
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            p.index = i;
            p.typhoonLabel = data.tfbh + data.name;
            p.tfbh = data.tfbh;
            geojsonLive.features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [p.longitude, p.latitude]
                },
                properties: p
            });
            // 预报点
            var forecast = p.forecast;
            for(var k = 0; k < forecast.length; k++) {
                var forcPoints = p.forecast[k]['points'];
                for (var j = 0; j < forcPoints.length; j++) {
                    var _p = forcPoints[j];
                    _p.index = i;
                    _p.typhoonLabel = data.tfbh + data.name;
                    var speed = _p.speed;
                    if(typeof speed !== 'number') speed = 0;
                    _p.speed = speed;
                    geojsonForc.features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [_p.longitude, _p.latitude]
                        },
                        properties: _p
                    });
                }
            }
        }
        var paint = {
          'circle-color': [
            'case',
            ['<', ['get', 'speed'], 10.8], 'rgba(255,255,255,1)',
            ['<', ['get', 'speed'], 17.2], '#20f634',
            ['<', ['get', 'speed'], 24.5], '#2078fd',
            ['<', ['get', 'speed'], 32.7], '#eaf232',
            ['<', ['get', 'speed'], 41.5], '#eab434',
            ['<', ['get', 'speed'], 50.1], '#e085f7',
            '#ea2a34' // 默认值
          ],
          'circle-radius': 6,
          'circle-stroke-width': 0
        };
        // 实况点
        map.addSource('points-source-live-' + data.tfbh, {
            type: 'geojson',
            data: geojsonLive
        });
        map.addLayer({
            id: 'points-layer-live-' + data.tfbh,
            type: 'circle',
            source: 'points-source-live-' + data.tfbh,
            paint: paint
        });

        // 预报点
        map.addSource('points-source-forc-' + data.tfbh, {
            type: 'geojson',
            data: geojsonForc
        });
        map.addLayer({
            id: 'points-layer-forc-' + data.tfbh,
            type: 'circle',
            source: 'points-source-forc-' + data.tfbh,
            paint: paint
        });
    },
    _addTyphoonPath(tfbh) {
        var data = that.typhoonData[tfbh].data;
        var points = data.points;
        var geojsonLive = {
            'type': 'FeatureCollection',
            'features': []
        };
        var geojsonForc = {
            'type': 'FeatureCollection',
            'features': []
        };
        // 实况
        var pts = [
            [points[0].longitude, points[0].latitude]
        ];
        for (var i = 1; i < points.length; i++) {
            var p = points[i];
            pts.push([p.longitude, p.latitude]);
            geojsonLive.features.push({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: pts.concat([])
                },
                properties: {
                    index: i,
                    type: 'live'
                }
            });
        }
        // 预报
        for (var i = 0; i < points.length; i++) {
            var _p = points[i];
            var forecast = _p.forecast;
            for(var k = 0; k < forecast.length; k++) {
                var _pts = [
                    [_p.longitude, _p.latitude]
                ];
                var _points = forecast[k]['points'];
                for (var j = 0; j < _points.length; j++) {
                    var _fp = _points[j];
                    _pts.push([_fp.longitude, _fp.latitude]);
                }
                geojsonForc.features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: _pts
                    },
                    properties: {
                        index: i,
                        type: 'forc',
                        sets: forecast[k]['sets']
                    }
                });
            }
        }
        // 实况线
        map.addSource('path-source-live-' + data.tfbh, {
            type: 'geojson',
            data: geojsonLive
        });
        map.addLayer({
            id: 'path-layer-live-' + data.tfbh,
            type: 'line',
            source: 'path-source-live-' + data.tfbh,
            paint: {
                'line-color': '#000000',
                'line-width': 3
            }
        });
        // 预报线
        map.addSource('path-source-forc-' + data.tfbh, {
            type: 'geojson',
            data: geojsonForc
        });
        var lineColor = [
            'match',
            ['get', 'sets']
        ];
        for(var key in that.lineColorDict) {
            lineColor.push(key);
            lineColor.push(that.lineColorDict[key]);
        }
        lineColor.push('rgba(0,0,0,0)');
        map.addLayer({
            id: 'path-layer-forc-' + data.tfbh,
            type: 'line',
            source: 'path-source-forc-' + data.tfbh,
            paint: {
                'line-color': lineColor,
                'line-width': 1,
                'line-dasharray': [5, 3]
            }
        });
    },
    _addTyphoonLabel(tfbh) {
        var data = that.typhoonData[tfbh].data;
        const ele = document.createElement('div');
        ele.setAttribute('class', 'typhoon-label');
        ele.innerHTML = data.tfbh + data.name;
        var r = data.points[0];
        const option = {
            element: ele,
            anchor: 'left',
            offset: [10, 0]
        };
        var label = new mapboxgl.Marker(option).setLngLat([r.longitude, r.latitude]).addTo(map);
        that.typhoonData[data.tfbh]['label'] = label;

        const eleImg = document.createElement('div');
        eleImg.setAttribute('class', 'typhoon-image');
        const icon = document.createElement('div');
        icon.setAttribute('class', 'typhoon-icon');
        eleImg.appendChild(icon);
        const optionImg = {
            element: eleImg,
            anchor: 'center',
            offset: [0, 0]
        };
        var marker = new mapboxgl.Marker(optionImg)
            .setLngLat([-180, -90])
            .addTo(map);
        that.typhoonData[data.tfbh]['marker'] = marker;
    }
};