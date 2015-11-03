define([
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/_base/lang",
    "dojox/mvc/Templated",
	"dojo/on",
    "../../../core/declare",
    "dijit/_WidgetBase",
    "dojo/text!./templates/ShoppingCart.html",
    "dgrid/List",
    "dojo/i18n!../../../nls/jsapi"

], function (
    domConstruct,
    domAttr,
    lang,
    Templated,
    on,
    declare,
    _WidgetBase,
    template,
    List,
    nls) {
    nls = nls.geoenrichment.dijit.ShoppingCart;

    var ShoppingCart = declare("esri.widgets.geoenrichment.ShoppingCart", [_WidgetBase, Templated], {
        nls: nls,
        templateString: template,
        list: null,
        content: null,

        constructor: function () {
            this.content = {};
        },

        buildRendering: function () {
            this.inherited(arguments);
            on(this.divList, "click, touchend", lang.hitch(this, this._stopEvent));
        },

        displayCounter: function () {
            this.divCounter.innerHTML = this.contentLength().toString();
        },

        contentLength: function () {
            var l = 0;
            for (var v in this.content) {
                if (this.content.hasOwnProperty(v)) {
                    l++;
                }
            }
            return l;
        },

        startup: function () {
            this.inherited(arguments);
            
            this.list = new List({ renderRow: lang.hitch(this, this.renderVariableRow)}, this.divList);
            this.list.startup();

            this.displayCounter();
            this.divOuter.style.display = "none";
        },

        renderVariableRow: function (variable) {
            var divOuter = domConstruct.create("div", { "class": "ShoppingCartRowOuter" });
            var div = domConstruct.create("div", { "class": "ShoppingCartRow"}, divOuter);
            domConstruct.create("div", { "class": "TrimWithEllipses ShoppingCartRowLabel", innerHTML: variable.alias }, div);
            var closer = domConstruct.create("div", { "class": "ShoppingCartRowCloser" }, div);
            domAttr.set(closer, "idDesc", variable.idDesc);
            on(closer, "click", lang.hitch(this, this.onClick));
            return divOuter;
        },

        onClick: function (event) {
            delete this.content[event.currentTarget.attributes.idDesc.value];

            this.onRemoveElement(event.currentTarget.attributes.idDesc.value);
            this.refresh();
        },

        _showList: function (event) {
            if (this.divOuter.style.display === "none") {
                this._stopEvent(event);
                this._displayList();
            }
        },

        _toggleList: function (event) {
            this._stopEvent(event);
            if (this.divOuter.style.display === "none") {
                this._displayList();
            } else {
                this._hideList();
            }

        },

        _displayList: function () {
            this.refresh();
            this.divOuter.style.display = "";
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            on.once(this.divOuter, "mouseleave", lang.hitch(this, this._hideList));
            on.once(document, "click", lang.hitch(this, this._hideList));
        },

        _hideList: function () {
            if (this.divOuter) {
                this.divOuter.style.display = "none";
            }
        },

        _stopEvent: function (event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
        },

        addVariable: function (variable) {

            var already = false;

            if (!this.content[variable.idDesc]) {
                this.content[variable.idDesc] = variable;
                this.displayCounter();
                this.onSelect();
            }
            return !already;
        },

        setVariables: function (variables) {
            this.content = {};
            for (var i = 0; i < variables.length; i++) {
                this.content[variables[i].idDesc] = variables[i];
            }
            this.displayCounter();
        },

        addVariables: function (variables) {
            for (var i = 0; i < variables.length; i++) {
                this.content[variables[i].idDesc] = (variables[i]);
            }

            this.displayCounter();

            this.onSelect();
        },

        removeVariable: function (idDesc) {

            delete this.content[idDesc];
            this.displayCounter();
        },

        refresh: function () {
            var contentArray = [];

            for (var idDesc in this.content) {
                if (this.content.hasOwnProperty(idDesc)) {
                    contentArray.push(this.content[idDesc]);
                }
            }

            this.list.refresh();
            this.list.renderArray(contentArray);
            this.displayCounter();
            this.divEmpty.style.visibility = contentArray.length === 0 ? "visible" : "hidden";
        },

        collectSelection: function () {
            var selection = [];

            for (var idDesc in this.content) {
                if (this.content.hasOwnProperty(idDesc)) {
                    selection.push(this.content[idDesc].id2);
                }
            }
            return selection;
        },

        onRemoveElement: function (idDesc) { },

        onSelect: function () { }
    });

    return ShoppingCart;

});
