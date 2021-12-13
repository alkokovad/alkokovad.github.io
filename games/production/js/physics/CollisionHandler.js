var CollisionHandler = (function() {
	function CollisionHandler(){};

	CollisionHandler.prototype = {
		constructor : CollisionHandler,
		didCollide : function(e1, e2) {
			//console.log("[collision] " + e1.className() + " --> " + e2.className());

			switch(e1.className()) {
				case "Asteroid":
					switch(e2.className()) {
						case "Missile":
							// Explode missile
							e2.explode();
						break;
						case "MissileExplosion":
							// Explode asteroid
							if(!e1.isDead()) {
								e1.explode();
								window.spaceRocks.addScore(10 * (e1.sizeIndex + 1), e2.x, e2.y);
							}
						break;
						case "Player":
							window.spaceRocks.addScore(10 * (e1.sizeIndex + 1), e2.x, e2.y);
							e1.explode();
							e2.explode();
						break;
						default:
						break;
					}
					break;
				break;
				case "Player":
					switch(e2.className()) {
						case "Alien" :
							// Explode player
							e1.explode();
						break;
						case "Lazer" :
							// Explode player
							e1.explode();
							e2.explode();
						break;
						default:
						break;
					}
					break;
				default:
				break;
				case "Alien" : {
					switch(e2.className()) {
						case "Missile" :
							// Explode missile
							e2.explode();
						break;
						case "MissileExplosion" :
							// Explode alien
							if(!e1.isDead()) {
								e1.explode();
								window.spaceRocks.addScore(120, e1.x, e1.y);
							}
						break;
						case "Lazer" :
							// Explode alien and lazer
							e1.explode();
							e2.explode();
						break
						default:
						break;
					}
					break;
				}
				case "Lazer" : {
					switch(e2.className()) {
						case "Missile" :
							// Explode lazer and missile
							e1.explode();
							e2.explode();
						break;
						case "MissileExplosion" :
							// Explode alien
							e1.explode();
							e2.explode();
						break;
						default:
						break;
					}
					break;
				}
			}
		}
	}

	return CollisionHandler;
})();