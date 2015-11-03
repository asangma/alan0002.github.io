dojo.provide("esri.tests.tasks.query.queryTaskTest");

dojo.require("esri.tasks.query");

var queryTask, query;

doh.registerGroup("tasks.query.queryTaskTest", [
  {
    name: "queryPoint",
    timeout: 3000,
    runTest: function(t)
    {
      var base = [];
      base.push("McKay ES 7485 SW Scholls Ferry Road Beaverton OR 97005 Beaverton");
      base.push("Vose ES 11350 SW Denny Road Beaverton OR 97005 Beaverton");
      base.push("Arts & Communication HS 11375 SW Center St Beaverton OR 97005 Beaverton");
      base.push("St Cecilia ES 12250 SW 5th Ave Beaverton OR 97005 Archdiocese of Portl");
      base.push("Pilgrim Lutheran ES 5650 SW Hall Blvd. Beaverton OR 97005 Pilgrim Evangelical");
      base.push("Whitford MS 7935 SW Scholls Ferry Road Beaverton OR 97005-6665 Beaverton");
      base.push("St Pius X ES 1260 NW Saltzman Road Beaverton OR 97229 Archdiocese of Portland");
      base.push("Jesuit HS 9000 SW Beaverton Hillsdale Highway Beaverton OR 97225 Jesuit");
      base.push("Conestoga MS 12250 SW Conestoga Dr Beaverton OR 97005 Beaverton");
      base.push("Greenway ES 9150 SW Downing Drive Beaverton OR 97005-8282 Beaverton");
      base.push("Montclair ES 7250 SW Vermont Street Beaverton OR 97223 Beaverton");
      base.push("Oregon Episcopal 6300 SW Nicol Road Beaverton OR 97223 Oregon Episcopal");
      base.push("Raleigh Hills ES 5225 SW Scholls Ferry Road Beaverton OR 97225-1611 Beaverton");
      
      //query houses layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/3");
      
      query.where = "CITY = 'Beaverton'";
      query.outFields = ["NAME", "ADDRESS", "CITY", "STATE", "ZIPCODE", "DISTRICT"];
      
      var d = new doh.Deferred();
      d.addCallback(showResults);
      
      function dCallback(results)
      {
        d.callback(results);
      }
      
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
            var resultString = attribs.NAME + " " + attribs.ADDRESS + " " + attribs.CITY + " " + attribs.STATE + " " + attribs.ZIPCODE + " " + attribs.DISTRICT;
            t.assertEqual(base[i], resultString);
          }
        }
        
        return results;
      }
      
      queryTask.execute(query, dCallback);
      return d;
      
    }
  }, 
  {
    name: "queryMultipoint",
    timeout: 3000,
    runTest: function(t)
    {
      var base = [];
      base.push("0 9 deer");
      base.push("1 8 deer");
      base.push("3 10 deer");
      base.push("5 6 deer");
      
      //query animals layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/2");
      
      query.where = "species = 'deer'";
      query.outFields = ["ID", "animalnum", "species"];
      
      var d = new doh.Deferred();
      d.addCallback(showResults);
      
      function dCallback(results)
      {
        d.callback(results);
      }
      
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
            var resultString = attribs.Id + " " + attribs.animalnum + " " + attribs.species;
            t.assertEqual(base[i], resultString);
          }
        }
        
        return results;
      }
      
      queryTask.execute(query, dCallback);
      return d;
    }
  }, 
  {
    name: "queryPolyline",
    timeout: 3000,
    runTest: function(t)
    {
      var base = [];
      base.push("270.3222 undefined WAY 1200");
      base.push("237.83508 undefined WAY 1300");
      base.push("344.69117 undefined WAY 1300");
      base.push("1832.81902 undefined WAY 1300");
      base.push("2044.12566 undefined WAY 1300");
      base.push("16.95132 undefined WAY 1200");
      base.push("557.15279 undefined WAY 1300");
      base.push("755.705 undefined WAY 1300");
      base.push("1004.46481 undefined WAY 1300");
      
      //query Major Roads layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/4");
      
      query.where = "FTYPE = 'WAY'";
      query.outFields = ["LENGTH ", "SREETNAME", "FTYPE", "TYPE"];
      
      var d = new doh.Deferred();
      d.addCallback(showResults);
      
      function dCallback(results)
      {
        d.callback(results);
      }
      
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
            var resultString = attribs.LENGTH + " " + attribs.STREETNAME + " " + attribs.FTYPE + " " + attribs.TYPE;
            t.assertEqual(base[i], resultString);
          }
        }
        
        return results;
      }
      
      queryTask.execute(query, dCallback);
      return d;
    }
  }, 
  {
    name: "queryPolygon",
    timeout: 3000,
    runTest: function(t)
    {
      var base = [];
      base.push("Milwaukie CL CO COM");
      
      //query zoning layer
      queryTask = new esri.tasks.QueryTask("http://servery/arcgis/rest/services/Portland/PortlandMap/MapServer/8");
      
      query.where = "ZONE = 'CL'";
      query.outFields = ["CITY", "ZONE", "ZONE_CLASS", "ZONEGEN_CL"];
      
      var d = new doh.Deferred();
      d.addCallback(showResults);
      
      function dCallback(results)
      {
        d.callback(results);
      }
      
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
            //console.log(feature.geometry);
            var attribs = feature.attributes;
            var resultString = attribs.CITY + " " + attribs.ZONE + " " + attribs.ZONE_CLASS + " " + attribs.ZONEGEN_CL;
            t.assertEqual(base[0], resultString);
          }
        }
        
        return results;
      }
      
      queryTask.execute(query, dCallback);
      return d;
    }
  }], 
  
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
