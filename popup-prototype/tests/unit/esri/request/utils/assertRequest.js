define([
    "intern/chai!assert",

    "dojo/_base/xhr",

    "dojo/io/script",

    "esri/request",
    "esri/config",

    "esri/workers/RequestClient",

    "dojo/aspect"
  ],
  function(
    assert,
    xhr,
    script,
    esriRequest, esriConfig,
    RequestClient,
    aspect
  ) {

    var getLongContent,
      baseUrl, proxyUrl, nodeUrl,
      dataFormats,
      getFormData, getFormElement,
      requestClient,
      executeTest,
      setIntentAspects, resetIntentAspects;

    // This object is used in dojo aspect
    requestClient = RequestClient.getClient();

    // Get the urls from grunt-config.json
    var xmlhttp = new XMLHttpRequest();
    var url = "../../grunt-config.json";
    xmlhttp.open("GET", url, false);
    xmlhttp.send();

    if (xmlhttp.status === 200) {
      var response = JSON.parse(xmlhttp.responseText);
      baseUrl = response.base;
      proxyUrl = response.proxy;
      nodeUrl = response.nodeServer;
    }

    esriConfig.request.proxyUrl = proxyUrl;

    // This function is used to create large content for POST request tests
    getLongContent = function(){
      var str = "";
      for (var i = 0; i < 200; i++) {
        str += ("123456789012345");
      }
      return {
        str: str
      };
    };

    // This function is used to create a FormData object for form request tests
    getFormData = function() {
      var formData = new FormData();
      formData.append("username", "user1234");
      formData.append("accountNumber", "123456");
      return formData;
    };

    // This function is used to create a form element for form request tests
    getFormElement = function() {
      var form = document.createElement("form");
      form.setAttribute("method", "post");
      form.setAttribute("id", "formElement");
      form.setAttribute("enctype", "multipart/form-data");
      var inputField1 = document.createElement("input");
      inputField1.setAttribute("name", "username");
      inputField1.setAttribute("type", "text");
      inputField1.setAttribute("value", "user1234");
      var inputField2 = document.createElement("input");
      inputField2.setAttribute("name", "attachment");
      inputField2.setAttribute("type", "file");
      inputField2.setAttribute("value", "123456");

      form.appendChild(inputField1);
      form.appendChild(inputField2);

      return form;
    };

    // A consolidated list of all the urls with some properties used by all the request tests
    dataFormats = {
      "sameOrigin_json": {
        url: baseUrl + '/tests/support/mocking/Samples/json.json',
        handleAs: "json"
      },
      "sameOrigin_text": {
        url: baseUrl + '/tests/support/mocking/Samples/text.txt',
        handleAs: "text"
      },
      "sameOrigin_xml": {
        url: baseUrl + '/tests/support/mocking/Samples/xml.xml',
        handleAs: "xml"
      },
      "sameOrigin_blob": {
        url: baseUrl + '/tests/support/mocking/Samples/json.json',
        handleAs: "blob"
      },
      "sameOrigin_arraybuffer": {
        url: baseUrl + '/tests/support/mocking/Samples/json.json',
        handleAs: "arraybuffer"
      },
      "sameOrigin_jsonp": {
        url: baseUrl + '/tests/support/mocking/Samples/json.json',
        handleAs: "json",
        callbackParamName: "callback"
      },
      "sameOrigin_formData": {
        url: baseUrl + '/tests/support/mocking/Samples/json.json',
        form: getFormData(),
        handleAs: "json",
        type: "formData"
      },
      "sameOrigin_formElement": {
        url: baseUrl + '/tests/support/mocking/Samples/json.json',
        form: getFormElement(),
        handleAs: "json",
        type: "formElement"
      },

      "crossOrigin_json": {
        url: nodeUrl + '/v1/api/json',
        handleAs: "json"
      },
      "crossOrigin_text": {
        url: nodeUrl + '/v1/api/text',
        handleAs: "text"
      },
      "crossOrigin_xml": {
        url: nodeUrl + '/v1/api/xml',
        handleAs: "xml"
      },
      "crossOrigin_blob": {
        url: nodeUrl + '/v1/api/json',
        handleAs: "blob"
      },
      "crossOrigin_arraybuffer": {
        url: nodeUrl + '/v1/api/json',
        handleAs: "arraybuffer"
      },
      "crossOrigin_cors": {
        url: 'http://services.arcgisonline.com/ArcGIS/rest/services/?f=pjson',
        handleAs: "json"
      },
      "crossOrigin_jsonp": {
        url: nodeUrl + '/v1/api/jsonp',
        handleAs: "json",
        callbackParamName: "callback"
      },
      "crossOrigin_formData": {
        url: nodeUrl + '/v1/api/uploadForm',
        form: getFormData(),
        handleAs: "json",
        type: "formData",
        domain: "crossOrigin"
      },
      "crossOrigin_formElement": {
        url: nodeUrl + '/v1/api/uploadForm',
        form: getFormElement(),
        handleAs: "json",
        type: "formElement",
        domain: "crossOrigin"
      },

      "secure_featureLayer": {
        url: 'http://sampleserver6.arcgisonline.com/arcgis/rest/services/SaveTheBay/FeatureServer/0?f=pjson'
      },

      "secure_mockLayer":{
        url: nodeUrl + '/arcgis/rest/services/SecureServer/FeatureServer/0/'
      }
    };

    /**
     * The main function that is called by the tests to execute their tests
     * @param dfd - The deferred object passed by the async test which will be resolved by this function if the tests pass
     * @param method - It should be either "GET" or "POST"
     * @param test - It is the object from the dataFormats object with url and other properties
     * @param intent - The intent object that will be modified according to the execution of the request
     * @param expected - The intent object that is used to compare and determine the test result
     * @param options - The options object that is passed along with the esriRequest
     */
    executeTest = function(dfd, method, test, intent, expected, options){

      var request,
        req = {},
        useProxy = options && options.useProxy;

      if(method === "POST"){
        req["content"] = getLongContent();
      }

      req["url"] = test.url;

      if(test.form){
        req.form = test.form;
      }
      if(test.handleAs){
        req["handleAs"] = test.handleAs;
      }
      if(test.callbackParamName){
        req["callbackParamName"] = test.callbackParamName;
      }

      /**
       * setup the aspects for the functions of the objects so that the intent can be modified when those functions
       * are executed
       */
      intent = setIntentAspects(intent, useProxy);

      // Make esri request
      request = esriRequest(req, options);

      /**
       * remove aspects for the functions of the objects using aspect handlers so that they are not mixed up with
       * other tests
       */
      if(test.url.indexOf("rest/services") === -1){
        resetIntentAspects(intent.handles);
      }

      request.then(
        dfd.rejectOnError(function(result) {

          // assertions to make sure that intents are modified as expected during the execution of the request
          assert.strictEqual(intent.isXhrGet, expected.isXhrGet, "isXhrGet is expected to be " + expected.isXhrGet);
          assert.strictEqual(intent.isXhrPost, expected.isXhrPost, "isXhrPost is expected to be " + expected.isXhrPost);
          assert.strictEqual(intent.isScriptGet, expected.isScriptGet, "isScriptGet is expected to be " + expected.isScriptGet);
          assert.strictEqual(intent.isProxy, expected.isProxy, "isProxy is expected to be " + expected.isProxy);
          assert.strictEqual(intent.corsDetection, expected.corsDetection, "corsDetection is expected to be " + expected.corsDetection);
          assert.strictEqual(intent.isFormSent, expected.isFormSent, "isFormSent is expected to be " + expected.isFormSent);
          assert.strictEqual(intent.isRCGet, expected.isRCGet, "isRCGet is expected to be " + expected.isRCGet);
          assert.strictEqual(intent.isRCPost, expected.isRCPost, "isRCPost is expected to be " + expected.isRCPost);
          assert.strictEqual(intent.tokenError, expected.tokenError, "tokenError is expected to be " + expected.tokenError);
          assert.strictEqual(intent.isXhrPostForToken, expected.isXhrPostForToken, "isXhrPostForToken is expected to be " + expected.isXhrPostForToken);
          assert.strictEqual(intent.isXhrGetWithToken, expected.isXhrGetWithToken, "isXhrGetWithToken is expected to be " + expected.isXhrGetWithToken);

          /**
           * remove aspects for the functions of the objects using aspect handlers so that they are not mixed up with
           * other tests
           */
          if(test.url.indexOf("rest/services") !== -1){
            resetIntentAspects(intent.handles);
          }

          if(test.domain === "crossOrigin"){
            if(test.type === "formData"){
              assert.equal(result.username, "user1234", "username should be user1234");
              assert.equal(result.accountNumber, "123456", "accountNumber should be 123456");
              if(method === "POST"){
                assert.ok(result.str, "str should exist");
              }
            } else if(test.type === "formElement"){
              assert.equal(result.username, "user1234", "username should be user1234");
              if(method === "POST"){
                assert.ok(result.str, "str should exist");
              }
            }
          } else {
            if (test.handleAs === "json") {
              assert.equal(result.currentVersion, 10.3, "json currentVersion should be 10.3");
            } else if (test.handleAs === "text") {
              assert.strictEqual(result.length, 445, 'string lengths must match');
            } else if (test.handleAs === "xml") {
              assert.equal(result.firstChild.nodeName, "note", "should be equal to the node name of first node");
            } else if (test.handleAs === "blob") {
              assert.instanceOf(result, Blob, "should be an instance of Blob");
            } else if (test.handleAs === "arraybuffer") {
              assert.instanceOf(result, ArrayBuffer, "should be an instance of ArrayBuffer");
            }
          }

          dfd.resolve();
        }), dfd.reject);

    };

    setIntentAspects = function(intent, useProxy){

      var xhr_get_before = function(args){
        if(args.url.indexOf("/rest/info") === -1) {
          intent.isXhrGet = true;
          if (useProxy || (args.url.indexOf(proxyUrl) !== -1)) {
            intent.isProxy = true;
            assert.equal(args.url, esriConfig.request.proxyUrl + "?" + args.urlObj.uri);
          }
          if (esriConfig.request.corsStatus[args.urlObj.authority]) {
            intent.corsDetection = true;
          }
          if(args._token){
            intent.isXhrGetWithToken = true;
          }
        }
      };

      var xhr_get_after = function(deferred, args){
        if(args.url.indexOf("/rest/info") === -1) {
          deferred.then(function(response){

          }, function(err){
            if(err.code === 499 && err.message === "Token Required"){
              intent.tokenError = true;
            }
          }, function(update){

          });

          return deferred;
        }
      };

      var xhr_get_advisingFactory = function(originalXhr){
        return function(args){
          // doing something before the original call
          xhr_get_before(args);
          var deferred = originalXhr(args);
          // doing something after the original call
          xhr_get_after(deferred, args);
          return deferred;
        }
      };

      /**
       * dojo aspect on xhr get
       * The intent object is modified before and after the execution of xhr get
       */
      var xhr_get_handle = aspect.around(xhr, "get", xhr_get_advisingFactory);

      var xhr_post_before = function(args){

        if(args.url.indexOf("tokens") !== -1){
          intent.isXhrPostForToken = true;
        } else {
          intent.isXhrPost = true;
        }
        if(useProxy || (args.url.indexOf(proxyUrl) !== -1)) {
          intent.isProxy = true;
          assert.equal(args.url, esriConfig.request.proxyUrl + "?" + args.urlObj.uri);
        }
        if (esriConfig.request.corsStatus[args.urlObj.host]) {
          intent.corsDetection = true;
        }
        if(args.postData) {
          intent.isFormSent = true;
        }
      };

      var xhr_post_after = function(deferred, args){
        deferred.then(function(response){
          assert.property(response, 'token');
          assert.property(response, 'expires');
        }, function(err){

        }, function(update){

        });

        return deferred;
      };

      var xhr_post_advisingFactory = function(originalXhr){
        return function(args){
          // doing something before the original call
          xhr_post_before(args);
          var deferred = originalXhr(args);
          // doing something after the original call
          xhr_post_after(deferred, args);
          return deferred;
        }
      };

      /**
       * dojo aspect on xhr post
       * The intent object is modified before and after the execution of xhr post
       */
      var xhr_post_handle = aspect.around(xhr, "post", xhr_post_advisingFactory);

      /**
       * dojo aspect on script get
       * The intent object is modified before the execution of script get
       */
      var script_get_handle = aspect.before(script, "get", function(arg1) {
        intent.isScriptGet = true;
      });

      /**
       * dojo aspect on requestClient get
       * The intent object is modified before the execution of requestClient get
       */
      var requestClient_get_handle = aspect.before(requestClient, "get", function(arg1) {
        intent.isRCGet = true;
        if(useProxy || (arg1.url.indexOf(proxyUrl) !== -1)) {
          intent.isProxy = true;
          assert.equal(arg1.url, esriConfig.request.proxyUrl + "?" + arg1.urlObj.uri);
        }

        if (esriConfig.request.corsStatus[arg1.urlObj.host]) {
          intent.corsDetection = true;
        }
      });

      /**
       * dojo aspect on requestClient post
       * The intent object is modified before the execution of requestClient post
       */
      var requestClient_post_handle = aspect.before(requestClient, "post", function(arg1) {
        intent.isRCPost = true;
        if(useProxy || (arg1.url.indexOf(proxyUrl) !== -1)) {
          intent.isProxy = true;
          assert.equal(arg1.url, esriConfig.request.proxyUrl + "?" + arg1.urlObj.uri);
        }

        if (esriConfig.request.corsStatus[arg1.urlObj.host]) {
          intent.corsDetection = true;
        }
      });

      // handles for all the aspects are pushed into the handles array of the intent object
      intent.handles.push(xhr_get_handle);
      intent.handles.push(xhr_post_handle);
      intent.handles.push(script_get_handle);
      intent.handles.push(requestClient_get_handle);
      intent.handles.push(requestClient_post_handle);

      return intent;

    };

    // reset the aspects so that the next tests are not mixed up with the earlier one's
    resetIntentAspects = function(handles){
      if(handles){
        handles.forEach(function(handle) {
          handle.remove();
        });
      }
    };

    return {
      executeTest: executeTest,
      dataFormats: dataFormats
    }
  });
