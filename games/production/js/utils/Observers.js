var Observers = (function() {
	function Observers(spaceRocks, canvas) {
		this.spaceRocks = spaceRocks;
		this.canvas = canvas;
		this.social = new Social();

		this.mouseDown = null;
		this.mouseUp = null;
		this.mouseMove = null;

		this.init();
	}

	Observers.prototype = {
		constructor : Observers,
		init : function() {
			this.attachToSplashScreen();
			this.attachToButtons();
			this.attachToCanvas();
			this.attachToSocial();

			// Prevent scrolling on page
			document.addEventListener("touchstart", function() { return false; }, false);

			// Rotation detection
			window.addEventListener('orientationchange', function() { 
				this.spaceRocks.resizeToScreen();
				this.spaceRocks.addStars();
				window.scrollTo(0, 1);
				this.spaceRocks.stage.update();
			}.bind(this));
		},
		attachToSplashScreen : function() {
			// Splash screens
			if($("html.touch.non-native").length !== 0){
				// Prompt user to download app
				$(".touch-splash").addClass("animated fadeIn");
				$(".touch-splash .play-now")[0].addEventListener("touchend", function() {
					$(".touch-splash").addClass("fadeOut animated");
					$(".touch-splash").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
						$(this).remove();
					});	
					this.spaceRocks.init();
				}.bind(this));
			} else if($("html.unsupported-browser").length !== 0){
				// Prompt user to download new browser
				$(".unsupported-browser-splash").addClass("animated fadeIn");
			} else {
				// Start straight away	
				this.spaceRocks.init();
			}
		},
		attachToButtons : function() {
			// Intro button
			$("#intro .button").click(function() {
				$("#intro").addClass("no-pointer-events"); // Disable touch events for intro screen
				$(".line.red").addClass("slideOutRight");
				$("h1.light, h1.extra-bold, #intro .button").addClass("fadeOut").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
					$(".line.red").removeClass("slideOutRight");
					$("h1.light, h1.extra-bold, #intro .button").removeClass("fadeOut");
					$("#ui #in-game #hud").addClass("animated fadeInDown");
					$("#intro").removeClass("no-pointer-events");
					$(document.body).removeClass("intro").addClass("in-game");
				});
				this.spaceRocks.startGame();
				return false;
			}.bind(this));

			// Game over button
			$("#game-over .button").click(function() {
				$(document.body).removeClass("game-over");
				$("#game-over .overlay").removeClass("animated fadeInDown");
				$("#game-over .overlay .social, #game-over .overlay .button").removeClass("animated fadeIn");
				this.spaceRocks.shouldRestart = true;
				return false;
			}.bind(this));
		},
		attachToCanvas : function() {
			this.mouseDown = null;
			this.mouseUp = null;
			this.mouseMove = null;
			this.spaceRocks.canvas.addEventListener("touchstart", function(e) {
			 	this.mouseDown = e;

			 	// Ensure that x and y coords are mapped for render function
			 	this.mouseDown.x = e.changedTouches[0].clientX * window.devicePixelRatio;
			 	this.mouseDown.y = e.changedTouches[0].clientY * window.devicePixelRatio;
			 }.bind(this));

			 // Manually threshold pressmove event
			this.canvas.addEventListener("touchmove", function(e) {
			 	this.mouseMove = e;

				// Ensure that x and y coords are mapped for render function
			 	this.mouseMove.x = e.changedTouches[0].clientX * window.devicePixelRatio;
			 	this.mouseMove.y = e.changedTouches[0].clientY * window.devicePixelRatio;
			 }.bind(this));

			this.canvas.addEventListener("touchend", function(e) {	
			 	this.mouseUp = e;
			 	if(this.mouseUp.targetTouches.length === 0) {
			 		this.mouseDown = null;
			 	}

			 	// Ensure that x and y coords are mapped for render function
			 	this.mouseUp.x = e.changedTouches[0].clientX * window.devicePixelRatio;
			 	this.mouseUp.y = e.changedTouches[0].clientY * window.devicePixelRatio;
			}.bind(this));

			this.canvas.addEventListener("mousedown", function(e) {
				// Retina displays do not return correct relative coordinates
			 	var overridenEvent = {
			 		x : e.layerX * window.devicePixelRatio,
			 		y : e.layerY * window.devicePixelRatio
			 	}
			 	this.mouseDown = overridenEvent;
			}.bind(this));

			this.canvas.addEventListener("mousemove", function(e) {
				// Retina displays do not return correct relative coordinates
			 	var overridenEvent = {
			 		x : e.layerX * window.devicePixelRatio,
			 		y : e.layerY * window.devicePixelRatio

			 	}
				this.mouseMove = overridenEvent;
			}.bind(this));

			this.canvas.addEventListener("mouseup", function(e) {
				// Retina displays do not return correct relative coordinates
			 	var overridenEvent = {
			 		x : e.layerX * window.devicePixelRatio,
			 		y : e.layerY * window.devicePixelRatio

			 	}
			 	this.mouseUp = overridenEvent;
			 	this.mouseDown = null;
			}.bind(this));
		},
		attachToSocial : function() {
			// Social share buttons
			$("#game-over .sc--facebook").click(function() {
				this.social.postToFacebook(this.spaceRocks.score);
				return false;
			}.bind(this));
			$("#game-over .sc--twitter").click(function() {
				this.social.postToTwitter(this.spaceRocks.score);
				return false;
			}.bind(this))
		}
	}

	return Observers;
})();
