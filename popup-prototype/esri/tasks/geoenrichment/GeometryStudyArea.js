define([

    "../../core/declare",
    "../../geometry/support/jsonUtils",
    "../../geometry/Geometry",
    "./StudyArea"

], function (declare, jsonUtils, Geometry, StudyArea) {

    return declare("esri.tasks.geoenrichment.GeometryStudyArea", [StudyArea], {
        // summary:
        //      Study area defined by a geometry

        // geometry: Geometry
        //      Input geometry. See 'options' for more information about how input geometries are process by Geoenrichment.
        geometry: null,

        constructor: function (json) {
            // summary:
            //      Creates a new GeometryStudyArea

            if (json) {

                if (json.geometry) {
                    if (json.geometry instanceof Geometry) {
                        this.geometry = json.geometry;
                    }
                    else {
                        this.geometry = jsonUtils.fromJson(json.geometry);
                    }
                }
            }
        },

        toJson: function () {
            var json = this.inherited(arguments);
            json.geometry = this.geometry.toJson();
            return json;
        },

        getGeomType: function () {
            return this.geometry.type;
        }

    });

});