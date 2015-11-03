define([
  "../core/declare"
], function(declare) {

  /******************
   * OAuthCredential
   ******************/

  var STORAGE_NAME = "esriJSAPIOAuth";

  var OAuthCredential = declare(null, {
    declaredClass: "esri.OAuthCredential",

    oAuthInfo: null,
    storage: null, // localStorage or sessionStorage or other object with getItem and setItem functions

    expires: null,
    ssl: null,
    token: null,
    userId: null,

    constructor: function(oAuthInfo, storage) {
      this.oAuthInfo = oAuthInfo;
      this.storage = storage;
      this._init();
    },

    isValid: function() {
      var result = false;

      if (this.oAuthInfo && this.token && this.userId) {
        var now = (new Date()).getTime();
        if (this.expires > now) {
          // number of seconds until the token expires
          var expiresIn = (this.expires - now) / 1000;
          // use the token if it expires in more than minTimeUntilExpiration minutes from now
          if (expiresIn > this.oAuthInfo.minTimeUntilExpiration * 60) {
            result = true;
          }
        }
      }

      return result;
    },

    save: function() {
      if (!this.storage) {
        return;
      }

      var oAuthObj = this._load();

      var info = this.oAuthInfo;
      if (info && info.authNamespace && info.portalUrl) {
        var obj = oAuthObj[info.authNamespace];
        if (!obj) {
          obj = oAuthObj[info.authNamespace] = {};
        }
        obj[info.portalUrl] = {
          expires: this.expires,
          ssl: this.ssl,
          token: this.token,
          userId: this.userId
        };
        try {
          this.storage.setItem(STORAGE_NAME, JSON.stringify(oAuthObj));
        } catch (error) {
          // setItem throws an error in Safari's Private Browsing mode
          console.log(error);
        }
      }
    },

    destroy: function() {
      var oAuthObj = this._load();

      var info = this.oAuthInfo;
      if (info && info.authNamespace && info.portalUrl && this.storage) {
        var obj = oAuthObj[info.authNamespace];
        if (obj) {
          delete obj[info.portalUrl];
          try {
            this.storage.setItem(STORAGE_NAME, JSON.stringify(oAuthObj));
          } catch (error) {
            console.log(error);
          }
        }
      }

      if (info) {
        info._oAuthCred = null;
        this.oAuthInfo = null;
      }
    },

    _init: function() {
      var oAuthObj = this._load();

      var info = this.oAuthInfo;
      if (info && info.authNamespace && info.portalUrl) {
        var obj = oAuthObj[info.authNamespace];
        if (obj) {
          obj = obj[info.portalUrl];
          if (obj) {
            this.expires = obj.expires;
            this.ssl = obj.ssl;
            this.token = obj.token;
            this.userId = obj.userId;
          }
        }
      }
    },

    _load: function() {
      var result = {};

      if (this.storage) {
        var item = this.storage.getItem(STORAGE_NAME);
        if (item) {
          try {
            result = JSON.parse(item);
          } catch (error) {
            console.log(error);
          }
        }
      }

      return result;
    }
  });

  return OAuthCredential;
});
