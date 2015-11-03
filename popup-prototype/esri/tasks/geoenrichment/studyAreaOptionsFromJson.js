define([

    "./RingBuffer",
    "./DriveBuffer",
    "./IntersectingGeographies"

], function (RingBuffer, DriveBuffer, IntersectingGeographies) {

    var SAOF = function(json) {
        // summary:
        //      Utility function to deserialize study area options from JSON

        if (json) {
            switch (json.areaType) {
                case "DriveTimeBuffer":
                    return new DriveBuffer(json);
                case "StandardGeography":
                    return new IntersectingGeographies(json);
            }

            switch (json.type) {
                case "DriveTime":
                    return new DriveBuffer(json);
                case "StdGeo":
                    return new IntersectingGeographies(json);
            }

            return new RingBuffer(json);
        }

        return new RingBuffer();
    };

    return SAOF;

});
