var Asteroid = (function(Entity) {

	// Static fields
	var SPEED = 0.025 * window.devicePixelRatio; // Pixels per ms (asteroids have constant speed)
	var SIZES = { // Mapping of "size type" to radius of asteroids
		0 : 10,
		1 : 20,
		2 : 40,
		3 : 60,
		4 : 80
	};
	var ROTATION_SPEED = 0.014; // in degrees per ms
	var EXPLOSION_CHILDREN = 2; // Number of children that are created when asteroid explodes

	function Asteroid(sizeIndex) {
		// Mixin entity base class
		for(var method in Entity) {
			if(this[method] == undefined) {
				this[method] = Entity[method];
			}
		}
		// Set sizeIndex
		sizeIndex = (sizeIndex == null)? 4 : sizeIndex;
		this.sizeIndex = sizeIndex;

		// Initialise Asteroid
		this.lastTickTime = new Date().getTime();
		this.init();
	}

	Asteroid.prototype = {
		constructor : Asteroid,
		init : function() {
			// Velocity components (between 1 and -1)
			this.vx = ((Math.random()) * 2) - 1;
			this.vy = ((Math.random()) * 2) - 1;

			// Normalise
			this.vx = 1 / (Math.abs(this.vx) + Math.abs(this.vy)) * this.vx;
			this.vy = 1 / (Math.abs(this.vx) + Math.abs(this.vy)) * this.vy;

			// Speed
			this.speed = SPEED * (Math.random() + 0.5);

			// FPS independent movement
			this.lastUpdate = new Date().getTime();

			// Current size index
			this.radius = SIZES[this.sizeIndex];

			// Rotation speed and angle (in degress per ms)
			this.rotation = 0;
			this.rotationSpeed = ROTATION_SPEED * (Math.random() + 0.5);
			if(Math.floor(Math.random() * 100) % 2 === 0) {
				this.rotationSpeed = 0 - this.rotationSpeed;
			}

			// Dies when goes below lowest size
			this.exploded = false;
		},
		getRandomInRange : function(min, max) {
			return Math.random() * (max - min) + min;
		},
		drawOutline : function(shape) {
			var asteroidRadius = this.radius;

			// Furthest indentation can be from outer edge of circle
			this.minRadius = asteroidRadius * 0.7;
			this.maxRadius = asteroidRadius * 1;

			// Shortest and longest lengths for lines between edges of asteroid
			var minLineDistance = (2 * Math.PI) / 18;
			var maxLineDistance = (2 * Math.PI) / 13;

			// First point is at 0 rad
			this.points = new Array();
			var distanceFromCenter = this.getRandomInRange(this.minRadius, this.maxRadius);
			var firstPoint = new createjs.Point(distanceFromCenter, 0);
			var currentPoint = firstPoint;
			var angle = 0.0;
			var vx = 1;
			var vy = 0;
			shape.graphics.setStrokeStyle(4).beginStroke("#ffffff");

			shape.graphics.moveTo(firstPoint.x, firstPoint.y);
			this.points.push(firstPoint);

			while(angle < ((2 * Math.PI) - maxLineDistance)) {
				var lineLength = this.getRandomInRange(minLineDistance, maxLineDistance);
				angle += this.getRandomInRange(minLineDistance, maxLineDistance);
				distanceFromCenter = this.getRandomInRange(this.minRadius, this.maxRadius);


				vx = Math.cos(angle);
				vy = Math.sin(angle);
				nextPoint = new createjs.Point(vx * distanceFromCenter, vy * distanceFromCenter);
				this.points.push(nextPoint);

				var xDist = (currentPoint.x - nextPoint.x) / 2;
				var yDist = (currentPoint.y - nextPoint.y) / 2;

				var dist = Math.abs(currentPoint.x - nextPoint.x) + Math.abs(currentPoint.y - nextPoint.y) / 2;
				shape.graphics.arcTo(currentPoint.x + nextPoint.x >> 1, currentPoint.y + nextPoint.y >> 1,  nextPoint.x,  nextPoint.y,  asteroidRadius / 6);
				currentPoint = nextPoint;
			}

			// Draw final line (@TODO look into curveTo)
			shape.graphics.arcTo(firstPoint.x, currentPoint.y, firstPoint.x, firstPoint.y, 2);
			shape.graphics.lineTo(firstPoint.x, firstPoint.y);
			shape.graphics.endStroke();
		},
		setShape : function(shape) {
			this.shape = shape;
			this.shape.scaleX = window.devicePixelRatio;
			this.shape.scaleY = window.devicePixelRatio;
			this.drawOutline(this.shape);
			this.shape.cache(-(this.radius + 4), 
							-(this.radius + 4), 
							(this.radius * 2) + 8, 
							(this.radius * 2) + 8, 
							window.devicePixelRatio);

			this.shape.snapToPixel = true;

			// To calculate initial bounding box
			this.render();
		},
		canCollideWidth : function(entity) {
			var collidesWith = new Array("Missile", "MissileExplosion", "Player");
			return collidesWith.indexOf(entity.className()) !== -1;
		},
		getHitBoxType : function() {
			return Physics.hitBoxTypes.CIRCLE;
		},
		explode : function() {
			// Create two new asteroids if sizeIndex is greater than 0
			if(this.sizeIndex > 0) {
				for(var i = 0; i < EXPLOSION_CHILDREN; i++) {
					var asteroid = new Asteroid((this.sizeIndex - 1));
					
					// Set start location
					asteroid.x = this.x;
					asteroid.y = this.y;
					asteroid.speed = this.speed * 1.2;
					asteroid.setShape(new createjs.Shape());

					// Add to entity list
					window.spaceRocks.addEntity(asteroid, 3);
				}
			}

			this.exploded = true;
		},
		render : function() {
			// @TODO render parts on opposite sceen when rendering goes offscreen
			this.shape.x = this.x;
			this.shape.y = this.y;
			this.shape.rotation = this.rotation;

			// Set bounds just below maximum extent
			var radiusDiff = this.maxRadius - this.minRadius;
			var diameter = (this.minRadius + (0.7 * radiusDiff)) * 2;
			this.shape.setBounds(this.x, this.y, diameter * this.shape.scaleX, diameter * this.shape.scaleY);
		},
		update : function() {
			var timeSinceLastUpdate = new Date().getTime() - this.lastTickTime;

			// Max extents - update maxX and maxY each tick in case device has rotated
			this.maxX = window.spaceRocks.getDimensions().width;
			this.maxY = window.spaceRocks.getDimensions().height;

			this.x += (timeSinceLastUpdate * this.speed) * this.vx;
			this.y += (timeSinceLastUpdate * this.speed) * this.vy;

			// Clamp location (origin is in top left of shape)
			this.x = (this.x - (this.radius * window.devicePixelRatio) > this.maxX)? (0 - this.radius * window.devicePixelRatio) : this.x;
			this.x = (this.x + (this.radius * window.devicePixelRatio) < 0)? (this.maxX + this.radius * window.devicePixelRatio) : this.x;
			this.y = (this.y - (this.radius * window.devicePixelRatio) > this.maxY)? (0 - this.radius * window.devicePixelRatio) : this.y;
			this.y = (this.y + (this.radius * window.devicePixelRatio) < 0)? (this.maxY + this.radius * window.devicePixelRatio) : this.y;

			// Rotate asteroid
			this.rotation += (timeSinceLastUpdate * this.rotationSpeed);
			if(this.rotation > 0) {
				this.rotation = 0 + (Math.abs(this.rotation) % 360);
			} else {
				this.rotation = 0 - (Math.abs(this.rotation) % 360);
			}
		},
		isDead : function() {
			return this.exploded;
		}
	}

	return Asteroid;
})(Entity);