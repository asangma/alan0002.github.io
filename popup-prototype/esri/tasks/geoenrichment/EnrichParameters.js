define([

    "../../core/declare",
    "../../geometry/SpatialReference",
    "./EnrichParametersBase",
    "./StandardIntersectingGeography"

], function (declare, SpatialReference, EnrichParametersBase, StandardIntersectingGeography) {

    return declare("esri.tasks.geoenrichment.EnrichParameters", [EnrichParametersBase], {
        // summary:
        //      Represents GeoenrichmentTask.enrich parameters
        
        // variables: String[]
        //      An array of variables to calculate. Each variable should be in format of "<data_collection_id>.<variable_id>", for example: "KeyGlobalFacts.TOTPOP".
        //      Asterisk can be used to request all variables from a data collection, for example: "KeyGlobalFacts.*" 
        //      Full list of data collections and variables can be obtained using 'GeoenrichmentTask.getDataCollections' method or online here: http://la.arcgis.com/databrowser.
        variables: null,

        // returnGeometry: Boolean
        //      Determines whether response will also include actual study area geometry. For example, if input study area is a line, the response will inlude buffer polygon built around the line. Defaults to false.
        returnGeometry: false,

        // outSR: SpatialReference
        //      Determines spatial reference for output geometry if returnGeometry is set to true.
        outSR: null,

        intersectingGeographies: null,

        // forStorage: Boolean
        //      The price for using the "Enrich" method varies according to whether the data returned is being persisted, i.e. being stored, or whether it is merely being used in an interactive context and is discarded after being viewed. If the data is being stored, the terms of use for the GeoEnrichment service require that you specify the "forStorage" parameter to true.
        forStorage: true,

        constructor: function(json) {
            this.variables = [];

            if (json) {
                this.variables = json.analysisVariables || json.variables || null;
                if (json.returnGeometry) {
                    this.returnGeometry = true;
                }
                if (json.outSR) {
                    this.outSR = new SpatialReference(json.outSR);
                }
                if (json.forStorage) {
                    this.forStorage = json.forStorage;
                }
                if (json.intersectingGeographies) {
                    this.intersectingGeographies = [];
                    for (var i = 0; i < json.intersectingGeographies.length; i++) {
                        var intGeo = json.intersectingGeographies[i];
                        if (intGeo.geographyType == "standard") {
                            this.intersectingGeographies.push(new StandardIntersectingGeography(intGeo));
                        }
                        else if (intGeo.geographyType == "external") {
                            //
                            //TO DO: contruct "external" intersecting geos here
                            //
                            throw new Error("Not implemented");
                        }
                    }
                }
            }
        },

        toJson: function () {
            var json = this.inherited(arguments);

            json.analysisVariables = this.variables;
            if (this.returnGeometry) {
                json.returnGeometry = true;
            }
            if (this.outSR) {
                json.outSR = this.outSR.toJson();
            }
            if (!this.forStorage) {
                json.forStorage = false;
            }
            if (this.intersectingGeographies) {
                json.intersectingGeographies = [];
                for (var i = 0; i < this.intersectingGeographies.length; i++) {
                    json.intersectingGeographies.push(this.intersectingGeographies[i].toJson());
                }
            }

            return json;
        }

    });

});