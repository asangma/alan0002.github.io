/* global ImageData:true */

define([
  "./IdGen",
  "./Util",
  "./GLUtil",
  "./DDSUtil"
  ], function (IdGen, Util, GLUtil, DDSUtil){

  var __Texture_idGen = new IdGen();

  var loadTextureFromUri = function(uri, glName, gl, programRep, viewport, callback, mipmap, noUnpackFlip) {
    mipmap = mipmap!==false;
    var image = new Image();
    image.src = uri;

    image.onerror = function() {
      callback();
      image.onerror = undefined;
      image.onload = undefined;
    };

    image.onload = function() {
      if (gl.isTexture(glName)) {
        GLUtil.texImage2D(image, glName, gl, programRep, viewport, mipmap, true, noUnpackFlip);
      }
      callback();
      image.onerror = undefined;
      image.onload = undefined;
    };
  };

  var Texture = function Texture(data, idHint, params_) {
    var id = __Texture_idGen.gen(idHint);
    var unloadFunc;
    this.getId = function() { return id; };

    this.params = params_ || {};
    this.params.wrapClamp = this.params.wrapClamp || false;
    this.params.mipmap = this.params.mipmap !== false;
    this.params.noUnpackFlip = this.params.noUnpackFlip||false;

    this.estimatedTexMemRequiredMB = data==null?0:data.byteLength?data.byteLength/1000000:1.3*this.params.width*this.params.height*4/1000000;

    this.getEstimatedTexMemRequiredMB = function() {
      return this.estimatedTexMemRequiredMB;
    };

    this.dispose = function() {
      data = undefined;
    };

    this.deferredLoading = function() {
      return typeof data === "string";
    };

    this.getWidth = function() {
      return this.params.width;
    };

    this.getHeight = function() {
      return this.params.height;
    };

    this.loadGl = function(callback,  glName, gl, programRep, viewport) {
      if (typeof data === "string") {
        loadTextureFromUri(data, glName, gl, programRep, viewport, callback, this.params.mipmap, this.params.noUnpackFlip);
      } else if ((data instanceof Image) || (data instanceof ImageData) || (data instanceof HTMLCanvasElement)) {
        this.params.width = data.width;
        this.params.height = data.height;
        GLUtil.texImage2D(data, glName, gl, programRep, viewport, this.params.mipmap, this.params.mipmap || !this.params.wrapClamp, this.params.noUnpackFlip);
      } else if (data) {
        if (this.params.encoding === Texture.DDS_ENCODING) {
          var params = DDSUtil.uploadDDSLevels(gl, data, true);
          //gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, params.mipmapCount > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
          this.params.width = params.width;
          this.params.height = params.height;
        }
        else {
          // raw data
          if (this.params.noUnpackFlip===true) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          }
          Util.assert(this.params.width && this.params.height);
          //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.params.width, this.params.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

          var format = gl.RGBA;
          if(this.params.components === 1) {
            format = gl.LUMINANCE;
          }

          gl.texImage2D(gl.TEXTURE_2D, 0, format, this.params.width, this.params.height, 0, format, gl.UNSIGNED_BYTE, data);
          if (this.params.mipmap) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
          } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          }
          if (this.params.noUnpackFlip===true) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          }
        }
      }

      if (gl._isTracingEnabled) {
        glName._debugTracingType = "Texture";
      }
      data = undefined;
    };


    this.setUnloadFunc = function(fun) {
      unloadFunc = fun;
    };

    this.unload = function() {
      if (unloadFunc !== undefined) {
        unloadFunc(id);
        unloadFunc = undefined;
      }
    };
  };

  // export ID generator for other texture classes
  Texture.__idGen = __Texture_idGen;

  Texture.DDS_ENCODING = "image/vnd-ms.dds";

  return Texture;
});