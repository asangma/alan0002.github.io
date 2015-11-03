define(["./Util", "./webglConstants"], function(Util, webglConstants) {
  var assert = Util.assert;
  var VertexAttrConstants = Util.VertexAttrConstants;

  var getAttrTypeByteLength = function(type) {
    switch (type) {
      case webglConstants.FLOAT:
        return 4;
      case webglConstants.BYTE:
      case webglConstants.UNSIGNED_BYTE:
        return 1;
      default:
        return 2;
    }
  };

  // This class is used for two similar things:
  // 1. describe the actual layout of vertex attributes within a VBO
  // 2. describe what vertex attributes are required by a program
  // In the latter case, the "stride" and "attr2offset" variables are meaningless (but still present)

  var VertexBufferLayout = function(attrNames, attrSizes, attrTypes) {
    var stride = 0,
      attributes = {};
    init();

    function init() {
      var i, numAttrs = attrNames.length;
      assert(attrSizes.length === numAttrs);
      if (attrTypes) {
        assert(attrTypes.length === numAttrs);
      }
      else {
        attrTypes = new Array(attrNames.length);
        for (i = 0; i < attrTypes.length; i++) {
          attrTypes[i] = webglConstants.FLOAT;
        }
      }

      for (i = 0; i < numAttrs; i++) {
        var attr = {
          offset: stride,
          size: attrSizes[i],
          type: attrTypes[i]

        };
        assert((attr.size*getAttrTypeByteLength(attrTypes[i])) % 4 === 0, "attribute byte length must be a multiple of 4");
        stride += attrSizes[i] * getAttrTypeByteLength(attrTypes[i]) / 4;
        attributes[attrNames[i]] = attr;
      }
    }

    this.getStride = function() {
      return stride;
    };

    this.getAttributes = function() {
      return attributes;
    };

    this.hasAttribute = function(name) {
      return name in attributes;
    };

    this.enableVertexAttribArrays = function(gl, program, angleInstancedArrays) {
      for (var i = 0; i < attrNames.length; ++i) {
        var attrName = attrNames[i];
        var attr = attributes[attrName];
        var location = program.getAttribLocation(attrName);
        if (location > -1) {
          if (attr.size === 16) {
            for (var j = 0; j < 4; j++) {
              gl.enableVertexAttribArray(location+j);
              if (angleInstancedArrays) {
                angleInstancedArrays.vertexAttribDivisorANGLE(location+j, 1);
              }
            }
          }
          else {
            gl.enableVertexAttribArray(location);
            if (angleInstancedArrays) {
              angleInstancedArrays.vertexAttribDivisorANGLE(location, 1);
            }
          }
        }
      }
    };

    this.disableVertexAttribArrays = function(gl, program, angleInstancedArrays) {
      for (var i = 0; i < attrNames.length; ++i) {
        var attrName = attrNames[i];
        var attr = attributes[attrName];
        var location = program.getAttribLocation(attrName);
        if (location > -1) {
          if (attr.size === 16) {
            for (var j = 0; j < 4; j++) {
              gl.disableVertexAttribArray(location+j);
              if (angleInstancedArrays) {
                angleInstancedArrays.vertexAttribDivisorANGLE(location+j, 0);
              }
            }
          }
          else {
            gl.disableVertexAttribArray(location);
            if (angleInstancedArrays) {
              angleInstancedArrays.vertexAttribDivisorANGLE(location, 0);
            }
          }
        }
      }
    };

    this.setVertexAttribPointers = function(gl, program) {
      for (var i = 0; i < attrNames.length; ++i) {
        var attrName = attrNames[i];
        var attr = attributes[attrName];
        var size = attr.size;
        var offset = attr.offset*4;
        var type = attr.type;
        var location = program.getAttribLocation(attrName);
        if (location > -1) {
          if (size === 16) {
            for (var j = 0; j < 4; j++) {
              gl.vertexAttribPointer(location+j, 4, type, false, stride*4, offset + j*16);
            }
          }
          else {
            gl.vertexAttribPointer(location, size, type, false, stride*4, offset);
          }
        }
      }
    };
  };

  var position = VertexAttrConstants.POSITION;
  var normal = VertexAttrConstants.NORMAL;
  var uv0 = VertexAttrConstants.UV0;
  var color = VertexAttrConstants.COLOR;
  var region = VertexAttrConstants.REGION;
  VertexBufferLayout.Defaults = {
    "Pos": new VertexBufferLayout([position], [3]),
    "Pos2": new VertexBufferLayout([position], [2]),
    "PosNorm": new VertexBufferLayout([position, normal], [3, 3]),
    "PosTex": new VertexBufferLayout([position, uv0], [3, 2]),
    "PosColor": new VertexBufferLayout([position, color], [3, 4],
      [webglConstants.FLOAT, webglConstants.UNSIGNED_BYTE]),
    "Pos2Tex": new VertexBufferLayout([position, uv0], [2, 2]),
    "PosNormTex": new VertexBufferLayout([position, normal, uv0], [3, 3, 2]),
    "PosNormCol": new VertexBufferLayout([position, normal, color], [3, 3, 4],
      [webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.UNSIGNED_BYTE]),
    "PosNormTexCol": new VertexBufferLayout([position, normal, uv0, color], [3, 3, 2, 4],
      [webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.UNSIGNED_BYTE]),
    "PosNormTexRegion": new VertexBufferLayout([position, normal, uv0, region], [3, 3, 2, 4],
      [webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.UNSIGNED_SHORT]),
    "PosNormTexRegionCol": new VertexBufferLayout([position, normal, uv0, region,color], [3, 3, 2, 4, 4],
      [webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.UNSIGNED_SHORT, webglConstants.UNSIGNED_BYTE]),

    // used for instancing
    "Model": new VertexBufferLayout(["model", "modelNormal"], [16, 16]),
    "ModelCol": new VertexBufferLayout(["model", "modelNormal", "instanceColor"], [16, 16, 4])
  };

  return VertexBufferLayout;
});
