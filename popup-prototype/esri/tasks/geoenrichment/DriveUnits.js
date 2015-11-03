define([

    "dojo/_base/lang",
    "../../geometry/support/units"

], function (lang, units) {

    var DriveUnits = lang.clone(units);

    lang.mixin(DriveUnits, {

        MINUTES: "esriDriveTimeUnitsMinutes"

    });

    return DriveUnits;
});