define([
    "../../core/declare",
    "dojo/_base/lang",
    "./taskHelper",
    "../support/FeatureSet",
    "./GeographyQueryBase",
    "./GeographyQuery",
    "./BatchGeographyQuery",
    "./SubGeographyQuery"
], function (declare, lang, taskHelper, FeatureSet, GeographyQueryBase, GeographyQuery, BatchGeographyQuery, SubGeographyQuery) {

    return declare("esri.tasks.geoenrichment.StandardGeographyQueryTask", null, {
        // summary:
        //      Geoenrichment helper task to find FIPS (standard geography ID) for a geographic name. For example, you can use this service to find the FIPS for the county of San Diego which is 06073. You can then use this FIPS ID within the Geoenrichment service study area definition to get geometry and optional demographic data for the county.

        constructor: function (url) {
            // summary:
            //      Creates a new instance of StandardGeographyQuery class

            this.url = url || location.protocol + "//geoenrich.arcgis.com/arcgis/rest/services/World/GeoenrichmentServer";
        },

        execute: function(params) {
            // summary:
            //      Executes the task
            // params: GeographyQueryBase
            //      See GeographyQuery or SubGeographyQuery classes for more details about available parameters.
            // returns: Promise

            if (!(params instanceof GeographyQueryBase)) {
                if (params.returnSubGeographyLayer) {
                    params = new SubGeographyQuery(params);
                }
                else if (params.geographyQueries || lang.isArray(params.where)) {
                    params = new BatchGeographyQuery(params);
                }
                else {
                    params = new GeographyQuery(params);
                }
            }

            var isBatch = params instanceof BatchGeographyQuery;

            return taskHelper.invokeMethod(this, isBatch ? "/StandardGeographiesBatchQuery/execute" : "/StandardGeographyQuery/execute",

                function createParams() {
                    return taskHelper.jsonToRest(params.toJson());
                },

                function readResponse(response) {
                    if (!response.results ||
                        response.results.length < 1 ||
                        !response.results[0].value) {

                        taskHelper.throwEmptyResponse();
                    }
                    
                    return {
                        featureSet: new FeatureSet(response.results[0].value),
                        messages: response.messages
                    };
                },

                "onExecuteComplete", "onError");

        },

        onExecuteComplete: function (result) { },
        onError: function (error) { }
    });

});
