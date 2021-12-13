var Player = (function(Entity) {
	/*  Static vars */
	// Dimensions
	var WIDTH = 20 * window.devicePixelRatio;
	var HEIGHT = 33 * window.devicePixelRatio;

	// Speed fields
	var ACCELERATION = (0.00000200) * window.devicePixelRatio; // Pixels per ms to add for each pixel distance from heading
	var MAX_SPEED = 0.15 * window.devicePixelRatio; // Pixels per ms
	var TURN_SPEED = 0.00025 * window.devicePixelRatio;; // Speed of turn in MS. 1 = turn to face in 1ms

	// Data fields
	var MAX_MISSILES = 4;
	var MISSILE_RECHARGE_TIME = 750; // in ms
	var MISSILE_INITIAL_SPEED = 1.4; // Mltiplier for missile exit speed
	var INVULNERABLE_TIME = 4000; // ms that player is invulnerable after being killed

	function Player() {
		// Mixin entity base class
		for(var method in Entity) {
			if(this[method] == undefined) {
				this[method] = Entity[method];
			}
		}
		// Scale based on canvas size
		ACCELERATION *= window.spaceRocks.getDimensions().width / (320 * window.devicePixelRatio);
		MAX_SPEED *= window.spaceRocks.getDimensions().width / (320 * window.devicePixelRatio);

		this.lifeCount = 3;
		this.lastTickTime = new Date().getTime();
		this.init();
	} 

	Player.prototype = {
		constructor : Player,
		init : function() {
			/**************************/
			/* START: movement fields */
			/**************************/
			// Location
			this.x = (window.spaceRocks.width / 2) - (WIDTH / 2);
			this.y = (window.spaceRocks.height / 2) - (HEIGHT / 2);

			// Dimensions
			this.width = WIDTH;
			this.height = HEIGHT;

			// Rotation
			this.rotation = 0.0;

			// Velocity components (between 0 and -1)
			this.vx = 0;
			this.vy = 0;

			// Location that ship is heading toward
			this.xHeading = null;
			this.yHeading = null;

			// Speed
			this.speed = 0;

			/************************/
			/* END: movement fields */
			/************************/

			/**********************/
			/* START: data fields */
			/**********************/
			this.missileFired = null; // So that missiles can be fired in update loop
			this.activeMissiles = new Array();
			this.missileCount = 5;
			this.lastMissileFired = new Date().getTime();
			this.lastMissileRecharged = new Date().getTime();

			// Start invulnerable
			this.invulerableStartTime = new Date().getTime();
			this.invulerable = true;
			this.exploded = false;
			/********************/
			/* END: data fields */
			/********************/
		},
		/* Setter function so caching can be setup immediately */
		setupShape : function(callback) {
			var img = new Image();
			img.src = window.location.origin + window.location.pathname + "/img/player.png";
			img.onload = function(e) {
				this.shape = new createjs.Bitmap(e.target);
				this.shape.regX = WIDTH / window.devicePixelRatio;
				this.shape.regY = HEIGHT / window.devicePixelRatio;
				this.shape.snapToPixel = true;
				this.shape.scaleX = 0.5 * window.devicePixelRatio;
				this.shape.scaleY = 0.5 * window.devicePixelRatio;

				// To calculate initial bounding box
				this.render();
				callback();
			}.bind(this);
		},
		setHeading : function(x, y) {
			this.xHeading = x;
			this.yHeading = y;
		},
		fireMissile : function(x, y) {
			this.missileFired = new createjs.Point(x, y); // Will actually be fired in next update loop
		},
		getHitBoxType : function() {
			return Physics.hitBoxTypes.RECTANGLE
		},
		canCollideWidth : function(entity) {
			var collidesWith = new Array("Asteroid", "Alien", "Lazer");
			return collidesWith.indexOf(entity.className()) !== -1;
		},
		explode : function() {
			if(this.invulerable || this.exploded) return;

			// Add particles
			var cx  = this.x + (this.vx * (this.width / 2));
			var cy = this.y + (this.vy * (this.height / 2));

			var particleCount = Math.random() * 5 + 5;
			for(var i = 0; i < particleCount; i++) {
				var size = (Math.random() * 5) + 5;
				var vx = Math.random() * 2 - 1;
				var vy = Math.random() * 2 - 1;

				var particle = new Particle({x : cx, y : cy}, "#bce9ff", {vx : vx, vy : vy}, (this.speed / 1.5 + 0.05), size, "line");
				window.spaceRocks.addEntity(particle, 1);
			}


			// Reset ship after a time
			if(--this.lifeCount !== 0) {
				this.exploded = true;
				this.shape.alpha = 0;

				setTimeout(function() {
					this.init();
					this.invulerableStartTime = new Date().getTime();
					this.invulerable = true;
					this.exploded = false;
				}.bind(this), 500);
			}
		},
		render : function() {
			this.shape.x = this.x;
			this.shape.y = this.y;
			this.shape.rotation = this.rotation;

			// Additional calculations since player origin is in center of object for rotation purposes
			this.shape.setBounds(this.x - (WIDTH / 2), this.y - (HEIGHT / 2), WIDTH , HEIGHT);
		},
		update : function() {
			if(this.exploded) return;
			var timeSinceLastUpdate = new Date().getTime() - this.lastTickTime;

			// Max locations for ship, reset each tick incase device has rotated
			this.maxX =  window.spaceRocks.getDimensions().width;
			this.maxY = window.spaceRocks.getDimensions().height;

			// Invilerability toggle
			if(this.invulerable) {
				createjs.Tween.get(this.shape).to({alpha: 0.2}, 1000, createjs.Ease.linear).
				to({alpha: 1}, 1000, createjs.Ease.linear).
				to({alpha: 0.2}, 1000, createjs.Ease.linear).
				to({alpha: 1}, 1000, createjs.Ease.linear).call(
					function(e) {
						this.invulerable = false;
						createjs.Tween.removeTweens(this.shape);
					}.bind(this)
				);
			}

			// If target heading is not null adjust current heading and speed
			if(this.xHeading !== null && this.yHeading !== null) {
				// Calculate hvx and hvy from current location
				var xDiff = this.xHeading - this.x;
				var yDiff = this.yHeading - this.y;
				var hvx = (1 / (Math.abs(xDiff) + Math.abs(yDiff))) *  xDiff;
				var hvy = (1 / (Math.abs(xDiff) + Math.abs(yDiff))) *  yDiff;

				// Move heading towards target
				if(this.vx !== hvx) {
					var direction = (this.vx > hvx)? -1 : 1;
					this.vx += (timeSinceLastUpdate * TURN_SPEED) * direction;
				}
				if(this.vy !== hvy) {
					var direction = (this.vy > hvy)? -1 : 1;
					this.vy += (timeSinceLastUpdate * TURN_SPEED) * direction;
				}

				// Set speed based on length of line (no need to be preceise with sqrt)
				var distanceToHeading = (xDiff + yDiff) / 2;
				this.speed += (timeSinceLastUpdate * ACCELERATION) * Math.abs(distanceToHeading);
				this.speed = (this.speed > MAX_SPEED)? 0 + MAX_SPEED : this.speed;
			}

			// Update location
			this.x += (timeSinceLastUpdate * this.speed) * this.vx;
			this.y += (timeSinceLastUpdate * this.speed) * this.vy;

			// Clamp location (origin is in center of shape)
			this.x = ((this.x - this.width / 2) > this.maxX)? (0 - this.width / 2) : this.x;
			this.x = ((this.x + this.width / 2) < 0)? (this.maxX + this.width / 2) : this.x;
			this.y = ((this.y - this.height / 2) > this.maxY)? (0 - this.height / 2) : this.y;
			this.y = ((this.y + this.height / 2) < 0)? (this.maxY + this.height / 2) : this.y;

			// Turn to face current heading
			if(this.vy !== 0 && this.vx !== 0) {
				this.rotation = Math.atan2(this.vy, this.vx) * (180 / Math.PI) + 90;
			}

			// Recharge missiles
			if(new Date().getTime() - this.lastMissileFired > MISSILE_RECHARGE_TIME 
				&& new Date().getTime() - this.lastMissileRecharged > MISSILE_RECHARGE_TIME 
				&& this.missileCount < MAX_MISSILES) {
				this.lastMissileRecharged = new Date().getTime();
				++this.missileCount;
			}

			// Create missiles
			if(this.missileCount > 0 && this.missileFired) {
				// Adjust missile count for player
				--this.missileCount;
				this.lastMissileFired = new Date().getTime();

				// Setup shape and missle
				var shape = new createjs.Shape();
				var missile = new Missile();
				missile.setHeading(this.missileFired.x, this.missileFired.y);
				missile.vx = this.vx;
				missile.vy = this.vy;
				missile.x = this.x + (this.vx * (this.width / 2));	// TODO: Poisiton missile at middle top of ship
				missile.y = this.y + (this.vy * (this.height / 2));	// TODO: Poisiton missile at middle top of ship
				missile.speed = this.speed * MISSILE_INITIAL_SPEED;
				missile.setShape(shape);
				window.spaceRocks.addEntity(missile, 1);
				this.missileFired = false;
			}

			// Create engine particles
			if(this.speed > 0) {
				// More particles the faster your going
				if(Math.random() * this.speed > MAX_SPEED / 3) {
					// Less particles on non native touch
					if($('.touch.non-native').length > 0 && Math.random() < 0.5) return;

					// Generate particles in the middle of the ship
					var cx  = this.x + (this.vx * (this.width / 2));
					var cy = this.y + (this.vy * (this.height / 2));

					// Take variation of inverse of current velocity vetor
					var vx = 0 - this.vx;
					var vy = 0 - this.vy;

					// vx between -1 to 1
						// need to possibly pull it back toward 0

					for(var i = 0; i < 2; i++) {
						var modX = (Math.random() + 0.5);
						var modY = (Math.random() + 0.5);

						var particle = new Particle({x : cx, y : cy}, "#84a3b3", {vx : vx * modX, vy : vy * modY}, this.speed, 1, "square");
						window.spaceRocks.addEntity(particle, 1);
					}
				}
			}
		},
		isDead : function() {
			return this.lifeCount < 1;
		}
	}

	return Player;
})(Entity);