define([
  "../../../core/declare",
  "../../../core/Accessor",
  "../../../core/Evented",
  "../../../core/watchUtils",
  "../../../core/HandleRegistry",

  "../../../geometry/Point",
  "../../../geometry/support/webMercatorUtils",
  "../../../geometry/SpatialReference",

  "../support/ViewReadyMixin",
  "../support/sunUtils",
  "../support/earthUtils",

  "./EnvironmentRenderer"
], function(
  declare, Accessor, Evented, watchUtils, HandleRegistry,
  Point, webMercatorUtils, SpatialReference,
  ViewReadyMixin, sunUtils, earthUtils,
  EnvironmentRenderer
) {

  var tmpDate = new Date();

  var tmpTz = {
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  var SceneViewEnvironmentManager = declare([Accessor, Evented, ViewReadyMixin], {
    declaredClass: "esri.views.3d.environment.SceneViewEnvironmentManager",

    referencePointUpdateInterval: 1000, // in ms
    referencePointUpdateDistThreshold: 10000, // in m

    classMetadata: {
      properties: {
        autoAdjustTimezone: {
          setter: function(v) {
            if (this._viewConnected && v !== this.autoAdjustTimezone) {
              if (v) {
                this._installAutoAdjust();
              } else {
                this._uninstallAutoAdjust();
              }
            }

            return v;
          }
        }
      }
    },

    getDefaults: function() {
      return {
        autoAdjustTimezone: true
      };
    },

    constructor: function() {
      this._viewHandles = new HandleRegistry();

      this._environmentRenderer = null;
      this._preserveAbsoluteDateTime = false;

      this._resetReferencePosition();
    },

    destroy: function() {
      this._viewHandles.destroy();
      this.disposeRendering();
    },

    disposeRendering: function() {
      if (this._environmentRenderer) {
        this._environmentRenderer.destroy();
        this._environmentRenderer = null;
      }

      this._resetReferencePosition();
    },

    connectView: function(view) {
      this._environmentRenderer = new EnvironmentRenderer({ view: view });

      this._viewHandles.add([
        watchUtils.on(this.view,
          "environment.lighting",
          "date-will-change",
          this._lightingDateHandler.bind(this)),

        this.view.watch("environment.lighting.directShadows,environment.lighting.ambientOcclusion",
          this._updateRenderParamsHandler.bind(this)),

        this.view.watch("spatialReference",
          this._spatialReferenceHandler.bind(this)),

        watchUtils.init(this.view, "viewingMode", this._viewingModeHandler.bind(this))
      ]);

      if (this.autoAdjustTimezone) {
        this._installAutoAdjust();
      }

      this._updateRenderParamsHandler();
      this._updateLightParams();
      this._cameraHandler();
    },

    _installAutoAdjust: function() {
      this._viewHandles.add(watchUtils.on(this,
          "view.navigation",
          "currentViewChanged",
          this._cameraHandler.bind(this)),
        "camera");
    },

    _uninstallAutoAdjust: function() {
      this._viewHandles.remove("camera");
    },

    disconnectView: function(view) {
      this.disposeRendering();
      this._viewHandles.removeAll();
    },

    _lightingDateHandler: function(date) {
      if (date) {
        var lighting = this.view.environment.lighting;

        if (!lighting.positionTimezoneInfo.autoUpdated) {
          this._preserveAbsoluteDateTime = true;

          if (this._referencePosWGS84) {
            // Compute and store the timezone evaluated at the current reference
            // position to keep it synchronized with the datetime, needed for
            // auto-update to work properly on the next camera change
            var tz = earthUtils.positionToTimezone(this._referencePosWGS84, tmpTz);
            lighting.autoUpdate(null, tz);
          }
        }

        this._updateLightParams(date);
      }
    },

    _cameraHandler: function() {
      var camera = this.view.camera;

      if (!camera) {
        return;
      }

      if (this.view.viewingMode === "global") {
        this._cameraHandlerGlobal(camera);
      } else {
        this._cameraHandlerLocal(camera);
      }
    },

    _cameraHandlerGlobal: function(camera) {
      var camPos = camera.position;

      if (!this._referencePosWGS84) {
        this._referencePosWGS84 = new Point({
          spatialReference: SpatialReference.WGS84
        });
      }

      webMercatorUtils.webMercatorToGeographic(camPos, false, this._referencePosWGS84);
      this._referencePosWGS84.z = camPos.z;

      if (this.view.mapCoordsHelper) {
        this._referencePosWGS84.z *= this.view.mapCoordsHelper.mapUnitInMeters;
      }

      if (!this._autoUpdateTimezone(camPos)) {
        this._updateLightParams();
      }
    },

    _cameraHandlerLocal: function(camera) {
      var camPos = camera.position;

      var timeSinceLastUpdate = window.performance.now() - this._referencePosLastUpdate;

      if (!this._referencePosMapCoords ||
        ((timeSinceLastUpdate > this.referencePointUpdateInterval) &&
        this._exceedsReferencePosDistThreshold(camPos))) {
        this._updateReferencePositionWithService(camPos);
      }
    },

    /**
     * Update the sun light direction and settings based on the date and the
     * current camera position.
     */
    _updateLightParams: function(date) {
      var lighting = this.view.environment.lighting;

      date = date || lighting.date;

      var stage = this.view._stage;
      var lightParams;

      if (this._referencePosWGS84) {
        lightParams = sunUtils.computeColorAndIntensity(date, this._referencePosWGS84);
        sunUtils.computeDirection(date, this._referencePosWGS84, this.view.globeMode, lightParams.diffuse.direction);
      } else {
        // fallback solution, light points straight down
        lightParams = {
          diffuse: {
            color: [1, 1, 1],
            intensity: 0.5,
            direction: this.view.renderCoordsHelper.worldUp
          },

          ambient: {
            color: [1, 1, 1],
            intensity: 0.5
          }
        };
      }

      stage.setDirectionalLight(lightParams.diffuse);
      stage.setAmbientLight(lightParams.ambient);
    },

    /**
     * Automatically update the timezone/date based on the position. This
     * effectively will calculate a date which preserves the local time.
     */
    _autoUpdateTimezone: function(position) {
      if (!this.autoAdjustTimezone) {
        return false;
      }

      var date = tmpDate;
      date.setTime(this.view.environment.lighting.date.getTime());

      var tz = earthUtils.positionToTimezone(position, tmpTz);
      var currentTz = this.view.environment.lighting.positionTimezoneInfo;

      if (!currentTz.autoUpdated) {
        currentTz.hours = tz.hours;
        currentTz.minutes = tz.minutes;
        currentTz.seconds = tz.seconds;
      } else if (currentTz.hours === tz.hours && currentTz.minutes === tz.minutes && currentTz.seconds === tz.seconds) {
        return false;
      }

      var h = date.getUTCHours() - (tz.hours - currentTz.hours);
      var m = date.getUTCMinutes() - (tz.minutes - currentTz.minutes);
      var s = date.getUTCSeconds() - (tz.seconds - currentTz.seconds);

      date.setUTCHours(h);
      date.setUTCMinutes(m);
      date.setUTCSeconds(s);

      return this.view.environment.lighting.autoUpdate(date, tz);
    },

    //-------------------------------------------------------------------------
    //
    // Stage Rendering Settings from environment
    //
    //-------------------------------------------------------------------------

    _updateRenderParamsHandler: function() {
      var stage = this.get("view._stage");

      if (stage) {
        stage.setRenderParams({
          shadowMap: this.view.environment.lighting.directShadows,
          ssao: this.view.environment.lighting.ambientOcclusion
        });
      }
    },

    //-------------------------------------------------------------------------
    //
    // Local reference position calculation
    //
    //-------------------------------------------------------------------------

    _spatialReferenceHandler: function() {
      this._resetReferencePosition();
    },

    _viewingModeHandler: function(viewingMode) {
      this._resetReferencePosition();
    },

    _resetReferencePosition: function() {
      if (this._referencePosUpdateQuery) {
        this._referencePosUpdateQuery.cancel();
      }

      this._referencePosMapCoords = null;
      this._referencePosMapCoordsDesired = null;
      this._referencePosWGS84 = null;
      this._referencePosLastUpdate = 0;
      this._referencePosUpdateQuery = null;
    },

    _updateReferencePositionWithService: function(mapCoordsPosition) {
      if (!this.view.mapCoordsHelper.canProject()) {
        return;
      }

      if (this._referencePosUpdateQuery) {
        // query ongoing, store current cam position for a potential follow-up query
        if (!this._referencePosMapCoordsDesired) {
          this._referencePosMapCoordsDesired = mapCoordsPosition.clone();
        } else {
          this._referencePosMapCoordsDesired.copy(mapCoordsPosition);
        }
      } else {
        this._preserveAbsoluteDateTime = false;

        if (!this._referencePosMapCoords) {
          this._referencePosMapCoords = mapCoordsPosition.clone();
        } else {
          this._referencePosMapCoords.copy(mapCoordsPosition);
        }

        this._referencePosUpdateQuery = this.view.mapCoordsHelper.toGeographic(this._referencePosMapCoords)
          .then(function(result) {
            this._referencePosUpdateQuery = null;

            if (!isNaN(result[0]) && !isNaN(result[1])) {
              if (!this._referencePosWGS84) {
                this._referencePosWGS84 = new Point({
                  x: result[0],
                  y: result[1],
                  spatialReference: SpatialReference.WGS84
                });
              } else {
                this._referencePosWGS84.x = result[0];
                this._referencePosWGS84.y = result[1];
                this._referencePosWGS84.z = this._referencePosMapCoords.z * this.view.mapCoordsHelper.mapUnitInMeters;
              }
              this._referencePosLastUpdate = window.performance.now();

              this._referencePosChanged();
            }

            return this._updateReferencePositionWithService_followUp();
          }.bind(this), function(err) {
            this._referencePosUpdateQuery = null;
            return this._updateReferencePositionWithService_followUp();
          }.bind(this)
        );
      }

      return this._referencePosUpdateQuery;
    },

    _updateReferencePositionWithService_followUp: function() {
      var followUpQueryPos = this._referencePosMapCoordsDesired;
      if (followUpQueryPos && this._exceedsReferencePosDistThreshold(followUpQueryPos)) {
        // follow-up query to reflect the changes since last query was issued
        this._referencePosMapCoordsDesired = null;
        return this._updateReferencePositionWithService(followUpQueryPos);
      }
    },

    _referencePosChanged: function() {
      // updates light/sun position internally
      if (!this._preserveAbsoluteDateTime) {
        if (!this._autoUpdateTimezone(this._referencePosWGS84)) {
          this._updateLightParams();
        }
      } else {
        this._updateLightParams();
      }
    },

    _exceedsReferencePosDistThreshold: function(point) {
      if (this._referencePosMapCoords) {
        var dist = this._referencePosMapCoords.distance(point);
        if (this.view.mapCoordsHelper) {
          dist *= this.view.mapCoordsHelper.mapUnitInMeters;
        }

        return dist > this.referencePointUpdateDistThreshold;
      }
      return true;
    }
  });

  return SceneViewEnvironmentManager;
});
