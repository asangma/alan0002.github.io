// jshint bitwise:false
define([
  "./GLFBO",
  "./Util"
], function (GLFBO,Util) {


  var NormalTextureHelper = function NormalTextureHelper(gl) {
    var normalFBO;

    var viewportToRestore;

    this.setEnableState = function (state) {
      if (state === this.getEnableState()) {
        return;
      }

      if (state) {
        this.enable();
      }
      else {
        this.disable();
      }
    };

    this.getEnableState = function () {
      return normalFBO !== undefined;
    };

    this.getNormalFBO = function() {
      return normalFBO;
    };

    this.enable = function () {
      Util.assert(!this.getEnableState());

      normalFBO = new GLFBO(gl.RGBA, gl.UNSIGNED_BYTE, true, gl.NEAREST, gl);
    };

    this.disable = function () {
      Util.assert(this.getEnableState());

      normalFBO.dispose();

      normalFBO = undefined;
    };

    var width, height;
    this.setupFBOs = function (camera) {
      Util.assert(this.getEnableState());

      var viewport = camera.viewport;
      viewportToRestore = viewport;

      width = viewport[2];//Math.floor(viewport[2] / 2) * 2;
      height = viewport[3];//Math.floor(viewport[3] / 2) * 2;

      gl.viewport(0, 0, width, height);
    };

    this.prepareNormalPass = function () {
      Util.assert(this.getEnableState());

      normalFBO.setSize(width, height);

      normalFBO.bind();

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    };

    this.finish = function(fbo) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(viewportToRestore[0], viewportToRestore[1], viewportToRestore[2], viewportToRestore[3]);
    };

  };

  return NormalTextureHelper;
});
