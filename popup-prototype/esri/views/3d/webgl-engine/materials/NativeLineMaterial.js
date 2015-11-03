define([
  "./internal/MaterialUtil",
  "../lib/Util",
  "../lib/gl-matrix"
],
  function(MaterialUtil, Util, glMatrix) {

    var vec3d = glMatrix.vec3d;
    var vec2d = glMatrix.vec2d;
    var mat4d = glMatrix.mat4d;
    var VertexAttrConstants = Util.VertexAttrConstants;

    var a = vec3d.create(),
      b = vec3d.create(),
      r = vec3d.create(),
      n = vec3d.create(),
      as = vec2d.create(),
      bs = vec2d.create(),
      minDistPointA = vec3d.create(),
      minDistPointB = vec3d.create();

    var NativeLineMaterial = function(width, color, lineType, idHint) {
      if (typeof lineType === "string") {
        idHint = lineType;
        lineType = undefined;
      }

      MaterialUtil.basicMaterialConstructor(this, idHint);

      this.lineType = lineType || NativeLineMaterial.LINES;
      
      var vertexBufferLayout = MaterialUtil.Layouts.Pos;
      var stride = vertexBufferLayout.getStride();

      this.canBeMerged = this.lineType === NativeLineMaterial.LINES;

      this.setColor = function(newColor) {
        color = newColor;
        this.notifyDirty("matChanged");
      };

      this.getColor = function() {
        return color;
      };

      this.dispose = function() {
      };

      this.getOutputAmount = function(inputAmount) {
        // inputAmount is number of face indices, need to convert to number of vertices for line strip
        var n = (inputAmount / 2 + 1);

        if (this.lineType === NativeLineMaterial.STRIP) {
          return n * stride;
        } else if (this.lineType === NativeLineMaterial.LINES) {
          return (n * 2 - 2) * stride;
        }
      };

      this.getVertexBufferLayout = function() {
        return vertexBufferLayout;
      };

      this.fillInterleaved = function(geomData, transformation, invTranspTransformation, instanceParams, dst, offset) {
        var vertices = geomData.vertexAttr[VertexAttrConstants.POSITION].data;
        var i;

        if (transformation || this.lineType === NativeLineMaterial.LINES) {
          var numVerts = vertices.length/3;

          for (i = 0; i < numVerts; i++) {
            var idx0 = i * 3;
            var x = vertices[idx0];
            var y = vertices[idx0 + 1];
            var z = vertices[idx0 + 2];

            if (transformation) {
              var xOri = x, yOri = y, zOri = z;
              x = transformation[0] * xOri + transformation[4] * yOri + transformation[8] * zOri + transformation[12];
              y = transformation[1] * xOri + transformation[5] * yOri + transformation[9] * zOri + transformation[13];
              z = transformation[2] * xOri + transformation[6] * yOri + transformation[10] * zOri + transformation[14];
            }

            dst[offset++] = x;
            dst[offset++] = y;
            dst[offset++] = z;

            if (this.lineType === NativeLineMaterial.LINES) {
              if (i !== 0 && i !== numVerts - 1) {
                dst[offset++] = x;
                dst[offset++] = y;
                dst[offset++] = z;
              }
            }
          }
        } else {
          for (i = 0; i < vertices.length; i++) {
            dst[offset++] = vertices[i];
          }
        }
      };

      this.intersect = function(geometry, group, transformation, point, p0, p1, pp0, pp1, camera, tolerance, callback, isSelection) {
        if(!isSelection) {
          return;
        }

        var positions = geometry.getData().getVertexAttr("position").position.data;

        var minDist = Number.MAX_VALUE;
        var minDistIdx, frustum, dist, scale;

        for(var i=0; i<positions.length-5; i += 3) {
          a[0] = positions[i]; 
          a[1] = positions[i+1];
          a[2] = positions[i+2];
          mat4d.multiplyVec3(transformation, a);

          b[0] = positions[i+3]; 
          b[1] = positions[i+4];
          b[2] = positions[i+5];
          mat4d.multiplyVec3(transformation, b);

          camera.projectPoint(a, as);
          camera.projectPoint(b, bs);

          // Points crossing the near clipping plane need reprojection
          if(as[2] < 0 && bs[2] > 0) {
            vec3d.subtract(a, b, r);
            frustum = camera.frustumPlanes;
            dist = -(vec3d.dot(frustum[4], a) + frustum[4][3]);
            scale = dist / vec3d.dot(r, frustum[4]);
            vec3d.scale(r, scale, r);
            vec3d.add(a, r, a);
            camera.projectPoint(a, as);
          }
          else if(as[2] > 0 && bs[2] < 0) {
            vec3d.subtract(b, a, r);
            frustum = camera.frustumPlanes;
            dist = -(vec3d.dot(frustum[4], b) + frustum[4][3]);
            scale = dist / vec3d.dot(r, frustum[4]);
            vec3d.scale(r, scale, r);
            vec3d.add(b, r, b);
            camera.projectPoint(b, bs);
          }
          // Drop line segments in front of near clipping plane
          else if((as[2] < 0 && bs[2] < 0)) {
            continue;
          }

          var ssDist = Util.projectVectorVector2D(as, bs, point);

          if(ssDist < minDist) {
            minDist = ssDist;
            minDistIdx = i;
            vec3d.set(a, minDistPointA);
            vec3d.set(b, minDistPointB);
          }
        }


        //Fixed tolerance area of lines set to 2. Native lines are only used when line width < 2
        if(minDist < 2) {

          var result = Util.linelineDistance3D(minDistPointA, minDistPointB, p0, p1);
          var wsDist = Number.MAX_VALUE;

          if(result[0]) {
            var pa = result[2];
            vec3d.subtract(pa, p0, n);
            var distance = vec3d.length(n);
            vec3d.scale(n, 1.0 / distance);

            wsDist = 0.98 * distance / vec3d.dist(p0, p1);            
          }

          callback(wsDist, n);
        }          
      };

      this.getGLMaterials = function() {
        return [ NativeLineGLMaterial, undefined, undefined ];
      };

      this.getAllTextureIds = function() {
        return [ ];
      };
    };

    NativeLineMaterial.STRIP = 1;
    NativeLineMaterial.LINES = 2;

    var NativeLineGLMaterial = function(material, programRep) {
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

        if (color[3] < 1) {
          gl.enable(gl.BLEND);
        }

      };

      this.release = function(gl) {
        material.getVertexBufferLayout().disableVertexAttribArrays(gl, program);

        if (color[3] < 1) {
          gl.disable(gl.BLEND);
        }
      };

      this.bindView = function(gl, bindParams) {
        MaterialUtil.bindView(bindParams.origin, bindParams.view, program);
      };

      this.bindInstance = function(gl, instance) {
        program.uniformMatrix4fv("model", instance.transformation);
      };

      this.getDrawMode = function(gl) {
        if (material.lineType === NativeLineMaterial.STRIP) {
          return gl.LINE_STRIP;
        } else {
          return gl.LINES;
        }
      };
    };

    return NativeLineMaterial;
  });
