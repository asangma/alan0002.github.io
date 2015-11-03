define([
    "../../core/declare",
    "./BaseWidget",
    "dijit/form/Select",
    "dojo/dom-class"

], function (declare, BaseWidget, Select, domClass) {

    var BaseSelectComparison = declare("esri.widgets.geoenrichment.BaseSelectComparison", [BaseWidget], {

        updateUI: function () {
            this.inherited(arguments);
            this._state.selectedComparison = Math.min(this._state.selectedComparison || 0, this.data.features.length - 2);
        },

        updateUIExpanded: function () {
            this.inherited(arguments);
            if (this.select) {
                var toAdd = [];
                var toUpdate = [];
                var levelCount = Math.max(this.data.features.length - 1, 0);
                for (var i = 0; i < levelCount; i++) {
                    var text = this.getFeatureTitle(i + 1);
                    var option = {
                        label: text,
                        value: i.toString()
                    };
                    if (i >= this.select.options.length) {
                        toAdd.push(option);
                    } else {
                        toUpdate.push(option);
                    }
                }
                if (toAdd.length > 0) {
                    this.select.addOption(toAdd);
                }
                if (toUpdate.length > 0) {
                    this.select.updateOption(toUpdate);
                }
                while (this.select.options.length > levelCount) {
                    this.select.removeOption(this.select.options.length - 1);
                }
                this.select.set("value", this._state.selectedComparison.toString());
            }
        },

        _createComboBox: function (parent) {
            var _this = this;
            domClass.add(parent, "BaseSelectComparison_Select");
            this.select = new Select({
                maxHeight: 151,
                onChange: function () {
                    var old = _this._state.selectedComparison;
                    _this._state.selectedComparison = +_this.select.get("value");
                    if (_this._state.selectedComparison != old) {
                        _this.updateUIExpanded();
                    }
                }
            });
            this.select.placeAt(parent);
        },

        _getComparisonRow: function () {
            var index = this._state.selectedComparison;
            if (index >= 0) {
                return index + 1;
            } else {
                return undefined;
            }
        },

        destroy: function () {
            if (this.select) {
                this.select.destroy();
                this.select = null;
            }
            this.inherited(arguments);
        }
    });

    return BaseSelectComparison;
});
