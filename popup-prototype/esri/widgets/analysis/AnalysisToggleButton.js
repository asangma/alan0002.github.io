define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/has",
  "dojo/dom-class",
  
  "dijit/_Widget",
  
  "../../kernel"
  
], function(require, declare, lang, connection, has, domClass, _Widget, esriKernel) {
    var AnalysisToggleButton = declare([_Widget], {
      groupName: "defaultGroup",
       declaredClass: "esri.widgets.analysis.AnalysisToggleButton",
    
      postMixInProperties:function(){
        this.inherited(arguments);
        this.unselectChannel = "/ButtonGroupCtr/" + this.groupName;
        connection.subscribe(this.unselectChannel, this, "doUnselect");
      },
      
      postCreate:function(){
        this.inherited(arguments);
        domClass.add(this.domNode, "esriGroupButton");
      },
      
      doUnselect: function(button) {
        if (button !== this && this.get("checked")) {
          this.set("checked", false);
        }
      },
      
      _getCheckedAttr: function() {
        return this.checked;
      },
      
      _setCheckedAttr: function(value) {
        this.inherited(arguments);
        this.checked = value;
        if(value) {
          connection.publish(this.unselectChannel, [this]);
        }
        domClass.toggle(this.domNode, "esriGroupselected", value);
        //console.log("checked", this.id , value);
      }
    });
    
    
    return AnalysisToggleButton;   
  
});