createjs.Graphics.prototype.dashedLineTo = function(x1, y1, x2, y2, dashLen) {
    this.moveTo(x1, y1);
    
    var dX = x2 - x1;
    var dY = y2 - y1;
    var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
    var dashX = dX / dashes;
    var dashY = dY / dashes;
    
    var q = 0;
    while (q++ < dashes) {
        x1 += dashX;
        y1 += dashY;
        this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
    }
    this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x2, y2); 
}