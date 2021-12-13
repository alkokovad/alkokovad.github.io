/************************************/
/** ------ EaselJS additions------ **/
/************************************/
createjs.Graphics.prototype.dashedLineTo = function(x1, y1, x2, y2, dashLen) {
    this.moveTo(x1, y1);
    
    var dX = x2 - x1;
    var dY = y2 - y1;
    var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
    var dashX = dX / dashes;
    var dashY = dY / dashes;
    
    var q = 0;
    while (q++ < dashes) {
        x1 += dashX;
        y1 += dashY;
        this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
    }
    this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x2, y2); 
}

/*****************************/
/** ------ Main game ------ **/
/*****************************/
var SpaceRocks = (function() {
	var _this;

	// Global static vars
	var MAX_WIDTH = ($("html").hasClass("touch") && ($("html").hasClass("ios") || $("html").hasClass("android")))? 2048 : 268;
	var MAX_HEIGHT = ($("html").hasClass("touch") && ($("html").hasClass("ios") || $("html").hasClass("android")))? 2048 : 479;
	var TARGET_FPS = 60;

	var MOVEMENT_THRESHOLD = 5 * window.devicePixelRatio; // Number of pixels user drags before being considered a touch move
	var INITIAL_ASTEROID_COUNT = 2;

	var DEBUG = false;

	// Constructor
	function SpaceRocks() {
		_this = this;
		_this.tickCount = 0;
		_this.shouldRestart = false;

		// Setup physics engine
		_this.physics = new Physics();

		// Expose public functions
		this.start = SpaceRocks.prototype.start;
		this.getDimensions = SpaceRocks.prototype.getDimensions;

		// Generic functions
		$(".button").on("mousedown", function() {
			$(this).addClass("selected");
		})
		$(".button").on("touchdown", function() {
			$(this).addClass("selected");
		})
		$(".button").on("mouseup", function() {
			$(this).removeClass("selected");
		})
		$(".button").on("touchup", function() {
			$(this).removeClass("selected");
		})

		// FPS tracker
		if(DEBUG) {
			_this.meter = new Stats();
			_this.meter.setMode(0);
			_this.meter.domElement.style.position = 'absolute';
			_this.meter.domElement.style.left = '0px';
			_this.meter.domElement.style.top = '0px';
			document.body.appendChild( _this.meter.domElement);
		}

		// Set dimensions
		_this.canvas = document.getElementById("game");
		_this.width = (window.innerWidth <= MAX_WIDTH)? window.innerWidth * window.devicePixelRatio  : MAX_WIDTH * window.devicePixelRatio;
		_this.height = (window.innerHeight <= MAX_HEIGHT)? window.innerHeight * window.devicePixelRatio  : MAX_HEIGHT * window.devicePixelRatio;
		_this.canvas.width = _this.width;
		_this.canvas.height = _this.height;
		_this.canvas.style.width = (_this.width / window.devicePixelRatio) + "px";
		_this.canvas.style.height = (_this.height / window.devicePixelRatio) + "px";
		$(".game").css({
			"width" : _this.canvas.style.width,
			"height" : _this.canvas.style.height
		});
		$(_this.canvas).addClass("animated fadeIn");

		// Double initial asteroid count for tablet devices
		if(_this.canvas.width * _this.canvas.height > 2500) {
			INITIAL_ASTEROID_COUNT *= 2;
		}

		// Create stage and enable touch
		_this.stage = new createjs.Stage("game");
		createjs.Touch.enable(_this.stage);
		_this.stage.enableMouseOver(10);
		_this.stage.snapToPixelEnabled = true;	

		// Initialise game and attach click and touch observers
		if($(".touch-splash:visible").length === 0) {
			_this.attachObservers();	
			_this.init();
		} else {
			$(".touch-splash .play-now")[0].addEventListener("touchend", function() {
				$(".touch-splash").addClass("fadeOut animated");
				$(".touch-splash").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
					$(this).remove();
				});

				_this.attachObservers();	
				_this.init();
			})
		}
	}

	SpaceRocks.prototype = {
		constructor : SpaceRocks,
		/***********************************/
		/** ------ Setup functions ------ **/
		/***********************************/
		init : function() {
			// Reset state
			_this.stage.removeAllChildren();
			_this.entities = new LinkedList();
			_this.mouseDown = null;
			_this.mouseUp = null;
			_this.mouseMove = null;	

			// Show intro screen
			_this.showIntroScreen();
		},
		showIntroScreen : function() {
			$(document.body).addClass("intro");
			_this.addStars();
			_this.stage.update();

			// Add intro animations
			$(".line.red").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
				$("h1.light").addClass("fadeInUp animated").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
					$("h1.extra-bold").addClass("bounceIn animated");
					$("#intro .button").addClass("fadeIn animated");
				});
			});
		},
		startGame : function() {
			// Reset all dynamic aspects of the game
			_this.score = 0;

			// Setup entity array
			_this.setupEntities(function() {
				// Current level
				_this.level = 1;

				// Setup target FPS
				createjs.Ticker.setFPS(TARGET_FPS);
				createjs.Ticker.addEventListener("tick", _this.tick);
			});
		},
		setupEntities : function(callback) {
			// Create navigation
			_this.navigationContainer = new createjs.Container();
			_this.navigationContainer.visible = false;

			var navigationCircle = new createjs.Shape();
			navigationCircle.name = "navigationCircle";
			navigationCircle.graphics.setStrokeStyle(2 * window.devicePixelRatio).beginStroke("#15558b").drawCircle(0, 0, 35 * window.devicePixelRatio, 35 * window.devicePixelRatio);
			navigationCircle.cache(-((35 * window.devicePixelRatio) + 8), -((35 * window.devicePixelRatio) + 8), (35 * window.devicePixelRatio) * 2 + 16, (35 * window.devicePixelRatio) * 2 + 16, window.devicePixelRatio);

			var navigationLine = new createjs.Shape();
			navigationLine.name = "navigationLine";
			_this.navigationContainer.addChild(navigationCircle, navigationLine);
			_this.stage.addChildAt(_this.navigationContainer, 1);

			// Create player
			_this.player = new Player(_this);
			_this.player.x = (_this.width / 2) - (_this.player.width / 2);
			_this.player.y = (_this.height / 2) - (_this.player.height / 2);
			_this.player.setupShape(function() {
				// Add player entity
				_this.addEntity(_this.player, 2);
				// Create HUD
				_this.hud = new HUD(_this, _this.player);
				// Add initial entities
				_this.addInitialAsteroids();
				// Execute callback
				callback();
			});
		},
		attachObservers : function() {
			// Intro button
			$("#intro .button").click(function() {
				// Disable touch events for intro screen
				$("#intro").addClass("no-pointer-events");
				$(".line.red").addClass("slideOutRight");
				$("h1.light, h1.extra-bold, #intro .button").addClass("fadeOut").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
					$(".line.red").removeClass("slideOutRight");
					$("h1.light, h1.extra-bold, #intro .button").removeClass("fadeOut");
					$("#ui #in-game #hud").addClass("animated fadeInDown");
					$("#intro").removeClass("no-pointer-events");
					$(document.body).removeClass("intro").addClass("in-game");
				});

				_this.startGame();
			});

			// Game over button
			$("#game-over .button").click(function() {
				$(document.body).removeClass("game-over");
				$("#game-over .overlay").removeClass("animated fadeInDown");
				$("#game-over .overlay .social, #game-over .overlay .button").removeClass("animated fadeIn");
				_this.shouldRestart = true;
			});

			// Post to Facebook button
			$("#game-over .sc--facebook").click(function() {
				_this.postToFacebook(_this.score);
			});
			// Post to Twitter button
			$("#game-over .sc--twitter").click(function() {
				_this.postToTwitter(_this.score);
			})

			// Prevent scrolling on page
			document.addEventListener(
			    "touchstart",
			    function() { return false; },
			    false
			);

			 _this.canvas.addEventListener("touchstart", function(e) {
			 	_this.mouseDown = e;

			 	// Ensure that x and y coords are mapped for render function
			 	_this.mouseDown.x = e.changedTouches[0].clientX * window.devicePixelRatio;
			 	_this.mouseDown.y = e.changedTouches[0].clientY * window.devicePixelRatio;
			 });

			 // Manually threshold pressmove event
			_this.canvas.addEventListener("touchmove", function(e) {
			 	_this.mouseMove = e;

				// Ensure that x and y coords are mapped for render function
			 	_this.mouseMove.x = e.changedTouches[0].clientX * window.devicePixelRatio;
			 	_this.mouseMove.y = e.changedTouches[0].clientY * window.devicePixelRatio;
			 });

			_this.canvas.addEventListener("touchend", function(e) {	
			 	_this.mouseUp = e;
			 	if(_this.mouseUp.targetTouches.length === 0) {
			 		_this.mouseDown = null;
			 	}

			 	// Ensure that x and y coords are mapped for render function
			 	_this.mouseUp.x = e.changedTouches[0].clientX * window.devicePixelRatio;
			 	_this.mouseUp.y = e.changedTouches[0].clientY * window.devicePixelRatio;
			});

			_this.canvas.addEventListener("mousedown", function(e) {
				// Retina displays do not return correct relative coordinates
			 	var overridenEvent = {
			 		x : e.layerX * window.devicePixelRatio,
			 		y : e.layerY * window.devicePixelRatio
			 	}
			 	_this.mouseDown = overridenEvent;
			});

			_this.canvas.addEventListener("mousemove", function(e) {
				// Retina displays do not return correct relative coordinates
			 	var overridenEvent = {
			 		x : e.layerX * window.devicePixelRatio,
			 		y : e.layerY * window.devicePixelRatio

			 	}
				_this.mouseMove = overridenEvent;
			});

			_this.canvas.addEventListener("mouseup", function(e) {
				// Retina displays do not return correct relative coordinates
			 	var overridenEvent = {
			 		x : e.layerX * window.devicePixelRatio,
			 		y : e.layerY * window.devicePixelRatio

			 	}
			 	_this.mouseUp = overridenEvent;
			 	_this.mouseDown = null;
			});
		},
		/****************************************/
		/** ------ Navigation functions ------ **/
		/****************************************/
		updateNavigation : function() {
			// If mouse is released and navigation is not shown
			// or use has touched with a different finger
			if(_this.mouseUp !== null && (!_this.navigationContainer.visible || 
				_this.mouseUp.targetTouches != null && _this.mouseUp.targetTouches.length > 0)) {

				_this.player.fireMissile(_this.mouseUp.x, _this.mouseUp.y);
				_this.mouseUp = null;
			}

			// If user is click dragging show navigation if movement is over thresholding
			if(_this.mouseDown !== null && _this.mouseMove !== null) {
				var distance = (Math.abs(_this.mouseDown.x - _this.mouseMove.x) + Math.abs(_this.mouseDown.y - _this.mouseMove.y)) / 2;
		 		if(distance > MOVEMENT_THRESHOLD) {
		 			_this.navigationContainer.visible = true;
					_this.lastTouchX = _this.mouseMove.x;
					_this.lastTouchY = _this.mouseMove.y;
					_this.player.setHeading(_this.mouseMove.x, _this.mouseMove.y);
		 		}
			} else {
				_this.player.setHeading(null, null);
				_this.navigationContainer.visible = false;
				_this.mouseUp = null;
				_this.mouseMove = null;
			}
		},

		renderNavigation : function() {
			// Circle where finger is
			var navigationCircle = _this.navigationContainer.getChildByName("navigationCircle");
			var navigationLine = _this.navigationContainer.getChildByName("navigationLine");
			navigationCircle.x = _this.lastTouchX;
			navigationCircle.y = _this.lastTouchY;

			navigationLine.graphics.clear().setStrokeStyle(2 * window.devicePixelRatio).beginStroke("#15558b").dashedLineTo(this.player.x, this.player.y, this.lastTouchX, this.lastTouchY, 4);
		},
		addEntity : function(entity, index) {
			//if(entity.className() === "Particle") return;

			// Adds object that conforms to entity interface
			_this.entities.push(entity);
			if(index != null && _this.stage.length > index) {
				_this.stage.addChildAt(entity.shape, index);
			} else {
				_this.stage.addChild(entity.shape);
			}
		},
		addShape : function(shape, index) {
			// Ensure everuthing is a Bitmap for WebGL compatibility
			if(shape.graphics != null) {
				shape = new createjs.Bitmap(shape.cacheCanvas);
			}			

			if(index != null && _this.stage.length > index) {
				_this.stage.addChildAt(shape, index);
			} else {
				_this.stage.addChild(shape);
			}
		},
		removeShape : function(shape) {
			_this.stage.removeChild(shape);
		},
		getDimensions : function() {
			return { width: _this.width, height: _this.height};
		},
		// Needed for when alien is trying to fire at player
		getPlayerLocaton : function() {
			if(!_this.player.isDead()) {
				return { 
					x : _this.player.x, 
					y : _this.player.y 
				};
			} else {
				// GHOSTS!!
				return {
					x : Math.random() * _this.width,
					y : Math.random() * _this.height
				}
			}
		},
		/***************************************/
		/** ------ Game tick functions ------ **/
		/***************************************/
		tick : function() {
			// Restart requested
			if(_this.shouldRestart) {
				_this.shouldRestart = false;
				_this.init();
				return;
			}

			// FPS meter
			if(DEBUG) {_this.meter.begin();}
			++_this.tickCount;

			if(!_this.player.isDead()) {
				// Update and render navigation
				_this.updateNavigation();
				_this.renderNavigation();

				// Update HUD 
				_this.hud.update();
			}

			// Update and render
			_this.tickEntities();
			_this.stage.update();

			// Check for game over
			_this.checkGameOver();

			// Possibly add alien
			if(_this.aliensPresent < Math.floor(_this.level / 2 + 1) || _this.player.isDead()) {
				_this.addAlien();
			}

			// Check for end level / game conditions
			if(!_this.player.isDead()) {
				_this.checkRemainingAsteroids();
			}

			if(DEBUG) {_this.meter.end();}
		},
		tickEntities : function() {
			// Reset entity present flags
			_this.aliensPresent = 0;
			_this.asteroidPresent = false;

			// Update and render loop
			var node = _this.entities.getHead();
			while (node !== null) {
				var e1 = node.data;

				// Make presence of certain entities
				if(e1.className() === "Alien") { ++_this.aliensPresent; }
				if(e1.className() === "Asteroid") { _this.asteroidPresent = true; }

				// Update and render entity
				e1.update();
				e1.render();

				// Try and collide with all other entities in list
				var nestedNode = node.next;
				while (nestedNode !== null) {
					var e2 = nestedNode.data;
					_this.physics.collide(e1, e2);
					nestedNode = nestedNode.next;
				}
				// Remove this entity if it's dead
				if(e1.isDead()) {
					_this.stage.removeChild(e1.shape);
					_this.entities.remove(node);
					nestedNode = node.next;
				}
				node = node.next;
			}
		},
		addAlien : function() {
			// Alien has 50% chance of being added every 10 seconds
			var alienInterval = 60 * 10 / _this.level;
			var alienChance = 0.5;

			if(_this.tickCount % alienInterval === 0) {
				if(Math.random() > alienChance) {
					// No alien - add one
					var alien = new Alien();
				
					// Set random starting location along left side of screen
					alien.x = 0;
					alien.y = _this.height * Math.random();

					alien.setupShape(function(){
						// Add to entity list only after shape has been setup
						_this.addEntity(alien);
					});
				}
			}	

		},
		// If no asteroids are left level up and add back asteroids
		checkRemainingAsteroids : function() {
			// No asteroids found - level up and add back initial asteroids
			if(!_this.asteroidPresent) {
				++_this.level;
				_this.addInitialAsteroids();
			}
		},
		addInitialAsteroids : function() {
			// Create asteroids
			for(var i = 0; i < INITIAL_ASTEROID_COUNT; i++) {
				_this.addAsteroid();
			}
		},
		addAsteroid : function() {
			var asteroid = new Asteroid();
			// Set random starting corner
			asteroid.x = Math.random() * _this.width / 3;
			if(Math.floor(Math.random() * 2) % 2 === 0) {
				asteroid.x += (_this.width / 3) * 2;
			}
			asteroid.y = Math.random() * _this.height / 3;
			if(Math.floor(Math.random() * 2) % 2 === 0) {
				asteroid.y += (_this.height / 3) * 2;
			}
			asteroid.setShape(new createjs.Shape());

			// Add to entity list
			_this.addEntity(asteroid, 3);
		},
		// Called by other functions when score should increase
		addScore : function(points, x, y) {
			if(!_this.player.isDead()) {
				points *= _this.level;
				this.score += (points * _this.level);
				_this.hud.triggerScoreAnimation(points, x, y);
			}
		},
		addStars : function() {
			var particleCount = 200;
			var starsShape = new createjs.Shape();

			for(var i = 0; i < particleCount; i++) {
				var size = ((Math.random() * 2) + 1) * window.devicePixelRatio;
				var x = Math.random() * _this.width;
				var y = Math.random() * _this.height;

				var color = "" + (Math.round(Math.random() * 255)).toString(16);
				color = "#" + color + color + color;

				starsShape.graphics.beginFill(color).drawRect(x, y, size, size);
			}
			starsShape.cache(0, 0, _this.width, _this.height);

			_this.addShape(starsShape, 0);
		},
		checkGameOver : function() {
			if($(document.body).hasClass("in-game") && _this.player.isDead() 
				&& !$(document.body).hasClass("game-over")) {
				
				$(document.body).removeClass("in-game");
				$(document.body).addClass("game-over");
				$("#game-over .overlay").addClass("animated slideInDown");

				if(_this.score !== 0) {
					_this.animateScoreBoard();
				} else {
					$("#game-over .overlay .social, #game-over .overlay .button").addClass("animated fadeIn");
				}
			}
		},
		animateScoreBoard : function() {
			var animateFunction = function() {
				if(animatedScore > _this.score) {
					clearInterval(animateScoreInterval);
					$("#game-over .overlay .score").html(_this.score);
					$("#game-over .overlay .social, #game-over .overlay .button").addClass("animated fadeIn");
				} else {
					animatedScore += pointsPerUpdate;
					$("#game-over .overlay .score").html(Math.floor(animatedScore));
				}
			}
			var animatedScore = 0;
			var maxAnimationTime = 1500;
			var updateInterval = 1000 / 60;
			var pointsPerUpdate = _this.score / (maxAnimationTime / updateInterval);

			var animateScoreInterval = setInterval(animateFunction, updateInterval);
			var scoreAnimationStartTime = new Date().getTime();
		},
		postToFacebook : function(score) {
			FB.ui(
		      {
		       method: 'feed',
		       name: 'Space Rocks',
		       caption: 'A modern take on an arcade classic',
		       description: (
		          'Space Rocks is pretty cool ya\'ll. I just scored ' + score +
		          '. Try beat it!'
		       ),
		       href : window.location.href,
		       link: window.location.href,
		       picture: 'https://raw.githubusercontent.com/jrgrafton/asteroids/gh-pages/production/img/app-icon.png',
			   actions: [ { name: 'via Space Rocks', link : window.location.href}]
		      },
		      function(response) {}
		    );
		},
		postToTwitter : function(score) {
			var msg = 'Space Rocks is pretty cool ya\'ll. I just scored ' + score +
				'. Try beat it! ' + window.location.href;
			window.open("https://twitter.com/intent/tweet?source=webclient&text=" + msg, "_blank");
		}
	}

	return SpaceRocks;
})();

window.onload = function() {
	window.spaceRocks = new SpaceRocks(); 
}