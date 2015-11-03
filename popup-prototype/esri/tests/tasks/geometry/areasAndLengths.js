dojo.provide("esri.tests.tasks.geometry.areasAndLengths");

dojo.require("esri.tasks.query");
dojo.require("esri.tasks.geometry");

doh.registerGroup("tasks.geometry.areasAndLengths",
  [
    {
      name: "SinglePartPolygon",
      timeout: 5000,
      runTest: function(t)
      {
        var d = new doh.Deferred();

        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/8");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.where = "FID = 25";

        queryTask.execute(query, function(featureSet) {
          function assert(areasAndLengths) {
            var areas = areasAndLengths.areas;
            var lengths = areasAndLengths.lengths;
            
            t.assertEqual(1, areas.length);
            t.assertEqual(1, lengths.length);
            
            t.assertEqual(43179.7804711721, areas[0]);
            t.assertEqual(903.567589784377, lengths[0]);
            
            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.areasAndLengths(featureSet.features, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "MultiPartPolygon",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();
        
        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/8");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.where = "FID = 21";

        queryTask.execute(query, function(featureSet) {
          function assert(areasAndLengths) {
            var areas = areasAndLengths.areas;
            var lengths = areasAndLengths.lengths;
            
            t.assertEqual(1, areas.length);
            t.assertEqual(1, lengths.length);
            
            t.assertEqual(2853611.51973685, areas[0]);
            t.assertEqual(9625.82562039275, lengths[0]);
            
            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.areasAndLengths(featureSet.features, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "MultiplePolygons",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();
        
        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/8");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.where = "FID = 26 OR FID = 27";

        queryTask.execute(query, function(featureSet) {
          function assert(areasAndLengths) {
            var areas = areasAndLengths.areas;
            var lengths = areasAndLengths.lengths;
            
            t.assertEqual(2, areas.length);
            t.assertEqual(2, lengths.length);
            
            t.assertEqual(420250.360248155, areas[0]);
            t.assertEqual(79620.9784813734, areas[1]);
            
            t.assertEqual(3745.78882976241, lengths[0]);
            t.assertEqual(1340.17768265476, lengths[1]);
            
            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.areasAndLengths(featureSet.features, assert);
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