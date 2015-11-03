define([
  "./GLVBO",
  "../materials/internal/MaterialUtil"
], function(
  GLVBO,
  MaterialUtil
) {
  function GeometryRenderer(geometryData, layout, fillInterleaved, gl) {
    var faces = geometryData.faces;
    var count = faces.indices[faces.positionKey].length;
    var buffer = new Float32Array(count * layout.getStride());


    this.fillInterleaved = !fillInterleaved?MaterialUtil.fillInterleaved:fillInterleaved;
    this.fillInterleaved(geometryData,
                                 undefined,
                                 undefined,
                                 null,
                                 layout,
                                 buffer,
                                 0);

    var vbo = new GLVBO(buffer, layout, gl);

    this.drawMode = gl.TRIANGLES;

    this.enablePointRendering = function(state){
      this.drawMode = state? gl.POINTS:gl.TRIANGLES;
    };

    this.render = function(program) {
      vbo.bind();
      vbo.setPointers(program);

      layout.enableVertexAttribArrays(gl, program, false);

      gl.drawArrays(this.drawMode, 0, count, 0);

      layout.disableVertexAttribArrays(gl, program, false);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
  }

  return GeometryRenderer;
});
