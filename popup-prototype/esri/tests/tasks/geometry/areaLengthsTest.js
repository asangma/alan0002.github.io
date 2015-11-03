dojo.provide("esri.tests.tasks.geometry.areaLengthsTest");


var geometryService;
doh.registerGroup("tasks.geometry.areaLengthsTest", [
  
  {
    name: "areaAndLengths",
    timeout: 3000,
    runTest: function(t)
    {
       var expectedArea =[1725.81462913697];
       var expectedLengths = [214.813865211617];
       
             	  
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
      
    
           
      var d = new doh.Deferred();
         
      function showResults(result)
      {
       
        if (result == null) 
        {
          t.assertTrue(false);
        }
        else 
        {
        	
        	console.debug(result.lengths[0]);
			console.debug(result.areas[0]);
        	t.assertEqual(expectedArea, result.areas[0]);
        	t.assertEqual(expectedLengths, result.lengths[0]);
         	
       }
               
        d.callback(true);
      }
      
      var graphic = new esri.Graphic(polygonGraphicJSON);
      var graphics = [];
      graphics.push(graphic);
	  var params = new esri.tasks.AreasAndLengthsParameters();
	  params.polygons = esri.getGeometries(graphics);
     
      geometryService.areasAndLengths(params,showResults);
      
      return d;
            
    }
  }
  ] , 
  
  function()//setUp()
  {
  	esriConfig.request.proxyUrl = "../../proxy.jsp";
    esriConfig.request.forceProxy = false;
  	geometryService = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
	 
  }, 
  
  function()//tearDown
  {
    geometryService = null;
    
  }
  
  );
