define(
[
  "dojo/_base/kernel",
  "../core/declare",
  "dojo/_base/config",
  "dojo/_base/Deferred",
  "dojo/_base/lang",
  "dojo/dom-attr",
  "dojo/keys",
  "dijit/registry",
  "dijit/Dialog",

  "../kernel",
  "../core/lang",
  "../core/domUtils",
  "./Credential",
  "./IdentityManagerBase",
  "dojo/i18n!../nls/jsapi",

  "dojo/query", // TODO: return value not used. we're using dojo.query
  "dijit/form/Button",
  "dijit/form/ValidationTextBox"
],
function(
  dojoNS, declare, dojoConfig, Deferred, lang, domAttr, dojoKeys, registry, Dialog,
  esriKernel, esriLang, domUtils, Credential, IdentityManagerBase, jsapiBundle
) {

/***********************
 * IdentityManager
 ***********************/

var IdentityManagerDlg = declare([ IdentityManagerBase ], {
  declaredClass: "esri.IdentityManager",

  constructor: function(parameters) {
    lang.mixin(this, parameters);
  },
  
  _dialogContent:
    "<div class='dijitDialogPaneContentArea'>" +
      "<div style='padding-bottom: 5px; word-wrap: break-word;'>${info}</div>" +
      "<div style='margin: 0px; padding: 0px; height: 10px;'></div>" +
      
      "<div class='esriErrorMsg' style='display: none; color: white; background-color: #D46464; text-align: center; padding-top: 3px; padding-bottom: 3px;'>${invalidUser}</div>" +
      "<div style='margin: 0px; padding: 0px; height: 10px;'></div>" +
      
      "<table style='width: 100%;'>" +
        "<tr>" +
          "<td><label>${lblUser}</label><br/>" +
          "<input data-dojo-type='dijit.form.ValidationTextBox' data-dojo-props='type:\"text\", \"class\":\"esriIdUser\", required:true, trim:true, style:\"width: 100%;\", autocapitalize:\"none\", autocorrect:\"off\", spellcheck:false' /></td>" +
        "</tr>" + 
        "<tr>" +
          "<td><label>${lblPwd}</label><br/>" + 
          "<input data-dojo-type='dijit.form.ValidationTextBox' data-dojo-props='type:\"password\", \"class\":\"esriIdPwd\", required:true, style:\"width: 100%;\"' /></td>" + 
        "</tr>" + 
      "</table>" +
    "</div>" +
    
    "<div class='dijitDialogPaneActionBar'>" + 
      "<button data-dojo-type='dijit.form.Button' data-dojo-props='type:\"button\", \"class\":\"esriIdSubmit\"'>${lblOk}</button>" + 
      "<button data-dojo-type='dijit.form.Button' data-dojo-props='type:\"button\", \"class\":\"esriIdCancel\"'>${lblCancel}</button>" + 
    "</div>",
  
  signIn: function(/*String*/ resUrl, /*ServerInfo*/ serverInfo, /*Object?*/ options) {
    if (!this._nls) {
      this._nls = jsapiBundle.identity;
    }
    
    // Create login dialog box if this is the first time
    if (!this._loginDialog) {
      this._loginDialog = (this.dialog = this._createLoginDialog());
      this.emit("dialog-create");
    }
    
    var dlg = this._loginDialog,
        lastError = options && options.error,
        lastToken = options && options.token,
        dfd = new Deferred(function() {
          dlg.onCancel();
        });
    
    // Busy?
    if (dlg.open) {
      var err = new Error("BUSY");
      err.code = "IdentityManager." + 1;
      err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
      dfd.errback(err);
      return dfd.promise;
    }
    
    domUtils.hide(dlg.errMsg_);
    
    if (lastError) {
      if (lastError.code == 403 && lastToken) {
        // Implies "Do not have permissions" case
        domAttr.set(dlg.errMsg_, "innerHTML", this._nls.forbidden);
        domUtils.show(dlg.errMsg_);
      }
      // else:
      // 499 - Token Required
      // 498 - Invalid or Expired Token
      // 403 without lastToken
      //  - Geowarehouse jumps the gun and returns 403 - do not have permissions 
      //    if a request to secured resource is made without a "token"
      // Note that these three errors are implicitly covered
      // by the "Please sign in to access the item..." message that dialog box
      // displays all the time.
    }
    
    dlg.dfd_ = dfd;
    dlg.serverInfo_ = serverInfo;
    dlg.resUrl_ = resUrl;
    dlg.admin_ = options && options.isAdmin;
  
    // Update UI state
    /*var resName = this.getResourceName(resUrl);
    
    // Show a link for rest/services URLs and URLs for which we cannot
    // extract a resource name
    if (!resName || resUrl.toLowerCase().indexOf(esri.id._agsRest) !== -1) {
      resName = "<a tabIndex='-1' target='_blank' href='" + resUrl + "'>" + 
                (resName || this._nls.lblItem) + 
                "</a>";
    }*/
    
    domAttr.set(dlg.resLink_, {
      "title": resUrl,
      "innerHTML": "(" + (this.getResourceName(resUrl) || this._nls.lblItem) + ")"
    });
    
    domAttr.set(dlg.serverLink_, {
      "title": serverInfo.server,
      "innerHTML": (
        serverInfo.server.toLowerCase().indexOf("arcgis.com") !== -1 ? 
          "ArcGIS Online" : 
          serverInfo.server
      ) + " "
    });
  
    /*dojo.attr(dlg.serverLink_, "innerHTML", 
              (serverInfo.server.toLowerCase().indexOf("arcgis.com") !== -1 ? "ArcGIS Online" : serverInfo.server) + " ");*/
    
    //dlg.txtUser_.set("value", "");
    dlg.txtPwd_.set("value", "");
  
    dlg.show();
    
    return dfd.promise;
  },
  
  _createLoginDialog: function() {
    var nls = this._nls,
        content = esriLang.substitute(nls, this._dialogContent);
    
    content = esriLang.substitute({
      resource: "<span class='resLink' style='word-wrap: break-word;'></span>",
      server: "<span class='serverLink' style='word-wrap: break-word;'></span>"
    }, content);
    
    var dlg = new Dialog({
      title: nls.title,
      content: content,
      "class": "esriSignInDialog",
      style: "width: 18em;",
      esriIdMgr_: this,
      
      keypressed_: function(evt) {
        if (evt.charOrCode === dojoKeys.ENTER) {
          this.execute_();
        }
      },
      
      execute_: function() {
        var usr = this.txtUser_.get("value"),
            pwd = this.txtPwd_.get("value"),
            dfd = this.dfd_,
            dlg = this;

        if (!usr || !pwd) {
          // Invalid input
          return;
        }
        
        this.btnSubmit_.set("label", nls.lblSigning);
        //esri.hide(dlg.errMsg_);
        
        // TODO
        // We cannot just use the existing credential just because the server
        // and userId matched. Password doesn't matter? The user could just
        // not enter password but click "Ok" and we're still using the existing
        // credential.
        // Perhaps we shouldn't reuse credentials this way at all?
        var found = esriKernel.id.findCredential(dlg.resUrl_, usr),
        callbackFunc = function(response) {
          dlg.btnSubmit_.set("label", nls.lblOk);
          dlg.btnSubmit_.set("disabled", false);
          domUtils.hide(dlg.errMsg_);
          
          dlg.hide();
          // TODO
          // It is possible that the following callback results in an
          // immediate dialog.show which does not finalize the fade out
          // correctly and results in the underlay on top of the page
          // when the next hide happens. Let's hide the underlay manually
          // here
          Dialog._DialogLevelManager.hide(dlg);
          
          var sinfo = dlg.serverInfo_;
          dlg.dfd_ = dlg.serverInfo_ = dlg.generateDfd_ = dlg.resUrl_ = null;
          
          var newToken, expiration, cred = found, ssl;
          
          if (response) {
            newToken = response.token;
            expiration = esriLang.isDefined(response.expires) ? Number(response.expires) : null;
            ssl = !!response.ssl;
            
            if (cred) {
              // We're here because an existing credential did not have the
              // pwd to refresh its token. Now we got the user to sign-in 
              // and have a new token. Just update the credential and return.
              cred.userId = usr;
              cred.token = newToken;
              cred.expires = expiration;
              cred.validity = response.validity;
              cred.ssl = ssl;
              cred.creationTime = (new Date()).getTime();
            }
            else {
              cred = new Credential({
                userId: usr,
                server: sinfo.server,
                token: newToken,
                expires: expiration,
                ssl: ssl,
                isAdmin: dlg.admin_,
                validity: response.validity
              });
            }
          }
          
          dfd.callback(cred);
        };
        
        // Let's check if we already have this user credential
        // If so, do not generate token again. Just re-use
        // existing credential
        /*var server = dlg.serverInfo_.server;
        if (keyring[server] && keyring[server][usr]) {
          var found;
          dojo.some(this.credentials, function(crd) {
            if (server === crd.server && usr === crd.userId) {
              found = crd;
              return true;
            }
            return false;
          });
          
          if (found) {
            callbackFunc(found);
            return;
          }
        }*/

        // We cannot use an existing credential if we're here because the
        // credential did not have user's pwd to refresh itself
        // See Credential.refreshToken for more information.
        if (found && !found._enqueued) {
          callbackFunc();
          return;
        }
        
        dlg.btnSubmit_.set("disabled", true);
        
        dlg.generateDfd_ = esriKernel.id.generateToken(
          this.serverInfo_, 
          { username: usr, password: pwd }, 
          { isAdmin: this.admin_ }
        )
          .then(callbackFunc)
          .then(null, function(error) {
            // Invalid username or password. Keep the dialog open.
            dlg.btnSubmit_.set("disabled", false);
            dlg.generateDfd_ = null;
            dlg.btnSubmit_.set("label", nls.lblOk);
            
            // There is no point checking for the value of error.code because
            // 10.0 (DotNet and Java) token service returns 200 if username or 
            // password is incorrect. This bug exists in 10.1 Final as well.
            domAttr.set(dlg.errMsg_, "innerHTML", 
              (error && error.code) ? nls.invalidUser : nls.noAuthService
            );
            
            // When an error occurred and error.code is not available, it is 
            // highly likely that the proxy had trouble accessing the token
            // service. For example: 
            // - server has invalid ssl certificate
            // - server is within a firewall and not accessible
            // - certificate database in arcgis.com may not recognize the server's certificate provider
            
            domUtils.show(dlg.errMsg_);
          });
      },
      
      cancel_: function() {
        // TODO
        // What if user wants to cancel sign in operation
        // while a network request is pending?
        // Perhaps, get confirmation from user about his action
        // to cancel sign in?
        if (dlg.generateDfd_) {
          dlg.generateDfd_.cancel();
        }
        
        var dfd = dlg.dfd_, resUrl = dlg.resUrl_, sinfo = dlg.serverInfo_;
        dlg.btnSubmit_.set("disabled", false);
        dlg.dfd_ = dlg.serverInfo_ = dlg.generateDfd_ = dlg.resUrl_ = null;
        domUtils.hide(dlg.errMsg_);
        
        Dialog._DialogLevelManager.hide(dlg);
        
        // TODO
        // After clicking the "close" icon of the dialog or pressing "ESC" key
        // the dialog hides. But alt-tab to a different app and come back to
        // the page, you will find the "value is required" tooltip being displayed
        // on the top left corner of the page (if it was previously visible before 
        // switching off the page)

        dlg.esriIdMgr_.emit("dialog-cancel", {
          resourceUrl: resUrl,
          serverInfo: sinfo
        });
        var err = new Error("ABORTED");
        err.code = "IdentityManager." + 2;
        err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
        dfd.errback(err);
      }
    });
    
    var domNode = dlg.domNode;
    dlg.txtUser_ = registry.byNode(dojoNS.query(".esriIdUser", domNode)[0]);
    dlg.txtPwd_ = registry.byNode(dojoNS.query(".esriIdPwd", domNode)[0]);
    dlg.btnSubmit_ = registry.byNode(dojoNS.query(".esriIdSubmit", domNode)[0]);
    dlg.btnCancel_ = registry.byNode(dojoNS.query(".esriIdCancel", domNode)[0]);
    dlg.resLink_ = dojoNS.query(".resLink", domNode)[0];
    dlg.serverLink_ = dojoNS.query(".serverLink", domNode)[0];
    dlg.errMsg_ = dojoNS.query(".esriErrorMsg", domNode)[0];
    
    // Note that event connections registered this way will be 
    // automatically destroyed when "dlg" is destroyed.
    dlg.connect(dlg.txtUser_, "onKeyPress", dlg.keypressed_);
    dlg.connect(dlg.txtPwd_, "onKeyPress", dlg.keypressed_);
    dlg.connect(dlg.btnSubmit_, "onClick", dlg.execute_);
    dlg.connect(dlg.btnCancel_, "onClick", dlg.onCancel);
    dlg.connect(dlg, "onCancel", dlg.cancel_);
    
    return dlg;
  }
});

return IdentityManagerDlg;  
});
