var Social = (function() {
	function Social() {}

	Social.prototype = {
		postToFacebook : function(score) {
			FB.ui(
		      {
		       method: 'feed',
		       name: 'Space Rocks',
		       caption: 'A modern take on an arcade classic',
		       description: (
		          'Space Rocks is pretty cool ya\'ll. I just scored ' + score +
		          '. Try beat it!'
		       ),
		       href : window.location.href,
		       link: window.location.href,
		       picture: 'https://raw.githubusercontent.com/jrgrafton/asteroids/gh-pages/production/img/app-icon.png',
			   actions: [ { name: 'via Space Rocks', link : window.location.href}]
		      },
		      function(response) {}
		    );
		},
		postToTwitter : function(score) {
			var msg = 'Space Rocks is pretty cool ya\'ll. I just scored ' + score +
				'. Try beat it! ' + window.location.href;
			window.open("https://twitter.com/intent/tweet?source=webclient&text=" + msg, "_blank");
		}
	}

	return Social;
})();
