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
         * 前一天、后一天翻页
         * @param type
         */
        function _dayControl(type) {
            var _currDate = new Date(Date.parse(scope._datepicker.val().replace(/-/g, "/"))),
                _minDate = new Date(Date.parse(scope.options.minDate.replace(/-/g, "/"))),
                _maxDate = new Date(Date.parse(scope.options.maxDate.replace(/-/g, "/")));
            var _afterDate;
            switch (type) {
                case "prev": {
                    scope._nextDay.removeClass("disable");
                    _afterDate = _currDate.getTime() - 24 * 60 * 60 * 1000;
                    if (_afterDate <= _minDate.getTime()) {
                        scope._prevDay.addClass("disable");
                        _afterDate = _minDate;
                    }
                    break;
                }
                case "next": {
                    scope._prevDay.removeClass("disable");
                    _afterDate = _currDate.getTime() + 24 * 60 * 60 * 1000;
                    if (_afterDate >= _maxDate.getTime()) {
                        scope._nextDay.addClass("disable");
                        _afterDate = _maxDate;
                    }
                    break;
                }
                default: {
                    scope._prevDay.removeClass("disable");
                    _afterDate = _currDate.getTime();
                    if (_afterDate >= _maxDate.getTime()) {
                        scope._nextDay.addClass("disable");
                        _afterDate = _maxDate;
                    }
                    break;
                }
            }
            _dayChangeEvent(new Date(_afterDate));
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
            scope._prevDay.removeClass("disable");
            scope._nextDay.removeClass("disable");
            if (_currDate.getTime() >= _maxDate.getTime()) {
                scope._nextDay.addClass("disable");
            }
            if (_currDate.getTime() <= _minDate.getTime()) {
                scope._prevDay.addClass("disable");
            }
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
                var _label = _t.label ? _t.label : _tDate.format("yyyy年MM月dd日hh时mm分");
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
                scope._infoDom.show();
                scope._playBtn.attr("title", "暂停").html("||");
                scope._noneDom.hide();
                //默认播放第一个
                // _play();
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
                scope._infoDom.hide();
                scope._playBtn.attr("title", "播放").html("▶");
                $("#timeline .time-slider").hide();
                scope._noneDom.show();
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
                _prevDayDom = $("<button/>").addClass("button").attr("title", "上一天").html("<<"),
                _prevTimeDom = $("<button/>").attr("title", "上一时").html("<"),
                _nextDayDom = $("<button/>").addClass("button").attr("title", "下一天").html(">>"),
                _nextTimeDom = $("<button/>").attr("title", "下一时").html(">"),
                _playDom = scope.options.autoplay ? $("<button/>").attr("title", "暂停").html("||") :
                    $("<button/>").attr("title", "播放").html("▶"),
                _switchbtn = $("<div/>").data("open", true).attr("title", "收起").addClass("closebtn").html("╲╱"),
                _showDom = $("<div/>").addClass("showName").hide(),
                _wrapDom = $("<div/>").addClass("wrap");
            var noneDiv = $("<div/>").addClass("none")/*.html("---------------------------暂无数据-----------------------")*/.hide();
            _sliderDom = $("<div/>").addClass("time-slider");
            _playDom.addClass("button");

            var _domWidth = scope.dom.width();
            var _d = 85;
            if (scope.options.isDate) {
                _d = _d + 200;
            }
            if (scope.options.isBtns) {
                _d = _d + 40;
            }
            _sliderDom.css({
                width: (_domWidth - _d) + "px"
            });

            scope._slider = _sliderDom;
            scope._prevDay = _prevDayDom;
            scope._nextDay = _nextDayDom;
            scope._prevTime = _prevTimeDom;
            scope._nextTime = _nextTimeDom;
            scope._playBtn = _playDom;
            scope._infoDom = _showDom;
            scope._noneDom = noneDiv;

            _btnsDom.append(_prevDayDom).append(_prevTimeDom)
                .append(_playDom).append(_nextTimeDom).append(_nextDayDom);
            if (scope.options.isDate) {
                _prevDayDom.show();
                _nextDayDom.show();
                _dateDom.show();
                _iconDom.show();
            }
            else {
                _prevDayDom.hide();
                _nextDayDom.hide();
                _dateDom.hide();
                _iconDom.hide();
            }
            if (scope.options.isBtns) {
                _prevTimeDom.show();
                _nextTimeDom.show();
            }
            else {
                _prevTimeDom.hide();
                _nextTimeDom.hide();
            }
            _iconDom.on("click",function(){
                _dateDom.focus();
            });

            _wrapDom.append(_dateDom).append(_iconDom).append(_btnsDom).append(noneDiv).append(_sliderDom);
            _showDom.appendTo($("#map"));
            scope.dom.append(_wrapDom).append(_switchbtn);
            //init datepicker
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
            //初始化按钮颜色
            var _currDate = new Date(Date.parse(scope._datepicker.val().replace(/-/g, "/"))),
                _minDate = new Date(Date.parse(scope.options.minDate.replace(/-/g, "/"))),
                _maxDate = new Date(Date.parse(scope.options.maxDate.replace(/-/g, "/")));
            if (_currDate.getTime() >= _maxDate.getTime()) {
                scope._nextDay.addClass("disable");
            } else if (_currDate.getTime() <= _minDate.getTime()) {
                scope._prevDay.addClass("disable");
            }

            _switchbtn.on("click", function () {
                var _open = $(this).data("open");
                $(_wrapDom).toggle("fast");
                if (_open) {
                    scope.dom.css("height", "0");
                    $("#map,#subnav,.g-tab-box,#subswitch").css("bottom", "0");
                    $(this).attr("title", "打开").data("open", false).html("╱╲");
                } else {
                    scope.dom.css("height", "5rem");
                    $("#map,#subnav,.g-tab-box,#subswitch").css("bottom", "5rem");
                    $(this).attr("title", "收起").data("open", true).html("╲╱");
                }
            });

            //prev or next day ctrl
            _prevDayDom.on("click", function () {
                _dayControl("prev");
            });
            _nextDayDom.on("click", function () {
                _dayControl("next");
            });

            //play control
            _playDom.on("click", function () {
                //▶表示播放，2竖线表示暂停
                if (_interval != 0) {
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
            // 控制实况默认选中最后一个，预报默认选中第一个
            _currIndex = window.as.AppConfig.sysflag === 'live'?scope.times.length - 1:0;
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
                scope._prevDay.show();
                scope._nextDay.show();
            }
            else {
                scope._datepicker.hide();
                scope._prevDay.hide();
                scope._nextDay.hide();
            }
            if (scope.options.isBtns) {
                scope._prevTime.show();
                scope._nextTime.show();
            }
            else {
                scope._prevTime.hide();
                scope._nextTime.hide();
            }
            var _domWidth = scope.dom.width();
            var _d = 85;
            if (scope.options.isDate) {
                _d = _d + 200;
            }
            if (scope.options.isBtns) {
                _d = _d + 40;
            }
            scope._slider.css({
                width: (_domWidth - _d) + "px"
            });
        };

        //返回函数对象
        return this;
    };
})(jQuery);
