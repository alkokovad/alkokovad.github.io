var wndW, wndH;
var canvasScaleX, canvasScaleY;
var canvasX, canvasY;
var gmCallback = new Object();


//-----------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------
function js_init(acceptMouseEvents) {
    // Zachytavat udalost okna "resize"
    wndW = window.innerWidth;
    wndH = window.innerHeight;

    window.addEventListener("resize", function () {
        if (wndW !== window.innerWidth || wndH !== window.innerHeight) {
            // Doslo ke zmene velikosti
            wndW = window.innerWidth;
            wndH = window.innerHeight;

            gmCallback.html5_onWindowResize(wndW, wndH);
        }
    });

    var canvas = document.getElementById("canvas");

    canvas.addEventListener("touchstart", handleTouchStart, true);
    canvas.addEventListener("touchend", handleTouchEnd, true);
    canvas.addEventListener("touchmove", handleTouchMove, true);

    if (acceptMouseEvents) {
        // Nektere verze debilniho zakladniho prohlizece na Androidu simuluji mouse events a pak dochazi ke zdvojeni
        canvas.addEventListener("mousedown", handleMouseDown, true);
        canvas.addEventListener("mouseup", handleMouseUp, true);
        canvas.addEventListener("mousemove", handleMouseMove, true);
        canvas.addEventListener("mouseout", handleMouseUp, true);
    }
}


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function correctPointerHPos(pos) {
    return floor((pos - canvasX) * canvasScaleX);
}


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function correctPointerVPos(pos) {
    return floor((pos - canvasY) * canvasScaleY);
}


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function handleTouchStart(evt) {
    evt.preventDefault();

    // Pro kazdy prst volat mousePressed
    var touchId = evt.changedTouches.length;

    while (touchId-- !== 0) {
        var touch = evt.changedTouches[touchId];

        gmCallback.html5_onPointerDown(touch.identifier, correctPointerHPos(touch.pageX), correctPointerVPos(touch.pageY));
    }
}


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function handleTouchMove(evt) {
    evt.preventDefault();

    var touchId = evt.changedTouches.length;

    while (touchId-- !== 0) {
        var touch = evt.changedTouches[touchId];

        gmCallback.html5_onPointerMove(touch.identifier, correctPointerHPos(touch.pageX), correctPointerVPos(touch.pageY));
    }
}


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function handleTouchEnd(evt) {
    evt.preventDefault();

    var touchId = evt.changedTouches.length;

    while (touchId-- !== 0) {
        var touch = evt.changedTouches[touchId];

        gmCallback.html5_onPointerUp(touch.identifier, correctPointerHPos(touch.pageX), correctPointerVPos(touch.pageY));
    }
}


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function handleMouseDown(evt) {
    evt.preventDefault();
    gmCallback.html5_onPointerDown(-1, correctPointerHPos(evt.pageX), correctPointerVPos(evt.pageY));
}


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function handleMouseMove(evt) {
    evt.preventDefault();
    gmCallback.html5_onPointerMove(-1, correctPointerHPos(evt.pageX), correctPointerVPos(evt.pageY));
}


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function handleMouseUp(evt) {
    evt.preventDefault();
    gmCallback.html5_onPointerUp(-1, correctPointerHPos(evt.pageX), correctPointerVPos(evt.pageY));
}


//-----------------------------------------------------------------------------
// Nastaveni velikosti okna a jeho zvetseni
//-----------------------------------------------------------------------------
function js_setWndSize(intWidth, intHeight, extWidth, extHeight) {
    var canvas = document.getElementById("canvas");

    canvas.width = intWidth;
    canvas.height = intHeight;
    canvas.style.width = extWidth + "px";
    canvas.style.height = extHeight + "px";

    canvasScaleX = intWidth / extWidth;
    canvasScaleY = intHeight / extHeight;
}



//-----------------------------------------------------------------------------
// Nastaveni pozice okna
//-----------------------------------------------------------------------------
function js_setWndPos(x, y) {
    var canvas = document.getElementById("canvas");

    canvas.style.left = x + "px";
    canvas.style.top = y + "px";

    canvasX = x;
    canvasY = y;
}



//-----------------------------------------------------------------------------
// Vypsani zpravy do debug konzole
//-----------------------------------------------------------------------------
function js_consoleLog(message) {
    console.log(message);
}


//-----------------------------------------------------------------------------
// Vykresleni loading baru
//-----------------------------------------------------------------------------
function js_drawLoadingBar(_graphics, _width, _height, _total, _current, _loadingscreen) {
    // Pouzit skutecnou sirku a vysku okna
    _width = window.innerWidth;
    _height = window.innerHeight;

    // Zajistit spravnou velikost canvasu
    var cnv = document.getElementById("loading_screen");

    if (cnv.width !== _width || cnv.height !== _height) {
        cnv.width = _width;
        cnv.height = _height;
        cnv.style.width = _width + "px";
        cnv.style.height = _height + "px";
    }

    // Vycistit pozadi
    _graphics.fillStyle = "#FFFFFF";
    _graphics.fillRect(0, 0, _width, _height);

    // Rozmer loading baru
    var barW = Math.round(_width / 4);
    var barH = Math.max(Math.round(_height / 40), 4);
    var barX = Math.round((_width - barW) / 2);
    var barY = Math.round((_height - barH) / 2);

    // Pozadi
    _graphics.fillStyle = "rgba(0, 0, 0, 0.5)";
    _graphics.fillRect(barX, barY, barW, barH);

    // Vykreslit vypln
    var fillW = Math.round((_current / _total) * barW);

    if (fillW !== 0) {
        _graphics.fillStyle = "#000000";
        _graphics.fillRect(barX, barY, fillW, barH);
    }
}


//-----------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------
function js_callbackScript(extName, numArgs) {
    if (gmCallback[extName] !== undefined)
        return true;

    var obFunc = window["js_callbackScript"].caller.name;

    if (obFunc === undefined) //IE always makes things difficult.
        obFunc = arguments.callee.caller.toString().match(/function ([^\(]+)/)[1];

    var args = "";
    var gmres = "0,0";

    if (numArgs > 0) {
        while (numArgs > 0) {
            args = "arg" + numArgs + "," + args;
            numArgs--;
        }

        args = args.slice(0, -1);
        gmres = gmres + ",";
    }

    gmCallback[extName] = eval("(function(" + args + "){" + obFunc + "(" + gmres + args + ");})");

    return false;
}


//-----------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------
function js_callbackDefineScript(extName, gmScript) {
    if (gmCallback[extName] !== undefined)
        return true;

    return false;
}



var eGameeState = Object.freeze({ "undefined": 0, "initialized": 1, "ready": 2 });
var gameeState = eGameeState.undefined;


function gamee_isAvailable() { return (typeof gamee !== "undefined"); }
function gamee_getState() { return gameeState; }



function gamee_init() {
    if (typeof gamee !== "undefined") {
        gamee.gameInit("FullScreen", {}, ["missions", "platformExtraLife"], function (error, data) {
            if (!error) {
                // Callbacky
                gamee.emitter.addEventListener("start", function () { gmCallback.gamee_onStart(); });
                gamee.emitter.addEventListener("pause", function () { gmCallback.gamee_onPause(); });
                gamee.emitter.addEventListener("resume", function () { gmCallback.gamee_onResume(); });
                gamee.emitter.addEventListener("mute", function () { gmCallback.gamee_onMute(); });
                gamee.emitter.addEventListener("unmute", function () { gmCallback.gamee_onUnMute(); });
                gamee.emitter.addEventListener("useExtraLife", function () { gmCallback.gamee_onUseExtraLife(); });

                gameeState = eGameeState.initialized;

                var missionId = "";
                var missionVal = -1;

                if (data.missionData) {
                    var missionData = (typeof data.missionData == "string" ? JSON.parse(data.missionData) : data.missionData);

                    missionId = missionData.id;

                    if (missionData.value)
                        missionVal = (typeof missionData.value == "string" ? parseInt(missionData.value) : missionData.value);
                }

                gmCallback.gamee_onInitialized(data.sound, missionId, missionVal);
            }
        });
    }
}



function gamee_gameReady() {
    if (gameeState === eGameeState.initialized) {
        gamee.gameReady(function (error) {
            if (!error) {
                gameeState = eGameeState.ready;
            }
            else {
                console.log(error);
            }
        });
    }
}



function gamee_gameStart() {
    if (gameeState === eGameeState.ready) {
        gamee.gameStart();
    }
}



function gamee_logEvent(name, value) {
    if (gameeState === eGameeState.ready) {
        gamee.logEvent(name, value);
    }
}



function gamee_gameOver() {
    if (gameeState === eGameeState.ready) {
        gamee.gameOver();
    }
}



function gamee_setScore(score) {
    if (gameeState === eGameeState.ready) {
        gamee.updateScore(score);
    }
}



function gamee_updateMissionProgress(progress) {
    if (gameeState === eGameeState.ready) {
        gamee.updateMissionProgress(progress);
    }
}



var eGameeAdState = Object.freeze({ "ready": 0, "loading": 1, "showing": 2, "uninitialized": 3 });
var gameeAdState = eGameeAdState.uninitialized;



function gamee_loadAd() {
    if (gameeState >= eGameeState.initialized) {
        try {
            gamee.loadRewardedVideo(function (error, data) {
                gameeAdState = (data && data.videoLoaded ? eGameeAdState.ready : gameeAdState.uninitialized);
            });
        }
        catch (e) {
            console.log("gamee.loadRewardedVideo Exception");
        }
    }
}



function gamee_showAd() {
    if (gameeAdState !== eGameeAdState.ready)
        return false;

    gameeAdState = eGameeAdState.showing;

    gamee.showRewardedVideo(function (error, data) {
        gameeAdState = eGameeAdState.uninitialized;
        gmCallback.gamee_onAdComplete(data.videoPlayed);
    });

    return true;
}



function gamee_isAdReady() {
    return gameeAdState == eGameeAdState.ready;
}