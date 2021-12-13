var MissileExplosion =  (function(Entity) {
	function MissileExplosion() {
		// Mixin entity base class
		for(var method in Entity) {
			if(this[method] == undefined) {
				this[method] = Entity[method];
			}
		}

		// Explosion start time
		this.explositionStart = new Date().getTime();
		this.radius = 1;

		// Setup explosion time and radius
		this.explosionTime = 2000 * Math.random() + 0.5;
		this.explosionRadius = (10 *  Math.random()) + 20;
		this.lastTickTime = new Date().getTime();
	}

	MissileExplosion.prototype = {
		constructor : MissileExplosion,
		setupShape : function(callback) {
			var img = new Image();
			img.src = window.location.origin + window.location.pathname + "/img/explosion.png";
			img.onload = function(e) {
				// Load image
				this.shape = new createjs.Bitmap(e.target);
				this.shape.snapToPixel = true;
				this.shape.setBounds(this.x, this.y, 1, 1);	

				callback();
			}.bind(this);
		},
		getHitBoxType : function() {
			return Physics.hitBoxTypes.CIRCLE
		},
		canCollideWidth : function(entity) {
			var collidesWith = new Array("Asteroid", "Alien", "Lazer");
			return collidesWith.indexOf(entity.className()) !== -1;
		},
		render : function() {
			var diameter = this.radius * 2;
			this.shape.x = this.x;
			this.shape.y = this.y;

			// To make the sprite more visible double the size of it
			this.shape.scaleX = 0.02 * diameter * window.devicePixelRatio;
			this.shape.scaleY = 0.02 * diameter * window.devicePixelRatio;

			this.shape.regX = this.shape.image.width / 2;
			this.shape.regY = this.shape.image.height / 2;
			
			this.shape.setBounds(this.x, this.y, diameter * window.devicePixelRatio, diameter * window.devicePixelRatio);
		},
		update : function() {
			// Expand or contract size based on time since explosion
			var timeSinceExplosion = new Date().getTime() - this.explositionStart;
			var timeSinceLastUpdate = new Date().getTime() - this.lastTickTime;

			// If it's passed halfway start contracting
			var pixelsPerMS = this.explosionRadius / this.explosionTime;
			if(timeSinceExplosion > this.explosionTime / 2) {
				this.radius -= pixelsPerMS * timeSinceLastUpdate;
			} else {
				this.radius += pixelsPerMS * timeSinceLastUpdate;
			}
		},
		isDead : function() {
			return this.radius < 0;
		}
	}

	return MissileExplosion;
})(Entity);