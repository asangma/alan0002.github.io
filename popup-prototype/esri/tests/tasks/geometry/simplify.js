dojo.provide("esri.tests.tasks.geometry.simplify");

dojo.require("esri.tasks.query");
dojo.require("esri.tasks.geometry");

doh.registerGroup("tasks.geometry.simplify",
  [
  ],
    
  function()//setUp()
  {
    esriConfig.request.proxyUrl = "../../proxy.jsp";
    esriConfig.request.forceProxy = false;    
  },
  
  function()//tearDown
  {
  }
);