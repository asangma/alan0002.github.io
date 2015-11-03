/* jshint forin:false */
define(["./Util"], function (Util) {
  return function GLSLProgramRep() {
    var programsByName = {};
    var namesById = [];
    var programRefCount = [];
    var commonUniforms = {
      "model": [],
      "modelNormal": [],
      "lightDirection": [],
      "proj": [],
      "shadowMapDistance": [],
      "viewportPixelSz": []
    };

    this.dispose = function() {
      for (var programName in programsByName) {
        programsByName[programName].dispose();
      }

      programsByName = null;
      namesById = null;
      programRefCount = null;
    };

    this.add = function(name, program) {
      Util.assert(programsByName[name] === undefined);

      programsByName[name] = program;
      namesById[program.getId()] = name;
    };

    this.get = function(name) {
      return programsByName[name];
    };

    this.shaderVariators = {};

    this.getProgramsUsingUniform = function(uniformName) {
      return commonUniforms[uniformName] || [];
    };

    this.increaseRefCount = function(program) {
      var programId = program.getId();

      if (programRefCount[programId]) {
        programRefCount[programId]++;
      }
      else {
        programRefCount[programId] = 1;
        findCommonUniforms(program);
      }
    };

    this.decreaseRefCount = function(program) {
      var programId = program.getId();

      if (programRefCount[programId] > 1) {
        programRefCount[programId]--;
      }
      else {
        forgetCommonUniforms(program);
        programRefCount[programId] = 0;
      }
    };

    function findCommonUniforms(program) {
      for (var uniName in commonUniforms) {
        if (program.hasUniform(uniName)) {
          Util.assert(commonUniforms[uniName].indexOf(program) === -1, "common uniforms of program have already been determined");

          commonUniforms[uniName].push(program);
        }
      }
      //dbgPrint();
    }

    function forgetCommonUniforms(program) {
      for (var uniName in commonUniforms) {
        var programArray = commonUniforms[uniName];
        var i = programArray.indexOf(program);
        
        if (i > -1) {
          programArray[i] = programArray[programArray.length-1];
          programArray.pop();
        }
      }
      //dbgPrint();
    }

    /*function dbgPrint() {
      console.log("all of em:");

      for (var uniName in commonUniforms) {
        var str = uniName + ":";
        var programArray = commonUniforms[uniName];
       
        for (var i = 0; i < programArray.length; i++) {
          str += namesById[programArray[i].getId().toString()] + ",";
        }

        console.log(str);
      }
    }*/
  };
});