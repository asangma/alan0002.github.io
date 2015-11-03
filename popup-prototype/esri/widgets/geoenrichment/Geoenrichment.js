define([
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/string",
    "dojo/promise/all",
    "./bufferTitle",
    "../../geometry/Polygon",
    "../../geometry/support/units",
    "./DataProvider",
    "../../tasks/geoenrichment/GeoenrichmentTask",
    "../../tasks/geoenrichment/EnrichParameters",
    "../../tasks/geoenrichment/RingBuffer",
    "../../tasks/geoenrichment/DriveBuffer",
    "../../tasks/geoenrichment/GeographyLevel",
    "../../tasks/geoenrichment/GeometryStudyArea",
    "../../tasks/geoenrichment/AddressStudyArea",
    "../../tasks/geoenrichment/studyAreaFromJson",
    "./config",
    "./lang",
    "./_Invoke",
    "dojo/when",
    "../../tasks/Locator",
    "../../tasks/support/FeatureSet",
    "../../Graphic"
], function (
    declare,
    lang,
    on,
    string,
    all,
    bufferTitle,
    Polygon,
    Units,
    DataProvider,
    GeoenrichmentTask,
    EnrichParameters,
    RingBuffer,
    DriveBuffer,
    GeographyLevel,
    GeometryStudyArea,
    AddressStudyArea,
    studyAreaFromJson,
    config,
    esriLang,
    _Invoke,
    when,
    Locator,
    FeatureSet,
    Graphic
) {
    var Dictionary = declare(null, {

        _keys: null,
        _values: null,
        _capacity: 5,

        constructor: function (capacity) {
            this._keys = [];
            this._values = {};
            if (capacity) {
                this._capacity = capacity;
            }
        },

        getValue: function (key) {
            return this._values[key];
        },

        setValue: function (key, value) {
            this._keys.push(key);
            this._values[key] = value;
            this._removeOverflow();
        },

        hasValue: function (key) {
            return this._values.hasOwnProperty(key);
        },

        _removeOverflow: function () {
            if (this._keys.length > this._capacity) {
                var removed = this._keys.splice(0, this._keys.length - this._capacity);
                for (var i = 0; i < removed.length; i++) {
                    delete this._values[removed[i]];
                }
            }
        },

        setCapacity: function (capacity) {
            this._capacity = capacity;
            this._removeOverflow();
        }

    });

    var Cache = declare(null, {

        _values: null,

        constructor: function (capacity) {
            this._values = new Dictionary(capacity);
        },

        getValue: function (key) {
            var s = this.keyToString(key);
            if (this._values.hasValue(s)) {
                return this._values.getValue(s);
            }
            else {
                var self = this;
                return this.keyToValue(key).then(function(result) {
                        self._values.setValue(s, result);
                    return result;
                    });
            }
        },

        keyToString: function (key) {
            return JSON.stringify(key);
        },

        keyToValue: function (key) {
            throw "Not implemented"; //abstract
        },

        setCapacity: function (capacity) {
            this._values.setCapacity(capacity);
        }
    });

    var AddressCache = declare([Cache], {

        keyToString: function (point) {
            return JSON.stringify(point.toJson());
        },

        keyToValue: function (point) {
            var locator = new Locator(config.locatorUrl);
            return locator.locationToAddress(point).then(function(result) {
                return string.substitute(config.addressFormat, result.address, function(v) {
                        return v || "";
                });
                },
            function(error) {
                    //
                    //Ignore all errors occured during reverse geocoding. Simply won't show address.
                    //
                return "";
                });
        }
    });

    var EnrichCache = declare([Cache], {

        _countryValues: null,
        _geometries: null,

        constructor: function () {
            this._countryValues = new Dictionary();
            this._geometries = new Dictionary(3);
        },

        keyToValue: function(args) {
            var self = this;

            var studyArea = studyAreaFromJson(args.studyArea);
            var needGeometry = studyArea.returnGeometry;
            var hasGeometry;
            var geometryKey;
            if (needGeometry) {
                geometryKey = studyArea.toJson();
                delete geometryKey.returnGeometry; //irrelevant for geometry cache
                delete geometryKey.comparisonLevels; //irrelevant for geometry cache
                delete geometryKey.attributes; //irrelevant for geometry cache
                geometryKey = JSON.stringify(geometryKey);

                hasGeometry = this._geometries.hasValue(geometryKey);
                    }

            var requestGeometry = needGeometry && !hasGeometry;

                //
                //Geoenrichment request
                //

                var task = new GeoenrichmentTask(config.server);
                task.token = config.token;

                var needCountryValues = null;
                for (var i = studyArea.comparisonGeographyLevels.length - 1; i >= 0; i--) {
                    //
                    //TODO: push this check to server somehow (not all datasets have Admin1 layer covering whole country)
                    //
                    if (studyArea.comparisonGeographyLevels[i].layerID == "Admin1") {
                        needCountryValues = studyArea.comparisonGeographyLevels.splice(i, 1)[0];
                    }
                }
                var countryKey;
                var hasCounrtyValues;
                if (needCountryValues) {
                    countryKey = JSON.stringify({
                        variables: args.variables,
                        country: args.country
                    });
                    hasCounrtyValues = this._countryValues.hasValue(countryKey);
                    if (!hasCounrtyValues) {
                        studyArea.comparisonGeographyLevels.push(needCountryValues);
                    }
                }

                var enrichParams = new EnrichParameters();
                enrichParams.forStorage = false;
                enrichParams.countryID = args.country;
                enrichParams.variables = args.variables;


                studyArea.returnGeometry = requestGeometry;
                if (requestGeometry) {
                    enrichParams.outSR = studyArea.geometry ? studyArea.geometry.spatialReference : args.outSR;
                }

                enrichParams.studyAreas.push(studyArea);

            return task.enrich(enrichParams).then(function(result) {
                        var features = result.featureSets[0].features;
                        if (needCountryValues) {
                            if (hasCounrtyValues) {
                                features.push(self._countryValues.getValue(countryKey));
                            }
                            else {
                                self._countryValues.setValue(countryKey, features[features.length - 1]);
                            }
                        }
                        if (needGeometry) {
                            if (hasGeometry) {
                                features[0].geometry = self._geometries.getValue(geometryKey);
                            }
                            else {
                                self._geometries.setValue(geometryKey, features[0].geometry);
                            }
                        }
                return result.featureSets[0];
                    });
        },

        setCapacity: function (capacity) {
            this.inherited(arguments);
            this._countryValues.setCapacity(capacity);
        }
    });

    var CombinedCache = declare([Cache], {

        metadata: null,

        _enrichCache: null,
        _addressCache: null,

        constructor: function (capacity) {
            this._enrichCache = new EnrichCache(capacity);
            this._addressCache = new AddressCache(3);
        },

        keyToValue: function (args) {
            var self = this;
            var promises = [];

            var returnAddress = args.returnAddress;
            delete args.returnAddress; //address is not relevant for enrich cache
            promises.push(this._enrichCache.getValue(args));

            var studyArea = studyAreaFromJson(args.studyArea);
            if (returnAddress) {
                promises.push(this._addressCache.getValue(studyArea.geometry));
            }

            return all(promises).then(function(results) {
                    var featureSet = results[0];
                    var mainFeature = featureSet.features[0];
                    if (!mainFeature.attributes[self.metadata.name]) {
                        mainFeature.attributes[self.metadata.name] = bufferTitle(studyArea.getGeomType(), studyArea.options);
                        if (returnAddress) {
                            mainFeature.attributes[self.metadata.address] = results[1];
                        }
                        else if (studyArea instanceof AddressStudyArea) {
                            mainFeature.attributes[self.metadata.address] = studyArea.address.text;
                        }
                    }
                return featureSet;
            });
        },

        setCapacity: function (capacity) {
            this.inherited(arguments);
            this._enrichCache.setCapacity(capacity);
        }

    });

    var Geoenrichment = declare("esri.widgets.geoenrichment.Geoenrichment", [DataProvider, _Invoke], {

        country: null,
        returnGeometry: false,
        returnAddress: false,
        returnData: true,

        studyArea: null,
        outSR: null,
        buffer: null,
        variables: null,
        levels: null,
        highestLevel: null,
        data: null, /*FeatureSet*/

        restartOnDone: false,
        requests: null,
        started: false,
        cache: null,

        constructor: function () {
            this.buffer = new RingBuffer();
            this.cache = new CombinedCache();
            this.cache.metadata = this.metadata;
        },

        handleResponse: function (featureSet) {
            try {
                this.data = featureSet;
                this.onDone(null);
            } catch (e) {
                this.onDone(e);
            }
        },

        handleError: function (error) {
            this.onDone(error);
        },

        onDone: function (error) {
            this.requests = null;
            if (error) {
                if (error.name !== "CancelError") {
                    console.log(error);
                    on.emit(this, "error", error);
                }
            } else {
                on.emit(this, "data");
            }
            if (this.restartOnDone) {
                this.invalidate();
                this.restartOnDone = false;
            } else {
                on.emit(this, "end");
                this.started = false;
            }
        },

        requestData: function () {
            if (!this.studyArea || !this.variables || !this.buffer) {
                return;
            }
            this.requests = [];
            if (!this.started) {
                on.emit(this, "start");
                this.started = true;
            }

            var promise;
            var buffer = this.buffer;
            var returnAddress = false;

            if (this.studyArea instanceof GeometryStudyArea) {
                switch (this.studyArea.geometry.type) {
                    case "point":
                        returnAddress = this.returnAddress;
                        break;
                    case "polyline":
                        if (this.buffer instanceof DriveBuffer) {
                            buffer = new RingBuffer();
                        }
                        break;
                    case "polygon":
                        buffer = null;
                        break;
                }
            }

            var studyArea = lang.clone(this.studyArea);
            if (!studyArea.options && buffer) {
                studyArea.options = buffer;
            }
            if (this.levels) {
                for (var i = 0; i < this.levels.length; i++) {
                    studyArea.comparisonGeographyLevels.push(new GeographyLevel({
                        layerID: this.levels[i]
                    }));
                }
            }
            if (this.highestLevel) {
                studyArea.comparisonGeographyLevels.push(new GeographyLevel({
                    layerID: this.highestLevel
                }));
            }
            studyArea.returnGeometry = this.returnGeometry;

            promise = when(this.cache.getValue({
                country: this.country,
                variables: this.variables,
                returnData: this.returnData,
                studyArea: studyArea.toJson(),
                outSR: this.outSR,
                returnAddress: returnAddress
            }));

            this.requests.push(promise);
            promise.then(lang.hitch(this, this.handleResponse), lang.hitch(this, this.handleError));
        },

        invalidate: function () {
            if (this.pendingInvoke("requestData")) {
                return;
            }
            if (this.requests) {
                this.restartOnDone = true;
            } else {
                this.geometry = null;
                this.invoke("requestData");
            }
        },

        setStudyArea: function (studyArea) {
            this.studyArea = studyArea;
            this.invalidate();
        },

        setBuffer: function (buffer) {
            this.buffer = buffer;
            this.invalidate();
        },

        getBuffer: function () {
            return this.buffer;
        },

        invalidateData: function () {
            this.data = null;
            this.invalidate();
        },

        setVariables: function (variables) {
            if (esriLang.arraysEqual(this.variables, variables)) {
                return;
            }
            this.variables = variables;
            this.invalidateData();
        },

        setGeoLevels: function (levels, highestLevel) {
            if (esriLang.arraysEqual(this.levels, levels) && this.highestLevel == highestLevel) {
                return;
            }
            this.levels = levels;
            this.highestLevel = highestLevel;
            this.invalidateData();
        },

        setCacheLimit: function (limit) {
            this.cache.setCapacity(limit);
        },

        getData: function () {
            return this.data;
        },

        getGeometry: function () {
            return this.data.features[0].geometry;
        },

        isBusy: function () {
            return this.pendingInvoke("requestData") || this.requests || this.restartOnDone;
        },

        stop: function () {
            this.restartOnDone = false;
            this.cancelInvoke("requestData");
            if (this.requests) {
                var requests = this.requests.slice(0);
                for (var i = 0; i < requests.length; i++) {
                    requests[i].cancel();
                }
            }
        },

        setReturnAddress: function (returnAddress) {
            if (this.returnAddress == returnAddress) {
                return;
            }
            this.returnAddress = returnAddress;
            if (returnAddress) {
                this.invalidateData();
            }
        }
    });

    return Geoenrichment;

});
