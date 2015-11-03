dojo.provide("esri.tests.tasks.geometry.relation_withinTest");



doh.registerGroup("tasks.geometry.relation_withinTest", [
  
  {
    name: "relation_within",
    timeout: 3000,
    runTest: function(t)
    {
       var pointGraphicJSON = {"geometry":{"x":7622314.80266142,"y":659002.058759173,
       "spatialReference":{"wkid":102726}}};
	   
       var polygonGraphicJSON={"geometry":
      	{"rings":[[[7622314.80266152,659007.871411607],
      [7622314.80266152,659002.058759183],[7622296.30269852,659002.49642235],
      [7622295.80269952,658996.55877018],[7622295.30270052,658990.55878219],
      [7622314.30266252,658989.996447355],[7622313.80266352,658981.621464103],
      [7622313.80266352,658971.746483848],[7622273.80274352,658972.871153519],
      [7622273.80274352,658983.621132016],[7622274.30274253,658997.058769181],
      [7622274.30241445,659008.308746681],[7622274.80241345,659021.183720931],
      [7622315.30266052,659020.246386856],[7622314.80266152,659007.871411607]]],
      "spatialReference":{"wkid":102726}}};
      
      var geometryService = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
           
      var d = new doh.Deferred();
         
      function showResults(results)
      {
       
        if (results == null) 
        {
          t.assertTrue(false);
        }
        else 
        {
			t.assertEqual("point", results[0].graphic1.geometry.type);
         }
               
        d.callback(true);
      }
      var graphic1 = new esri.Graphic(pointGraphicJSON);
      var graphics1 = [];
      graphics1.push(graphic1);
	  
      var graphic2 = new esri.Graphic(polygonGraphicJSON);
      var graphics2 = [];
      graphics2.push(graphic2);
     
      geometryService.relation(graphics1, graphics2, esri.tasks.GeometryService.SPATIAL_REL_WITHIN, null, showResults);
      
      return d;
            
    }
  }
  ] 
  
  );
