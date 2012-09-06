ig.module(
	'impact.sound'
)
.defines(function(){
	
ig.SoundManager = ig.Class.extend({
    clips: {},
    clipcount: 0,
	volume: 1,
	format: null,
	
	init: function () {
        /*
		// Probe sound formats and determine the file extension to load
		var probe = new Audio();
		for( var i = 0; i < ig.Sound.use.length; i++ ) {
			var format = ig.Sound.use[i];
			if( probe.canPlayType(format.mime) ) {
				this.format = format;
				break;
			}
		}
		
		// No compatible format found? -> Disable sound
		if( !this.format ) {
			ig.Sound.enabled = false;
		}*/
	},
	

	
	load: function( path, multiChannel, loadCallback ) {
		// Path to the soundfile with the right extension (.ogg or .mp3)
		var realPath = path.match(/^(.*)\.[^\.]+$/)[1] + '.' + this.format.ext + ig.nocache;
		
		// Sound file already loaded?
		if( this.clips[path] ) {
			
			// Only loaded as single channel and now requested as multichannel?
			if( multiChannel && this.clips[path].length < ig.Sound.channels ) {
				for( var i = this.clips[path].length; i < ig.Sound.channels; i++ ) {
					var a = new Audio( realPath );
					a.load();
					this.clips[path].push( a );
				}
			}
			return this.clips[path][0];
		}
		
		var clip = new Audio( realPath );
		if( loadCallback ) {
			
			// The canplaythrough event is dispatched when the browser determines
			// that the sound can be played without interuption, provided the
			// download rate doesn't change.
			// FIXME: Mobile Safari doesn't seem to dispatch this event at all?
			clip.addEventListener( 'canplaythrough', function(ev){
				this.removeEventListener('canplaythrough', arguments.callee, false);
				loadCallback( path, true, ev );
			}, false );
			
			// FIXME: Sometimes Firefox aborts loading sounds for no reason(?),
			// tell the callback that everything went fine anyway
			// Haven't been able to determine when or why this happens :/
			// Update: Firefox4 doesn't have this problem anymore, but
			// now IE9 does :(
			clip.addEventListener( 'error', function(ev){
				loadCallback( path, true, ev ); // should pass 'false'
			}, false);
		}
		clip.load();
		
		this.clipcount++;
		this.clips[path] = [clip];
		if( multiChannel ) {
			for( var i = 1; i < ig.Sound.channels; i++ ) {
				var a = new Audio(realPath);
				a.load();
				this.clips[path].push(a);
				this.clipcount++;
			}
		}
		//console.log("CLIPS " + this.clipcount);
		return clip;
	},
	
	
	get: function( path ) {
		// Find and return a channel that is not currently playing	
		var channels = this.clips[path];
		for( var i = 0, clip; clip = channels[i++]; ) {
			if( clip.paused || clip.ended ) {
				if( clip.ended ) {
					clip.currentTime = 0;
				}
				return clip;
			}
		}
		
		// Still here? Pause and rewind the first channel
		channels[0].pause();
		channels[0].currentTime = 0;
		return channels[0];
	}
});



ig.Music = ig.Class.extend({
	tracks: [],
	namedTracks: {},
	currentTrack: null,
	currentIndex: 0,
	random: false,
	
	_volume: 1,
	_loop: false,
	_fadeInterval: 0,
	_fadeTimer: null,
	_endedCallbackBound: null,
	
	
	init: function() {
		this._endedCallbackBound = this._endedCallback.bind(this);
		
		if( Object.defineProperty ) { // Standard
			Object.defineProperty(this,"volume", { 
				get: this.getVolume.bind(this),
				set: this.setVolume.bind(this)
			});
			
			Object.defineProperty(this,"loop", { 
				get: this.getLooping.bind(this),
				set: this.setLooping.bind(this)
			});
		}
		else if( this.__defineGetter__ ) { // Non-standard
			this.__defineGetter__('volume', this.getVolume.bind(this));
			this.__defineSetter__('volume', this.setVolume.bind(this));
		
			this.__defineGetter__('loop', this.getLooping.bind(this));
			this.__defineSetter__('loop', this.setLooping.bind(this));
		}
	},
	
	
	add: function( music, name ) {
		/*console.log('adding music!');
		console.log(music);
		console.log(name);*/

		if( !ig.Sound.enabled ) {
			return;
		}
		
		var path = music instanceof ig.Sound ? music.path : music;
		
		var track = ig.soundManager.load(path, false);
		track.loop = this._loop;
		track.volume = this._volume;
		track.addEventListener( 'ended', this._endedCallbackBound, false );
		this.tracks.push( track );
		
		if( name ) {
			this.namedTracks[name] = track;
		}
		
		if( !this.currentTrack ) {
			this.currentTrack = track;
		}
	},
	
	
	next: function() {
		if( !this.tracks.length ) { return; }
		
		this.stop();
		this.currentIndex = this.random
			? Math.floor(Math.random() * this.tracks.length)
			: (this.currentIndex + 1) % this.tracks.length;
		this.currentTrack = this.tracks[this.currentIndex];
		this.play();
	},
	
	
	pause: function() {
		if( !this.currentTrack ) { return; }
		this.currentTrack.pause();
	},
	
	
	stop: function() {
		if( !this.currentTrack ) { return; }
		this.currentTrack.pause();
		this.currentTrack.currentTime = 0;
	},
	
	
	play: function( name ) {
		// If a name was provided, stop playing the current track (if any)
		// and play the named track
		/*if( name && this.namedTracks[name] ) {
			var newTrack = this.namedTracks[name];
			if( newTrack != this.currentTrack ) {
				this.stop();
				this.currentTrack = newTrack;
			}
		}
		else if( !this.currentTrack ) { 
			return; 
		}
        
		//soundstarted(this.path);
		this.currentTrack.onstalled = this._stalledCallback;

        //resets track back to normal
		this.currentTrack.currentTime = 0;
		this.currentTrack.play();*/
	},
	
		
	getLooping: function() {
		return this._loop;
	},
	
	
	setLooping: function( l ) {
		this._loop = l;
		for( var i in this.tracks ) {
			this.tracks[i].loop = l;
		}
	},	
		
	
	getVolume: function() {
		return this._volume;
	},
	
	
	setVolume: function( v ) {
		this._volume = v.limit(0,1);
		for( var i in this.tracks ) {
			this.tracks[i].volume = this._volume;
		}
	},
	
	
	fadeOut: function( time ) {
		if( !this.currentTrack ) { return; }
		
		clearInterval( this._fadeInterval );
		this.fadeTimer = new ig.Timer( time );
		this._fadeInterval = setInterval( this._fadeStep.bind(this), 50 );
	},
	
	
	_fadeStep: function() {
		var v = this.fadeTimer.delta()
			.map(-this.fadeTimer.target, 0, 1, 0)
			.limit( 0, 1 )
			* this._volume;
		
		if( v <= 0.01 ) {
			this.stop();
			this.currentTrack.volume = this._volume;
			clearInterval( this._fadeInterval );
		}
		else {
			this.currentTrack.volume = v;
		}
	},
	
	_endedCallback: function () {
	    soundended(this.path);
	    if (this._loop) {
	        this.stop();
			this.play();
		}
		else {
			this.next();
		}
	},
	_stalledCallback: function () {
	    console.log("STALLED");

	}
});



ig.Sound = ig.Class.extend({
	path: '',
	volume: 1,
	currentClip: null,
	multiChannel: true,
	
	
	init: function (path, multiChannel, volume) {
        this.volume = volume || 1;
		this.path = path;
		this.multiChannel = (multiChannel !== false);
		this.load();
	},
	
	
	load: function( loadCallback ) {
		if( !ig.Sound.enabled ) {
			if( loadCallback ) {
				loadCallback( this.path, true );
			}
			return;
		}
		
		if( ig.ready ) {
			ig.soundManager.load( this.path, this.multiChannel, loadCallback );
		}
		else {
			ig.addResource( this );
		}
	},
	
	
	play: function() {
		if( !ig.Sound.enabled ) {
			return;
		}
		
		this.currentClip = ig.soundManager.get( this.path );
		this.currentClip.volume = Math.min(ig.soundManager.volume * this.volume, 1);
		this.currentClip.playbackRate = 1;
		this.currentClip.play();
		//soundstarted(this.path);
        
		var that = this;
		var ended = function () {
		    //soundended(that.path);
		}; //setup passing paramenters

		this.currentClip.onended = ended;
	},
	
	
	stop: function() {
		if( this.currentClip ) {
			this.currentClip.pause();
			this.currentClip.currentTime = 0;
		}
	}
});

ig.Sound.FORMAT = {
	MP3: {ext: 'mp3', mime: 'audio/mpeg'},
	M4A: {ext: 'm4a', mime: 'audio/mp4; codecs=mp4a'},
	OGG: {ext: 'ogg', mime: 'audio/ogg; codecs=vorbis'},
	WEBM: {ext: 'webm', mime: 'audio/webm; codecs=vorbis'},
	CAF: {ext: 'caf', mime: 'audio/x-caf'}
};
ig.Sound.use = [ig.Sound.FORMAT.OGG, ig.Sound.FORMAT.MP3];
ig.Sound.channels = 4;
ig.Sound.enabled = true;

deviceMusic = {};

createSoundObject = function (path, multi, loop, volume) {
    /*
	var s;
	var done_callback = function () { };
	volume = volume || 1;
	if(typeof(Media) == 'undefined'){
		s = new ig.Sound(path, multi, volume);
	}else{
		var p = path.replace('*', 'aif');
		if(loop){
			done_callback = function(){
				this.play();
			};
		}
		s = new Media(p, done_callback, function(e){
				console.log('error: ');
				console.log(e);
			});
	}
	return s;*/
};

playSound = function (sound_obj) {
    console.log("SOUND TRYING: " + sound_obj);
	/*if(!ig.Sound.enabled){
		return false;
	}
	sound_obj.play();*/
};

stopSound = function (sound_obj) {
    /*
    if (!ig.Sound.enabled) {
        return false;
    }
    sound_obj.stop();
    */
}


addMusic = function (sound_obj, string) {
    /*
	if(typeof(Media) == 'undefined'){
		ig.music.add(sound_obj, string);
	}else{
		deviceMusic[string] = sound_obj;
	}*/
};

pauseAllMusic = function () {
    /*
    if (typeof (Media) == 'undefined') {
		ig.music.stop();
		return false;
	}
	for (var key in deviceMusic) {
		var obj = deviceMusic[key];
		obj.pause();
	}*/
};

pauseCurrentMusic = function(current_track){
	deviceMusic[current_track].pause();
};

playMusic = function (sound_string) {
    /*
	if(!ig.Sound.enabled){
		return false;
	}
	if (ig.music.namedTracks && ig.music.currentTrack != ig.music.namedTracks[sound_string]) {
	    pauseAllMusic();
	}
	

	if(typeof(Media) == 'undefined'){
		ig.music.play(sound_string);
	}else{
		deviceMusic[sound_string].seekTo(1);
		deviceMusic[sound_string].play();
	};*/
};

});
