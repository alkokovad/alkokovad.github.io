var Missile = (function(Entity) {
	//var this;

	var ACCELERATION = (0.00002 * window.devicePixelRatio); // Pixels per ms to add for each pixel distance from heading
	var MAX_SPEED = (0.45 * window.devicePixelRatio); // Pixels per ms
	var MIN_SPEED = (0.2 * window.devicePixelRatio); // Pixels per ms
	var TURN_SPEED = 0.0006; // Speed of turn in MS. 1 = turn to face in 1ms 

	// Temporary before sprite is used
	var SIZE = 1;

	function Missile() {
		// Mixin entity base class
		for(var method in Entity) {
			if(this[method] == undefined) {
				this[method] = Entity[method];
			}
		}

		// Velocity components (between 0 and -1)
		this.vx = 0;
		this.vy = 0;

		// Location that missile is heading toward
		this.xHeading = null;
		this.yHeading = null;

		// Speed
		this.speed = 0;

		// Whether this missile should generate others
		this.isClusterMissile = true;
		this.explosionSizeCoefficient = 1;

		// Cache path for animations
		this.path = new Array();
		this.maxPathPoints = 50;
		this.lastTickTime = new Date().getTime();
	}

	Missile.prototype = {
		constructor : Missile,
		setShape : function(shape) {
			this.shape = shape;
			this.shape.graphics.beginFill("#fff").drawCircle(0, 0, SIZE, SIZE);
			this.shape.regX = SIZE / 2;
			this.shape.regY = SIZE / 2;
			this.shape.scaleX = window.devicePixelRatio;
			this.shape.scaleY = window.devicePixelRatio;
			this.shape.cache(-SIZE, -SIZE, SIZE * 2, SIZE * 2, window.devicePixelRatio);
			this.shape.snapToPixel = true;
			this.shape.setBounds(this.x, this.y, 1, 1);
		},
		setHeading : function(xHeading, yHeading) {
			this.xHeading = xHeading;
			this.yHeading = yHeading;
		},
		getHitBoxType : function() {
			return Physics.hitBoxTypes.POINT
		},
		canCollideWidth : function(entity) {
			var collidesWith = new Array("Asteroid", "Alien", "Lazer");
			return collidesWith.indexOf(entity.className()) !== -1;
		},
		render : function() {
			this.shape.x = this.x;
			this.shape.y = this.y;

			this.shape.setBounds(this.x, this.y, 1, 1);
		},
		update : function() {
			if(this.exploded) return;
			var timeSinceLastUpdate = new Date().getTime() - this.lastTickTime;

			// Spawn particles
			if(Math.random() > 0.05) {
				if($('.touch.non-native').length > 0 && Math.random() < 0.5) {
					// Less particles on non native touch
				} else {
					var particle = new Particle({x : this.x, y : this.y}, "#888", {vx : 0, vy : 0}, this.speed, 1, "square");
					particle.maxAge = 500;
					window.spaceRocks.addEntity(particle, 2);
				}
			}

			// Get vector which connects current location to target
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

			// Update speed
			this.speed += ACCELERATION * timeSinceLastUpdate;
			this.speed = (this.speed < MIN_SPEED)? MIN_SPEED : this.speed;
			this.speed = (this.speed > MAX_SPEED)? MAX_SPEED : this.speed;

			// Update location
			this.x += (timeSinceLastUpdate * this.speed) * this.vx;
			this.y += (timeSinceLastUpdate * this.speed) * this.vy;

			// If dead add an explosion
			if(this.isDead()) {
				this.explode();
			}
		},
		explode : function() {
			// Add explosion object
			var missileExplosion = new MissileExplosion();
			missileExplosion.x = this.x;
			missileExplosion.y = this.y;
			missileExplosion.explosionRadius *= this.explosionSizeCoefficient;
			missileExplosion.setupShape(function() {
				// Add entity once shape has been setup
				window.spaceRocks.addEntity(missileExplosion, 1);
			});

			// Spawn another two missiles
			if(this.isClusterMissile) {
				for(var i = 0; i < 2; i++) {
					var shape = new createjs.Shape();
					var missile = new Missile();
					missile.setHeading(this.x + ((Math.random() * 2 - 1) * 100), this.y + ((Math.random() * 2 - 1) * 100));
					missile.x = this.x + (this.vx * (Math.random() * 20));
					missile.y = this.y + (this.vy * (Math.random() * 20));
					missile.setShape(shape);
					missile.isClusterMissile = false;
					missile.explosionSizeCoefficient /= 2;
					window.spaceRocks.addEntity(missile, 1);
				}
			}

			this.exploded = true;
		},
		isDead : function() {
			return this.exploded || (Math.abs(this.x - this.xHeading) + Math.abs(this.y - this.yHeading) < 5);
		}
	}

	return Missile;
})(Entity);