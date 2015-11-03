define([

    "../../core/declare",
    "./StudyAreaOptions",
    "./DriveUnits"

], function (declare, StudyAreaOptions, DriveUnits) {

    return declare("esri.tasks.geoenrichment.DriveBuffer", [StudyAreaOptions], {
        // summary: 
        //      When used with point-type study areas, indicates that drive time buffer will be built aroud given point
        
        // radii: Number[]
        //      Radii array of drive time buffers to build. Unit is defined by 'units' property. Defaults to one 5-minute area.
        radii: null,

        // units: DriveUnits
        //      Units for 'radii' property. Defaults to minutes.
        units: null,

        constructor: function (json) {
            if (json) {
                if (json.bufferRadii) {
                    this.radii = json.bufferRadii;
                }
                else if (json.radius) {
                    this.radii = [json.radius];
                }
                else if (json.radii) {
                    this.radii = json.radii;
                }

                this.units = json.bufferUnits || json.units;
            }
            if (!this.radii) {
                this.radii = [5];
            }
            if (!this.units) {
                this.units = DriveUnits.MINUTES;
            }
        },

        toJson: function () {

            return {
                areaType: "DriveTimeBuffer",
                bufferUnits: this.units,
                bufferRadii: this.radii
            };

        }

    });

});