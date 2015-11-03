/* jshint forin:false */
define([], function () {
return function GLSLShader(type, source, gl, _defines) {
  var glName;
  var defines = _defines;

  var init = function() {
    if (glName !== undefined) {
      return;
    }

    glName = gl.createShader(type);
    
    loadShader();

  };
  
  var loadShader = function() {
    var sourceWithDefines = source;
    
    if (defines !== undefined) {
      var definesString = "";      
      
      for (var def = 0; def < defines.length; def++) {
        definesString += "#define " + defines[def] + "\n";      
      }
      
      sourceWithDefines = definesString+sourceWithDefines;    
    }
    
    gl.shaderSource(glName, sourceWithDefines);
    gl.compileShader(glName);

    if (!gl.getShaderParameter(glName, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(glName));
      console.error(addLineNumbers(sourceWithDefines));
    }
  };

  var padToThree = function (number) {
    if (number < 1000) {
      number = ("  "+number).slice(-3);
    }

    return number;
  };

  var addLineNumbers = function(text) {
    var line = 2;

    function replacer() {
      return "\n" + padToThree(line++) + ":";
    }

    return text.replace(/\n/g, replacer);
  };
  
  this.changeDefines = function(_defines)
  {
    if (JSON.stringify(defines) == JSON.stringify(_defines)) {
      return false;
    }

    defines = _defines;

    if (glName !== undefined) {
      loadShader();
    }

    console.log("updating shader");
    return true;
  };
  
  this.getGLName = function() {
    init();
    return glName;
  };
};
});