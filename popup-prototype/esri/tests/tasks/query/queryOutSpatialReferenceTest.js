dojo.provide("esri.tests.tasks.query.queryOutSpatialReferenceTest");

dojo.require("esri.tasks.query");

var queryTask, query;

doh.registerGroup("tasks.query.queryOutSpatialReferenceTest", [
  
 
  {
    name: "queryOutSpatialReferencePoint",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedResult = [];
      expectedResult.push("27 317 p");
      
      
      
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/6");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      
      query.geometry = new esri.geometry.Point(7646014.863,660477.123, new esri.SpatialReference({ wkid: 102726 }));
      query.outSpatialReference=new esri.SpatialReference({ wkid: 32126 });
      query.outFields = ["FID","numval","EZONE"];
      
      var d = new doh.Deferred();
      
      
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          for (var i = 0; i < results.features.length; i++) 
          {
            var feature = results.features[i];
            var attribs = feature.attributes;
            var resultString = attribs.FID + " " + attribs.numval + " " + attribs.EZONE;
            console.debug(resultString);
            t.assertEqual(expectedResult[i], resultString);
          }
        }
        
        d.callback(true);
      }
      
      queryTask.execute(query, showResults);
      return d;
    }
  },
  {
    name: "queryOutSpatialReferenceMultipoint",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedResult = [];
      expectedResult.push("27 317 p");
      expectedResult.push("28 317 c");
      
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/6");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      var SRJson = {
        "wkid": 102726
    	};
      
       
		var multipoint = new esri.geometry.Multipoint(new esri.SpatialReference(SRJson));
		var point1 =  new esri.geometry.Point(7646014.863,660477.123, new esri.SpatialReference(SRJson));
		var point2 = new esri.geometry.Point(7643132.965,654582.332, new esri.SpatialReference(SRJson));
		multipoint.addPoint(point1);
		multipoint.addPoint(point2);
        query.geometry = multipoint;
       	query.outSpatialReference=new esri.SpatialReference({ wkid: 32126 });
      	query.outFields = ["FID","numval","EZONE"];
      
      var d = new doh.Deferred();
            
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          for (var i = 0; i < results.features.length; i++) 
          {
            var feature = results.features[i];
            var attribs = feature.attributes;
            var resultString = attribs.FID + " " + attribs.numval + " " + attribs.EZONE;
            console.debug(resultString);
            t.assertEqual(expectedResult[i], resultString);
          }
        }
        
         d.callback(true);
      }
      
      queryTask.execute(query, showResults);
      return d;
    }
  },
  {
    name: "queryOutSpatialReferencePolyline",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedResult = [];
      expectedResult.push("I5 190203");
      expectedResult.push("I5 190204");
      expectedResult.push("53RD 142667");
      
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/5");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      var SRJson = {
        "wkid": 102726
    	};
      
       
		var polyline = new esri.geometry.Polyline(new esri.SpatialReference(SRJson));
		var point1 =  new esri.geometry.Point(7629509.449,656874.751, new esri.SpatialReference(SRJson));
		var point2 = new esri.geometry.Point(7629836.938,657529.727, new esri.SpatialReference(SRJson));
		var path =[point1,point2];
		polyline.addPath(path);
        query.geometry = polyline;
       query.outSpatialReference=new esri.SpatialReference({ wkid: 32126 });
      query.outFields = ["LOCALID","STREETNAME"];
      
      var d = new doh.Deferred();
      
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          for (var i = 0; i < results.features.length; i++) 
          {
            var feature = results.features[i];
            var attribs = feature.attributes;
            var resultString = attribs.STREETNAME + " " + attribs.LOCALID;
            console.debug(resultString);
            t.assertEqual(expectedResult[i], resultString);
          }
        }
        
        d.callback(true);
      }
      
      queryTask.execute(query, showResults);
      return d;
    }
  },
  {
    name: "queryOutSpatialReferencePolygon",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedResult = [];
      expectedResult.push("I5 FWY-BARBUR BLVD 151178");
      expectedResult.push("BERTHA BLVD-I5 FWY 151183");
     
      
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/5");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      var SRJson = {
        "wkid": 102726
    	};
      
       
		var polygon = new esri.geometry.Polygon(new esri.SpatialReference(SRJson));
		var point1 =  new esri.geometry.Point(7640807.778,665140.129, new esri.SpatialReference(SRJson));
		var point2 = new esri.geometry.Point(7640849.130,665150.4677, new esri.SpatialReference(SRJson));
		var point3 = new esri.geometry.Point(7640905.989,665233.172, new esri.SpatialReference(SRJson));
		var ring =[point1,point2,point3];
		polygon.addRing(ring);
        query.geometry = polygon;
       query.outSpatialReference=new esri.SpatialReference({ wkid: 32126 });
      query.outFields = ["LOCALID","STREETNAME"];
      
      var d = new doh.Deferred();
      
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          for (var i = 0; i < results.features.length; i++) 
          {
            var feature = results.features[i];
            var attribs = feature.attributes;
            var resultString = attribs.STREETNAME + " " + attribs.LOCALID;
            console.debug(resultString);
            t.assertEqual(expectedResult[i], resultString);
          }
        }
        
        d.callback(true);
      }
      
      queryTask.execute(query, showResults);
      return d;
    }
  },
  {
    name: "queryOutSpatialReferenceExtent",
    timeout: 3000,
    runTest: function(t)
    {
      
      var expectedResult = [];
      expectedResult.push("I5 FWY-BARBUR BLVD 151178");
      expectedResult.push("I5 151165");
      expectedResult.push("BERTHA BLVD-I5 FWY 151183");
      expectedResult.push("BERTHA BLVD-I5 FWY 151185");
      expectedResult.push("I5 151166");
     
      
      //query park layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/5");
      var query = new esri.tasks.Query();//have to create a local variable, otherwise it fails,looks like the same queryTask object can't take a new created obj
      var SRJson = {
        "wkid": 102726
    	};
      
       
		var extent = new esri.geometry.Extent(7640807.778,665140.129,7640905.989,665233.172,new esri.SpatialReference(SRJson));
		query.geometry = extent;
       query.outSpatialReference=new esri.SpatialReference({ wkid: 32126 });
      query.outFields = ["LOCALID","STREETNAME"];
      
      var d = new doh.Deferred();
      
      function showResults(results)
      {
        if (results == null || results.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          for (var i = 0; i < results.features.length; i++) 
          {
            var feature = results.features[i];
            var attribs = feature.attributes;
            var resultString = attribs.STREETNAME + " " + attribs.LOCALID;
            console.debug(resultString);
            t.assertEqual(expectedResult[i], resultString);
          }
        }
        
        d.callback(true);
      }
      
      queryTask.execute(query, showResults);
      return d;
    }
  }                            
  ], 
  
  function()//setUp()
  {
	//QueryTask is being created inside the test function because it needs a different URL for every test					
	query = new esri.tasks.Query();
	query.returnGeometry = true;
  }, 
  
  function()//tearDown
  {
    query = null;
    
  });
