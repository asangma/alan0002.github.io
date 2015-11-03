/**
 * @classdesc
 * This module returns a singleton class that is automatically instantiated into `esri.id` when the module containing 
 * this class is imported into the application. This module provides the framework and helper methods required to 
 * implement a solution for managing user credentials for the following resources:
 * 
 * * ArcGIS Server resources secured using token-based authentication. Note that only ArcGIS Server versions 10 SP 1 
 * and greater are supported.
 * * Secured [ArcGIS.com](http://arcgis.com) or 
 * [Portal for ArcGIS](http://www.esri.com/software/arcgis/arcgisserver/extensions/portal-for-arcgis) resources (i.e. web maps).
 * 
 * If your application accesses services from different domains then it's a cross-domain request and you need to setup 
 * a proxy or use CORS (if supported by browser). If CORS is supported, the Identity Manager knows to make a 
 * request to the token service over https. 
 * 
 * Authentication requests over http are prevented because sensitive data sent via GET can be viewed in server logs. 
 * To prevent this the Identity Manager requires that you use POST over https to ensure your credentials are secure. 
 * View the 'Using a proxy' and 'CORS' sections in the Inside [esri/request](https://developers.arcgis.com/javascript/jshelp/inside_esri_request.html) 
 * help topic for more details. 
 * 
 * @module esri/identity/IdentityManager
 * @amdalias esriId
 * @since 4.0
 */
define([
  "./IdentityManagerDialog",
  "../kernel",
  "./OAuthSignInHandler",
  "../core/declare"
], function(IdentityManagerDialog, esriKernel, OAuthSignInHandler, declare) {
  var dlg = new IdentityManagerDialog();
  esriKernel.id = declare.safeMixin(dlg, OAuthSignInHandler);
  return esriKernel.id;
});
