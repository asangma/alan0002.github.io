define(
[
  "../core/declare",
  "dojo/_base/lang",

  "../request",

  "../tasks/Task",

  "./VEGeocodeResult"
],
  function(
  declare, lang,
  request,
  Task,
  VEGeocodeResult
) {

  var protocol = window.location.protocol;

  if (protocol === "file:") {
    protocol = "http:";
  }

  var VEGeocoder = declare(Task, {

    declaredClass: "esri.virtualearth.VEGeocoder",

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    // url
    //----------------------------------

    url: null,

    //----------------------------------
    // bingMapsKey
    //----------------------------------

    _bingMapsKeySetter: function(value){
      this.bingMapsKey = value;
    },

    //----------------------------------
    // culture
    //----------------------------------

    culture: "en-US",

    _cultureSetter: function(value) {
      this.culture = value || "en-US" ;
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._queue = [];
    },

    initialize: function() {
      if (!this.bingMapsKey) {
        throw new Error("BingMapsKey must be provided.");
      }
    },

    getDefaults: function() {
      return {
        url: protocol + "//serverapi.arcgisonline.com/veadaptor/production/services/geocode/geocode"
      };
    },

    //--------------------------------------------------------------------------
    //
    //  Public methods
    //
    //--------------------------------------------------------------------------

    addressToLocations: function(query) {
      if (!this.bingMapsKey) {
        console.debug("Server token not retrieved. Queing request to be executed after server token retrieved.");
        this._queue.push(arguments);
        return;
      }
      
      var _params = lang.mixin({}, this.parsedUrl.query, { query:query, token:this.bingMapsKey, culture:this.culture });

      return request({
        url: this.parsedUrl.path,
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleAddressToLocationsResponse);
    },

    _handleAddressToLocationsResponse: function(results) {
      return results.map(function(result) {
        return VEGeocodeResult.fromJSON(result);
      });
    }

  });

  return VEGeocoder;
});
