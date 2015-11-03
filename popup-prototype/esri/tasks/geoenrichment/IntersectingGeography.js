define([
    "../../core/declare"
], function (declare) {

    var IntersectingGeography = declare("esri.tasks.geoenrichment.IntersectingGeography", null, {

        name: null,
        geometryType: "esriGeometryPoint",
        spatialRel: "esriSpatialRelIntersects",
        outFields: null,

        constructor: function (json) {

            if (json) {
                this.name = json.name || null;
                this.outFields = json.outFields || null;
                if (json.intersectionInfo) {
                    if (json.intersectionInfo.geometryType) {
                        this.geometryType = json.intersectionInfo.geometryType;
                    }
                    if (json.intersectionInfo.spatialRel) {
                        this.spatialRel = json.intersectionInfo.spatialRel;
                    }
                }
                else {
                    if (json.geometryType) {
                        this.geometryType = json.geometryType;
                    }
                    if (json.spatialRel) {
                        this.spatialRel = json.spatialRel;
                    }
                }
            }

        },

        toJson: function () {
            return {
                name: this.name,
                outFields: this.outFields,
                intersectionInfo: {
                    geometryType: this.geometryType,
                    spatialRel: this.spatialRel
                }
            };
        }

    });

    return IntersectingGeography;

});