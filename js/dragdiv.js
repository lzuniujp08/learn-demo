var that, map;

var app = new Vue({
  el: '#app',
  data: {
    dv: null,
    x: 0,
    y: 0,
    l: 0,
    t: 0,
    isDown: false
  },
  mounted() {
    that = this;
    that.init();
  },
  methods: {
    init() {
      that.dv = document.getElementById('dragPanel');
      //鼠标移动
      window.onmousemove = function(e) {
        if (that.isDown === false) return;
        //获取x和y
        var nx = e.clientX;
        var ny = e.clientY;
        //计算移动后的左偏移量和顶部的偏移量
        var nl = nx - (that.x - that.l);
        var nt = ny - (that.y - that.t);
        that.dv.style.left = nl + 'px';
        that.dv.style.top = nt + 'px';
      }
    },
    startDrag(e) {
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
    },
    endDrag(e) {
      //开关关闭
      that.isDown = false;
      that.dv.style.cursor = 'default';
    }
  }
});
