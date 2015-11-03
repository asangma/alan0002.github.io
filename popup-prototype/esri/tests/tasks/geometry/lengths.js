dojo.provide("esri.tests.tasks.geometry.lengths");

dojo.require("esri.tasks.query");
dojo.require("esri.tasks.geometry");

doh.registerGroup("tasks.geometry.lengths",
  [
    {
      name: "SinglePartPolyline",
      timeout: 5000,
      runTest: function(t)
      {
        var d = new doh.Deferred();

        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/5");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.where = "FID = 28";

        queryTask.execute(query, function(featureSet) {
          function assert(lengthsObj) {
            var lengths = lengthsObj.lengths;
            
            t.assertEqual(1, lengths.length);

            t.assertEqual(387.52751995946, lengths[0]);
            
            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.lengths(featureSet.features, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "MultiplePolylines",
      timeout: 5000,
      runTest: function(t)
      {
        var d = new doh.Deferred();

        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/5");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.where = "FID = 5 OR FID = 18 OR FID = 19";

        queryTask.execute(query, function(featureSet) {
          function assert(lengthsObj) {
            var lengths = lengthsObj.lengths;
            
            t.assertEqual(3, lengths.length);

            t.assertEqual(315.546343154254, lengths[0]);
            t.assertEqual(178.331236766446, lengths[1]);
            t.assertEqual(264.811351192629, lengths[2]);
            
            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.lengths(featureSet.features, assert);
        });
        
        return d;
      }
    }
  ],
    
  function()//setUp()
  {
    esriConfig.request.proxyUrl = "../../../esri/tests/proxy.jsp";
    esriConfig.request.forceProxy = false;    
  },
  
  function()//tearDown
  {
  }
);