define([
	"../support/ObjectPool",
	"../lib/glMatrix"
], function(ObjectPool, glMatrix) {
	var vec2d = glMatrix.vec2d;

	function UpsampleInfo(tile, offsetX, offsetY, scale) {
		this.offset = vec2d.create();
		this.scale = 0;
		this.tile = null;

		if (tile !== undefined) {
			this.init(tile, offsetX, offsetY, scale);
		}
	}

	UpsampleInfo.prototype.init = function(tile, offsetX, offsetY, scale) {
		this.tile = tile;

		this.offset[0] = offsetX;
		this.offset[1] = offsetY;

		this.scale = scale;
	};

	UpsampleInfo.Pool = new ObjectPool(400, UpsampleInfo);
	return UpsampleInfo;
});