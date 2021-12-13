var Lazer = (function(Entity) {
	var SPEED = 0.10 * window.devicePixelRatio;

	function Lazer() {
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
		this.speed = SPEED;

		// State management
		this.exploding = false;
		this.exploded = false;
		this.startTime = new Date().getTime();
		this.lastTickTime = new Date().getTime();
	}

	Lazer.prototype = {
		constructor : Lazer,
		setShape : function(shape) {
			this.shape = shape;
			this.shape.scaleX = window.devicePixelRatio;
			this.shape.scaleY = window.devicePixelRatio;
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
			var collidesWith = new Array("Player", "Missile", "MissileExplosion", "Alien");
			if(new Date().getTime() - this.startTime < 750 && entity.className() === "Alien") return false;

			return collidesWith.indexOf(entity.className()) !== -1;
		},
		render : function() {
			this.shape.x = this.x;
			this.shape.y = this.y;
			this.shape.setBounds(this.x, this.y, 1, 1);

			this.shape.graphics.setStrokeStyle(window.devicePixelRatio * 1).beginStroke("#00dd53").moveTo(0, 0).lineTo(this.vx * 5 * window.devicePixelRatio, this.vy * 5 * window.devicePixelRatio).endStroke();
		},
		update : function() {
			if(this.exploded || this.exploding) return;
			var timeSinceLastUpdate = new Date().getTime() - this.lastTickTime;

			// Get vector which connects current location to target
			var xDiff = this.xHeading - this.x;
			var yDiff = this.yHeading - this.y;
			this.vx = (1 / (Math.abs(xDiff) + Math.abs(yDiff))) *  xDiff;
			this.vy = (1 / (Math.abs(xDiff) + Math.abs(yDiff))) *  yDiff;

			// Update location
			this.x += (timeSinceLastUpdate * this.speed) * this.vx;
			this.y += (timeSinceLastUpdate * this.speed) * this.vy;

			// If dead add an explosion
			if(Math.abs(this.x - this.xHeading) + Math.abs(this.y - this.yHeading) < 5) {
				this.explode();
			}
		},
		explode : function() {
			this.exploding = false;
			this.exploded = true;
		},
		isDead : function() {
			return this.exploded;
		}
	}

	return Lazer;
})(Entity);