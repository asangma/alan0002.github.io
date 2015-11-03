define(
[
  "./declare"
],
function(declare) {

  var OperationBase = declare(null, {
    
    declaredClass: "esri.OperationBase",
    type: "not implemented",
    label: "not implemented",
    
    constructor: function (params) {
      params = params || {};
      if (params.label) {   
        this.label = params.label;
      }
    },
    
    performUndo: function () { /*overide it when implementing specific operations*/
      console.log("performUndo has not been implemented");
    },
    
    performRedo: function () { /*overide it when implementing specific operations*/
      console.log("performRedo has not been implemented");
    }
  });

  return OperationBase;  
});
