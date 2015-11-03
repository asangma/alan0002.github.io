define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/has",
  "dojo/dom-class",
  
  "dijit/form/ToggleButton",
  
  "../../kernel"
  
],
function(require, declare, lang, connection, has, domClass, ToggleButton, esriKernel) {

  var GroupToggleButton = declare([ToggleButton], {
    groupName: "defaultGroup",
    declaredClass: "esri.widgets.analysis.GroupToggleButton",
    // based on https://groups.google.com/forum/#!topic/dojo-interest/W-WCUgh70NI 
    //summary: A toggle button that is a member of a group where only one may be selected.
    // example:
    //  var gtb = new esri.widgets.analysis.GroupToggleButton({ groupName:"someGroup"});
    //
  
    
    postMixInProperties:function(){
      this.inherited(arguments);
      this.unselectChannel = "/ButtonGroup/" + this.groupName;
      connection.subscribe(this.unselectChannel, this, "doUnselect");
    },
    
    postCreate:function(){
      this.inherited(arguments);
      domClass.add(this.domNode, "esriGroupButton");
    },
    
    /**
     * Another button was selected. If this is selected, deselect.
     * @param {Object} button The button that was selected.
     */
    doUnselect: function(button) {
      //console.log(button.id, "button");
      //console.log(this.id, "this");
      if (button !== this && this.checked) {
        this.set("checked", false);
      }
    },
    
    _setCheckedAttr: function(value, priorityChange) {
      this.inherited(arguments);
      if(value) {
        connection.publish(this.unselectChannel, [this]);
      }
      domClass.toggle(this.focusNode, "esriGroupChecked", value);
      
      console.log("checked", this.id , value);
    }
  });

  
  return GroupToggleButton;  


});