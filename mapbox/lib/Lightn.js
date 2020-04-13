class Lightning {

  constructor(c) {
    this.config = c;
  }

  Cast(context, from, to, map) {
    if (!from || !to) {
      return;
    }
    //Main vector
    var v = new Vector(from.X1, from.Y1, to.X1, to.Y1);
    //skip cas if not close enough
    if (this.config.Threshold && v.Length() > context.canvas.width * this.config.Threshold) {
      return;
    }
    var vLen = v.Length();
    var refv = from;
    var lR = (vLen / context.canvas.width)
    //count of segemnets
    var segments = Math.floor(this.config.Segments * lR);
    //lenth of each
    var l = vLen / segments;

    var zoom = map.getZoom();
    if(zoom > 6) {
      for (let i = 1; i <= segments; i++) {
        //position in the main vector
        var dv = v.Multiply((1 / segments) * i);

        //add position noise
        if (i != segments) {
          dv.Y1 += l * Math.random() * 1;
          dv.X1 += l * Math.random() * 1;
        }
        //new vector for segment
        var r = new Vector(refv.X1, refv.Y1, dv.X1, dv.Y1);

        //background blur
        this.Line(context, r, {
          Color: this.config.GlowColor,
          With: this.config.GlowWidth * lR,
          Blur: this.config.GlowBlur * lR,
          BlurColor: this.config.GlowColor,
          Alpha: this.Random(this.config.GlowAlpha, this.config.GlowAlpha * 2) / 100
        });

        //main line
        this.Line(context, r, {
          Color: this.config.Color,
          With: this.config.Width,
          Blur: this.config.Blur,
          BlurColor: this.config.BlurColor,
          Alpha: this.config.Alpha
        });
        refv = r;
      }
    } else {
      this.Circle(context, to, lR);
    }
  }

  Line(context, v, c) {
    context.beginPath();
    context.strokeStyle = c.Color;
    context.lineWidth = c.With;
    context.moveTo(v.X, v.Y);
    context.lineTo(v.X1, v.Y1);
    context.globalAlpha = c.Alpha;
    context.shadowBlur = c.Blur;
    context.shadowColor = c.BlurColor;
    context.stroke();
  }

  Circle(context, p, lR) {
    context.beginPath();
    context.arc(
      p.X1 + Math.random() * 10 * lR,
      p.Y1 + Math.random() * 10 * lR,
      3,
      0,
      2 * Math.PI, false
    );
    context.fillStyle = 'white';
    context.shadowBlur = 100;
    context.shadowColor = "#2319FF";
    context.fill();
  }

  Random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

class Vector {
  constructor(x, y, x1, y1) {
    this.X = x;
    this.Y = y;
    this.X1 = x1;
    this.Y1 = y1;
  }

  dX() {
    return this.X1 - this.X;
  }
  dY() {
    return this.Y1 - this.Y;
  }
  Normalized() {
    var l = this.Length();
    return new Vector(this.X, this.Y, this.X + (this.dX() / l), this.Y + (this.dY() / l));
  }

  Length() {
    return Math.sqrt(Math.pow(this.dX(), 2) + Math.pow(this.dY(), 2));
  }

  Multiply(n) {
    return new Vector(this.X, this.Y, this.X + this.dX() * n, this.Y + this.dY() * n);
  }

  Clone() {
    return new Vector(this.x, this.y, this.X1, this.Y1);
  }
}

var LightnMap = {
  _map: null,
  _data: [],
  _canvas: null,
  _context: null,
  _options: {
    Alpha: "0.5",
    Blur: "5",
    BlurColor: "white",
    Color: "white",
    GlowAlpha: "30",
    GlowBlur: "10",
    GlowColor: "#ffe011",
    GlowWidth: "100",
    Segments: "400",
    Threshold: "0.5",
    Width: "3"
  },
  _lts: [],
  _animation: null,
  _timer: 0,
  _timer1: 0,
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

    map.on("dragstart", function() {
      self._clear();
    });

    map.on("dragend", function() {
      self._clearAndRestart();
    });

    map.on("zoomstart", function() {
      self._clear();
    });

    map.on("zoomend", function() {
      self._clearAndRestart();
    });
  },
  _getPoints: function(x, y, size) {
    var self = this;
    points = [];
    var num = self._randomNum(1, 3);
    for (var i = 0; i < num; i++) {
      points.push(new Vector(
        x + self._randomNum(-size, size),
        y + self._randomNum(-size, size),
        x + self._randomNum(-size, size),
        y + self._randomNum(-size, size)));
    }
    return points;
  },
  _clearAndRestart: function() {
    var self = this;
    self._clear();
    // 初始化雷电数据
    self._lts = [];
    for (var i = 0; i < self._data.length; i++) {
      var d = self._data[i];
      var xy = self._map.project(d);
      // var x = xy.x + self._randomNum(-50, 50) ;
      // var y = xy.y + self._randomNum(-50, 50);
      var x = xy.x;
      var y = xy.y;
      var size = self._randomNum(25, 50);
      var lt = {
        lt: new Lightning(self._options),
        x: x,
        y: y,
        size: size
      };
      self._lts.push(lt);
    }
    self._animation = window.requestAnimationFrame(function() {
      self._Animate();
    });
  },
  _Animate() {
    var self = this;
    self._clear();
    var num = self._data.length / 2;
    var idxs = [];
    for (var i = 0; i < num; i++) {
      var _idx = self._randomNum(1, self._data.length - 1);
      if(idxs.indexOf(_idx) === -1) {
        var lt = self._lts[_idx];
        var x = lt.x;
        var y = lt.y;
        var size = lt.size;
        var points = self._getPoints(x, y, size);
        var target = new Vector(
          x - size,
          y - size,
          x + self._randomNum(-10, 10),
          y + self._randomNum(-10, 10)
        );
        points.forEach(p => {
          lt.lt.Cast(self._context, p, target, self._map);
        });
      }
      idxs.push(_idx);
    }
    if (self._timer) clearTimeout(self._timer);
    if (self._timer1) clearTimeout(self._timer1);
    var t = 150;
    self._timer = setTimeout(() => {
      self._timer1 = setTimeout(function() {
        self._Animate();
      }, t);
    }, t);
  },
  _randomNum(minNum, maxNum) {
    switch (arguments.length) {
      case 1:
        return parseInt(Math.random() * minNum + 1, 10);
      case 2:
        return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
      default:
        return 0;
    }
  },
  _clear: function() {
    const self = this;
    self._context.clearRect(0, 0, self._canvas.width, self._canvas.height);
    if (self._animation) cancelAnimationFrame(self._animation);
    if (self._timer) clearTimeout(self._timer);
    if (self._timer1) clearTimeout(self._timer1);
  },
  destory: function() {
    this._canvas.parentNode.removeChild(this._canvas);
  }
};
