ig.module(
	'impact.system'
)
.requires(
	'impact.timer',
	'impact.image'
)
.defines(function () {
    "use strict";

    ig.System = ig.Class.extend({
        fps: 60,
        width: 1366,
        height: 768,
        realWidth: 1366,
        realHeight: 768,
        scale: 1,

        tick: 0,
        animationId: 0,
        newGameClass: null,
        running: false,

        delegate: null,
        clock: null,
        canvas: null,
        context: null,

        //================== // NEW GAME LOOP VARS
        intervalID: 0,
        now: 0,
        last: 0,
        game_tick: 0,
        dt: 0,
        DEBUG_lastdrawtime: 0,
        frameID: 0,
        interpolationvalue: 0, 


        init: function (canvasId, fps, width, height, scale) {
            this.fps = fps;
            this.game_tick = 1000 / fps;
            this.game_tick = this.game_tick.toFixed(5);
            this.clock = new ig.Timer();
            this.canvas = ig.$(canvasId);
            this.context = this.canvas.getContext('2d');
        },


        resize: function (width, height, scale) {
            //Unused - Handled by resize function in Menu.js instead
            this.width = width;
            this.height = height;
            this.scale = scale || this.scale;

            this.realWidth = this.width * this.scale;
            this.realHeight = this.height * this.scale;
            this.canvas.width = this.realWidth;
            this.canvas.height = this.realHeight;
        },


        setGame: function (gameClass) {
            if (this.running) {
                this.newGameClass = gameClass;
            }
            else {
                this.setGameNow(gameClass);
            }
        },


        setGameNow: function (gameClass) {
            ig.game = new (gameClass)();
            ig.system.setDelegate(ig.game);
        },


        setDelegate: function (object) {
            if (typeof (object.run) == 'function') {
                this.delegate = object;
                this.startRunLoop();
            } else {
                throw ('System.setDelegate: No run() function in object');
            }
        },

        run: function () {
            //New Run Step to decouple draw and update
            this.now = Date.now();

            this.dt = this.dt + Math.min(this.now - this.last, this.game_tick * 5); //cap change in time at 100ms(for suspension etc)

            //var updates = 0;
            while (this.dt > this.game_tick) {
                ig.Timer.fixedstep(this.game_tick);
                this.tick = this.clock.tick();

                this.delegate.update();

                ig.input.clearPressed();
                this.dt -= this.game_tick;
                //updates++;
            }

            /*if (updates > 1) {
                console.log("UPDATES: " + updates);
            }*/
            var that = this;

            cancelAnimationFrame(this.frameID); //cancel request if hasnt been drawn yet
            this.frameID = requestAnimationFrame(function () {
                //calculates the interpolation value for the frame
                that.interpolationvalue = Math.min((that.dt + (Date.now() - that.now)) / that.game_tick, 1);
                that.delegate.draw();
            }, this.canvas);

            this.last = Date.now();
            

        },

        stopRunLoop: function () {
            clearInterval(this.intervalID);
            this.running = false;
        },


        startRunLoop: function () {
            this.stopRunLoop();
            var that = this;
            this.intervalID = setInterval(function () { that.run() }, 1); //start the game loop
            this.running = true;
        },


        clear: function (color) {
            this.context.fillStyle = color;
            this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        },


   


        getDrawPos: function (p) {
            //return this.smoothPositioning ? Math.round(p * this.scale) : Math.round(p) * this.scale;

            //Bitwise hack to round, faster than Math.round and assuming no scale to help speed up this function as
            // it gets called very frequently
            return (p) | 0;
        }
    });
});