define([
  "./GLVBO",
  "./VertexBufferLayout",
  "./Util",
  "./gl-matrix",
  "./webgl-debug"
  ], function (GLVBO, VertexBufferLayout, Util, glMatrix, WebGLDebugUtils){

  var mat4d = glMatrix.mat4d;

  var GLUtil = {
    texImage2D: function(image, glName, gl, programRep, viewportToRestore, mipmap, checkPOT, noUnpackFlip) {
      Util.assert(image.width >= 1 && image.height >= 1);

      if (noUnpackFlip===true) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      }

      if (checkPOT && (!Util.isPowerOfTwo(image.width) || !Util.isPowerOfTwo(image.height))) {
        GLUtil.makePotTexture(image, glName, gl, programRep, viewportToRestore);
        gl.bindTexture(gl.TEXTURE_2D, glName);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, glName);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      }

      if (mipmap) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
        
      gl.bindTexture(gl.TEXTURE_2D, null);

      if (noUnpackFlip===true) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      }

      return glName;
    },

    copyTextureToTexture: function(src, dst, srcx, srcy, dstx, dsty, width, height, gl) {
      var frameBuffer = gl.createFramebuffer();  
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, src, 0);
      GLUtil.checkFramebufferStatus(gl.FRAMEBUFFER, gl);
      
      gl.bindTexture(gl.TEXTURE_2D, dst);
      gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, dstx, dsty, srcx, srcy, width, height);
      gl.generateMipmap(gl.TEXTURE_2D);
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      
      gl.deleteFramebuffer(frameBuffer);
    },

    makePotTexture: function(image, dst, gl, programRep, viewportToRestore) {
      var width = Util.nextHighestPowerOfTwo(image.width);
      var height = Util.nextHighestPowerOfTwo(image.height);
      
      Util.assert(width !== image.width || height !== image.height);
        
      var frameBuffer = gl.createFramebuffer();  
      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
      
      gl.bindTexture(gl.TEXTURE_2D, dst);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dst, 0);
      // glCheckFramebufferStatus(gl.FRAMEBUFFER, gl);  // expensive
      
      var src = gl.createTexture();
      
      gl.bindTexture(gl.TEXTURE_2D, src);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

      var quadVBOLayout = VertexBufferLayout.Defaults.PosTex;
      var quadVBO = new GLVBO(Util.createQuadVertexUvBuffer(), quadVBOLayout, gl);
      
      if (viewportToRestore === undefined) {
        viewportToRestore = gl.getParameter(gl.VIEWPORT);  // expensive
      }
      
      gl.viewport(0, 0, width, height);
      
      var program = programRep.get("texOnly");
      
      program.use();
      
      var identity = mat4d.identity();

      program.uniformMatrix4fv("model", identity);
      program.uniformMatrix4fv("view", identity);
      program.uniformMatrix4fv("proj", identity);
      program.uniform4fv("color", [1.0, 1.0, 1.0, 1.0]);
      
      program.uniform1i("tex", 0);

      quadVBOLayout.enableVertexAttribArrays(gl, program);
      
      quadVBO.bind();
      quadVBO.setPointers(program);
      
      gl.disable(gl.DEPTH_TEST);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, quadVBO.getNum());
      
      gl.enable(gl.DEPTH_TEST);

      quadVBOLayout.disableVertexAttribArrays(gl, program);
      
      gl.viewport(viewportToRestore[0], viewportToRestore[1], viewportToRestore[2], viewportToRestore[3]);
      
      quadVBO.dispose();
      
      gl.deleteTexture(src);
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      
      gl.deleteFramebuffer(frameBuffer);
    },

    checkError: function(msg, gl) {
      var error = gl.getError();

      if (error != gl.NO_ERROR) {
        alert(msg + ": gl error " + error);
      }
    },

    checkFramebufferStatus: function(target, gl) {
      var status = gl.checkFramebufferStatus(target);
      
      if (status != gl.FRAMEBUFFER_COMPLETE) {
        console.log("Framebuffer error 0x" + status);
      }
    },

//WebGLDebugUtils handler functions

    handleError: function(err, funcName, args) {
      alert(WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName + "("
          + WebGLDebugUtils.glFunctionArgsToString(funcName, args) + ")");
    },

    validateNoneOfTheArgsAreUndefined: function(functionName, args) {
      for ( var ii = 0; ii < args.length; ++ii) {
        if (args[ii] === undefined) {
          console.error("undefined passed to gl." + functionName + "("
              + WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
        }
      }
  }
};

return GLUtil;

});