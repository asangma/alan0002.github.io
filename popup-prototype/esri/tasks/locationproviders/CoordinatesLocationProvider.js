define([
  "../../core/declare",
  "../../geometry/Point",
  "./LocationProviderClientBase"
], function(
  declare,
  Point,
  LocationProviderClientBase
) {

  return declare("esri.tasks.locationproviders.CoordinatesLocationProvider", LocationProviderClientBase, {

    xField: null,

    yField: null,

    geometryType: "esriGeometryPoint",

    getGeometry: function(feature) {
      // TODO: handle coordinates in different notations?:
      //      - decimal degrees (DD)
      //      - decimal minutes (DDM)
      //      - degrees-minutes-seconds (DMS)
      //      - Global Area Reference System (GARS)
      //      - World Geographic Reference System (GEOREF)
      //      - Universal Transverse Mercator (UTM)
      //      - United States National Grid (USNG)
      //      - Military Grid Reference System (MGRS)
      //
      // probably requires an extra property on the provider (e.g. coordinateFormat)
      // how to handle single field coordinate systems, only use xField? (that's how the "Convert Coordinate Notation" tool in ArcGIS works)

      var x = parseFloat(feature.attributes[this.xField]),
        y = parseFloat(feature.attributes[this.yField]);

      if (!isNaN(x) && !isNaN(y)) {
        return new Point(x, y, this.inSpatialReference);
      }
    }
  });
});
