// Add classification classes (don't need modernizer for such few classifications)
var ua = navigator.userAgent.toLowerCase();

var htmlClasses = [];
htmlClasses[0] = ('ontouchstart' in document.documentElement)? "touch" : "no-touch";
htmlClasses[1] = (ua.indexOf("msie ") !== -1 || ua.indexOf("trident") !== -1)? "ie" : "no-ie";
htmlClasses[2] = (navigator.appVersion.indexOf("Win") !== -1)? "win" : "no-win";
htmlClasses[3] = (ua.indexOf("android") !== -1)? "android" : "no-android";
htmlClasses[4] = (ua.match(/(ipad|iphone|ipod)/g))? "ios" : "no-ios";
htmlClasses[5] = ((ua.indexOf("chrome") !== -1 || ua.indexOf("safari") !== -1 || ua.indexOf("firefox") !== -1) && (htmlClasses[1] !== "ie"))? "supported-browser" : "unsupported-browser";
htmlClasses[6] = "non-native"; // @TODO: detect when integrated with CacoonJS

$("html").addClass(htmlClasses.join(" "));