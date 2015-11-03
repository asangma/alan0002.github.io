/* jshint forin:false */
define([
  "./Texture",
  "./Util"
  ], function (Texture, Util){
  var nextHighestPowerOfTwo = Util.nextHighestPowerOfTwo;

  var __textCanvas2D;
  var create2Dcanvas = function()
  {
    if (__textCanvas2D===undefined)
    {
      __textCanvas2D = document.createElement("canvas");
      __textCanvas2D.setAttribute("id", "canvas2d");
      __textCanvas2D.setAttribute("width", 1024);
      __textCanvas2D.setAttribute("height", 1024);
      __textCanvas2D.setAttribute("style", "display:none");
    }
  };

  var toCSSColor = function(rgbArray) {
    return "rgb(" + rgbArray.map(function(v) { return Math.floor(v*255);}).toString() + ")";
  };


  var TextTexture = function TextTexture(string, params, idHint) {
    params = params || {};
    params.size = params.size || 18;
    params.font = params.font || { family: "Arial" };
    params.font.family = params.font.family || "Arial";
    params.font.weight = params.font.weight || "normal";
    params.font.style = params.font.style || "normal";
    var fillStyle = toCSSColor(params.color);

    var that = this;

    this._id = null;

    this.getId = function () {
        if (this._id==null) { //lazy id creation
          this._id = Texture.__idGen.gen(idHint);
        }
        return this._id;
    };


    var unloadFunc;

    var stringArray = string.split(/\r?\n/);

    this.getParams = function() {
      return params;
    };

    this.getString = function() {
      return string;
    };

    this.renderGl = function(glName, gl) {
      this._createTextTexture(stringArray, glName, gl);
      if (gl._isTracingEnabled) {
        glName._debugTracingType = "TextTexture";
      }
    };

    this.getTextWidth = function()
    {
      create2Dcanvas();
      var ctx =  __textCanvas2D.getContext("2d");
      this.setTextProperties(ctx, params.size);

      var max = 0;
      for (var s in stringArray)
      {
        var width = ctx.measureText(stringArray[s]).width;
        if (width>max) {
          max = width;
        }
      }

      //workaround because measureText ignores italic and bold
      if (params.font.style=="italic" || params.font.style=="oblique" ||
          params.font.weight=="bold" || params.font.weight=="bolder" || params.font.weight>600) {
        max += ctx.measureText("A").width*0.3; //multiplier estimated using trial&error to get minimal offset that works
      }

      return max;
    };

    this.setTextProperties = function(ctx, size)
    {
      ctx.fillStyle = fillStyle;
      var fontString = params.font.style +" " + params.font.weight +" " + size + "px " + params.font.family;
      ctx.font = fontString;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      if (params.canvasStyle) {
        Util.mergeObjects(ctx, params.canvasStyle, ctx);
      }
    };

    this.getTextHeight = function()
    {
      return this.getLineHeight()*stringArray.length;
    };

    this.getTexcoordScale = function()
    {
      if (params.enableMipmapping)
      {
        var h = this.getTextHeight();
        var w = this.getTextWidth();
        return [w/nextHighestPowerOfTwo(w),h/nextHighestPowerOfTwo(h)];
      }
      else {
        return [1, 1];
      }
    };

    this.getLineHeight = function()
    {
      return Math.floor(params.size*1.2);
    };

    this._createTextTexture = function(stringArray, glName, gl, style)
    {
      create2Dcanvas();

      var ctx =  __textCanvas2D.getContext("2d");
      ctx.save();

      var width = this.getTextWidth();
      var height = this.getTextHeight();
      if (params.enableMipmapping) {
        width = nextHighestPowerOfTwo(width);
        height = nextHighestPowerOfTwo(height);
      }

      // bind texture as currently acitve texture
      gl.bindTexture(gl.TEXTURE_2D, glName);

      __textCanvas2D.setAttribute("width", width);
      __textCanvas2D.setAttribute("height", height);
      this.renderText(1, width, height, ctx);
      gl.texImage2D(gl.TEXTURE_2D, 0,gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, __textCanvas2D);

      var minFilter = gl.LINEAR;
      if (params.enableMipmapping) {
        //var startTime = Util.performance.now();
        gl.generateMipmap(gl.TEXTURE_2D);
        if (TextTexture.MIPMAP_CREATE) {
          TextTexture.MIPMAP_CREATE(__textCanvas2D, gl);
          minFilter = gl.LINEAR_MIPMAP_LINEAR;
        } else {
          renderMipmap(gl);
          minFilter = gl.LINEAR_MIPMAP_NEAREST;
        }
        //TextTexture.timeSpentCreatingMipmaps += Util.performance.now() - startTime;
      }

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);

      gl.bindTexture(gl.TEXTURE_2D, null);
      ctx.restore();
    };

    this.setUnloadFunc = function(fun) {
      unloadFunc = fun;
    };

    this.unload = function() {
      if (unloadFunc !== undefined) {
        unloadFunc(this._id);
        unloadFunc = undefined;
      }
    };

    this.renderText = function(scaleFactor, width, height, ctx, atlasOffX, atlasOffY) {
      var lineHeight = that.getLineHeight()*scaleFactor;

      that.setTextProperties(ctx, params.size*scaleFactor);
      // enable for background filling
      //ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      //ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      var xoffset = (ctx.textAlign === "center") ? 0.5 * width : (ctx.textAlign === "right") ? width : 0;
      xoffset += atlasOffX || 0;
      var yoffset = 0;
      yoffset += atlasOffY || 0;
      for (var s in stringArray) {
        ctx.fillText(stringArray[s], xoffset, yoffset);
        yoffset += lineHeight;
      }
    };

    var renderMipmap = function(gl) {
      var ctx = __textCanvas2D.getContext("2d");
      var width = __textCanvas2D.getAttribute("width")/2;
      var height = __textCanvas2D.getAttribute("height")/2;
      var scaleFactor = 0.5;
      var level = 1;
      do {
        __textCanvas2D.setAttribute("width", width);
        __textCanvas2D.setAttribute("height", height);
        this.renderText(ctx, scaleFactor, width, height, ctx);
        gl.texSubImage2D(gl.TEXTURE_2D, level, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, __textCanvas2D);
        scaleFactor *= 0.5;
        width *= 0.5; height *= 0.5;
        level++;
      } while ((width > 1) && (height > 1));
    }.bind(this);
  };

  //TextTexture.MIPMAP_CREATE = TextureUtil.createGamma3CPU;
  TextTexture.MIPMAP_CREATE = undefined;
  //TextTexture.timeSpentCreatingMipmaps = 0;

  return TextTexture;
});
