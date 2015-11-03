define([

    "../../core/declare",
    "../../geometry/SpatialReference",
    "./StudyAreaOptions",
    "./studyAreaFromJson",
    "./studyAreaOptionsFromJson"

], function (declare, SpatialReference, StudyAreaOptions, studyAreaFromJson, studyAreaOptionsFromJson) {

    return declare("esri.tasks.geoenrichment.EnrichParametersBase", null, {

        // summary:
        //      Base class for parameters of GeoenrichmentTask.enrich and GeoenrichmentTask.createReport methods

        // studyAreaOptions: StudyAreaOptions
        //      Optional. Each input study area will be converted to one or more polygons according to these options. By default, 1-mile circle will be used for point-type study areas, 1-mile buffer will be used for lines, and polygons will be processed as is.
        //      One can override this behaviour by setting options to an instance of RingBuffer, DriveBuffer or IntersectingGeographies.
        //      These options will be applied to all study areas. Individual study areas can override this further with 'StudyArea.options' property.
        studyAreaOptions: null,

        // studyAreas: StudyArea
        //      Required. Defines input features to be enriched. Possible study area types are: GeometryStudyArea, StandardGeographyStudyArea and AddressStudyArea
        studyAreas: null,

        // countryID: String
        //      Optional. Two-digit country code, for example "CA". Defines country for all input study areas. By default, the country will be determined automatically. Specifying country explicitly provides an additional "performance hint" to the service.
        countryID: null,

        datasetID: null, //deprecated?

        constructor: function(json) {

            this.studyAreas = [];

            if (json) {

                if (json.studyAreas) {
                    var inSR;
                    if (json.inSR) {
                        inSR = json.inSR;
                    }
                    var studyAreas = json.studyAreas;
                    for (var i = 0; i < studyAreas.length; i++) {
                        var studyArea = studyAreaFromJson(studyAreas[i]);
                        if (inSR && studyArea.geometry) {
                            studyArea.geometry.setSpatialReference(new SpatialReference(inSR));
                        }
                        this.studyAreas.push(studyArea);
                    }
                }

                if (json.studyAreasOptions) {
                    this.studyAreaOptions = studyAreaOptionsFromJson(json.studyAreasOptions);
                } else if (json.studyAreaOptions) {
                    if (json.studyAreaOptions instanceof StudyAreaOptions) {
                        this.studyAreaOptions = json.studyAreaOptions;
                    }
                    else {
                        this.studyAreaOptions = studyAreaOptionsFromJson(json.studyAreaOptions);
                    }
                }

                var usedata = json.useData;
                if (usedata) {
                    if (usedata.sourceCountry) {
                        this.countryID = usedata.sourceCountry;
                    }
                    if (usedata.dataset) {
                        this.datasetID = usedata.dataset;
                    }
                }
                else {
                    if (json.countryID) {
                        this.countryID = json.countryID;
                    }
                    if (json.datasetID) {
                        this.datasetID = json.datasetID;
                    }
                }
            }
        },

        toJson: function() {
            var json = {};
            
            var studyAreas = [];
            for (var i = 0; i < this.studyAreas.length; i++) {
                var studyArea = this.studyAreas[i];
                studyAreas.push(studyArea.toJson());
            }
            //
            //TO DO: use inSR if all study areas are in the same spatial reference
            //
            //if (inSR) {
            //    json.inSR = inSR;
            //}
            if (studyAreas.length > 0) {
                json.studyAreas = studyAreas;
            }

            if (this.studyAreaOptions) {
                json.studyAreasOptions = this.studyAreaOptions.toJson();
            }

            if (this.countryID || this.datasetID) {
                var usedata = {};
                if (this.countryID) {
                    usedata.sourceCountry = this.countryID;
                }
                if (this.datasetID) {
                    usedata.dataset = this.datasetID;
                }
                json.useData = usedata;
            }

            return json;
        }

    });

});