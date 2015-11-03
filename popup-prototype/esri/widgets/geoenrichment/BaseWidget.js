define([
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/Evented",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/string",
    "./dom",
    "dojo/on",
    "./lang",
    "dijit/Destroyable",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "./formatVariable"
], function (declare, lang, Evented, domConstruct, domAttr, domClass, string, dom, on, esriLang, Destroyable, BorderContainer, ContentPane, formatVariable) {

    function comparer(a, b, desc) {
        if (a > b) {
            return desc ? -1 : 1;
        } else if (a < b) {
            return desc ? 1 : -1;
        } else {
            return 0;
        }
    }

    var BaseWidget = declare("esri.widgets.geoenrichment.BaseWidget", [Evented], {

        data: null, /*FeatureSet*/
        metadata: null,
        parent: null,
        dataEvents: null,
        _state: null,
        expanded: true,
        title: null,
        titleDiv: null,
        subtitle: null,
        subtitleDiv: null,

        constructor: function (parent) {
            if (!parent) {
                throw "Parent HTML element was not specified";
            }
            this._state = {
                sortBy: 0,
                sortDesc: false
            };
            this.parent = parent;
        },

        setDataProvider: function (dataProvider) {
            this._destroyDataEvents();
            if (!dataProvider) {
                return;
            }
            this.feedData(dataProvider);
            this.dataEvents = new Destroyable();
            this.dataEvents.own(dataProvider.on("data", lang.hitch(this, this.feedData, dataProvider)));
        },

        _destroyDataEvents: function () {
            if (this.dataEvents) {
                this.dataEvents.destroy();
                this.dataEvents = null;
            }
        },

        feedData: function (dataProvider) {
            this.data = dataProvider.getData();
            if (this.data) {
                this.metadata = dataProvider.metadata;
                this.update();
            }
        },

        destroy: function (keepDataEvents) {
            if (!keepDataEvents) {
                this._destroyDataEvents();
            }
            if (this.ui) {
                this.ui.destroy();
                this.ui = null;
            }
        },

        updateUI: function () {
            if (this.sortTriangles) {
                for (var i in this.sortTriangles) {
                    if (this._state.sortBy == +i) {
                        if (this._state.sortDesc) {
                            this.sortTriangles[i].innerHTML = "&#9660;";
                        } else {
                            this.sortTriangles[i].innerHTML = "&#9650;";
                        }
                    } else {
                        this.sortTriangles[i].innerHTML = "";
                    }
                }
            }
            if (!this.title) {
                this.titleDiv.innerHTML = "";
                this.titleDiv.style.display = "none";
            } else {
                this.titleDiv.innerHTML = this.title;
                this.titleDiv.style.display = "";
            }

            //
            //Construct subtitle
            //
            if (!this.subtitle) {
                this.subtitleDiv.innerHTML = "";
                this.subtitleDiv.style.display = "none";
            }
            else {
                var map = {};
                var attrs = this.data.features[0].attributes;
                var meta = this.metadata;
                for (var prop in meta) {
                    if (meta.hasOwnProperty(prop)) {
                        map[prop] = attrs[meta[prop]] || "";
                    }
                }
                this.subtitleDiv.innerHTML = string.substitute(this.subtitle, map);
                this.subtitleDiv.style.display = "";
            }
        },

        updateUIExpanded: function () {
            this.updateUI();
        },

        updateUICollapsed: function () {
            this.updateUI();
        },

        createUI: function (builder) {
            this.titleDiv = builder.addHeader("div", { "class": "BaseWidget_Title" });
            this.subtitleDiv = builder.addHeader("div", { "class": "BaseWidget_Subtitle" });
        },

        createUIExpanded: function (builder) {
            this.createUI(builder);
        },

        createUICollapsed: function (builder) {
            this.createUI(builder);
        },

        createUIPrivate: function () {
            var builder = new UIBuilder();
            if (this.expanded) {
                this.createUIExpanded(builder);
            }
            else {
                this.createUICollapsed(builder);
            }
            this.ui = builder.build(this.parent);
        },

        updateUIPrivate: function () {
            if (this.expanded) {
                this.updateUIExpanded();
            } else {
                this.updateUICollapsed();
            }
            this.resize();
            on.emit(this, "resize", [
                this.parent.scrollWidth,
                this.parent.scrollHeight
            ]);
        },

        resize: function () {
            if (this.ui) {
                this.ui.resize();
            }
        },

        update: function () {
            if (!this.data || !this._state) {
                return;
            }
            if (!this.ui) {
                domClass.add(this.parent, "WidgetBack");
                this.createUIPrivate();
            }
            this.updateUIPrivate();
        },

        _appendSortHeader: function (tr, label, sortIndex, attrs) {
            var td = tr.insertCell(-1);
            for (var attr in attrs) {
                if (attrs.hasOwnProperty(attr)) {
                    domAttr.set(td, attr, attrs[attr]);
                }
            }
            var link = domConstruct.create("span", {
                "class": "SortLink",
                innerHTML: label
            }, td);
            link.onclick = lang.hitch(this, this.sortBy, sortIndex);
            dom.text(link, " ");
            if (!this.sortTriangles) {
                this.sortTriangles = [];
            }
            this.sortTriangles[sortIndex] = domConstruct.create("span", {
                "class": "SortArrow"
            }, link);
        },

        sortBy: function (colIndex) {
            if (this._state.sortBy == colIndex) {
                this._state.sortDesc = !this._state.sortDesc;
            } else {
                this._state.sortDesc = false;
            }
            this._state.sortBy = colIndex;
            this.updateUIPrivate();
        },

        _sortRows: function (rows) {
            var by = this._state.sortBy;
            if (esriLang.isNumber(by)) {
                var desc = this._state.sortDesc;
                rows.sort(function (row1, row2) {
                    return comparer(row1[by], row2[by], desc);
                });
            }
        },

        getFeatureTitle: function (index) {
            return this.data.features[index].attributes[this.metadata.name];
        },

        getValueByName: function (featureIndex, fieldName) {
            return this.data.features[featureIndex].attributes[fieldName];
        },

        getValueByIndex: function (featureIndex, fieldIndex) {
            return this.getValueByName(featureIndex, this.getFieldByIndex(fieldIndex).name);
        },

        formatByName: function (featureIndex, fieldName) {
            return formatVariable(this.getFieldByName(fieldName), this.data.features[featureIndex].attributes[fieldName]);
        },

        formatByIndex: function (featureIndex, fieldIndex) {
            var field = this.getFieldByIndex(fieldIndex);
            return formatVariable(field, this.data.features[featureIndex].attributes[field.name]);
        },

        getDataFields: function () {
            var indexes = [];
            var length = this.data.fields.length;
            for (var i = 0; i < length; i++) {
                var fullName = this.data.fields[i].fullName;
                if (fullName && fullName != "AREA_ID") {
                    indexes.push(i);
                }
            }
            return indexes;
        },

        getFieldByName: function (fieldName) {
            var length = this.data.fields.length;
            for (var i = 0; i < length; i++) {
                var field = this.data.fields[i];
                if (field.name == fieldName) {
                    return field;
                }
            }
        },

        getFieldByIndex: function (fieldIndex) {
            return this.data.fields[fieldIndex];
        },

        setState: function (options) {
            lang.mixin(this._state, options);
        },

        getState: function (key) {
            return this._state ? this._state[key] : null;
        }
    });

    var UIBuilder = declare(null, {

        headerClass: null,
        contentClass: null,
        footerClass: null,

        constructor: function () {
            this.headerClass = [
                "BaseWidget_HeaderPane"
            ];
            this.contentClass = [
                "BaseWidget_ContentPane"
            ];
            this.footerClass = [
                "BaseWidget_FooterPane"
            ];
        },

        addHeader: function (tagName, attrs) {
            if (!this.header) {
                this.header = document.createDocumentFragment();
            }
            return domConstruct.create(tagName, attrs, this.header);
        },

        addContent: function (tagName, attrs) {
            if (!this.content) {
                this.content = document.createDocumentFragment();
            }
            return domConstruct.create(tagName, attrs, this.content);
        },

        addFooter: function (tagName, attrs) {
            if (!this.footer) {
                this.footer = document.createDocumentFragment();
            }
            return domConstruct.create(tagName, attrs, this.footer);
        },


        build: function (parent) {
            this.border = new BorderContainer({
                style: "height: 100%; width: 100%;",
                gutters: false
            });
            this._append("top", this.header, this.headerClass);
            this._append("center", this.content, this.contentClass);
            this._append("bottom", this.footer, this.footerClass);
            parent.appendChild(this.border.domNode);
            return this.border;
        },

        _append: function (region, fragment, classes) {
            if (!fragment) {
                return;
            }
            var className;
            if (classes && classes.length > 0) {
                className = classes.join(" ");
            }
            this.border.addChild(new ContentPane({
                region: region,
                content: fragment,
                "class": className
            }));
        }

    });

    return BaseWidget;
});
