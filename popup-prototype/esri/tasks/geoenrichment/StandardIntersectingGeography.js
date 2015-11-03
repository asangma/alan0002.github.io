define([
    "../../core/declare",
    "./IntersectingGeography"
], function (declare, IntersectingGeography) {

    var StandardIntersectingGeography = declare("esri.tasks.geoenrichment.StandardIntersectingGeography", [IntersectingGeography], {

        geographyLayerID: null,

        constructor: function (json) {

            if (json) {
                this.geographyLayerID = json.geographyLayer || json.geographyLayerID || null;
            }

        },

        toJson: function () {
            var json = this.inherited(arguments);
            json.geographyType = "standard";
            json.geographyLayer = this.geographyLayerID;
            return json;
        }

    });

    return StandardIntersectingGeography;

});