var myClusterLayer = function (options) {
    var self = this;
    var defaults = {
        map: null,
        clusterField: "",
        zooms: [4, 8, 12],
        distance: 256,
        data: [],
        style: null
    };

    //将default和options合并
    self.options = $.extend({}, defaults, options);

    self.proj = self.options.map.getView().getProjection();

    self.vectorSource = new ol.source.Vector({
        features: []
    });
    self.vectorLayer = new ol.layer.Vector({
        source: self.vectorSource,
        style:self.options.style
    });

    self.clusterData = [];

    self._clusterTest = function (data, dataCluster) {
        var _flag = false;

        var _cField = self.options.clusterField;
        if(_cField!=""){
            _flag = data[_cField] === dataCluster[_cField];
        }else{
            var _dataCoord = self._getCoordinate(data.lon, data.lat),
                _cdataCoord = self._getCoordinate(dataCluster.lon, dataCluster.lat);
            var _dataScrCoord = self.options.map.getPixelFromCoordinate(_dataCoord),
                _cdataScrCoord = self.options.map.getPixelFromCoordinate(_cdataCoord);

            var _distance = Math.sqrt(
                Math.pow((_dataScrCoord[0] - _cdataScrCoord[0]), 2) +
                Math.pow((_dataScrCoord[1] - _cdataScrCoord[1]), 2)
            );
            _flag = _distance<=self.options.distance;
        }

        var _zoom = self.options.map.getView().getZoom(),
            _maxZoom = self.options.zooms[self.options.zooms.length - 1];
        if(_zoom>_maxZoom) _flag = false;
        return _flag;
    };

    self._getCoordinate = function (lon, lat) {
        return ol.proj.transform([parseFloat(lon), parseFloat(lat)],
            "EPSG:4326",
            self.proj
        );
    };

    self._add2CluserData = function (index, data) {
        self.clusterData[index].cluster.push(data);
    };

    self._clusterCreate = function (data) {
        self.clusterData.push({
            data: data,
            cluster: []
        });
    };

    self._showCluster = function () {
        self.vectorSource.clear();
        var _features = [];
        for(var i=0,len=self.clusterData.length;i<len;i++){
            var _cdata = self.clusterData[i];
            var _coord = self._getCoordinate(_cdata.data.lon, _cdata.data.lat);
            var _feature = new ol.Feature({
                geometry: new ol.geom.Point(_coord),
                attribute: _cdata
            });
            if(_cdata.cluster.length===0) _feature.attr = _feature.data;
            _features.push(_feature);
        }
        self.vectorSource.addFeatures(_features);
    };

    self._clusterFeatures = function () {
        self.clusterData = [];
        var _viewExtent = self.options.map.getView().calculateExtent();
        var _viewGeom = new ol.geom.Polygon.fromExtent(_viewExtent);
        for(var i=0, ilen=self.options.data.length;i<ilen;i++) {
            var _data = self.options.data[i];
            var _coord = self._getCoordinate(_data.lon, _data.lat);
            if(_viewGeom.intersectsCoordinate(_coord)) {
                var _clustered = false;
                for (var j = 0, jlen = self.clusterData.length; j < jlen; j++) {
                    var _cdata = self.clusterData[j];
                    if (self._clusterTest(_data, _cdata.data)) {
                        self._add2CluserData(j, _data);
                        _clustered = true;
                        break;
                    }
                }

                if (!_clustered) {
                    self._clusterCreate(_data);
                }
            }
        }

        self.vectorSource.clear();
        self._showCluster();
    };

    self.init = function () {
        self._clusterFeatures();
        self.options.map.on("moveend", function () {
            self._clusterFeatures();
        });
    };
    self.init();

    return self.vectorLayer;
};
