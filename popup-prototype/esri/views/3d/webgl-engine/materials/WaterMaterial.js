define([
  "dojo/text!./WaterMaterial.xml",
  "./internal/MaterialUtil",
  "../lib/GLSLProgram",
  "../lib/GLSLShader"
],
  function(shadersXMLString, MaterialUtil, GLSLProgram, GLSLShader) {

    var WaterMaterial = function(noiseTextureId, reflTextureId, color, scale, speed, idHint) {
      MaterialUtil.basicMaterialConstructor(this, idHint);

      var vertexBufferLayout = MaterialUtil.Layouts.Pos;

      this.dispose = function() {

      };

      this.getNoiseTextureId = function() {
        return noiseTextureId;
      };

      this.getReflTextureId = function() {
        return reflTextureId;
      };

      this.getColor = function() {
        return color;
      };

      this.getScale = function() {
        return scale;
      };

      this.getSpeed = function() {
        return speed;
      };

      this.getOutputAmount = function(inputAmount) {
        return inputAmount*vertexBufferLayout.getStride();
      };

      this.getVertexBufferLayout = function() {
        return vertexBufferLayout;
      };

      this.fillInterleaved = function(geomData, transformation, invTranspTransformation, instanceParams, dst, offset, filter) {
        MaterialUtil.fillInterleaved(geomData, transformation, invTranspTransformation, instanceParams,
          vertexBufferLayout, dst, offset, filter);
      };

      this.intersect = MaterialUtil.intersectTriangleGeometry;

      this.getGLMaterials = function() {
        return [WaterGLMaterial, undefined, undefined ];
      };

      this.getAllTextureIds = function() {
        return [ noiseTextureId, reflTextureId ];
      };
    };

    var WaterGLMaterial = function(material, programRep, textureRep) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var slot = 2;
      var program = programRep.get("water");

      var params = {
        noiseTextureId: material.getNoiseTextureId(),
        reflTextureId: material.getReflTextureId()
      };
      var multiTexDesc = [["noiseTextureId",undefined,"noiseTex"],["reflTextureId", undefined, "reflTex"]];
      MaterialUtil.multiTextureGLMaterialConstructor(this, textureRep, params, multiTexDesc);

      var color = material.getColor();
      var scale = material.getScale();
      var speed = material.getSpeed();

      var t0 = Date.now();

      this.beginSlot = function(slot_) {
        return slot === slot_;
      };

      this.getProgram = function() {
        return program;
      };

      this.bind = function(gl, bindParams) {
        program.use();

        this.bindTextures(gl, program);

        program.uniform3fv("color", color);
        program.uniform1f("scale", scale);
        var speed01 = (Date.now() - t0) / 100000.0 * speed;
        speed01 = speed01 - Math.floor(speed01);
        program.uniform1f("speed", speed01);

        material.getVertexBufferLayout().enableVertexAttribArrays(gl, program);
      };

      this.release = function(gl) {
        material.getVertexBufferLayout().disableVertexAttribArrays(gl, program);
      };

      this.bindView = function(gl, bindParams) {
        var origin = bindParams.origin;
        MaterialUtil.bindView(origin, bindParams.view, program);
        MaterialUtil.bindCamPos(origin, bindParams.viewInvTransp, program);
        bindParams.shadowMap.bindView(program, origin);
      };

      this.bindInstance = function(gl, instance) {
        program.uniformMatrix4fv("model", instance.transformation);
      };

      this.getDrawMode = function(gl) {
        return gl.TRIANGLES;
      };
    };

    WaterMaterial.loadShaders = function(snippets, shaderRep, programRep, gl) {
      snippets._parse(shadersXMLString);

      var vertexShaderWater = new GLSLShader(gl.VERTEX_SHADER,snippets.vertexShaderWater,gl);
      var fragmentShaderWater = new GLSLShader(gl.FRAGMENT_SHADER,snippets.fragmentShaderWater,gl);
      var programWater = new GLSLProgram([vertexShaderWater, fragmentShaderWater], gl);
      programRep.add("water", programWater);
    };

    return WaterMaterial;
  });
