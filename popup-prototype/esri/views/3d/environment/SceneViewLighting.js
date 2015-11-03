define([
  "../../../core/Evented",
  "../../../webscene/Lighting",
], function(
  Evented,
  Lighting
) {

  var DATE_DEFAULT = new Date("March 15, 2015 12:00:00 UTC");

  var SceneViewLighting = Lighting.createSubclass([Evented], {
    declaredClass: "esri.views.3d.environment.SceneViewLighting",

    classMetadata: {
      properties: {
        date: {
          copy: function (a, b) {
            a.setTime(b.getTime());
          },

          setter: function(value, cached) {
            if (value == null) {
              return this.date;
            }

            // Don't update if didn't change
            if (this.date && value.getTime() === this.date.getTime()) {
              return this.date;
            }

            if (!cached) {
              cached = new Date();
            }

            // Auto convert numbers
            if (typeof value === "number") {
              cached.setTime(value);
            } else {
              cached.setTime(value.getTime());
            }

            if (value !== DATE_DEFAULT && value !== this._autoUpdateDate) {
              this.positionTimezoneInfo.autoUpdated = false;
            }

            this.emit("date-will-change", cached);

            return cached;
          }
        }
      }
    },

    constructor: function() {
      this.positionTimezoneInfo = {
        hours: 0,
        minutes: 0,
        seconds: 0,
        autoUpdated: true
      };

      this._autoUpdateDate = null;
    },

    getDefaults: function() {
      return {
        date: DATE_DEFAULT
      };
    },

    autoUpdate: function(date, tzInfo) {
      var curHours = this.positionTimezoneInfo.hours;

      this.positionTimezoneInfo.hours = tzInfo.hours;
      this.positionTimezoneInfo.minutes = tzInfo.minutes;
      this.positionTimezoneInfo.seconds = tzInfo.seconds;
      this.positionTimezoneInfo.autoUpdated = true;

      if (date != null) {
        var currentTime = this.date && this.date.getTime();

        this._autoUpdateDate = date;
        this.date = date;
        this._autoUpdateDate = null;

        return currentTime !== date.getTime();
      }

      if (curHours !== this.positionTimezoneInfo.hours) {
        this.emit("timezone-will-change", this.positionTimezoneInfo.hours);
      }
    }
  });

  return SceneViewLighting;
});
