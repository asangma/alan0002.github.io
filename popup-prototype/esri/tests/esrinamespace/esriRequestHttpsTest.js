dojo.provide("esri.tests.esrinamespace.esriRequestHttpsTest");


function setIntent(expectXhrGet, expectXhrPost, expectScriptGet, expectProxyUrl, expectHTTPSProxyUrl) {
        dojo.xhr.get = function() {
          if (expectXhrGet) {
            console.log("[xhrGet Test] Ok");
          }
          else {
            console.error("[xhrGet Test] Fail");
          }
          return new dojo.Deferred();
        };
  
        // Post test setup
        dojo.xhr.post = function() {
          if (expectXhrPost) {
            console.log("[xhrPost Test] Ok");
          }
          else {
            console.error("[xhrPost Test] Fail");
          }
          return new dojo.Deferred();
        };
  
        dojo.io.script.get = function() {
          if (expectScriptGet) {
            console.log("[script-get Test] Ok");
          }
          else {
            console.error("[script-get Test] Fail");
          }
          return new dojo.Deferred();
        };
		
  	  //function setIntent property
	
	  setIntent.isXhrGet= false;
	  setIntent.isRawXhrPost = false;
	  setIntent.isScriptGet = false;
	  setIntent.isProxy = false;
	  
        // Proxy test setup
        esri.setRequestPreCallback(function(args) {
          if (expectProxyUrl) {
            if (args.url.indexOf("proxy.jsp") === -1) {
              console.error("[Proxy Test] Fail");
            }
            else {
              console.log("[Proxy Test] Ok");

              if (expectHTTPSProxyUrl) {
                if (args.url.indexOf("https:") === 0) {
                  console.log("[Proxy HTTPS Test] Ok");
                }
                else {
                  console.error("[Proxy HTTPS Test] Fail");
                }
              }
              else {
                if (args.url.indexOf("http:") === 0) {
                  console.log("[Proxy HTTP Test] Ok");
                }
                else {
                  console.error("[Proxy HTTP Test] Fail");
                }
              }
            }
          }
          else {
            if (args.url.indexOf("proxy.jsp") !== -1) {
              console.error("[Proxy Test] Fail");
            }
            else {
              console.log("[Proxy Test] Ok");
            }
          }
          return args;
        });
      }


doh.registerGroup("esrinamespace.esriRequestHttpsTest", [
	//JSON or XML Same Domain Test
	{
    name: "SameDomain_JSONORXML_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test1");
       
        setIntent(true, false, false, /*Proxy*/ false);
        esri.request({
            url: "http://jsapibuild:8080/arcgis/rest/services",
			
        });
        
       t.assertTrue(setIntent.isXhrGet);
	   t.assertFalse(setIntent.isProxy);
	   
	   
    }
	},{
    name: "SameDomain_JSONORXML_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test2");
		
        setIntent(false, true, false, false);
        esri.request({
            url: "http://jsapibuild:8080/arcgis/rest/services",
			content: getLongContent()
        });
       t.assertTrue(setIntent.isRawXhrPost);
	   t.assertFalse(setIntent.isProxy);//
	        
    }
	},
	
	//JSON or XML Cross Domain Test
	{
    name: "CrossDomain_JSONORXML_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test3");
       
        setIntent(true, false, false, /*Proxy*/ true);
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			
        });
        
       t.assertTrue(setIntent.isXhrGet);
	   t.assertTrue(setIntent.isProxy);//cross domain  proxy
	  
    }
	},{
    name: "CrossDomain_JSONORXML_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test4");
		
        setIntent(false, true, false, true);
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			content: getLongContent()
        });
       t.assertTrue(setIntent.isRawXhrPost);
	   t.assertTrue(setIntent.isProxy);
	  
        
    }
	},
	//ScriptTag JSON testing 
	{
    name: "ScriptTag_SameDomain_JSON_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test5");
		esri.config.request.forceProxy = false;
        setIntent(false, false, true, false);
        
        esri.request({
            url: window.location.href,
            handleAs:"json",
			callbackParamName:"callback"			
        });
        t.assertTrue(setIntent.isScriptGet);
	    t.assertFalse(setIntent.isProxy);
	   
    }
	}, {
    name: "ScriptTag_CrossDomain_JSON_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test6");
        setIntent(false, false, true, false);
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			handleAs:"json",
			callbackParamName:"callback"	
        });
        t.assertTrue(setIntent.isScriptGet);
	    t.assertFalse(setIntent.isProxy);
	  
        
    }
	}, {
    name: "ScriptTag_SameDomain_JSON_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test7");
        setIntent(false, true, false, false);
        
        esri.request({
            url: window.location.href,
            handleAs:"json",
			callbackParamName:"callback",
			content: getLongContent()			
        });
        t.assertTrue(setIntent.isRawXhrPost);
	   	t.assertFalse(setIntent.isProxy);
	   	        
    }
	}, {
    name: "ScriptTag_CrossDomain_JSON_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test8");
        setIntent(false, true, false, true);
        
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
            handleAs:"json",
			callbackParamName:"callback",
			content: getLongContent()			
        });
        t.assertTrue(setIntent.isRawXhrPost);
	   	t.assertTrue(setIntent.isProxy);
	   
        
    }
	},
	//option UsePost test
	 {
    name: "OptionUsePost_SameDomain_JSONORXML_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test9");
        setIntent(false, true, false, false);
        esri.request({
            url: "http://jsapibuild:8080/arcgis/rest/services",
		}, {
            usePost: true
        });
       t.assertTrue(setIntent.isRawXhrPost);
	   t.assertFalse(setIntent.isProxy);
	  
    }
	},
	 {
    name: "OptionUsePost_SameDomain_JSONORXML_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test10");
        setIntent(false, true, false, false);
        esri.request({
            url: "http://jsapibuild:8080/arcgis/rest/services",
			content: getLongContent()	
        }, {
            usePost: true
        });
        t.assertTrue(setIntent.isRawXhrPost);
	   	t.assertFalse(setIntent.isProxy);
	           
    }
	}, 
	//JSON or XML Cross Domain Test
	{
    name: "OptionUsePost_CrossDomain_JSONORXML_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test11");
       
        setIntent(false, true, false, /*Proxy*/ true);
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			
        },{
			usePost: true
		});
        
       t.assertTrue(setIntent.isRawXhrPost);
	   t.assertTrue(setIntent.isProxy);
	  
    }
	},
	{
    name: "OptionUsePost_CrossDomain_JSONORXML_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test12");
		
        setIntent(false, true, false, true);
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			content: getLongContent()
        },{
			usePost:true
		});
       t.assertTrue(setIntent.isRawXhrPost);
	   t.assertTrue(setIntent.isProxy);
	  
        
    }
	},{
    name: "OptionUsePost_ScriptTag_SameDomain_JSON_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test13");
        setIntent(false, true, false, false);
        esri.request({
            url: window.location.href,
            handleAs:"json",
			callbackParamName:"callback"			
        }, {
            usePost: true
          
        });
        t.assertTrue(setIntent.isRawXhrPost);
	    t.assertFalse(setIntent.isProxy);
	          
    }
	},
	{
    name: "OptionUsePost_ScriptTag_SameDomain_JSON_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test14");
        setIntent(false, true, false, false);
        esri.request({
            url: window.location.href,
            handleAs:"json",
			callbackParamName:"callback",
			content: getLongContent()			
        }, {
            usePost: true
          
        });
        t.assertTrue(setIntent.isRawXhrPost);
	    t.assertFalse(setIntent.isProxy);
	                 
    }
	},{
    name: "OptionUsePost_ScriptTag_CrossDomain_JSON_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test15");
        setIntent(false, true, false, true);//cross domain always use proxy
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			handleAs:"json",
			callbackParamName:"callback"	
        },{
            usePost: true
          
        });
        t.assertTrue(setIntent.isRawXhrPost);
	    t.assertTrue(setIntent.isProxy);
	           
    }
	},{
    name: "OptionUsePost_ScriptTag_CrossDomain_JSON_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test16");
        setIntent(false, true, false, true);
        
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
            handleAs:"json",
			callbackParamName:"callback",
			content: getLongContent()			
        },{
			usePost: true
		});
        t.assertTrue(setIntent.isRawXhrPost);
	  	t.assertTrue(setIntent.isProxy);
	         
    }
	},
	//Option Use Proxy test
	{
    name: "OptionUseProxy_SameDomain_JSONORXML_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test17");
        setIntent(false, true, false, true);
        esri.request({
            url: "http://jsapibuild:8080/arcgis/rest/services",
		}, {
            usePost: true,
			useProxy:true
        });
       t.assertTrue(setIntent.isRawXhrPost);
	   t.assertTrue(setIntent.isProxy);
	          
    }
	}, {
    name: "OptionUseProxy_SameDomain_JSONORXML_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test18");
        setIntent(false, true, false, true);
        esri.request({
            url: "http://jsapibuild:8080/arcgis/rest/services",
			content: getLongContent()	
        }, {
            usePost: true,
			useProxy:true
        });
        t.assertTrue(setIntent.isRawXhrPost);
	  	t.assertTrue(setIntent.isProxy);
	          
    }
	},
	//JSON or XML Cross Domain Test
	{
    name: "OptionUseProxy_CrossDomain_JSONORXML_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test19");
       
        setIntent(false, true, false, /*Proxy*/ true);
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			
        },{
			usePost: true,
			useProxy:true
		});
        
       t.assertTrue(setIntent.isRawXhrPost);
	   t.assertTrue(setIntent.isProxy);
	   }
	},
	{
    name: "OptionUseProxy_CrossDomain_JSONORXML_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test20");
		
        setIntent(false, true, false, true);
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			content: getLongContent()
        },{
			usePost:true,
			useProxy:true
		});
       t.assertTrue(setIntent.isRawXhrPost);
	   t.assertTrue(setIntent.isProxy);
	  
        
    }
	}, {
    name: "OptionUseProxy_ScriptTag_SameDomain_JSON_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test21");
        setIntent(false, true, false, true);
        esri.request({
            url: window.location.href,
            handleAs:"json",
			callbackParamName:"callback"			
        }, {
            usePost: true,
			useProxy:true
          
        });
        t.assertTrue(setIntent.isRawXhrPost);
		t.assertTrue(setIntent.isProxy);
	     
        
    }
	},
	{
    name: "OptionUseProxy_ScriptTag_SameDomain_JSON_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test22");
        setIntent(false, true, false, true);
        esri.request({
            url: window.location.href,
            handleAs:"json",
			callbackParamName:"callback",
			content: getLongContent()			
        }, {
            usePost: true,
			useProxy:true
          
        });
        t.assertTrue(setIntent.isRawXhrPost);
	   	t.assertTrue(setIntent.isProxy);
	                   
    }
	},{
    name: "OptionUseProxy_ScriptTag_CrossDomain_JSON_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test23");
        setIntent(false, true, false, true);//?cross domain always use proxy?
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			handleAs:"json",
			callbackParamName:"callback"	
        },{
            usePost: true,
			useProxy:true
          
        });
        t.assertTrue(setIntent.isRawXhrPost);
	   	t.assertTrue(setIntent.isProxy);
	           
    }
	},{
    name: "OptionUseProxy_ScriptTag_CrossDomain_JSON_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test24");
        setIntent(false, true, false, true);
        
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
            handleAs:"json",
			callbackParamName:"callback",
			content: getLongContent()			
        },{
			usePost: true,
			useProxy:true
		});
        t.assertTrue(setIntent.isRawXhrPost);
	 	t.assertTrue(setIntent.isProxy);
	   
        
    }
	},
	//Test cfgIO.forceProxy = true 
	{
    name: "AlwaysUseProxy_SameDomain_JSONORXML_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test25");
        esri.config.request.forceProxy = true;
        setIntent(true, false, false, /*Proxy*/ true);
        esri.request({
            url: "http://jsapibuild:8080/arcgis/rest/services",
			
        });
        
       t.assertTrue(setIntent.isXhrGet);
	   t.assertTrue(setIntent.isProxy);
	  
    }
	},{
    name: "AlwaysUseProxy_SameDomain_JSONORXML_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test26");
		esri.config.request.forceProxy = true;
        setIntent(false, true, false, true);
        esri.request({
            url: "http://jsapibuild:8080/arcgis/rest/services",
			content: getLongContent()
        });
       t.assertTrue(setIntent.isRawXhrPost);
	   t.assertTrue(setIntent.isProxy);
	  
    }
	},
	
	//JSON or XML Cross Domain Test
	{
    name: "AlwaysUseProxy_CrossDomain_JSONORXML_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test27");
        esri.config.request.forceProxy = true;
        setIntent(true, false, false, /*Proxy*/ true);
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			
        });
        
       t.assertTrue(setIntent.isXhrGet);//changed to be xhrPost if Proxy
	   t.assertTrue(setIntent.isProxy);
	   
    }
	},{
    name: "AlwaysUseProxy_CrossDomain_JSONORXML_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test28");
		esri.config.request.forceProxy = true;
        setIntent(false, true, false, true);
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			content: getLongContent()
        });
       t.assertTrue(setIntent.isRawXhrPost);
	   t.assertTrue(setIntent.isProxy);
	          
    }
	},
	//ScriptTag JSON testing 
	{
    name: "AlwaysUseProxy_ScriptTag_SameDomain_JSON_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test29");
		esri.config.request.forceProxy = true;
        setIntent(false, false, true, true);
        
        esri.request({
            url: window.location.href,
            handleAs:"json",
			callbackParamName:"callback"			
        });
		
        t.assertTrue(setIntent.isScriptGet);
	   	t.assertTrue(setIntent.isProxy);
	 }
	}, {
    name: "AlwaysUseProxy_ScriptTag_CrossDomain_JSON_Small",
    timeout: 3000,
    runTest: function(t){
        console.log("test30");
		esri.config.request.forceProxy = true;
        setIntent(false, false, true, true);
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
			handleAs:"json",
			callbackParamName:"callback"	
        });
        t.assertTrue(setIntent.isScriptGet);
	   	t.assertTrue(setIntent.isProxy);
	 
        
    }
	}, {
    name: "AlwaysUseProxy_ScriptTag_SameDomain_JSON_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test31");
		esri.config.request.forceProxy = true;
        setIntent(false, true, false, true);
        
        esri.request({
            url: window.location.href,
            handleAs:"json",
			callbackParamName:"callback",
			content: getLongContent()			
        });
        t.assertTrue(setIntent.isRawXhrPost);
	 	t.assertTrue(setIntent.isProxy);
	           
    }
	}, {
    name: "AlwaysUseProxy_ScriptTag_CrossDomain_JSON_Large",
    timeout: 3000,
    runTest: function(t){
        console.log("test32");
		esri.config.request.forceProxy = true;
        setIntent(false, true, false, true);
        
        esri.request({
            url: "http://sampleserver1.arcgisonline.com/arcgis/rest/services",
            handleAs:"json",
			callbackParamName:"callback",
			content: getLongContent()			
        });
        t.assertTrue(setIntent.isRawXhrPost);
	   	t.assertTrue(setIntent.isProxy);
	         
        
    }
	}
	
	], function()//setUp()
{

    esri.config.request.proxyUrl = "../proxy.jsp";
    esri.config.request.forceProxy = false;
    
}, function()//tearDown
{

});
