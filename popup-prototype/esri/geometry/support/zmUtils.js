define([
], function() {
    function updateSupportFromPoint(geom, point, assumeZ) {
      var hasZ = geom.hasZ;
      var hasM = geom.hasM;

      if (!Array.isArray(point)) {
        hasZ = !(!hasZ && point.hasZ && (!hasM || point.hasM));
        hasM = !(!hasM && point.hasM && (!hasZ || point.hasZ));
      } else if (point.length === 4 && !hasM && !hasZ) {
        // We can only determine for both z and m here, not for either z
        // or m since they would both be arrays of size 3.
        hasM = true;
        hasZ = true;
      } else if (point.length === 3 && assumeZ && !hasM) {
        hasZ = true;
        hasM = false;
      } else if (point.length === 3 && hasM && hasZ) {
        // We can't determine z or m, we have to disable both to make sure
        // we stay consistent
        hasM = false;
        hasZ = false;
      }
      
      geom.hasZ = hasZ;
      geom.hasM = hasM;
    }

    return {
      updateSupportFromPoint: updateSupportFromPoint
    };
});