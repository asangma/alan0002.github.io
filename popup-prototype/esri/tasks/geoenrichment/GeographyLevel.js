define([
    "../../core/declare"
], function (declare) {

    var GeographyLevel = declare("esri.tasks.geoenrichment.GeographyLevel", null, {
        // summary:
        //      Identifies a standard geography level in Geoenrichment data. Examples of standard geography levels are: ZIP codes in USA; provinces in Canada; districts in GB.
        //      Full list of standard geography levels in all countries can be obtained with 'GeoenrichmentTask.getStandardGeographyLevels' method.
        
        // layerID: String
        //      Layer ID. There are four values available across all countries: "Admin1", "Admin2", "Admin3" and "Admin4".
        //      Admin1 is whole country. Other levels depend on country. In US, Admin2 is States; Admin3 is Counties; Admin4 is ZIP codes.
        //      Other possible layer IDs can be discovered with 'GeoenrichmentTask.getStandardGeographyLevels'
        layerID: null,

        datasetID: null,

        // countryID: String
        //      Two-digit country code, for example "US"
        countryID: null,

        constructor: function (json) {
            if (json) {
                this.layerID = json.layer || json.layerID || null;
                this.datasetID = json.dataset || json.datasetID || null;
                this.countryID = json.sourceCountry || json.countryID || null;
            }
        },

        toJson: function () {
            var json = {};

            if (this.layerID) {
                json.layer = this.layerID;
            }
            if (this.datasetID) {
                json.dataset = this.datasetID;
            }
            if (this.countryID) {
                json.sourceCountry = this.countryID;
            }

            return json;
        }

    });

    GeographyLevel.fromJsonArray = function (jsonArray) {
        var result = [];
        if (!jsonArray) {
            return result;
        }
        for (var i = 0; i < jsonArray.length; i++) {
            var obj = jsonArray[i];
            if (!(obj instanceof GeographyLevel)) {
                obj = new GeographyLevel(obj);
            }
            result.push(obj);
        }
        return result;
    };

    GeographyLevel.toJsonArray = function (array) {
        if (!array || array.length === 0) {
            return null;
        }
        var result = [];
        for (var i = 0; i < array.length; i++) {
            result.push(array[i].toJson());
        }
        return result;
    };

    return GeographyLevel;

});