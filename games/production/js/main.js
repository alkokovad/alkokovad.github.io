var SpaceRocks = (function() {
	var MAX_WIDTH = ($("html").hasClass("touch") && ($("html").hasClass("ios") || $("html").hasClass("android")))? 2048 : 268;
	var MAX_HEIGHT = ($("html").hasClass("touch") && ($("html").hasClass("ios") || $("html").hasClass("android")))? 2048 : 479;
	var TARGET_FPS = 60;

	var MOVEMENT_THRESHOLD = 5 * window.devicePixelRatio; // Number of pixels user drags before being considered a touch move
	var INITIAL_ASTEROID_COUNT = 2;

	var DEBUG = false;

	function SpaceRocks() {
		// Object variables
		this.lastTickTime = null;
		this.tickCount = 0;
		this.shouldRestart = false;
		this.paused = false;

		// Setup physics engine
		this.physics = new Physics();

		// FPS tracker
		if(DEBUG) {
			this.meter = new Stats();
			this.meter.setMode(0);
			this.meter.domElement.style.position = 'absolute';
			this.meter.domElement.style.left = '0px';
			this.meter.domElement.style.top = '0px';
			document.body.appendChild(this.meter.domElement);
		}

		// Setup button
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
		});

		// Set dimensions
		this.resizeToScreen();
		$(this.canvas).addClass("animated fadeIn");

		// Double initial asteroid count for tablet devices
		if((this.width / window.devicePixelRatio) * (this.height / window.devicePixelRatio) > 250000) { /* Over 500 * 500? Add more asteroids */
			INITIAL_ASTEROID_COUNT *= 2;
		}

		// Create stage and enable touch
		this.stage = new createjs.Stage("game");
		createjs.Touch.enable(this.stage);
		this.stage.enableMouseOver(60);
		this.stage.snapToPixelEnabled = true;

		// Setup target FPS
		createjs.Ticker.setFPS(TARGET_FPS);

		// Initialise game and attach click and touch observers
		this.observers = new Observers(this, this.canvas);
	}

	SpaceRocks.prototype = {
		constructor : SpaceRocks,
		/***********************************/
		/** ------ Setup functions ------ **/
		/***********************************/
		init : function() {
			// Reset state
			this.stage.removeAllChildren();
			this.entities = new LinkedList();

			// Add stars
			this.addStars();
			this.stage.update();	

			// Show intro screen
			this.showIntroScreen();
		},
		showIntroScreen : function() {
			// Add intro animations
			$(document.body).addClass("intro");
			$(".line.red").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
				$("h1.light").addClass("fadeInUp animated").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
					$("h1.extra-bold").addClass("bounceIn animated");
					$("#intro .button").addClass("fadeIn animated");
				});
			});
		},
		startGame : function() {
			// Reset all dynamic aspects of the game
			this.score = 0;
			this.level = 1;

			// Setup entity array
			this.paused = true; // Ensure level up is not accidently triggered during entity setup
			this.setupEntities(function() {
				$(".level").html(this.level);
				this.triggerLevelUp();

				if(this.lastTickTime === null) {
					this.lastTickTime = new Date().getTime();
					createjs.Ticker.addEventListener("tick", this.tick.bind(this));
				}
			}.bind(this));
		},
		setupEntities : function(callback) {
			// Create navigation
			this.navigationContainer = new createjs.Container();
			this.navigationContainer.visible = false;

			var navigationCircle = new createjs.Shape();
			navigationCircle.name = "navigationCircle";
			navigationCircle.graphics.setStrokeStyle(2 * window.devicePixelRatio).beginStroke("#15558b").drawCircle(0, 0, 35 * window.devicePixelRatio, 35 * window.devicePixelRatio);
			navigationCircle.cache(-((35 * window.devicePixelRatio) + 8), -((35 * window.devicePixelRatio) + 8), (35 * window.devicePixelRatio) * 2 + 16, (35 * window.devicePixelRatio) * 2 + 16, window.devicePixelRatio);

			var navigationLine = new createjs.Shape();
			navigationLine.name = "navigationLine";
			this.navigationContainer.addChild(navigationCircle, navigationLine);
			this.stage.addChildAt(this.navigationContainer, 1);

			// Create player
			this.player = new Player(this);
			this.player.x = (this.width / 2) - (this.player.width / 2);
			this.player.y = (this.height / 2) - (this.player.height / 2);
			this.player.setupShape(function() {
				// Add player entity
				this.addEntity(this.player, 2);
				// Create HUD
				this.hud = new HUD(this, this.player);
				this.hud.update();
				// Add initial entities
				this.addInitialAsteroids();
				// Execute callback
				callback();
			}.bind(this));
		},
		/**************************************/
		/** ------ Observer functions ------ **/
		/**************************************/
		resizeToScreen : function() {
			this.canvas = document.getElementById("game");
			this.canvas.screencanvas = true;
			this.width = ($(window).width() <= MAX_WIDTH)? $(window).width() * window.devicePixelRatio  : MAX_WIDTH * window.devicePixelRatio;
			this.height = ($(window).height() <= MAX_HEIGHT)? $(window).height() * window.devicePixelRatio  : MAX_HEIGHT * window.devicePixelRatio;
			this.canvas.width = this.width;
			this.canvas.height = this.height;
			this.canvas.style.width = (this.width / window.devicePixelRatio) + "px";
			this.canvas.style.height = (this.height / window.devicePixelRatio) + "px";
			$(".game").css({
				"width" : this.canvas.style.width,
				"height" : this.canvas.style.height
			});
		},

		/****************************************/
		/** ------ Navigation functions ------ **/
		/****************************************/
		updateNavigation : function() {
			// If mouse is released and navigation is not shown
			// or use has touched with a different finger
			if(this.observers.mouseUp !== null && (!this.navigationContainer.visible || 
				this.observers.mouseUp.targetTouches != null && this.observers.mouseUp.targetTouches.length > 0)) {

				this.player.fireMissile(this.observers.mouseUp.x, this.observers.mouseUp.y);
				this.observers.mouseUp = null;
			}

			// If user is click dragging show navigation if movement is over thresholding
			if(this.observers.mouseDown !== null && this.observers.mouseMove !== null) {
				var distance = (Math.abs(this.observers.mouseDown.x - this.observers.mouseMove.x) 
					+ Math.abs(this.observers.mouseDown.y - this.observers.mouseMove.y)) / 2;
		 		if(distance > MOVEMENT_THRESHOLD) {
		 			this.navigationContainer.visible = true;
					this.lastTouchX = this.observers.mouseMove.x;
					this.lastTouchY = this.observers.mouseMove.y;
					this.player.setHeading(this.observers.mouseMove.x, this.observers.mouseMove.y);
		 		}
			} else {
				this.player.setHeading(null, null);
				this.navigationContainer.visible = false;
				this.observers.mouseUp = null;
				this.observers.mouseMove = null;
			}
		},
		renderNavigation : function() {
			// Circle where finger is
			var navigationCircle = this.navigationContainer.getChildByName("navigationCircle");
			var navigationLine = this.navigationContainer.getChildByName("navigationLine");
			navigationCircle.x = this.lastTouchX;
			navigationCircle.y = this.lastTouchY;

			navigationLine.graphics.clear().setStrokeStyle(2 * window.devicePixelRatio).beginStroke("#15558b").dashedLineTo(this.player.x, this.player.y, this.lastTouchX, this.lastTouchY, 4);
		},

		/************************************/
		/** ------ Public functions ------ **/
		/************************************/
		addEntity : function(entity, index) {
			//if(entity.className() === "Particle") return;

			// Adds object that conforms to entity interface
			this.entities.push(entity);
			if(index != null && this.stage.children.length > index) {
				this.stage.addChildAt(entity.shape, index);
			} else {
				this.stage.addChild(entity.shape);
			}
		},
		addShape : function(shape, index) {
			// Ensure everything is a Bitmap for WebGL compatibility
			if(shape.graphics != null) {
				shape = new createjs.Bitmap(shape.cacheCanvas);
			}			
			if(index != null && this.stage.children.length > index) {
				this.stage.addChildAt(shape, index);
			} else {
				this.stage.addChild(shape);
			}
		},
		removeShape : function(shape) {
			this.stage.removeChild(shape);
		},
		getDimensions : function() {
			return { width: this.width, height: this.height};
		},
		getPlayerLocaton : function() {
			if(!this.player.isDead()) {
				return { 
					x : this.player.x, 
					y : this.player.y 
				};
			} else {
				// GHOSTS!!
				return {
					x : Math.random() * this.width,
					y : Math.random() * this.height
				}
			}
		},
		addScore : function(points, x, y) {
			if(!this.player.isDead()) {
				points *= this.level;
				this.score += (points * this.level);
				this.hud.triggerScoreAnimation(points, x, y);
			}
		},
		/***************************************/
		/** ------ Game tick functions ------ **/
		/***************************************/
		tick : function() {
			// FPS meter
			if(DEBUG) {this.meter.begin();}
			++this.tickCount;

			// Check for level up state
			if(this.paused === true) {
				// Keep ticking entity last update time so we don't get sudden jump after game is resumed
				var node = this.entities.getHead();
				while (node !== null) {
					node.data.lastTickTime = new Date().getTime();
					node = node.next;
				}
				return;
			}

			// Aliens can still be added during game over state!
			if(this.aliensPresent < Math.floor(this.level / 2 + 1) || this.player.isDead()) {
				this.addAlien();
			}

			// Restart requested
			if(this.shouldRestart === true) {
				this.shouldRestart = false;
				this.init();
				return;
			}

			// Update and render navigation
			this.updateNavigation();
			this.renderNavigation();

			// Update HUD 
			this.hud.update();

			// Update and render entities
			this.tickEntities();
			this.stage.update();
			// Update lastTickTime for entity FPS independent movement
			this.lastTickTime = new Date().getTime();

			// Check for game over
			this.checkGameOver();

			// Check for end level conditions
			if(!this.player.isDead()) {
				this.checkRemainingAsteroids();
			}

			if(DEBUG) {this.meter.end();}
		},
		tickEntities : function() {
			// Reset entity present flags
			this.aliensPresent = 0;
			this.asteroidPresent = false;

			// Update and render loop
			var node = this.entities.getHead();
			while (node !== null) {
				var e1 = node.data;

				// Make presence of certain entities
				if(e1.className() === "Alien") { ++this.aliensPresent; }
				if(e1.className() === "Asteroid") { this.asteroidPresent = true; }

				// Update and render entity
				e1.update();
				e1.render();
				e1.lastTickTime = new Date().getTime();

				// Try and collide with all other entities in list
				var nestedNode = node.next;
				while (nestedNode !== null) {
					var e2 = nestedNode.data;
					this.physics.collide(e1, e2);
					nestedNode = nestedNode.next;
				}
				// Remove this entity if it's dead
				if(e1.isDead()) {
					this.stage.removeChild(e1.shape);
					this.entities.remove(node);
					nestedNode = node.next;
				}
				node = node.next;
			}
		},
		triggerLevelUp : function() {
			this.paused = true;
			$("#level-up").addClass("active");
			$("#level-up").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
				this.paused = false;
				$("#level-up").removeClass("active");
			}.bind(this));
		},
		checkRemainingAsteroids : function() {
			// If no asteroids are left level up and add back asteroids
			if(!this.asteroidPresent) {
				++this.level;
				$(".level").html(this.level);
				this.triggerLevelUp();
				this.addInitialAsteroids();
			}
		},
		addInitialAsteroids : function() {
			// Create asteroids
			for(var i = 0; i < INITIAL_ASTEROID_COUNT; i++) {
				this.addAsteroid();
			}
		},
		addAsteroid : function() {
			var asteroid = new Asteroid();
			asteroid.x = Math.random() * this.width / 3;
			if(Math.floor(Math.random() * 2) % 2 === 0) {
				asteroid.x += (this.width / 3) * 2;
			}
			asteroid.y = Math.random() * this.height / 3;
			if(Math.floor(Math.random() * 2) % 2 === 0) {
				asteroid.y += (this.height / 3) * 2;
			}
			asteroid.setShape(new createjs.Shape());

			// Add to entity list
			this.addEntity(asteroid, 3);
		},
		addStars : function() {
			if(this.starsShape == null) {
				this.starsShape = new createjs.Shape();
				this.starsShape.tickEnabled = false;
			} else {
				this.starsShape.graphics.clear();
				this.stage.removeChildAt(0);
			}
			
			var particleCount = 300;
			for(var i = 0; i < particleCount; i++) {
				var size = ((Math.random() * 2) + 1) * window.devicePixelRatio;
				var x = Math.random() * this.width;
				var y = Math.random() * this.height;

				var color = "" + (Math.round(Math.random() * 255)).toString(16);
				color = "#" + color + color + color;

				this.starsShape.graphics.beginFill(color).drawRect(x, y, size, size);
			}

			this.starsShape.cache(0, 0, this.width, this.height);
			this.addShape(this.starsShape, 0);
		},
		addAlien : function() {
			// Alien has 50% chance of being added every 10 seconds
			var alienInterval = 60 * 10 / this.level;
			var alienChance = 0.5;

			if(this.tickCount % alienInterval === 0) {
				if(Math.random() > alienChance) {
					// No alien - add one
					var alien = new Alien();
				
					// Set random starting location along left side of screen
					alien.x = 0;
					alien.y = this.height * Math.random();

					alien.setupShape(function(){
						// Add to entity list only after shape has been setup
						this.addEntity(alien);
					}.bind(this));
				}
			}	

		},
		checkGameOver : function() {
			if($(document.body).hasClass("in-game") && this.player.isDead() 
				&& !$(document.body).hasClass("game-over")) {
				
				$(document.body).removeClass("in-game");
				$(document.body).addClass("game-over");
				$("#game-over .overlay").addClass("animated slideInDown");

				if(this.score !== 0) {
					this.animateScoreBoard();
				} else {
					$("#game-over .overlay .social, #game-over .overlay .button").addClass("animated fadeIn");
				}
			}
		},
		animateScoreBoard : function() {
			var animateFunction = function() {
				if(animatedScore > this.score) {
					clearInterval(animateScoreInterval);
					$("#game-over .overlay .score").html(this.score);
					$("#game-over .overlay .social, #game-over .overlay .button").addClass("animated fadeIn");
				} else {
					animatedScore += pointsPerUpdate;
					$("#game-over .overlay .score").html(Math.floor(animatedScore));
				}
			}
			var animatedScore = 0;
			var maxAnimationTime = 1500;
			var updateInterval = 1000 / 60;
			var pointsPerUpdate = this.score / (maxAnimationTime / updateInterval);

			var animateScoreInterval = setInterval(animateFunction.bind(this), updateInterval);
			var scoreAnimationStartTime = new Date().getTime();
		}
	}

	return SpaceRocks;
})();

window.onload = function() {
	FastClick.attach(document.body);
	window.spaceRocks = new SpaceRocks(); 
}