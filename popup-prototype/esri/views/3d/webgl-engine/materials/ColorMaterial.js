define([
  "dojo/_base/lang",
  "dojo/text!./ColorMaterial.xml",
  "./internal/MaterialUtil",
  "../lib/GLSLProgram",
  "../lib/GLSLShader"
],
  function(lang, shadersXMLString, MaterialUtil, GLSLProgram, GLSLShader) {

    var ColorMaterial = function(params, idHint) {
      MaterialUtil.basicMaterialConstructor(this, idHint);

      params = params || {};
      params.color = params.color || [1, 1, 1, 1];
      params.polygonOffset = params.polygonOffset || false;
      params.vertexColors = params.vertexColors || false;

      var vertexBufferLayout = MaterialUtil.Layouts.PosColor;  
      
      this.getParams = function() {
        return params;
      };

      this.setColor = function(newColor) {
        params.color = newColor;
        this.notifyDirty("matChanged");
      };

      this.getColor = function() {
        return params.color;
      };

      this.setTransparent = function(newTransparent) {
        params.transparent = newTransparent;
        this.notifyDirty("matChanged");
      };

      this.getTransparent = function(newTransparent) {
        return params.transparent;
      };

      this.dispose = function() {
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
        return [ ColorGLMaterial, undefined, undefined ];
      };

      this.getAllTextureIds = function() {
        return [ ];
      };
    };

    var ColorGLMaterial = function(material, programRep, textureRep) {
      MaterialUtil.basicGLMaterialConstructor(this, material);

      var params = lang.clone(material.getParams());
      
      var program = programRep.get("colorMaterial");
      var color = material.getColor();

      this.beginSlot = function(slot) {
        return slot === (color[3] < 1 ? 2 : 1);
      };

      this.getProgram = function() {
        return program;
      };

      this.updateParameters = function() {
        params.color = material.getColor();
        params.transparent = material.getTransparent();
      };
      
      this.bind = function(gl, bindParams) {
        program.use();
        program.uniform4fv("eColor", params.color);
        material.getVertexBufferLayout().enableVertexAttribArrays(gl, program);
        
        if(params.polygonOffset) {
          gl.enable(gl.POLYGON_OFFSET_FILL);
          gl.polygonOffset(1.0, 1.0);
        }

        if (params.transparent) {
          gl.enable(gl.BLEND);         
        }

        if (gl.web3DDefaultState.cullEnabled) {
          gl.disable(gl.CULL_FACE);
        }
      };

      this.release = function(gl) {
        material.getVertexBufferLayout().disableVertexAttribArrays(gl, program);
        
        if (params.transparent) {
          gl.disable(gl.BLEND);         
        }
          
        if (gl.web3DDefaultState.cullEnabled) {
          gl.enable(gl.CULL_FACE);
        }     
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

    ColorMaterial.programs = null;
    ColorMaterial.loadShaders = function(snippets, shaderRep, programRep, gl) {
      snippets._parse(shadersXMLString);

      var vsColor = new GLSLShader(gl.VERTEX_SHADER, snippets.vertexShaderColorMaterial, gl);
      var fsColor = new GLSLShader(gl.FRAGMENT_SHADER, snippets.fragmentShaderColorMaterial, gl);

      var colorMaterialProgram = new GLSLProgram([vsColor, fsColor], gl);

      programRep.add("colorMaterial", colorMaterialProgram);
    };    

    return ColorMaterial;
  }
);
