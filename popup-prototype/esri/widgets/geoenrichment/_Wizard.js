define([
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dijit/_WidgetBase",
    "dojo/dom-construct",
    "dijit/layout/ContentPane",
    "./AnimationHelper"

], function (declare, lang, on, _WidgetBase, domConstruct, ContentPane, AnimationHelper) {

    var _Wizard = declare("esri.widgets.geoenrichment._Wizard", [_WidgetBase], {

        _currentPage: null,
        _anim: null,

        pages: null,

        //
        // Stacking strategy of the wizard:
        //
        // "stretch" - bottom panel will always be botton-align and center panel will be 
        // stretched to fit the space in between. This is the default.
        //
        // "stack" - center panel will be sized to content and bottom panel will be stacked right
        // below the center panel. Scroll will show up in the center panel if contents are too 
        // big in height.
        //
        stacking: "stretch",

        constructor: function () {
            this.pages = {};
            this._anim = new AnimationHelper();
        },

        buildRendering: function () {
            this.domNode = domConstruct.create("div", { "class": "_Wizard_Root" });
        },

        loadPage: function (pageId) {
            var page = this.pages[pageId];
            var oldPage = this._currentPage;
            if (page === oldPage) {
                return;
            }
            this._anim.finish();
            if (oldPage) {
                this._animPage("Anim_FadeOut").then(lang.hitch(this.domNode, "removeChild", oldPage.domNode));
            }
            this._currentPage = page;
            this.domNode.appendChild(this._currentPage.domNode);
            if (oldPage) {
                this._animPage("Anim_FadeIn");
            }
            if (!page._started) {
                page.set("stacking", this.stacking);
                page.startup();
            }
            else {
                page.resize();
            }
        },

        _animPage: function (fadeClass) {
            return this._anim.start([{
                node: this._currentPage.domNode,
                classes: [fadeClass, "Wizard_FadeAnim"]
            }]);
        },

        resize: function () {
            if (this._currentPage) {
                this._currentPage.resize();
            }
        },

        addButtons: function (pageId, buttons) {
            var page = this.pages[pageId];
            var i;
            if (!page.buttonsNode) {
                var pane;
                var children = page.layoutGrid.getChildren();
                for (i = 0; i < children.length; i++) {
                    if (children[i].row == 2) {
                        pane = children[i];
                    }
                }
                if (!pane) {
                    pane = new ContentPane({ row: 2, "class": "Wizard_BottomPane" });
                    page.layoutGrid.addChild(pane);
                }
                page.buttonsNode = domConstruct.create("div", { "class": "Wizard_Buttons" }, pane.domNode);
            }

            var result = {};
            for (i = 0; i < buttons.length; i++) {
                var button = domConstruct.create("button", { "class": "Wizard_Button", innerHTML: buttons[i].label }, page.buttonsNode);
                if (buttons[i].id) {
                    result[buttons[i].id] = button;
                }
                on(button, "click", buttons[i].onClick);
            }
            return result;
        },

        destroy: function () {

            for (var id in this.pages) {
                if (this.hasOwnProperty(id)) {
                    this.pages[id].destroyRecursive();
                }
            }

            this.pages = {};

            this.inherited(arguments);
        }

    });

    return _Wizard;
});