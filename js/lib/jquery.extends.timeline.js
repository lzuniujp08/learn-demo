(function ($) {

    /**
     * 时间格式化
     */
    Date.prototype.format = function (fmt) {
        var o = {
            "M+": this.getMonth() + 1,                 //月份
            "d+": this.getDate(),                    //日
            "h+": this.getHours(),                   //小时
            "m+": this.getMinutes(),                 //分
            "s+": this.getSeconds(),                 //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds()             //毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    };
    $.fn.timeline = function (options) {
        var scope = this;

        var playImg = null;

        scope.dom = $("#" + options.domid).addClass("u-timeline").html("").show();

        var defaults = {
            times: [],
            maxDate: "2099-12-31",
            minDate: "1099-01-01",
            isDate: true,
            isBtns: false,
            autoplay: true,
            interval: 800,
            isPlay: true,
            currentTime: null,
            currentTimeLabel: null,
            currIndex: 0,
            callback: function (time) {

            }
        };

        scope.times = options.times;

        var _interval = 0, _currIndex = options.currIndex;

        //将default和options合并
        scope.options = $.extend({}, defaults, options);

        /**
         * convert 12 date to normal date format
         * e.g: new Date('2017-07-01 00:00')
         * @param time
         * @returns {Date}
         * @private
         */
        function _timeFormat(time) {
            var _t = time.substring(0, 4) + "-" + time.substring(4, 6) + "-" + time.substring(6, 8) + " " +
                time.substring(8, 10) + ":" + time.substring(10, 12);
            return new Date(_t);
        }

        /**
         * date change trigger
         * @param date
         * @private
         */
        function _dayChangeEvent(date) {
            //外部定义了日期改变的事件
            if (scope.options.dayChangeEvt) {
                scope.options.dayChangeEvt(date);
            }
        }

        /**
         * 播放和暂停事件
         * @private
         */
        function _play() {
            if (scope.times.length > 0) {
                //外部定义了时间改变的事件
                if (scope.options.timeChangeEvt) {
                    var _time = scope.times[_currIndex];
                    scope.options.timeChangeEvt(_time);
                }
                scope.isPlay = true;
                scope.currentTime = scope.times[_currIndex].time ? scope.times[_currIndex].time : _currIndex
                scope.currentTimeLabel = scope.times[_currIndex].label ? scope.times[_currIndex].label : _currIndex
            }
        }

        function _stop() {
            // $(".showName").html('').hide();
            window.clearInterval(_interval);
            _interval = 0;
            scope.isPlay = false;
        }

        function _setInterval() {
            _interval = window.setTimeout(function () {
                _currIndex++;
                scope._slider.slider("value", _currIndex);
                playImg = new Image();
                playImg.src = scope.times[_currIndex].url;
                playImg.onload = function () {
                    _setInterval();
                };
                if (_currIndex === scope.times.length - 1) {
                    _currIndex = -1;
                }
            }, scope.options.interval);

        }

        function _updateTimes() {
            //重置初始化状态
            //window.as.AppConfig.asEmitter.emit("stopTimeline");
            var _currDate = new Date(Date.parse(scope._datepicker.val().replace(/-/g, "/"))),
                _minDate = new Date(Date.parse(scope.options.minDate.replace(/-/g, "/"))),
                _maxDate = new Date(Date.parse(scope.options.maxDate.replace(/-/g, "/")));
            scope.dom.show();
            if (scope.dom.is('.ui-slider')) scope.dom.slider("destroy");
            if (scope.options.autoplay) {
                scope._playBtn.attr("title", "暂停").html("||");
            }
            else {
                scope._playBtn.attr("title", "播放").html("▶");
            }
            //init timeline
            var _times = [], _labels = [];
            var _space = 0;
            if (scope.times && scope.times.length > 16 && scope.times.length <= 24) {
                _space = 2
            }
            else if (scope.times && scope.times.length > 24) {
                _space = 3;
            }
            else {
                _space = 1;
            }
            for (var i = 0, len = scope.times.length; i < len; i++) {
                var _t = scope.times[i];
                var _tDate = _timeFormat(_t.time);
                var _time = i % _space === 0 ? _tDate.format("hh:mm") : "";
                _times.push(_time);
                var _label = _tDate.format("MM月dd日hh时");
                _t.label = _label;
                _labels.push(_label);
            }
            scope._slider.slider({
                max: _times.length - 1,
                step: 1,
                slide: function (e, ui) {
                    playImg = new Image();
                    playImg.src = scope.times[_currIndex].url;
                    playImg.onload = function () {
                        _currIndex = ui.value;
                        scope._slider.slider("value", _currIndex);
                    };
                }
            }).slider("pips", {
                rest: "label",
                labels: _times
            }).slider("float", {
                labels: _labels
            }).on("slidechange", function (e, ui) {
                _currIndex = ui.value;
                _play();
            });
            if (scope.times.length > 0) {
               //  _currIndex = 0;
                if (scope.times.length > 0) {
                    scope._slider.slider("value", _currIndex);
                }
                $("#timeline .time-slider").show();
                scope._playBtn.attr("title", "暂停").html("||");
                if (scope.options.autoplay && scope.times.length > 1) {
                    _setInterval();
                }
                else {
                    scope._playBtn.attr("title", "播放").html("▶");
                    scope.isPlay = false;
                }
            }
            else {
                _stop();
                scope._playBtn.attr("title", "播放").html("▶");
                $("#timeline .time-slider").hide();
            }
        }

        /**
         * 控件初始化，包括：
         * 1、dom的生成；
         * 2、控件的事件；
         */
        scope.init = function () {
            $(".showName").remove();
            $("#map,#subnav,.g-tab-box,#subswitch").css("bottom", "5rem");
            scope.dom.css("height", "5rem");
            //create dom
            var _dateDom = $("<input/>").attr("type", "text").attr("id", "dateinfo"),
                _iconDom = $("<i class='icon-历史日历'/>").addClass("dateIcon");
                _btnsDom = $("<div/>").addClass("btns"),
                _playDom = scope.options.autoplay ? $("<button/>").attr("title", "暂停").html("||") :
                    $("<button/>").attr("title", "播放").html("▶"),
                _wrapDom = $("<div/>").addClass("wrap");
            _sliderDom = $("<div/>").addClass("time-slider");
            _playDom.addClass("button");

            var _domWidth = scope.dom.width();
            var _d = 85;
            if (scope.options.isDate) {
                _d = _d + 140;
            }
            _sliderDom.css({
                width: (_domWidth - _d) + "px"
            });

            scope._slider = _sliderDom;
            scope._playBtn = _playDom;

            _btnsDom.append(_playDom);
            if (scope.options.isDate) {
                _dateDom.show();
                _iconDom.show();
            }
            else {
                _dateDom.hide();
                _iconDom.hide();
            }
            _iconDom.on("click",function(){
                _dateDom.focus();
            });

            _wrapDom.append(_dateDom).append(_iconDom).append(_btnsDom).append(_sliderDom);
            scope.dom.append(_wrapDom);
            scope._datepicker = _dateDom.datetimepicker({
                lang: 'ch',
                className: "datepicker_timeline",
                opened: false,
                timepicker: false,
                datepicker: true,
                format: 'Y-m-d',
                formatDate: 'Y-m-d',
                maxDate: scope.options.maxDate,
                minDate: scope.options.minDate,
                value: scope.options.value,
                onSelectDate: function (date) {
                    this.setOptions({
                        value: date.format("yyyy-MM-dd")
                    });
                    _dayChangeEvent(date);
                    $(this).hide();
                },
                onShow: function () {
                    var _datepicker = $(this).find(".xdsoft_datepicker")[0];
                    $(_datepicker).addClass("xdsoft_datepicker_timeline");
                    $(this).css({
                        "border": "none",
                        "background": "none"
                    })
                }
            });
            //play control
            _playDom.on("click", function () {
                //▶表示播放，2竖线表示暂停
                if (_interval !== 0) {
                    $(this).attr("title", "播放").html("▶");
                    _stop();
                }
                else {
                    $(this).attr("title", "暂停").html("||");
                    _setInterval();
                }
            });

            _updateTimes();
        };

        //自动执行初始化函数
        scope.init();

        scope.destory = function () {
            _stop();
            scope.dom.html("").hide();
        };

        scope.stop = function () {
            _stop();
        };

        scope.changeDate = function (time) {
            var _tDate = _timeFormat(time);
            scope._datepicker.datetimepicker({
                value:_tDate.format('yyyy-MM-dd')
            });
            _dayChangeEvent(_tDate);
        };

        scope.selectByTime = function (time) {
            _currIndex = 0;
            for(var i=0;i<scope.times.length;i++){
                var _time = scope.times[i];
                if(_time.time===time){
                    _currIndex = i;
                    break;
                }
            }
            scope._slider.slider("value", _currIndex);
        };

        /**
         * 更新時間軸數據
         * @param times
         */
        scope.updateTimes = function (times) {
            scope.times = times;
            _updateTimes();
        };
        /**
         * 设置参数，主要包括：
         * 1、最大最小日期；
         * 2、是否显示日历；
         * @param options
         */
        scope.setOptions = function (options) {
            //将scope.options和options合并
            scope.options = $.extend({}, scope.options, options);
            scope._datepicker.datetimepicker({
                maxDate: options.maxDate,
                minDate: options.minDate,
                value: options.value ? options.value : options.maxDate
            });
            if (scope.options.isDate) {
                scope._datepicker.show();
            }
            else {
                scope._datepicker.hide();
            }
            var _domWidth = scope.dom.width();
            var _d = 85;
            scope._slider.css({
                width: (_domWidth - _d) + "px"
            });
        };

        //返回函数对象
        return this;
    };
})(jQuery);
