/*jslint browser: true, continue: true, eqeq: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, vars: true, white: true */
/*global define */

define([
  "dojo/sniff"
], function(has) {
  
var isFF     = has("ff"),
    isIE     = has("ie"),
    isWebKit = has("webkit"),
    isOpera  = has("opera");
    
var lastTime = new Date().getTime();

var requestAnimationFrame = window.requestAnimationFrame,
    vendorPrefix;
    
if (!requestAnimationFrame) {
  vendorPrefix = (isWebKit && "webkit") || (isFF && "moz") || 
                 (isOpera && "o") || (isIE && "ms");
  requestAnimationFrame = window[vendorPrefix + "RequestAnimationFrame"];
  if (!requestAnimationFrame) {
    requestAnimationFrame = function(callback) {
      var currTime = new Date().getTime(),
          timeToCall = Math.max(0, 16 - (currTime - lastTime)),
          id = window.setTimeout(function() { callback(now()); }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }
}

return requestAnimationFrame;
});
