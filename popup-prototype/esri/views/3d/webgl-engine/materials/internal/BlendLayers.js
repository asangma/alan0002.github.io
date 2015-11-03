define([
  "dojo/text!./BlendLayers.xml",
  "../../lib/GLSLProgram",
  "../../lib/GLSLShader"
],
  function(shadersXMLString, GLSLProgram, GLSLShader) {

    var BlendLayers = {
    loadShaders : function(snippets, shaderRep, programRep, gl) {
      snippets._parse(shadersXMLString);

      var vertexShaderBlendLayers = new GLSLShader(gl.VERTEX_SHADER,
        snippets.vertexShaderBlendLayers,
        gl);

      var fragmentShaderBlendLayers = new GLSLShader(gl.FRAGMENT_SHADER,
        snippets.fragmentShaderBlendLayers,
        gl);

      var programBlendLayers = new GLSLProgram([vertexShaderBlendLayers, fragmentShaderBlendLayers], gl);

      programRep.add("blendlayers", programBlendLayers);
    }
  };

    return BlendLayers;
  });
