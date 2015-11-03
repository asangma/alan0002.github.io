define([], function() {
  var GLDefaultState = function(gl) {
    this.cullEnabled = false;
    this.blendFuncSrc = gl.SRC_ALPHA;
    this.blendFuncDst = gl.ONE_MINUS_SRC_ALPHA;
    this.depthFunc = gl.LESS;

    this.apply= function() {
      if (this.cullEnabled) { gl.enable(gl.CULL_FACE); } else { gl.disable(gl.CULL_FACE); }
      gl.blendFunc(this.blendFuncSrc, this.blendFuncDst);
      gl.depthFunc(this.depthFunc);
    };
  };

  return GLDefaultState;
});
