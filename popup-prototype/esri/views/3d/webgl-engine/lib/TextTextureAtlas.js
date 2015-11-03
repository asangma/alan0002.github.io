/* jshint forin:false */
define([
  "./Texture",
  "./ModelContentType"
], function (Texture, ModelContentType){

  var atlasWidth = 512;

  var __textCanvas2D;
  var create2Dcanvas = function()
  {
    if (__textCanvas2D===undefined)
    {
      __textCanvas2D = document.createElement("canvas");
      __textCanvas2D.setAttribute("id", "canvas2d");
      __textCanvas2D.setAttribute("width", atlasWidth);
      __textCanvas2D.setAttribute("height", atlasWidth);
      __textCanvas2D.setAttribute("style", "display:none");
    }
  };

  var TextureAtasSubtexture = function TextureAtasSubtexture(idHint) {

    this._textTextures = {};

    var id = Texture.__idGen.gen(idHint);
    var unloadFunc = null;
    this.getId = function() { return id; };

    this.dispose = function() {
    };

    this.deferredLoading = function() {
      return false;
    };

    this.getWidth = function() {
      return atlasWidth;
    };

    this.getHeight = function() {
      return atlasWidth;
    };

    this.renderGl = function (glName, gl) {
      //TODO is this called too often? or might "addTexture" be missed?
      this._createTextTexture(glName, gl);
      if (gl._isTracingEnabled) {
        glName._debugTracingType = "TextTextureAtlas";
      }
    };


    this._createTextTexture = function (glName, gl) {
      create2Dcanvas();

      var ctx = __textCanvas2D.getContext("2d");
      ctx.save();

      ctx.clearRect (0,0,atlasWidth,atlasWidth);

      // bind texture as currently acitve texture
      gl.bindTexture(gl.TEXTURE_2D, glName);

      for(var textIdx in this._textTextures) {
          var t = this._textTextures[textIdx];
        t.textTexture.renderText(1, t.placement.width, t.placement.height, ctx, t.placement.atlasOffX, t.placement.atlasOffY);
      }

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, __textCanvas2D);

      var minFilter = gl.LINEAR;

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
      if (unloadFunc != null) {
        unloadFunc(id);
        unloadFunc = undefined;
      }
    };
  };

  var TextTextureAtlas = function TextTextureAtlas(idHint, stage) {

    var textureAtasSubtextures = [];

    var curX = 0;
    var curY = 0;
    var curLineHeight = 0;

    this.dispose = function() {
      for (var i=0; i<textureAtasSubtextures.length; i++) {
        stage.remove(ModelContentType.TEXTURE, textureAtasSubtextures[i].getId());
      }
      textureAtasSubtextures = [];
    };

    this.addTextTexture = function (t) {
      //find empty place in current texture

      var textId = JSON.stringify(t.getParams())+"_"+ t.getString();

      for (var i=0; i<textureAtasSubtextures.length; i++) {
        var textInfo = textureAtasSubtextures[i]._textTextures[textId];
        if (textInfo!=null) {
          return textInfo.placement;
        }
      }

      var newTex = null;
      if (textureAtasSubtextures.length === 0) {
        newTex = new TextureAtasSubtexture(idHint);
        textureAtasSubtextures.push(newTex);
      }

      var width = t.getTextWidth();
      var height = t.getTextHeight();
      var atlasOffX, atlasOffY;

      curLineHeight = Math.max(curLineHeight, height);

      if (curX + width < atlasWidth && (curY+curLineHeight<atlasWidth)) {
        atlasOffX = curX;
        atlasOffY = curY;
        curX+=width;
      } else
      {
        if (curY+curLineHeight+height<atlasWidth) {
          curX = 0;
          curY+=curLineHeight;
          curLineHeight = height;
          atlasOffX = curX;
          atlasOffY = curY;
          curX+=width;
        }
        else
        {
          newTex = new TextureAtasSubtexture(idHint);
          textureAtasSubtextures.push(newTex);

          curX = 0;
          curY = 0;
          curLineHeight = height;

          atlasOffX = curX;
          atlasOffY = curY;
          curX+=width;
        }
      }

      if (newTex!=null) {
        stage.add(ModelContentType.TEXTURE, newTex);
      }


      var curTex = textureAtasSubtextures[textureAtasSubtextures.length-1];

      var placement = {
        uvMinMax: [atlasOffX/atlasWidth,1.0-(atlasOffY+height)/atlasWidth , (atlasOffX+width)/atlasWidth, 1.0-(atlasOffY/atlasWidth)], //in [0,1]
        atlasOffX: atlasOffX, // in pixels
        atlasOffY: atlasOffY,
        width: width,
        height: height,
        texture: curTex
      };

      //console.debug("text "+t.getString()+" uvMinMax "+placement.uvMinMax);
      curTex._textTextures[textId] = {placement: placement, textTexture: t};

      return placement;
    };

  };

   return TextTextureAtlas;
});
