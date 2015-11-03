define([
  "./internal/MaterialUtil",
  "../lib/Util"
],
  function(MaterialUtil, Util) {

    var VertexAttrConstants = Util.VertexAttrConstants;

    var MeshWireframeMaterial = function(color, idHint) {
      MaterialUtil.basicMaterialConstructor(this, idHint);

      var vertexBufferLayout = MaterialUtil.Layouts.Pos;
      var stride = vertexBufferLayout.getStride();

      this.dispose = function() {

      };

      this.setParameterValues = function() {

      };

      this.getColor = function() {
        return color;
      };

      this.getOutputAmount = function(inputAmount) {
        return inputAmount*stride*2;
      };

      this.getVertexBufferLayout = function() {
        return vertexBufferLayout;
      };

      this.fillInterleaved = function(geomData, transformation, invTranspTransformation, instanceParams, dst, offset) {

        var indices = geomData.faces.indices[VertexAttrConstants.POSITION];
        var va = geomData.vertexAttr[VertexAttrConstants.POSITION];

        var numIndices = indices.length;

        var size = va.size;
        var data = va.data;

        var transf =  transformation;

        if (transf !== undefined && size >= 3) {
          for (var j = 0; j < numIndices; ++j) {
            var idx0 = size * indices[j];
            var x = data[idx0];
            var y = data[idx0 + 1];
            var z = data[idx0 + 2];

            dst[offset] = transf[0] * x + transf[4] * y + transf[8] * z + transf[12];
            dst[offset + 1] = transf[1] * x + transf[5] * y + transf[9] * z + transf[13];
            dst[offset + 2] = transf[2] * x + transf[6] * y + transf[10] * z + transf[14];
            offset += stride;

            var idxNext = size * indices[j+(j%3==2?-2:1)];
            x = data[idxNext];
            y = data[idxNext + 1];
            z = data[idxNext + 2];

            dst[offset] = transf[0] * x + transf[4] * y + transf[8] * z + transf[12];
            dst[offset + 1] = transf[1] * x + transf[5] * y + transf[9] * z + transf[13];
            dst[offset + 2] = transf[2] * x + transf[6] * y + transf[10] * z + transf[14];
            offset += stride;
          }
        } else {
          for (j = 0; j < numIndices; ++j) {
            idx0 = size * indices[j];

            for (var k = 0; k < size; ++k) {
              dst[offset + k] = data[idx0 + k];
            }
            offset += stride;

            idxNext = size * indices[j+(j%3==2?-2:1)];
            for (k = 0; k < size; ++k) {
              dst[offset + k] = data[idxNext + k];
            }
            offset += stride;
          }
        }

      };

      this.intersect = MaterialUtil.intersectTriangleGeometry;

      this.getGLMaterials = function() {
        return [MeshWireframeGLMaterial, undefined, undefined ];
      };

      this.getAllTextureIds = function() {
        return [ ];
      };
    };


    var MeshWireframeGLMaterial = function(material, programRep) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var program = programRep.get("simple");
      var color = material.getColor();

      this.beginSlot = function(slot) {
        return slot === 1;
      };

      this.getProgram = function() {
        return program;
      };

      this.bind = function(gl, bindParams) {
        program.use();

        program.uniform4fv("color", color);

        material.getVertexBufferLayout().enableVertexAttribArrays(gl, program);

      };

      this.release = function(gl) {
        material.getVertexBufferLayout().disableVertexAttribArrays(gl, program);
      };

      this.bindView = function(gl, bindParams) {
        MaterialUtil.bindView(bindParams.origin, bindParams.view, program);
      };

      this.bindInstance = function(gl, instance) {
        program.uniformMatrix4fv("model", instance.transformation);
      };

      this.getDrawMode = function(gl) {
        return gl.LINES;
      };
    };

    return MeshWireframeMaterial;
  });
