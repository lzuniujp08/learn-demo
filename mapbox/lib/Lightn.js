var LightnMap = {
  _map: null,
  _data: [],
  _timer: 0,
  _count: 0,
  _animate: [],
  init: function(map, data) {
    const self = this;
    self._map = map;
    self._data = data;
    let canvas = document.createElement('canvas');
    canvas.id = 'windCanvas';
    canvas.width = map.getCanvas().width;
    canvas.height = map.getCanvas().height;
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    map.getCanvasContainer().appendChild(canvas);
    self._context = canvas.getContext("2d");
    self._canvas = canvas;

    var timeout = 200;
    if (self._timer) clearTimeout(self._timer);
    self._timer = setTimeout(function() {
      self._clearAndRestart();
    }, timeout);

    map.on("dragstart", function() {
      self._clear();
    });

    map.on("dragend", function() {
      if (self._timer) clearTimeout(self._timer);
      self._timer = setTimeout(function() {
        self._clearAndRestart();
      }, timeout);
    });

    map.on("zoomstart", function() {
      self._clear();
    });

    map.on("zoomend", function() {
      if (self._timer) clearTimeout(self._timer);
      self._timer = setTimeout(function() {
        self._clearAndRestart();
      }, timeout);
    });

    map.on("resize", function() {
      self._clear();
    });
  },
  _clearAndRestart: function() {
    var self = this;
    self._count = 0;
    self._clear();
    for (var i = 0; i < self._data.length; i++) {
      var d = self._data[i];
      var xy = self._map.project(d);
      var x = xy.x + self._randomNum(-50, 50);
      var y = xy.y + self._randomNum(-50, 50);
      self._light(x, y);
    }

  },
  _stop: function() {
    for (var i = 0; i < this._animate.length; i++) {
      cancelAnimationFrame(this._animate[i]);
    }
  },
  _randomNum(minNum, maxNum) {
    switch (arguments.length) {
      case 1:
        return parseInt(Math.random() * minNum + 1, 10);
        break;
      case 2:
        return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        break;
      default:
        return 0;
        break;
    }
  },
  _light: function(x, y) {
    var _x = x,
      _y = y;
    var self = this;
    var r = 0;
    self._context.beginPath();
    self._context.moveTo(x, y);

    var num = 5;
    r = this._randomNum(-num, num);
    x += r;
    var plus = this._randomNum(0, num);
    y += plus;

    self._context.lineTo(x, y);
    self._context.lineWidth = self._randomNum(1, 3);
    self._context.strokeStyle = "rgba(255, 255, 255, 0.2)";
    self._context.stroke();
    self._context.closePath();
    self._count++;
    var num = self._randomNum(60, 200);
    if (self._count > self._data.length * num) {
      self._clearAndRestart();

    }
    var animate = requestAnimationFrame(function() {
      self._light(x, y);
    });
    self._animate.push(animate);
  },
  _clear: function() {
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    this._stop();
  },
  destory: function() {
    this._clearWind();
    this._canvas.parentNode.removeChild(this._canvas);
  }
}
