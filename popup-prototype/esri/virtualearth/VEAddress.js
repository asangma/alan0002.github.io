define(
[
  "../core/JSONSupport"
],
function(
  JSONSupport
) {

  var VEAddress = JSONSupport.createSubclass({

    declaredClass: "esri.virtualearth.VEAddress",

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    // addressLine
    //----------------------------------

    addressLine: null,

    //----------------------------------
    // adminDistrict
    //----------------------------------

    adminDistrict: null,

    //----------------------------------
    // countryRegion
    //----------------------------------

    countryRegion: null,

    //----------------------------------
    // district
    //----------------------------------

    district: null,

    //----------------------------------
    // formattedAddress
    //----------------------------------

    formattedAddress:null,

    //----------------------------------
    // locality
    //----------------------------------

    locality: null,

    //----------------------------------
    // postalCode
    //----------------------------------

    postalCode: null,

    //----------------------------------
    // postalTown
    //----------------------------------

    postalTown: null

  });

  return VEAddress;
});
