define([

    "../../core/declare",
    "./StudyArea"

], function (declare, StudyArea) {

    return declare("esri.tasks.geoenrichment.AddressStudyArea", [StudyArea], {

        // summary:
        //      Study area defined by address

        // address: Object
        //      Object with address fields. Examples:
        //      { text: "380 New York St. Redlands, CA 92373" }
        //      { Address: "380 New York St.", Admin1: "Redlands", Admin2: "CA", Postal: "92373", CountryCode: "USA" }
        //      { text: "12 Concorde Place Toronto ON M3C 3R8", sourceCountry: "Canada" }
        address: null,

        constructor: function(json) {
            // summary:
            //      Creates a new AddressStudyArea

            if (json) {
                if (json.address) {
                    this.address = json.address;
                }
            }
        },

        toJson: function () {
            var json = this.inherited(arguments);
            json.address = this.address;
            return json;
        },

        getGeomType: function () {
            return "point";
        }

    });

});