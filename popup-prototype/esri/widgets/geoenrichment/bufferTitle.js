define([

    "dojo/string",
    "../../tasks/geoenrichment/DriveBuffer",
    "../../tasks/geoenrichment/IntersectingGeographies",
    "../../tasks/geoenrichment/DriveUnits",
    "dojo/i18n!../../nls/jsapi"

], function (string, DriveBuffer, IntersectingGeographies, DriveUnits, nls) {
    nls = nls.geoenrichment.dijit.bufferTitle;

    function getRadius(buffer) {
        return (buffer && buffer.radii[0] || 1).toString();
    }

    function getUnits(buffer) {
        return buffer && buffer.units || DriveUnits.MILES;
    }

    function bufferTitle(geomType, buffer) {

        switch (geomType) {

            case "polyline":
                if (buffer instanceof DriveBuffer) {
                    //
                    //Cannot use drive times with linear features - fallback to 1-mile straight line buffer
                    //
                    return string.substitute(nls.lineBuffer[DriveUnits.MILES], { radius: "1" });
                } else {
                    return string.substitute(nls.lineBuffer[getUnits(buffer)], { radius: getRadius(buffer) });
                }
                break;

            case "polygon":
                return nls.polygon;

            default:

                if (buffer instanceof DriveBuffer) {
                    return string.substitute(nls.pointDriveTime[getUnits(buffer)], { radius: getRadius(buffer) });
                }
                else if (buffer instanceof IntersectingGeographies) {
                    return string.substitute(nls.stdGeo, { level: buffer.geographyLevels[0].layerID });
                }
                else {
                    return string.substitute(nls.pointRing[getUnits(buffer)], { radius: getRadius(buffer) });
                }
        }

    }

    return bufferTitle;

});
