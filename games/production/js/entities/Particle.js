var Particle = (function(Entity) {
	function Particle(location, color, velocityVectors, speed, size, type) {
		// Mixin entity base class
		for(var method in Entity) {
			if(this[method] == undefined) {
				this[method] = Entity[method];
			}
		}

		// Initialise Particles
		this.maxAge = 2000 * Math.random();
		this.createdTime = new Date().getTime();
		this.rotationSpeed = (Math.random() + 0.2) * 6;
		this.rotation = Math.random() * 360;
		this.lastTickTime = new Date().getTime();

		// Initialise particle
		this.init(location, color, velocityVectors, speed, size, type);
	}

	Particle.prototype = {
		constructor : Particle,
		init : function(location, color, velocityVectors, speed, size, type) {
			this.shape = new createjs.Shape();
			size *= window.devicePixelRatio; // Faster than scaling up
			
			switch(type) {
				case "square":
					this.shape.graphics.beginFill(color).drawRect(0, 0, size, size);
				break;
				case "line" :
					this.shape.graphics.setStrokeStyle(3 * window.devicePixelRatio).beginStroke(color).moveTo(0, 0).lineTo(0, size).endStroke();
				break;
			}

			this.shape.snapToPixel = true;
			this.shape.tickEnabled = false;
			this.shape.cache(-size, -size, size * 2, size * 2, window.devicePixelRatio);

			this.x = location.x;
			this.y = location.y;
			this.vx = velocityVectors.vx;
			this.vy = velocityVectors.vy;
			this.speed = speed;
			this.size = size;
			this.type = type;
		},
		canCollideWidth : function(entity) {
			var collidesWith = new Array();
			return collidesWith.indexOf(entity.className()) !== -1;
		},
		getHitBoxType : function() {
			return Physics.hitBoxTypes.POINT;
		},
		render : function() {
			this.shape.x = this.x;
			this.shape.y = this.y;

			// Quick hack to speed up small particles
			if(this.type === "line") {
				this.shape.rotation = this.rotation;
			}
		},
		update : function() {
			var timeSinceLastUpdate = new Date().getTime() - this.lastTickTime;

			// Update location
			this.x += (timeSinceLastUpdate * this.speed) * this.vx;
			this.y += (timeSinceLastUpdate * this.speed) * this.vy;

			this.rotation += this.rotationSpeed;
			this.rotation %= 360;
		},
		isDead : function() {
			return (new Date().getTime() - this.createdTime > this.maxAge);
		}
	}

	return Particle;
})(Entity);