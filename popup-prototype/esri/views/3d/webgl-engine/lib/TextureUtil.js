// jshint bitwise:false
define([], function () {

  var TextureUtil = {};

  var __gamma3LUT;
  var __gamma3InvLUT;
  var __gamma3InvLUTSize = 256;
  var __gamma3InvLUTFactor = 1/(256*256*256/__gamma3InvLUTSize);

  var __gamma3LUTCreate = function() {
    if (__gamma3LUT) {
      return;
    }

    __gamma3LUT = new Array(256);
    var i;
    for (i = 0; i < 256; i++) {
      __gamma3LUT[i] = i*i*i;
    }

    __gamma3InvLUT = new Array(__gamma3InvLUTSize);
    for (i = 0; i < __gamma3InvLUTSize; i++) {
      var val = i/__gamma3InvLUTSize*256*256*256;
      __gamma3InvLUT[i] = Math.pow(val, 1/3);
    }
  };
  var __gamma3Sample = function(v1, v2, v3, v4) {
    var sum = 0;
    sum += __gamma3LUT[v1];
    sum += __gamma3LUT[v2];
    sum += __gamma3LUT[v3];
    sum += __gamma3LUT[v4];
    return __gamma3InvLUT[Math.round(sum/4*__gamma3InvLUTFactor)];
  };

  TextureUtil.createGamma3CPU = function(canvas, gl) {
    __gamma3LUTCreate();
    var ctx = canvas.getContext("2d");
    var width = canvas.getAttribute("width");
    var height = canvas.getAttribute("height");
    var lastData = ctx.getImageData(0, 0, width, height);
    var scaleFactor = 0.5;
    width >>= 1;
    height >>= 1;
    var level = 1;
    do {
      canvas.setAttribute("width", width);
      canvas.setAttribute("height", height);

      var newData = ctx.createImageData(width, height);

      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var i0 = (y*width + x)*4;
          var i1 = ((y*2*width*2) + x*2)*4;
          var i3 = (((y*2 + 1)*width*2) + x*2)*4;
          for (var i = 0; i < 4; i++) {
            newData.data[i0+i] = __gamma3Sample(lastData.data[i1+i], lastData.data[i1+4+i],
              lastData.data[i3+i], lastData.data[i3+4+i]);
          }
        }
      }

      ctx.putImageData(newData, 0, 0);
      gl.texSubImage2D(gl.TEXTURE_2D, level, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

      lastData = newData;
      scaleFactor *= 0.5;
      width >>= 1;
      height >>= 1;
      level++;
    } while ((width > 1) && (height > 1));
  };

  return TextureUtil;
});