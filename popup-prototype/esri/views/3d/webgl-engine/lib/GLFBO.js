define([
  "./GLUtil"
  ], function (GLUtil) {

  var GLFBO = function GLFBO(format, type, depth, texFilter, gl, texture) {
    var frameBuffer = gl.createFramebuffer();
    texture = texture || gl.createTexture();
    var renderBuffer = depth ? gl.createRenderbuffer() : undefined;

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texFilter);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var dimI = 0;
    var dimJ = 0;

    this.dispose = function() {
      gl.deleteFramebuffer(frameBuffer);
      gl.deleteTexture(texture);
      
      if (renderBuffer !== undefined) {
        gl.deleteRenderbuffer(renderBuffer);
      }
    };

    this.setSize = function(width, height) {
      if (width === dimI && height === dimJ) {
        return;
      }

      dimI = width;
      dimJ = height;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, format, dimI, dimJ, 0, format, type, null);

      if (renderBuffer !== undefined) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, dimI, dimJ);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      
      if (renderBuffer !== undefined) {
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
      }

      GLUtil.checkFramebufferStatus(gl.FRAMEBUFFER, gl);

      if (renderBuffer !== undefined) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);  // ?
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    this.getWidth = function() {
      return dimI;
    };

    this.getHeight = function() {
      return dimJ;
    };

    this.bind = function() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    };

    this.getTexture = function() {
      return texture;
    };

    this.getGLName = function() {
      return frameBuffer;
    };
  };

  return GLFBO;
});