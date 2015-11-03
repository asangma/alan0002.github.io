/* jshint bitwise: false, forin: false */
define([
  "./TileBase",
  "./TileGeometryFactory",
  "./TerrainConst",
  "../support/ObjectPool",
  "../support/mathUtils",
  "../lib/glMatrix"
], function(TileBase, TileGeometryFactory, TerrainConst, ObjectPool, mathUtils, glMatrix) {
  // imports from global namespace (to pacify JSHint)
  var vec3d = glMatrix.vec3d;

  // const variables
  var ENGINE_UP = vec3d.createFrom(0, 0, 1);

  var PlanarTile = function(lij, parentTile, parentSurface) {
    TileBase.call(this);

    this.tileUp = ENGINE_UP;

    if (lij !== undefined) {
      this.init(lij, parentTile, parentSurface);
    }
  };

  PlanarTile.prototype = new TileBase();
  PlanarTile.prototype.constructor = PlanarTile;

  PlanarTile.prototype.init = function(lij, parentTile, parentSurface) {
    TileBase.prototype.init.call(this, lij, parentTile, parentSurface);

    var level = lij[0], i = lij[1], j = lij[2];
    parentSurface.tilingScheme.getExtent(level, i, j, this.extent, this.extentWGS84Rad);

    this.edgeLen = this.extent[2] - this.extent[0];

    this.centerAtSeaLevel[0] = mathUtils.lerp(this.extent[0], this.extent[2], 0.5);
    this.centerAtSeaLevel[1] = mathUtils.lerp(this.extent[1], this.extent[3], 0.5);
    this.centerAtSeaLevel[2] = 0;

    this.updateRadiusAndCenter();
  };

  PlanarTile.prototype.isVisible = function(planes) {
    if (!this.intersectsClippingArea) {
      return false;
    }

    var loX = this.extent[0];
    var loY = this.extent[1];
    var loZ = this.elevationBounds[0];
    var hiX = this.extent[2];
    var hiY = this.extent[3];
    var hiZ = this.elevationBounds[1];
    // AABB-frustum intersection test, see "Detecting intersection of a Rectangular Solid and a Convex Polyhedron"
    // by Ned Greene and "Shaft Culling for Efficient Ray-Traced Radiosity" by Haines and Wallace for explanation.
    // Essentially, only the closest point of the AABB is tested against the plane
    if (planes[0][0] * ((planes[0][0] > 0) ? loX : hiX) +
        planes[0][1] * ((planes[0][1] > 0) ? loY : hiY) +
        planes[0][2] * ((planes[0][2] > 0) ? loZ : hiZ) + planes[0][3] > 0) {
      return false;
    }
    if (planes[1][0] * ((planes[1][0] > 0) ? loX : hiX) +
        planes[1][1] * ((planes[1][1] > 0) ? loY : hiY) +
        planes[1][2] * ((planes[1][2] > 0) ? loZ : hiZ) + planes[1][3] > 0) {
      return false;
    }
    if (planes[2][0] * ((planes[2][0] > 0) ? loX : hiX) +
        planes[2][1] * ((planes[2][1] > 0) ? loY : hiY) +
        planes[2][2] * ((planes[2][2] > 0) ? loZ : hiZ) + planes[2][3] > 0) {
      return false;
    }
    if (planes[3][0] * ((planes[3][0] > 0) ? loX : hiX) +
        planes[3][1] * ((planes[3][1] > 0) ? loY : hiY) +
        planes[3][2] * ((planes[3][2] > 0) ? loZ : hiZ) + planes[3][3] > 0) {
      return false;
    }
    if (planes[4][0] * ((planes[4][0] > 0) ? loX : hiX) +
        planes[4][1] * ((planes[4][1] > 0) ? loY : hiY) +
        planes[4][2] * ((planes[4][2] > 0) ? loZ : hiZ) + planes[4][3] > 0) {
      return false;
    }
    if (planes[5][0] * ((planes[5][0] > 0) ? loX : hiX) +
        planes[5][1] * ((planes[5][1] > 0) ? loY : hiY) +
        planes[5][2] * ((planes[5][2] > 0) ? loZ : hiZ) + planes[5][3] > 0) {
      return false;
    }
    return true;
  };

  PlanarTile.prototype._numSubdivisionsAtLevel = [2, 2, 2, 2, 2, 2, 2, 2];

  PlanarTile.prototype.createGeometry = function(state, localOrigin, wireframe) {
    state.needsUpdate = false;

    return TileGeometryFactory.createPlanarGlobeTile(state.numVertsPerRow, this.extent,
      state.samplerData, localOrigin, wireframe, state.clippingArea);
  };

  PlanarTile.prototype.elevationStartsAtLevel = TerrainConst.Planar.ELEVATION_STARTS_AT_LEVEL;

  ObjectPool.on(PlanarTile, 400);
  return PlanarTile;
});
