define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/_base/event",
  "dojo/has",
  "dojo/dom-class",
  "dojo/dom-attr",
  "dojo/dom-style",
  
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_FocusMixin",
  
  "../../kernel",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/AnalysisToolItem.html"
  
],

function(require, declare, lang, connection, event, has, domClass, domAttr, domStyle,  _WidgetBase, _TemplatedMixin, _OnDijitClickMixin, _FocusMixin, esriKernel, jsapiBundle, template) {
 
  var AnalysisToolItem = declare([_WidgetBase, _TemplatedMixin, _OnDijitClickMixin, _FocusMixin], {
    declaredClass: "esri.widgets.analysis.AnalysisToolItem",

    templateString: template,
    basePath: require.toUrl("."), 
    widgetsInTemplate: true,
    
    i18n: null,
    _helpIconNode: null,
    _toolIcon: null,
    _toolIconClass: null,
    _toolNameLabel: null,
    toolName: null,
    helpTopic: null,
    helpFileName: "Analysis",
    
    constructor: function(params, srcNodeRef){
      if (params.toolIcon) {
        this._toolIconClass = params.toolIcon;
      }
      if (params.name) {
        this.toolName  = params.name;
        this.helpTopic = params.helpTopic;
      }
      
    },
    
    postCreate: function(){
      this.inherited(arguments);
      this._toolNameLabel.innerHTML = this.toolName;
      domClass.add(this._toolIcon, this._toolIconClass);
      domAttr.set(this._helpIconNode, "esriHelpTopic", this.helpTopic);
      this.set("showComingSoonLabel", true);
    },
    
    postMixInProperties: function(){
      this.inherited(arguments);
      this.i18n={};
      lang.mixin(this.i18n, jsapiBundle.common);
      lang.mixin(this.i18n, jsapiBundle.analysisTools);
    },
    
    _handleToolNameClick: function() {
      //start tool
      //console.log("start tool");
      this.onToolSelect(this);
    },
    
    _handleToolIconClick: function(e) {
      //start tool
      //console.log("start tool");
      event.stop(e);
      this.onToolSelect(this);
    },
    
    _setShowComingSoonLabelAttr: function(value){
      domStyle.set(this.optionsDiv,"display", (value === true)?"block" : "none");
      domClass.toggle(this._toolCtr, "esriToolContainerDisabled", value);
      domClass.toggle(this._toolNameLabel, "esriTransparentNode", value);
      domClass.toggle(this._toolIcon, "esriTransparentNode", value);
      domStyle.set(this._toolNameLabel, "cursor", (value === true)?"default" : "pointer");
      domStyle.set(this._toolCtr, "cursor", (value === true)?"default" : "pointer");
    },
    
    //events
    onToolSelect: function(tool) {
    }
  });
  
  
  return AnalysisToolItem;  
    
});