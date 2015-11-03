/* jshint forin:false */
define([
  "./Util",
  "./GLUtil"
  ], function (Util, GLUtil) {

  var GLTextureRep = function GLTextureRep(textures, programRep, getViewportToRestore, gl) {
    var NUM_PARALLEL = 8;

    var id2textureRef = {};

    var loading = {};
    var queue = [];

    var listeners = [];

    var afExt = (
        gl.getExtension("EXT_texture_filter_anisotropic") ||
        gl.getExtension("MOZ_EXT_texture_filter_anisotropic") ||
        gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic")
    );
    var maxMaxAnisotropy = afExt ? gl.getParameter(afExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
    var maxAnisotropy = Math.min(8, maxMaxAnisotropy);

    var needsRender = true;

    var TextureRef = function() {
      var glName = gl.createTexture();
      var refCount = 0;

      this.incRefCnt = function() {
        ++refCount;
      };

      this.decRefCnt = function() {
        --refCount;
        Util.assert(refCount >= 0);
      };

      this.getRefCnt = function() {
        return refCount;
      };

      this.getGLName = function() {
        return glName;
      };
    };

    var unload = function(id) {
      var textureRef = id2textureRef[id];
      if (textureRef !== undefined) {
        gl.deleteTexture(textureRef.getGLName());
        delete id2textureRef[id];
      }
    };

    this.resetNeedsRender = function() {
      needsRender = false;
    };

    this.needsRender = function() {
      return needsRender;
    };

    this.aquire = function(id, initTexture, useTransparentInitTex, loadedCallback) {
      var textureRef = id2textureRef[id];

      if (textureRef === undefined) {
        textureRef = new TextureRef();

        Util.assert(id2textureRef[id] === undefined);
        id2textureRef[id] = textureRef;

        var texture = textures[id];
        Util.assert(texture !== undefined);
        texture.setUnloadFunc(unload);

        var glName = textureRef.getGLName();
        initializeTexture(glName, texture, initTexture, useTransparentInitTex);

        if (texture.renderGl) {
          texture.renderGl(glName, gl);

          loadedCallback && loadedCallback(textureRef);
        }
        else if (texture.deferredLoading()) {
          if (this.getLoadingCount() < NUM_PARALLEL) {
            loadImage(id, glName, loadedCallback);
          }
          else {
            queue.push([ id, glName, loadedCallback ]);
          }
        } else {
          texture.loadGl(function() {
            needsRender = true;
            loadedCallback && loadedCallback(textureRef);
          }, glName, gl, programRep, getViewportToRestore());
        }

        needsRender = true;
      }

      textureRef.incRefCnt();

      return textureRef.getGLName();
    };

    this.release = function(id) {
      var textureRef = id2textureRef[id];

      if (textureRef !== undefined) {
        textureRef.decRefCnt();
        Util.assert(textureRef.getRefCnt() >= 0);
      }
    };

    this.getLoadingCount = function() {
      return Object.keys(loading).length;
    };

    this.getIsLoaded = function(id) {
      if (id2textureRef[id] === undefined) {
        return false;
      }

      if (loading[id] !== undefined) {
        return false;
      }

      for (var i = 0, length = queue.length; i < length; ++i) {
        if (queue[i][0] === id) {
          return false;
        }
      }

      return true;
    };

    this.addTextureListener = function(listener) {
      Util.assert(listeners.indexOf(listener) === -1);
      listeners.push(listener);
    };

    this.removeTextureListener = function(listener) {
      var idx = listeners.indexOf(listener);
      
      Util.assert(idx !== -1);
      listeners.splice(idx, 1);
    };

    this.getTexture = function(id) {
      return textures[id];
    };

    this.setMaxAnisotropy = function(newMaxAnisotropy) {
      if (afExt) {
        newMaxAnisotropy = Util.clamp(newMaxAnisotropy, 1, maxMaxAnisotropy);

        if (newMaxAnisotropy !== maxAnisotropy) {
          maxAnisotropy = newMaxAnisotropy;

          for (var texId in id2textureRef) {
            var glName = id2textureRef[texId].getGLName();
           
            gl.bindTexture(gl.TEXTURE_2D, glName);
            gl.texParameterf(gl.TEXTURE_2D, afExt.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
          }
        }
      }
    };

    this.getMaxAnisotropy = function() {
      return maxAnisotropy;
    };

    var initBuffer = new Uint8Array(8 * 8 * 4);
    var initBufferTransparent = new Uint8Array(8 * 8 * 4);

    for (var i = 0, length = initBuffer.length; i < length; ++i) {
      initBuffer[i] = 255;
      initBufferTransparent[i] = (i + 1) % 4 !== 0 ? 255 : 0;
    }

    var initializeTexture = function(glName, texture, initTexture, useTransparentInitTex) {
      gl.bindTexture(gl.TEXTURE_2D, glName);

      if (texture.params && texture.params.wrapClamp) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }

      if (initTexture !== undefined) {
        if (Array.isArray(initTexture.id)) {
          // downscale from grid of textures
          var num = initTexture.num;
          Util.assert(initTexture.id.length === (num * num));

          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, num * 256, num * 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          var frameBuffer = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

          for (var y = 0;  y < num; y++) {
            for (var x = 0;  x < num; x++) {
              gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, id2textureRef[initTexture.id[y*num+x]].getGLName(), 0);
              GLUtil.checkFramebufferStatus(gl.FRAMEBUFFER, gl);

              gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, x * 256, y * 256, 0, 0, 256, 256);
            }
          }

          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.deleteFramebuffer(frameBuffer);
        } else {
          // upscale from single texture
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, initTexture.width, initTexture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          GLUtil.copyTextureToTexture(id2textureRef[initTexture.id].getGLName(), glName, initTexture.x, initTexture.y, 0, 0, initTexture.width, initTexture.height, gl);
        }
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        if (useTransparentInitTex !== undefined && useTransparentInitTex) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, initBufferTransparent);
        }
        else {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, initBuffer);
        }
      }

      if (afExt) {
        gl.texParameterf(gl.TEXTURE_2D, afExt.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
      }
    };

    var next = function(id) {
      if (id in loading) {
        delete loading[id];

        var allIds = Object.keys(id2textureRef);
        var loadingIds = Object.keys(loading);

        listeners.forEach(function(listener){
          listener(id, allIds, loadingIds);
        });

        processQueue();
      }
    };

    var loadImage = function(id, glName, loadedCallback) {
      Util.assert(loading[id] === undefined);
      loading[id] = true;

      var texture = textures[id];
      Util.assert(texture !== undefined);

      setTimeout(function() {
        var textureRef = id2textureRef[id];

        if (textureRef && textureRef.getRefCnt()) {
          texture.loadGl(function() {
            next(id);
            needsRender = true;

            textureRef = id2textureRef[id];

            if (textureRef && textureRef.getRefCnt()) {
              loadedCallback && loadedCallback(texture);
            }
          }, glName, gl, programRep, getViewportToRestore());
        }
      }, 0);
    };

    var processQueue = function() {
      var newQueue = [];
      var i;

      for (i = 0, length = queue.length; i < length; ++i) {
        var id = queue[i][0];
        var textureRef = id2textureRef[id];

        if (textureRef !== undefined) {
          var refCnt = textureRef.getRefCnt();

          if (refCnt === 0) {
            gl.deleteTexture(textureRef.getGLName());
            delete id2textureRef[id];
          } else {
            newQueue.push(queue[i]);
          }
        }
      }

      queue = newQueue;

      var num = Math.min(NUM_PARALLEL - Object.keys(loading).length, queue.length);

      for (i = 0; i < num; ++i) {
        loadImage(queue[i][0], queue[i][1], queue[i][2]);
      }

      queue.splice(0, num);
    };
  };

  return GLTextureRep;
});
