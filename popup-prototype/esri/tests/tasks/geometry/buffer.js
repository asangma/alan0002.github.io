dojo.provide("esri.tests.tasks.geometry.buffer");

dojo.require("esri.tasks.query");
dojo.require("esri.tasks.geometry");

doh.registerGroup("tasks.geometry.buffer",
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