define(["dojo/_base/lang", "./Util", "../lib/GLSLProgram", "../lib/GLSLShader"],
  function(lang, Util, GLSLProgram, GLSLShader)
{
  var assert = Util.assert;

  var ShaderVariations = function(programNamePrefix, shaderSnippetPrefixes, baseDefines,
                                  programRep, shaderRep /* optional */, snippets_ /* optional*/, gl_ /* optional */)
  {
    assert(shaderSnippetPrefixes.length === 2, "you must specify shader snippet prefixes for vertex and fragment shaders");
    if (!baseDefines || baseDefines.length === 0) {
      baseDefines = [[], []];
    } else if (!Array.isArray(baseDefines[0])) {
      baseDefines = [baseDefines, baseDefines];
    }

    var variables = [];
    var sealed = false;

    var shaderCache = {};
    var programCache = {};

    this.addDefine = function(programNameSuffix, defineStr, affectsShaderTypes, shaderNameSuffix) {
      assert(!sealed, "you cannot add another variable after the first program has been generated");
      assert(programNameSuffix, "you must specify a program name suffix");

      variables.push({
        programNameSuffixes: ["", programNameSuffix],
        shaderNameSuffixes: shaderNameSuffix || programNameSuffix,
        defineStr: defineStr,
        affectsShaderTypes: affectsShaderTypes || [true, true]
      });
    };

    this.addBinaryShaderSnippetSuffix = function(programNameSuffix, shaderSnippetSuffix, affectsShaderTypes) {
      assert(!sealed, "you cannot add another variable after the first program has been generated");
      assert(programNameSuffix, "you must specify a program name suffix");
      variables.push({
        programNameSuffixes: ["", programNameSuffix],
        shaderSnippetSuffixes: ["", shaderSnippetSuffix],
        affectsShaderTypes: affectsShaderTypes || [true, true]
      });
    };

    this.addNaryShaderSnippetSuffix = function(variants, affectsShaderTypes) {
      assert(!sealed, "you cannot add another variable after the first program has been generated");
      var values = variants.map(function(v) {
        assert(v.value != null, "value must always be specified");
        return v.value;
      });
      variables.push({
        values: values,
        programNameSuffixes: variants.map(function(v,i) {
          return v.programNameSuffix != null ? v.programNameSuffix : values[i];
        }),
        shaderSnippetSuffixes: variants.map(function(v,i) {
          return v.shaderSnippetSuffix != null ? v.shaderSnippetSuffix : values[i];
        }),
        affectsShaderTypes: affectsShaderTypes || [true, true]
      });
    };


    this.getShaderVariation = function(varValues) {
      assert(varValues.length === variables.length, "you must specify a value for each variable");
      var programName = programNamePrefix;
      var shaderSnippetNames = lang.clone(shaderSnippetPrefixes);
      var shaderNames = lang.clone(shaderSnippetPrefixes);
      var defines = lang.clone(baseDefines);
      for (var varIdx = 0; varIdx < variables.length; varIdx++) {
        var variable = variables[varIdx];
        var val = varValues[varIdx], valIdx;
        if (variable.values) {
          valIdx = variable.values.indexOf(val);
          assert(valIdx >= 0, "invalid value " + val + " for variable " + varIdx);
        }
        else {
          // binary value
          valIdx = val ? 1 : 0;
        }

        programName += variable.programNameSuffixes[valIdx];

        for (var shaderTypeIdx = 0; shaderTypeIdx < 2; shaderTypeIdx++) {
          if (variable.affectsShaderTypes[shaderTypeIdx]) {
            if (variable.shaderSnippetSuffixes) {
              shaderSnippetNames[shaderTypeIdx] += variable.shaderSnippetSuffixes[valIdx];
              shaderNames[shaderTypeIdx] += variable.shaderSnippetSuffixes[valIdx];
            }
            if (variable.defineStr && valIdx) {
              defines[shaderTypeIdx].push(variable.defineStr);
              shaderNames[shaderTypeIdx] += variable.shaderNameSuffixes;
            }
          }
        }
      }
      return {
        programName: programName,
        shaderSnippetNames: shaderSnippetNames,
        shaderNames: shaderNames,
        defines: defines
      };
    };

    this.getProgram = function(varValues, snippets, gl) {
      snippets = snippets || snippets_;
      gl = gl || gl_;

      sealed = true;
      var programKey = varValues.reduce(stringifyReduce, "");
      if (programCache[programKey]) {
        return programCache[programKey];
      }

      var variation = this.getShaderVariation(varValues);

      var program = programRep.get(variation.programName);
      if (program) {
        return program;
      }

      var snippetName, snippet;
      var vertexShaderName = variation.shaderNames[0];
      var vertexShader = shaderCache[vertexShaderName] || (shaderRep && shaderRep.shaders[vertexShaderName]);
      if (!vertexShader) {
        snippetName = variation.shaderSnippetNames[0];
        snippet = snippets[snippetName];
        assert(snippet != null, "shader snippet '" + snippetName + "' does not exist");
        vertexShader = new GLSLShader(gl.VERTEX_SHADER, snippet, gl, variation.defines[0]);
        shaderCache[vertexShaderName] = vertexShader;
        if (shaderRep) {
          shaderRep.add(vertexShaderName, vertexShader);
        }
      }

      var fragmentShaderName = variation.shaderNames[1];
      var fragmentShader = shaderCache[fragmentShaderName] || (shaderRep && shaderRep.shaders[fragmentShaderName]);
      if (!fragmentShader) {
        snippetName = variation.shaderSnippetNames[1];
        snippet = snippets[snippetName];
        assert(snippet != null, "shader snippet '" + snippetName + "' does not exist");
        fragmentShader = new GLSLShader(gl.FRAGMENT_SHADER, snippet, gl, variation.defines[1]);
        shaderCache[fragmentShaderName] = fragmentShader;
        if (shaderRep) {
          shaderRep.add(fragmentShaderName, fragmentShader);
        }
      }

      program = new GLSLProgram([vertexShader, fragmentShader], gl);
      programCache[programKey] = program;
      programRep.add(variation.programName, program);

      return program;
    };
  };

  var stringifyReduce = function(str, v) {
    return str + v.toString();
  };

  return ShaderVariations;
});
