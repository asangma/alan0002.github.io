define(["./gl-matrix"], function (glMatrix) {
  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;

  var RenderGeometry = function RenderGeometry(data, boundingInfo, material, transformation, scale, castShadow, singleUse, name, uniqueName, idx, componentIdx) {
    // stored as public properties for efficiency reasons
    this.data = data;
    this.boundingInfo = boundingInfo;
    this.material = material;
    this.origin = null;
    this.center = vec3d.create();
    this.bsRadius = 0;
    this.transformation = null;
    if (transformation) {
      this.updateTransformation(transformation, scale);
    }
    this.castShadow = castShadow;
    this.singleUse = singleUse;
    this.name = name;
    this.uniqueName = uniqueName;
    this.idx = idx;
    this.canBeMerged = true;
    this.componentIdx = componentIdx;
    this.displayedIndexRange = undefined;
    this.instanceParameters = undefined;
  };

  RenderGeometry.prototype.updateTransformation = function(trafo, scale) {
    scale = scale || mat4d.maxScale(trafo);
    this.transformation = trafo;
    mat4d.multiplyVec3(trafo, this.boundingInfo.getCenter(), this.center);
    this.bsRadius = this.boundingInfo.getBSRadius() * scale;
  };

  return RenderGeometry;
});