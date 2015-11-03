define([
  "dojo/text!./LeafCardMaterial.xml",
  "./internal/MaterialUtil",
  "../lib/VertexBufferLayout",
  "../lib/GLSLProgram",
  "../lib/GLSLShader",
  "../lib/Util",
  "../lib/gl-matrix"
],
  function(shadersXMLString, MaterialUtil, VertexBufferLayout, GLSLProgram, GLSLShader, Util, glMatrix) {

  var vec3 = glMatrix.vec3;
  var mat4 = glMatrix.mat4;
  var mat4d = glMatrix.mat4d;

  var VertexAttrConstants = Util.VertexAttrConstants;

//a bit hacky test for vue trees. neets to be cleaned up when final trees arrive.
    var LeafCardMaterial = function(textureId, ambient, diffuse, specular, shininess, idHint) {
      MaterialUtil.basicMaterialConstructor(this, idHint);

      var vertexBufferLayout = new VertexBufferLayout(
        [VertexAttrConstants.POSITION, VertexAttrConstants.NORMAL, VertexAttrConstants.UV0],
        [ 3, 4, 4 ]);
      var stride = vertexBufferLayout.getStride();


      var reduction1 = 1;
      var reduction2 = 1;

      var randOrientation = true;

      var enableRandomNormal = true;
      var normalRand = 0.8;

      var ambientPertSize = 0.2;

      var randPos = true;
      var randPosAmount = 0.10;

      this.getAmbient = function() {
        return ambient;
      };

      this.getDiffuse = function() {
        return diffuse;
      };

      this.getSpecular = function() {
        return specular;
      };

      this.getShininess = function() {
        return shininess;
      };

      this.dispose = function() {

      };

      this.getTextureId = function() {
        return textureId;
      };

      this.getOutputAmount = function(inputAmount) {
        var count = 0;
        var i;
        
        for (i=0; i<inputAmount/6; i++) {
          if (i%reduction1===0) {
            count+=6;
          }
        }

        inputAmount = count;
        count = 0;
        
        for (i=0; i<inputAmount/6; i++) {
          if (i%reduction2===0) {
            count+=6;
          }
        }
        return count*stride;
      };

      this.getVertexBufferLayout = function() {
        return vertexBufferLayout;
      };

      function random11() {
        return Math.random()*2-1;
      }

      this.reduce = function(indices, factor)
      {
        var indPos = indices.position;
        var indNormal = indices.normal;
        var indUV = indices.uv0;

        var indPosNew = [];
        var indNormalNew = [];
        var induv0New = [];

        var count = 0;
        for (var i=0; i<indPos.length/6; i++)
        {
          if (i%factor===0)
          {
            for (var j=0; j<6; j++)
            {
              indPosNew[count] = indPos[i*6+j];
              indNormalNew[count] = indNormal[i*6+j];
              induv0New[count] = indUV[i*6+j];
              count++;
            }
          }
        }

        return {
          "position": indPosNew,
          "normal": indNormalNew,
          "uv0": induv0New
        };

      };

      this.fillInterleaved = function(geomData, transformation, invTranspTransformation, instanceParams, dst, offset) {
        var fill = MaterialUtil.fill;

        var dataReduced = this.reduce(geomData.faces.indices,reduction1);
        dataReduced = this.reduce(dataReduced,reduction2);

        var oa = this.getOutputAmount(geomData.faces.indices.position.length);

        Util.assert(oa===dataReduced.position.length*stride);

        var indPos = dataReduced.position;
        var indNormal = dataReduced.normal;
        var indUV = dataReduced.uv0;

        var pos = geomData.vertexAttr.position.data;
        var normal = geomData.vertexAttr.normal.data;
        var uv = geomData.vertexAttr.uv0.data;

        var sizeAvg = 0;

        var avgPosPointcloud = vec3.create();

        var numElements = indPos.length/6;

        var offsetStart = offset;

        var max = vec3.createFrom(-Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE);
        var min = vec3.createFrom(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE);

        for (var j = 0; j < numElements; ++j) {

          var avgPos = vec3.create();
          var avgNormal = vec3.create();

          var tc4 = [100,100,-100,-100];
          var pos1 = vec3.create();

          for (var k = 0; k < 6; ++k) {
            var idx = j*6+k;

            var iPos = indPos[idx]*3;
            var iNormal = indNormal[idx]*3;
            var iUV = indUV[idx]*2;

            avgPos[0] += pos[iPos+0];
            avgPos[1] += pos[iPos+1];
            avgPos[2] += pos[iPos+2];

            avgNormal[0] += normal[iNormal+0];
            avgNormal[1] += normal[iNormal+1];
            avgNormal[2] += normal[iNormal+2];

            var u = uv[iUV+0];
            var v = uv[iUV+1];

            tc4[0] = Math.min(tc4[0], u);
            tc4[1] = Math.min(tc4[1], v);

            tc4[2] = Math.max(tc4[2], u);
            tc4[3] = Math.max(tc4[3], v);

            if (k===0) {
              vec3.set3(pos[iPos+0],pos[iPos+1],pos[iPos+2], pos1);
            }

          }

          avgPos[0] /= 6;
          avgPos[1] /= 6;
          avgPos[2] /= 6;


          avgNormal[0] /= 6;
          avgNormal[1] /= 6;
          avgNormal[2] /= 6;

          if (randPos)
          {
            avgPos[0] +=  random11()*randPosAmount;
            avgPos[1] +=  random11()*randPosAmount;
            avgPos[2] +=  random11()*randPosAmount;
          }

          if (transformation!==undefined)
          {
            mat4d.multiplyVec3(transformation, pos1, pos1);
            mat4d.multiplyVec3(transformation, avgPos, avgPos);
            mat4d.multiplyVec3(invTranspTransformation, avgNormal, avgNormal);
          }

          vec3.add(avgPos,avgPosPointcloud, avgPosPointcloud);

          vec3.max(max, avgPos, max);
          vec3.min(min, avgPos, min);



          var shrink = 0.01;
          tc4[0] += shrink;
          tc4[1] += shrink;
          tc4[2] -= shrink;
          tc4[3] -= shrink;

          for (var i=0; i<4; i++)
          {
            tc4[i] = Math.min(tc4[i],0.99999);
          }

          var rot = randOrientation?Math.random()*2.0*Math.PI:0;
          var sizeLeaf = vec3.dist(pos1, avgPos)*1.41;

          sizeAvg += sizeLeaf;

          offset += fill(avgPos, 0, dst, offset, undefined, 3);
          offset += fill(avgNormal, 0, dst, offset, undefined, 3);
          dst[offset++] = 0.0;
          dst[offset++] = tc4[0]; dst[offset++] = tc4[1]; dst[offset++] = rot; dst[offset++] = sizeLeaf;

          offset += fill(avgPos, 0, dst, offset, undefined, 3);
          offset += fill(avgNormal, 0, dst, offset, undefined, 3);
          dst[offset++] = 0.0;
          dst[offset++] = tc4[2] + 1.0; dst[offset++] = tc4[1]; dst[offset++] = rot; dst[offset++] = sizeLeaf;

          offset += fill(avgPos, 0, dst, offset, undefined, 3);
          offset += fill(avgNormal, 0, dst, offset, undefined, 3);
          dst[offset++] = 0.0;
          dst[offset++] = tc4[2] + 1.0; dst[offset++] = tc4[3] + 1.0; dst[offset++] = rot; dst[offset++] = sizeLeaf;

          offset += fill(avgPos, 0, dst, offset, undefined, 3);
          offset += fill(avgNormal, 0, dst, offset, undefined, 3);
          dst[offset++] = 0.0;
          dst[offset++] = tc4[2] + 1.0; dst[offset++] = tc4[3] + 1.0; dst[offset++] = rot; dst[offset++] = sizeLeaf;

          offset += fill(avgPos, 0, dst, offset, undefined, 3);
          offset += fill(avgNormal, 0, dst, offset, undefined, 3);
          dst[offset++] = 0.0;
          dst[offset++] = tc4[0]; dst[offset++] = tc4[3] + 1.0; dst[offset++] = rot; dst[offset++] = sizeLeaf;

          offset += fill(avgPos, 0, dst, offset, undefined, 3);
          offset += fill(avgNormal, 0, dst, offset, undefined, 3);
          dst[offset++] = 0.0;
          dst[offset++] = tc4[0]; dst[offset++] = tc4[1]; dst[offset++] = rot; dst[offset++] = sizeLeaf;

        }

        avgPosPointcloud[0] /= numElements;
        avgPosPointcloud[1] /= numElements;
        avgPosPointcloud[2] /= numElements;

        var midBB = vec3.create();
        vec3.add(max,min,midBB);
        vec3.scale(midBB, 0.5, midBB);

        var radiiBB = vec3.create();
        vec3.subtract(max, min, radiiBB);
        radiiBB[0] = Math.abs(radiiBB[0])/2;
        radiiBB[1] = Math.abs(radiiBB[1])/2;
        radiiBB[2] = Math.abs(radiiBB[2])/2;


        var centerOffset = vec3.create(avgPosPointcloud);
        var sizeY = max[1]-min[1];
        centerOffset[1] -= sizeY/3;

        var dir = vec3.create();
        var dir2 = vec3.create();
        pos = vec3.create();

        var dirPert = [vec3.create(),vec3.create(),vec3.create(),vec3.create()];
        var ambientPert = [0,0,0,0];

        var mat = mat4.create();

        for (j = 0; j < numElements; ++j) {

          vec3.set3(dst[offsetStart],dst[offsetStart+1],dst[offsetStart+2],pos);
          vec3.subtract(pos, centerOffset, dir);
          vec3.normalize(dir,dir);

          dir2 = vec3.subtract(pos, midBB, dir2);
          vec3.normalize(dir2,dir2);

          var d1 = Math.abs(vec3.dot(dir2, [1,0,0]));
          var d2 = Math.abs(vec3.dot(dir2, [0,1,0]));
          var d3 = Math.abs(vec3.dot(dir2, [0,0,1]));

          var ambient = d1*Math.abs(midBB[0]-pos[0])/radiiBB[0];
          ambient += d2*Math.abs(midBB[1]-pos[1])/radiiBB[1];
          ambient += d3*Math.abs(midBB[2]-pos[2])/radiiBB[2];



          for (k=0; k<4; k++)
          {
            if (enableRandomNormal)
            {
              mat4.identity(mat);
              mat4.rotate(mat, random11()*normalRand,[0,1,0], mat);
              mat4.rotate(mat, random11()*normalRand,[1,0,0], mat);
              mat4.multiplyVec3(mat, dir,dirPert[k]);
            }
            else {
              dirPert[k] = dir;
            }

            ambientPert[k] =  (0.5+0.5*ambient) - random11()*ambientPertSize;

            //ambientPert[k] = ambientPert[k];

          }

          var sizePert = (0.8+random11()*0.3);

          for (k = 0; k < 6; ++k) {

            var l;

            switch(k)
            {
              case 0: l=0; break;
              case 1: l=1; break;
              case 2: l=2; break;
              case 3: l=2; break;
              case 4: l=3; break;
              case 5: l=0; break;
            }

            offsetStart+=3;
            offsetStart += fill(dirPert[l], 0, dst, offsetStart, invTranspTransformation, 3);
            dst[offsetStart++] = ambientPert[l];
            offsetStart+=3;
            dst[offsetStart++] *= sizePert;
          }

        }


      };

      this.intersect = function() {

      };

      this.getGLMaterials = function() {
        return [ LeafCardGLMaterial, LeafCardGLMaterialDepthShadowMap, undefined, LeafCardGLMaterialDepth];
      };

      this.getAllTextureIds = function() {
        return [ textureId ];
      };

    };


    var LeafCardGLMaterial = function(material, programRep, textureRep) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var slot = 2;
      var program = programRep.get("leafCard");

      MaterialUtil.singleTextureGLMaterialConstructor(this, textureRep, {textureId: material.getTextureId()});

      this.beginSlot = function(slot_) {
        return slot === slot_;
      };

      this.getProgram = function() {
        return program;
      };

      var ambient = material.getAmbient();
      var diffuse = material.getDiffuse();
      var specular = material.getSpecular();
      var shininess = material.getShininess();

      this.bind = function(gl, bindParams) {

        program.use();

        this.bindTexture(gl, program);

        program.uniform3fv("ambient", ambient);
        program.uniform3fv("diffuse", diffuse);
        program.uniform3fv("specular", specular);
        program.uniform1f("shininess", shininess);

        program.uniform1f("trafoScale", 1.0);

        material.getVertexBufferLayout().enableVertexAttribArrays(gl, program);

        //gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
      };

      this.release = function(gl) {
        //gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);

        material.getVertexBufferLayout().disableVertexAttribArrays(gl, program);
      };

      this.bindView = function(gl, bindParams) {
        MaterialUtil.bindView(bindParams.origin, bindParams.view, program);
        MaterialUtil.bindCamPos(bindParams.origin, bindParams.viewInvTransp, program);
      };

      this.bindInstance = function(gl, instance) {
        program.uniformMatrix4fv("model", instance.transformation);
        program.uniformMatrix4fv("modelNormal", instance.transformationNormal);

        var t = instance.transformation;
        var sx = Math.sqrt(t[0] * t[0] + t[4] * t[4] + t[8] * t[8]);
        var sy = Math.sqrt(t[1] * t[1] + t[5] * t[5] + t[9] * t[9]);
        var sz = Math.sqrt(t[2] * t[2] + t[6] * t[6] + t[10] * t[10]);

        program.uniform1f("trafoScale", (sx+sy+sz)/3);
      };

      this.getDrawMode = function(gl) {
        return gl.TRIANGLES;
      };
    };

    var LeafCardGLMaterialDepth = function(material, programRep, textureRep, biased) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var slot = 2;

      var program = biased==null?programRep.get("leafCardDepth"):programRep.get("leafCardDepthShadowMap");

      MaterialUtil.singleTextureGLMaterialConstructor(this, textureRep, {textureId: material.getTextureId()});

      this.beginSlot = function(slot_) {
        return slot === slot_;
      };

      this.getProgram = function() {
        return program;
      };

      this.bind = function(gl, bindParams) {
        program.use();

        this.bindTexture(gl, program);

        program.uniform2fv("nearFar", bindParams.nearFar);

        material.getVertexBufferLayout().enableVertexAttribArrays(gl, program);

        //gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
      };

      this.release = function(gl) {
        //gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);

        material.getVertexBufferLayout().disableVertexAttribArrays(gl, program);
      };

      this.bindView = function(gl, bindParams) {
        MaterialUtil.bindView(bindParams.origin, bindParams.view, program);
      };

      this.bindInstance = function(gl, instance) {
        program.uniformMatrix4fv("model", instance.transformation);


        var t = instance.transformation;
        var sx = Math.sqrt(t[0] * t[0] + t[4] * t[4] + t[8] * t[8]);
        var sy = Math.sqrt(t[1] * t[1] + t[5] * t[5] + t[9] * t[9]);
        var sz = Math.sqrt(t[2] * t[2] + t[6] * t[6] + t[10] * t[10]);

        program.uniform1f("trafoScale", (sx+sy+sz)/3);
      };

      this.getDrawMode = function(gl) {
        return gl.TRIANGLES;
      };
    };

    var LeafCardGLMaterialDepthShadowMap = function(material, programRep, textureRep)
    {
      LeafCardGLMaterialDepth.call(this, material, programRep, textureRep, true );
    };

    LeafCardMaterial.loadShaders = function(snippets, shaderRep, programRep, gl) {
      snippets._parse(shadersXMLString);

      var vertexShaderLeafCard = new GLSLShader(gl.VERTEX_SHADER,
        snippets.vertexShaderLeafCard,
        gl);
      var fragmentShaderLeafCard = new GLSLShader(gl.FRAGMENT_SHADER,
        snippets.fragmentShaderLeafCard,
        gl);
      var programLeafCard = new GLSLProgram([vertexShaderLeafCard, fragmentShaderLeafCard], gl);


      var vertexShaderLeafCardDepth = new GLSLShader(gl.VERTEX_SHADER,
        snippets.vertexShaderLeafCardDepth,
        gl);
      var fsDepthTextured = shaderRep.get("fsDepthTextured");
      var fsDepthTexturedShadowMap = shaderRep.get("fsDepthTexturedShadowMap");
      var programLeafCardDepth = new GLSLProgram([vertexShaderLeafCardDepth, fsDepthTextured], gl);
      var programLeafCardDepthShadowMap = new GLSLProgram([vertexShaderLeafCardDepth, fsDepthTexturedShadowMap], gl);

      programRep.add("leafCard", programLeafCard);
      programRep.add("leafCardDepth", programLeafCardDepth);
      programRep.add("leafCardDepthShadowMap", programLeafCardDepthShadowMap);
    };

    return LeafCardMaterial;
  });
