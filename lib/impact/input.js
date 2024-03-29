﻿ig.module(
	'impact.input'
)
.defines(function () {

    ig.KEY = {
        'MOUSE1': -1,
        'MOUSE2': -3,
        'MWHEEL_UP': -4,
        'MWHEEL_DOWN': -5,

        'BACKSPACE': 8,
        'TAB': 9,
        'ENTER': 13,
        'PAUSE': 19,
        'CAPS': 20,
        'ESC': 27,
        'SPACE': 32,
        'PAGE_UP': 33,
        'PAGE_DOWN': 34,
        'END': 35,
        'HOME': 36,
        'LEFT_ARROW': 37,
        'UP_ARROW': 38,
        'RIGHT_ARROW': 39,
        'DOWN_ARROW': 40,
        'INSERT': 45,
        'DELETE': 46,
        '_0': 48,
        '_1': 49,
        '_2': 50,
        '_3': 51,
        '_4': 52,
        '_5': 53,
        '_6': 54,
        '_7': 55,
        '_8': 56,
        '_9': 57,
        'A': 65,
        'B': 66,
        'C': 67,
        'D': 68,
        'E': 69,
        'F': 70,
        'G': 71,
        'H': 72,
        'I': 73,
        'J': 74,
        'K': 75,
        'L': 76,
        'M': 77,
        'N': 78,
        'O': 79,
        'P': 80,
        'Q': 81,
        'R': 82,
        'S': 83,
        'T': 84,
        'U': 85,
        'V': 86,
        'W': 87,
        'X': 88,
        'Y': 89,
        'Z': 90,
        'NUMPAD_0': 96,
        'NUMPAD_1': 97,
        'NUMPAD_2': 98,
        'NUMPAD_3': 99,
        'NUMPAD_4': 100,
        'NUMPAD_5': 101,
        'NUMPAD_6': 102,
        'NUMPAD_7': 103,
        'NUMPAD_8': 104,
        'NUMPAD_9': 105,
        'MULTIPLY': 106,
        'ADD': 107,
        'SUBSTRACT': 109,
        'DECIMAL': 110,
        'DIVIDE': 111,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F10': 121,
        'F11': 122,
        'F12': 123,
        'SHIFT': 16,
        'CTRL': 17,
        'ALT': 18,
        'PLUS': 187,
        'COMMA': 188,
        'MINUS': 189,
        'PERIOD': 190
    };


    ig.Input = ig.Class.extend({
        bindings: {},
        actions: {},
        presses: {},
        locks: {},
        delayedKeyup: {},

        isUsingMouse: false,
        isUsingKeyboard: false,
        isUsingAccelerometer: false,
        mouse: { x: 0, y: 0 },
        accel: { x: 0, y: 0, z: 0 },

		pointerUp: true,
        canvasoffsetleft: 0,
        canvasoffsettop: 0,

		msTouchBindDown: function(that){
			that.keydown.bind(that)
		},

        initMouse: function () {
            if (this.isUsingMouse) { return; }
            this.isUsingMouse = true;
			var that = this;
			var pointerSink = document.getElementById("PointerSink");
            window.addEventListener('mousewheel', this.mousewheel.bind(this), false);
            ig.system.canvas.addEventListener('contextmenu', this.contextmenu.bind(this), false);
            ig.system.canvas.addEventListener('mousedown', this.keydown.bind(this), false);
            ig.system.canvas.addEventListener('mouseup', this.keyup.bind(this), false);
            ig.system.canvas.addEventListener('mousemove', this.mousemove.bind(this), false);

            ig.system.canvas.addEventListener('touchstart', this.keydown.bind(this), false);
            ig.system.canvas.addEventListener('touchend', this.keyup.bind(this), false);
            ig.system.canvas.addEventListener('touchmove', this.mousemove.bind(this), false);

            ig.system.canvas.addEventListener("MSGestureTap", this.mousemove.bind(this), false);

            //preload these for efficency
            this.resetoffset();

        },

        resetoffset: function () {
            //preload these for efficency
            var el = ig.system.canvas;
            this.canvasoffsettop = 0;
            this.canvasoffsetleft = 0;
            while (el != null) {
                this.canvasoffsetleft += el.offsetLeft;
                this.canvasoffsettop += el.offsetTop;
                el = el.offsetParent;
            }
        },

        initKeyboard: function () {
            if (this.isUsingKeyboard) { return; }
            this.isUsingKeyboard = true;
            window.addEventListener('keydown', this.keydown.bind(this), false);
            window.addEventListener('keyup', this.keyup.bind(this), false);
        },


        initAccelerometer: function () {
            if (this.isUsingAccelerometer) { return; }
            window.addEventListener('devicemotion', this.devicemotion.bind(this), false);
        },


        mousewheel: function (event) {
            var code = event.wheel > 0 ? ig.KEY.MWHEEL_UP : ig.KEY.MWHEEL_DOWN;
            var action = this.bindings[code];
            if (action) {
                this.actions[action] = true;
                this.presses[action] = true;
                event.stopPropagation();
                this.delayedKeyup[action] = true;
            }
        },


        mousemove: function (event) {
            var tx = event.pageX;
            var ty = event.pageY;
            if (event.touches) {
                tx = event.touches[0].clientX;
                ty = event.touches[0].clientY;
            }

            this.mouse.x = (tx - this.canvasoffsetleft);
            this.mouse.y = (ty - this.canvasoffsettop);
        },


        contextmenu: function (event) {
            if (this.bindings[ig.KEY.MOUSE2]) {
                event.stopPropagation();
                event.preventDefault();
            }
        },


        keydown: function (event) {
            if (event.target.type == 'text') { return; }

            var code = event.type == 'keydown'
			? event.keyCode
			: (event.button == 2 ? ig.KEY.MOUSE2 : ig.KEY.MOUSE1);

            if (event.type == 'touchstart' || event.type == 'mousedown') {
                this.mousemove(event);
            }

            var action = this.bindings[code];
            if (action) {
                this.actions[action] = true;
                if (!this.locks[action]) {
                    this.presses[action] = true;
                    this.locks[action] = true;
                }
                event.stopPropagation();
                event.preventDefault();
            }
        },


        keyup: function (event) {
            if (event.target.type == 'text') { return; }

            var code = event.type == 'keyup'
			? event.keyCode
			: (event.button == 2 ? ig.KEY.MOUSE2 : ig.KEY.MOUSE1);

            var action = this.bindings[code];
            if (action) {
                this.delayedKeyup[action] = true;
                event.stopPropagation();
                event.preventDefault();
            }
        },


        devicemotion: function (event) {
            this.accel = event.accelerationIncludingGravity;
        },


        bind: function (key, action) {
            if (key < 0) { this.initMouse(); }
            else if (key > 0) { this.initKeyboard(); }
            this.bindings[key] = action;
        },

		fireEventOnElm:function(e, elm){
			var eventName = e;
			var event;
			if (document.createEvent) {
				event = document.createEvent("HTMLEvents");
				event.initEvent(e, true, true);
			} else {
				event = document.createEventObject();
				event.eventType = e;
			}

			event.eventName = e;
			event.memo = { };

			if (document.createEvent) {
				elm.dispatchEvent(event);
			} else {
				elm.fireEvent("on" + event.eventType, event);
			}
		},

        bindTouch: function (selector, action) {
            var element = ig.$(selector);

            var that = this;
            element.addEventListener('touchstart', function (ev) {
                that.touchStart(ev, action);
            }, false);

            element.addEventListener('touchend', function (ev) {
                that.touchEnd(ev, action);
            }, false);


        },


        unbind: function (key) {
            var action = this.bindings[key];
            this.delayedKeyup[action] = true;

            this.bindings[key] = null;
        },


        unbindAll: function () {
            this.bindings = {};
            this.actions = {};
            this.presses = {};
            this.locks = {};
            this.delayedKeyup = {};
        },


        state: function (action) {
            return this.actions[action];
        },


        pressed: function (action) {
            return this.presses[action];
        },

        released: function (action) {
            return this.delayedKeyup[action];
        },

        clearPressed: function () {
            for (var action in this.delayedKeyup) {
                this.actions[action] = false;
                this.locks[action] = false;
            }
            this.delayedKeyup = {};
            this.presses = {};
        },

        touchStart: function (event, action) {
            this.actions[action] = true;
            this.presses[action] = true;

            event.stopPropagation();
            event.preventDefault();
            return false;
        },


        touchEnd: function (event, action) {
            this.delayedKeyup[action] = true;
            event.stopPropagation();
            event.preventDefault();
            return false;
        }
    });

});