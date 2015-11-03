/**
 * This module returns an intent object when instantiated which is modified based of the execution of the request.
 */

define([
  "dojo/_base/declare"
], function(
  declare
){
  var Intent = declare(null, {
    constructor: function(){
      this.isXhrGet= false;
      this.isXhrPost = false;
      this.isScriptGet = false;
      this.isProxy = false;
      this.corsDetection = false;
      this.isFormSent = false;
      this.isRCGet = false;
      this.isRCPost = false;
      this.tokenError = false;
      this.isXhrPostForToken = false;
      this.isXhrGetWithToken = false;
      this.handles = [];
    }
  });

  return Intent;
});