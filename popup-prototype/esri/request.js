/**
 * @classdesc
 * Retrieve data from a remote server or upload a file.
 *
 * @module esri/request
 * @amdalias esriRequest
 * @since 4.0
 */
define(
[
  "require",
  "dojo/_base/array",
  "dojo/_base/config",
  "dojo/_base/Deferred",
  "dojo/_base/lang",
  "dojo/_base/url",
  "dojo/_base/xhr",
  
  "dojo/io/script",
  "dojo/io/iframe",
  "dojo/dom-construct",
  "dojo/io-query",
  "dojo/when",
  
  "./kernel",
  "./config",
  "./core/sniff",
  "./core/lang",
  "./core/urlUtils",
  "./core/deferredUtils"
],
function(
  require, array, dojoConfig, Deferred, lang, Url, xhr, 
  script, iframe, domConstruct, ioq, when,
  esriKernel, esriConfig, has, esriLang, urlUtils, dfdUtils
) {
  
  var _reqPreCallback, reqConfig = esriConfig.request,
      
      // 403 message codes that should not be handled by identity manager
      idMsgSkipCodes = [ "COM_0056", "COM_0057"],

      // used to create a unique _ts parameter
      _counter = 0;
  
  function getSchemeLessOrigin(url) {
    url = new Url(url);
    return (url.host + (url.port ? (":" + url.port) : "")).toLowerCase();
  }
  
  function _makeRequest(/*Object*/ req, /*Object?*/ options, /*Boolean?*/ isMultipart, isFormData) {
    // pre-process options
    var useProxy = false, usePost = false, crossOrigin;
    
    if (esriLang.isDefined(options)) {
      if (lang.isObject(options)) {
        useProxy = !!options.useProxy;
        usePost = !!options.usePost;
        
        // User override to enable or disable CORS request on per-request
        // basis
        crossOrigin = options.crossOrigin;
      }
      else { // backward compatibility
        useProxy = !!options;
      }
    }
    
    req = lang.mixin({}, req);
    
    if (req._ssl) {
      // Fix the protocol before making the request
      req.url = req.url.replace(/^http:/i, "https:");
      
      // TODO
      // What about the port number for HTTPS protocol?
      // Port number could be different for ArcGIS Server where a web
      // adaptor is not configured
      // For example: at 10.1, HTTP runs on 6080 and HTTPS on 6443 by default
    }
    
    var content = req.content,
        path = req.url,
        form = isMultipart && req.form;
    
    crossOrigin = esriLang.isDefined(crossOrigin) ? 
                    crossOrigin : 
                    reqConfig.useCors;
  
    // Intercept and check for REST error
    req.load = function(response) {
      var err;
      
      if (response) {
        if (response.error) {
          err = lang.mixin(new Error(), response.error);
          err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
        }
        else if (response.status === "error") { // arcgis server admin resource
          err = lang.mixin(new Error(), response /*{
            code: response.code,
            message: response.messages && response.messages.join && response.messages.join(".")
          }*/);
          
          // TODO
          // How does the admin service communicate SSL requirement
          // (if required)?
          
          err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
        }
        
        if (err && !esriLang.isDefined(err.httpCode)) {
          err.httpCode = err.code;
        }
      }
      
      return err || response;
    };
    
    // Intercept and create proper JS Error object
    req.error = function(error, io) {
      if (io && io.xhr) {
        io.xhr.abort();
      }
  
      if (!(error instanceof Error)) {
        error = lang.mixin(new Error(), error);
      }
      
      error.log = dojoConfig.isDebug; // see Deferred.js:reject for context
      
      return error;
    };
   
    if (req._token) {
      req.content = req.content || {};
      req.content.token = req._token;
    }
  
    // get the length of URL string
    var len = 0, otq;
    if (content && path) {
      otq = ioq.objectToQuery(content);
      len = otq.length + path.length + 1;
      if ( has("esri-url-encodes-apostrophe") ) {
        len = otq.replace(/'/g, "%27").length + path.length + 1;
      }
    }
  
    req.timeout = esriLang.isDefined(req.timeout) ? req.timeout : reqConfig.timeout;
    req.handleAs = req.handleAs || "json";
  
    // send the request
    try {
      var proxyUrl, proxyPath,
          canDoXo = crossOrigin && 
                    urlUtils.canUseXhr(req.urlObj) && 
                    !(/https?:\/\/[^\/]+\/[^\/]+\/admin\/?(\/.*)?$/i.test(req.url)),
          sameOrigin = (urlUtils.hasSameOrigin(req.urlObj, esriKernel.appUrl) || canDoXo),
          doPost = (usePost || isMultipart || len > reqConfig.maxUrlLength) ? true : false,
          doJSONP = (!sameOrigin && req.handleAs.indexOf("json") !== -1 && req.callbackParamName && !isMultipart) ? true : false,
          // TODO
          // Override forceProxy and useProxy for sameOrigin requests?
          doProxy = (
                      !!urlUtils.getProxyRule(req.url) ||
                      reqConfig.forceProxy || 
                      useProxy || 
                      ((!doJSONP || doPost) && !sameOrigin) 
                    ) ? true : false; 
      
      /*if (!doJSONP && request.handleAs.indexOf("json") !== -1) {
        console.log("esri.request: if the service you're trying to call supports JSONP response format, then you need to set 'callbackParamName' option in the request. Consult the service documentation to find out this callback parameter name.");
      }*/
      
      if (isMultipart && !has("esri-file-upload") && !doProxy && canDoXo) {
        // CORS does not help make iframe.send. Iframe technique inherently
        // requires strict same-origin condition
        doProxy = true;
      }
      
      if (doProxy) {
        proxyUrl = urlUtils.getProxyUrl(path, crossOrigin);
        
        proxyPath = proxyUrl.path;
        
        // We need to use HTTPS endpoint for the proxy if the resource 
        // being accessed has HTTPS endpoint
        //proxyPath = esri._fixProxyProtocol(proxyPath, path);
        
        if (proxyUrl._xo) {
          canDoXo = true;
        }
        
        // Make sure we dont have to post 
        if (!doPost && (proxyPath.length + 1 + len) > reqConfig.maxUrlLength) {
          doPost = true;
        }
  
        // Modify the request object as necessary
        req.url = proxyPath + "?" + path;
        
        if (doPost) {
          req.content = lang.mixin(proxyUrl.query || {}, content);
        }
        else {
          var kvString = ioq.objectToQuery(lang.mixin(proxyUrl.query || {}, content));
          if (kvString) {
            req.url += ("?" + kvString);
          }
          
          req.content = null;
        }
        
        //console.log("[ Using PROXY ]: ", path);
      }
      
      if (doJSONP && !doPost) { // using dynamic SCRIPT tag
        // Background info:
        // Servery seems to be slow responding to some queries at certain times 
        // and as a result queries sent after this slow request are blocked on 
        // the client. Server returned the response to these blocked queries but 
        // they are not processed(jsonp script execution) by Firefox until the 
        // slow request has either succeeded or timed out. This has to do with 
        // how Firefox handles script tags. This issue has been fixed at 
        // Firefox 3.6 (via an async attribute to script tags)  
        // Chrome, Safari and IE exhibit async=true by default
        // References:
        // http://trac.dojotoolkit.org/ticket/11953
        // https://developer.mozilla.org/En/HTML/Element/Script
        // http://stackoverflow.com/questions/2804212/dynamic-script-addition-should-be-ordered
        // http://blogs.msdn.com/b/kristoffer/archive/2006/12/22/loading-javascript-files-in-parallel.aspx
        // http://code.google.com/p/jquery-jsonp/issues/detail?id=20
        // http://tagneto.blogspot.com/2010/01/script-async-raindrop-and-firefox-36.html
        if (!esriLang.isDefined(req.isAsync) && has("ff") < 4) {
          // Default is true for FF 3.6 if the caller did not set it
          req.isAsync = true;
        }
  
        //console.log("++++++++++++++++[ dojo.io.script.get ]");
        return script.get(_reqPreCallback ? _reqPreCallback(req) : req);
      }
      else {
        // Background info: http://trac.dojotoolkit.org/ticket/9486
        var hdrs = req.headers;
        if (canDoXo && (!hdrs || !hdrs.hasOwnProperty("X-Requested-With"))) {
          hdrs = req.headers = (hdrs || {});
          // Prevent unnecessary preflighted CORS request
          hdrs["X-Requested-With"] = null;
        }
        
        // Make form modifications for multipart requests
        if (isMultipart) {
          var paramName = req.callbackParamName || "callback.html", 
              elementName = req.callbackElementName || "textarea",
              param, found, paramValue, i, il = form.elements ? form.elements.length : 0, el;
          
          // Copy content over to the form
          content = req.content;
          if (content) {
            for (param in content) {
              paramValue = content[param];
              
              if (esriLang.isDefined(paramValue)) {
                found = null;
                
                for (i = 0; i < il; i++) {
                  el = form.elements[i];
                  if (el.name === param) {
                    found = el;
                    break;
                  }
                }
                
                /*dojo.some(form.elements, function(el) {
                  if (el.name === param) {
                    found = el;
                    return true;
                  }
                  return false;
                });*/
                
                if (found) {
                  found.value = paramValue;
                }
                else {
                  if (isFormData) {
                    form.append(param, paramValue);
                  }
                  else {
                    form.appendChild( domConstruct.create("input", { type: "hidden", name: param, value: paramValue }) );
                  }
                }
              }
            }
          }
          
          if (has("esri-file-upload")) {
            //console.log("[req FormData]");
            
            // Remove "callback.html" if present in the form, because
            // we're going to process the response as normal JSON
            array.forEach(form.elements, function(el) {
              if (el.name === paramName) {
                //console.log("Removed callback.html element from the form");
                form.removeChild(el);
              }
            });
            
            // This usage of contentType is available after backporting a 
            // Dojo 1.7 patch to Dojo 1.6.1.
            // See: dojo/_base/xhr.js - dojo.xhr
            // http://trac.dojotoolkit.org/changeset/25326/dojo
            req.contentType = false;
            req.postData = isFormData ? form : new FormData(form);
            delete req.form;
          }
          else {
            //console.log("[req IFrame]");
            
            form.enctype = "multipart/form-data";
            if (has("ie") < 9) {
              // In IE, dynamically setting the value of "enctype" attribute
              // does not seem to take effect
              form.encoding = "multipart/form-data";
            }
            form.method = "post";
            
            // Add "callback.html" if not already in the form
            if ( !array.some(form.elements, function(el) { return el.name === paramName; }) ) {
              form.appendChild( domConstruct.create("input", { type: "hidden", name: paramName, value: elementName }) );
            }
      
            // A version of arcgis server before 10.1 (.net or java) would fail without
            // callback.html parameter in the URL for add and update attachment operations
            if (path.toLowerCase().indexOf("addattachment") !== -1 || path.toLowerCase().indexOf("updateattachment") !== -1) {
              req.url = path + ((path.indexOf("?") === -1) ? "?" : "&") + paramName + "=" + elementName;
              if (doProxy) {
                req.url = proxyPath + "?" + req.url;
              }
              //console.log("fixed: " + req.url);
            }
            
            // iframe typically supports content object. However IE 7 (IE 8 in IE 7 standards mode)
            // throws an error related to element focus if this is not deleted here.
            // Could be something to do with iframe impl deleting form elements that it
            // adds from content object
            delete req.content;
          }
        }

        // Starting at Portal 10.2 Patch, portals that use web-tier 
        // authentication will support CORS requests with credentials
        // as described here:
        // https://developer.mozilla.org/en-US/docs/HTTP/Access_control_CORS#Access-Control-Allow-Credentials
        if (canDoXo && !req.hasOwnProperty("withCredentials")) {
          var reqUrl = doProxy ? proxyPath : path;

          if (array.indexOf(reqConfig.webTierAuthServers, getSchemeLessOrigin(reqUrl)) !== -1) {
            //console.log("withCredentials: ", reqUrl);
            req.withCredentials = true;
          }
          else if (esriKernel.id) {
            var sinfo = esriKernel.id.findServerInfo(reqUrl);
            
            if (sinfo && sinfo.webTierAuth) {
              //console.log("withCredentials: ", reqUrl);
              req.withCredentials = true;
            }
          }
        }
        
        req = _reqPreCallback ? _reqPreCallback(req) : req;
            
        // TODO
        // Connect xhr download and upload progress events for
        // xhr get and post
        
        if (doPost) {
          if (isMultipart && !has("esri-file-upload")) {
            //console.log("++++++++++++++++[ dojo.io.iframe.send ]");
            return iframe.send(req);
          }
          else {
            if (!doProxy && has("safari")) {
              // make sure Safari doesn't use its cache
              req.url += ((req.url.indexOf("?") === -1) ? "?" : "&") + "_ts=" + (new Date()).getTime() + _counter++;
            }
            //console.log("++++++++++++++++[ dojo.rawXhrPost ]");
            return xhr.post(req);
          }
        }
        else {
          //console.log("++++++++++++++++[ dojo.xhrGet ]");
          return xhr.get(req);
        }
      }
    }
    catch (e) {
      var dfd = new Deferred();
      dfd.errback(req.error(e));
      return dfd;
    }
  }

  function _disableCors(url) {
    //console.log("esri._disableCors: ", url);

    var corsStatus = reqConfig.corsStatus,
        found = urlUtils.canUseXhr(url, true);

    if (found > -1) {
      //console.log("index: ", found);
      reqConfig.corsEnabledServers.splice(found, 1);
    }

    corsStatus[getSchemeLessOrigin(url)] = 1;

    return found;
  }
  
  function _detectCors(req) {
    // I know we don't want to get used to the habit of using try-catch
    // programming, but esri.request is a core part of the API.
    // We don't want unexpected(*) error in the code below to affect
    // normal response processing workflow (not to mention what we're doing
    // below is an optimization - not a critical functionality)
    // Note: the term "unexpected" means the developer overlooked something
  
    var corsStatus = reqConfig.corsStatus;
    
    try {
      var origin = getSchemeLessOrigin(req.url);
      
      if (
        // Cors detection enabled
        reqConfig.corsDetection &&

        // Cors itself enabled
        reqConfig.useCors &&

        // Browser support
        has("esri-cors") &&
        
        // ServerInfo is available since version 10.0, but token service has
        // issues prior to 10 SP1
        //this.version >= 10.01 && 
        
        // Interested in ArcGIS REST resources only
        (req.url && req.url.toLowerCase().indexOf("/rest/services") !== -1) &&
        
        // AND server not already known to support CORS
        (!urlUtils.hasSameOrigin(req.urlObj, esriKernel.appUrl) && !urlUtils.canUseXhr(req.urlObj))
      ) {
        if (corsStatus[origin]) {
          return corsStatus[origin];
        }

        //console.log("***************** esri._detectCors *********** ]", url);
        //console.log("***************** [fetching server info] **************** ", origin);

        var dfd = new Deferred();
        corsStatus[origin] = dfd.promise;
        
        // TODO
        // Can we use fetch "rest/services" instead of "rest/info"? This will allow
        // 9.3 servers to get in the action.
        // How reliable and fast is "rest/services" resource?
        
        // If we use esri.request, it will use proxy to get the response.
        // We don't want that - because we want to find out if cross-origin
        // XHR works. So let's use dojo.xhrGet directly.
        xhr.get({
          url: req.url.substring(0, req.url.toLowerCase().indexOf("/rest/") + "/rest/".length) + "info",
          content: { f: "json" },
          failOk: true,
          handleAs: "json",
          headers: { "X-Requested-With": null },
          timeout: reqConfig.corsDetectionTimeout * 1000
        }).then(
          function(response) {
            //console.log("REST Info response: ", arguments);
  
            if (response) {
              // Add this server to corsEnabledServers list
              if (!urlUtils.canUseXhr(req.url)) {
                reqConfig.corsEnabledServers.push(origin);
              }
  
              // Yes - response.error is also considered as confirmation for
              // CORS support
              dfd.resolve();
            }
            else {
              // Indicates no support for CORS on this server. Older servers
              // that don't support ServerInfo will follow this path.
              // Dojo returns null in this case.
              dfd.reject();
            }
          },
          
          function(error) {
            //console.error("REST Info FAILED: ", error);
            
            // Mark this server so that we don't make info request again
            dfd.reject();
          }
        );

        return dfd.promise;
      }
    }
    catch (e) {
      console.log("esri._detectCors: an unknown error occurred while detecting CORS support");
    }
  }

  /*
   * Related info and discussion:
   * http://o.dojotoolkit.org/forum/dojo-core-dojo-0-9/dojo-core-support/ajax-send-callback
   * http://trac.dojotoolkit.org/ticket/5882
   * http://api.jquery.com/jQuery.ajax/#options
   */

  /**
   * Define a callback function that will be called just before esri/request calls into dojo IO functions such as
   * dojo.rawXhrPost and dojo.io.script.get. It provides developers an opportunity to modify the request.
   * @memberof module:esri/request
   * @instance
   * @param {function} callback - The callback function that will be executed prior to esri.request calls into dojo IO
   * functions.
   */
  function setRequestPreCallback(callback) {
    _reqPreCallback = callback;
  }

  function _processRequest(dfd, internal, req, options) {
    var form = req.form,
        // TODO
        // Both noLookup and preLookup need to be consolidated
        noLookup = options.disableIdentityLookup,
        // just do pre-request lookup; only applicable when noLookup is true
        preLookup = options._preLookup,
        /* 
        ===Workers information===
        workers are used for IO *ONLY WHEN SPECIFICALLY REQUESTED*
        workers will *never* be attempted for use *when they are not supported* by the browser
        workers can be prevented from being used no matter what other options are used by
         setting the `esri/config.request.useWorkers` value to `false`
        workers will be used for IO where supported, when one of the following conditions is true:
        - `esri/config.request.useWorkers === true` (default is 'on-request')
        - `options.useWorkers === true`
        - `options.workerOptions` is defined and has a value for either `callback` or `worker`
          if `worker` is provided it should be an instance of a WorkerClient (really a RequestClient)
          and the other `workerOptions` are ignored.
        */
        useWorker = false;
        if (has("esri-workers")) { //being verbose on purpose, let the compiler squash it.
          if (reqConfig.useWorkers !== false) {
            if (options.useWorkers === true || reqConfig.useWorkers === true) {
              useWorker = true;
            } else if (options.workerOptions) {
              var wopt = options.workerOptions;
              if (wopt.callback || (wopt.worker && wopt.worker.worker instanceof Worker)) {
                useWorker = true;
              }
            }
          }
        }
        var isFormData = form && form.append,
        isMultipart = form && (
          form.elements ?
            array.some(form.elements, function(el) { return el.type === "file"; }) :
            isFormData
        ),
        hasToken = (
                    req.url.toLowerCase().indexOf("token=") !== -1 || 
                    (req.content && req.content.token) ||
                    (isMultipart && array.some(form.elements, function(el) { return el.name === "token"; }))
                   ) ? 1 : 0;
     
    // TODO
    // Note that neither "this" request nor any subsequent request will wait
    // for the detection process to complete. Should we do this in the future?
    // Pro: CORS enabled servers will never ever see a JSONP request from JSAPI
    // Con: Is the detection process fast enough and reliable enough to justify
    //      low latency for the first request?
    
    // initialization stuff
    if (!internal) {     
      dfd.then(function(response) {
        // Check if this is a portal self resource. If so, the portal is
        // configured with WebTier authentication (IWA or PKI) if the response
        // contained a "user" object and the request was made without "token"
        if (
          /\/sharing\/rest\/accounts\/self/i.test(req.url) && 
          !hasToken && !req._token &&
          response.user && response.user.username
        ) {
          reqConfig.webTierAuthServers.push(getSchemeLessOrigin(req.url));
          //console.log("req: ", req);
          //console.log("webTierAuthServers: ", reqConfig.webTierAuthServers);
        }
        
        // Add owningSystemUrl to the parent portal credential resources:
        // - This allows subsequent portal requests to carry the token.
        // - IdMgr does not add this on its own when a portal credential is
        //   initially created on behalf of a federated service.
        //   (see _doSignIn:callbackFunc)
        var credential = req._credential;
        //console.log("final: ", req.url, credential && credential.userId);
        
        if (credential) {
          var sinfo = esriKernel.id.findServerInfo(credential.server),
              owner = sinfo && sinfo.owningSystemUrl,
              portalCred;
              
          if (owner) {
            owner = owner.replace(/\/?$/, "/sharing");
            portalCred = esriKernel.id.findCredential(owner, credential.userId);
             
            if (portalCred) {
              if (esriKernel.id._getIdenticalSvcIdx(owner, portalCred) === -1) {
                portalCred.resources.splice(0, 0, owner);
              }
            }
          }
        }
      })
        .always(function(response) {
        // This will notify the caller about SSL requirement, and let it use
        // HTTPS for any further requests so that we don't keep bumping into
        // "403 - ssl required" error - 
        // for example: feature layer query requests
        // See Layer._useSSL and _Task._useSSL
        delete req._credential;
  
        if ( 
          response && 
          // Catch XML Document response in IE
          // nodeType cannot be 0 (http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html)
          (!has("ie") || !response.nodeType) 
        ) {
          response._ssl = req._ssl;
        }

        // TODO
        // What is the strategy to return _ssl to the caller for non-json
        // response?
    
        // TODO
        // We need a formal way to return "credential" and "ssl" to the caller
        // We don't have the proper API today (in Dojo) to return a response
        // that contains data + credential + ssl + etc. However future IO
        // enhancement in Dojo would allow this - see here:
        // http://livedocs.dojotoolkit.org/dojo/request
      });
     
      // setup this dfd to invoke caller's "load" and
      // "error" functions as the first order of business
      // Based on pattern in dojo._ioSetArgs (xhr.js)
      var ld = req.load, errFunc = req.error;
      if (ld) {
        dfd.then(function(value) {
          var realDfd = dfd._pendingDfd,
              ioArgs = realDfd && realDfd.ioArgs,
              args = ioArgs && ioArgs.args;
          return ld.call(args, value, ioArgs);
        });
      }
       
      if (errFunc) {
        dfd.then(null, function(value) {
          var realDfd = dfd._pendingDfd,
              ioArgs = realDfd && realDfd.ioArgs,
              args = ioArgs && ioArgs.args;
          return errFunc.call(args, value, ioArgs);
        });
      }
      
      // TODO
      // What about caller's "handle" function?
    }
    
    // Does IdentityManager have a Credential for this Service? 
    if (esriKernel.id 
        && !hasToken && !req._token 
        && !esriKernel.id._isPublic(req.url) 
        && (!noLookup || preLookup)
        //&& esri.id.findServerInfo(req.url)
    ) {
      // We're only looking for already acquired credential, if any
      var credential = esriKernel.id.findCredential(req.url);
  
      if (credential) {
        //console.log("found existing credential = ", credential);
        req._token = credential.token;
        req._ssl = credential.ssl;
      }
    }
  
  function _setIODeferreds(dfd){
    dfd._pendingDfd = _makeRequest(req, options, isMultipart, isFormData);
    if (!dfd._pendingDfd) {
        dfd.ioArgs = dfd._pendingDfd && dfd._pendingDfd.ioArgs;
        var err = new Error("Deferred object is missing");
        err.log = dojoConfig.isDebug; // see Deferred.js:reject for context
        dfd.errback(err);
        dfd._pendingDfd = null;
        return;
      }
      
      dfd._pendingDfd
        .then(function(response) {
          // dfd.ioArgs is being accessed here: arcgis/utils.js, BasemapGallery, FeatureLayer
          // Let's pass it out to the caller
          dfd.ioArgs = dfd._pendingDfd && dfd._pendingDfd.ioArgs;
          
          dfd.callback(response);
          dfd._pendingDfd = null;
        })
        .then(null, function(error) {
          var errCode, subCode, msgCode;
          
          if (error) {
            errCode = error.code;
            subCode = error.subcode;
            msgCode = error.messageCode;
            
            msgCode = msgCode && msgCode.toUpperCase();
          }
          
          // Check for SSL required error
          if (
            error && errCode == 403 &&
            
            (
              // http://mediawikidev.esri.com/index.php/REST/RRH/Errorcodes
              subCode == 4 || 
              
              // We need to differentiate based on "message", because 403
              // can be returned for "you do not have permissions" case as well 
              (
                error.message && 
                error.message.toLowerCase().indexOf("ssl") > -1 &&
                error.message.toLowerCase().indexOf("permission") === -1 
              )
              // covers the case where arcgis server includes "folderName/serviceName"
              // in a "403: do not have permissions" error and folder or service name
              // contains "ssl" in it.
            ) 
          ) {
            //console.log("ssl = ", req._ssl);
            
            if (!req._ssl) { // prevent infinite loop, obviously something is wrong - let the error bubble up to the caller
              // Flag for esri._makeRequest to fix the protocol
              req._ssl = req._sslFromServer = true;
              
              // "_sslFromServer" is a pristine property that is not affected
              // by whatever credential is tried out for this resource
  
              _processRequest(dfd, true, req, options);
              return;
            }
          }
          else if (error && error.status == 415) {
            // Java SDS strangely supports CORS for rest/info and rest/services
            // but not for other resources like services and layers. Let's 
            // disable CORS for such servers.
            
            //console.log("CORS ERR: ", error);
            _disableCors(req.url);
  
            if (!req._err415) {
              // Indicates that we've handled 415 error once. Subsequest 415 error
              // for the "same" request (different transport) should be considered an
              // error
              req._err415 = 1; 
              
              _processRequest(dfd, true, req, options);
              return;
            }
          }
          // Check for "unauthorized access" error
          else if (esriKernel.id 
              && array.indexOf(esriKernel.id._errorCodes, errCode) !== -1 
              && !esriKernel.id._isPublic(req.url)
              && !noLookup
              // http://mediawikidev.esri.com/index.php/REST/RRH/Errorcodes
              && (
                errCode != 403 ||
                (
                  array.indexOf(idMsgSkipCodes, msgCode) === -1 &&
                  (!esriLang.isDefined(subCode) || (subCode == 2 && req._token))
                ) 
              )
              
              // TODO
              // Treat "subscription disabled" as error
          ) {
            // We're testing error."code" which is typically returned by
            // arcgis server or arcgis.com. So I think it is safe to assume
            // that we'll enter this block for urls that idmgr knows how to handle
            
            dfd._pendingDfd = esriKernel.id.getCredential(req.url, {
              token: req._token,
              error: error
            });
            dfd._pendingDfd
              .then(function(credential) {
                req._token = credential.token;
                req._credential = credential;
                
                // More weight to the fact that this request may already insist on
                // using SSL. Scenario:
                //  - Resource requires SSL
                //  - This credential is valid but for another user that does not 
                //    require SSL
                //  We don't want to lose the fact that resource still requires SSL
                req._ssl = req._sslFromServer || credential.ssl;
                // Note that it's very likely that this credential will not work
                // for this request if credential.ssl differs from req._ssl.
                // Note that credential.ssl is currently returned only by arcgis.com
                // token service and by federated arcgis server token service
                
                _processRequest(dfd, true, req, options);
              })
              .then(null, function(error) {
                dfd.errback(error);
                dfd._pendingDfd = null;
              });
            return;
          }
  
          dfd.ioArgs = dfd._pendingDfd && dfd._pendingDfd.ioArgs;
          dfd.errback(error);
          dfd._pendingDfd = null;
        });
    }
    
    if (!useWorker) {
      _setIODeferreds(dfd);
    } else {
      if(options.workerOptions && options.workerOptions.worker){
        xhr = options.workerOptions.worker;
        _setIODeferreds(dfd);
      } else {
        require(["./workers/RequestClient"], function(RequestClient) {
          if(options.workerOptions){
            var wopt = options.workerOptions;
            xhr = RequestClient.getClient(wopt.callback, wopt.cbFunction);
          } else{
            xhr = RequestClient.getClient();
          }
          _setIODeferreds(dfd);
        });
      }
    }
    
    return dfd.promise;
  }

  /**
   * Retrieve data from a remote server or upload a file from a user's computer.
   * @memberof module:esri/request
   * @method esriRequest
   * @instance
   * @param {Object} request - The request parameter is an object with the following properties that describe the request.
   * @param {string} request.callbackParamName - Name of the callback parameter (a special service parameter) to be
   * specified when requesting data in JSONP format. It is ignored for all other data formats. For ArcGIS services the
   * value is always `callback`.
   * @param {Object} request.content - If the request URL points to a web server that requires parameters, specify them
   * here. The default value is `null`.
   * @param {Object} request.form - If the request is to upload a file, specify the form element that contains the file
   * input control here. The default value is `null`. Starting at version 3.3, the form parameter can be an instance of
   * FormData. Using FormData you can send a "multipart/form-data" request to the server without having to create an
   * HTML form element in markup. Note that the FormData api is not available in all browsers.
   * @param {string} request.handleAs - Response format. The default value is `json`.<br><br>**Possible Values:** json | xml | text
   * @param {number} request.timeout - Indicates the amount of time to wait for a response from the server. The default
   * is `60000` milliseconds (one minute). Set to `0` to wait indefinitely.
   * @param {string} request.url -  **Required.** Request URL.
   * @param {Object=} options - See the object specifications table below for the structure of the options object.
   * @param {boolean} options.disableIdentityLookup - If `true`, prevents esri/request from triggering user authentication
   * for this request. Default is `false` i.e., user authentication will be performed if asked by the server.
   * @param {boolean} options.usePost {boolean} - Indicates the request should be made using HTTP POST method. Default
   * is `false` i.e., determined automatically based on the request size.
   * @param {boolean} options.useProxy - Indicates the request should use the proxy. Default is `false` i.e.,
   * determined automatically based on the domain of the request url.
   * @return {Promise} When resolved, returns the requested data.
   */
  function request(req, options) {
    req.url = urlUtils.fixUrl(req.url);    
    
    if (esriKernel.appUrl.scheme !== "file") {
        //Convert url to absolute form because IdentityManagerBase cannot handle relative resource URLs
        req.url = urlUtils.getAbsoluteUrl(req.url);
    }
    
    req.urlObj = new Url(req.url);
    
    options = options || {};
    
    var dfd = new Deferred(dfdUtils._dfdCanceller);

    when(_detectCors(req)).always(function() {
      _processRequest(dfd, false, req, options);
    });

    return dfd.promise;
  }
  
  request._makeRequest = _makeRequest;
  request._processRequest = _processRequest;
  request._disableCors = _disableCors;
  request._detectCors = _detectCors;

  request.setRequestPreCallback = setRequestPreCallback;
  
  return request;
});
