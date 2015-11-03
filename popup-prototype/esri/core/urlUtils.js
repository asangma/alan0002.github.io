define(
[
  "dojo/_base/lang",
  "dojo/_base/url",
  "dojo/io-query",
  "../kernel",
  "../config",
  "./sniff"
],
function(lang, Url, ioq, esriKernel, esriConfig, has) {
  
  var urlUtils = {},
      reqConfig = esriConfig.request,
      pageScheme = esriKernel.appUrl.scheme + ":",
      proxyNotSet = "esriConfig.request.proxyUrl is not set. If making a request to a CORS enabled server, please push the domain into esriConfig.request.corsEnabledServers.";
      
  if (pageScheme === "file:") {
    pageScheme = "http:";
  }

  // 
  var corsServersUrlCache = {},
      burstUrlCache = function() {
        urlUtils.corsServersUrlCache = corsServersUrlCache = {};
      },
      getCachedServerUrls = function(server) {
        var c = urlUtils.corsServersUrlCache;
        if (!c[server]) {
          // has protocol?
          if ((lang.trim(server).toLowerCase().indexOf("http") !== 0)) {
            c[server] = [new Url("http://" + server), new Url("https://" + server)];
          }
          else {
            c[server] = [new Url(server)];
          }
        }
        return c[server];
      };

  urlUtils.corsServersUrlCache = corsServersUrlCache;
  urlUtils.burstUrlCache = burstUrlCache;

  /**
   * Creates a dojo/_base/Url
   * @param url a string or dojo/_base/Url object
   * @returns a normalized dojo/_base/Url object
   * @private
   * TODO 4.0 create a esri/URL class
   */
  urlUtils._toURL = function(url) {
    if (typeof url === "string") {
      return new Url(urlUtils.getAbsoluteUrl(url));
    }
    if (!url.scheme) {
      url.scheme = esriKernel.appUrl.scheme;
    }
    return url;
  };
  
  urlUtils.urlToObject = function(/*String*/ url) {
    //summary: Returns an object representation of the argument url string
    // url: String: URL in the format of http://path?query
    // returns: { path:String, query:{ key:value } }: Object representing url as path string & query object

    var r = {}, dojoUrl = new Url(url), iq = url.indexOf("?");
    
    // Check if url has query parameters
    // Update the return object
    if (dojoUrl.query === null) {
      r = { path: url, query: null }; 
    } else {
      r.path =  url.substring(0, iq);
      r.query = ioq.queryToObject(dojoUrl.query);
    }
    
    // Append the Hash
    if(dojoUrl.fragment){
      r.hash = dojoUrl.fragment;
      if(dojoUrl.query === null){
        // Remove the hash from the path ( length+1 to include '#')
        r.path = r.path.substring(0, r.path.length - (dojoUrl.fragment.length + 1));
      }
    }
    
    return r;
  };
  
  urlUtils.getProxyUrl = function(resUrl, crossOrigin) {
    var isSecureResource = lang.isString(resUrl) ? 
                            (lang.trim(resUrl).toLowerCase().indexOf("https:") === 0) : 
                            resUrl, // For back-compat where isSecureResource was passed as the argument
        
        proxyUrl = reqConfig.proxyUrl,
        retVal, fixed, hasFix, proxyRule;
    
    // Use proxyUrl defined in the proxy rule if available
    if (lang.isString(resUrl)) {
      proxyRule = urlUtils.getProxyRule(resUrl);

      if (proxyRule) {
        proxyUrl = proxyRule.proxyUrl;
      }
    }
    
    if (!proxyUrl) {
      console.log(proxyNotSet);
      throw new Error(proxyNotSet);
    }
    
    if (
      isSecureResource && 
      crossOrigin !== false && 
      esriKernel.appUrl.scheme === "https"
    ) {
      fixed = proxyUrl;
      
      if (fixed.toLowerCase().indexOf("http") !== 0) { // is relative url?
        fixed = urlUtils.getAbsoluteUrl(fixed);
      }
      
      fixed = fixed.replace(/^http:/i, "https:");
      
      if (urlUtils.canUseXhr(fixed)) {
        proxyUrl = fixed;
        hasFix = 1;
      }
    }
    
    retVal = urlUtils.urlToObject(proxyUrl);
    retVal._xo = hasFix;
    
    return retVal;
  };
  
  urlUtils.addProxy = function(/*String*/ url) {
    // Prepends proxy url to the given url
    // Proxy url is either from a proxy rule or from the global configuration
    // Returns the given url unmodified if there is no proxy
    
    var proxyRule = urlUtils.getProxyRule(url),
        proxyUrl, _url, params;
    
    if (proxyRule) {
      proxyUrl = urlUtils.urlToObject(proxyRule.proxyUrl);
    }
    else if (reqConfig.forceProxy) {
      proxyUrl = urlUtils.getProxyUrl();
    }
    
    if (proxyUrl) {
      _url = urlUtils.urlToObject(url);
      url = proxyUrl.path + "?" + _url.path;
      
      params = ioq.objectToQuery(lang.mixin(proxyUrl.query || {}, _url.query));
      if (params) {
        url += ("?" + params);
      }
    }
    
    return url;
  };
  
  urlUtils.addProxyRule = function(rule) {
    /**
     *  rule = {
     *    "proxyUrl" : "<String>",
     *    "urlPrefix": "<String>"
     *  } 
     */
    
    // sanitize url
    var inPath = (urlUtils.urlToObject(rule.urlPrefix).path)
          .replace(/([^\/])$/, "$1/") // add trailing slash if required
          .replace(/^https?:\/\//ig, "") // remove protocol
          .toLowerCase(),
        rules = reqConfig.proxyRules,
        i, len = rules.length, rulePrefix,
        insertAt = len;
    
    rule.urlPrefix = inPath;

    // Sort the array in correct order: longer prefixes must be
    // inserted ahead of shorter ones (among URLs of the same origin)
    for (i = 0; i < len; i++) {
      rulePrefix = rules[i].urlPrefix;
      
      // Is incoming prefix longer than existing one?
      if (inPath.indexOf(rulePrefix) === 0) {
        if (inPath.length === rulePrefix) {
          // Duplicate. Don't add it
          return -1;
        }
        insertAt = i;
        break;
      }
      
      // Is incoming prefix shorter than existing one?
      if (rulePrefix.indexOf(inPath) === 0) {
        insertAt = i + 1;
      }
    }
    
    //reqConfig.proxyRules.push(rule);
    rules.splice(insertAt, 0, rule);
    
    return insertAt;
  };
  
  urlUtils.getProxyRule = function(url) {
    var rules = reqConfig.proxyRules,
        i, len = rules.length,
        path = (urlUtils.urlToObject(url).path)
                .replace(/([^\/])$/, "$1/")     // add trailing slash if required
                .replace(/^https?:\/\//ig, "")  // remove protocol
                .toLowerCase(),
        match;
    
    for (i = 0; i < len; i++) {
      if (path.indexOf(rules[i].urlPrefix) === 0) {
        // Rules array is already sorted by addProxyRule. So the first
        // match is "the" expected match
        match = rules[i];
        break;
      }
    }
    
    return match;
  };
  
  urlUtils.hasSameOrigin = function(url1, url2, ignoreProtocol) {
    // Returns:
    //   true - if the given urls have the same origin as defined here:
    //          https://developer.mozilla.org/en/Same_origin_policy_for_JavaScript
    //   false - otherwise
    
    // Tests:
    /*
    console.log("1. " + (esri._hasSameOrigin("http://abc.com", "http://abc.com") === true));
    console.log("2. " + (esri._hasSameOrigin("http://abc.com:9090", "http://abc.com:9090") === true));
    console.log("3. " + (esri._hasSameOrigin("https://abc.com", "https://abc.com") === true));
    console.log("4. " + (esri._hasSameOrigin("https://abc.com:9090", "https://abc.com:9090") === true));
    console.log("5. " + (esri._hasSameOrigin("http://abc.com/", "http://abc.com") === true));
    console.log("6. " + (esri._hasSameOrigin("http://abc.com/res", "http://abc.com/res2/res3") === true));
    console.log("7. " + (esri._hasSameOrigin("http://abc.com:9090/res", "http://abc.com:9090/res2/res3") === true));
  
    console.log("8. " + (esri._hasSameOrigin("http://abc.com", "http://xyz.com") === false));
    console.log("9. " + (esri._hasSameOrigin("http://abc.com", "http://abc.com:9090") === false));
    console.log("10. " + (esri._hasSameOrigin("http://abc.com", "https://abc.com") === false));
    console.log("11. " + (esri._hasSameOrigin("http://abc.com", "https://abc.com:9090") === false));
    console.log("12. " + (esri._hasSameOrigin("http://abc.com", "https://xyz.com:9090") === false));
  
    console.log("13. " + (esri._hasSameOrigin("http://abc.com", "https://abc.com", true) === true));
    console.log("14. " + (esri._hasSameOrigin("http://abc.com:9090", "https://abc.com:9090", true) === true));
    console.log("15. " + (esri._hasSameOrigin("http://xyz.com:9090", "https://xyz.com:9090", true) === true));
    
    // The following tests assume the app is hosted on "http://pponnusamy.esri.com"
    console.log("16. " + (esri._hasSameOrigin("http://pponnusamy.esri.com:9090", "/app.html") === true));
    console.log("17. " + (esri._hasSameOrigin("https://pponnusamy.esri.com:9090", "app.html") === false));
    console.log("18. " + (esri._hasSameOrigin("http://pponnusamy.esri.com:9090", "./app.html") === true));
    console.log("19. " + (esri._hasSameOrigin("https://pponnusamy.esri.com:9090", "../app.html") === false));
    
    console.log("20. " + (esri._hasSameOrigin("app.html", "/app.html") === true));
    console.log("21. " + (esri._hasSameOrigin("./app.html", "app.html") === true));
    console.log("22. " + (esri._hasSameOrigin("../app.html", "./app.html") === true));
    console.log("23. " + (esri._hasSameOrigin("/app.html", "../app.html") === true));
    
    console.log("24. " + (esri._hasSameOrigin("/app.html", "https://pponnusamy.esri.com:9090") === false));
    console.log("25. " + (esri._hasSameOrigin("app.html", "http://pponnusamy.esri.com:9090") === true));
    console.log("26. " + (esri._hasSameOrigin("./app.html", "https://pponnusamy.esri.com:9090") === false));
    console.log("27. " + (esri._hasSameOrigin("../app.html", "http://pponnusamy.esri.com:9090") === true));
  
    console.log("28. " + (esri._hasSameOrigin("app.html", "http://abc.com") === false));
    console.log("29. " + (esri._hasSameOrigin("./app.html", "http://xyz.com:9090") === false));
    */
    
    url1 = urlUtils._toURL(url1);
    url2 = urlUtils._toURL(url2);
        
    return (
      (ignoreProtocol || (url1.scheme === url2.scheme)) && 
      url1.host.toUpperCase() === url2.host.toUpperCase() && 
      url1.port === url2.port
    );
  };
  
  urlUtils.canUseXhr = function(url, returnIndex) {
    // Returns:
    //   true - if the library can make cross-origin XHR request to the
    //          given url
    //   false - otherwise
    
    // Tests:
    /*
    esri._hasCors = true;
    
    var corsServers = [
      "http://abc.com",
      "https://xyz.com",
      "http://klm.com:9090",
      "https://ijk.com:8080",
      "asdf.net",
      "asdf.net:6080"
    ];
    
    var V_TRUE = true, ALWAYS_TRUE = true, V_FALSE = false;
    
    function test_print(actual, expected) {
      if (actual === expected) {
        console.log("true");
      }
      else {
        console.info("false");
      }
    }
    
    function test_run(num) {
      console.log("(" + num + "): hasCors: " + esri._hasCors + ", #servers: " + (esri.config.request.corsEnabledServers ? esri.config.request.corsEnabledServers.length : 0) + ", #builtins: " + (esri.config.request.corsEnabledPortalServers ? esri.config.request.corsEnabledPortalServers.length : 0));
      
      test_print(esri._canDoXOXHR("http://abc.com"), V_TRUE);
      test_print(esri._canDoXOXHR("http://abc.com/res1/res2/"), V_TRUE);
      test_print(esri._canDoXOXHR("http://abc.com:99"), V_FALSE);
      test_print(esri._canDoXOXHR("https://abc.com"), V_FALSE);
      test_print(esri._canDoXOXHR("https://abc.com:99"), V_FALSE);
  
      test_print(esri._canDoXOXHR("https://xyz.com"), V_TRUE);
      test_print(esri._canDoXOXHR("https://xyz.com/res1/res2/"), V_TRUE);
      test_print(esri._canDoXOXHR("https://xyz.com:99"), V_FALSE);
      test_print(esri._canDoXOXHR("http://xyz.com"), V_FALSE);
      test_print(esri._canDoXOXHR("http://xyz.com:99"), V_FALSE);
    
      test_print(esri._canDoXOXHR("http://klm.com:9090"), V_TRUE);
      test_print(esri._canDoXOXHR("http://klm.com:9090/res1/res2/"), V_TRUE);
      test_print(esri._canDoXOXHR("http://klm.com"), V_FALSE);
      test_print(esri._canDoXOXHR("http://klm.com:88"), V_FALSE);
      test_print(esri._canDoXOXHR("https://klm.com"), V_FALSE);
      test_print(esri._canDoXOXHR("https://klm.com:9090"), V_FALSE);
      test_print(esri._canDoXOXHR("https://klm.com:88"), V_FALSE);
  
      test_print(esri._canDoXOXHR("https://ijk.com:8080"), V_TRUE);
      test_print(esri._canDoXOXHR("https://ijk.com:8080/res1/res2/"), V_TRUE);
      test_print(esri._canDoXOXHR("https://ijk.com"), V_FALSE);
      test_print(esri._canDoXOXHR("https://ijk.com:88"), V_FALSE);
      test_print(esri._canDoXOXHR("http://ijk.com"), V_FALSE);
      test_print(esri._canDoXOXHR("http://ijk.com:8080"), V_FALSE);
      test_print(esri._canDoXOXHR("http://ijk.com:88"), V_FALSE);
      
      test_print(esri._canDoXOXHR("http://asdf.net"), V_TRUE);
      test_print(esri._canDoXOXHR("http://asdf.net/res1/res2/"), V_TRUE);
      test_print(esri._canDoXOXHR("https://asdf.net"), V_TRUE);
      test_print(esri._canDoXOXHR("http://asdf.net:99"), V_FALSE);
      test_print(esri._canDoXOXHR("https://asdf.net:99"), V_FALSE);
      
      test_print(esri._canDoXOXHR("http://asdf.net:6080"), V_TRUE);
      test_print(esri._canDoXOXHR("http://asdf.net:6080/res1/res2/"), V_TRUE);
      test_print(esri._canDoXOXHR("https://asdf.net:6080"), V_TRUE);
      
      test_print(esri._canDoXOXHR("http://www.arcgis.com"), esri._hasCors && ALWAYS_TRUE);
      test_print(esri._canDoXOXHR("http://www.arcgis.com/sharing/"), esri._hasCors && ALWAYS_TRUE);
      test_print(esri._canDoXOXHR("https://www.arcgis.com"), esri._hasCors && ALWAYS_TRUE);
      test_print(esri._canDoXOXHR("http://tiles.arcgis.com"), esri._hasCors && ALWAYS_TRUE);
      test_print(esri._canDoXOXHR("https://services.arcgis.com/sharing/"), esri._hasCors && ALWAYS_TRUE);
    }
    
    var saved = esri.config.request.corsEnabledServers;
    
    esri.config.request.corsEnabledServers = saved.concat(corsServers);
    test_run(1);
    
    esri._hasCors = false;
    V_TRUE = false;
    test_run(2);
    
    esri._hasCors = false;
    esri.config.request.corsEnabledServers = saved;
    V_TRUE = false;
    test_run(3);
    
    esri._hasCors = true;
    esri.config.request.corsEnabledServers = saved;
    V_TRUE = false;
    test_run(4);
    
    esri._hasCors = true;
    esri.config.request.corsEnabledServers = null;
    V_TRUE = false;
    ALWAYS_TRUE = false;
    test_run(5);
    */
    
    var canDo = !!has("esri-phonegap"),
        hasSameOrigin = urlUtils.hasSameOrigin,
        servers = reqConfig.corsEnabledServers || [],
        urls, i, n, j, m, idx = -1;
        
    if (lang.isString(url)) {
      url = url.toLowerCase();
      url = url.indexOf("http") === 0 ? // is absolute url?
              new Url(url) : esriKernel.appUrl; // relative urls have the same authority as the application
    }

    if (!canDo && has("esri-cors")) {
      for (i = 0, n = servers.length; i < n; i++) {
        urls = getCachedServerUrls(servers[i]);
        for (j = 0, m = urls.length; j < m; j++) {
          if (hasSameOrigin(url, urls[j])) {
            idx = i;
            canDo = true;
            break;
          }
        }
      }
    }
    
    return returnIndex ? idx : canDo;
  };
  
  //test cases for the method _getAbsoluteUrl
  //call the method in a page, such as http://myserver.com/hello/app.html
  //esri._getAbsoluteUrl("http://myserver.com/hello/world.jpg"); it should return "http://myserver.com/hello/world.jpg"
  //esri._getAbsoluteUrl("//myserver.com/hello/world.jpg"); it should return "http://myserver.com/hello/world.jpg"
  //esri._getAbsoluteUrl("/hey/world.jpg"); it should return "http://myserver.com/hey/world.jpg"
  //esri._getAbsoluteUrl("../world.jpg"); it should return "http://myserver.com/world.jpg"
  //esri._getAbsoluteUrl("./world.jpg"); it should return "http://myserver.com/hello/world.jpg"
  //esri._getAbsoluteUrl("world.jpg"); it should return "http://myserver.com/hello/world.jpg"
  //Additionally, it should pass different window.location senario.
  //http://myserver.com/
  //http://myserver.com/myapp    note: browser will always resolve this as http://myserver.com/myapp/
  //http://myserver.com/myapp/   
  //http://myserver.com/myapp/test.html
  //http://myserver.com/myapp/test.html?f=1&g=2
  //http://myserver.com/myapp/test.html?f=/1&g=/?2
  urlUtils.getAbsoluteUrl = function (url) {
    if (lang.isString(url) && !/^https?:\/\//i.test(url)) {
      if (url.indexOf("//") === 0) {
        return pageScheme + url;
      }
      if (url.indexOf("/") === 0) {
        return pageScheme + "//" + esriKernel.appUrl.host + (esriKernel.appUrl.port ? ":" + esriKernel.appUrl.port : "") + url;
      }
      return esriKernel._appBaseUrl + url;
    }
    return url;
  };
  
  urlUtils.fixUrl = function(url) {
    return urlUtils._ensureProtocol(url)
      // Add "www" to arcgis.com urls if missing.
      .replace(/^(https?:\/\/)(arcgis\.com)/i, "$1www.$2");
  };

  urlUtils.normalize = function(url) {
    url = urlUtils._ensureProtocol(url);
    url = urlUtils._ensureProperProtocolForAGOResource(url);

    return url;
  };

  urlUtils._ensureProtocol = function(url) {
    var protocol;

    if (!url) {
      return url;
    }

    if (/^\/\//i.test(url)) {
      protocol = esriKernel.appUrl.scheme;  // use kernel to ease test stubbing
      protocol = (protocol === "file") ? "https" : protocol;

      url = protocol + ":" + url;
    }

    return url;
  };

  urlUtils._ensureProperProtocolForAGOResource = function(url) {
    var shouldSwitchToHTTPS =
          // use kernel to ease test stubbing
          esriKernel.appUrl.scheme === "https" &&
          (
            /^http\:\/\/server\.arcgisonline\.com(?!:)/i.test(url) ||
            /^http\:\/\/services\.arcgisonline\.com(?!:)/i.test(url) ||
            /^http\:\/\/.+\.arcgis\.com(?!:)/i.test(url)
          );

    return shouldSwitchToHTTPS ? url.replace(/http:/i, "https:") : url;
  };

  return urlUtils;
});
