define([
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/Stateful",
    "dojo/number",
    "dojo/string",
    "dojo/aspect",
    "./_WizardPage",
    "dojo/i18n!../../nls/jsapi",
    "dojo/text!./templates/EnrichOptionsPage.html",
    "../../tasks/geoenrichment/RingBuffer",
    "../../tasks/geoenrichment/DriveBuffer",
    "./BufferOptions",
    "dojox/html/entities",
    "./_Invoke",
    "dgrid/OnDemandGrid",
    "dgrid/extensions/DijitRegistry",
    "dojo/store/Memory",
    "dojo/data/ObjectStore",
    "dgrid/Tree",
    "dijit/form/Select",
    "dijit/form/CheckBox",
    "dojox/mvc/sync",
    "./config",
    "../../request",
    "./lang",
    "dijit/registry",

    "dijit/layout/ContentPane",
    "dijit/form/NumberSpinner",
    "dijit/form/RadioButton"

], function (
    declare,
    lang,
    domConstruct,
    domClass,
    Stateful,
    number,
    string,
    aspect,
    _WizardPage,
    nls,
    template,
    RingBuffer,
    DriveBuffer,
    BufferOptions,
    entities,
    _Invoke,
    OnDemandGrid,
    DijitRegistry,
    Memory,
    ObjectStore,
    Tree,
    Select,
    CheckBox,
    sync,
    config,
    request,
    esriLang,
    registry
) {
    nls = nls.geoenrichment.dijit.EnrichOptionsPage;

    var NO_COLUMN = "_";

    var ViewStore = declare([ObjectStore], {

        getChildren: function (view) {
            return view.getChildren();
        },

        mayHaveChildren: function (view) {
            return !!view.getChildren;
        }

    });

    var ItemView = declare([Stateful], {

        checked: true,

        getLabel: function () { },

        getClass: function () {
            return "";
        }

    });

    var FieldCategoryView = declare([ItemView], {

        _children: null,
        _updateChildren: true,
        _label:null,

        constructor: function (fieldCategoryName, fieldCategory, page) {
            this.set("id2", fieldCategoryName);
            this._label = fieldCategoryName;
            this._children = [];
            var onChildChecked = lang.hitch(this, this._onChildChecked);
            for (var i = 0; i < fieldCategory.length; i++) {
                var varView = new VariableView(fieldCategory[i], page);
                varView.watch("checked", onChildChecked);
                this._children.push(varView);
            }
        },

        _checkedSetter: function (checked) {
            if (this.checked == checked) {
                return;
            }
            this.checked = checked;

            if (this._updateChildren && this._children) {
                for (var i = 0; i < this._children.length; i++) {
                    this._children[i].set("checked", this.checked);
                }
            }
        },

        _onChildChecked: function (name, oldValue, value) {
            if (oldValue == value) {
                return;
            }
            var anyChecked = false;
            for (var i = 0; i < this._children.length; i++) {
                if (this._children[i].get("checked")) {
                    anyChecked = true;
                    break;
                }
            }
            this._updateChildren = false;
            this.set("checked", anyChecked);
            this._updateChildren = true;
        },

        getLabel: function () {
            return this._label;
        },

        getChildren: function () {
            return this._children;
        }

    });

    var VariableView = declare([ItemView], {

        mapTo: null,

        _page: null,

        constructor: function (variable, page) {
            this._page = page;
            this.id2 = variable.id2;
            this.mapTo = variable.mapTo;
        },

        _checkedSetter: function (value) {
            if (this.checked == value) {
                return;
            }
            this.checked = value;
            this._page.invoke("_updateTotalVars");
        },

        _mapToSetter: function (value) {
            if (this.mapTo == value) {
                return;
            }
            this.mapTo = value;
            this._page.invoke("_updateTotalVars");
        },

        getLabel: function () {
            return this.alias;
        },

        getClass: function () {
            return "EnrichOptionsPage_VariableCheckbox";
        },

        getOptions: function () {
            var options = [],
                checkFieldType = this._page.allowFieldTypeMismatch !== true;

            options.push({
                value: NO_COLUMN,
                label: entities.encode(this._page.allowNewColumns ? nls.newColumn : nls.noColumn)
            });
            if (this._page.fields) {
                for (var i = 0; i < this._page.fields.length; i++) {
                    var field = this._page.fields[i];
                    if (checkFieldType && field.type && field.type != this.type) {
                        var allowed = false;
                        if (field.type == "esriFieldTypeInteger" && this.type == "esriFieldTypeDouble" && this.precision === 0) {
                            allowed = true; //it is legal to write 0-precision doubles to integer field
                        }
                        else if (this.type == "esriFieldTypeInteger" && field.type == "esriFieldTypeDouble") {
                            allowed = true; //it is legal to write integers to double field
                        }
                        if (!allowed) {
                            continue;
                        }
                    }
                    options.push({
                        value: field.id,
                        label: entities.encode(field.label || field.id)
                    });
                }
            }
            return options;
        }

    });

    var CustomGrid = declare([OnDemandGrid, DijitRegistry], {

        removeRow: function (rowElement, justCleanup) {
            var dijits = registry.findWidgets(rowElement);
            if (dijits) {
                for (var i = 0; i < dijits.length; i++) {
                    dijits[i].destroy();
                }
            }
            this.inherited(arguments);
        }

    });

    var EnrichOptionsPage = declare("esri.widgets.geoenrichment.EnrichOptionsPage", [_WizardPage, _Invoke], {
        templateString: template,
        nls: nls,

        geomType: null,
        buffer: null,
        fields: null,
        allowNewColumns: true,
        dataCollections: null,
        studyAreaCount: null,
        title: null,

        _bufferOptions: null,
        _fieldSelects: null,

        _grid: null,
        _model: null,

        _eventMap: {
            "back": true,
            "finish": true
        },

        constructor: function () {
            this.buffer = new RingBuffer();
        },

        _setGeomTypeAttr: function (geomType) {
            this._set("geomType", geomType);

            switch (this.geomType) {
                case "esriGeometryPolygon":
                    this.bufferEdit.style.display = "none";
                    this.bufferString.innerHTML = nls.bufferPolygon;
                    break;

                case "esriGeometryPoint":
                    this.bufferEdit.style.display = "";
                    this.bufferString.innerHTML = nls.bufferRing;
                    break;

                case "esriGeometryPolyline":
                    this.bufferEdit.style.display = "";
                    this.bufferString.innerHTML = nls.bufferRing;
                    break;
            }
        },

        _setFieldsMapAttr: function (fieldsMap) {

            var names = [];
            var fieldCategories = {};

            for (var i = 0; i < this.dataCollections.length; i++) {
                var dataCollection = this.dataCollections[i];
                for (var j = 0; j < dataCollection.variables.length; j++) {
                    var variable = dataCollection.variables[j];
                    variable.id2 = dataCollection.id + "." + variable.id;
                    var mapTo = fieldsMap[variable.id2];
                    if (lang.isString(mapTo)) {
                        variable.mapTo = mapTo;
                        var category = variable.fieldCategory;
                        var categoryArray = fieldCategories[category];
                        if (!categoryArray) {
                            categoryArray = fieldCategories[category] = [];
                        }
                        categoryArray.push(variable);
                        names.push(variable.description);
                    }
                }
            }

            this._model = [];

            for (var fieldCategory in fieldCategories) {
                if (fieldCategories.hasOwnProperty(fieldCategory)) {
                    this._model.push(new FieldCategoryView(
                        fieldCategory,
                        fieldCategories[fieldCategory],
                        this
                    ));
                }
            }

            this.dataCollectionNames.innerHTML = names.join(", ");
            this.dataCollectionNames.title = names.join("\n");

            var memory = new Memory({
                data: this._model,
                idProperty: "id2"
            });

            var store = new ViewStore(memory);

            if (!this._grid) {
                var columns = [
                    Tree({
                        label: " ",
                        field: "expander",
                        shouldExpand: lang.hitch(this, this._shouldExpand)
                    }),
                    {
                        label: nls.varName,
                        field: "varName",
                        sortable: false,
                        renderCell: lang.hitch(this, this._renderCheckBox)
                    }];

                if (this.fields) {
                    columns.push({
                        label: nls.column,
                        field: "column",
                        sortable: false,
                        renderCell: lang.hitch(this, this._renderSelect)
                    });
                }

                this._grid = new CustomGrid({
                    store: store,
                    columns: columns

                }, this.fieldsDiv);

                aspect.after(this._grid, "expand", lang.hitch(this, this.invoke, "resize"));

                this._grid.startup();
            }
            else {
                this._grid.set("store", store);
            }
            this.invoke("_updateTotalVars");
        },

        _shouldExpand: function (row, level, previouslyExpanded) {
            if (previouslyExpanded !== undefined) {
                return previouslyExpanded;
            }
            return this._model.length == 1;
        },

        _renderCheckBox: function (object, value, node, options) {
            var check = new CheckBox();
            var text = object.getLabel();
            sync(object, "checked", check, "checked");
            var label = domConstruct.create("label", { "class": "EnrichOptionsPage_TrimWithEllipsis EnrichOptionsPage_CheckboxLabel", title: text });
            domClass.add(label, object.getClass());
            check.placeAt(label);
            domConstruct.create("span", { innerHTML: text }, label);
            return label;
        },

        _renderSelect: function (object, value, node, options) {
            if (object.getOptions) {
                var select = new Select({
                    options: object.getOptions(),
                    maxHeight: 151
                });
                sync(object, "mapTo", select, "value", {
                    converter: {
                        format: function (value) {
                            return value || NO_COLUMN;
                        },
                        parse: function (value) {
                            return value != NO_COLUMN ? value : null;
                        }
                    }
                });
                return select.domNode;
            }
        },

        _updateTotalVars: function () {
            var self = this;
            var count = 0;
            var overwriting = false;
            this._enumCheckedVars(function (dc, v) {
                count++;
                if (v.mapTo) {
                    overwriting = true;
                }
            });
            this.overwriteExisting.style.visibility = overwriting ? "visible" : "hidden";
            this.finishButton.disabled = count === 0;

            //
            //Calculate "enrich" cost estimate
            //
            var restParams = {
                enrichVariableCount: count,
                f: "json"
            };
            if (this.get("buffer") instanceof DriveBuffer) {
                restParams.serviceAreaCount = 1;
            }
            var labelFormat, tooltipFormat, rowCount;
            if (this.studyAreaCount) {
                labelFormat = nls.totalVars;
                tooltipFormat = nls.totalVarsTooltip;
                rowCount = this.studyAreaCount;
            } else {
                labelFormat = nls.varsPerRow;
                tooltipFormat = nls.varsPerRowTooltip;
                rowCount = 1;
            }
            if (config.token) {
                restParams.token = config.token;
            }

            function setLabel(credits, tooltip) {
                if (esriLang.isNumber(credits)) {
                    credits = string.substitute(nls.credits, { credits: number.format(credits) });
                }
                var map = { varCount: count, rowCount: rowCount, credits: credits };
                self.totalVars.innerHTML = string.substitute(labelFormat, map);
                if (tooltip === undefined) {
                    tooltip = string.substitute(tooltipFormat, map);
                }
                self.totalVars.title = tooltip;
            }

            var portalUrl = config.portalUrl;
            if (portalUrl.indexOf("://") < 0) {
                portalUrl = window.location.protocol + "//" + portalUrl;
            }

            setLabel(nls.creditsCalc, "");
            request({
                url: portalUrl + "/sharing/rest/portals/self/cost",
                content: restParams
            }).then(function (result) {
                setLabel(result.transactionCreditCost * rowCount);
            }, function (error) {
                setLabel("error", error.toString());
            });
        },

        _getBufferAttr: function () {
            if (this._bufferOptions) {
                return this._bufferOptions.get("buffer");
            }
            else {
                return this.buffer;
            }
        },

        _setBufferAttr: function (buffer) {
            this._set("buffer", buffer);
            if (this._bufferOptions) {
                this._bufferOptions.set("buffer", buffer);
            }
        },

        _editBuffer: function () {
            domConstruct.destroy(this.bufferDiv);
            this.bufferEditDiv.style.display = "";
            this._bufferOptions = new BufferOptions({
                buffer: this.buffer,
                onChange: lang.hitch(this, this.invoke, "_updateTotalVars")
            });
            this.buffer = undefined;
            this._bufferOptions.placeAt(this.bufferEditDiv);
            this.resize();
        },

        _getFieldsMapAttr: function () {
            var map = {};
            this._enumCheckedVars(function (dc, v) {
                map[v.id2] = v.mapTo || "";
            });
            return map;
        },

        _enumCheckedVars: function (callback) {
            for (var i = 0; i < this._model.length; i++) {
                var vars = this._model[i].getChildren();
                for (var j = 0; j < vars.length; j++) {
                    if (!vars[j].checked) {
                        continue;
                    }
                    if (!this.allowNewColumns && !vars[j].mapTo) {
                        continue;
                    }
                    callback(this._model[i], vars[j]);
                }
            }
        },

        _back: function () {
            this.onBack();
        },
        onBack: function () { },

        _finish: function () {
            this.onFinish();
        },
        onFinish: function () { }

    });

    return EnrichOptionsPage;
});
