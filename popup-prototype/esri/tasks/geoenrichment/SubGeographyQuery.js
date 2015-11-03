define([
    "../../core/declare",
    "./GeographyQueryBase"
], function (declare, GeographyQueryBase) {

    return declare("esri.tasks.geoenrichment.SubGeographyQuery", [GeographyQueryBase], {
        // summary:
        //      Represents StandardGeographyQuery parameters to search subgeographic areas that are within a parent geography. For example, you could return all the U.S. counties within a given U.S. state or you could return all the Canadian postal areas (FSAs) within a Census Metropolitan Areas (city).

        // filterGeographyLayerID: String
        //      Parent layer ID
        filterGeographyLayerID: null,

        // filterGeographyIDs: String[]
        //      Parent layer geographies IDs
        filterGeographyIDs: null,

        // filterGeographyWhere: String
        //      Parent layer search string. Syntax is similar to GeographyQuery.where
        filterGeographyWhere: null,

        // subGeographyLayerID: String
        //      Layer ID to return features from
        subGeographyLayerID: null,

        // subGeographyWhere: String
        //      Search string. Syntax is similar to GeographyQuery.where
        subGeographyWhere: null,

        constructor: function (json) {
            if (json) {
                this.filterGeographyLayerID = json.filterGeographyLayerID || json.geographyLayers;
                this.filterGeographyIDs = json.filterGeographyIDs || json.geographyIDs;
                this.filterGeographyWhere = json.filterGeographyWhere || json.geographyQuery;
                this.subGeographyLayerID = json.subGeographyLayerID || json.subGeographyLayer;
                this.subGeographyWhere = json.subGeographyWhere || json.subGeographyQuery;
            }
        },

        toJson: function () {
            var json = this.inherited(arguments);

            json.returnSubGeographyLayer = true;

            if (this.filterGeographyLayerID) {
                json.geographyLayers = this.filterGeographyLayerID;
            }
            if (this.filterGeographyIDs) {
                json.geographyIDs = this.filterGeographyIDs;
            }
            if (this.filterGeographyWhere) {
                json.geographyQuery = this.filterGeographyWhere;
            }
            if (this.subGeographyLayerID) {
                json.subGeographyLayer = this.subGeographyLayerID;
            }
            if (this.subGeographyWhere) {
                json.subGeographyQuery = this.subGeographyWhere;
            }

            return json;
        }

    });

});
