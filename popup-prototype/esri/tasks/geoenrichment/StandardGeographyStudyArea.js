define([

    "../../core/declare",
    "./StudyArea"

], function (declare, StudyArea) {

    return declare("esri.tasks.geoenrichment.StandardGeographyStudyArea", [StudyArea], {
        // summary:
        //      Study area defined by 

        // countryID: String
        //      Optional. Two-digit country code, for example "US". By default, the country will be determined automatically. Specifying country explicitly provides an additional "performance hint" to the service.
        countryID: null,

        // geographyLayerID: String
        //      Layer ID. There are four values available across all countries: "Admin1", "Admin2", "Admin3" and "Admin4".
        //      Admin1 is whole country. Other levels depend on country. In US, Admin2 is States; Admin3 is Counties; Admin4 is ZIP codes.
        //      Other possible layer IDs can be discovered with 'GeoenrichmentTask.getStandardGeographyLevels'
        geographyLayerID: null,

        // ids: String[]
        //      Standard geography ID, for example, Federal Information Processing Standard (FIPS) Codes for a U.S. state or county; or, in Canada, a Forward Sortation Area (FSA). You can use StandardGeographyQuery to search for those IDs.
        ids: null,

        constructor: function(json) {
            // summary:
            //      Creates a new StandardGeographyStudyArea

            if (json) {
                var countryID = json.sourceCountry || json.countryID;
                if (countryID) {
                    this.countryID = countryID;
                }

                var layer = json.layer || json.geographyLayerID;
                if (layer) {
                    this.geographyLayerID = layer;
                }

                if (json.ids) {
                    this.ids = json.ids;
                }
            }
        },

        toJson: function () {
            var json = this.inherited(arguments);
            if (this.countryID) {
                json.sourceCountry = this.countryID;
            }
            if (this.geographyLayerID) {
                json.layer = this.geographyLayerID;
            }
            if (this.ids) {
                json.ids = this.ids;
            }
            return json;
        },

        getGeomType: function () {
            return "polygon";
        }

    });

});