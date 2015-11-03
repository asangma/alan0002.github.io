/**
 * TODO
 * @module esri/identity/OAuthInfo
 */
define([
  "../core/lang",
  "../core/declare",
  "dojo/_base/lang"
], function(esriLang, declare, lang) {

  /******************
   * OAuthInfo
   ******************/

  var OAuthInfo = declare(null, {
    declaredClass: "esri.arcgis.OAuthInfo",

    /****************************
     * Properties:
     *  appId: String
     *  expiration: Number (in minutes)
     *  locale: String
     *  minTimeUntilExpiration: Number (in minutes)
     *  portalUrl: String
     *  authNamespace: String
     *  forceLogin: Boolean
     *  popup: Boolean
     *  popupCallbackUrl: String
     *  popupWindowFeatures: String
     */

    constructor: function(json) {
      var defaults = {
        expiration: 20160, // 60 * 24 * 14 (2 weeks)
        minTimeUntilExpiration: 30,
        portalUrl: "https://www.arcgis.com",
        authNamespace: "/",
        forceLogin: false,
        popup: false,
        popupCallbackUrl: "oauth-callback.html",
        popupWindowFeatures: "height=480,width=800,location,resizable,scrollbars,status"
      };
      lang.mixin(this, defaults, json);
    },

    _oAuthCred: null,

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
      return esriLang.fixJson({
        appId: this.appId,
        expiration: this.expiration,
        locale: this.locale,
        minTimeUntilExpiration: this.minTimeUntilExpiration,
        portalUrl: this.portalUrl,
        authNamespace: this.authNamespace,
        forceLogin: this.forceLogin,
        popup: this.popup,
        popupCallbackUrl: this.popupCallbackUrl,
        popupWindowFeatures: this.popupWindowFeatures
      });
    }
  });

  return OAuthInfo;
});
