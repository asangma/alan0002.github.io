define([

    "../../core/declare",
    "../../geometry/support/units",
    "./StudyAreaOptions"

], function (declare, units, StudyAreaOptions) {

    return declare("esri.tasks.geoenrichment.RingBuffer", [StudyAreaOptions], {
        // summary: 
        //      When used with point-type or line-type study areas, indicates that buffer will be built aroud given feature

        // radii: Number[]
        //      Radii array of buffer to build. Unit is defined by 'units' property. Defaults to one 1-mile buffer.
        radii: null,

        // units: Units
        //      Units for 'radii' property. Defaults to miles.
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
                this.radii = [1];
            }
            if (!this.units) {
                this.units = units.MILES;
            }
        },

        toJson: function () {

            return {
                areaType: "RingBuffer",
                bufferUnits: this.units,
                bufferRadii: this.radii
            };

        }

    });

});