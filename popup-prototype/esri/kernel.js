/**
 * @classdesc
 * Utility for retrieving the current version of the API.
 *
 * @module esri/kernel
 * @amdalias esriNS
 * @since 4.0
 */
define(
[
  "dojo/_base/url"
],
function(Url) {
  // Defines the "esri" object
  
  var url = new Url(window.location),
      pathname = url.path,
      /** @alias module:esri/kernel */
      esriKernel = {
        /**
         * Current version of the JavaScript API.
         * 
         * @type {string}
         * @instance
         * @readonly
         */
        version: "4.0beta2",
        
        //application base url
        _appBaseUrl: url.scheme + "://" + 
                     url.host +
                     (url.port!=null?":" + url.port:"")+
                     pathname.substring(
                       0,
                       pathname.lastIndexOf(
                         pathname.split("/")[pathname.split("/").length - 1]
                       )
                     ),
        appUrl: url
      };

  // Used by BasemapGallery and Basemap
  var esriDijit = esriKernel.dijit  = (esriKernel.dijit || {});
  esriDijit._arcgisUrl = (location.protocol === "file:" ? "http:" : location.protocol) + "//www.arcgis.com/sharing/rest";
  
  return esriKernel;
});
