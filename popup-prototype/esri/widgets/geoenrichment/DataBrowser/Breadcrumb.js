define([
    "../../../core/declare",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/when",
    "dojox/mvc/Templated",
    "dojo/text!./templates/Breadcrumb.html"
], function (
    declare,
    lang,
    domClass,
    when,
    Templated,
    template
) {
    return declare([Templated], {
        templateString: template,

        flyAnim: null,

        selectCategory: function (category) {
            this._hideCategory();
            if (category) {
                when(this.flyAnim.progress, lang.hitch(this, this._showCategory, category));
            }
            this._hideDataCollection();
        },

        _hideCategory: function () {
            this.dcIcon.className = "";
            this.dcIcon.style.display = "none";
            this.connect1.style.display = "none";
            this.angConnect1.style.display = "none";
            this.connect1andHalf.style.display = "none";
        },

        _showCategory: function (category) {
            this.dcIcon.className = "Breadcrumb_DataCollections DataCategoriesPage_Item_" + category.id.replace(/ /g, "_");
            this.dcIcon.style.display = "";
            this.connect1.style.display = "";
            this.angConnect1.style.display = "";
            this.connect1andHalf.style.display = "none";
        },

        selectDataCollection: function (label, category) {
            this.angConnect1.style.display = "none";
            this._hideDataCollection();
            if (label) {
                when(this.flyAnim.progress, lang.hitch(this, this._showDataCollection, label, category));
            }
        },

        _hideDataCollection: function(){
            this.varsNode.style.display = "none";
            this.connect2.style.display = "none";
            this.angConnect2.style.display = "none";
            this.connect1andHalf.style.display = "none";
        },

        _showDataCollection: function (label, category) {
            if (!category) {
                this.dcIcon.style.display = "none";
                this.connect1.style.display = "";
                this.connect1andHalf.style.display = "";
            }

            this.varsNode.style.display = "";
            this.varsLabel.innerHTML = label;
            this.connect2.style.display = "";
            this.angConnect2.style.display = "";
            domClass.add(this.dcIcon, "DataBrowser_Clickable");
        },

        _onCategoriesClick: function () {
            this.onCategoriesClick();
        },
        onCategoriesClick: function () { },

        _onDCsClick: function () {
            this.onDCsClick();
        },
        onDCsClick: function () { }
    });
});