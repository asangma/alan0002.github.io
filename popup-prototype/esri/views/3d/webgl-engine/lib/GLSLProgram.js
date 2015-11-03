define(["./GLSLShader", "./gl-matrix"], function (GLSLShader, glMatrix){
  var vec2d = glMatrix.vec2d;
  var vec3d = glMatrix.vec3d;
  var vec4d = glMatrix.vec4d;
  var mat4d = glMatrix.mat4d;

  var nextGlobalProgramIndex = 0;
  var lastUsedProgram;

  function GLSLProgram(shaders, gl) {
    var globalIndex = nextGlobalProgramIndex++;
    var glName;
    var name2uniformLoc;
    var name2attribLoc;

    var init = function() {
      if (glName !== undefined) {
        return;
      }

      glName = gl.createProgram();

      for (var i = 0; i < shaders.length; ++i) {
        gl.attachShader(glName, shaders[i].getGLName());
      }

      linkShaders();

    };

    var linkShaders = function() {
      if (glName === undefined) {
        return;
      }

      gl.linkProgram(glName);

      if (!gl.getProgramParameter(glName, gl.LINK_STATUS)) {
        console.error("Could not initialize shader\n" + "VALIDATE_STATUS: "
            + gl.getProgramParameter(glName, gl.VALIDATE_STATUS) + ", gl error ["
        + gl.getError() + "]"
        + "infoLog: " + gl.getProgramInfoLog(glName));
      }

      name2uniformLoc = {};
      name2attribLoc = {};
    };

    //needed for realtime-editing in firefox shader debugger
    this.clearLookupTables = function() {
      name2uniformLoc = {};
      name2attribLoc = {};
      name2uniform1 = {};
      name2uniform2 = {};
      name2uniform3 = {};
      name2uniform4 = {};
      name2uniformMatrix4 = {};
    };


    this.dispose = function() {
      for ( var i = 0; i < shaders.length; ++i) {
        var shaderName = shaders[i].getGLName();

        if (gl.isShader(shaderName)) {
          gl.deleteShader(shaderName);
        }
      }

      if (gl.isProgram(glName)) {
        gl.deleteProgram(glName);
      }

      if (lastUsedProgram === this) {
        GLSLProgram.unuse(gl);
      }
    };

    this.getId = function() {
      return globalIndex;
    };

    this.getShader = function(whichShader) {
      return shaders[(whichShader === "vertex") ? 0 : 1];
    };

    this.changeShaderDefines = function(shaderIdx, def)
    {
      var changed = shaders[shaderIdx].changeDefines(def);

      if (changed) {
        linkShaders();
      }
    };

    this.use = function() {
      if (lastUsedProgram !== this) {
        init();

        gl.useProgram(glName);
        lastUsedProgram = this;
      }
    };

    this.getLocation = function(name) {
      init();

      if (name2uniformLoc[name] === undefined) {
        name2uniformLoc[name] = gl.getUniformLocation(glName, name);
      }

      return name2uniformLoc[name];
    };

    this.hasUniform = function(name) {
      return this.getLocation(name) !== null;
    };

    this.getAttribLocation = function(name) {
      init();

      if (name2attribLoc[name] === undefined) {
        name2attribLoc[name] = gl.getAttribLocation(glName, name);
      }

      return name2attribLoc[name];
    };

    var name2uniform1 = {};

    this.uniform1i = function(name, value) {
      var last = name2uniform1[name];

      if (last === undefined || value !== last) {
        this.use();
        gl.uniform1i(this.getLocation(name, gl), value);
        name2uniform1[name] = value;
      }
    };

    this.uniform1f = function(name, value) {
      var last = name2uniform1[name];

      if (last === undefined || value !== last) {
        this.use();
        gl.uniform1f(this.getLocation(name, gl), value);
        name2uniform1[name] = value;
      }
    };

    var name2uniform2 = {};

    this.uniform2f = function(name, val0, val1) {
      var last = name2uniform2[name];

      if (last === undefined || val0 !== last[0] || val1 !== last[1]) {
        this.use();
        gl.uniform2f(this.getLocation(name, gl), val0, val1);

        if (last === undefined) {
          name2uniform2[name] = vec2d.createFrom(val0, val1);
        }
        else {
          vec2d.set2(val0, val1, last);
        }
      }
    };

    this.uniform2fv = function(name, value) {
      var last = name2uniform2[name];
      if (value.length > 2 || last === undefined || value[0] !== last[0] || value[1] !== last[1]) {
        this.use();
        gl.uniform2fv(this.getLocation(name, gl), value);

        if (last === undefined) {
          name2uniform2[name] = vec2d.create(value);
        }
        else {
          vec2d.set(value, last);
        }
      }
    };

    var name2uniform3 = {};

    this.uniform3f = function(name, val0, val1, val2) {
      var last = name2uniform3[name];

      if (last === undefined || val0 !== last[0] || val1 !== last[1] || val2 !== last[2]) {
        this.use();
        gl.uniform3f(this.getLocation(name, gl), val0, val1, val2);

        if (last === undefined) {
          name2uniform3[name] = vec3d.createFrom(val0, val1, val2);
        }
        else {
          vec3d.set3(val0, val1, val2, last);
        }
      }
    };

    this.uniform3fv = function(name, value) {
      var last = name2uniform3[name];

      if (value.length > 3 || last === undefined || value[0] !== last[0] || value[1] !== last[1] || value[2] !== last[2]) {
        this.use();
        gl.uniform3fv(this.getLocation(name, gl), value);

        if (last === undefined) {
          name2uniform3[name] = vec3d.create(value);
        }
        else {
          vec3d.set(value, last);
        }
      }
    };

    var name2uniform4 = {};

    this.uniform4f = function(name, val0, val1, val2, val3) {
      var last = name2uniform4[name];

      if (last === undefined || val0 !== last[0] || val1 !== last[1] || val2 !== last[2] || val3 !== last[3]) {
        this.use();
        gl.uniform4f(this.getLocation(name, gl), val0, val1, val2, val3);

        if (last === undefined) {
          name2uniform4[name] = vec4d.createFrom(val0, val1, val2, val3);
        }
        else {
          vec4d.set4(val0, val1, val2, val3, last);
        }
      }
    };

    this.uniform4fv = function(name, value) {
      var last = name2uniform4[name];

      if (value.length > 4 || last === undefined || value[0] !== last[0] || value[1] !== last[1] || value[2] !== last[2] || value[3] !== last[3]) {
        this.use();
        gl.uniform4fv(this.getLocation(name, gl), value);

        if (last === undefined) {
          name2uniform4[name] = vec4d.create(value);
        }
        else {
          vec4d.set(value, last);
        }
      }
    };

    var name2uniformMatrix4 = {};

    function matrix4Equal(a, b) {
      return a[0]  === b[0]  && a[1]  === b[1]  && a[2]  === b[2]  && a[3]  === b[3]  &&
             a[4]  === b[4]  && a[5]  === b[5]  && a[6]  === b[6]  && a[7]  === b[7]  &&
             a[8]  === b[8]  && a[9]  === b[9]  && a[10] === b[10] && a[11] === b[11] &&
             a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
    }

    this.uniformMatrix4fv = function(name, value) {
      var last = name2uniformMatrix4[name];

      if (value.length > 16 || last === undefined || !matrix4Equal(last, value)) {
        this.use();
        gl.uniformMatrix4fv(this.getLocation(name, gl), false, value);

        if (last === undefined) {
          name2uniformMatrix4[name] = mat4d.create(value);
        }
        else {
          mat4d.set(value, last);
        }
      }
    };

    this.dispose = function() {
      if (glName === undefined) {
        return;
      }

      for (var i = 0; i < shaders.length; ++i) {
        var shaderName = shaders[i].getGLName();

        gl.detachShader(glName, shaderName);
        gl.deleteShader(shaderName);
      }

      gl.deleteProgram(glName);
    };
  }

  GLSLProgram.fromSnippets = function(vertexName, fragmentName, snippets, gl, defines) {
    var shaders = [];

    vertexName = Array.isArray(vertexName) ? vertexName : [vertexName];
    fragmentName = Array.isArray(fragmentName) ? fragmentName : [fragmentName];

    var i;

    for (i = 0; i < vertexName.length; i++) {
      shaders.push(new GLSLShader(gl.VERTEX_SHADER, snippets[vertexName[i]], gl, defines));
    }

    for (i = 0; i < fragmentName.length; i++) {
      shaders.push(new GLSLShader(gl.FRAGMENT_SHADER, snippets[fragmentName[i]], gl, defines));
    }

    return new GLSLProgram(shaders, gl);
  };

  GLSLProgram.unuse = function(gl) {
    lastUsedProgram = null;
    gl.useProgram(null);
  };

  return GLSLProgram;
});
