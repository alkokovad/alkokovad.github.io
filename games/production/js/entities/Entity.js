/************************************/
/** ------ Entity Interface ------ **/
/************************************/
var Entity = (function() {

	function Entity() {};

	// Used to normalise all entity collisions and updates in game
	return {
		constructor : Entity,
		/* Generic */
		className : function() { 
		   var funcNameRegex = /function (.{1,})\(/;
		   var results = (funcNameRegex).exec((this).constructor.toString());
		   return (results && results.length > 1) ? results[1] : "";
		},

		/* GFX and state */
		update : function(){},
		render : function(){},
		setShape : function(){},
		isDead : function(){ return false; },

		/* Physics */
		getDimensions : function() { 
			return { 
				x : this.shape.getBounds().x || this.x,
				y : this.shape.getBounds().y || this.y,
				width : this.shape.getBounds().width,
				height : this.shape.getBounds().height,
				points : this.points || null,
				rotation : this.rotation || 0
			} 
		},
		getHitBox : function(){},
		getHitBoxType : function(){},
		canCollideWidth : function(entity){ return false },
		explode : function() {}
	}
})();