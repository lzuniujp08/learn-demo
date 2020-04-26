window.requestAnimationFrame = function () {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (a) {
        window.setTimeout(a, 1E3 / 60)
      }
}();

//火焰粒子对象效果
function FireBall(position, ctx, map) {
  this._pos = position;
  this._ctx = ctx;
  this._map = map;
  this.rest();
}
FireBall.prototype.rand = function(min, max) {
  return Math.floor((Math.random() * (max - min + 1)) + min);
};
//初始/重置粒子状态
FireBall.prototype.rest = function () {
  var zoom = this._map.getZoom();
  zoom = zoom > 14 ? 14 : zoom;
  var r = this.rand(zoom / 2, zoom);
  this._radius = r;
  this._position = Object.assign({}, this._pos);
  this._lineWidth = 1;//粒子边界线宽
  this._color = 'rgba(255, 5, 0, 0.3)';//粒子颜色
};
//渲染
FireBall.prototype.render = function(){
  this._ctx.beginPath();
  this._ctx.arc(this._position.x, this._position.y, this._radius, 0, Math.PI * 2, false);
  this._ctx.fillStyle = this._ctx.strokeStyle = this._color;
  this._ctx.lineWidth = this._lineWidth;
  this._ctx.fill();
  this._ctx.stroke();
};
// 更新粒子状态
FireBall.prototype.update = function () {
  if(this._radius > 0 && this._position.y > this._radius){
    this._position.x -= this.rand(-3, 3);
    this._position.y -= this.rand(3, 4);
    this._radius -= 0.5;
  } else {
    this.rest();
  }
};

var FireMap = {
  _map: null,
  _data: [],
  _canvas: null,
  _context: null,
  _fires: [],
  _timer: 0,
  _animation: null,
  init: function(map, data) {
    const self = this;
    self._map = map;
    self._data = data;
    let canvas = document.createElement('canvas');
    canvas.id = 'lightCanvas';
    canvas.width = map.getCanvas().width;
    canvas.height = map.getCanvas().height;
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    map.getCanvasContainer().appendChild(canvas);
    self._context = canvas.getContext("2d");
    self._canvas = canvas;

    self._clearAndRestart();
    self._addMapEvt();
  },
  _addMapEvt: function() {
    var self = this;
    self._map.on("dragstart", function() {
      self._clear();
    });
    self._map.on("dragend", function() {
      self._clearAndRestart();
    });
    self._map.on("zoomstart", function() {
      self._clear();
    });
    self._map.on("zoomend", function() {
      self._clearAndRestart();
    });
  },
  _Animate: function() {
    var self = this;
    //覆盖上一帧图像
    self._context.globalCompositeOperation="destination-out";
    self._context.fillStyle = 'hsla(0, 0%, 0%, 0.2)';
    self._context.fillRect(0, 0, self._canvas.width, self._canvas.height);
    self._context.globalCompositeOperation = 'lighter';
    self._animation = window.requestAnimationFrame(function() {
      self._Animate();
    });
    for (var i = 0; i < this._fires.length; i++) {
      var fires = this._fires[i];
      fires.forEach(fire => {
        fire.render();
        fire.update();
      })
    }
  },
  _clearAndRestart: function() {
    var self = this;
    self._clear();
    // 初始化雷电数据
    self._fires = [];
    for (var i = 0; i < self._data.length; i++) {
      var d = self._data[i];
      var xy = self._map.project(d);
      var x = xy.x;
      var y = xy.y;
      let fires = [];
      for(var j = 0; j < 100; j++){
        fires.push(new FireBall({x: x, y: y}, this._context, this._map))
      }
      self._fires.push(fires)
    }
    self._timer = setTimeout(function () {
      self._Animate();
    }, 300);

  },
  _clear: function() {
    const self = this;
    self._context.clearRect(0, 0, self._canvas.width, self._canvas.height);
    if (self._animation) cancelAnimationFrame(self._animation);
    if (self._timer) clearTimeout(self._timer);
  },
  destory: function() {
    this._clear();
    this._canvas.parentNode.removeChild(this._canvas);
  }
};
