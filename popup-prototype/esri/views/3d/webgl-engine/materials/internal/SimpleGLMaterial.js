define([
  "dojo/text!./SimpleGLMaterial.xml",
  "./MaterialUtil",
  "../../lib/GLSLProgram",
  "../../lib/GLSLShader"
],
  function(shadersXMLString, MaterialUtil, GLSLProgram, GLSLShader) {

    var vertexBufferLayout = MaterialUtil.Layouts.Pos;

    var SimpleGLMaterial = function(programRep, color, depthFunc, drawMode) {
      this.id = MaterialUtil.__GLMaterial_id++;

      var program = programRep.get("simple");

      this.getId = function() {
        return this.id;
      };

      this.beginSlot = function(slot) {
        return slot === 0;
      };

      this.getProgram = function() {
        return program;
      };

      this.bind = function(gl, bindParams) {
        program.use();

        program.uniformMatrix4fv("model", MaterialUtil.IDENTITY);
        program.uniformMatrix4fv("proj", bindParams.proj);
        program.uniform4fv("color", color);

        vertexBufferLayout.enableVertexAttribArrays(gl, program);

        gl.enable(gl.BLEND);

        if (depthFunc !== undefined) {
          gl.depthFunc(depthFunc);
        }
      };

      this.release = function(gl) {
        if (depthFunc !== undefined) {
          gl.depthFunc(gl.LESS);
        }

        gl.disable(gl.BLEND);

        vertexBufferLayout.disableVertexAttribArrays(gl, program);
      };

      this.bindView = function(gl, bindParams) {
        MaterialUtil.bindView(bindParams.origin, bindParams.view, program);
      };

      this.bindInstance = function(gl, instance) {
        program.uniformMatrix4fv("model", instance.transformation);
      };

      this.getDrawMode = function(gl) {
        return drawMode===undefined?gl.TRIANGLES:drawMode;
      };
    };

    SimpleGLMaterial.loadShaders = function(snippets, shaderRep, programRep, gl) {
      snippets._parse(shadersXMLString);

      var vertexShaderSimple = new GLSLShader(gl.VERTEX_SHADER,
        snippets.vertexShaderSimple,
        gl);

      var fragmentShaderSimple = new GLSLShader(gl.FRAGMENT_SHADER,
        snippets.fragmentShaderSimple,
        gl);

      var programSimple = new GLSLProgram([vertexShaderSimple, fragmentShaderSimple], gl);

      programRep.add("simple", programSimple);
    };

    return SimpleGLMaterial;
  });
