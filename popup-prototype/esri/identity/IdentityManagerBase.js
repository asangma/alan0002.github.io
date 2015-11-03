/**
 * This class provides the framework and helper methods required to implement a solution for managing user credentials.
 * 
 * The supported resources are:
 * ArcGIS Server resources secured using token-based authentication. Note that only ArcGIS Server versions 10 SP 1 and greater are supported.
 * Secured ArcGIS.com resources (i.e., web maps).
 * This class is not typically used by itself and does not include a user interface to obtain user input. The esri/IdentityManager class provides a complete out-of-the-box implementation.
 * @module esri/identity/IdentityManagerBase
 * @since 4.0
 */
define(
[
  "../core/declare",
  "dojo/_base/config",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Deferred",
  "dojo/_base/url",
  "dojo/sniff",
  "dojo/cookie",
  "dojo/io-query",
  "dojo/regexp",

  "../kernel",
  "../config",
  "../core/lang",
  "./ServerInfo",
  "../core/urlUtils",
  "../core/deferredUtils",
  "../core/Accessor",
  "../request",
  "../core/Evented",

  "./OAuthCredential",
  "./OAuthInfo"
],
function(
  declare, dojoConfig, lang, array, Deferred, Url, has, dojoCookie, ioquery, regexp,
  esriKernel, esriConfig, esriLang, ServerInfo, urlUtils, dfdUtils, Accessor, esriRequest, esriEvented,
  OAuthCredential, ArcGISOAuthInfo
) {

// TODO items for OAuth
// Add an oAuthInfo property to ServerInfo
// Add an init() function and move _oAuthHash to OAuthSignInHandler
// Refactor OAuthCredential

// TODO
// Test in IE
// IE 6, 7 bug: http://trac.dojotoolkit.org/ticket/13493
// Test esri.request with "proxy?url" urls

// TODO
// Token service bugs:
// Returns error.code: 200 for invalid username/password
// Doesn't seem to honor "expiration" for requests without clientid

// References
// http://superuser.com/questions/104146/add-permanent-ssl-certificate-exception-in-chrome-linux
// http://superuser.com/questions/27268/how-do-i-disable-the-warning-chrome-gives-if-a-security-certificate-is-not-truste
// http://code.google.com/p/chromium/issues/detail?id=9252

  
// Holds username and password
var keyring = {};

// This function is truly private to prevent someone from replacing it with 
// an implementation that always returns true and thereby allowing a malicious 
// arcgis server to claim federation with arcgis.com
var 
onlineFederation = function(sinfo) {
  //console.log("onlineFederation: ", sinfo.owningSystemUrl, sinfo.server);

  var owningSystem = new Url(sinfo.owningSystemUrl).host,
      server = new Url(sinfo.server).host,
      regex = /.+\.arcgis\.com$/i;
      
  return (regex.test(owningSystem) && regex.test(server));
},

// Legacy federation implies that secured services should be accessed using
// portal scoped token (versus server scoped token)
legacyFederation = function(sinfo, list) {
  //console.log("legacyFederation: ", sinfo.owningSystemUrl, sinfo.server, list);
  
  return !!(
    onlineFederation(sinfo) && 
    list &&
    array.some(list, function(regex) {
      return regex.test(sinfo.server);
    })
  );
};

var Credential;

/***************************
 * esri.IdentityManagerBase
 ***************************/

var IdentityManagerBase = declare(esriEvented, {
  declaredClass: "esri.IdentityManagerBase",

  constructor: function() {
    // NOTE
    // See esri/arcgisonline/config.js
    this._portalConfig = lang.getObject("esriGeowConfig");

    this.serverInfos = []; // one entry per unique origin
    this.oAuthInfos = []; // one entry per portal
    this.credentials = []; // one entry per userId-server combination
    
    this._soReqs = [];
    this._xoReqs = [];
    this._portals = [];

    this._getOAuthHash();
  },
  
  // TODO
  // Should we handle two gis server instances hosted on the same origin?
  // Example: dexter2k8/gis/rest/services, dexter2k8/arcgis/rest/services
  //serverInfos: [], // will have one entry per unique origin
  
  //credentials: [], // will have one entry per userId-server combination
  defaultTokenValidity: 60, // minutes
  tokenValidity: null, // minutes
  signInPage: null,
  
  // Added this option so that server manager app can disable it and
  // prevent redirection in a case where a portal and server have the 
  // same web adaptor *and* the manager app is accessed through the
  // web adaptor host.
  useSignInPage: true,
  
  // Used by ArcGIS Server Manager App:
  // "true" indicates authentication flows for portals secured with IWA
  // should be normalized by generating portal token
  normalizeWebTierAuth: false,
  
  _busy: null,
  _oAuthHash: null,

  _gwTokenUrl: "/sharing/generateToken",
  _agsRest: "/rest/services",
  _agsPortal: /\/sharing(\/|$)/i,
  
  // Only matches: http://HOST/XYZ/admin/*
  // Does not match:  
  //   http://HOST/admin/*
  //   http://HOST/XYZ/PQRS/admin/*
  _agsAdmin: /https?:\/\/[^\/]+\/[^\/]+\/admin\/?(\/.*)?$/i,
  _adminSvcs: /\/admin\/services(\/|$)/i,
  
  _agolSuffix: ".arcgis.com",
  
  _gwDomains: [
    { 
      regex: /https?:\/\/www\.arcgis\.com/i, 
      tokenServiceUrl: "https://www.arcgis.com/sharing/generateToken"
    },
    { 
      regex: /https?:\/\/dev\.arcgis\.com/i, 
      tokenServiceUrl: "https://dev.arcgis.com/sharing/generateToken"
    },
    { 
      //regex: /https?:\/\/.*dev.*\.arcgis\.com/i, 
      regex: /https?:\/\/.*dev[^.]*\.arcgis\.com/i, 
      tokenServiceUrl: "https://devext.arcgis.com/sharing/generateToken"
    },
    { 
      //regex: /https?:\/\/.*qa.*\.arcgis\.com/i, 
      regex: /https?:\/\/.*qa[^.]*\.arcgis\.com/i, 
      tokenServiceUrl: "https://qaext.arcgis.com/sharing/generateToken"
    },
    {
      regex: /https?:\/\/.*.arcgis\.com/i,
      tokenServiceUrl: "https://www.arcgis.com/sharing/generateToken"
    }
  ],
  
  // Analysis servers unlikely to support server scoped tokens at 
  // portal v2.2.1
  ///https?:\/\/analysis[^.]*\.arcgis\.com/i
  _legacyFed: [],
  
  _regexSDirUrl: /http.+\/rest\/services\/?/ig, // /http.+\/arcgis\/rest\/services\/?/ig,
  _regexServerType: /(\/(MapServer|GeocodeServer|GPServer|GeometryServer|ImageServer|NAServer|FeatureServer|GeoDataServer|GlobeServer|MobileServer|GeoenrichmentServer)).*/ig,
  
  _gwUser: /http.+\/users\/([^\/]+)\/?.*/i,
  _gwItem: /http.+\/items\/([^\/]+)\/?.*/i,
  _gwGroup: /http.+\/groups\/([^\/]+)\/?.*/i,

  // arcgis server returns 499 (>= 10.01) or 498 (< 10.01) when accessing resources without token
  // geowarehouse api returns 403 when accessing resources without token
  // SDS seems to return 401 when accessing resources without/invalid token
  _errorCodes: [ 499, 498, 403, 401 ],
  
  _rePortalTokenSvc: /\/sharing(\/rest)?\/generatetoken/i,
  
  _publicUrls: [
    /\/arcgis\/tokens/i,
    /\/sharing(\/rest)?\/generatetoken/i,
    /\/rest\/info/i
  ],
  
  registerServers: function(/*ServerInfo[]*/ serverInfos) {
    var infos = this.serverInfos;
    
    if (infos) {
      serverInfos = array.filter(serverInfos, function(info) {
        return !this.findServerInfo(info.server);
      }, this);
      
      this.serverInfos = infos.concat(serverInfos);
    }
    else {
      this.serverInfos = serverInfos;
    }
      
    array.forEach(serverInfos, function(info) {
      if (info.owningSystemUrl) {
        this._portals.push(info.owningSystemUrl);
      }
      
      if (info.hasPortal) {
        // Portals have CORS enabled by default
        
        this._portals.push(info.server);
        
        var corsList = esriConfig.request.corsEnabledServers,
            tokenSvcUrl = this._getOrigin(info.tokenServiceUrl);
        
        // Add this portal to corsEnabledServers list
        if (!urlUtils.canUseXhr(info.server)) {
          corsList.push(info.server.replace(/^https?:\/\//i, ""));
        }

        // When an on-premise portal is accessed over a non-standard port
        // i.e., 7080, the token service will be available over a non-standard
        // SSL port as well. Let's add that origin to CORS list.
        if (!urlUtils.canUseXhr(tokenSvcUrl)) {
          corsList.push(tokenSvcUrl.replace(/^https?:\/\//i, ""));
        }
      }
    }, this);
  },

  registerOAuthInfos: function(/*OAuthInfo[]*/ oAuthInfos) {
    var infos = this.oAuthInfos;

    if (infos) {
      oAuthInfos = array.filter(oAuthInfos, function(info) {
        return !this.findOAuthInfo(info.portalUrl);
      }, this);

      this.oAuthInfos = infos.concat(oAuthInfos);
    }
    else {
      this.oAuthInfos = oAuthInfos;
    }
  },

  registerToken: function(properties) {
    // At 3.4, this method is targeted towards arcgis online
    
    /**
     * properties = {
     *   userId:    "<String>",
     *   server:    "<String>",
     *   token:     "<String>",
     *   expires:    <Number>,
     *   ssl:        <Boolean>
     * } 
     */
    
    var serverUrl = this._sanitizeUrl(properties.server),
        serverInfo = this.findServerInfo(serverUrl),
        isNewCredential = true,
        credential;
    
    if (!serverInfo) {
      serverInfo = new ServerInfo();
      serverInfo.server = this._getServerInstanceRoot(serverUrl);
      serverInfo.tokenServiceUrl = this._getTokenSvcUrl(serverUrl);
      serverInfo.hasPortal = true;
      
      this.registerServers([ serverInfo ]);
    }
    
    credential = this.findCredential(serverUrl, properties.userId);
    
    if (credential) {
      lang.mixin(credential, properties);
      isNewCredential = false;
    }
    else {
      credential = new Credential({
        userId:  properties.userId,
        server:  serverInfo.server,
        token:   properties.token,
        expires: properties.expires,
        ssl:     properties.ssl,
        scope:   this._isServerRsrc(serverUrl) ? "server" : "portal"
      });
      
      credential.resources = [ serverUrl ];
      this.credentials.push(credential);
    }

    // Disable auto refresh timer: the caller will do this on his own
    // and call registerToken again or directly update credential.token
    // with a new one
    credential.emitTokenChange(false);

    if (!isNewCredential) {
      credential.refreshServerTokens();
    }

    // We may have to return a deferred object.
    //return credential;
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
      "serverInfos": array.map(this.serverInfos, function(sinfo) {
        return sinfo.toJSON();
      }),
      "oAuthInfos": array.map(this.oAuthInfos, function(oinfo) {
        return oinfo.toJSON();
      }),
      "credentials": array.map(this.credentials, function(crd) {
        return crd.toJSON();
      })
    });
  },
  
  initialize: function(json) {
    // "json": returned by toJson method. See above.
    
    // Together, "toJson" and "initialize" can be used to serialize, persist and 
    // restore the state of id manager
    
    if (!json) {
      return; 
    }
    
    // convert json string to json object
    if (lang.isString(json)) {
      json = JSON.parse(json);
    }
    
    // Process and add server-infos and credentials
    // - ignore serverInfos without token service url
    // - ignore oAuthInfos without app id
    // - ignore credentials with expired token
    var serverInfos = json.serverInfos,
        oAuthInfos = json.oAuthInfos,
        credentials = json.credentials;
    
    if (serverInfos) {
      var infos = [];
      
      array.forEach(serverInfos, function(sinfo) {
        if (sinfo.server && sinfo.tokenServiceUrl) {
          infos.push(sinfo.declaredClass ? sinfo : new ServerInfo(sinfo));
        }
        // All credentials should have a valid corresponding serverInfo,
        // so it should be safe to ignore invalid server-infos without any
        // consequences since there won't be any credentials for them.
      });
      
      if (infos.length) {
        this.registerServers(infos);
      }
    }
    if (oAuthInfos) {
      var oInfos = [];

      array.forEach(oAuthInfos, function(info) {
        if (info.appId) {
          oInfos.push(info.declaredClass ? info : new ArcGISOAuthInfo(info));
        }
      });

      if (oInfos.length) {
        this.registerOAuthInfos(oInfos);
      }
    }
    if (credentials) {
      array.forEach(credentials, function(crd) {
        if ( crd.userId && crd.server && crd.token && crd.expires && (crd.expires > (new Date()).getTime()) ) {
          crd = crd.declaredClass ? crd : new Credential(crd);
          crd.emitTokenChange();

          this.credentials.push(crd);
        }
        
        // Based on the conditional above, we're ignoring credentials created from
        // arcgis.com cookie. It's okay because any future access to an arcgis.com
        // resource will go through a code path that looks into the esri_auth
        // cookie. If the cookie is still valid and hence available, we'd use it -
        // if not, we'd redirect.
      }, this);
    }
  },
  
  findServerInfo: function(/*String*/ resUrl) {
    var retVal;
    
    resUrl = this._sanitizeUrl(resUrl);

    array.some(this.serverInfos, function(info) {
      if (this._hasSameServerInstance(info.server, resUrl)) {
        retVal = info;
      }
      
      return !!retVal;
    }, this);
    
    return retVal;
  },

  findOAuthInfo: function(/*String*/ portalUrl) {
    var retVal;

    portalUrl = this._sanitizeUrl(portalUrl);

    array.some(this.oAuthInfos, function(info) {
      if (this._hasSameServerInstance(info.portalUrl, portalUrl)) {
        retVal = info;
      }

      return !!retVal;
    }, this);

    return retVal;
  },

  findCredential: function(/*String*/ resUrl, /*String?*/ userId) {
    var retVal, resScope;
    
    resUrl = this._sanitizeUrl(resUrl);
    
    // We use the scope to make sure we do not return portal credential
    // for a federated resource in cases where portal and server are
    // deployed on the same host.
    resScope = this._isServerRsrc(resUrl) ? "server" : "portal";
    
    if (userId) {
      array.some(this.credentials, function(crd) {
        if (
          this._hasSameServerInstance(crd.server, resUrl) &&
          userId === crd.userId &&
          crd.scope === resScope
        ) {
          retVal = crd;
          //return true;
        }
        
        return !!retVal;
      }, this);
    }
    else {
      array.some(this.credentials, function(crd) {
        if (
          this._hasSameServerInstance(crd.server, resUrl) &&
          this._getIdenticalSvcIdx(resUrl, crd) !== -1 &&
          crd.scope === resScope
        ) {
          retVal = crd;
        }
        
        return !!retVal;
      }, this);
    }
    
    return retVal;
  },
  
  getCredential: function(/*String*/ resUrl, /*Object? -or- Boolean? (deprecated)*/ options) {
    var retry, inError, prompt = true;
    
    if (esriLang.isDefined(options)) {
      if (lang.isObject(options)) {
        retry = !!options.token;
        inError = options.error;
        
        // prompt=false indicates the caller does not wish this call to 
        // result in prompt for user credentials
        prompt = (options.prompt !== false);
      }
      else { // Boolean (before 3.0)
        retry = options;
      }
    }
    
    resUrl = this._sanitizeUrl(resUrl);

    var dfd = new Deferred(dfdUtils._dfdCanceller), err,
        isAdmin = this._isAdminResource(resUrl),
        esri_auth = (retry && this._doPortalSignIn(resUrl)) ?
            this._getEsriAuthCookie() : null,
        singleUser = retry ? this.findCredential(resUrl) : null;
    
    if (esri_auth || singleUser) {
      var loggedInUser = (esri_auth && esri_auth.email) ||
                         (singleUser && singleUser.userId);
      
      // TODO
      // We're clobbering the original "code" and "message" returned by the server.
      // Need to fix this the right way. How can we organize messages and codes from
      // multiple tiers of components? (on top of the standard code, message, details
      // structure originally defined by REST API)
      err = new Error(
        "You are currently signed in as: '" + 
        loggedInUser + 
        "'. You do not have access to this resource: " + 
        resUrl
      );
      
      err.code = "IdentityManagerBase." + 1;
      // Portal uses messageCode to display user-friendly messages
      // For example, change the "Language" in a user's profile page and 
      // hit "Save". Server may return subscription has expired message
      // with a special message code
      err.httpCode = inError && inError.httpCode;
      err.messageCode = inError ? inError.messageCode : null;
      err.subcode = inError ? inError.subcode : null;
      err.details = inError ? inError.details : null;
      err.log = dojoConfig.isDebug;
      dfd.errback(err);
      return dfd.promise;
    }
    
    var match = this._findCredential(resUrl, options);
    
    // TODO
    // Check if the token has expired. If so, refresh before 
    // returning the "match" to the caller. We should not create 
    // a new credential here as consumers of this credential expect
    // it to be refreshed not "replaced"
    
    if (match) {
      dfd.callback(match);
      return dfd.promise;
    }
    
    var serverInfo = this.findServerInfo(resUrl);
    
    // TODO
    // The logic below should be moved to ServerInfo.js
    // Make sure we have server-info before proceeding any further
    if (!serverInfo) {
      // guess token service endpoint
      var tokenSvcUrl = this._getTokenSvcUrl(resUrl);
      
      if (!tokenSvcUrl) {
        err = new Error("Unknown resource - could not find token service endpoint.");
        err.code = "IdentityManagerBase." + 2;
        err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
        dfd.errback(err);
        return dfd.promise;
      }
        
      // create and register ServerInfo
      serverInfo = new ServerInfo();
      serverInfo.server = this._getServerInstanceRoot(resUrl);
      
      if (lang.isString(tokenSvcUrl)) {
        serverInfo.tokenServiceUrl = tokenSvcUrl;
        
        // Self call may trigger authentication for portals secured with 
        // web-tier authentication. So, let's not fetch self if the caller
        // does not wish to prompt the user for credentials.
        // TODO
        // If prompt=false, we're creating a ServerInfo without checking self.
        // When would we fetch it again then? It's okay for portal app templates
        // where web-tier auth is normalized using esri_auth cookie
        if (prompt && !this._findOAuthInfo(resUrl)) {
          // Fetch portal self resource to check for web-tier authentication
          serverInfo._selfDfd = this._getPortalSelf(
            tokenSvcUrl.replace(this._rePortalTokenSvc, "/sharing/rest/portals/self"), 
            resUrl
          );
        }
        
        serverInfo.hasPortal = true;
      }
      else {
        serverInfo._restInfoDfd = tokenSvcUrl;
        serverInfo.hasServer = true;
      }
      
      this.registerServers([ serverInfo ]);
    }
    else {
      // We may already have a ServerInfo object for this host, but
      // it may not have information about the "ArcGIS Server" deployed
      // on that host
      if (!serverInfo.hasServer && this._isServerRsrc(resUrl)) {
        // Second argument (true) makes sure that we don't access
        // rest/info via HTTPS. SSL access may be turned off for this 
        // federated server
        serverInfo._restInfoDfd = this._getTokenSvcUrl(resUrl, true);
        serverInfo.hasServer = true;
      }
    }
    
    /*dfd.resUrl_ = resUrl;
    dfd.sinfo_ = serverInfo;

    if (this._busy) {
      if (esri._hasSameOrigin(resUrl, this._busy.resUrl_, true)) {
        this._soReqs.push(dfd);
      }
      else {
        this._xoReqs.push(dfd);
      }
    }
    else {
      // Get to work!
      this._doSignIn(dfd);
    }*/
   
    return this._enqueue(resUrl, serverInfo, options, dfd, isAdmin);
  },

  getResourceName: function(resUrl) {
    /*
     // Tests:
     console.log("servicesbeta");
     console.log("1. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer") === "SanJuan/Trails"));
     console.log("2. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer/1") === "SanJuan/Trails"));
     console.log("3. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer/1/query") === "SanJuan/Trails"));
     console.log("4. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services/USA/MapServer") === "USA"));
     console.log("5. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services") === ""));
     
     console.log("premium.arcgisonline");
     console.log("1. " + (esri.id.getResourceName("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer") === "World_Imagery"));
     console.log("2. " + (esri.id.getResourceName("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer/0") === "World_Imagery"));
     console.log("3. " + (esri.id.getResourceName("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer/0/query") === "World_Imagery"));
     console.log("4. " + (esri.id.getResourceName("https://premium.arcgisonline.com/Server/rest/services/Reference/World_Transportation/MapServer/0") === "Reference/World_Transportation"));
     console.log("5. " + (esri.id.getResourceName("https://premium.arcgisonline.com/Server/rest/services") === ""));
     
     console.log("hosted services");
     console.log("1. " + (esri.id.getResourceName("https://servicesdev.arcgis.com/f7ee40282cbc40998572834591021976/arcgis/rest/services/cities_States/FeatureServer/0") === "cities_States"));
     console.log("1. " + (esri.id.getResourceName("https://arcgis.com/f7ee40282cbc40998572834591021976/arcgis/rest/services/cities_States/FeatureServer/0") === "cities_States"));
     
     console.log("misc server");
     console.log("1. " + (esri.id.getResourceName("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer?f=json&dpi=96&transparent=true&format=png8&callback=dojo.io.script.jsonp_dojoIoScript2._jsonpCallback") === "SanJuan/Trails"));
     console.log("2. " + (esri.id.getResourceName("http://10.113.11.36:8080/rest/services/st/MapServer") === "st"));
     console.log("3. " + (esri.id.getResourceName("http://10.113.11.36:8080/rest/services") === ""));
     console.log("4. " + (esri.id.getResourceName("http://etat.geneve.ch/ags1/rest/services/Apiculture/MapServer") === "Apiculture"));

     console.log("arcgis.com items");
     console.log("1. " + (esri.id.getResourceName("") === ""));
    */

    if (this._isRESTService(resUrl)) {
      // arcgis server resource
      return resUrl.replace(this._regexSDirUrl, "").replace(this._regexServerType, "") ||
          "";
    }
    else {
      // Assumed geowarehouse resource. Since username is easily identifiable
      // we'll give it the highest priority
      return (this._gwUser.test(resUrl) && resUrl.replace(this._gwUser, "$1")) ||
          (this._gwItem.test(resUrl) && resUrl.replace(this._gwItem, "$1")) ||
          (this._gwGroup.test(resUrl) && resUrl.replace(this._gwGroup, "$1")) ||
          "";
    }
  },
  
  generateToken: function(serverInfo, userInfo, options) {
    var isAdmin, serverUrl, token, 
        requestUrl, reqObj, ssl,
        appLocation = new Url(window.location.href.toLowerCase()),
        esri_auth = this._getEsriAuthCookie(),
        auth_tier,
        
        // We don't need to use HTTP POST when generating server-scoped token
        // from a portal secured with IWA/PKI authentication (or token authentication)
        // - because we are not exchanging sensitive information such as user
        // name and password.
        //
        // More importantly using GET resolves the following issue:
        // HTTP POST request has to be routed through an application proxy.
        // But browsers will not share HTTP Authentication headers for 
        // DomainA with proxy hosted on DomainB - this results in generateToken
        // returning 401 Unauthorized error - and the resource that triggered
        // authentication becomes inaccessible.
        forceHttpGet = !userInfo,
        
        serverValidity = serverInfo.shortLivedTokenValidity,
        validity;
    
    // Do not set "expiration" when generating server-scoped token:
    // Token service automatically applies the expiration of portal token
    // onto the server tokens.
    // Starting at 10.2.1, token service honors expiration if passed by
    // the client. By not setting it we'll get a server token that is
    // for the same duration as portal token.
    if (userInfo) {
      validity = esriKernel.id.tokenValidity || 
                 serverValidity || 
                 esriKernel.id.defaultTokenValidity;

      if (validity > serverValidity) {
        validity = serverValidity;
      }
    }
    
    if (options) {
      isAdmin = options.isAdmin;
      serverUrl = options.serverUrl;
      token = options.token;
      ssl = options.ssl;

      // ArcGIS Server Manager App uses this customParameters object to
      // send "encrypted" parameter to Admin token service      
      serverInfo.customParameters = options.customParameters;
    }
    
    if (isAdmin) {
      requestUrl = serverInfo.adminTokenServiceUrl;
    }
    else {
      requestUrl = serverInfo.tokenServiceUrl;
      reqObj = new Url(requestUrl.toLowerCase());
      
      if (esri_auth) {
        auth_tier = esri_auth.auth_tier;
        auth_tier = auth_tier && auth_tier.toLowerCase();
      }
      
      if (
        // For a portal with IWA/PKI authentication, portal back-end
        // creates the esri_auth cookie with this auth_tier property.
        (auth_tier === "web" || serverInfo.webTierAuth) &&
        
        // We're here to generate server-scoped token
        options && options.serverUrl &&
        
        // Portal has allSSL = false
        !ssl && 
        
        appLocation.scheme === "http" &&
        (
          urlUtils.hasSameOrigin(appLocation.uri, requestUrl, true) ||
          (
            //appLocation.scheme === "http" &&
            reqObj.scheme === "https" &&

            appLocation.host === reqObj.host &&

            appLocation.port === "7080" && 
            reqObj.port === "7443"
          )
        )
      ) {
        // Downgrade from HTTPS to HTTP to avoid cross-domain requests
        requestUrl = requestUrl
                      .replace(/^https:/i, "http:")
                      .replace(/:7443/i, ":7080");
        
        // Typically portal token service requires HTTPS. For portal
        // with web-tier auth, this is relaxed.
      }

      if (forceHttpGet && this._rePortalTokenSvc.test(serverInfo.tokenServiceUrl)) {
        // Remove /rest/ from URL since /sharing/rest/generateToken doesn't allow any GET requests
        requestUrl = requestUrl.replace(/\/rest/i, "");
      }
    }
    
    // This request will work for servers 10.0 SP 1 and later versions
    var generate = esriRequest(
      lang.mixin(
        {
          url: requestUrl,
          
          content: lang.mixin(
            {
              request: "getToken",
              username: userInfo && userInfo.username,
              password: userInfo && userInfo.password,
              
              serverUrl: serverUrl,
              
              // portal-token to be exchanged for server-token
              token: token,
              
              // TODO
              // Looks like the arcgis server token service always uses the 
              // configured expiration setting for short-lived tokens.
              // Doesn't seem to honor this parameter
              // What about agol token service?
              expiration: validity,
              
              // Token service of ArcGIS Online Sharing API requires some sort of
              // client identifier: http://dev.arcgisonline.com/apidocs/sharing/index.html?generatetoken.html
              referer: (
                isAdmin || 
                this._rePortalTokenSvc.test(serverInfo.tokenServiceUrl)
              ) ? 
                window.location.host : 
                null,
                
              // TODO
              // Make sure all our proxies forward HTTP Referer header
              
              client: isAdmin ? "referer" : null,
              
              f: "json"
            }, 
            serverInfo.customParameters
          ),
          
          handleAs: "json",
          callbackParamName: forceHttpGet ? "callback" : undefined
        }, 
        options && options.ioArgs
      ), 
      {
        usePost: !forceHttpGet, 
        
        disableIdentityLookup: true,
        // TODO
        // CORS is not supported by token service at 10.1
        // Update version check below if token service is not fixed at 10.1 SP1
        useProxy: this._useProxy(serverInfo, options)
      }
    );
    
    generate.then(function(response) {
      // request.error wrapper function in esri.request is not
      // returning error object. We've got to handle this case here.
      // However, note that error handler passed in the request object
      // for esri.request will still be called. But since the error
      // wrapper does not return the error object deferred's errbacks
      // are not called. Fix esri.request but watch out for regressions 
      /*if (response.error) {
        return dojo.mixin(new Error(), response.error);
      }*/
     
      // TODO
      // The following block of code could potentially handle server
      // versions 10.0 and above if "handleAs" is set to "text"
      /*if (response) {
        if (dojo.isString(response)) {
          try {
            var json = dojo.fromJson(response);
            if (json && json.token) {
              response = json;
            }
          }
          catch(e) {
            console.error("Caught error: ", e);
            response = {
              token: response
            };
          }
        }
      }*/
     
      if (!response || !response.token) {
        var err = new Error("Unable to generate token");
        err.code = "IdentityManagerBase." + 3;
        err.log = dojoConfig.isDebug;
        return err;
      }
      
      //console.log("token generation complete: ", dojo.toJson(response));
      
      // Store credentials in keyring for later use
      var server = serverInfo.server;
      if (!keyring[server]) {
        keyring[server] = {};
      }
      
      // TODO
      // Don't store pwd in plain text.
      if (userInfo) {
        keyring[server][userInfo.username] = userInfo.password;
      }
      
      response.validity = validity;
      
      return response;
    });
    
    generate.then(null, function(error) {
      //console.log("token generation failed: ", error.code, error.message);
    });
    
    return generate;
  },
  
  /*setPortalDomain: function(domain) {
    this._portalDomain = domain;
  },*/
 
  isBusy: function() {
    return !!this._busy;
  },
  
  checkSignInStatus: function(resUrl) {
    // Calling getCredential means that:
    // 1. ServerInfo object will be created.
    // 2. Credential object will be created if the user has already
    //    logged in.
    return this.getCredential(resUrl, { prompt: false });
  },
  
  setRedirectionHandler: function(handlerFunc) {
    this._redirectFunc = handlerFunc;
  },

  setProtocolErrorHandler: function(handlerFunc) {
    this._protocolFunc = handlerFunc;
    // return true from your handler if you want to proceed anyway
    // with the mismatch
  },

  signIn: function() {
    /**
     * To be implemented by sub-classes
     * Arguments:
     *      <String> resUrl 
     *  <ServerInfo> serverInfo
     *     <Object>  options?
     */
  },

  oAuthSignIn: function() {
    /**
     * To be implemented by sub-classes
     * Arguments:
     *      <String> resUrl
     *  <ServerInfo> serverInfo
     *   <OAuthInfo> oAuthInfo
     *      <Object> options?
     */
  },

  destroyCredentials: function() {
    if (this.credentials) {
      // create a shallow clone since cred.destroy() mutates credentials
      var creds = this.credentials.slice();
      array.forEach(creds, function(cred) {
        cred.destroy();
      });
    }
    this.emit("credentials-destroy");
  },

  /*******************
   * Internal Members
   *******************/

  _getOAuthHash: function() {
    var hashStr = window.location.hash;
    if (hashStr) {
      if (hashStr.charAt(0) === "#") {
        hashStr = hashStr.substring(1);
      }
      var hash = ioquery.queryToObject(hashStr);
      var clearHash = false;
      if (hash.access_token && hash.expires_in && hash.state && hash.hasOwnProperty("username")) {
        // assume this is an OAuth token
        hash.state = JSON.parse(hash.state);
        this._oAuthHash = hash;
        clearHash = true;
      }
      else if (hash.error && hash.error_description) {
        // assume this is an OAuth error
        console.log("IdentityManager OAuth Error: ", hash.error, " - ", hash.error_description);
        if (hash.error === "access_denied") {
          clearHash = true;
        }
      }
      if (clearHash && (!has("ie") || has("ie") > 8)) {
        window.location.hash = "";
      }
    }
  },

  _findCredential: function(resUrl, options) {
    var idx = -1,
        cred, owningSystemUrl, portalCred, sinfo,
        lastToken = options && options.token,
        fedResource = options && options.resource,
        resScope = this._isServerRsrc(resUrl) ? "server" : "portal",
    
        // Get all creds from the same service instance
        creds = array.filter(this.credentials, function(crd) {
          return (
            this._hasSameServerInstance(crd.server, resUrl) &&
            crd.scope === resScope
          );
        }, this);
    
    resUrl = fedResource || resUrl;
    
    if (creds.length) {
      if (creds.length === 1) {
        cred = creds[0];
        
        sinfo = this.findServerInfo(cred.server);
        owningSystemUrl = sinfo && sinfo.owningSystemUrl;
        portalCred = owningSystemUrl && 
                      //!legacyFederation(sinfo, this._legacyFed) && 
                      this.findCredential(owningSystemUrl, cred.userId);

        idx = this._getIdenticalSvcIdx(resUrl, cred);
        
        if (lastToken) {
          if (idx !== -1) {
            // [ CASE 1 ]
            // Remove the existing credential for this resource.
            // Obviously it did not work for the caller.
            // Challenge again.
            cred.resources.splice(idx, 1);
            
            this._removeResource(resUrl, portalCred);

            //if (!creds[0].resources.length) {
              //this.credentials.splice(dojo.indexOf(this.credentials, creds[0]), 1);
              
              // This implies that there shouldnt be any credential
              // without a single rsrc
              
              // The end-user may enter the same userid-password combo
              // for a server for which there is already a credential
              // Make sure we don't call token service for a userId-server
              // combo that is already in credentials
              // See execute_ function in _createLoginDialog (IdentityManager.js)
            //}
          }
          //else {
            // [ CASE 2 ]
            // User tried using this token on a service that is different
            // from the one it was generated for.
            // Challenge.
          //}
        }
        else {
          // [ CASE 3 ]
          if (idx === -1) {
            cred.resources.push(resUrl);
          }
          
          this._addResource(resUrl, portalCred);
          
          return cred;
        }
      }
      else { // we have multiple creds (i.e. users) for the server hosting this resource
        // Find the credential with resource on the same service as
        // this request
        var found, i;
        
        array.some(creds, function(crd) {
          i = this._getIdenticalSvcIdx(resUrl, crd);
          if (i !== -1) {
            // I don't expect to see multiple creds for resources from one
            // service
            found = crd;
            
            sinfo = this.findServerInfo(found.server);
            owningSystemUrl = sinfo && sinfo.owningSystemUrl;
            portalCred = owningSystemUrl && 
                          //!legacyFederation(sinfo, this._legacyFed) && 
                          this.findCredential(owningSystemUrl, found.userId);
            
            idx = i;
            return true;
          }
          return false;
        }, this);

        if (lastToken) {
          if (found) {
            // [ CASE 4 ]
            found.resources.splice(idx, 1);
            
            this._removeResource(resUrl, portalCred);

            //if (!found.resources.length) {
              //this.credentials.splice(dojo.indexOf(this.credentials, found), 1);
            //}
          }
          //else {
            // [ CASE 5 ]
            // We don't expect to be here
          //}
        }
        else {
          if (found) {
            this._addResource(resUrl, portalCred);
            
            // [ CASE 6 ]
            return found;
          }
          //else {
            // [ CASE 7 ]
            // There are more than one matching credentials for this
            // server but none of them on the same service as this resource
            // The user-experience can't be screwed up anymore than it already
            // is, let's challenge the user.
            // If the resulting token doesn't work, the next try would land in
            // CASE 4
            
            // TODO
            // What if there is a credential with resources.length = 0. Such a
            // credential could have been left over from a previous attempt to
            // create credential for another secured service on this server
            // We could potentially try such credential in this case.
          //}
        }
      }
    }
  },

  _findOAuthInfo: function(resUrl) {
    var oAuthInfo = this.findOAuthInfo(resUrl);
    if (!oAuthInfo) {
      array.some(this.oAuthInfos, function(info) {
        if (this._isIdProvider(info.portalUrl, resUrl)) {
          oAuthInfo = info;
        }
        return !!oAuthInfo;
      }, this);
    }
    return oAuthInfo;
  },

  _addResource: function(resUrl, portalCred) {
    // Add this resUrl to the related portal credential
    if (portalCred) {
      if (this._getIdenticalSvcIdx(resUrl, portalCred) === -1) {
        portalCred.resources.push(resUrl);
      }
    }
  },
  
  _removeResource: function(resUrl, portalCred) {
    var idx = -1;

    // Remove this resUrl from the related portal credential
    if (portalCred) {
      idx = this._getIdenticalSvcIdx(resUrl, portalCred);
      
      if (idx > -1) {
        portalCred.resources.splice(idx, 1);
      }
    }
  },
  
  _useProxy: function(sinfo, options) {
    // Returns true if generateToken has to use proxy - even overriding 
    // CORS support
    return (
            options && 
            options.isAdmin && 
            !urlUtils.hasSameOrigin(sinfo.adminTokenServiceUrl, window.location.href)
           ) || 
           (
            !this._isPortalDomain(sinfo.tokenServiceUrl) && 
             sinfo.currentVersion == 10.1 &&
            !urlUtils.hasSameOrigin(sinfo.tokenServiceUrl, window.location.href)
           );
  },
  
  _getOrigin: function(resUrl) {
    var uri = new Url(resUrl);
    return uri.scheme + "://" + uri.host + (esriLang.isDefined(uri.port) ? (":" + uri.port) : "");
  },

  _getServerInstanceRoot: function(resUrl) {
    /*
    // Test cases:
    console.log(esri.id._getServerInstanceRoot("http://sampleserver6.arcgisonline.com/arcgis/rest/services") === "http://sampleserver6.arcgisonline.com/arcgis");
    console.log(esri.id._getServerInstanceRoot("http://utility.arcgis.com/usrsvcs/servers/6ae7fb0319a74f8cac3088b085b388d2/rest/services/DEU_Nexiga/MapServer") === "http://utility.arcgis.com/usrsvcs/servers/6ae7fb0319a74f8cac3088b085b388d2");
    console.log(esri.id._getServerInstanceRoot("http://portalhostqa.ags.esri.com/gis/sharing/servers/9cfff55a4c854188b0e6599e23a43315/rest/services/Wildfire_secure/MapServer") === "http://portalhostqa.ags.esri.com/gis/sharing/servers/9cfff55a4c854188b0e6599e23a43315");
    console.log(esri.id._getServerInstanceRoot("http://server.esri.com/arcgis/admin") === "http://server.esri.com/arcgis");
    console.log(esri.id._getServerInstanceRoot("http://portal.esri.com/gis/sharing") === "http://portal.esri.com/gis");
    console.log(esri.id._getServerInstanceRoot("http://portal.esri.com/gis") === "http://portal.esri.com/gis");
    console.log(esri.id._getServerInstanceRoot("http://www.arcgis.com/sharing") === "http://www.arcgis.com");
    console.log(esri.id._getServerInstanceRoot("http://www.arcgis.com/") === "http://www.arcgis.com");
    */
    var lcResUrl = resUrl.toLowerCase();

    // look for '/rest/services'
    var idx = lcResUrl.indexOf(this._agsRest);

    // look for '/admin'
    if (idx === -1 && this._isAdminResource(resUrl)) {
      idx = lcResUrl.indexOf("/admin");
    }

    // look for '/sharing'
    if (idx === -1) {
      idx = lcResUrl.indexOf("/sharing");
    }

    // look if resUrl ends with /
    if (idx === -1 && lcResUrl.substr(-1) === "/") {
      idx = lcResUrl.length - 1;
    }

    return (idx > -1 ? resUrl.substring(0, idx) : resUrl);
  },

  _hasSameServerInstance: function(instUrl, resUrl) {
    /*
    // Test cases:
    console.log(esri.id._hasSameServerInstance("http://sampleserver6.arcgisonline.com/arcgis", "http://sampleserver6.arcgisonline.com/arcgis/rest/services"));
    console.log(esri.id._hasSameServerInstance("http://portal.esri.com/GIS", "http://portal.esri.com/gis/sharing"));
    console.log(esri.id._hasSameServerInstance("http://portal.esri.com/gis", "http://portal.esri.com/gis"));
    console.log(esri.id._hasSameServerInstance("http://www.arcgis.com", "http://www.arcgis.com/sharing"));
    console.log(esri.id._hasSameServerInstance("http://www.arcgis.com", "https://www.arcgis.com/"));
    console.log(!esri.id._hasSameServerInstance("http://www.esri.com", "http://www.arcgis.com"));
    */
    instUrl = instUrl.toLowerCase(); // instUrl is expected to be the service instance root
    resUrl = this._getServerInstanceRoot(resUrl).toLowerCase();

    // remove scheme
    instUrl = instUrl.substr(instUrl.indexOf(":"));
    resUrl = resUrl.substr(resUrl.indexOf(":"));

    return instUrl === resUrl;
  },

  _sanitizeUrl: function(url) {
    url = urlUtils.fixUrl(lang.trim(url));
    
    var proxyUrl = (esriConfig.request.proxyUrl || "").toLowerCase(),
        mark = proxyUrl ? 
                url.toLowerCase().indexOf(proxyUrl + "?") : 
                -1;
    
    if (mark !== -1) {
      // This URL is of the form: http://example.com/proxy.jsp?http://target.server.com/...
      url = url.substring(mark + proxyUrl.length + 1);
    }
    
    return urlUtils.urlToObject(url).path;
  },
  
  _isRESTService: function(resUrl) {
    return (resUrl.indexOf(this._agsRest) > -1);
  },
  
  _isAdminResource: function(resUrl) {
    return this._agsAdmin.test(resUrl) || this._adminSvcs.test(resUrl);
  },
  
  _isServerRsrc: function(resUrl) {
    return (this._isRESTService(resUrl) || this._isAdminResource(resUrl));
  },
  
  _isIdenticalService: function(resUrl1, resUrl2) {
    // It is assumed that the two resources are from the same origin
    
    // Ideally, this method would be named "_haveIdenticalSecBoundary"
    // For ArcGIS Server resources, we know that a "service" defines the
    // security boundary i.e., it is possible that two different services 
    // be accessed using two different users.
   
    var retVal;
   
    if (this._isRESTService(resUrl1) && this._isRESTService(resUrl2)) {
      var name1 = this._getSuffix(resUrl1).toLowerCase(), 
          name2 = this._getSuffix(resUrl2).toLowerCase();
      
      retVal = (name1 === name2);
      
      if (!retVal) {
        // Consider "s1/MapServer" and "s1/FeatureServer" as belonging to the same
        // security boundary (FS is just an extension of MS)
        var regex = /(.*)\/(MapServer|FeatureServer).*/ig;
        retVal = (name1.replace(regex, "$1") === name2.replace(regex, "$1"));
      }
    }
    else if (this._isAdminResource(resUrl1) && this._isAdminResource(resUrl2)) {
      retVal = true;
    }
    else if (
      // It is possible that a portal and arcgis server are deployed on
      // a single host. We got to make sure that both resUrl1 and resUrl2
      // not server resources (implying that they are portal resources)
      !this._isServerRsrc(resUrl1) &&
      !this._isServerRsrc(resUrl2) &&  
      
      // It is possible to identify all portal resources by checking
      // for "/sharing/rest/*" path in the URL, but this can only be done
      // after making sure that JSAPI and Portal/Online modules have
      // stopped using the old "/sharing/*" path in URLs.
      this._isPortalDomain(resUrl1)
    ) {
      // indicates both are geowarehouse resources
      retVal = true;
    }
   
    return retVal;
  },
  
  _isPortalDomain: function(resUrl) {
    resUrl = resUrl.toLowerCase();

    var resAuthority = (new Url(resUrl)).authority,
        portalCfg = this._portalConfig,
        
        // arcgis.com?
        // TODO
        // Need to get rid of this check.
        found = (resAuthority.indexOf(this._agolSuffix) !== -1); 
    
    // are we running within an app hosted on an on-premise portal?
    // i.e. not hosted at "*.arcgis.com". If so, check if the resource
    // has the same origin as esriGeowConfig.restBaseUrl
    if (!found && portalCfg) {
      found = this._hasSameServerInstance(this._getServerInstanceRoot(portalCfg.restBaseUrl), resUrl);
    }
    
    // are we running within a custom js app? If so, check if the resource
    // has the same origin as "esri.arcgis.utils.arcgisUrl"
    if (!found) {
      if (!this._arcgisUrl) {
        // See esri/arcgis/utils.js
        var arcgisUrl = lang.getObject("esri.arcgis.utils.arcgisUrl");
        if (arcgisUrl) {
          this._arcgisUrl = (new Url(arcgisUrl)).authority;
        }
      }
      
      if (this._arcgisUrl) {
        found = (this._arcgisUrl.toLowerCase() === resAuthority);
      }
    }
    
    // Search _portals if required
    if (!found) {
      found = array.some(this._portals, function(portal) {
        return this._hasSameServerInstance(portal, resUrl);
      }, this);
    }
    
    found = found || this._agsPortal.test(resUrl);
    
    return found;
  },
  
  _isIdProvider: function(server, resource) {
    // server and resource are assumed one of portal domains
    // This method is called from FeatureLayer._forceIdentity as well
    
    /*
     // Tests:
     var app = "http://www.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://www.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tiles.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://services.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://apps.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "https://www.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "http://candor.maps.arcgis.com") === true));
     console.log("7. " + (esri.id._isIdProvider(app, "http://candordev.maps.arcgis.com") === true));
     console.log("8. " + (esri.id._isIdProvider(app, "http://candordevext.maps.arcgis.com") === true));
     console.log("9. " + (esri.id._isIdProvider(app, "http://candorqa.maps.arcgis.com") === true));
     console.log("10. " + (esri.id._isIdProvider(app, "http://candorqaext.maps.arcgis.com") === true));

     app = "https://www.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://www.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tiles.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://services.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://apps.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "https://www.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "https://candor.maps.arcgis.com") === true));
     console.log("7. " + (esri.id._isIdProvider(app, "https://candordev.maps.arcgis.com") === true));
     console.log("8. " + (esri.id._isIdProvider(app, "https://candordevext.maps.arcgis.com") === true));
     console.log("9. " + (esri.id._isIdProvider(app, "http://candorqa.maps.arcgis.com") === true));
     console.log("10. " + (esri.id._isIdProvider(app, "http://candorqaext.maps.arcgis.com") === true));

     app = "http://qaext.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://qaext.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tilesqaext.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://servicesqaext.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "https://qaext.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "http://tilesqa.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "http://servicesqa.arcgis.com") === true));
     console.log("7. " + (esri.id._isIdProvider(app, "http://appsqa.arcgis.com") === true));
     console.log("8. " + (esri.id._isIdProvider(app, "http://candorqa.maps.arcgis.com") === false));
     console.log("9. " + (esri.id._isIdProvider(app, "http://candorqaext.maps.arcgis.com") === false));

     app = "http://teamqa.maps.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://www.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tiles.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://services.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://apps.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "http://teamqa.maps.arcgis.com") === true));

     app = "http://teamqaext.maps.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://www.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tiles.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://services.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://apps.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "http://teamqaext.maps.arcgis.com") === true));

     app = "http://appsqa.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://qaext.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tilesqaext.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://servicesqaext.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "https://qaext.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "http://tilesqa.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "http://servicesqa.arcgis.com") === true));
     console.log("7. " + (esri.id._isIdProvider(app, "http://appsqa.arcgis.com") === true));

     app = "http://devext.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://devext.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tilesdevext.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://servicesdevext.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://servicesdev.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "https://devext.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "http://candor.mapsdevext.arcgis.com") === true));
     console.log("7. " + (esri.id._isIdProvider(app, "http://candordev.maps.arcgis.com") === false));
     console.log("8. " + (esri.id._isIdProvider(app, "http://candordevext.maps.arcgis.com") === false));

     app = "http://dev.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://dev.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tilesdev.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://servicesdev.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "https://dev.arcgis.com") === true));

     app = "http://teamdevext.maps.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://www.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tiles.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://services.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://apps.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "http://teamdevext.maps.arcgis.com") === true));

     app = "http://candor.mapsdevext.arcgis.com";
     console.log(app);
     console.log("1. " + (esri.id._isIdProvider(app, "http://devext.arcgis.com") === true));
     console.log("2. " + (esri.id._isIdProvider(app, "http://tilesdevext.arcgis.com") === true));
     console.log("3. " + (esri.id._isIdProvider(app, "http://servicesdevext.arcgis.com") === true));
     console.log("4. " + (esri.id._isIdProvider(app, "http://servicesdev.arcgis.com") === true));
     console.log("5. " + (esri.id._isIdProvider(app, "https://devext.arcgis.com") === true));
     console.log("6. " + (esri.id._isIdProvider(app, "http://candor.mapsdevext.arcgis.com") === true));
    */
    
    var i = -1, j = -1;
    
    array.forEach(this._gwDomains, function(domain, idx) {
      if (i === -1 && domain.regex.test(server)) {
        i = idx;
      }
      if (j === -1 && domain.regex.test(resource)) {
        j = idx;
      }
    });
    
    var retVal = false;
    
    if (i > -1 && j > -1) {
      if (i === 0 || i === 4) {
        if (j === 0 || j === 4) {
          retVal = true;
        }
      }
      else if (i === 1) {
        if (j === 1 || j === 2) {
          retVal = true;
        }
      }
      else if (i === 2) {
        if (j === 2) {
          retVal = true;
        }
      }
      else if (i === 3) {
        if (j === 3) {
          retVal = true;
        }
      }
    }
    
    // Check if the "resource" is hosted on a server that has an owning system.
    // If so, may be "server" === "owning server"
    if (!retVal) {
      var sinfo = this.findServerInfo(resource),
          owningSystemUrl = sinfo && sinfo.owningSystemUrl;
      
      // TODO
      // Add test cases to cover this scenario
      if (
        owningSystemUrl && onlineFederation(sinfo) &&
        this._isPortalDomain(owningSystemUrl) && 
        this._isIdProvider(server, owningSystemUrl)
      ) {
        retVal = true;
      }
      
      // Recursion is eventually broken because of the fact that ServerInfo of 
      // a provider (or owning system) will not have an owningSystemUrl
    }
    
    return retVal;
  },
  
  _isPublic: function(resUrl) {
    resUrl = this._sanitizeUrl(resUrl);
    
    return array.some(this._publicUrls, function(regex) {
      return regex.test(resUrl);
    });
  },
  
  _getIdenticalSvcIdx: function(resUrl, credential) {
    var idx = -1;
    
    array.some(credential.resources, function(rsrc, i) {
      if ( this._isIdenticalService(resUrl, rsrc) ) {
        idx = i;
        return true;
      }
      
      return false;
    }, this);
    
    return idx;
  },
  
  _getSuffix: function(resUrl) {
    /*
     // Tests:
     console.log("servicesbeta");
     console.log("1. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer") === "SanJuan/Trails/MapServer"));
     console.log("2. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer/1") === "SanJuan/Trails/MapServer"));
     console.log("3. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer/1/query") === "SanJuan/Trails/MapServer"));
     console.log("4. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services/USA/MapServer") === "USA/MapServer"));
     console.log("5. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services") === ""));
     
     console.log("premium.arcgisonline");
     console.log("1. " + (esri.id._getSuffix("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer") === "World_Imagery/MapServer"));
     console.log("2. " + (esri.id._getSuffix("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer/0") === "World_Imagery/MapServer"));
     console.log("3. " + (esri.id._getSuffix("https://premium.arcgisonline.com/Server/rest/services/World_Imagery/MapServer/0/query") === "World_Imagery/MapServer"));
     console.log("4. " + (esri.id._getSuffix("https://premium.arcgisonline.com/Server/rest/services/Reference/World_Transportation/MapServer/0") === "Reference/World_Transportation/MapServer"));
     console.log("5. " + (esri.id._getSuffix("https://premium.arcgisonline.com/Server/rest/services") === ""));
     
     console.log("misc server");
     console.log("1. " + (esri.id._getSuffix("https://servicesbeta.esri.com/ArcGIS/rest/services/SanJuan/Trails/MapServer?f=json&dpi=96&transparent=true&format=png8&callback=dojo.io.script.jsonp_dojoIoScript2._jsonpCallback") === "SanJuan/Trails/MapServer"));
     console.log("2. " + (esri.id._getSuffix("http://10.113.11.36:8080/rest/services/st/MapServer") === "st/MapServer"));
     console.log("3. " + (esri.id._getSuffix("http://10.113.11.36:8080/rest/services") === ""));
     console.log("4. " + (esri.id._getSuffix("http://etat.geneve.ch/ags1/rest/services/Apiculture/MapServer") === "Apiculture/MapServer"));
    */

    return resUrl.replace(this._regexSDirUrl, "").replace(this._regexServerType, "$1");
  },
  
  _getTokenSvcUrl: function(resUrl) {
    /*
    // Test cases:
    console.log(esri.id._getTokenSvcUrl("http://www.arcgis.com/sharing") === esri.id._gwDomains[0].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://dev.arcgis.com/sharing") === esri.id._gwDomains[1].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://devext.arcgis.com/sharing") === esri.id._gwDomains[2].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://qaext.arcgis.com/sharing") === esri.id._gwDomains[3].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://tiles.arcgis.com/sharing") === esri.id._gwDomains[4].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://tilesdev.arcgis.com/sharing") === esri.id._gwDomains[2].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://tilesqa.arcgis.com/sharing") === esri.id._gwDomains[3].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://services.arcgis.com/sharing") === esri.id._gwDomains[4].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://servicesdev.arcgis.com/sharing") === esri.id._gwDomains[2].tokenServiceUrl);
    console.log(esri.id._getTokenSvcUrl("http://servicesqa.arcgis.com/sharing") === esri.id._gwDomains[3].tokenServiceUrl);
    esri.id._portalConfig = { restBaseUrl: "http://portal.usgs.gov" };
    console.log(esri.id._getTokenSvcUrl("http://portal.usgs.gov/sharing") === "https://portal.usgs.gov/sharing/generateToken");
    */
   
    var adminUrl, promise, idx,
        restRsrc = this._isRESTService(resUrl);
   
    if (restRsrc || this._isAdminResource(resUrl)) {
      //return resUrl.substring(0, resUrl.toLowerCase().indexOf("/arcgis/") + "/arcgis/".length) + "tokens";

      idx = resUrl.toLowerCase().indexOf(
        restRsrc ? this._agsRest : "/admin/"
      );
      
      adminUrl = resUrl.substring(0, idx) + "/admin/generateToken";
      resUrl = resUrl.substring(0, idx) + "/rest/info";
      
      // Always use HTTPS version of the rest/info resource for 
      // hosted services - because some organizations may have strict
      // SSL requirement for all resources (in such cases HTTP is not
      // available)
      /*if (this._isPortalDomain(resUrl) && !forceHTTP) {
        resUrl = resUrl.replace(/http:/i, "https:");
      }*/
     
      // When portal and server have the same web adaptor and the portal
      // has web-tier authentication (IWA, PKI), adding a federated service
      // to the map viewer (loaded over HTTP) results in a rest/info request 
      // over HTTPS: this causes unnecessary cross-domain complications because
      // the user is currently signed into the host over HTTP only. 
      // Let's not enforce HTTPS here. Instead let the request pipeline do 
      // this if the server requires SSL.
      
      promise = esriRequest({
        url: resUrl,
        content: { f: "json" },
        handleAs: "json",
        callbackParamName: "callback"
      });
      
      promise.adminUrl_ = adminUrl;
      
      return promise;
    }
    else if (this._isPortalDomain(resUrl)) {
      var url = "";
          
      array.some(this._gwDomains, function(domain) {
        if (domain.regex.test(resUrl)) {
          url = domain.tokenServiceUrl;
        }
        
        return !!url;
      });
      
      if (!url) {
        array.some(this._portals, function(portal) {
          if (this._hasSameServerInstance(portal, resUrl)) {
            url = portal + this._gwTokenUrl;
          }
          
          return !!url;
        }, this);
      }
      
      if (!url) {
        idx = resUrl.toLowerCase().indexOf("/sharing");
        
        if (idx !== -1) {
          url = resUrl.substring(0, idx) + this._gwTokenUrl;
        }
      }

      if (!url) {
        // On-premise Portal?
        url = this._getOrigin(resUrl) + this._gwTokenUrl;
      }
      
      if (url) {
        var port = new Url(resUrl).port;
        
        // Portal installation presents 7080/7443 port number pair
        // to the user. It's hard-coded now, but ideally we would
        // make a call to portal/self resource to identify the ports 
        if (/^http:\/\//i.test(resUrl) && port === "7080") {
          url = url.replace(/:7080/i, ":7443");
        }

        url = url.replace(/http:/i, "https:");
      }
      
      return url;
    }
    else if (resUrl.toLowerCase().indexOf("premium.arcgisonline.com") !== -1) {
      return "https://premium.arcgisonline.com/server/tokens";
    }
    /*else if (this._isAdminResource(resUrl)) {
      idx = resUrl.toLowerCase().indexOf("/admin/");
      
      adminUrl = resUrl.substring(0, idx + "/admin/".length) + "generateToken";
      resUrl = resUrl.substring(0, idx) + "/rest/info";
      
      dfd = esriRequest({
        url: resUrl,
        content: { f: "json" },
        handleAs: "json",
        callbackParamName: "callback"
      });
      
      dfd.adminUrl_ = adminUrl;
      
      return dfd;
    }*/
  },
  
  _getPortalSelf: function(selfUrl, resUrl) {
    var pageScheme = window.location.protocol;
  
    if (pageScheme === "https:") {
      // Browsers block HTTP requests when the page scheme is HTTPS.
      // So, lets switch to HTTPS.
      // Portals support both HTTP and HTTPS protocols
      selfUrl = selfUrl.replace(/^http:/i, "https:").replace(/:7080/i, ":7443");
    }
    else if (/^http:/i.test(resUrl)) {
      // If the page scheme is HTTP and the triggering resource protocol is HTTP,
      // then let's just stick to HTTP.
      // If the portal requires SSL, esriRequest will switch to HTTPS if needed.
      selfUrl = selfUrl.replace(/^https:/i, "http:").replace(/:7443/i, ":7080");
    }

    return esriRequest({
      url: selfUrl,
            
      content: { 
        f: "json" 
      },
      
      handleAs: "json",
      callbackParamName: "callback"
    }, {
      // Let's do JSONP and avoid cross domain issues with XHR and web-tier authentication
      crossOrigin: false,
      
      disableIdentityLookup: true
    });
  },
  
  /*_signedIn: function(resUrl) {
    var sinfo = this.findServerInfo(resUrl),
        owningSystemUrl = sinfo && sinfo.owningSystemUrl,
        portalInfo = owningSystemUrl && this.findServerInfo(owningSystemUrl);
    
    return !!(
      (sinfo && sinfo.webTierAuth) ||
      (portalInfo && portalInfo.webTierAuth)
    );
  },*/
  
  // This method is used by FeatureLayer to force identity on itself
  // for certain cases. See FeatureLayer._forceIdentity
  // May also be used by CityEngine web viewer app
  _hasPortalSession: function() {
    return !!this._getEsriAuthCookie();
  },

  _getEsriAuthCookie: function() {
    var result;

    if (dojoCookie.isSupported()) {
      var esriAuthValues = this._getAllCookies("esri_auth"), i;
      
      for (i = 0; i < esriAuthValues.length; i++) {
        var esriAuth = JSON.parse(esriAuthValues[i]);
        // return the cookie that is set by the portal app
        if (esriAuth.portalApp) {
          result = esriAuth;
          break;
        }
      }
    }

    return result;
  },

  _getAllCookies: function(/*String*/name) {
    // summary:
    //		Get all the values for a cookie.
    // description:
    //		Returns an array with all the values of the cookie.
    //		Use when there may be more than one cookie with the same name.
    // name:
    //		Name of the cookie

    var ret = [], i;
    var c = document.cookie;
    var matches = c.match(new RegExp("(?:^|; )" + regexp.escapeString(name) + "=([^;]*)", "g"));
    
    if (matches) {
      for (i = 0; i < matches.length; i++) {
        var match = matches[i];
        var idx = match.indexOf("=");
        if (idx > -1) {
          match = match.substring(idx + 1);
          ret.push(decodeURIComponent(match));
        }
      }
    }
    return ret; // String[]
  },

  _doPortalSignIn: function(resUrl) {
    if (dojoCookie.isSupported()) {
      // Create credential from cookie if the app is hosted on one of the
      // arcgis.com domains
      //var appOrigin = this._getOrigin(window.location.href),
      var esri_auth = this._getEsriAuthCookie(),
          portalCfg = this._portalConfig,
          appUrl = window.location.href,
          sinfo = this.findServerInfo(resUrl);
      //console.log("esri_auth: ", esri_auth);
      
      if (
        this.useSignInPage && 
        (portalCfg || this._isPortalDomain(appUrl) || esri_auth) && 
        (
          sinfo ? 
            (
              sinfo.hasPortal ||
              (sinfo.owningSystemUrl && this._isPortalDomain(sinfo.owningSystemUrl))
            ) :
            this._isPortalDomain(resUrl)
        ) && 
        ( 
          this._isIdProvider(appUrl, resUrl) || 
          (
            portalCfg && 
            (
              this._hasSameServerInstance(this._getServerInstanceRoot(portalCfg.restBaseUrl), resUrl) ||
              this._isIdProvider(portalCfg.restBaseUrl, resUrl)
            )
          ) || 
          // This same-origin check allows portal application templates  
          // (published) to share esri_auth cookie created by the associated 
          // portal website.
          urlUtils.hasSameOrigin(appUrl, resUrl, true)
         )
      ) {
        return true;
      }
    }
    
    return false;
  },
  
  _checkProtocol: function(resUrl, sinfo, errbackFunc, isAdmin) {
    var proceed = true, 
        tokenSvcUrl = isAdmin ? sinfo.adminTokenServiceUrl : sinfo.tokenServiceUrl;
    
    // Is the app running over HTTP and the user has configured a secure
    // token service endpoint? If so, abort by default unless the app has
    // registered a protocol error handler to handle this scenario
    if (
      lang.trim(tokenSvcUrl).toLowerCase().indexOf("https:") === 0 && 
      window.location.href.toLowerCase().indexOf("https:") !== 0 && // true implies the proxy has to be HTTP as well
      (
        !esriConfig.request.useCors ||
        (
          !urlUtils.canUseXhr(tokenSvcUrl) &&
          !urlUtils.canUseXhr(urlUtils.getProxyUrl(true).path)
        ) 
      )
    ) {
      proceed = this._protocolFunc ? !!this._protocolFunc({
        resourceUrl: resUrl,
        serverInfo: sinfo
      }) : false;
      
      // On arcgis.com, the above function call will not return.
      // Instead the page will be reloaded over HTTPS

      if (!proceed) {
        var err = new Error("Aborted the Sign-In process to avoid sending password over insecure connection.");
        err.code = "IdentityManagerBase." + 4;
        err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
        console.log(err.message);
        errbackFunc(err);
      }
    }
    
    return proceed;
  },
  
  _enqueue: function(resUrl, serverInfo, options, dfd, isAdmin, refreshCredential) {
    // This method is the entry point if you want the user to
    // go through a sign-in process (dialog box or redirection)
    
    if (!dfd) {
      dfd = new Deferred(dfdUtils._dfdCanceller);
    }
    
    dfd.resUrl_ = resUrl;
    dfd.sinfo_ = serverInfo;
    dfd.options_ = options;
    dfd.admin_ = isAdmin;
    dfd.refresh_ = refreshCredential;

    if (this._busy) {
      if (this._hasSameServerInstance(this._getServerInstanceRoot(resUrl), this._busy.resUrl_)) {
        if (this._oAuthDfd && this._oAuthDfd.oAuthWin_) {
          this._oAuthDfd.oAuthWin_.focus(); // give an existing OAuth window focus
        }
        this._soReqs.push(dfd);
      }
      else {
        this._xoReqs.push(dfd);
      }
    }
    else {
      // Get to work!
      this._doSignIn(dfd);
    }

    return dfd.promise;
  },
  
  _doSignIn: function(dfd) {
    this._busy = dfd;
    
    var self = this;
    
    // TODO
    // callbackFunc, errbackFunc, signIn and federatedSignIn should be
    // moved out of here.
    
    var callbackFunc = function(credential) {
      //console.log("challenge complete: ", credential && dojo.toJson(credential._toJson()));
      
      var fedResource = dfd.options_ && dfd.options_.resource,
          resUrl = dfd.resUrl_,
          refreshCredential = dfd.refresh_,
          silent = false;
      
      if (array.indexOf(self.credentials, credential) === -1) {
        // Credential does not exist
        if (refreshCredential && array.indexOf(self.credentials, refreshCredential) !== -1) {
          // IdMgr dialog returned a new instance for a credential
          // that already exists.
          refreshCredential.userId = credential.userId;
          refreshCredential.token = credential.token;
          refreshCredential.expires = credential.expires;
          refreshCredential.validity = credential.validity;
          refreshCredential.ssl = credential.ssl;
          refreshCredential.creationTime = credential.creationTime;
          silent = true;
          credential = refreshCredential;
        }
        else {
          self.credentials.push(credential);
        }
      }
      
      if (!credential.resources) {
        credential.resources = [];
      }
      
      credential.resources.push(fedResource || resUrl);
      credential.scope = self._isServerRsrc(resUrl) ? "server" : "portal";
      
      credential.emitTokenChange();
      
      // Process pending requests for the same origin
      var reqs = self._soReqs, bucket = {};
      self._soReqs = [];
      
      //if (!self._isPortalDomain(resUrl)) {
        array.forEach(reqs, function(reqDfd) {
          if (!this._isIdenticalService(resUrl, reqDfd.resUrl_)) {
            var suffix = this._getSuffix(reqDfd.resUrl_);
           
            if (!bucket[suffix]) {
              bucket[suffix] = true;
              credential.resources.push(reqDfd.resUrl_);
            }
          }
        }, self);
      //}
      
      dfd.callback(credential);
      
      array.forEach(reqs, function(reqDfd) {
        reqDfd.callback(credential);
      });
      
      self._busy = dfd.resUrl_ = dfd.sinfo_ = dfd.refresh_ = null;

      if (!silent) {
        self.emit("credential-create", { credential: credential });
      }
      
      // It is possible that dfd.callback resolution above resulted 
      // in an update to _soReqs list (see _enqueue call in federatedSignIn).
      // Can happen when the arcgis server and owning portal are deployed
      // on the same host.
      if (self._soReqs.length) {
        self._doSignIn(self._soReqs.shift());
      }
      
      // Process pending requests for different origins
      if (self._xoReqs.length) {
        self._doSignIn(self._xoReqs.shift());
      }
    },
    
    errbackFunc = function(error) {
      //console.log("challenge failed: ", error.code, error.message);
      
      dfd.errback(error);
      
      self._busy = dfd.resUrl_ = dfd.sinfo_ = dfd.refresh_= null;
      
      // TODO
      // Should we call errback for requests from the same service?
      
      // Process pending requests for the same origin
      if (self._soReqs.length) {
        self._doSignIn(self._soReqs.shift());
      }

      // Process pending requests for different origins
      if (self._xoReqs.length) {
        self._doSignIn(self._xoReqs.shift());
      }
    },
    
    signIn = function(username, allSSL, portalToken, tokenExpiration) {
      var sinfo = dfd.sinfo_, 
          prompt = !dfd.options_ || dfd.options_.prompt !== false,
          cred, err;
      
      if (self._doPortalSignIn(dfd.resUrl_)) {
        // Apps running in arcgis.com or on-premise portal go through this 
        // code path
        
        // Create credential from cookie if the app is hosted on one of the
        // arcgis.com domains
        var esri_auth = self._getEsriAuthCookie(),
            portalCfg = self._portalConfig;
        //console.log("esri_auth: ", esri_auth);
          
        // Initialize IdentityManager using the credential info from cookie
        if (esri_auth) {
          callbackFunc(new Credential({
            userId: esri_auth.email,
            server: sinfo.server,
            token: esri_auth.token,
            expires: null // We don't know the expiration time of this token
          }));
          
          return;
        }
        else if (!prompt) {
          err = new Error("User is not signed in.");
          err.code = "IdentityManagerBase." + 6;
          err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
          errbackFunc(err);
        }
        else {
          // TODO
          // Should we show a message to the user before performing this 
          // redirection?
          
          // Send the user to ArcGIS.com sign-in page which in-turn will redirect
          // the user back to this page
          var signInUrl = "", appUrl = window.location.href;
          
          if (self.signInPage) {
            signInUrl = self.signInPage;
          }
          else if (portalCfg) {
            signInUrl = portalCfg.baseUrl + portalCfg.signin;
          }
          else if (self._isIdProvider(appUrl, dfd.resUrl_)) {
            signInUrl = self._getOrigin(appUrl) + "/home/signin.html";
          }
          else {
            signInUrl = sinfo.tokenServiceUrl.replace(self._rePortalTokenSvc, "") + 
                        "/home/signin.html";
          }
          
          // Always use HTTPS version of the portal sign-in page
          signInUrl = signInUrl.replace(/http:/i, "https:");
          
          if (portalCfg && portalCfg.useSSL === false) {
            // Dev setups such as may.esri.com typically don't have SSL enabled
            signInUrl = signInUrl.replace(/https:/i, "http:");
          }
          
          if (appUrl.toLowerCase().replace("https", "http").indexOf(signInUrl.toLowerCase().replace("https", "http")) === 0) {
            // we don't want to trigger another signin workflow from "within" 
            // signin page. OTOH, you'd also want such requests to use 
            // "disableIdentityLookup" option and handle "token required" errors.
            
            err = new Error("Cannot redirect to Sign-In page from within Sign-In page. URL of the resource that triggered this workflow: " + dfd.resUrl_);
            err.code = "IdentityManagerBase." + 5;
            err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
            errbackFunc(err);
          }
          else {
            if (self._redirectFunc) {
              self._redirectFunc({
                signInPage: signInUrl,
                returnUrlParamName: "returnUrl",
                returnUrl: appUrl,
                resourceUrl: dfd.resUrl_,
                serverInfo: sinfo
              });
            }
            else {
              window.location = signInUrl + "?returnUrl=" + window.escape(appUrl);
            }
          }
          
          // In any case we're done with sign-in process
          return;
        }
      }
      else if (username) {
        // Portal uses web-tier authentication (IWA/PKI)
        callbackFunc(new Credential({
          userId: username,
          server: sinfo.server,
          token: portalToken,
          expires: esriLang.isDefined(tokenExpiration) ? Number(tokenExpiration) : null,
          ssl: !!allSSL
        }));
      }
      else if (oAuthInfo) {
        var oAuthCred = oAuthInfo._oAuthCred;

        if (!oAuthCred) {
          var localOCred = new OAuthCredential(oAuthInfo, window.localStorage);
          var sessionOCred = new OAuthCredential(oAuthInfo, window.sessionStorage);
          if (localOCred.isValid() && sessionOCred.isValid()) {
            // use the one that expires last and destroy the other one
            if (localOCred.expires > sessionOCred.expires) {
              oAuthCred = localOCred;
              sessionOCred.destroy();
            }
            else {
              oAuthCred = sessionOCred;
              localOCred.destroy();
            }
          }
          else {
            oAuthCred = localOCred.isValid() ? localOCred : sessionOCred;
          }
          oAuthInfo._oAuthCred = oAuthCred;
        }

        if (oAuthCred.isValid()) {
          callbackFunc(new Credential({
            userId: oAuthCred.userId,
            server: sinfo.server,
            token: oAuthCred.token,
            expires: oAuthCred.expires,
            ssl: oAuthCred.ssl,
            _oAuthCred: oAuthCred
          }));
        }
        else if (self._oAuthHash && self._oAuthHash.state.portalUrl === oAuthInfo.portalUrl) {
          var oAuthHash = self._oAuthHash;
          cred = new Credential({
            userId: oAuthHash.username,
            server: sinfo.server,
            token: oAuthHash.access_token,
            expires: (new Date()).getTime() + (Number(oAuthHash.expires_in) * 1000),
            ssl: oAuthHash.ssl === "true",
            oAuthState: oAuthHash.state,
            _oAuthCred: oAuthCred
          });
          oAuthCred.storage = oAuthHash.persist ? window.localStorage : window.sessionStorage;
          oAuthCred.token = cred.token;
          oAuthCred.expires = cred.expires;
          oAuthCred.userId = cred.userId;
          oAuthCred.ssl = cred.ssl;
          oAuthCred.save();
          self._oAuthHash = null;
          callbackFunc(cred);
        }
        else if (!prompt) {
          err = new Error("User is not signed in.");
          err.code = "IdentityManagerBase." + 6;
          err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
          errbackFunc(err);
        }
        else {
          // Wire up dfd.cancel to cancel signInDfd, which
          // will end up rejecting dfd with an error.
          dfd._pendingDfd = self.oAuthSignIn(dfd.resUrl_, sinfo, oAuthInfo, dfd.options_)
              .then(callbackFunc, errbackFunc);
        }
      }
      else if (!prompt) {
        err = new Error("User is not signed in.");
        err.code = "IdentityManagerBase." + 6;
        err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
        errbackFunc(err);
      }
      else if (self._checkProtocol(dfd.resUrl_, sinfo, errbackFunc, dfd.admin_)) {
        // Standalone apps go through this code path

        var options = dfd.options_;
        if (dfd.admin_) {
          options = options || {};
          options.isAdmin = true;
        }

        // Wire up dfd.cancel to cancel signInDfd, which
        // will end up rejecting dfd with an error.
        dfd._pendingDfd = self.signIn(dfd.resUrl_, sinfo, options)
                              .then(callbackFunc, errbackFunc);
      }

      // You must to call callbackFunc or errbackFunc to finalize.
    },
    
    federatedSignIn = function() {
      // At Portal v2.1 we will be here only for on-premise federated servers
      // i.e. not ending with ".arcgis.com"
      
      // 1. Get portal-token first.
      // 2. Then generate server-token using portal-token.
      // http://mediawikidev.esri.com/index.php/REST/RRH/ConsumingFederatedServices

      var sinfo = dfd.sinfo_,
          owningSystemUrl = sinfo.owningSystemUrl,
          options = dfd.options_, token, inError,
          portalCred;

      if (options) {
        token = options.token;
        inError = options.error;
      }
      
      portalCred = self._findCredential(owningSystemUrl, {
        token: token,
        resource: dfd.resUrl_
      });
      
      if (!portalCred && onlineFederation(sinfo)) {
        // If there is no credential that exactly matches the
        // hostname of the owning system url:
        // check if there is a credential already obtained for one of
        // the custom portal URLs. For example, if:
        // owningSystemUrl = "http://devext.arcgis.com"
        // is there an existing credential for cern.mapsdevext.arcgis.com?
        array.some(self.credentials, function(cred) {
          if (this._isIdProvider(owningSystemUrl, cred.server)) {
            portalCred = cred;
          }
          
          return !!portalCred;
        }, self);
      }
      
      if (portalCred) { // Have portal-token
        var serverCred = self.findCredential(dfd.resUrl_, portalCred.userId);
        
        if (serverCred) {
          callbackFunc(serverCred);
        }
        else if (legacyFederation(sinfo, self._legacyFed)) {
          // Use portal scoped token
          var cred = portalCred.toJSON();
          cred.server = sinfo.server;
          cred.resources = null;
          
          callbackFunc(new Credential(cred));
        }
        else {
          // Generate server-token
          var serverToken = (dfd._pendingDfd = self.generateToken(self.findServerInfo(portalCred.server), null, {
            serverUrl: dfd.resUrl_,
            token: portalCred.token,
            ssl: portalCred.ssl
          }));
          
          // DEBUG ONLY
          /*serverToken.addCallbacks(
            function(response) {
              console.log("server-token: ", response);
            },
            function(error) {
              console.log("server-token generation error: ", error);
            }
          );*/
          
          serverToken.then(
            function(response) {
              callbackFunc(new Credential({
                userId: portalCred.userId,
                server: sinfo.server,
                token: response.token,
                expires: esriLang.isDefined(response.expires) ? Number(response.expires) : null,
                ssl: !!response.ssl,
                isAdmin: dfd.admin_,
                validity: response.validity
              }));
            },
            
            errbackFunc
          );
        }
      }
      else { // User must sign-in to portal first
        // Yield context to portal credential acquisition
        self._busy = null;
        
        if (token) {
          dfd.options_.token = null;
        }
        
        var portalToken = (dfd._pendingDfd = self.getCredential(
          owningSystemUrl.replace(/\/?$/, "/sharing"), 
          {
            resource: dfd.resUrl_,
            token: token,
            error: inError
          }
        ));
        
        portalToken.then(
          function(credential) {
            //console.log("portal-token: ", credential);
            self._enqueue(dfd.resUrl_, dfd.sinfo_, dfd.options_, dfd, dfd.admin_);
            
            // After this function exits, eventually we'll find ourselves
            // in the "if (portalCred)" block of federatedSignIn flow above.
          },
          
          function(error) {
            //console.log("portal-token generation error: ", error);
            errbackFunc(error);
          }
        );
      }
    };

    var owningSystemUrl = dfd.sinfo_.owningSystemUrl,
        serverRsrc = this._isServerRsrc(dfd.resUrl_),
        restInfoDfd = dfd.sinfo_._restInfoDfd,
        oAuthInfo = this._findOAuthInfo(dfd.resUrl_);

    if (!restInfoDfd) {
      if (
        serverRsrc && 
        owningSystemUrl
      ) {
        federatedSignIn();
      }
      else {
        if (dfd.sinfo_._selfDfd) {
          var selfHandler = function(selfRsrc) {
            // See: http://devext.arcgis.com/apidocs/rest/portalsself.html
            //console.log("portal/self response: ", selfRsrc);
            dfd.sinfo_._selfDfd = null;
  
            var username = selfRsrc && selfRsrc.user && selfRsrc.user.username,
                allSSL = selfRsrc && selfRsrc.allSSL;
                
            dfd.sinfo_.webTierAuth = !!username;
            
            // Get portal token for portals secured with IWA - only if 
            // the application has opted into it.
            if (username && self.normalizeWebTierAuth) {
              dfd.sinfo_._tokenDfd = self.generateToken(dfd.sinfo_, null, {
                ssl: allSSL
              });
              
              var portalTokenHandler = function(tokenResponse) {
                dfd.sinfo_._tokenDfd = null;
                
                // We'll SignIn with what we got.
                signIn(
                  username,
                  allSSL, 
                  tokenResponse && tokenResponse.token,
                  tokenResponse && tokenResponse.expires
                );
              };
              
              dfd.sinfo_._tokenDfd.then(portalTokenHandler, portalTokenHandler);
            }
            else {
              // webTierAuth may be true or false
              signIn(username, allSSL);
            }
          };
  
          dfd.sinfo_._selfDfd.then(selfHandler, selfHandler);
        }
        else {
          signIn();
        }
      }
    }
    else {
      restInfoDfd
      .then(
        function(response) {
          var sinfo = dfd.sinfo_;
          sinfo.adminTokenServiceUrl = sinfo._restInfoDfd.adminUrl_;
          
          sinfo._restInfoDfd = null;

          sinfo.tokenServiceUrl = lang.getObject("authInfo.tokenServicesUrl", false, response) || 
                                  lang.getObject("authInfo.tokenServiceUrl", false, response) ||
                                  lang.getObject("tokenServiceUrl", false, response);

          sinfo.shortLivedTokenValidity = lang.getObject("authInfo.shortLivedTokenValidity", false, response);
          
          sinfo.currentVersion = response.currentVersion;
          sinfo.owningTenant = response.owningTenant;

          // Check if we already have credential for the owning portal.
          // Tokens generated for www.arcgis.com can be used for all
          // its other properties like: tiles.arcgis.com, services.arcgis.com
          // and so on for devext and qaext.
          // This will handle the case where a webmap hosted on qaext.arcgis.com
          // has a hosted map service as an operational layer but the token obtained
          // for webmap may be applicable to the hosted service as well.
          var owningSystemUrl = (sinfo.owningSystemUrl = response.owningSystemUrl);
          
          if (owningSystemUrl) {
            self._portals.push(owningSystemUrl);
          }
          
          // owningSystemUrl will be available for hosted services and 
          // on-premise arcgis servers that are federated with arcgis.com
          // or on-premise portal
          if (serverRsrc && owningSystemUrl) {
            /*if (onlineFederation(owningSystemUrl, sinfo)) { // online
              var found = self.findCredential(owningSystemUrl);
              
              // If there is no credential that exactly matches the
              // hostname of the owning system url:
              // check if there is a credential already obtained for one of
              // the custom portal URLs. For example, if:
              // owningSystemUrl = "http://devext.arcgis.com"
              // is there an existing credential for cern.mapsdevext.arcgis.com?
              if (!found) {
                array.some(self.credentials, function(cred) {
                  if (this._isIdProvider(owningSystemUrl, cred.server)) {
                    found = cred;
                  }
                  
                  return !!found;
                }, self);
              }
              
              if (found) {
                found = found.toJSON();
                found.resources = null; // we don't want to copy over "resources"
                found.server = sinfo.server;
                
                callbackFunc(new Credential(found));
                return;
              }
              
              signIn();
            }
            else {*/
              federatedSignIn();
            //}
          }
          else {
            signIn();
          }
        },
        
        function() {
          dfd.sinfo_._restInfoDfd = null;
          
          var err = new Error("Unknown resource - could not find token service endpoint.");
          err.code = "IdentityManagerBase." + 2;
          err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
          errbackFunc(err);
        }
      );
    }
  }
});

/******************
 * esri.Credential
 ******************/

Credential = declare([Accessor, esriEvented], {
  declaredClass: "esri.Credential",
  
  /****************************
   * Properties:
   *    String userId
   *    String server
   *    String token
   *    Number expires  (unix epoch time)
   *    Number validity (in minutes)
   *  String[] resources
   *    Number creationTime
   *   Boolean ssl
   *   Boolean isAdmin
   *    String scope
   *    Object oAuthState - not in json output since it's meant to be an ephemeral value
   */
  
  tokenRefreshBuffer: 2,  // 2 minutes before expiration time

  constructor: function(json) {
    lang.mixin(this, json);
    
    this.resources = this.resources || [];
    
    // Creation time provides a reference point for "validity"
    // when this credential is re-hydrated from a cookie or localStorage
    // Remember, validity takes precedence over expires when setting
    // up refresh timer
    if (!esriLang.isDefined(this.creationTime)) {
      this.creationTime = (new Date()).getTime();
    }
  },

  _oAuthCred: null,

  refreshToken: function() {
    var self = this, 
        resUrl = this.resources && this.resources[0],
        serverInfo = esriKernel.id.findServerInfo(this.server),
        owningSystemUrl = serverInfo && serverInfo.owningSystemUrl,
        federated = !!owningSystemUrl && this.scope === "server",
        legacyFed = federated &&
                    legacyFederation(serverInfo, esriKernel.id._legacyFed),
        portalInfo = federated && esriKernel.id.findServerInfo(owningSystemUrl),
        portalCred,
        isIWA = serverInfo.webTierAuth,
        normalizedIWA = isIWA && esriKernel.id.normalizeWebTierAuth,
        kserver = keyring[this.server],
        kpwd = kserver && kserver[this.userId],
        userInfo = { username: this.userId, password: kpwd },
        options;
    
    //console.log("federated = " + federated);
    
    if (isIWA && !normalizedIWA) {
      // We don't generate token for portal with web-tier authentication,
      // unless the app has opted in to "normalizing" the flow
      return;
    }

    // In case owningSystemUrl is "devext.arcgis.com" and serverInfos has
    // "cern.mapsdevext.arcgis.com"
    if (federated && !portalInfo) {
      array.some(esriKernel.id.serverInfos, function(info) {
        if (esriKernel.id._isIdProvider(owningSystemUrl, info.server)) {
          portalInfo = info;
        }
        
        return !!portalInfo;
      });
    }

    portalCred = portalInfo && 
                 esriKernel.id.findCredential(portalInfo.server, this.userId);
    
    if (federated && !portalCred) {
      // This would be an assertion error. There has to be a portal credential
      // that spawned this credential
      return;
    }
    
    if (legacyFed) {
      // This is a credential for federated server in legacy mode and hence
      // cannot be refreshed autonomously.
      portalCred.refreshToken();
      return;
    }
    else if (federated) {
      // Go ahead and re-generate server scoped token
      options = {
        serverUrl: resUrl,
        token: portalCred && portalCred.token,
        ssl: portalCred && portalCred.ssl
      };
    }
    else if (normalizedIWA) {
      userInfo = null;
      options = { ssl: this.ssl };
    }
    // We may not have pwd if this credential was created as a result
    // of re-hydrating the state of IdentityManager from a cookie or
    // localStorage. Note that IdentityManagerBase.toJSON will not
    // return pwds
    else if (!kpwd) {
      var promise;
      
      if (resUrl) {
        resUrl = esriKernel.id._sanitizeUrl(resUrl);
        
        // Indicates this credential has been enqueued for user sign-in
        this._enqueued = 1;
        
        // Let's ask the user for password and generate token. 
        // TODO
        // We could perhaps go through getCredential instead of inventing 
        // _enqueue, but _findCredential (as it is implemented today) will  
        // totally remove "this" credential from its inventory
        promise = esriKernel.id._enqueue(resUrl, serverInfo, null, null, this.isAdmin, this);
        
        // When this dfd resolves successfully, "this" credential
        // will be automatically refreshed with a new token.
        // See callbackFunc in _doSignIn method.
        // TODO
        // However what if the user entered a different user credential
        // now and token generation succeeds?
        // Solution #1: show the existing userId in the dialog box
        // Solution #2: tolerate this new userId which may fail layer
        // when the consumer of this credential accessed the resource
        
        promise.then(function() {
          self._enqueued = 0;
          self.refreshServerTokens();
        })
        .then(null, function() {
          self._enqueued = 0;
        });
        
        // TODO
        // If this dfd fails, the existing token will eventually fail at 
        // some point in the future.
      }
      
      return promise;
    }
    else if (this.isAdmin) {
      options = { isAdmin: true };
    }

    return esriKernel.id.generateToken(
      federated ? portalInfo : serverInfo, 
      federated ? null : userInfo, 
      options
    )
    .then(function(response) {
      self.token = response.token;
      self.expires = esriLang.isDefined(response.expires) ? 
                      Number(response.expires) : 
                      null;
      self.creationTime = (new Date()).getTime();
      self.validity = response.validity;
      self.emitTokenChange();

      self.refreshServerTokens();
    })
    .then(null, function() {
      // TODO
      // start a timer to notify consumers when this token
      // eventually expires?
      /*if (esri._isDefined(this.expires)) {
        if ((new Date()).getTime() < this.expires) {
        }
      }*/
    });
  },

  refreshServerTokens: function() {
    // If this is a portal credential, then "manually" refresh
    // related credentials of its federated servers
    if (this.scope === "portal") {
      array.forEach(esriKernel.id.credentials, function(cred) {
        var sinfo = esriKernel.id.findServerInfo(cred.server),
            owningSystemUrl = sinfo && sinfo.owningSystemUrl;

        if (
          cred !== this &&
          cred.userId === this.userId &&
          owningSystemUrl &&
          cred.scope === "server" &&
          (
            esriKernel.id._hasSameServerInstance(this.server, owningSystemUrl) ||
            esriKernel.id._isIdProvider(owningSystemUrl, this.server)
          )
        ) {
          if (legacyFederation(sinfo, esriKernel.id._legacyFed)) {
            // Copy
            cred.token = this.token;
            cred.expires = this.expires;
            cred.creationTime = this.creationTime;
            cred.validity = this.validity;
            cred.emitTokenChange();
          }
          else {
            // Generate a new server-scoped token for federated credentials
            cred.refreshToken();
          }
        }
      }, this);
    }
  },
  
  emitTokenChange: function(autoRefresh) {
    // Be aware that we can land here when a credential is destroyed.
    // So watch out for undefined properties
    
    clearTimeout(this._refreshTimer);
    
    var serverInfo = this.server && esriKernel.id.findServerInfo(this.server),
        owningSystemUrl = serverInfo && serverInfo.owningSystemUrl,
        portalInfo = owningSystemUrl && esriKernel.id.findServerInfo(owningSystemUrl);
    
    // Start timer only for independent servers and portals
    if (
      (autoRefresh !== false) &&
      (
        !owningSystemUrl || 
        
        // Case where a portal and arcgis server are deployed on the same host 
        this.scope === "portal" ||
        
        // This is a server credential for a portal with web-tier authentication.
        (portalInfo && portalInfo.webTierAuth && !esriKernel.id.normalizeWebTierAuth)
        // Portal credential in this case has no token and expiration time and
        // so does not have a refresh timer like token-based portals
      ) && 
      ( esriLang.isDefined(this.expires) || esriLang.isDefined(this.validity) )
    ) {
      // lets setup a timer to refresh the token
      // before it expired
      this._startRefreshTimer();
    }

    this.emit("token-change");
  },
  
  destroy: function() {
    // render this credential unusable
    this.userId = this.server = this.token = this.expires = 
    this.validity = this.resources = this.creationTime = null;

    if (this._oAuthCred) {
      this._oAuthCred.destroy();
      this._oAuthCred = null;
    }

    var found = array.indexOf(esriKernel.id.credentials, this);
    if (found > -1) {
      esriKernel.id.credentials.splice(found, 1);
    }
    
    this.emitTokenChange();
    this.emit("destroy");
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
    var json = esriLang.fixJson({
      userId:       this.userId,
      server:       this.server,
      token:        this.token,
      expires:      this.expires,
      validity:     this.validity,
      ssl:          this.ssl,
      isAdmin:      this.isAdmin,
      creationTime: this.creationTime,
      scope:        this.scope
    });
    
    var rsrcs = this.resources;
    if (rsrcs && rsrcs.length > 0) {
      json.resources = rsrcs;
    }
    
    return json;
  },
  
  _startRefreshTimer: function() {
    clearTimeout(this._refreshTimer);

    var buffer = this.tokenRefreshBuffer * 60000,
        expires = this.validity ? 
                    (this.creationTime + (this.validity * 60000)) : 
                    this.expires,
        delay = (expires - (new Date()).getTime());
    
    if (delay < 0) {
      // We need to do this because IE 8 doesn't fire if delay is negative.
      // Other browsers treat negative delay as 0ms which is expected
      delay = 0;
      
      // delay=0 indicates the function will be executed after the
      // current "JS context" has been executed
    }
    
    this._refreshTimer = setTimeout(
      lang.hitch(this, this.refreshToken),
      (delay > buffer) ? (delay - buffer) : delay
    );
    
    // TODO
    // Test setTimeout behavior after system wakeup
  }
});

IdentityManagerBase.Credential = Credential;

return IdentityManagerBase;  
});
