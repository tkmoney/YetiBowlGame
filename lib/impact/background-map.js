ig.module(
	'impact.background-map'
)
.requires(
	'impact.map',
	'impact.image'
)
.defines(function () {

    ig.BackgroundMap = ig.Map.extend({
        tiles: null,
        scroll: { x: 0, y: 0 },
        distance: 1,
        startheight: 0,
        repeat: false,
        tilesetName: '',
        foreground: false,
        enabled: true,

        preRender: false,
        preRenderedChunks: null,
        chunkSize: 512,
        debugChunks: false,

        chunk: [],
        anims: {},


        init: function (tilesize, data, tileset) {
            this.parent(tilesize, data);
            this.setTileset(tileset);
        },


        setTileset: function (tileset) {
            this.tilesetName = tileset instanceof ig.Image ? tileset.path : tileset;
            this.tiles = new ig.Image(this.tilesetName);
            this.preRenderedChunks = null;
        },


        setScreenPos: function (x, y) {
            this.scroll.x = x / this.distance;
            this.scroll.y = y / this.distance - this.startheight;
        },


        preRenderMapToChunks: function () {
            'use strict';

       
            var totalWidth = this.width * this.tilesize;
            var totalHeight = this.height * this.tilesize;

            var chunkCols = Math.ceil(totalWidth / this.chunkSize);
            var chunkRows = Math.ceil(totalHeight / this.chunkSize);

            this.preRenderedChunks = [];
            for (var y = 0; y < chunkRows; y++) {
                this.preRenderedChunks[y] = [];

                for (var x = 0; x < chunkCols; x++) {


                    var chunkWidth = (x == chunkCols - 1)
					? totalWidth - x * this.chunkSize
					: this.chunkSize;

                    var chunkHeight = (y == chunkRows - 1)
					? totalHeight - y * this.chunkSize
					: this.chunkSize;

                    this.preRenderedChunks[y][x] = this.preRenderChunk(x, y, chunkWidth, chunkHeight);
                    ig.system.context.drawImage(this.preRenderedChunks[y][x].canvas, 3000, 3000);
                }
            }
        },


        preRenderChunk: function (cx, cy, w, h) {
            'use strict';
            var blank = true;
            var tw = ((w / this.tilesize) | 0) + 1;
            var th = ((h / this.tilesize) | 0) + 1;

            var nx = (cx * this.chunkSize) % this.tilesize;
            var ny = (cy * this.chunkSize) % this.tilesize;

            var tx = Math.floor(cx * this.chunkSize / this.tilesize);
            var ty = Math.floor(cy * this.chunkSize / this.tilesize);


            var chunk = ig.$new('canvas');
            chunk.width = w;
            chunk.height = h;

            var oldContext = ig.system.context;
            ig.system.context = chunk.getContext("2d");

            for (var x = 0; x < tw; x++) {
                for (var y = 0; y < th; y++) {
                    if (x + tx < this.width && y + ty < this.height) {
                        var tile = this.data[y + ty][x + tx];
                        if (tile) {
                            this.tiles.drawTile(
							x * this.tilesize - nx, y * this.tilesize - ny,
							tile - 1, this.tilesize
						);
                            blank = false;
                        }
                    }
                }
            }
            ig.system.context = oldContext;
            
            return { canvas: chunk, isBlank: blank };
        },


        draw: function () {
            if (!this.tiles.loaded || !this.enabled) {
                return;
            }

            if (this.preRender) {
                this.drawPreRendered();
            }
            else {
                this.drawTiled();
            }
        },


        drawPreRendered: function () {
            'use strict';

            if (!this.preRenderedChunks) {
                this.preRenderMapToChunks();
            }
            
            var dx = this.scroll.x | 0;
            var dy = this.scroll.y | 0;

            var chuck_size = this.chunkSize;

            if (this.repeat) {
                dx %= this.width * this.tilesize;
                //dy %= this.height * this.tilesize;
            }

            //initializing separately is faster
            var minChunkX = Math.max(~~(dx / chuck_size), 0);   //~~ is bitwise flooring
            var minChunkY = Math.max(~~(dy / chuck_size), 0);

            var maxChunkX = Math.ceil(((dx + ig.system.realWidth) / chuck_size));
            var maxChunkY = Math.ceil(((dy + ig.system.realHeight) / chuck_size));
            var maxRealChunkX = this.preRenderedChunks[0].length;
            var maxRealChunkY = this.preRenderedChunks.length;

            if (!this.repeat) {
                maxChunkX = Math.min(maxChunkX, maxRealChunkX);
            }

            maxChunkY = Math.min(maxChunkY, maxRealChunkY);


            var nudgeY = 0;
            var nudgeX = 0;
            var x = 0;
            var y = 0;
            var chunk = null;
            var maxchunkX_baseline = maxChunkX;


            for (var cy = minChunkY; cy < maxChunkY; cy++) {

                nudgeX = 0;
                maxChunkX = maxchunkX_baseline;

                for (var cx = minChunkX; cx < maxChunkX; cx++) {
                    chunk = this.preRenderedChunks[cy % maxRealChunkY][cx % maxRealChunkX];

                    x = -dx + cx * chuck_size - nudgeX;
                    y = -dy + cy * chuck_size - nudgeY;
                    if (!chunk.isBlank) {
                        ig.system.context.drawImage(chunk.canvas, x - (1 * cx), y - (1 * cy));
                        //ig.Image.drawCount++;
                    }

                    // If we repeat in X and this chunks width wasn't the full chunk size
                    // and the screen is not already filled, we need to draw anohter chunk
                    // AND nudge it to be flush with the last chunk
                    if (this.repeat && chunk.canvas.width < this.chunkSize && x + chunk.canvas.width < ig.system.realWidth) {
                        nudgeX = (chuck_size - chunk.canvas.width);
                        maxChunkX++;
                    }
                }

                // Same as above, but for Y
                /*if (this.repeat && chunk.height < this.chunkSize && y + chunk.height < ig.system.realHeight) {
                    nudgeY = (this.chunkSize - chunk.height);
                    maxChunkY++;
                }*/
            }
        },


        drawTiled: function () {

            'use strict';
            var tile = 0,
			tileOffsetX = (this.scroll.x / this.tilesize).toInt(),
			tileOffsetY = (this.scroll.y / this.tilesize).toInt(),
			pxOffsetX = (this.scroll.x % this.tilesize),
			pxOffsetY = (this.scroll.y % this.tilesize),
			pxMinX = -pxOffsetX,
			pxMinY = -pxOffsetY - this.tilesize,
			pxMaxX = ig.system.width,
			pxMaxY = ig.system.height;


            // FIXME: could be sped up for non-repeated maps: restrict the for loops
            // to the map size instead of to the screen size and skip the 'repeat'
            // checks inside the loop.
            //var draws = 0;

            for (var mapY = -1, pxY = pxMinY; pxY < pxMaxY; mapY++, pxY += this.tilesize) {
                var tileY = mapY + tileOffsetY;

                // Repeat Y?
                if (tileY >= this.height || tileY < 0) {
                    continue;
                    //tileY = tileY > 0
					//? tileY % this.height
					//: ((tileY + 1) % this.height) + this.height - 1;
                }

                for (var mapX = -1, pxX = pxMinX; pxX < pxMaxX; mapX++, pxX += this.tilesize) {
                    var tileX = mapX + tileOffsetX;

                    // Repeat X?
                    if (tileX >= this.width || tileX < 0) {
                        if (!this.repeat) { continue; }
                        tileX = tileX > 0
						? tileX % this.width
						: ((tileX + 1) % this.width) + this.width - 1;
                    }

                    // Draw!
                    if ((tile = this.data[tileY][tileX])) {
                        //draws++;
                        //console.log("PX: " + pxX + " PY: " + pxY);
                        this.tiles.drawTile(pxX - (mapX), pxY - (mapY), tile - 1, this.tilesize, this.tilesize);
                    }
                } // end for x
            } // end for y

            //console.log("DRAWS: " + draws);
        }
    });

});