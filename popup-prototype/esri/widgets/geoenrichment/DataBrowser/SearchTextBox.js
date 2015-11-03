define([
    "../../../core/declare",
    "dojo/_base/lang",
	"dojo/dom-construct",
    "dojo/dom-class",
    "dojo/on",
    "dojo/keys",
    "dijit/Tooltip",
    "dijit/form/TextBox"
], function (
    declare,
    lang,
    domConstruct,
    domClass,
    on,
    keys,
    Tooltip,
    TextBox
    ) {
    var SearchTextBox = declare([TextBox], {

        prompt: "",

        _trueValue: "",

        buildRendering: function () {
            this.inherited(arguments);

            domClass.add(this.domNode, "SearchTextBox");

            var searchNode = domConstruct.create("div", { "class": "SearchTextBox_SearchBox" }, this.domNode);
            on(searchNode, "click", lang.hitch(this, this._onSearch));

            //Workaround. After click Enter button in TextBox into wizard, it clicks wizard's button.
            on(this, "keypress", lang.hitch(this, this._stopEvent));

            this._onBlur(null);
        },

        showTooltip: function (message) {
            Tooltip.show(message, this.textbox, ["above", "below"]);
        },


        _stopEvent: function (e) {
            if (e.charOrCode && e.charOrCode === 13) {
                e.stopPropagation();
                e.preventDefault();
            }
        },


        _setPromptMessageAttr: function (value) {
            this.prompt = value;
            if ((!this._trueValue || this._trueValue.length === 0) || (!this.textbox.value || this.textbox.value.length === 0)) {
                this._setDisplayedValueAttr(this.prompt);
                domClass.add(this.textbox, "SearchTextBox_PromptMode");
            }
        },

        _onFocus: function (by) {
            if (!this._trueValue || this._trueValue.length === 0) {
                domClass.remove(this.textbox, "SearchTextBox_PromptMode");
            }
            this._setDisplayedValueAttr(this._trueValue);
            this.inherited(arguments);
        },

        _onBlur: function (e) {
            Tooltip.hide(this.textbox);
            this._trueValue = this._getValueAttr();
            if (!this._trueValue || this._trueValue.length === 0) {
                this._setDisplayedValueAttr(this.prompt);
                domClass.add(this.textbox, "SearchTextBox_PromptMode");
            }
            this.inherited(arguments);
        },

        _onInput: function (e) {
            Tooltip.hide(this.textbox);
            if (e.keyCode == keys.ENTER) {
                this._onSearch();
            }
            this.inherited(arguments);
        },

        _onSearch: function () {
            this.onSearch();
        },
        onSearch: function () { }
    });

    return SearchTextBox;
});
