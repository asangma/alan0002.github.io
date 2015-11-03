define([

    "../../core/declare",
    "dojo/_base/lang",
    "./StudyAreaOptions",
    "./studyAreaOptionsFromJson",
    "./GeographyLevel"

], function (declare, lang, StudyAreaOptions, studyAreaOptionsFromJson, GeographyLevel) {

    return declare("esri.tasks.geoenrichment.StudyArea", null, {
        // summary:
        //      Represents a study area. This class is abstract, see GeometryStudyArea, StandardGeographyStudyArea and AddressStudyArea instead.

        // attributes: Object
        //      Additional attributes that will be appended to output features. Can be used to assign identifiers and match output feature with input study areas.
        attributes: null,

        // options: StudyAreaOptions
        //      Optional. The study area will be converted to one or more polygons according to these options. By default, 1-mile circle will be used for point-type study areas, 1-mile buffer will be used for lines, and polygons will be processed as is.
        //      One can override this behaviour by setting options to an instance of RingBuffer, DriveBuffer or IntersectingGeographies.
        //      These options will be applied to this particular study area which will override global EnrichParametersBase.studyAreaOptions property.
        options: null,

        // returnGeometry: Boolean
        //      Determines whether response will also include actual study area geometry. For example, if input study area is a line, the response will inlude buffer polygon built around the line.
        //      Defaults to false. Settings EnrichParameters.returnGeometry to true will take precedence over this value and geometry will be returned anyway.
        returnGeometry: false,

        // comparisonGeographyLevels: GeographyLevel[]
        //      Optional. Additional features will be generated for this study area for specified geography levels. For example, this property can be used to query a point, containing ZIP code, county and state - all in one study area.
        comparisonGeographyLevels: null,

        constructor: function(json) {

            if (json) {
                if (json.attributes) {
                    this.attributes = json.attributes;
                }

                if (json.areaType) {
                    this.options = studyAreaOptionsFromJson(json);
                }
                else if (json.options instanceof StudyAreaOptions) {
                    this.options = json.options;
                }

                if (json.returnGeometry) {
                    this.returnGeometry = true;
                }

                var comparisonLevels = json.comparisonGeographyLevels || json.comparisonLevels;
                this.comparisonGeographyLevels = GeographyLevel.fromJsonArray(comparisonLevels);
            }
            if (!this.comparisonGeographyLevels) {
                this.comparisonGeographyLevels = [];
            }
        },

        toJson: function() {
            // summary:
            //      Converts this study area to serializable JSON

            var json = {};

            if (this.attributes) {
                json.attributes = this.attributes;
            }
            if (this.options) {
                lang.mixin(json, this.options.toJson());
            }
            if (this.returnGeometry) {
                json.returnGeometry = true;
            }

            var comparisonLevels = GeographyLevel.toJsonArray(this.comparisonGeographyLevels);
            if (comparisonLevels) {
                json.comparisonLevels = comparisonLevels;
            }
            
            return json;

        },

        getGeomType: function () {
            throw "Not implemented"; //abstract
        }

    });

});