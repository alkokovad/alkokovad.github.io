var HUD = (function() {
	function HUD() {
		// Set player and game objects
		this.init();
	}

	HUD.prototype = {
		constructor : HUD,
		init : function() {
			// Remove any previous scores
			$("#ui #score .score").addClass("inactive").html("");
		},
		update : function() {
			if(this.lastScore !== window.spaceRocks.score) {
				$("#ui #hud #points #count").html("" + window.spaceRocks.score);
				$("#ui #hud #points-container #count").addClass("pulse animated").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
					$(this).removeClass("pulse animated");
				});
				this.lastScore = window.spaceRocks.score;
			}

			if(this.lastLevel !== window.spaceRocks.level) {
				$("#ui #hud #points #multiplier sup").html("x" + window.spaceRocks.level);
				this.lastLevel = window.spaceRocks.level;
			}
			if(this.lastMissiles !== window.spaceRocks.player.missileCount) {
				var missileCount = window.spaceRocks.player.missileCount;

				$.each($("#ui #hud #missiles .missile"), function(i, element) {
					if(i < missileCount) {
						$(element).removeClass("empty");
					} else {
						$(element).addClass("empty");
					}
				});
				this.lastMissiles = missileCount;
			}
			if(this.lastLives !== window.spaceRocks.player.lifeCount) {
				var lifeCount = window.spaceRocks.player.lifeCount;

				$.each($("#ui #hud #lives .life"), function(i, element) {
					if(i < lifeCount) {
						$(element).removeClass("empty");
					} else {
						$(element).addClass("empty");
					}
				});
				this.lastLives = lifeCount;
			}
		},
		triggerScoreAnimation : function(score, x, y) {
			// Find the next available score node
			var availableNodes = $("#ui #score .score.inactive");
			if(availableNodes.length === 0) return;

			var scoreNode = $(availableNodes[0]);
			scoreNode.css({
				"position" : "absolute",
				"left" : x / window.devicePixelRatio,
				"top" : y / window.devicePixelRatio,
				"font-size" : (Math.log(score / this.lastLevel) * 0.7) + "em"
			})
			scoreNode.html(score);

			// Add animations
			scoreNode.addClass("fadeInUp animated").removeClass("inactive");
			scoreNode.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
				scoreNode.removeClass("fadeInUp").addClass("fadeOut").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
					// Reset node state allowing it to be reused
					scoreNode.removeClass("animated fadeOut").addClass("inactive");
				});
			});
		}
	}

	return HUD;
})();