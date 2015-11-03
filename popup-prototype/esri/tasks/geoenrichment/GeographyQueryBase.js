define([
    "../../core/declare",
    "../../geometry/SpatialReference"
], function (declare, SpatialReference) {

    return declare("esri.tasks.geoenrichment.GeographyQueryBase", null, {

        // countryID: String
        //      Two-digit country code, for example "US"
        countryID: null,

        datasetID: null,

        // outSR: SpatialReference
        //      Determines spatial reference for output geometry if returnGeometry is set to true.
        outSR: null,

        // returnGeometry: Boolean
        //      Determines whether response will also include geometries
        returnGeometry: false,

        // returnCentroids: Boolean
        //      Use this parameter to return all the geometries as points. For example, you could return all U.S. ZIP Code centroids (points) rather than providing the boundaries.
        returnCentroids: false,

        // generalizationLevel: Number
        //      Optional integer that specifies the level of generalization or detail in the area representations of the administrative boundary or standard geographic data layers. Values must be whole integers from 0 through 6, where 0 is most detailed and 6 is most generalized. Default is 0.
        generalizationLevel: null,

        useFuzzySearch: false,

        //featureLimit: Number
        //      Optional integer value where you can limit the number of features that are returned from the geographyQuery. Default is 1000.
        featureLimit: null,

        constructor: function (json) {
            if (json) {
                this.countryID = json.countryID || json.sourceCountry;
                this.datasetID = json.datasetID || json.optionalCountryDataset;
                if (json.outSR) {
                    this.outSR =  new SpatialReference(json.outSR);
                }
                this.returnGeometry = !!json.returnGeometry;
                this.returnCentroids = !!json.returnCentroids;
                this.generalizationLevel = json.generalizationLevel;
                this.useFuzzySearch = !!json.useFuzzySearch;
                this.featureLimit = json.featureLimit;
            }
        },

        toJson: function () {
            var json = {};

            if (this.countryID) {
                json.sourceCountry = this.countryID;
            }
            if (this.datasetID) {
                json.optionalCountryDataset = this.datasetID;
            }
            if (this.outSR) {
                json.outSR = this.outSR.toJson();
            }
            if (this.returnGeometry) {
                json.returnGeometry = this.returnGeometry;
            }
            if (this.returnCentroids) {
                json.returnCentroids = this.returnCentroids;
            }
            if (this.generalizationLevel) {
                json.generalizationLevel = this.generalizationLevel;
            }
            if (this.useFuzzySearch) {
                json.useFuzzySearch = this.useFuzzySearch;
            }
            if (this.featureLimit) {
                json.featureLimit = this.featureLimit;
            }

            return json;
        }

    });

});