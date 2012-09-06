ig.module(
	'impact.game'
)
.requires(
	'impact.impact',
	'impact.entity',
	//'impact.collision-map',
	'impact.background-map'
)
.defines(function () {

    ig.Game = ig.Class.extend({

        clearColor: '#000000',
        gravity: 0,
        screen: { x: 0, y: 0 },
        _rscreen: { x: 0, y: 0 },

        entities: [],

        namedEntities: {},
        //collisionMap: ig.CollisionMap.staticNoCollision,
        backgroundMaps: [],
        backgroundAnims: {},

        autoSort: false,
        sortBy: null,

        cellSize: 64,

        _deferredKill: [],
        _levelToLoad: null,
        _doSortEntities: false,


        staticInstantiate: function () {
            this.sortBy = ig.Game.SORT.Z_INDEX;
            ig.game = this;
            return null;
        },


        loadLevel: function (data) {
            'use strict';

            this.screen = { x: 0, y: 0 };

            // Entities
            this.entities = [];
            this.entitiessortedX = []; //holds an array of entities sorted by X pos
            this.sortX = 0; //keep track of last item we checked for onscreen

            this.namedEntities = {};
            for (var i = 0; i < data.entities.length; i++) {
                var ent = data.entities[i];
                if (ent.settings) {
                    //ig.log(i + " : " + ent.settings);
                }
                this.spawnEntity(ent.type, ent.x, ent.y, ent.settings);
            }
            this.sortEntities();

            for (var i = 0; i < this.entities.length; i++) // copy array pointers
            {
                this.entitiessortedX[i] = this.entities[i];
            }
            this.entitiessortedX.sort(ig.Game.SORT.POS_X);
            this.checkEntitiesOnScreen(); //check entities once before first upate loop


            // Map Layer
            this.backgroundMaps = [];
            for (var i = 0; i < data.layer.length; i++) {
                var ld = data.layer[i];

                var newMap = new ig.BackgroundMap(ld.tilesize, ld.data, ld.tilesetName);
                newMap.anims = this.backgroundAnims[ld.tilesetName] || {};
                newMap.repeat = ld.repeat;
                newMap.distance = ld.distance;
                newMap.startheight = ld.startheight;
                newMap.foreground = !!ld.foreground;
                newMap.preRender = !!ld.preRender;
                this.backgroundMaps.push(newMap);
            }

            // Call post-init ready function on all entities
            for (var i = 0; i < this.entities.length; i++) {
                this.entities[i].ready();
            }

        },


        loadLevelDeferred: function (data) {
            this._levelToLoad = data;
        },


        getEntityByName: function (name) {
            return this.namedEntities[name];
        },


        getEntitiesByType: function (type) {
            var entityClass = typeof (type) === 'string'
			? ig.global[type]
			: type;

            var a = [];
            for (var i = 0; i < this.entities.length; i++) {
                var ent = this.entities[i];
                if (ent instanceof entityClass && !ent._killed) {
                    a.push(ent);
                }
            }
            return a;
        },


        spawnEntity: function (type, x, y, settings) {
            var entityClass = typeof (type) === 'string'
			? ig.global[type]
			: type;

            if (!entityClass) {
                throw ("Can't spawn entity of type " + type);
            }
            var ent = new (entityClass)(x, y, settings || {});

            this.entities.push(ent);

            if (ent.name) {
                this.namedEntities[ent.name] = ent;
            }
            return ent;
        },


        sortEntities: function () {
            this.entities.sort(this.sortBy);
        },


        sortEntitiesDeferred: function () {
            this._doSortEntities = true;
        },


        removeEntity: function (ent) {
            // Remove this entity from the named entities
            if (ent.name) {
                delete this.namedEntities[ent.name];
            }

            // We can not remove the entity from the entities[] array in the midst
            // of an update cycle, so remember all killed entities and remove
            // them later.
            // Also make sure this entity doesn't collide anymore and won't get
            // updated or checked
            ent._killed = true;
            ent.checkAgainst = ig.Entity.TYPE.NONE;
            ent.collides = ig.Entity.COLLIDES.NEVER;
            this._deferredKill.push(ent);
        },


        run: function () {
            this.update();
            this.draw();
        },


        update: function () {
            // load new level?
            if (this._levelToLoad) {
                this.loadLevel(this._levelToLoad);
                this._levelToLoad = null;
            }

            // sort entities?
            if (this._doSortEntities || this.autoSort) {
                this.sortEntities();
                this._doSortEntities = false;
            }

            // update entities
            this.checkEntitiesOnScreen();
            this.updateEntities();
            this.checkEntities();

            // remove all killed entities
            for (var i = 0; i < this._deferredKill.length; i++) {
                this.entities.erase(this._deferredKill[i]);
            }
            this._deferredKill = [];

            // update background animations
            /*
            for (var tileset in this.backgroundAnims) {
            var anims = this.backgroundAnims[tileset];
            for (var a in anims) {
            anims[a].update();
            }
            }*/
        },

        checkEntitiesOnScreen: function () {
            var x = 2000;
            if(ig.game.player){
                x += ig.game.player.pos.x; //2000 to give some leeway
            }

            for (var i = this.sortX; i < this.entitiessortedX.length; i++) {
                if (this.entitiessortedX[i] && !this.entitiessortedX[i].checkonscreen(x)) {
                    this.sortX = i; //keep track of last checked
                    break; //if entity is not onscreen no need to check rest
                }
            }
        },

        updateEntities: function () {
            for (var i = 0; i < this.entities.length; i++) {
                if (this.entities[i].isOnScreen) {
                    var ent = this.entities[i];
                    if (!ent._killed) {
                        ent.update();
                    }
                }
            }
        },


        draw: function () {
            
            this._rscreen.x = ig.system.getDrawPos(ig.game.camera.lastpos.x) + ig.game.camera.interpolation_diff.x * ig.system.interpolationvalue;
            this._rscreen.y = ig.system.getDrawPos(ig.game.camera.lastpos.y) + ig.game.camera.interpolation_diff.y * ig.system.interpolationvalue;

            var mapIndex;
            for (mapIndex = 0; mapIndex < this.backgroundMaps.length; mapIndex++) {
                //console.log("DRAW MAP: " + mapIndex);
                var map = this.backgroundMaps[mapIndex];
                map.setScreenPos(this._rscreen.x, this._rscreen.y);
                map.draw();
            }
            this.drawEntities();
          
        },


        drawEntities: function () {
            for (var i = 0; i < this.entities.length; i++) {
                if (this.entities[i].isOnScreen) {
                    this.entities[i].draw();
                }
            }
        },

        clearEntities: function () {
            for (var i = 0; i < this.entities.length; i++) {
                this.entities[i].kill();
            }
        },

        checkEntities: function () {
            'use strict';
            // Insert all entities into a spatial hash and check them against any
            // other entity that already resides in the same cell. Entities that are
            // bigger than a single cell, are inserted into each one they intersect
            // with.

            // A list of entities, which the current one was already checked with,
            // is maintained for each entity.

            var hash = {};

            for (var e = 0; e < this.entities.length; e++) {
                var entity = this.entities[e];

                // Skip entities that don't check, don't get checked and don't collide
                if (
				    entity.type === ig.Entity.TYPE.NONE &&
				    entity.checkAgainst === ig.Entity.TYPE.NONE ||
				    entity.collides === ig.Entity.COLLIDES.NEVER
			    ) {
                    continue;
                }

                if (!entity.isOnScreen) {
                    continue;
                }

                var cell_size = this.cellSize; //cache value

                var checked = {};
                var xmin = ~~(entity.pos.x / cell_size);
                var ymin = ~~(entity.pos.y / cell_size);
                var xmax = ~~((entity.pos.x + entity.size.x) / cell_size) + 1;
                var ymax = ~~((entity.pos.y + entity.size.y) / cell_size) + 1;

                for (var x = xmin; x < xmax; x++) {
                    for (var y = ymin; y < ymax; y++) {

                        // Current cell is empty - create it and insert!
                        if (!hash[x]) {
                            hash[x] = {};
                            hash[x][y] = [entity];
                        }
                        else if (!hash[x][y]) {
                            hash[x][y] = [entity];
                        }

                        // Check against each entity in this cell, then insert
                        else {
                            var cell = hash[x][y];
                            for (var c = 0; c < cell.length; c++) {

                                // Intersects and wasn't already checkd?
                                if (!checked[cell[c].id] && entity.touches(cell[c])) {
                                    checked[cell[c].id] = true;
                                    ig.Entity.checkPair(entity, cell[c]);
                                }
                            }
                            cell.push(entity);
                        }
                    } // end for y size
                } // end for x size
            } // end for entities


        }
    });

    ig.Game.SORT = {
        Z_INDEX: function (a, b) { return a.zIndex - b.zIndex; },
        POS_X: function (a, b) { return a.pos.x - b.pos.x; },
        POS_Y: function (a, b) { return a.pos.y - b.pos.y; }
    };

});