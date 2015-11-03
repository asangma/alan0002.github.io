define([
	"../../core/declare",
    "dojo/string",
    "dojo/dom-class",
    "dojox/mvc/Templated",
    "dojo/text!./templates/_WizardPage.html",
    "./Grid"

], function (declare, string, domClass, Templated, template, Grid) {

    var states = {
        "busy": "Wizard_Loading",
        "done": "Wizard_Done",
        "error": "Wizard_Error"
    };

    return declare("esri.widgets.geoenrichment._WizardPage", [Templated], {

        buttonsNode: null,
        progressPromises: null,

        buildRendering: function () {

            //
            //When Dojo Build inlines HTML templates, it keeps UTF-8 BOM. Fixing this otherwise BOM appears
            //in the middle of HTML template which causes browser to inject empty text node that breaks
            //the layout sometimes
            //
            var pageTemplate = this.templateString;
            if (pageTemplate.length > 0 && pageTemplate[0] == "\ufeff") {
                pageTemplate = pageTemplate.substr(1);
            }

            this.templateString = string.substitute(template, { content: pageTemplate });

            this.inherited(arguments);

            this.layoutGrid.rows = [Grid.AUTO, Grid.AUTO, Grid.AUTO];
        },

        resize: function () {
            this.layoutGrid.resize();
        },

        _setStackingAttr: function (stacking) {
            switch (stacking) {
                case "stretch":
                    this.layoutGrid.rows[1] = Grid.STRETCH;
                    break;
                case "stack":
                    this.layoutGrid.rows[1] = Grid.STACK;
                    break;
            }
        },

        showProgress: function (promise, method) {
            if (!this.progressPromises) {
                this.progressPromises = {};
            }
            var id;
            if (typeof method == "string" || method instanceof String) {
                id = method;
            }
            else {
                id = Math.random().toString();
            }
            if (this.progressPromises[id]) {
                this.progressPromises[id].cancel();
            }

            var resolvedInAdvance = promise.isResolved();
            var self = this;
            if (!resolvedInAdvance) {
                this.progressPromises[id] = promise;
                promise.always(function () {
                    delete self.progressPromises[id];
                });
                this._setState("busy");
            }
            promise.then(
                function () {
                    var func = method instanceof Function ? method : self[method];
                    func.apply(self, arguments);
                    if (!resolvedInAdvance) {
                        self._setState("done");
                    }
                },
                function (error) {
                    if (error.name == "CancelError") {
                        if (!resolvedInAdvance) {
                            self._setState("done");
                        }
                    }
                    else {
                        self._setState("error", error.toString());
                    }
                });
        },

        cancelProgress: function (id) {
            var promise = this.progressPromises && this.progressPromises[id];
            if (promise) {
                promise.cancel();
            }
        },

        _setState: function (state, message) {
            if (!this.progressDiv) {
                return;
            }
            this.progressDiv.innerHTML = message || "";
            for (var s in states) {
                if (s == state) {
                    domClass.add(this.progressDiv, states[s]);
                }
                else {
                    domClass.remove(this.progressDiv, states[s]);
                }
            }
        },

        destroy: function () {
            if (this.progressPromises) {
                for (var id in this.progressPromises) {
                    if (id.hasOwnProperty(id)) {
                        this.progressPromises[id].cancel();
                    }
                }
                this.progressPromises = null;
            }

            this.inherited(arguments);
        }

    });
});