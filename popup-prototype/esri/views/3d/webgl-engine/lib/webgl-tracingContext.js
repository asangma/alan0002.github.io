// jshint forin:false

define([], function () {

  function makeTracingContext(ctx) {
    var glObjects = {};
    var currentTexture = null;
    var currentRenderBuffer = null;
    var currentVBO = null;
    var texId = 0;

    var interceptFunction = function(name, augment) {
      var orig = name + "Original";
      ctx[orig] = ctx[name];
      ctx[name] = function() {
        var result = ctx[orig].apply(ctx, arguments);
        augment(result, arguments);
        return result;
      };
    };

    //trace texture object allocations
    
    interceptFunction("createTexture", function(result, argumentsGl) {
      if (result===undefined || result === null) {
        return;
      }

      result._traceObjId = texId++;
      glObjects[result._traceObjId] = {
        type : "texture",
        ref: result
      };
    });

    interceptFunction("deleteTexture", function(result, argumentsGl) {
      if (argumentsGl[0]._traceObjId !== undefined) {
        delete glObjects[argumentsGl[0]._traceObjId];
      }
    });
    
    interceptFunction("bindTexture", function(result, argumentsGl) {
      if (argumentsGl[1] !== null) {
        currentTexture = argumentsGl[1]._traceObjId;
      }
    });

    var getPixelformatSize = function(fmt) {
      switch (fmt) {
      case ctx.DEPTH_COMPONENT:
        return 4;
      case ctx.ALPHA:
        return 1;
      case ctx.RGB:
        return 3;
      case ctx.RGBA:
        return 4;
      case ctx.LUMINANCE:
        return 1;
      case ctx.LUMINANCE_ALPHA:
        return 2;
      }
      return 4;
    };

    interceptFunction("texImage2D", function(result, argumentsGl) {
      var img;

      if (currentTexture !== null) {
        if (argumentsGl[5] instanceof HTMLImageElement && currentTexture !== null) {
          // call to void texImage2D(GLenum target, GLint level,
          // GLenum internalformat,
          // GLenum format, GLenum type, HTMLImageElement image);

          img = argumentsGl[5];
          glObjects[currentTexture].calcSize = img.width * img.height * getPixelformatSize(arguments[2]);
        } 
        else if (argumentsGl[5] instanceof HTMLCanvasElement  && currentTexture !== null) {
          // call to void texImage2D(GLenum target, GLint level,
          // GLenum internalformat,
          // GLenum format, GLenum type, HTMLImageElement image);

          img = argumentsGl[5];
          glObjects[currentTexture].calcSize = img.width * img.height * getPixelformatSize(arguments[2]);
        } 
        else if (argumentsGl.length >= 9) {
          // call to texImage2D(GLenum target, GLint level, GLenum
          // internalformat,
          // GLsizei width, GLsizei height, GLint border, GLenum
          // format,
          // GLenum type, ArrayBufferView? pixels);

          glObjects[currentTexture].calcSize = argumentsGl[3] * argumentsGl[4] * getPixelformatSize(argumentsGl[2]);
        } else {          
          console.log("texMem tracing: overload not yet implemented!");
        }
      }
    });

    interceptFunction("generateMipmap", function(result, argumentsGl) {
      if (currentTexture !== null) {
        glObjects[currentTexture].isMipmapped = true;
      }
    });
    
    //trace render buffer allocations
    
    interceptFunction("createRenderbuffer", function(result, argumentsGl) {
      if (result === undefined || result === null) {
        return;
      }

      result._traceObjId = texId++;
      glObjects[result._traceObjId] = {
        type : "renderBuffer",
        ref: result
      };
    });
    
    interceptFunction("bindRenderbuffer", function(result, argumentsGl) {
      if (argumentsGl[1] !== null) {
        currentRenderBuffer = argumentsGl[1]._traceObjId;
      }
    });
    
    interceptFunction("renderbufferStorage", function(result, argumentsGl) {
      if (currentRenderBuffer !== null) {
        glObjects[currentRenderBuffer].calcSize = argumentsGl[2]*argumentsGl[3]*2;
      }
    });
    
    interceptFunction("deleteRenderbuffer", function(result, argumentsGl) {
      if (argumentsGl[0]._traceObjId !== undefined) {
        delete glObjects[argumentsGl[0]._traceObjId];
      }
    });

    //trace VBO buffer allocations
    interceptFunction("createBuffer", function(result, argumentsGl) {
      if (result === undefined || result === null) {
        return;
      }
      result._traceObjId = texId++;
      glObjects[result._traceObjId] = {
        type : "VBO",
        ref: result
      };
    });
    
    interceptFunction("bindBuffer", function(result, argumentsGl) {
      if (argumentsGl[1] !== null) {
        currentVBO = argumentsGl[1]._traceObjId;
      }
    });
    
    interceptFunction("bufferData", function(result, argumentsGl) {
      if (currentVBO !== null) {
        glObjects[currentVBO].calcSize = ctx.getBufferParameter(ctx.ARRAY_BUFFER, ctx.BUFFER_SIZE);
      }
    });
    
    interceptFunction("deleteBuffer", function(result, argumentsGl) {
      if (argumentsGl[0]._traceObjId !== undefined) {
        delete glObjects[argumentsGl[0]._traceObjId];
      }
    });

    var getSize = function(type)
    {
      var size = 0;
      for (var i in glObjects) {
        if (glObjects[i].type !== type) {
          continue;
        }

        if (glObjects[i].calcSize !== undefined) {
          size += glObjects[i].calcSize;

          if (glObjects[i].isMipmapped) {
            size += glObjects[i].calcSize * 0.3333;
          }
        }
      }
      return size / 1000000;
    };
    
    ctx.getUsedTextureMemory = function() {
      return getSize("texture");
    };
    
    ctx.getUsedTextureMemoryStats = function() {      
      var stats = {};
      for ( var i in glObjects) {
        if (glObjects[i].type !== "texture") {
          continue;
        }
        
        var tType =  glObjects[i].ref._debugTracingType || "untagged";

        var size = 0;
        if (glObjects[i].calcSize !== undefined) {
          size = glObjects[i].calcSize;

          if (glObjects[i].isMipmapped) {
            size += glObjects[i].calcSize * 0.3333;
          }
        }
        
        if (stats[tType] === undefined) {
          stats[tType] = size/1000000;
        }
        else {
          stats[tType] += size/1000000;          
        }
      }
      
      return stats;
    };

    ctx.getUsedRenderbufferMemory = function() {
      return getSize("renderBuffer");
    };
    
    ctx.getUsedVBOMemory = function() {
      return getSize("VBO");
    };
    
    ctx._isTracingEnabled = true;
    
    return ctx;
  }

  return {
    makeTracingContext: makeTracingContext
  };
});