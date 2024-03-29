ig.module(
	'weltmeister.config'
)
.defines(function(){

wm.config = {
	project: {
		'modulePath': 'lib/',
		'entityFiles': ['lib/game/entities/*.js', 'lib/game/entities/tutorial/*.js', 'lib/game/entities/suburbia/*.js', 'lib/game/entities/pirate/*.js'],
		'levelPath': 'lib/game/levels/',
		'outputFormat': 'module', // 'module' or 'json'
		'prettyPrint': false
	},
	
	'layerDefaults': {
		'width': 30,
		'height': 20,
		'tilesize': 8,
		'startheight': 0
	},
	
	'askBeforeClose': true,
	'loadLastLevel': true,
	
	'entityGrid': 4,
	'undoLevels': 50,
	
	'binds': {
		'MOUSE1': 'draw',
		'MOUSE2': 'drag',
		'SHIFT': 'select',
		'CTRL': 'drag',
		'SPACE': 'menu',
		'DELETE': 'delete',
		'BACKSPACE': 'delete',
		'G': 'grid',
		'C': 'clone',
		'Z': 'undo',
		'Y': 'redo',
		'RIGHT_ARROW': 'moveRight',
		'LEFT_ARROW': 'moveLeft',
		'UP_ARROW': 'scrollup',
		'DOWN_ARROW': 'scrolldown'
	},
	
	'view': {
		'zoom': 1,
		'grid': false
	},
	
	'labels': {
		'draw': true,
		'step': 32,
		'font': '10px Bitstream Vera Sans Mono, Monaco, sans-serif'
	},
	
	'colors': {
		'clear': '#000000',
		'highlight': '#ceff36',
		'primary': '#ffffff',
		'secondary': '#555555',
		'selection': '#ff9933'
	},
	
	'collisionTiles': {
		'path': 'lib/weltmeister/collisiontiles-64.png',
		'tilesize': 64
	},
	
	'api': {
		'save': 'lib/weltmeister/api/save.php',
		'browse': 'lib/weltmeister/api/browse.php',
		'glob': 'lib/weltmeister/api/glob.php'
	}
};

});