/**
 * TODO
 * @module esri/identity/ServerInfo
 */
define(
[
  "../core/declare",
  "dojo/_base/lang",
  "../core/lang"
],
function(declare, lang, esriLang) {

  /******************
   * ServerInfo
   ******************/

  var ServerInfo = declare(null, {
    declaredClass: "esri.ServerInfo",

    /****************************
     * Properties:
     *    String server
     *    String tokenServiceUrl
     *    String adminTokenServiceUrl
     *    Number shortLivedTokenValidity
     *    String owningSystemUrl
     *    String owningTenant
     *    Number currentVersion
     *   Boolean hasPortal
     *   Boolean hasServer
     *   Boolean webTierAuth
     */

    constructor: function(json) {
      lang.mixin(this, json);
    },

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
        server:                  this.server,
        tokenServiceUrl:         this.tokenServiceUrl,
        adminTokenServiceUrl:    this.adminTokenServiceUrl,
        shortLivedTokenValidity: this.shortLivedTokenValidity,
        owningSystemUrl:         this.owningSystemUrl,
        owningTenant:            this.owningTenant,
        currentVersion:          this.currentVersion,
        hasPortal:               this.hasPortal,
        hasServer:               this.hasServer,
        webTierAuth:             this.webTierAuth
      });
    }
  });

  return ServerInfo;
});
