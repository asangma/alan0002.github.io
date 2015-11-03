define([
  "dojo/_base/lang",
  "dojo/text!./RibbonLineMaterial.xml",
  "./internal/MaterialUtil",
  "../lib/VertexBufferLayout",
  "../lib/GLSLProgram",
  "../lib/GLSLShader",
  "../lib/Util",
  "../lib/gl-matrix",
  "../lib/webglConstants"
],
  function(lang, shadersXMLString, MaterialUtil, VertexBufferLayout, GLSLProgram, GLSLShader, Util, glMatrix, webglConstants) {

    var TWOFIFTYFIVE = [255, 255, 255, 255];
    var ZEROZEROZEROZERO = [0, 0, 0, 0];

    var vec3d = glMatrix.vec3d;
    var vec2d = glMatrix.vec2d;
    var mat4d = glMatrix.mat4d;

    var a = vec3d.create(),
      b = vec3d.create(),
      r = vec3d.create(),
      n = vec3d.create(),
      as = vec2d.create(),
      bs = vec2d.create(),
      minDistPointA = vec3d.create(),
      minDistPointB = vec3d.create();


    var RibbonLineMaterial = function(params, idHint) {
      MaterialUtil.basicMaterialConstructor(this, idHint);
      var VAC = Util.VertexAttrConstants;

      params = params || {};
      params.color = params.color || [1, 1, 1, 1];
      params.width = params.width || 0;
      params.type = params.type || "screen";
      params.join = params.join || "miter";
      params.miterLimit = (params.join === "miter") ? (params.miterLimit || 5) : params.miterLimit;

      var numVertsAtJoin = (params.type === "wall") ? 2 : 4;
      var numVertsAtCap = 2;      

      //w-component of VAC.POSITION4 used for size --> [4, 2, 3, 3, 4]
      var vertexBufferLayout = (params.type === "wall") ?
        new VertexBufferLayout([VAC.POSITION, VAC.UV0], [3, 2]) :
        new VertexBufferLayout([VAC.POSITION, VAC.UV0, VAC.AUXPOS1, VAC.AUXPOS2, VAC.COLOR, VAC.SIZE], [3, 2, 3, 3, 4, 1], 
          [webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.FLOAT, webglConstants.FLOAT]);

      this.canBeMerged = false;

      this.getParams = function() {
        return params;
      };

      this.getParameterValues = function() {
        var result = {
          color: params.color,
          width: params.width,
          type: params.type,
          join: params.join,
          polygonOffset: params.polygonOffset
        };
        if (params.join === "miter") {
          result.miterLimit = params.miterLimit;
        }
        return result;
      };

      this.setParameterValues = function(newParams) {
        for (var key in newParams) {
          if(newParams.hasOwnProperty(key)) {
            Util.assert(key !== "type", "RibbonLineMaterial: type cannot be changed after creation");
            params[key] = newParams[key];
          }
        }
        this.notifyDirty("matChanged");
      };

      this.dispose = function() {
      };

      this.getOutputAmount = function(inputAmount) {
        // inputAmount is number of face indices, need to convert to number of vertices for triangle strip
        var numPoints = (inputAmount/2 + 1);
        var numVerts = (numPoints - 2)*numVertsAtJoin + 2*numVertsAtCap;
        return numVerts*vertexBufferLayout.getStride();

      };

      this.getVertexBufferLayout = function() {
        return vertexBufferLayout;
      };

      this.fillInterleaved = function(geomData, transformation, invTranspTransformation, instanceParams, dst, offset) {
        var verts = geomData.vertexAttr[VAC.POSITION].data;
        var colors = geomData.vertexAttr[VAC.COLOR] ? geomData.vertexAttr[VAC.COLOR].data : TWOFIFTYFIVE;
        var sizes = geomData.vertexAttr[VAC.SIZE] ? geomData.vertexAttr[VAC.SIZE].data : ZEROZEROZEROZERO;

        var indices = geomData.faces && geomData.faces.indices && geomData.faces.indices.position;
        if (indices && (indices.length != 2*(verts.length/3-1))) {
          console.warn("RibbonLineMaterial does not support indices");
        }

        if (params.type === "wall") {
          fillWithoutAuxpos(verts, transformation, dst, offset);
        }
        else {
          fillWithAuxpos(verts, colors, sizes, transformation, dst, offset);
        }
      };

      this.intersect = function(geometry, group, transformation, point, p0, p1, pp0, pp1, camera, tolerance, callback, isSelection) {
        if(!isSelection) {
          return;
        }

        var positions = geometry.getData().getVertexAttr(VAC.position).position.data;
        var sizes = geometry.getData().getVertexAttr(VAC.SIZE).size;
        var size = sizes && sizes.data[0];
        
        var lineWidth = size + params.width;

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


        //Fixed tolerance area of lines set to 2.
        var tol = 4;
        if(minDist < ((lineWidth/2)+tol) ) {
          var result = Util.linelineDistance3D(minDistPointA, minDistPointB, p0, p1);
          var wsDist = Number.MAX_VALUE;

          if(result[0]) {
            var pa = result[2];
            vec3d.subtract(pa, p0, n);
            var distance = vec3d.length(n);

            wsDist = 0.98 * distance / vec3d.dist(p0, p1);
          }
          callback(wsDist, n);
        }
      };

      this.getGLMaterials = function() {
        return [ RibbonLineGLMaterial, undefined, undefined ];
      };

      this.getAllTextureIds = function() {
        return [ ];
      };
    };

    var RibbonLineGLMaterial = function(material, programRep) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var params = lang.clone(material.getParams());
      params.miterLimit = (params.join === "miter") ? params.miterLimit : 0.0;
      delete params.join;

      var program = programRep.get("ribbonLine_" + params.type);

      this.updateParameters = function() {
        var newParams = material.getParams();
        params.polygonOffset = newParams.polygonOffset;
        params.color = newParams.color;
        params.width = newParams.width;
        params.miterLimit = (newParams.join === "miter") ? newParams.miterLimit : 0.0;
      };

      this.beginSlot = function(slot) {
        return slot === 2;
      };

      this.getProgram = function() {
        return program;
      };

      this.bind = function(gl, bindParams) {
        program.use();

        program.uniform4fv("eColor", params.color);
        program.uniform1f("miterLimit", params.miterLimit);        
        program.uniform1f("nearPlane", bindParams.nearFar[0]);

        if (params.type === "screen") {
          program.uniform2fv("screenSize", [bindParams.viewport[2], bindParams.viewport[3]]);
          program.uniform1f("extLineWidth", params.width*bindParams.pixelRatio);          
        } else {
          program.uniform1f("extLineWidth", params.width);
        }


        material.getVertexBufferLayout().enableVertexAttribArrays(gl, program);

        if (params.polygonOffset) {
          gl.enable(gl.POLYGON_OFFSET_FILL);
          gl.polygonOffset(0.0, -4.0);
        }

        gl.enable(gl.BLEND);

        if (gl.web3DDefaultState.cullEnabled) {
          gl.disable(gl.CULL_FACE);
        }
        if (params.color[3] < 1.0) {
          gl.depthMask(false);
        }
      };

      this.release = function(gl) {
        material.getVertexBufferLayout().disableVertexAttribArrays(gl, program);
        if (params.polygonOffset) {
          gl.disable(gl.POLYGON_OFFSET_FILL);
        }
        gl.disable(gl.BLEND);
        if (gl.web3DDefaultState.cullEnabled) {
          gl.enable(gl.CULL_FACE);
        }
        gl.depthMask(true);
      };

      this.bindView = function(gl, bindParams) {
        MaterialUtil.bindView(bindParams.origin, bindParams.view, program);
      };

      this.bindInstance = function(gl, instance) {
        program.uniformMatrix4fv("model", instance.transformation);
      };

      this.getDrawMode = function(gl) {
        return gl.TRIANGLE_STRIP;
      };
    };

    RibbonLineMaterial.loadShaders = function(snippets, shaderRep, programRep, gl) {
      snippets._parse(shadersXMLString);

      var vsRibbonLineScreen = new GLSLShader(gl.VERTEX_SHADER, snippets.vsRibbonLine, gl, ["SCREENSCALE"]);
      var vsRibbonLineStrip = new GLSLShader(gl.VERTEX_SHADER, snippets.vsRibbonLine, gl);
      var vsRibbonLineWall = new GLSLShader(gl.VERTEX_SHADER, snippets.vsRibbonLine, gl, ["WALL"]);
      var fsRibbonLine = new GLSLShader(gl.FRAGMENT_SHADER, snippets.fsRibbonLine, gl);
      var programRibbonLineScreen = new GLSLProgram([vsRibbonLineScreen, fsRibbonLine], gl);
      var programRibbonLineStrip = new GLSLProgram([vsRibbonLineStrip, fsRibbonLine], gl);
      var programRibbonLineWall = new GLSLProgram([vsRibbonLineWall, fsRibbonLine], gl);

      programRep.add("ribbonLine_screen", programRibbonLineScreen);
      programRep.add("ribbonLine_strip", programRibbonLineStrip);
      programRep.add("ribbonLine_wall", programRibbonLineWall);
    };

    function fillWithAuxpos(verts, colors, size, transformation, dst, offset) {
      var numVerts = verts.length/3;
      var leftx = verts[0], lefty = verts[1], leftz = verts[2];
      var totalLen = 0.0;
      if (transformation) {
        leftx = transformation[0] * leftx + transformation[4] * lefty + transformation[8] * leftz + transformation[12];
        lefty = transformation[1] * leftx + transformation[5] * lefty + transformation[9] * leftz + transformation[13];
        leftz = transformation[2] * leftx + transformation[6] * lefty + transformation[10] * leftz + transformation[14];
      }
      var x = leftx, y = lefty, z = leftz;
      var rightx = verts[3], righty = verts[4], rightz = verts[5];
      if (transformation) {
        rightx = transformation[0] * rightx + transformation[4] * righty + transformation[8] * rightz + transformation[12];
        righty = transformation[1] * rightx + transformation[5] * righty + transformation[9] * rightz + transformation[13];
        rightz = transformation[2] * rightx + transformation[6] * righty + transformation[10] * rightz + transformation[14];
      }

      for (var i = 0; i < numVerts; i++) {
        var idx0 = i*3;
        if (i < numVerts - 1) {
          rightx = verts[idx0 + 3]; righty = verts[idx0 + 4]; rightz = verts[idx0 + 5];
          if (transformation) {
            rightx = transformation[0] * rightx + transformation[4] * righty + transformation[8] * rightz + transformation[12];
            righty = transformation[1] * rightx + transformation[5] * righty + transformation[9] * rightz + transformation[13];
            rightz = transformation[2] * rightx + transformation[6] * righty + transformation[10] * rightz + transformation[14];
          }
        }

        totalLen += Math.sqrt((x-leftx)*(x-leftx) + (y-lefty)*(y-lefty) + (z-leftz)*(z-leftz));

        dst[offset++] = x;
        dst[offset++] = y;
        dst[offset++] = z;
        dst[offset++] = totalLen;
        dst[offset++] = (i===0) ? -1.2 : -1.0;
        dst[offset++] = leftx;
        dst[offset++] = lefty;
        dst[offset++] = leftz;
        dst[offset++] = rightx;
        dst[offset++] = righty;
        dst[offset++] = rightz;
        dst[offset++] = colors[0];
        dst[offset++] = colors[1];
        dst[offset++] = colors[2];
        dst[offset++] = colors[3];
        dst[offset++] = size[0];


        dst[offset++] = x;
        dst[offset++] = y;
        dst[offset++] = z;
        dst[offset++] = totalLen;
        dst[offset++] = (i===0) ? 1.2 : 1.0;
        dst[offset++] = leftx;
        dst[offset++] = lefty;
        dst[offset++] = leftz;
        dst[offset++] = rightx;
        dst[offset++] = righty;
        dst[offset++] = rightz;
        dst[offset++] = colors[0];
        dst[offset++] = colors[1];
        dst[offset++] = colors[2];
        dst[offset++] = colors[3];
        dst[offset++] = size[0];


        if ((i > 0) && (i < numVerts - 1)) {
          dst[offset++] = x;
          dst[offset++] = y;
          dst[offset++] = z;
          dst[offset++] = totalLen;
          dst[offset++] = -1.2;
          dst[offset++] = leftx;
          dst[offset++] = lefty;
          dst[offset++] = leftz;
          dst[offset++] = rightx;
          dst[offset++] = righty;
          dst[offset++] = rightz;
          dst[offset++] = colors[0];
          dst[offset++] = colors[1];
          dst[offset++] = colors[2];
          dst[offset++] = colors[3];
          dst[offset++] = size[0];

          dst[offset++] = x;
          dst[offset++] = y;
          dst[offset++] = z;
          dst[offset++] = totalLen;
          dst[offset++] = 1.2;
          dst[offset++] = leftx;
          dst[offset++] = lefty;
          dst[offset++] = leftz;
          dst[offset++] = rightx;
          dst[offset++] = righty;
          dst[offset++] = rightz;
          dst[offset++] = colors[0];
          dst[offset++] = colors[1];
          dst[offset++] = colors[2];
          dst[offset++] = colors[3];  
          dst[offset++] = size[0];   
        }

        leftx = x;
        lefty = y;
        leftz = z;
        x = rightx;
        y = righty;
        z = rightz;
      }
    }

    function fillWithoutAuxpos(verts, transformation, dst, offset) {
      var numVerts = verts.length/3;
      var totalLen = 0.0;
      var x = verts[0], y = verts[1], z = verts[2];
      var lastx, lasty, lastz;
      for (var i = 0; i < numVerts; i++) {
        var idx0 = i*3;
        lastx = x; lasty = y; lastz = z;
        x = verts[idx0]; y = verts[idx0+1]; z = verts[idx0+2];
        if (transformation) {
          x = transformation[0] * x + transformation[4] * y + transformation[8] * z + transformation[12];
          y = transformation[1] * x + transformation[5] * y + transformation[9] * z + transformation[13];
          z = transformation[2] * x + transformation[6] * y + transformation[10] * z + transformation[14];
        }

        totalLen += Math.sqrt((x-lastx)*(x-lastx) + (y-lasty)*(y-lasty) + (z-lastz)*(z-lastz));

        dst[offset++] = x;
        dst[offset++] = y;
        dst[offset++] = z;
        dst[offset++] = totalLen;
        dst[offset++] = -1;

        dst[offset++] = x;
        dst[offset++] = y;
        dst[offset++] = z;
        dst[offset++] = totalLen;
        dst[offset++] = 1;
      }
    }    

    return RibbonLineMaterial;
  });
