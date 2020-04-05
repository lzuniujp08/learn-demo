var that;
var app = new Vue({
  el: '#app',
  data: {
    timeline: null,
    autoplay: false,
    interval: 800,
    currIndex: 0
  },
  mounted() {
    that = this;
    that.init();
  },
  methods: {
    init() {
      var that = this;
      $.get("../data/timeline.json", function (res) {
        console.log(res);
        that.timeline = $("#timeline").timeline({
          domid: "timeline",
          times: res,
          isDate: false,
          autoplay: that.autoplay,
          interval: that.interval,
          currIndex: that.currIndex,
          timeChangeEvt: function (time) {
            that._timeChangeEvt(time)
          },
          dayChangeEvt: function (date) {
            that._dateChangeEvt(date);
          }
        })
      })
    },
    _timeChangeEvt(time) {
      console.log(time);
    },
    _dateChangeEvt(date) {
      console.log(date);
    }
  }
});
