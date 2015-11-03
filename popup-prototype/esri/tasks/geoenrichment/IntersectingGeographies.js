define([

    "../../core/declare",
    "./StudyAreaOptions",
    "./GeographyLevel"

], function (declare, StudyAreaOptions, GeographyLevel) {

    var IntersectingGeographies = declare("esri.tasks.geoenrichment.IntersectingGeographies", [StudyAreaOptions], {
        // summary:
        //      Indicates that study area will be used to retrive intersecting standard geographies and Enrichment calculations will be performed for those standard geographies rather than the original study area.
        //      For example, if study area is a point then the default Enrichment behaviour is to build 1-mile circle around that point; using IntersectingGeographies as study area options changes the behaviour to retrieve e.g. ZIP code intersecting that point.

        // geographyLevels: GeographyLevel
        //      Array of geography levels to intersect input study areas with.
        geographyLevels: null,

        constructor: function (json) {
            var levels;
            if (json) {
                levels = json.intersectingGeographies || json.levels || json.geographyLevels;
            }
            else {
                levels = [{ layerID: "Admin2" }];
            }
            this.geographyLevels = GeographyLevel.fromJsonArray(levels);
        },

        toJson: function () {

            var json = {
                areaType: "StandardGeography",
                intersectingGeographies: GeographyLevel.toJsonArray(this.geographyLevels)
            };

            return json;
        }

    });

    return IntersectingGeographies;

});