define([
  "dojo/text!./BillboardMaterial.xml",
  "./internal/MaterialUtil",
  "../lib/GLSLProgram",
  "../lib/GLSLShader"
],
  function(shadersXMLString, MaterialUtil, GLSLProgram, GLSLShader) {
    var BillboardMaterial = function(textureId, idHint) {
      MaterialUtil.basicMaterialConstructor(this, idHint);

      var vertexBufferLayout = MaterialUtil.Layouts.PosNormTex;

      this.getSize = function() {
        return 1.05;
      };

      this.dispose = function() {

      };

      this.getTextureId = function() {
        return textureId;
      };

      this.getOutputAmount = function(inputAmount) {
        return inputAmount*vertexBufferLayout.getStride()*6;
      };

      this.getVertexBufferLayout = function() {
        return vertexBufferLayout;
      };

      this.fillInterleaved = function(geomData, transformation, invTranspTransformation, instanceParams, dst, offset) {
        var fill = MaterialUtil.fill;
        var ind = geomData.faces.indices.va;
        var va = geomData.vertexAttr.va.data;

        var tc4 = geomData.vertexAttr.tc4.data;

        var n0 = geomData.vertexAttr.n0.data;
        var n1 = geomData.vertexAttr.n1.data;
        var n2 = geomData.vertexAttr.n2.data;
        var n3 = geomData.vertexAttr.n3.data;

        for (var j = 0; j < ind.length; ++j) {
          var j4 = 4 * ind[j];
          var j3 = 3 * ind[j];

          offset += fill(va, j4, dst, offset, transformation, 3);
          offset += fill(n0, j3, dst, offset, invTranspTransformation, 3);
          dst[offset++] = tc4[j4]; dst[offset++] = tc4[j4 + 1];

          offset += fill(va, j4, dst, offset, transformation, 3);
          offset += fill(n1, j3, dst, offset, invTranspTransformation, 3);
          dst[offset++] = tc4[j4 + 2] + 1.0; dst[offset++] = tc4[j4 + 1];

          offset += fill(va, j4, dst, offset, transformation, 3);
          offset += fill(n2, j3, dst, offset, invTranspTransformation, 3);
          dst[offset++] = tc4[j4 + 2] + 1.0; dst[offset++] = tc4[j4 + 3] + 1.0;

          offset += fill(va, j4, dst, offset, transformation, 3);
          offset += fill(n2, j3, dst, offset, invTranspTransformation, 3);
          dst[offset++] = tc4[j4 + 2] + 1.0; dst[offset++] = tc4[j4 + 3] + 1.0;

          offset += fill(va, j4, dst, offset, transformation, 3);
          offset += fill(n3, j3, dst, offset, invTranspTransformation, 3);
          dst[offset++] = tc4[j4]; dst[offset++] = tc4[j4 + 3] + 1.0;

          offset += fill(va, j4, dst, offset, transformation, 3);
          offset += fill(n0, j3, dst, offset, invTranspTransformation, 3);
          dst[offset++] = tc4[j4]; dst[offset++] = tc4[j4 + 1];
        }
      };

      this.intersect = function() {

      };

      this.getGLMaterials = function() {
        return [ BillboardGLMaterial, BillboardGLMaterialDepthShadowMap, undefined, BillboardGLMaterialDepth ];
      };

      this.getAllTextureIds = function() {
        return [ textureId ];
      };
    };

    var BillboardGLMaterial = function(material, programRep, textureRep) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var slot = 2;
      var program = programRep.get("billboard");

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
        program.uniformMatrix4fv("modelNormal", instance.transformationNormal);
      };

      this.getDrawMode = function(gl) {
        return gl.TRIANGLES;
      };
    };

    var BillboardGLMaterialDepth = function(material, programRep, textureRep, biased) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var slot = 2;
      var program = biased==null?programRep.get("billboardDepth"):programRep.get("billboardDepthShadowMap");

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
      };

      this.getDrawMode = function(gl) {
        return gl.TRIANGLES;
      };
    };

    var BillboardGLMaterialDepthShadowMap = function(material, programRep, textureRep)
    {
      BillboardGLMaterialDepth.call(this, material, programRep, textureRep, true );
    };


    BillboardMaterial.loadShaders = function(snippets, shaderRep, programRep, gl) {
      snippets._parse(shadersXMLString);

      var vertexShaderBillboard = new GLSLShader(gl.VERTEX_SHADER, snippets.vertexShaderBillboard,   gl);
      var fragmentShaderBillboard = new GLSLShader(gl.FRAGMENT_SHADER, snippets.fragmentShaderBillboard, gl);
      var programBillboard = new GLSLProgram([vertexShaderBillboard, fragmentShaderBillboard], gl);


      var vertexShaderBillboardDepth = new GLSLShader(gl.VERTEX_SHADER,snippets.vertexShaderBillboardDepth,gl);
      var fsDepthTextured = shaderRep.get("fsDepthTextured");
      var fsDepthTexturedShadowMap = shaderRep.get("fsDepthTexturedShadowMap");
      var programBillboardDepth = new GLSLProgram([vertexShaderBillboardDepth, fsDepthTextured], gl);
      var programBillboardDepthShadowMap = new GLSLProgram([vertexShaderBillboardDepth, fsDepthTexturedShadowMap], gl);

      programRep.add("billboard", programBillboard);
      programRep.add("billboardDepth", programBillboardDepth);
      programRep.add("billboardDepthShadowMap", programBillboardDepthShadowMap);
    };

    return BillboardMaterial;
  });
