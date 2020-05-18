var meteoLayer = {
    index: 0,
    timer: 0,
    _opacity: 0.8,
    _colorScale: {
        colors: [
            "rgba(255,255,255,0)",
            "rgba(0,204,0,255)",
            "rgba(204,255,204,255)",
            "rgba(255,255,0,255)",
            "rgba(255,204,0,255)",
            "rgba(255,153,0,255)",
            "rgba(255,102,0,255)",
            "rgba(255,0,0,255)",
            "rgba(204,0,0,255)",
            "rgba(153,0,0,255)",
            "rgba(102,0,0,255)",
            "rgba(255,153,255,255)",
            "rgba(204,102,255,255)",
            "rgba(204,0,255,255)",
            "rgba(153,0,153,255)",
            "rgba(255,0,255,255)"
        ],
        positions: [
            0, 0.0625, 0.125, 0.1875, 0.25,
            0.3125, 0.375, 0.4375, 0.5, 0.5625,
            0.625, 0.6875, 0.75, 0.8125, 0.875,
            1
        ]
    },
    utils: {
        unique(arr) {
            if (!Array.isArray(arr)) {
                return;
            }
            var array = [];
            for (var i = 0; i < arr.length; i++) {
                if (array.indexOf(arr[i]) === -1) {
                    array.push(arr[i]);
                }
            }
            return array;
        },
        scaleMatrix(matrix, scaleX, scaleY) {
            matrix[0] *= scaleX;
            matrix[1] *= scaleX;
            matrix[2] *= scaleX;
            matrix[3] *= scaleX;
            matrix[4] *= scaleY;
            matrix[5] *= scaleY;
            matrix[6] *= scaleY;
            matrix[7] *= scaleY;
        },
        translateMatrix(matrix, tx, ty) {
            matrix[12] += matrix[0] * tx + matrix[4] * ty;
            matrix[13] += matrix[1] * tx + matrix[5] * ty;
            matrix[14] += matrix[2] * tx + matrix[6] * ty;
            matrix[15] += matrix[3] * tx + matrix[7] * ty;
        },
    },
    _canvas: null,
    _gl: null,
    _range: [0, 20],
    _maxValue: 20,
    _minValue: 0,
    _bounds: null,
    _pixelsToWebGLMatrix : new Float32Array(16),
    _pixelOrigin: null,
    play() {
        that.timer = setInterval(function () {
            that.index ++;
            if(that.index === 72) that.index = 0;
            that._fetchData();
        }, 1000)
    },
    pause() {
        window.clearInterval(that.timer);
    },
    clear() {
        // var source = map.getSource('canvas-source');
        // if(source) {
        //     map.removeLayer('canvas-layer');
        //     map.removeSource('canvas-source');
        // }
        this._canvas.style.display = 'none';
    },
    initLayer() {
        var _lonlatOrigin = map.getBounds().getNorthWest();
        this._pixelOrigin = this._mapProject( _lonlatOrigin.lat, _lonlatOrigin.lng);
        var canvas = document.createElement('canvas');
        canvas.style.position = "absolute";
        canvas.style.zIndex = 99;
        canvas.setAttribute('id', 'canvas-layer');
        map.getCanvasContainer().appendChild(canvas);
        canvas.width = map.getCanvas().width;
        canvas.height = map.getCanvas().height;
        webgl = canvas.getContext("webgl", { antialias: true });
        this._gl = webgl;
        this._canvas = canvas;
        this._createShaderProgram();
        this._bindTexturePalette();
        this._initHandlers();
        this._fetchData();
    },
    _createShaderProgram() {
        var vertexShaderSource = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      uniform mat4 map_matrix;
      varying vec2 v_texCoord;
      void main(void) {
        gl_Position = map_matrix * a_position;
      	v_texCoord = a_texCoord;
      }
    `;

        var fragmentShaderSource = `
      precision highp float;
      uniform float maxValue;
      uniform float minValue;
      uniform sampler2D u_textureData;
      uniform sampler2D u_texturePalette;
      uniform vec4 uBounds;
      uniform vec4 uLngLatBounds;
      uniform float uScale;
      uniform float uTextureSize;

      uniform float opacity;
      uniform vec2 range;

      varying vec2 v_texCoord;

      const float PI = 3.141592653589793;
      const float R = 6378137.0;
      const float transform =  0.5 / (PI * R);

      float c_onePixel = 1.0 / uTextureSize;
      float c_twoPixels = 2.0 / uTextureSize;

      float CubicHermite(float A, float B, float C, float D, float t) {
        float a = -A * 0.5 + (3.0 * B) * 0.5 - (3.0 * C) * 0.5 + D * 0.5;
        float b = A - (5.0 * B) * 0.5 + 2.0 * C - D * 0.5;
        float c = -A * 0.5 + C * 0.5;
        float d = B;
        return a * t * t * t + b * t * t + c * t + d;
      }

      vec4 getColor(float value){
        vec3 rgb = texture2D(u_texturePalette, vec2(value, 0)).rgb;
        return vec4(rgb, opacity);
      }

      float getActualValue(float value){
        return value * (maxValue - minValue) + minValue;
      }

      vec2 unproject(vec2 point) {
        float d = 180.0 / PI;
        return vec2((point.x * d) / R, abs(2.0 * atan(exp(point.y / R)) - PI / 2.0 ) * d );
      }

      vec2 getPxLngLat() {
        vec2 point = v_texCoord * (uBounds.zw - uBounds.xy) + uBounds.xy;
        vec2 lngLat = unproject((point / uScale- 0.5) / transform);
        return lngLat;
      }

      float BicubicHermiteTextureSample(vec2 P) {
        vec2 pixel = P * uTextureSize + 0.5;

        vec2 frac = fract(pixel);
        pixel = floor(pixel) / uTextureSize - vec2(c_onePixel / 2.0);

        vec3 C00 = texture2D(u_textureData, pixel + vec2(-c_onePixel, -c_onePixel)).rgb;
        vec3 C10 = texture2D(u_textureData, pixel + vec2(0.0, -c_onePixel)).rgb;
        vec3 C20 = texture2D(u_textureData, pixel + vec2(c_onePixel, -c_onePixel)).rgb;
        vec3 C30 = texture2D(u_textureData, pixel + vec2(c_twoPixels, -c_onePixel)).rgb;

        vec3 C01 = texture2D(u_textureData, pixel + vec2(-c_onePixel, 0.0)).rgb;
        vec3 C11 = texture2D(u_textureData, pixel + vec2(0.0, 0.0)).rgb;
        vec3 C21 = texture2D(u_textureData, pixel + vec2(c_onePixel, 0.0)).rgb;
        vec3 C31 = texture2D(u_textureData, pixel + vec2(c_twoPixels, 0.0)).rgb;

        vec3 C02 = texture2D(u_textureData, pixel + vec2(-c_onePixel, c_onePixel)).rgb;
        vec3 C12 = texture2D(u_textureData, pixel + vec2(0.0, c_onePixel)).rgb;
        vec3 C22 = texture2D(u_textureData, pixel + vec2(c_onePixel, c_onePixel)).rgb;
        vec3 C32 = texture2D(u_textureData, pixel + vec2(c_twoPixels, c_onePixel)).rgb;

        vec3 C03 = texture2D(u_textureData, pixel + vec2(-c_onePixel, c_twoPixels)).rgb;
        vec3 C13 = texture2D(u_textureData, pixel + vec2(0.0, c_twoPixels)).rgb;
        vec3 C23 = texture2D(u_textureData, pixel + vec2(c_onePixel, c_twoPixels)).rgb;
        vec3 C33 = texture2D(u_textureData, pixel + vec2(c_twoPixels, c_twoPixels)).rgb;

        float CP0X = CubicHermite(C00.r, C10.r, C20.r, C30.r, frac.x);
        float CP1X = CubicHermite(C01.r, C11.r, C21.r, C31.r, frac.x);
        float CP2X = CubicHermite(C02.r, C12.r, C22.r, C32.r, frac.x);
        float CP3X = CubicHermite(C03.r, C13.r, C23.r, C33.r, frac.x);

        return CubicHermite(CP0X, CP1X, CP2X, CP3X, frac.y);
      }

      void main() {
        vec2 size = uLngLatBounds.zw - uLngLatBounds.xy;
        vec2 pxLngLat = getPxLngLat();
        vec2 offset = (pxLngLat - uLngLatBounds.xy);
        vec2 position = offset / size;
        if (offset.x < 0. || offset.y < 0. || offset.x > size.x || offset.y > size.y) {
          gl_FragColor = vec4(1.0, 1.0, 0, 0.0);
        } else {
          float value = BicubicHermiteTextureSample(position);
          float actualValue = getActualValue(value);
          if ( actualValue < range.x || value == 0. || actualValue > range.y){
            gl_FragColor = vec4(0., 0., 0., 0);
          } else {
            gl_FragColor = getColor(value);
          }
        }
      }
    `;
        var gl = this._gl;
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        var program = gl.createProgram();
        this._program = program;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
    },
    _bindTexturePalette: function () {
        var that = this;
        var gl = this._gl;
        var paletteCanvas = document.createElement("canvas");
        paletteCanvas.width = 256;
        paletteCanvas.height = 1;
        var ctx = paletteCanvas.getContext("2d");
        var gradient = ctx.createLinearGradient(0, 0, 256, 1);
        for (var i = 0; i < that._colorScale.colors.length; ++i) {
            gradient.addColorStop(
                Math.min(that._colorScale.positions[i], 1),
                that._colorScale.colors[i]
            );
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 1);
        var paletteLocation = gl.getUniformLocation(
            this._program,
            "u_texturePalette"
        );
        var paletteTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            paletteCanvas
        );
        gl.uniform1i(paletteLocation, 1);
    },
    _getNewPixelOrigin() {
        var that = this;
        var wHalf = map.getCanvas().width / 2;
        var hHalf = map.getCanvas().height / 2;
        var center = map.getCenter();
        var pos = that._mapProject(center.lat, center.lng);
        that._pixelOrigin = {
            x: pos.x - wHalf,
            y: pos.y - hHalf
        };
    },
    _initHandlers() {
        var that = this;
        map.on("dragend", function() {
            that._getNewPixelOrigin();
            that._fetchData();
        });
        map.on("zoomend", function() {
            that._getNewPixelOrigin();
            that._fetchData();
        });
        map.on("dragstart", function() {
            that.clear();
        });
        map.on("zoomstart", function() {
            that.clear();
        });
    },
    _fetchData() {
        var that = this;
        that._canvas.style.display = "block";
        // var url = 'http://192.168.100.12:20010/carouse/test';
        var extent = map.getBounds();
        var params = {
            "idx": this.index,
            "z": map.getZoom(),
            "varId":"WS",
            "varDim":"0",
            "latMax": extent._ne.lat,
            "lonMax": extent._ne.lng,
            "latMin": extent._sw.lat,
            "lonMin": extent._sw.lng,
            "dsId":"nfdw"
        };
        var url = '../data/tem1.json';
        $.ajax({
            type:"POST",
            url : url,
            data: JSON.stringify(params),
            dataType: 'json',
            contentType: 'application/json;charset=utf-8',
            async: false,
            success : function(res){
                var dbData = res.data;
                var header = res.header;
                var lonMin = header.lo1, lonMax = header.lo2,
                    latMin = header.la1,latMax = header.la2,
                    max = header.max, min = header.min;
                var width = dbData[0].length;
                var height = dbData.length;

                that._range = [min, max];
                that._maxValue = max;
                that._minValue = min;
                that._bounds = [
                    [lonMin, latMin],
                    [lonMax, latMax]
                ];

                that._prepareParameter();
                that._data2GrayTexture(dbData, height, width, max, min);
            }
        });
    },
    _prepareParameter() {
        var gl = this._gl;
        var program = this._program;
        var zoom = map.getZoom();
        var texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0]),
            gl.STATIC_DRAW
        );
        var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        var opacityLocation = gl.getUniformLocation(program, "opacity");
        gl.uniform1f(opacityLocation, this._opacity);
        var minLocation = gl.getUniformLocation(program, "minValue");
        gl.uniform1f(minLocation, this._minValue);
        var maxLocation = gl.getUniformLocation(program, "maxValue");
        gl.uniform1f(maxLocation, this._maxValue);
        var pointSW = this._mapProject(this._bounds[0][0], this._bounds[0][1]);
        var pointNE = this._mapProject(this._bounds[1][0], this._bounds[1][1]);
        var boundsLocation = gl.getUniformLocation(program, "uBounds");
        gl.uniform4f(boundsLocation, pointSW.x, pointNE.y, pointNE.x, pointSW.y);
        var uboundsLocation = gl.getUniformLocation(program, "uLngLatBounds");
        gl.uniform4f(
            uboundsLocation,
            this._bounds[0][0],
            this._bounds[0][1],
            this._bounds[1][0],
            this._bounds[1][1],
        );
        var scaleLocation = gl.getUniformLocation(program, "uScale");
        var scale = 256 * Math.pow(2, zoom);
        gl.uniform1f(scaleLocation, scale);
        var rangeLocation = gl.getUniformLocation(program, "range");
        gl.uniform2f(rangeLocation, this._range[0], this._range[1]);
    },
    _data2GrayTexture(dbData, height, width, max, min) {
        var dataArr = [];
        for (var y = height - 1; y >= 0; y--) {
            for (var x = 0; x < width; x++) {
                var value = dbData[y][x];
                var colorValue = ((value - min) * 255) / (max - min);
                var r = (g = b = parseInt(colorValue));
                dataArr.push(r);
                dataArr.push(g);
                dataArr.push(b);
                dataArr.push(value === -99 ? 0 : 255);
            }
        }
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        var iamgeData = new ImageData(
            new Uint8ClampedArray(dataArr),
            width,
            height
        );
        ctx.putImageData(iamgeData, 0, 0);
        this._setParamByData(canvas, width, height);
    },
    _setParamByData(canvas, width, height) {
        this.image = canvas;
        var resLocation = this._gl.getUniformLocation(
            this._program,
            "uTextureSize"
        );
        this._gl.uniform1f(resLocation, width * height);
        this.resolution = width * height;
        this._resize();
        this._render();
    },
    _resize() {
        this._canvas.width = map.getCanvas().width;
        this._canvas.height = map.getCanvas().height;

        var width = this._canvas.width;
        var height = this._canvas.height;
        this._gl.viewport(0, 0, width, height);
        this._pixelsToWebGLMatrix.set([
            2 / width,
            0,
            0,
            0,
            0,
            -2 / height,
            0,
            0,
            0,
            0,
            0,
            0,
            -1,
            1,
            0,
            1,
        ]);
        this._enablePositionVertex();
        this._bindDataTexture();
    },
    _enablePositionVertex() {
        var gl = this._gl;
        var program = this._program;
        var bounds = this._bounds;
        var minX = bounds[0][0];
        var maxX = bounds[1][0];
        var minY = bounds[0][1];
        var maxY = bounds[1][1];
        var point1 = this._lngLatToPixel(maxX, minY, 0);
        var point2 = this._lngLatToPixel(maxX, maxY, 0);
        var point3 = this._lngLatToPixel(minX, minY, 0);
        var point4 = this._lngLatToPixel(minX, maxY, 0);
        var positionArrayBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionArrayBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                point1.x,
                point1.y,
                point2.x,
                point2.y,
                point3.x,
                point3.y,
                point4.x,
                point4.y,
            ]),
            gl.STATIC_DRAW
        );
        var positionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    },
    _bindDataTexture() {
        var gl = this._gl;
        var program = this._program;
        var dataLocation = gl.getUniformLocation(program, "u_textureData");
        var texture = gl.createTexture();
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this.image
        );
        gl.uniform1i(dataLocation, 0);
    },
    _render() {
        var that = this;
        var gl = this._gl;
        var program = this._program;
        var northWest = map.getBounds().getNorthWest();
        var offset = that._lngLatToPixel(northWest.lng, northWest.lat, 0);
        var pos = that._latLngToLayerPoint(northWest.lat, northWest.lng);
        that._canvas.style.top = pos.y + 'px';
        that._canvas.style.left = pos.x + 'px';
        gl.clear(gl.COLOR_BUFFER_BIT);
        var mapMatrix = new Float32Array(16);
        mapMatrix.set(this._pixelsToWebGLMatrix);
        var zoom = Math.ceil(map.getZoom());
        var scale = Math.pow(2, zoom);
        this.utils.scaleMatrix(mapMatrix, scale, scale);
        this.utils.translateMatrix(mapMatrix, -offset.x, -offset.y);
        var matrixLoc = gl.getUniformLocation(program, "map_matrix");
        gl.uniformMatrix4fv(matrixLoc, false, mapMatrix);
    },
    _latLngToLayerPoint(lat, lng) {
        var projectedPoint = this._mapProject(lat, lng);
        var aaa = this._pixelOrigin;
        return {
            x: Math.floor(projectedPoint.x - aaa.x),
            y: Math.floor(projectedPoint.y - aaa.y)
        };
    },
    _mapProject(lat, lng, zoom) {
        zoom = typeof zoom === 'number' ? zoom : Math.ceil(map.getZoom());
        var point = {};
        var _scale = 0.5 / (Math.PI * 6378137);
        var _a = _scale, _b = 0.5, _c = -_scale, _d = 0.5;
        var scale = 256 * Math.pow(2, zoom);
        var projectedPoint = proj4(proj4('EPSG:4326'), proj4('EPSG:3857'), [lng, lat]);
        point.x = Math.round(scale * (_a * projectedPoint[0] + _b));
        point.y = Math.round(scale * (_c * projectedPoint[1] + _d));
        return point;
    },
    _lngLatToPixel(lng, lat) {
        return this._mapProject(lat, lng, 0);
    }
 };