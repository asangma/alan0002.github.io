define([
  "dojo/text!./TexOnlyGLMaterial.xml",
  "./MaterialUtil",
  "../../lib/GLSLProgram",
  "../../lib/GLSLShader"
],
  function(shadersXMLString, MaterialUtil, GLSLProgram, GLSLShader) {

    var vertexBufferLayout = MaterialUtil.Layouts.PosTex;

    var TexOnlyGLMaterial = function(programRep, texGLName, color, blend, depthFunc) {
      this.id = MaterialUtil.__GLMaterial_id++;

      var program = programRep.get("texOnly");

      this.getId = function() {
        return this.id;
      };

      this.beginSlot = function(slot) {
        return slot === 0;
      };

      this.getProgram = function() {
        return program;
      };

      this.setColor = function(newCol) {
        color = newCol;
      };

      this.bind = function(gl, bindParams) {
        program.use();

        program.uniformMatrix4fv("model", MaterialUtil.IDENTITY);
        program.uniformMatrix4fv("proj", bindParams.proj);
        program.uniform4fv("color", color !== undefined ? color : [1.0, 1.0, 1.0, 1.0]);

        program.uniform1i("tex", 0);
        gl.bindTexture(gl.TEXTURE_2D, texGLName);

        vertexBufferLayout.enableVertexAttribArrays(gl, program);

        if (blend) {
          gl.enable(gl.BLEND);
        }

        if (depthFunc !== undefined) {
          gl.depthFunc(depthFunc);
        }
      };

      this.release = function(gl) {
        if (depthFunc !== undefined) {
          gl.depthFunc(gl.LESS);
        }

        if (blend) {
          gl.disable(gl.BLEND);
        }

        vertexBufferLayout.disableVertexAttribArrays(gl, program);
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


    TexOnlyGLMaterial.loadShaders = function(snippets, shaderRep, programRep, gl) {
      snippets._parse(shadersXMLString);

      var vertexShaderTexOnly = new GLSLShader(gl.VERTEX_SHADER,
        snippets.vertexShaderTexOnly,
        gl);

      var fragmentShaderTexOnly = new GLSLShader(gl.FRAGMENT_SHADER,
        snippets.fragmentShaderTexOnly,
        gl);

      var programTexOnly = new GLSLProgram([vertexShaderTexOnly, fragmentShaderTexOnly], gl);

      programRep.add("texOnly", programTexOnly);
      shaderRep.add("vertexShaderTexOnly", vertexShaderTexOnly);
      shaderRep.add("fragmentShaderTexOnly", fragmentShaderTexOnly);
    };

    return TexOnlyGLMaterial;
  });
