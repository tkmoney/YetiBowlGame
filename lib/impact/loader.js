ig.module(
	'impact.loader'
)
.requires(
	'impact.image'
	//'impact.font',
	//'impact.sound'
)
.defines(function(){

ig.Loader = ig.Class.extend({
	resources: [],
	
	gameClass: null,
	status: 0,
	done: false,
	
	_unloaded: [],
	_drawStatus: 0,
	_intervalId: 0,
	_loadCallbackBound: null,
	
	
	init: function( gameClass, resources ) {
		this.gameClass = gameClass;
		this.resources = resources;
		this._loadCallbackBound = this._loadCallback.bind(this);
		
	    /* Initialize Certain Image Resources So They Dont get loaded during runtime */
		var img_resources = [new ig.Image('media/Objects/atom_1.png'),
                            new ig.Image('media/Objects/atom_2.png'),
                            new ig.Image('media/Objects/atom_3.png'),
                            new ig.Image('media/Objects/atom_4.png'),
                            new ig.Image('media/Objects/atom_5.png'),
                            new ig.Image('media/Objects/atom_6.png'),
                            new ig.Image('media/Objects/atom_life.png'),
                            new ig.Image('media/Objects/atom_collect.png'),
                            new ig.Image('media/Objects/collectarrow.png'),
                            new ig.Image('media/Objects/freeze_atom.png'),
		                    new ig.Image('media/Objects/pirate/particles/crates_particles.png'),
		                    new ig.Image('media/Objects/pirate/particles/fruit.png'),
		                    new ig.Image('media/Objects/suburbia/grass.png'),
		                    new ig.Image('media/Objects/suburbia/hedge_day.png'),
		                    new ig.Image('media/Objects/suburbia/hedge_night.png'),
		                    new ig.Image('media/Objects/suburbia/grill_day.png'),
		                    new ig.Image('media/Objects/suburbia/grill_night.png'),
		                    new ig.Image('media/Objects/suburbia/fence_day.png'),
		                    new ig.Image('media/Objects/suburbia/fence_night.png'),
		                    new ig.Image('media/Objects/suburbia/mailbox_day.png'),
		                    new ig.Image('media/Objects/suburbia/mailbox_night.png'),
		                    new ig.Image('media/Objects/suburbia/trashcan_night.png')];
		this.resources = this.resources.concat(img_resources);

		for( var i = 0; i < this.resources.length; i++ ) {
			this._unloaded.push( this.resources[i].path );
		}
	},
	
	
	load: function () {
	    /*if (typeof (localStorage.splashDataObj) != 'undefined' && typeof (WinJS) != 'undefined') {
	        WinJS.Application.queueEvent({ type: 'activated', detail: { kind: 0, splashScreen: JSON.parse(localStorage.splashDataObj) } });
	    }*/
	    //ig.system.clear( '#000' );
		if( !this.resources.length ) {
			this.end();
			return;
		}


		for( var i = 0; i < this.resources.length; i++ ) {
			this.loadResource( this.resources[i] );
		}
		this._intervalId = setInterval( this.draw.bind(this), 16 );
	},
	
	
	loadResource: function( res ) {
		res.load( this._loadCallbackBound );
	},
	
	
	end: function() {
		if( this.done ) { return; }
		
		this.done = true;
		document.getElementById('canvas').className = '';

		clearInterval( this._intervalId );
		ig.system.setGame(this.gameClass);

	    //For Windows Metro Splash Screen
		document.getElementById('container').className = '';
		document.getElementById('extendedSplashScreen').className = 'hidden';

	},
	
	
	draw: function () {
        
        /*
	    ig.system.clear('#000');
	    //ig.system.context.clearRect(0, 0, ig.system.context.canvas.width, ig.system.context.canvas.width)
		this._drawStatus += (this.status - this._drawStatus)/5;
		var s = ig.system.scale;
		var w = ig.system.width * 0.6;
		var h = ig.system.height * 0.1;
		var x = ig.system.width * 0.5-w/2;
		var y = ig.system.height * 0.5-h/2;
		
		ig.system.context.fillStyle = '#000';
		ig.system.context.fillRect( 0, 0, 480, 320 );
		
		ig.system.context.fillStyle = '#fff';
		ig.system.context.fillRect( x*s, y*s, w*s, h*s );
		
		ig.system.context.fillStyle = '#000';
		ig.system.context.fillRect( x*s+s, y*s+s, w*s-s-s, h*s-s-s );
		
		ig.system.context.fillStyle = '#fff';
		ig.system.context.fillRect( x*s, y*s, w*s*this._drawStatus, h*s );*/
	},
	
	
	_loadCallback: function( path, status ) {
		if( status ) {
			this._unloaded.erase( path );
		}
		else {
			throw( 'Failed to load resource: ' + path );
		}
		
		this.status = 1 - (this._unloaded.length / this.resources.length);
		if( this._unloaded.length == 0 ) { // all done?
			setTimeout( this.end.bind(this), 250 );
		}
	}
});

});