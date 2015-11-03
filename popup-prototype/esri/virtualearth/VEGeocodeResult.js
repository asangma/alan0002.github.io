define(
[
  "../core/JSONSupport",

  "../geometry/Extent",
  "../geometry/Point",

  "./VEAddress"
],
function(
  JSONSupport,
  Extent, Point,
  VEAddress
) {
    
  var VEGeocodeResult = JSONSupport.createSubclass({

    declaredClass: "esri.virtualearth.VEGeocodeResult",

    classMetadata: {
      reader: {
        exclude: [
          "locationArray"
        ],
        add: [
          "location",
          "calculationMethod"
        ]
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Public properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    // address
    //----------------------------------

    address: null,

    _addressReader: function(value) {
      return VEAddress.fromJSON(value);
    },

    //----------------------------------
    // bestView
    //----------------------------------

    bestView: null,

    _bestView: function(value) {
      return Extent.fromJSON(value);
    },

    //----------------------------------
    // calculationMethod
    //----------------------------------

    calculationMethod: null,

    _calculationMethodReader: function(value, source) {
      var locationArray = source.locationArray;

      if(locationArray) {
        return locationArray[0].calculationMethod;
      }
    },

    //----------------------------------
    // confidence
    //----------------------------------

    confidence: null,

    //----------------------------------
    // displayName
    //----------------------------------

    displayName: null,

    //----------------------------------
    // entityType
    //----------------------------------

    entityType: null,

    //----------------------------------
    // location
    //----------------------------------

    location: null,

    _locationReader: function(value, source) {
      var locationArray = source.locationArray;

      if (locationArray) {
        return Point.fromJSON(locationArray[0]);
      }
    },

    //----------------------------------
    // matchCodes
    //----------------------------------

    matchCodes: null

  });

  return VEGeocodeResult;
});
