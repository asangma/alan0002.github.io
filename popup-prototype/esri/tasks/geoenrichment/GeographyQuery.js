define([
    "../../core/declare",
    "./GeographyQueryBase"
], function (declare, GeographyQueryBase) {

    return declare("esri.tasks.geoenrichment.GeographyQuery", [GeographyQueryBase], {
        // summary:
        //      Represents StandardGeographyQuery parameters to search for geographies by ID or Name

        // geographyLayerIDs: String[]
        //      Array geography layer IDs. Available layer IDs can be discovered with 'GeoenrichmentTask.getStandardGeographyLevels' method.
        geographyLayerIDs: null,

        // geographyIDs: String[]
        //      Array of geography IDs. You can use this parameter to return attributes and/or geometry for standard geographic areas for administrative areas where you already know the ID, for example, if you know the Federal Information Processing Standard (FIPS) Codes for a U.S. state or county; or, in Canada, to return the geometry and attributes for a Forward Sortation Area (FSA).
        geographyIDs: null,

        // where: String
        //      Query string (where clause). Use this parameter to query and find standard geography features that meet an input term, for example, for a list of all the U.S. counties that contain the word "orange".
        //      Optionally, you can specify to search by ID or by Name, for example:
        //      ID:06069
        //      NAME:"Orange County"
        where: null,

        constructor: function (json) {
            if (json) {
                this.geographyLayerIDs = json.geographyLayerIDs || json.geographyLayers.split(";");
                this.geographyIDs = json.geographyIDs;
                this.where = json.where || json.geographyQuery;
            }
        },

        toJson: function () {
            var json = this.inherited(arguments);

            if (this.geographyLayerIDs) {
                json.geographyLayers = this.geographyLayerIDs.join(";");
            }
            if (this.geographyIDs) {
                json.geographyIDs = this.geographyIDs;
            }
            if (this.where) {
                json.geographyQuery = this.where;
            }

            return json;
        }

    });

});
