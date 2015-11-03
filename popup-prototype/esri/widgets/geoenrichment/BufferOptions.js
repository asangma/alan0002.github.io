define([
    "../../core/declare",
    "dojox/mvc/Templated",
    "dojo/text!./templates/BufferOptions.html",
    "dojo/i18n!../../nls/jsapi",
    "../../tasks/geoenrichment/RingBuffer",
    "../../tasks/geoenrichment/DriveBuffer",
    "../../tasks/geoenrichment/DriveUnits",

    "dijit/form/RadioButton",
    "./NumberSpinner",
    "dijit/form/Select"

], function (declare, Templated, template, nls, RingBuffer, DriveBuffer, DriveUnits) {
    nls = nls.geoenrichment.dijit.BufferOptions;

    var BufferOptions = declare("esri.widgets.geoenrichment.BufferOptions", [Templated], {
        templateString: template,
        nls: nls,
        geomType: "",

        _distRadius: null,
        _timeRadius: null,

        buildRendering: function () {
            this.inherited(arguments);

            var options = [];
            function addOption(units) {
                options.push({
                    value: units,
                    label: nls.units[units]
                });
            }
            addOption(DriveUnits.MILES);
            addOption(DriveUnits.KILOMETERS);
            addOption(DriveUnits.FEET);
            addOption(DriveUnits.METERS);
            this.unitsSelect.set("options", options);

            this._updateUI("Ring", 1, DriveUnits.MILES);
        },

        _setGeomTypeAttr: function (geomType) {
            switch (geomType) {
                case "point":
                    this.radiusTr.style.display = this.studyAreaTr.style.display = "";
                    break;
                case "polyline":
                    this.studyAreaTr.style.display = "none";
                    this.radiusTr.style.display = "";
                    this.radiusLabel.innerHTML = nls.buffer;
                    break;
                case "polygon":
                    this.radiusTr.style.display = this.studyAreaTr.style.display = "none";
                    this.radiusLabel.innerHTML = nls.buffer;
                    break;
            }

            this.geomType = geomType;
        },

        _getBufferAttr: function() {
            var radius = this._getRadius();
            var units = this.unitsSelect.get("value");
            switch (this.typeSelect.get("value")) {
                case "Ring":
                    return new RingBuffer({ radius: radius, units: units });
                case "DriveTime":
                    return new DriveBuffer({ radius: radius });
                case "DriveDistance":
                    return new DriveBuffer({ radius: radius, units: units });
            }
        },
        _setBufferAttr: function(buffer) {
            if (this._buffer === buffer) {
                return;
            }
            var type;
            var radius = buffer.radii[0];
            if (buffer instanceof RingBuffer) {
                type = "Ring";
                this._distRadius = radius;
            }
            else if (buffer instanceof DriveBuffer) {
                if (buffer.units == DriveUnits.MINUTES) {
                    type = "DriveTime";
                    this._timeRadius = radius;
                }
                else {
                    type = "DriveDistance";
                    this._distRadius = radius;
                }
            }
            else {
                throw new Error("Unexpected buffer type");
            }
            this._updateUI(type, radius, buffer.units);
        },

        _getRadius: function() {
            switch (this.typeSelect.get("value")) {
                case "Ring":
                case "DriveDistance":
                    if (this._distRadius) {
                        return this._distRadius;
                    }
                    break;
                case "DriveTime":
                    return this._timeRadius || 5;
            }
            switch (this.unitsSelect.get("value")) {
                case DriveUnits.MILES:
                    return 1;
                case DriveUnits.KILOMETERS:
                    return 1;
                case DriveUnits.FEET:
                    return 1500;
                case DriveUnits.METERS:
                    return 500;
            }
        },

        _updateUI: function(type, radius, units) {
            //
            //Update primary select elements
            //
            if (type) {
                this.typeSelect.set("value", type);
            }
            else {
                type = this.typeSelect.get("value");
            }
            if (radius) {
                this.radiusSpinner.set("value", radius);
            }
            else {
                radius = this.radiusSpinner.get("value");
            }
            if (units) {
                this.unitsSelect.set("value", units);
            }
            else {
                units = this.unitsSelect.get("value");
            }

            //
            //Update dependencies like "minutes" label and radius constraints
            //
            if (type === "DriveTime") {
                this.minutesSpan.style.display = "";
                this.unitsSelect.domNode.style.display = "none";
            }
            else {
                this.minutesSpan.style.display = "none";
                this.unitsSelect.domNode.style.display = "";
            }
            var min, max;
            if (type === "DriveTime") {
                min = 1;
                max = 300;
            }
            else {
                var isRing = type === "Ring";
                switch (units) {
                    case DriveUnits.MILES:
                        min = 0.25;
                        max = isRing ? 1000 : 300;
                        break;
                    case DriveUnits.KILOMETERS:
                        min = 0.4;
                        max = isRing ? 1600 : 450;
                        break;
                    case DriveUnits.FEET:
                        min = 1300;
                        max = isRing ? 5280000 : 1500000;
                        break;
                    case DriveUnits.METERS:
                        min = 400;
                        max = isRing ? 1609000 : 450000;
                        break;
                }
            }
            this.radiusSpinner.set("constraints", { "min": min, "max": max });
            if (radius < min) {
                this.radiusSpinner.set("value", min);
            }
            else if (radius > max) {
                this.radiusSpinner.set("value", max);
            }
        },

        _typeChange: function(type) {
            this._updateUI(null, this._getRadius(), null);
        },

        _unitsChange: function() {
            this._updateUI(null, null, null);
            this._onChange();
        },

        _radiusChange: function () {
            if (this.radiusSpinner.isValid()) {
                var radius = this.radiusSpinner.get("value");
                switch (this.typeSelect.get("value")) {
                    case "Ring":
                    case "DriveDistance":
                        this._distRadius = radius;
                        break;
                    case "DriveTime":
                        this._timeRadius = radius;
                        break;
                }
                this._onChange();
            }
            else {
                this._onError();
            }
        },

        _onChange: function () {
            this.onChange();
        },
        onChange: function () { },

        _onError: function () {
            this.onError();
        },
        onError: function () { }
    });

    return BufferOptions;

});