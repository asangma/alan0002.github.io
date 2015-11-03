define([
  "./Credential",
  "../core/domUtils",
  "../core/lang",
  "../core/urlUtils",
  "dijit/Dialog",
  "dijit/registry",
  "dojo/_base/config",
  "dojo/_base/Deferred",
  "dojo/_base/kernel",
  "dojo/dom-attr",
  "dojo/i18n!esri/nls/jsapi",
  "dojo/io-query",
  "dojo/sniff",

  "dijit/form/Button",
  "dojo/query"// TODO: return value not used. we're using dojo.query
], function(Credential, domUtils, esriLang, urlUtils, Dialog, registry, dojoConfig, Deferred, dojoNS, domAttr,
            jsapiBundle, ioquery, has) {

  /*
   * This module may be used as a mixin to implement IdentityManagerBase.oAuthSignIn()
   */

  var handler = {

    _oAuthDfd: null,
    _oAuthIntervalId: 0,

    _oAuthDialogContent: "<div class='dijitDialogPaneContentArea'>" +
        "<div style='padding-bottom: 5px; word-wrap: break-word;'>${oAuthInfo}</div>" +
        "<div style='margin: 0px; padding: 0px; height: 10px;'></div>" +

        "<div class='esriErrorMsg' style='display: none; color: white; background-color: #D46464; text-align: center; padding-top: 3px; padding-bottom: 3px;'>${invalidUser}</div>" +
        "<div style='margin: 0px; padding: 0px; height: 10px;'></div>" +

        "<div class='dijitDialogPaneActionBar'>" +
        "<button data-dojo-type='dijit.form.Button' data-dojo-props='type:\"button\", \"class\":\"esriIdSubmit\"'>${lblOk}</button>" +
        "<button data-dojo-type='dijit.form.Button' data-dojo-props='type:\"button\", \"class\":\"esriIdCancel\"'>${lblCancel}</button>" +
        "</div>",

    setOAuthRedirectionHandler: function(handlerFunc) {
      this._oAuthRedirectFunc = handlerFunc;
    },

    oAuthSignIn: function(/*String*/ resUrl, /*ServerInfo*/ serverInfo, /*OAuthInfo*/ oAuthInfo, /*Object?*/ options) {
      var dfd = (this._oAuthDfd = new Deferred());

      dfd.resUrl_ = resUrl;
      dfd.sinfo_ = serverInfo;
      dfd.oinfo_ = oAuthInfo;

      var confirmOAuth = !options || options.oAuthPopupConfirmation !== false;
      if (!oAuthInfo.popup || !confirmOAuth) {
        this._doOAuthSignIn(resUrl, serverInfo, oAuthInfo);
        return dfd.promise;
      }

      if (!this._nls) {
        this._nls = jsapiBundle.identity;
      }

      // Create oauth dialog box if this is the first time
      if (!this.oAuthDialog) {
        this.oAuthDialog = this._createOAuthDialog();
      }

      var dlg = this.oAuthDialog,
          lastError = options && options.error,
          lastToken = options && options.token;

      domUtils.hide(dlg.errMsg_);

      if (lastError) {
        if (lastError.code == 403 && lastToken) {
          // Implies "Do not have permissions" case
          domAttr.set(dlg.errMsg_, "innerHTML", this._nls.forbidden);
          domUtils.show(dlg.errMsg_);
        }
      }

      dlg.show();

      return dfd.promise;
    },

    setOAuthResponseHash: function(hash) {
      var dfd = this._oAuthDfd;
      this._oAuthDfd = null;

      if (!dfd || !hash) {
        return;
      }

      clearInterval(this._oAuthIntervalId); // stop watching for popup to close
      if (hash.charAt(0) === "#") {
        hash = hash.substring(1);
      }
      var oAuthHash = ioquery.queryToObject(hash);
      if (oAuthHash.error) {
        var err = new Error(oAuthHash.error === "access_denied" ?
            "ABORTED" :
            "OAuth: " + oAuthHash.error + " - " + oAuthHash.error_description);
        err.code = "IdentityManagerBase." + 2;
        err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
        dfd.errback(err);
      }
      else {
        var sinfo = dfd.sinfo_,
            oAuthInfo = dfd.oinfo_,
            oAuthCred = oAuthInfo._oAuthCred;
        var cred = new Credential({
          userId: oAuthHash.username,
          server: sinfo.server,
          token: oAuthHash.access_token,
          expires: (new Date()).getTime() + (Number(oAuthHash.expires_in) * 1000),
          ssl: oAuthHash.ssl === "true",
          _oAuthCred: oAuthCred
        });
        oAuthCred.storage = oAuthHash.persist ? window.localStorage : window.sessionStorage;
        oAuthCred.token = cred.token;
        oAuthCred.expires = cred.expires;
        oAuthCred.userId = cred.userId;
        oAuthCred.ssl = cred.ssl;
        oAuthCred.save();
        dfd.callback(cred);
      }
    },

    _createOAuthDialog: function() {
      var nls = this._nls,
          content = esriLang.substitute(nls, this._oAuthDialogContent);

      var dlg = new Dialog({
        title: nls.title,
        content: content,
        "class": "esriOAuthSignInDialog",
        style: "min-width: 18em;",
        esriIdMgr_: this,

        execute_: function() {
          var dfd = dlg.esriIdMgr_._oAuthDfd;
          dlg.hide_();
          dlg.esriIdMgr_._doOAuthSignIn(dfd.resUrl_, dfd.sinfo_, dfd.oinfo_);
        },

        cancel_: function() {
          var dfd = dlg.esriIdMgr_._oAuthDfd;
          dlg.esriIdMgr_._oAuthDfd = null;
          dlg.hide_();

          var err = new Error("ABORTED");
          err.code = "IdentityManager." + 2;
          err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
          dfd.errback(err);
        },

        hide_: function() {
          domUtils.hide(dlg.errMsg_);

          dlg.hide();
          // It is possible that the following callback results in an
          // immediate dialog.show which does not finalize the fade out
          // correctly and results in the underlay on top of the page
          // when the next hide happens. Let's hide the underlay manually
          // here
          Dialog._DialogLevelManager.hide(dlg);
        }
      });

      var domNode = dlg.domNode;
      dlg.btnSubmit_ = registry.byNode(dojoNS.query(".esriIdSubmit", domNode)[0]);
      dlg.btnCancel_ = registry.byNode(dojoNS.query(".esriIdCancel", domNode)[0]);
      dlg.errMsg_ = dojoNS.query(".esriErrorMsg", domNode)[0];

      // Note that event connections registered this way will be
      // automatically destroyed when "dlg" is destroyed.
      dlg.connect(dlg.btnSubmit_, "onClick", dlg.execute_);
      dlg.connect(dlg.btnCancel_, "onClick", dlg.onCancel);
      dlg.connect(dlg, "onCancel", dlg.cancel_);

      return dlg;
    },

    _doOAuthSignIn: function(resUrl, serverInfo, oAuthInfo) {
      var self = this;
      var authorizeParams = {
        client_id: oAuthInfo.appId,
        response_type: "token",
        state: JSON.stringify({ portalUrl: oAuthInfo.portalUrl }),
        expiration: oAuthInfo.expiration,
        locale: oAuthInfo.locale,
        force_login: oAuthInfo.forceLogin,
        redirect_uri: oAuthInfo.popup ?
            urlUtils.getAbsoluteUrl(oAuthInfo.popupCallbackUrl) :
            window.location.href.replace(/#.*$/, "")
      };
      var authorizeUrl = oAuthInfo.portalUrl.replace(/^http:/i, "https:") + "/sharing/oauth2/authorize";
      var oAuthUrl = authorizeUrl + "?" + ioquery.objectToQuery(authorizeParams);
      if (oAuthInfo.popup) {
        var oAuthWin;
        if (has("ie") === 7) {
          oAuthWin = window.open(oAuthInfo.popupCallbackUrl, "esriJSAPIOAuth", oAuthInfo.popupWindowFeatures);
          oAuthWin.location = oAuthUrl;
        }
        else {
          oAuthWin = window.open(oAuthUrl, "esriJSAPIOAuth", oAuthInfo.popupWindowFeatures);
        }
        // The popup may be blocked if the user calls getCredential and id mgr is busy/waiting for the user and then
        // oAuthWin will be undefined
        if (oAuthWin) {
          oAuthWin.focus(); // make sure Firefox brings a pre-existing window to the front
          this._oAuthDfd.oAuthWin_ = oAuthWin;
          this._oAuthIntervalId = setInterval(function() {
            if (oAuthWin.closed) {
              clearInterval(self._oAuthIntervalId);
              var dfd = self._oAuthDfd;
              if (dfd) {
                var err = new Error("ABORTED");
                err.code = "IdentityManager." + 2;
                err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
                dfd.errback(err);
              }
            }
          }, 500);
        }
        else {
          var err = new Error("ABORTED");
          err.code = "IdentityManager." + 2;
          err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
          this._oAuthDfd.errback(err);
        }
      }
      else if (this._oAuthRedirectFunc) {
        this._oAuthRedirectFunc({
          authorizeParams: authorizeParams,
          authorizeUrl: authorizeUrl,
          resourceUrl: resUrl,
          serverInfo: serverInfo,
          oAuthInfo: oAuthInfo
        });
      }
      else {
        window.location = oAuthUrl;
      }
    }
  };

  return handler;
});
