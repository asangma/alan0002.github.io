// jshint bitwise:false
define([
  "./GLFBO",
  "./GLUtil",
  "./GLVBO",
  "./GLSLShader",
  "./GLSLProgram",
  "./VertexBufferLayout",
  "./Util",
  "./gl-matrix",
  "dojo/text!../materials/internal/ssao.xml"
  ], function (GLFBO, GLUtil, GLVBO, GLSLShader, GLSLProgram, VertexBufferLayout, Util, glMatrix, shaderXmlString) {

  var vec4 = glMatrix.vec4;
  var vec2d = glMatrix.vec2d;

  var tmpNearFar = vec2d.create();

  var SSAOHelper = function SSAOHelper(programRep, textureRep, gl) {
    var normalFBO;
    var depthFBO;
    var ssaoFBO;
    var blur0FBO;
    var blur1FBO;
    var noise;
    var quadVBO;

    var BLUR_F = 2;
    var noiseDim = 64;
    var attenuation = 0.5;
    var radius = 5.0;
    var filterRadius = 3;
    var samples = 16;

    var viewportToRestore = vec4.create();

    var rndVectors8 = [ 0.186937, 0.000000, 0.000000, 0.677503, 0.000000, 0.000000, -0.782832, 0.128424, 0.557187,
              0.248064, 0.460317, -0.659755, 0.062892, 0.918659, 0.312829, -0.241031, -0.814826, 0.224206,
              -0.642866, 0.132138, -0.450160, 0.145727, -0.590568, -0.626141,  0.005017, -0.002234, 0.012668 ];


    var rndVectors16 = [ 0.186937, 0.000000, 0.000000, 0.700542, 0.000000, 0.000000, -0.864858, -0.481795, -0.111713,
               -0.624773, 0.102853, -0.730153, -0.387172, 0.260319, 0.007229, -0.222367, -0.642631, -0.707697,
               -0.013360, -0.014956, 0.169662, 0.122575, 0.154400, -0.456944, -0.177141, 0.859970, -0.423460,
               -0.131631, 0.814545, 0.524355, -0.779469, 0.007991, 0.624833, 0.308092, 0.209288, 0.359690,
               0.359331, -0.184533, -0.377458, 0.192633, -0.482999,  -0.065284, 0.233538, 0.293706, -0.055139,
               0.417709, -0.386701, 0.442449, -0.301656, -0.836426, 0.408344 ];

    var rndVectors32 = [ 0.837372, 0.000000, 0.000000, 0.723531, -0.467287, 0.034157, 0.169582, -0.311690, -0.881801,
               0.696236, 0.455215, -0.204568, -0.304514, 0.528086, 0.626381, -0.053116, 0.222507,  0.037523,
               0.199755, 0.311291, 0.916799, -0.681552, -0.516264, 0.501792, -0.371270, 0.021088, 0.737477,
               -0.029503, 0.209188, -0.952980, -0.573731, 0.009962, -0.154202, -0.257345, -0.905958, 0.282747,
               0.370779, 0.527867, -0.669424, -0.601758, -0.191278, -0.708243, 0.271796, 0.782684, 0.535565,
               -0.006867, -0.015312, -0.017276, 0.419958, 0.265628, 0.233036, -0.543898, 0.554747, -0.174055,
               -0.079242, 0.053475, -0.099539, 0.372042, -0.339267, -0.357362, 0.015781, -0.011352, 0.042707,
               -0.340564, -0.272507, -0.067725, 0.799249, -0.127948, 0.586808, 0.450015, 0.019650, -0.416454,
               -0.506524, 0.323229, 0.206546, -0.087316, -0.311097, 0.466049, 0.146374, -0.345280, -0.045904,
               -0.152614, -0.926686, -0.287529, -0.665726, -0.032904, 0.246643, 0.248703, 0.637193, -0.062541,
               -0.073706, 0.495925, -0.315143, 0.059460, -0.116042, 0.075586 ];

    var rndVectors64 = [ 0.186937, 0.000000, 0.000000, 0.605726, -0.313457, -0.097616, 0.003541, 0.781245, 0.283011,
               -0.225029, -0.373279, 0.274442, -0.047511, 0.049920, -0.226365, 0.627629, -0.623617, -0.463628,
               0.133094, -0.318299, 0.528128, 0.262035, 0.100234, -0.090120, 0.178335, -0.426972, -0.666048,
               -0.273060, -0.207352, 0.055140, -0.613649, -0.063395, 0.060608, -0.283391, -0.413820, -0.087565,
               0.136768, 0.506126, 0.484137, -0.593808, -0.344603, 0.453164, 0.675326, 0.124799, -0.697865,
               -0.335020, 0.411337, -0.093370, -0.152710, 0.002908, -0.063582, 0.366733, -0.699739, 0.401148,
               -0.519536, -0.585625, -0.508413, 0.106482, -0.428709, -0.260221, 0.012847, -0.118806, 0.016962,
               -0.188182, 0.499450, 0.452364, 0.586617, 0.722539, -0.233020, 0.111295, 0.202827, 0.066695,
               -0.036503, 0.315842, 0.896467, -0.039109, -0.270116, -0.080062, 0.613435, 0.508787, 0.538656,
               -0.352275, 0.566869, -0.666275, 0.887876, -0.138341, -0.434135, -0.444711, 0.269156, 0.119506,
               -0.029457, -0.077316, 0.754474, 0.274125, -0.138760, -0.370820, -0.732680, 0.332723, 0.568545,
               -0.203992, 0.878922, -0.430778, 0.541154, -0.546752, 0.117860, -0.000393, -0.083318, 0.059333,
               -0.341406, -0.117017, -0.318568, -0.262425, -0.457913, 0.848753, 0.892290, -0.301570, 0.322416,
               0.742328, 0.032262, 0.643827, 0.048091, -0.078044, -0.499080, 0.064858, 0.549944, -0.796252,
               -0.230688, 0.889780, -0.010153, 0.397241, -0.276450, 0.405666, -0.465930, 0.131187, -0.600166,
               0.333834, -0.078219, 0.738370, -0.870169, -0.411658, -0.222175, -0.492421, 0.741454, 0.293757,
               -0.591244, 0.389112, -0.388324, 0.792346, 0.578552, 0.088459, -0.121858, -0.437241, -0.472535,
               -0.374835, 0.302427, 0.721264, 0.057485, 0.204085, -0.126575, 0.510325, 0.481492, -0.579888,
               -0.294110, -0.821360, 0.156404, -0.819717, -0.042466, 0.456573, 0.079884, 0.070190, 0.179002,
               0.220279, 0.970222, -0.088025, -0.299911, -0.234627, -0.820794, 0.912112, 0.243306, 0.317869,
               0.241336, 0.161841, -0.721568, 0.301135, -0.635993, -0.093900, -0.514731, -0.089673, 0.850964,
               -0.905087, 0.314604, -0.098397 ];

		 this.getIsSupported = function() {
		   // gl_fragcoord doesn"t work in IE11 with webgl 0.93 - see https://devtopia.esri.com/WebGIS/arcgis-cewebviewer-app/issues/33
		   // update 10-oct-2014: IE with WebGL 0.94 doesn"t fix the problem
		   var isWebGL093 = gl.getParameter(gl.VERSION).indexOf("WebGL 0.93") !== -1;
		   var isWebGL094 = gl.getParameter(gl.VERSION).indexOf("WebGL 0.94") !== -1;
		   return gl.getExtension("OES_standard_derivatives") && !(isWebGL093 || isWebGL094); // currently depth shader requires that, but could be removed!
		 };

    this.setEnableState = function(state) {
      Util.assert(state !== this.getEnableState());

      if (state) {
        this.enable();
      }
      else {
        this.disable();
      }
    };

    this.getEnableState = function() {
      return normalFBO !== undefined;
    };

    this.enable = function() {
      Util.assert(!this.getEnableState());

      Util.assert(this.getIsSupported());

      normalFBO = new GLFBO(gl.RGBA, gl.UNSIGNED_BYTE, true, gl.NEAREST, gl);
      depthFBO = new GLFBO(gl.RGBA, gl.UNSIGNED_BYTE, true, gl.NEAREST, gl);
      ssaoFBO = new GLFBO(gl.RGBA, gl.UNSIGNED_BYTE, false, gl.LINEAR, gl);
      blur0FBO = new GLFBO(gl.RGBA, gl.UNSIGNED_BYTE, false, gl.LINEAR, gl);
      blur1FBO = new GLFBO(gl.RGBA, gl.UNSIGNED_BYTE, false, gl.LINEAR, gl);

      var raw = "data:image/png;base64,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";

      // noise = textureRep.aquire("___ssao_noise_texture", raw);

      noise = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, noise);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.generateMipmap(gl.TEXTURE_2D);

      var noiseImage = new Image();
      noiseImage.src = raw;

      noiseImage.onload = function() {
        if (!noise) {
          return;
        }

        GLUtil.texImage2D(noiseImage, noise, gl, programRep, gl.getParameter(gl.VIEWPORT), true, false, false);
      };

      var quadVertices = new Float32Array(8);
      quadVertices[0] = -1.0; quadVertices[1] = -1.0;
      quadVertices[2] =  1.0; quadVertices[3] = -1.0;
      quadVertices[4] = -1.0; quadVertices[5] =  1.0;
      quadVertices[6] =  1.0; quadVertices[7] =  1.0;

      quadVBO = new GLVBO(quadVertices, VertexBufferLayout.Defaults.Pos2, gl);
    };

    this.disable = function() {
      Util.assert(this.getEnableState());

      quadVBO.dispose();
      //textureRep.release(noise);
      gl.deleteTexture(noise);
      blur1FBO.dispose();
      blur0FBO.dispose();
      ssaoFBO.dispose();
      depthFBO.dispose();
      normalFBO.dispose();

      quadVBO = undefined;
      noise = undefined;
      blur1FBO = undefined;
      blur0FBO = undefined;
      ssaoFBO = undefined;
      depthFBO = undefined;
      normalFBO = undefined;
    };

    this.setAttenuation = function(attenuation_) {
      attenuation = attenuation_;
    };
    this.getAttenuation = function() {
      return attenuation;
    };

    this.setRadius = function(radius_) {
      radius = radius_;
    };
    this.getRadius = function() {
      return radius;
    };


    this.setFilterRadius = function(filterRadius_) {
      filterRadius = Math.max(Math.round(filterRadius_), 1);
    };
    this.getFilterRadius = function() {
      return filterRadius;
    };

    this.setSamples = function(samples_) {
      samples = samples_;
    };
    this.getSamples = function() {
      return samples;
    };

    this.prepare0 = function(camera) {
      Util.assert(this.getEnableState());

      var viewport = camera.viewport;

      vec4.set(viewport, viewportToRestore);

      var width = Math.floor(viewport[2] / 2) * 2;
      var height = Math.floor(viewport[3] / 2) * 2;
      var width2 = width / BLUR_F;
      var height2 = height / BLUR_F;
      normalFBO.setSize(width, height);
      depthFBO.setSize(width, height);
      ssaoFBO.setSize(width, height);
      blur0FBO.setSize(width2, height2);
      blur1FBO.setSize(width2, height2);

      gl.viewport(0, 0, width, height);

      normalFBO.bind();

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      //var near = 1.0;
      //var far = 2500.0;
      //program.use();
      //program.uniform2f("nearFar", near, Math.max(far, 2500.0));
    };

    this.prepare1 = function() {
      Util.assert(this.getEnableState());

      depthFBO.bind();

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    };

    this.finish = function(camera, fbo) {
      Util.assert(this.getEnableState());

      //program.uniform4f(gl, "diffuseMat", 1.0f, 1.0f, 1.0f, 1.0f);
      //drawShadowPlane(gl, ctx);

      var width = ssaoFBO.getWidth();
      var height = ssaoFBO.getHeight();

      ssaoFBO.bind();

      // render ao term into ssao
      gl.viewport(0, 0, width, height);

      var ssaoProgram = programRep.get(samples <= 8 ? "ssao8" : (samples <= 16 ? "ssao16" : (samples <= 32 ? "ssao32" : "ssao64")));
      var blurHorizontalProgram = programRep.get("blurH");
      var blurVerticalProgram = programRep.get("blurV");

      ssaoProgram.use();
      ssaoProgram.uniform1i("rnm", 0);
      ssaoProgram.uniform1i("normalMap", 1);
      ssaoProgram.uniform1i("depthMap", 2);
      ssaoProgram.uniform1f("ssaoAtt", attenuation);
      ssaoProgram.uniform2f("rnmScale", width / noiseDim, height / noiseDim);

      tmpNearFar[0] = camera.near;
      tmpNearFar[1] = camera.far;
      ssaoProgram.uniform2fv("nearFar", tmpNearFar);

      var x = 2.0 * camera.near * Math.tan(0.5 * camera.fovY);

      ssaoProgram.uniform1f("radius", radius / x);

      ssaoProgram.uniform3fv("pSphere", samples <= 8 ? rndVectors8 : (samples <= 16 ? rndVectors16 : (samples <= 32 ? rndVectors32 : rndVectors64)));
      //ssaoProgram.uniform1i("samples", 8);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, noise);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, normalFBO.getTexture());
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, depthFBO.getTexture());

      quadVBO.bind();
      quadVBO.setPointers(ssaoProgram);
      quadVBO.getLayout().enableVertexAttribArrays(gl, ssaoProgram);  // NOTE setup only once ssao and blur program have the same vertex shader

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, quadVBO.getNum());

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE0);

      // blur horizontal from ssao to blur0
      blurHorizontalProgram.changeShaderDefines(1,["RADIUS "+filterRadius]);
      blurVerticalProgram.changeShaderDefines(1,["RADIUS "+filterRadius]);

      gl.viewport(0, 0, width / BLUR_F, height / BLUR_F);

      blur0FBO.bind();

      blurHorizontalProgram.use();
      blurHorizontalProgram.uniform1i("tex", 0);
      blurHorizontalProgram.uniform1f("blurSize", BLUR_F / width);

      gl.bindTexture(gl.TEXTURE_2D, ssaoFBO.getTexture());

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, quadVBO.getNum());

      // blur vertical from blur0 to blur1

      blur1FBO.bind();
      blurVerticalProgram.use();
      blurVerticalProgram.uniform1i("tex", 0);
      blurVerticalProgram.uniform1f("blurSize", BLUR_F / height);

      gl.bindTexture(gl.TEXTURE_2D, blur0FBO.getTexture());

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, quadVBO.getNum());

      quadVBO.getLayout().disableVertexAttribArrays(gl, ssaoProgram); // see NOTE above

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(viewportToRestore[0], viewportToRestore[1], viewportToRestore[2], viewportToRestore[3]);
    };


    this.setUniforms = function(program) {
      var state = this.getEnableState();

      program.use();

      // TODO HACK texture unit 6?
      gl.activeTexture(gl.TEXTURE6);
      gl.bindTexture(gl.TEXTURE_2D, state ? blur1FBO.getTexture() : null);
      gl.activeTexture(gl.TEXTURE0);

      program.uniform1i("ssaoTex", 6);
      
      if (state) {
        program.uniform4f("viewportPixelSz", viewportToRestore[0], viewportToRestore[1], 1.0 / ssaoFBO.getWidth(), 1.0 / ssaoFBO.getHeight());
      }
      else {
        program.uniform4f("viewportPixelSz", -1.0, -1.0, -1.0, -1.0);
      }
    };

    this.bindAll = function(programRep) {
      var programsUsingSSAO = programRep.getProgramsUsingUniform("viewportPixelSz");
      for (var i = 0; i < programsUsingSSAO.length; i++) {
        this.setUniforms(programsUsingSSAO[i]);
      }
    };

    var x = 0;
    var y = 0;
    var width = 512;
    var height = 512;

    var data = new Float32Array(4 * 2 * 2);
    data[0]  = x;         data[1]  = y;
    data[2]  = 0.0;       data[3]  = 0.0;
    data[4]  = x + width; data[5]  = y;
    data[6]  = 1.0;       data[7]  = 0.0;
    data[8]  = x;         data[9]  = y + height;
    data[10] = 0.0;       data[11] = 1.0;
    data[12] = x + width; data[13] = y + height;
    data[14] = 1.0;       data[15] = 1.0;

    var debugQuadVBO = new GLVBO(data, VertexBufferLayout.Defaults.Pos2Tex, gl);

    this.drawQuad = function(proj) {
      Util.assert(this.getEnableState());

      var program = programRep.get("showDepth");

      gl.disable(gl.DEPTH_TEST);

      program.use();
      program.uniformMatrix4fv("proj", proj);
      program.uniform1i("depthTex", 0);

      gl.bindTexture(gl.TEXTURE_2D, ssaoFBO.getTexture());

      debugQuadVBO.getLayout().enableVertexAttribArrays(gl, program);

      debugQuadVBO.bind();
      debugQuadVBO.setPointers(program);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, debugQuadVBO.getNum());

      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      debugQuadVBO.getLayout().disableVertexAttribArrays(gl, program);

      gl.useProgram(null);

      gl.enable(gl.DEPTH_TEST);
    };
  };

  SSAOHelper.loadShaders = function(snippets, shaderRep, programRep, gl) {
    Util.assert(snippets.samples === undefined);
    snippets.samples = "samplesUNDEF";
    snippets._parse(shaderXmlString);

    var vertexShaderShowDepth = new GLSLShader(gl.VERTEX_SHADER, snippets.vertexShaderShowDepth, gl);
    var fragmentShaderShowDepth = new GLSLShader(gl.FRAGMENT_SHADER, snippets.fragmentShaderShowDepth, gl);
    var programShowDepth = new GLSLProgram([vertexShaderShowDepth, fragmentShaderShowDepth], gl);


    var ssao = snippets.createFsSSAOSrc;
    var vsUVQuad = new GLSLShader(gl.VERTEX_SHADER, snippets.vsUVQuad, gl);
    var fsSSAO8 = new GLSLShader(gl.FRAGMENT_SHADER, ssao.replace("samplesUNDEF","8"), gl);
    var fsSSAO16 = new GLSLShader(gl.FRAGMENT_SHADER, ssao.replace("samplesUNDEF","16"), gl);
    var fsSSAO32 = new GLSLShader(gl.FRAGMENT_SHADER, ssao.replace("samplesUNDEF","32"), gl);
    var fsSSAO64 = new GLSLShader(gl.FRAGMENT_SHADER, ssao.replace("samplesUNDEF","64"), gl);
    var fsBlurH = new GLSLShader(gl.FRAGMENT_SHADER, snippets.fsBlurH, gl, ["RADIUS 3"]);
    var fsBlurV = new GLSLShader(gl.FRAGMENT_SHADER, snippets.fsBlurV, gl, ["RADIUS 3"]);
    var programSSAO8 = new GLSLProgram(new Array(vsUVQuad, fsSSAO8),gl);
    var programSSAO16 = new GLSLProgram(new Array(vsUVQuad, fsSSAO16), gl);
    var programSSAO32 = new GLSLProgram(new Array(vsUVQuad, fsSSAO32), gl);
    var programSSAO64 = new GLSLProgram(new Array(vsUVQuad, fsSSAO64), gl);
    var programBlurH = new GLSLProgram(new Array(vsUVQuad, fsBlurH), gl);
    var programBlurV = new GLSLProgram(new Array(vsUVQuad, fsBlurV), gl);

    programRep.add("showDepth", programShowDepth);
    programRep.add("ssao8", programSSAO8);
    programRep.add("ssao16", programSSAO16);
    programRep.add("ssao32", programSSAO32);
    programRep.add("ssao64", programSSAO64);
    programRep.add("blurH", programBlurH);
    programRep.add("blurV", programBlurV);
    delete snippets.samples;
  };

  return SSAOHelper;
});