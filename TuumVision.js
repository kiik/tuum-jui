

var TuumVision = function(canvas) {
  this.mCanvas = canvas;
  this.mCtx = canvas.getContext('2d');

  var that = this;
  function init() {
    that.mCtx.beginPath();
    that.mCtx.rect(0, 0, canvas.width, canvas.height);
    that.mCtx.fillStyle = "green";
    that.mCtx.fill();
  }

  init();

  return this;
}

TuumVision.prototype.debugLine = function(ctx, p0, p1) {
  var v = [p1[0] - p0[0], p1[1] - p0[1]];

  ctx.beginPath();
  ctx.moveTo(p0[0],p0[1]);
  ctx.lineTo(p0[0] + v[0], p0[1]);
  ctx.lineTo(p0[0] + v[0], p0[1] + v[1]);
  ctx.lineTo(p0[0], p0[1] + v[1]);
  ctx.lineTo(p0[0], p0[1]);
  ctx.stroke();
}

TuumVision.prototype.renderFrame = function(png_data) {
  this.mCtx.clearRect(0, 0, this.mCanvas.width, this.mCanvas.width);

  var img = new Image();
  var that = this;
  img.onload = function() {
    that.mCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, that.mCanvas.width, that.mCanvas.height);
  }
  img.src = "data:image/png;base64," + png_data;
}

TuumVision.prototype.getPixelsOnLine = function(p0, p1) {
  var v = [p1[0] - p0[0], p1[1] - p0[1]];
  var x0 = Math.min(p0[0], p1[0]), y0 = Math.min(p0[1], p1[1]),
      x1 = Math.max(p0[0], p1[0]), y1 = Math.max(p0[1], p1[1]);

  var idat = this.mCtx.getImageData(x0, y0, Math.abs(v[0]), Math.abs(v[1]));

  var data = idat.data;
  var pxs = [];
  var dy = v[1] * 1.0 / v[0];

  var i;
  for(var y = 0, x = 0; x < (x1 - x0); x++, y = dy * x) {
    if(dy < 0) y = Math.abs(v[1]) + y;

    i = (Math.round(Math.abs(y)) * idat.width + x) * 4;

    if(data[i] == undefined) continue; //FIXME: Why does this occur?
    pxs.push([data[i++], data[i++], data[i++]]);

    //data[i] = 255;
  }

  //this.mCtx.putImageData(idat, x0, y0);
  return pxs;
}

TuumVision.prototype.calcColorShades = function(pxs, C = 3) {
  var last_px = pxs[0], shade = pxs[0];
  var shades = [];
  shades.push(last_px);

  var err;
  for(var ix = 0; ix < pxs.length; ix++) {
    err = 0;
    var px = pxs[ix];
    for(var i = 0; i < C; i++)
      err += (px[i] - last_px[i]) / 255.0 / C;

    //console.log("Err: " + err);
    if(err > 0.001) {
      shades.push([Math.round(shade[0]), Math.round(shade[1]), Math.round(shade[2])]);
      shade = px;
    } else {
      for(var i = 0; i < C; i++)
        shade[i] = (shade[i] + px[i]) / 2.0;
    }

    last_px = px;
  }

  return shades;
}

TuumVision.prototype.PixelUVFilterPack = function(pxs) {
  // Y: [Y, Umin, Umax, Vmin, Vmax]
  data = {

  }
  console.log(pxs);
  for(var p in pxs) {
    if(!pxs.hasOwnProperty(p)) continue;
    px = pxs[p];

    if(data.hasOwnProperty(p[0])) {
      var l_px = data[px[0]];

      l_px[1] = Math.min(l_px[1], px[1]); // Umin
      l_px[2] = Math.min(l_px[3], px[3]); // Vmin

      l_px[3] = Math.max(l_px[2], px[2]); // Umax
      l_px[4] = Math.max(l_px[4], px[4]); // Vmax

      data[px[0]] = l_px;
      console.log("UPDATE:" + l_px);
    } else {
      data[px[0]] = [px[0], px[1], px[1], px[2], px[2]];
    }
  }

  out = [];
  for(var k in data) {
    if(!data.hasOwnProperty(k)) continue;
    out.push(data[k]);
  }

  return out;
}

TuumVision.prototype.calcRange = function(pxs) {
  var out_mn = [255, 255, 255],
      out_mx = [0, 0, 0];

  for(var i in pxs) {
    var px = pxs[i];

    for(var ix = 0; ix < 3; ix++)
      out_mn[ix] = Math.min(out_mn[ix], px[ix]);

    for(var ix = 0; ix < 3; ix++)
      out_mx[ix] = Math.max(out_mx[ix], px[ix]);
  }

  return out_mn.concat(out_mx);
}

TuumVision.rangeUnion = function(r1, r2) {
  var out = [255, 255, 255, 0, 0, 0];

  for(var i = 0; i < 3; i++)
    out[i] = Math.min(r1[i], r2[i])

  for(var i = 3; i < 6; i++)
    out[i] = Math.max(r1[i], r2[i])

  return out;
}
