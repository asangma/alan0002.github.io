define([
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/promise/all",
  "dojo/Deferred",
  "dojo/when",
  "dojo/Evented",
  "../../geometry/SpatialReference",
  "../../geometry/support/jsonUtils",
  "../../Graphic",
  "../../portal/csv"
], function(
  declare,
  lang,
  all,
  Deferred,
  when,
  Evented,
  SpatialReference,
  geometryJsonUtils,
  Graphic,
  csv
) {
  return declare("esri.tasks.locationproviders.LocationProviderBase", Evented, {
    geometryType: null,

    loaded: false,

    constructor: function(options) {
      lang.mixin(this, options);

      setTimeout(lang.hitch(this, this._init), 0); // give users time to listen to the 'load' event
    },

    locate: function(features, options) {
      var dfd = new Deferred(),
        self = this,
        defaultSR = null,
        toKeep = [],
        toLocate = [],
        toProject = [];

      options = options || {};

      for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        if (feature && feature instanceof Graphic) {
          var geometry = feature.geometry;
          if (geometry && options.useExistingGeometries && geometryJsonUtils.getJsonType(geometry) === this.geometryType) {
            if (!defaultSR) {
              // TODO: this probably needs a better solution. Question to answer; when outSR is set, what is the inSR of existing geometries
              // that don't have an sref assigned (need inSR to do projection)
              defaultSR = geometry.spatialReference;
            }

            if (!geometry.spatialReference || (options.outSpatialReference && !geometry.spatialReference.equals(options.outSpatialReference))) {
              toProject.push(feature);
            } else {
              toKeep.push(feature);
            }
          } else {
            toLocate.push(feature);
          }
        }
      }

      var projections;
      if (toProject.length) {
        projections = this._project(toProject, options.outSpatialReference, defaultSR || SpatialReference.WGS84).then(function() {
          progress(toProject);
        });
      }

      if (toKeep.length) {
        progress(toKeep);
      }

      function done(located) {
        when(projections).then(function() {
          var failed = [],
            succeeded = located.concat(toProject).concat(toKeep);
          for (var i = 0; i < features.length; i++) {
            var feature = features[i],
              found = false;
            for (var j = 0; j < succeeded.length; j++) {
              if (succeeded[j] === feature) {
                found = true;
                break;
              }
            }
            if (!found) {
              if (feature && feature.setGeometry) {
                feature.setGeometry(); // clear out the geometry
              }
              failed.push(feature);
            }
          }

          var evt = {
            features: succeeded,
            failed: failed
          };
          self.emit("locate-complete", evt);
          dfd.resolve(evt);
        });
      }

      function progress(located) {
        var evt = {
          features: located
        };

        for (var i=0; i<located.length; i++) {
          var feature = located[i];
          // trigger redraw
          feature.setGeometry(feature.geometry);
        }

        self.emit("locate-progress", evt);
        dfd.progress(evt);
      }

      function error(err) {
        var evt = {
          error: err
        };
        self.emit("error", evt);
        dfd.progress(evt);
      }

      if (this.loaded) {
        this._locate(toLocate, options).then(done, error, progress);
      } else {
        error("not loaded");
      }

      return dfd.promise;
    },

    _init: function() {
      if (this.geometryType) {
        this.loaded = true;
        this.emit("load");
      }
    },

    _project: function(features, outSR, defaultSR) {
      // TODO: chunk projection requests?

      var featuresPerSref = [],
        self = this;

      function project(features, inSR) {
        var dfd = new Deferred(),
          fc = {
            featureSet: {
              geometryType: self.geometryType,
              features: features
            }
          };

        csv._projectFeatureSet(fc, inSR, outSR, function(result) {
          for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            if (feature && feature.geometry && !feature.geometry.toJson) {
              feature.geometry = geometryJsonUtils.fromJson(feature.geometry);
            }
          }
          dfd.resolve();
        });

        return dfd.promise;
      }

      for (var i = 0; i < features.length; i++) {
        var feature = features[i],
          geometry = feature && feature.geometry;

        if (geometry) {
          if (!geometry.spatialReference) {
            // assume defaultSR
            geometry.setSpatialReference(defaultSR);
          }

          if (outSR.equals(geometry.spatialReference)) {
            continue;
          }

          var featuresWithSameSref;
          for (var j = 0; j < featuresPerSref.length; j++) {
            featuresWithSameSref = featuresPerSref[j].sref.equals(geometry.spatialReference) && featuresPerSref[j].features;
          }
          if (featuresWithSameSref) {
            featuresWithSameSref.push(feature);
          } else {
            featuresPerSref.push({
              sref: geometry.spatialReference,
              features: [feature]
            });
          }
        }
      }

      var promises = [];
      for (var k = 0; k < featuresPerSref.length; k++) {
        promises.push(project(featuresPerSref[k].features, featuresPerSref[k].sref));
      }

      return all(promises);
    }
  });
});
