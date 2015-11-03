define([

    "../../core/declare"

], function (declare) {

    return declare("esri.widgets.geoenrichment._Invoke", null, {

        _invokeTimeoutIDs: null,

        invoke: function (methodName, timeout) {
            if (!this._invokeTimeoutIDs) {
                this._invokeTimeoutIDs = {};
            }
            else if (this._invokeTimeoutIDs[methodName]) {
                if (timeout === undefined) {
                    return;
                }
                else {
                    clearTimeout(this._invokeTimeoutIDs[methodName]);
                }
            }
            var self = this;
            this._invokeTimeoutIDs[methodName] = setTimeout(function () {
                self._invokeTimeoutIDs[methodName] = 0;
                self[methodName]();
            }, timeout || 0);
        },

        pendingInvoke: function (methodName) {
            if (!this._invokeTimeoutIDs) {
                return false;
            }
            return this._invokeTimeoutIDs[methodName];
        },

        cancelInvoke: function (methodName) {
            if (!this._invokeTimeoutIDs) {
                return;
            }
            var id = this._invokeTimeoutIDs[methodName];
            if (id) {
                clearTimeout(id);
                this._invokeTimeoutIDs[methodName] = 0;
            }
        }

    });

});