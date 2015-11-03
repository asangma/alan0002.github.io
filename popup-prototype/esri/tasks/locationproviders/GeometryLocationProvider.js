define([
  "../../core/declare",
  "../../geometry/support/jsonUtils",
  "./LocationProviderClientBase"
], function(
  declare,
  geometryJsonUtils,
  LocationProviderClientBase
) {

  return declare("esri.tasks.locationproviders.GeometryLocationProvider", LocationProviderClientBase, {

    geometryField: null,

    getGeometry: function(feature) {
      var geomJson = feature.attributes[this.geometryField];

      if (geomJson) {
        try {
          if (typeof geomJson === "string") {
            geomJson = JSON.parse(geomJson);
          }

          var newSr;
          // need to check spatialReference before geometryJsonUtils.fromJson() as it will populate spatialReference if absent
          if (!geomJson.spatialReference) {
            newSr = this.inSpatialReference;
          }

          var geometry = geometryJsonUtils.fromJson(geomJson);
          if (geometry && geometryJsonUtils.getJsonType(geometry) === this.geometryType) {
            if (newSr) {
              geometry.setSpatialReference(newSr);
            }

            return geometry;
          }
        } catch (e) {
          // TODO ... warning maybe
        }
      }
    }
  });
});
