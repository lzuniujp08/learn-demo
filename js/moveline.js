var that, map;

var app = new Vue({
  el: '#app',
  data: {
    dv: null,
    x: 0,
    y: 0,
    l: 0,
    t: 0,
    isDown: false,
    trackPos: {
      l: -10,
      r: 0
    }
  },
  mounted:function() {
    that = this;
    that.init();
  },
  methods: {
    init:function() {
      const trackDiv = document.getElementById('trackDiv');
      that.trackPos.r = trackDiv.offsetWidth - 10;

      that.dv = document.getElementById('dragDiv');
      //鼠标移动
      window.onmousemove = function(e) {
        e.stopPropagation();
        if (that.isDown === false) return;
        var nx = e.clientX;
        var nl = nx - (that.x - that.l);
        if (nl >= that.trackPos.r) nl = that.trackPos.r;
        if (nl <= that.trackPos.l) nl = that.trackPos.l;
        that.dv.style.left = nl + 'px';
      }

      window.onmouseup = that.endDrag;
    },
    trackClick: function(e) {
      const trackDiv = document.getElementById('trackDiv');
      const left = e.clientX - trackDiv.offsetLeft - 10;
      that.dv.style.left = left + 'px';
      e.stopPropagation();
    },
    startDrag: function(e) {
      //获取x坐标和y坐标
      that.x = e.clientX;
      that.y = e.clientY;
      //获取左部和顶部的偏移量
      that.l = that.dv.offsetLeft;
      that.t = that.dv.offsetTop;
      //开关打开
      that.isDown = true;
      //设置样式
      that.dv.style.cursor = 'move';
      e.stopPropagation();
    },
    endDrag: function(e) {
      that.isDown = false;
      that.dv.style.cursor = 'default';
      e.stopPropagation();
    }
  }
});
