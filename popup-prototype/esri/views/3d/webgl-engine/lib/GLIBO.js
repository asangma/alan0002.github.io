define([
  "./Util"
], function (Util) {

  var __GLIBO_id = 0;

  function GLIBO(data, gl) {
    this.glName = gl.createBuffer();

    this.num = 0;
    this.type = undefined;
    this.gl = gl;


    if (data !== undefined) {
      this.setData(data, data.length);
    }
    
    this.id = __GLIBO_id++;
  }

  GLIBO.prototype.setData = function(arr) {
    var gl = this.gl;

    if (arr instanceof Uint16Array) {
      this.type = gl.UNSIGNED_SHORT;
    } else if (arr instanceof Uint32Array) {
      this.type = gl.UNSIGNED_INT;
    } else {
      Util.assert(false, "only unsigned short or int arrays are supported for indices");
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glName);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    
    this.num = arr.length;
  };
  
  GLIBO.prototype.bind = function() {
    var gl = this.gl;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glName);
  };

  GLIBO.prototype.getNum = function() {
    return this.num;
  };
  
  GLIBO.prototype.getId = function() {
    return this.id;
  };

  GLIBO.prototype.getType = function() {
    return this.type;
  };
  
  GLIBO.prototype.dispose = function() {
    var gl = this.gl;
    gl.deleteBuffer(this.glName);
  };

  return GLIBO;
});