define([
    "../../core/declare",
    "dojo/_base/array",
    "dojo/dom-construct",
    "./taskHelper",
    "../support/FeatureSet",
    "./EnrichParameters",
    "./ReportParameters",
    "../../identity/IdentityManager",
    "../../geometry/Point",
    "../../geometry/Polygon",
    "../../geometry/Polyline",
    "dojo/i18n!../../nls/jsapi"
], function(declare, array, domConstruct, taskHelper, FeatureSet, EnrichParameters, ReportParameters, IdentityManager, Point, Polygon, Polyline, nls) {
    nls = nls.geoenrichment.task.GeoenrichmentTask;

    //
    //Represents an error that is intended to be shown to user (it is known for sure that such error objects have user-friendly messages)
    //
    function UserError(message) {
        this.name = "UserError";
        this.message = (message || "");
    }
    UserError.prototype = Error.prototype;

    function getCountryName(task, countryID) {

        return task.getAvailableCountries().then(function(countries) {

            for (var i = 0; i < countries.length; i++) {
                if (countries[i].id == countryID) {
                    return countries[i].name;
                }
            }

        });
    }

    function getCenter(geometry) {
        var extent = geometry.getExtent();
        return new Point((extent.xmin + extent.xmax) / 2, (extent.ymin + extent.ymax) / 2, extent.spatialReference);
    }

    return declare("esri.tasks.geoenrichment.GeoenrichmentTask", null, {
        // summary:
        //      Executes Geoenrichment methods

        token: null,
        url: null,

        constructor: function(url) {
            // summary:
            //      Creates a new instance of GeoenrichmentTask class

            this.url = url || location.protocol + "//geoenrich.arcgis.com/arcgis/rest/services/World/GeoenrichmentServer";
        },

        enrich: function(params) {
            // summary:
            //      Calculates contextual data such as demographic characteristics about input study areas
            // params: EnrichParameters
            //      Parameters for the enrich operation. See EnrichParameters class for full list of available parameters.
            // returns: Promise
            //
            //|     var task = new GeoenrichmentTask();
            //|     task.enrich({
            //|         studyAreas: [{ geometry: { x: -117.1956, y: 34.0572 } }],
            //|         studyAreaOptions: new DriveBuffer({ radii: [5, 10, 15] /* minutes by default */ }),
            //|         variables: ["Wealth.MEDNW_CY", "KeyUSFacts.*"]
            //|     }).then(function(result) {
            //|         /* process result here */
            //|     }, function(error) {
            //|         /* handle error here */
            //|     });

            return taskHelper.invokeMethod(this, "/Geoenrichment/enrich",

                function createParams() {
                    if (!(params instanceof EnrichParameters)) {
                        params = new EnrichParameters(params);
                    }

                    return taskHelper.jsonToRest(params.toJson());
                },

                function readResponse(response) {

                    if (!response.results ||
                        response.results.length < 1 ||
                        !response.results[0].value ||
                        !response.results[0].value.FeatureSet ||
                        response.results[0].value.FeatureSet.length < 1) {

                        taskHelper.throwEmptyResponse();
                    }

                    var result = {
                        featureSets: [],
                        messages: response.messages
                    };

                    var featureSets = response.results[0].value.FeatureSet;
                    for (var i = 0; i < featureSets.length; i++) {
                        result.featureSets.push(new FeatureSet(featureSets[i]));
                    }

                    return result;
                },

                "onEnrichComplete", "onError");
        },

        getAvailableCountries: function() {
            // summary:
            //      Gets the list of many countries Geoenrichment has data for
            // returns: Promise

            return taskHelper.invokeMethod(this, "/Geoenrichment/Countries",

                null,

                function readResponse(response) {
                    if (response.error) {
                        throw response.error;
                    }
                    var countries = response.countries;
                    for (var i = 0; i < countries.length; i++) {
                        var datasetIDs = countries[i].datasets;
                        delete countries[i].datasets;
                        countries[i].datasetIDs = datasetIDs;
                    }
                    return countries;
                },

                "onGetAvailableCountriesComplete", "onError");
        },

        getDataCollections: function(countryID, dataCollectionID, outFields) {
            // summary:
            //      Gets the list of available data collections. Each data collection consists of a set of variables.
            // countryID: String
            //      Optional. Two-digit code of country of interest. If not provided, the method will only return those data collections that span the whole world.
            // dataCollectionID: String
            //      Optional. Useful to get information about one specific data collection.
            // outFields: String[]
            //      Optional. List of metadata fields to return for each variable. Useful to optimize response size. If not provided, the method will return all metadata fields.
            // returns: Promise
            //
            //|     var task = new GeoenrichmentTask();
            //|     task.getDataCollections("GB").then(function(dataCollections) {
            //|         /* process result here */
            //|     }, function(error) {
            //|         /* handle error here */
            //|     });

            var url;
            if (dataCollectionID) {
                url = "/GetDataCollections/execute";
            }
            else {
                url = "/Geoenrichment/DataCollections";
                if (countryID) {
                    url += "/" + countryID;
                }
            }

            return taskHelper.invokeMethod(this, url,

                function createParams() {
                    var restParams = {
                        suppressNullValues: true
                    };
                    if (outFields) {
                        if (outFields.length === 0) {
                            restParams.outFields = "none";
                        }
                        else {
                            restParams.outFields = JSON.stringify(outFields);
                        }
                    }
                    if (dataCollectionID) {
                        if (countryID) {
                            restParams.sourcecountry = countryID;
                        }
                        restParams.searchtext = "id:" + dataCollectionID;
                    }
                    return restParams;
                },

                function readResponse(response) {
                    if (response.error) {
                        throw response.error;
                    }
                    var dataCollections = response.results || response.dataCollections || response.DataCollections;
                    for (var i = 0; i < dataCollections.length; i++) {
                        dataCollections[i] = {
                            id: dataCollections[i].dataCollectionID,
                            metadata: dataCollections[i].metadata,
                            variables: dataCollections[i].data
                        };
                    }
                    return dataCollections;
                },
                
                "onGetDataCollectionsComplete", "onError");
        },

        createReport: function (params) {
            // summary:
            //      Creates a formatted PDF or Excel report. New browser window will be created to let user view or download the created report.
            // params: ReportParameters
            //      See the ReportParameters class for full list of available parameters

            var self = this;

            IdentityManager.getCredential(this.url).then(
                function(response) {
                    try {
                        var form = domConstruct.create("form", {
                            target: "_blank",
                            action: self.url + "/Geoenrichment/CreateReport",
                            method: "post"
                        });

                        if (!(params instanceof ReportParameters)) {
                            params = new ReportParameters(params);
                        }

                        var args = taskHelper.jsonToRest(params.toJson());
                        args.f = "bin";
                        args.token = response.token;
                        for (var arg in args) {
                            if (args.hasOwnProperty(arg)) {
                                domConstruct.create("input", {
                                    type: "hidden",
                                    name: arg,
                                    value: args[arg]
                                }, form);
                            }
                        }

                        domConstruct.place(form, document.body);
                        form.submit();
                        domConstruct.destroy(form);
                    }
                    catch (e) {
                        self.onError(e);
                    }
                },
                function(error) {
                    self.onError(error);
                });
        },

        getReports: function(countryID) {
            // summary:
            //      Gets the list of reports available for specified country
            // countryID: String
            //      Required. Two-digit code of country of interest.
            // returns: Promise

            var self = this;

            return getCountryName(this, countryID).then(function(countryName) {

                return taskHelper.invokeMethod(self, "/Geoenrichment/Reports/" + countryName,

                    null,

                    function readResponse(response) {
                        for (var i = 0; i < response.reports.length; i++) {
                            var id = response.reports[i].reportID;
                            delete response.reports[i].reportID;
                            response.reports[i].id = id;
                        }
                        return response.reports;
                    },

                    "onGetReportsComplete", "onError");
            });
        },

        getStandardGeographyLevels: function (countryID) {
            // summary:
            //      Gets the list of geography layers available. The result is grouped by country, then by dataset.
            //      Triplet of countryID, datasetID and layerID forms a 'GeographyLevel' that can be used with 'enrich' method (in 'StudyArea.comparisonGeographyLevels' or 'IntersectingGeographies.geographyLevels')

            var self = this;

            function invoke(url) {
                return taskHelper.invokeMethod(self, url, null,

                    function readResponse(response) {

                        var countries = response.geographyLevels;
                        for (var i = 0; i < countries.length; i++) {
                            var country = countries[i];
                            country.id = country.countryID;
                            delete country.countryID;
                            country.name = country.countryName;
                            delete country.countryName;

                            var datasets = country.datasets;
                            for (var j = 0; j < datasets.length; j++) {
                                var dataset = datasets[j];
                                dataset.id = dataset.datasetID;
                                delete dataset.datasetID;
                                dataset.geographyLayers = dataset.levels;
                                delete dataset.levels;
                            }
                        }


                        return countries;
                    },

                    "onGetStandardGeographyLevelsComplete", "onError");
            }

            if (countryID) {
                return getCountryName(this, countryID).then(function(countryName) {
                    return invoke("/Geoenrichment/StandardGeographyLevels/" + countryName);
                });
            }
            else {
                return invoke("/Geoenrichment/StandardGeographyLevels");
            }
        },

        getServiceLimits: function() {
            
            return taskHelper.invokeMethod(this, "/Geoenrichment/ServiceLimits", null,

                function readResponse(response) {
                    return response.serviceLimits.value;
                },

                "onGetServiceLimitsComplete", "onError");
        },

        getCountries: function (geometry) {
            // summary:
            //      Determines country the given geometry belongs to.
            // returns: Promise
            //      A promise of array of countries. The first item in this array the the country of interest.

            var center;
            switch (geometry.type) {
                case "point":
                    center = geometry;
                    break;
                case "polyline":
                    //
                    //Pick one segment from the geometry and obtain its center
                    //
                    var path = geometry.paths[0];
                    var polyline = new Polyline(geometry.spatialReference);
                    polyline.addPath(path);
                    center = getCenter(polyline);
                    break;
                case "polygon":
                    //
                    //Pick one ring from the geometry and obtain its center
                    //
                    var ring = geometry.rings[0];
                    var polygon = new Polygon(geometry.spatialReference);
                    polygon.addRing(ring);
                    center = getCenter(polygon);
                    break;
            }

            return this.enrich({
                variables: ["GlobalIntersect.*"],
                studyAreas: [{ geometry: center }],
                forStorage: false
            }).then(function(enrichResult) {
                var countries = [];
                var features = enrichResult.featureSets[0].features;
                for (var i = 0; i < features.length; i++) {
                    var countryID = features[i].attributes.sourceCountry;
                    if (array.indexOf(countries, countryID) < 0) {
                        countries.push(countryID);
                    }
                }
                if (countries.length === 0) {
                    throw new UserError(nls.noData);
                }
                return countries;
            });

        },

        onEnrichComplete: function(enrichResults) { },
        onGetAvailableCountriesComplete: function(countries) { },
        onGetDataCollectionsComplete: function(dataCollections) { },
        onCreateReportComplete: function(reportResult) { },
        onGetReportsComplete: function(reports) { },
        onGetStandardGeographyLevelsComplete: function(standardGeographies) { },
        onGetServiceLimitsComplete: function(limits) { },
        onError: function(error) { }

    });

});
