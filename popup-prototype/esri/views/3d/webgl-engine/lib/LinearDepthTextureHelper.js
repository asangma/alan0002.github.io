// jshint bitwise:false
define([
  "./GLFBO",
  "./Util"
], function (GLFBO,Util) {


  var LinearDepthTextureHelper = function LinearDepthTextureHelper(gl) {
    var depthFBO;

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
      return depthFBO !== undefined;
    };

    this.getDepthFBO = function() {
      return depthFBO;
    };

    this.enable = function () {
      Util.assert(!this.getEnableState());
      depthFBO = new GLFBO(gl.RGBA, gl.UNSIGNED_BYTE, true, gl.NEAREST, gl);
    };

    this.disable = function () {
      Util.assert(this.getEnableState());


      depthFBO.dispose();

      depthFBO = undefined;
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

    this.prepareDepthPass = function () {
      Util.assert(this.getEnableState());

      depthFBO.setSize(width, height);
      depthFBO.bind();
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    };

    this.finish = function(fbo) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(viewportToRestore[0], viewportToRestore[1], viewportToRestore[2], viewportToRestore[3]);
    };

  };

  return LinearDepthTextureHelper;
});
