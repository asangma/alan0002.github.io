define([

    "./GeometryStudyArea",
    "./AddressStudyArea",
    "./StandardGeographyStudyArea"

], function (GeometryStudyArea, AddressStudyArea, StandardGeographyStudyArea) {

    var SAFJ = function(json) {
        // summary:
        //      Utility function to deserialize study area from JSON

        if (json.geometry) {
            return new GeometryStudyArea(json);
        } else if (json.address) {
          return new AddressStudyArea(json);
        } else if (json.layer) {
          return new StandardGeographyStudyArea(json);
        }
    };

    return SAFJ;

});
