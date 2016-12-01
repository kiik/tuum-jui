
function calcMousePos(c, e) {
  var rect = c.getBoundingClientRect(), // abs. size of element
     scaleX = c.width / rect.width,    // relationship bitmap vs. element for X
     scaleY = c.height / rect.height;  // relationship bitmap vs. element for Y

   return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
}

function calcCanvasPos(c, p) {
  var rect = c.getBoundingClientRect(),
     scaleX = c.width / rect.width,
     scaleY = c.height / rect.height;

  return [(rect.left - p[0]) / scaleX, (rect.top - p[1]) / scaleY];
}

var CanvasInputHandler = function(elem) {
  var mTarget = elem;
  var mPos = [0, 0];

  var cbMap = {

  };

  var keyMap = {

  };

  var that = this;

  mTarget.addEventListener('mousemove', function(evt) {
    mPos = calcMousePos(mTarget, evt);
    that.emit('mousemove', mPos);
  }, false);

  mTarget.addEventListener('mousedown', function(evt) {
    keyMap['LMB'] = true;
    mPos = calcMousePos(mTarget, evt);
    that.emit('mousedown');
  }, false);

  mTarget.addEventListener('mouseup', function(evt) {
    keyMap['LMB'] = false;
    mPos = calcMousePos(mTarget, evt);
    that.emit('mouseup');
  }, false);


  this.getMousePos = function() { return mPos; }

  this.getMouseDown = function(k) {
    if(!(keyMap[k].hasOwnProperty(k))) return false;
    return keyMap[k];
  }


  this.on = function(ev, cb) {
    for(var k in cbMap) {
      if(!(cbMap.hasOwnProperty(k))) continue;
      if(k != ev) continue;
      cbMap[ev].push(cb);
      return;
    }

    cbMap[ev] = [cb];
  }

  this.emit = function(ev, dat) {
    if(!(cbMap.hasOwnProperty(ev))) return;

    for(var cId = 0; cId < cbMap[ev].length; cId++) {
      var cb = cbMap[ev][cId];
      cb(dat);
    }
  }

  return this;
}
