var Alien = (function(Entity) {
	// Constant speed
	var SPEED = (0.05 * window.devicePixelRatio); // Pixels per ms

	// Time at which interval could change, and percentage to change
	var HEADING_CHANGE_INTERVAL = 5000;
	var HEADING_CHANGE_CHANCE = 0.5;

	// Firing intervals
	var FIRE_INTERVAL = 1000;
	var FIRE_CHANCE = 0.5;

	// Temporary before sprite is used
	var WIDTH = 30 * window.devicePixelRatio;
	var HEIGHT = 23  * window.devicePixelRatio;

	function Alien() {
		// Mixin entity base class
		for(var method in Entity) {
			if(this[method] == undefined) {
				this[method] = Entity[method];
			}
		}
		this.width = WIDTH;
		this.height = HEIGHT;

		// Velocity components (between 0 and -1)
		this.vx = 0;
		this.vy = 0;

		// Location that alien is heading toward
		this.xHeading = null;
		this.yHeading = null;

		// Speed
		this.speed = SPEED;

		// Max extents
		this.maxX = window.spaceRocks.getDimensions().width;
		this.maxY = window.spaceRocks.getDimensions().height;

		// FPS independent movement
		this.lastTickTime = new Date().getTime();
		this.updateHeading();
		this.lastLazer = new Date().getTime();
		this.startTime = new Date().getTime();
	}

	Alien.prototype = {
		constructor : Alien,
		setupShape : function(callback) {
			var img = new Image();
			img.src = window.location.origin + window.location.pathname + "/img/alien.png";
			img.onload = function(e) {
				// Load image
				this.shape = new createjs.Bitmap(e.target);
				this.shape.snapToPixel = true;
				this.shape.setBounds(this.x, this.y, WIDTH, HEIGHT);
				this.shape.alpha = 0;
				this.shape.scaleX = 0.5 * window.devicePixelRatio;
				this.shape.scaleY = 0.5 * window.devicePixelRatio;

				createjs.Tween.get(this.shape).to({
			        alpha: 1
			    }, 2000);

				callback();
			}.bind(this);
		},
		updateHeading : function() {
			this.setHeading(this.maxX * Math.random(), this.maxY * Math.random());
			this.lastHeadingUpdate = new Date().getTime();
		},
		setHeading : function(xHeading, yHeading) {
			this.xHeading = xHeading;
			this.yHeading = yHeading;
		},
		getHitBoxType : function() {
			return Physics.hitBoxTypes.RECTANGLE;
		},
		canCollideWidth : function(entity) {
			var collidesWith = new Array("Player", "Missile", "MissileExplosion" , "Lazer");
			if(new Date().getTime() - this.startTime < 750 && entity.className() === "Lazer") return false;

			return collidesWith.indexOf(entity.className()) !== -1;
		},
		render : function() {
			this.shape.x = this.x;
			this.shape.y = this.y;
			this.shape.setBounds(this.x, this.y, WIDTH, HEIGHT);
		},
		update : function() {
			if(this.exploded) return;
			var timeSinceLastUpdate = new Date().getTime() - this.lastTickTime;
			var timeSinceHeadingUpdate = new Date().getTime() - this.lastHeadingUpdate;

			this.maxX = window.spaceRocks.getDimensions().width;
			this.maxY = window.spaceRocks.getDimensions().height;

			// Possibly change heading
			if(timeSinceHeadingUpdate > HEADING_CHANGE_INTERVAL) {
				if(Math.random() > HEADING_CHANGE_CHANCE) {
					this.updateHeading();
				}
				this.lastHeadingUpdate = new Date().getTime();
			}

			// Possibly shoot lazer
			this.shootLazer();

			// Get vector which connects current location to target
			var xDiff = this.xHeading - this.x;
			var yDiff = this.yHeading - this.y;
			this.vx = (1 / (Math.abs(xDiff) + Math.abs(yDiff))) *  xDiff;
			this.vy = (1 / (Math.abs(xDiff) + Math.abs(yDiff))) *  yDiff;

			// Clamp heading if we're 'close enough'
			if(Math.abs(this.x - this.xHeading) + Math.abs(this.y - this.yHeading) < 10) {
				this.vx = 0;
				this.vy = 0;
			}

			// Move alien
			this.x += (timeSinceLastUpdate * this.speed) * this.vx;
			this.y += (timeSinceLastUpdate * this.speed) * this.vy;

			// Clamp location (origin is in top left of shape)
			this.x = (this.x - (this.width) > this.maxX)? 0 : this.x;
			this.x = (this.x + (this.width) < 0)? this.maxX : this.x;
			this.y = (this.y - (this.height) > this.maxY)? 0 : this.y;
			this.y = (this.y + (this.height) < 0)? this.maxY : this.y;

			// If dead add an explosion
			if(this.isDead()) {
				this.explode();
			}
		},
		shootLazer : function() {
			var timeSinceLazer = new Date().getTime() - this.lastLazer;
			if(timeSinceLazer > FIRE_INTERVAL) {
				if(Math.random() > FIRE_CHANCE) {
					var shape = new createjs.Shape();
					var lazer = new Lazer();
					var playerLocation = window.spaceRocks.getPlayerLocaton()

					lazer.setHeading(playerLocation.x, playerLocation.y);
					lazer.x = this.x + WIDTH / 2;
					lazer.y = this.y + HEIGHT / 2;
					lazer.setShape(shape);
					window.spaceRocks.addEntity(lazer, 1);
				}

				this.lastLazer = new Date().getTime();
			}
		},
		explode : function() {
			if(this.exploded) return;

			// Add particles
			var cx  = this.x + (this.width / 2);
			var cy = this.y + (this.height / 2);

			var particleCount = Math.random() * 5 + 5;
			for(var i = 0; i < particleCount; i++) {
				var size = (Math.random() * 5) + 5;
				var vx = Math.random() * 2 - 1;
				var vy = Math.random() * 2 - 1;
				var particle = new Particle({x : cx, y : cy}, "#00dd53", {vx : vx, vy : vy}, this.speed + 0.05, size, "line");
				window.spaceRocks.addEntity(particle, 2);
			}

			this.exploded = true;
		},
		isDead : function() {
			return this.exploded;
		}
	}

	return Alien;
})(Entity);