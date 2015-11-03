define([
  "./Util"
  ], function (Util) {

  var __GLVBO_id = 0;

  var GLVBO = function GLVBO(data, vertexBufferLayout, gl) {
    this.glName = gl.createBuffer();
    this.num = 0;
    this.vertexBufferLayout = vertexBufferLayout;
    this.gl = gl;

    if (data !== undefined) {
      this.setData(data, data.length);
    }

    this.id = __GLVBO_id++;
  };

  GLVBO.prototype.setData = function(arr, length, drawMode) {
    var gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.glName);
    gl.bufferData(gl.ARRAY_BUFFER, arr, drawMode || gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.num = length / this.vertexBufferLayout.getStride();
  };

  GLVBO.prototype.updateSubData = function(arr, begin, end) {
    var gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.glName);
    gl.bufferSubData(gl.ARRAY_BUFFER, begin*4, arr.subarray(begin, end));
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  };

  GLVBO.prototype.bind = function() {
    var gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.glName);
  };

  GLVBO.prototype.setPointers = function(program, instanced) {
    var gl = this.gl;

    this.vertexBufferLayout.setVertexAttribPointers(gl, program, instanced);
  };

  GLVBO.prototype.getNum = function() {
    return this.num;
  };

  GLVBO.prototype.getId = function() {
    return this.id;
  };

  GLVBO.prototype.getLayout = function() {
    return this.vertexBufferLayout;
  };

  GLVBO.prototype.dispose = function() {
    var gl = this.gl;

    gl.deleteBuffer(this.glName);
  };

  GLVBO.GLVBORep = function() {
    var vbos = {};

    this.add = function(name, vbo) {
      Util.assert(vbos[name] === undefined);

      vbos[name] = vbo;
    };

    this.get = function(name) {
      return vbos[name];
    };
  };

  return GLVBO;
});