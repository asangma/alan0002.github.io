dojo.provide("esri.tests.tasks.geometry.onBufferCompleteTest");

var geometryService;

doh.registerGroup("tasks.geometry.onBufferCompleteTest", [
  {
    name: "pointGraphic",
    timeout: 3000,
    runTest: function(t)
    {
      
       
       var pointGraphicJSON = {"geometry":{"x":7651987.49987769,"y":694715.750126943,
       "spatialReference":{"wkid":102726}}};
                
      var d = new doh.Deferred();
         
      function showResults(graphics)
      {
       
        if (graphics == null || graphics.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
	     t.assertEqual(1, graphics[0].rings.length); 
         t.assertEqual(4326, graphics[0].spatialReference.wkid); 
          
        }
               
        d.callback(true);
      }
      
      var outSR = new esri.SpatialReference({ wkid: 4326 });
      var graphic = new esri.Graphic(pointGraphicJSON);
      var graphics = [];
	  graphics.push(graphic);
	  var params = new esri.tasks.BufferParameters();
      //params.features = graphics;
	  params.geometries = esri.getGeometries(graphics);
	  params.distances = [ 5, 10 ];
      params.unit = esri.tasks.BufferParameters.UNIT_FOOT;
      params.bufferSpatialReference = new esri.SpatialReference({wkid: 32662});
      params.outSpatialReference = outSR;
      dojo.connect(geometryService,"onBufferComplete",showResults);
      geometryService.buffer(params);
     
      return d;
            
    }
  },/**
  
  {
    name: "multipointGraphic",
    timeout: 3000,
    runTest: function(t)
    {
             
       var multipointGraphicJSON = {"geometry":
      	{"points":[[7617572.00013928,664093.562355682],
      		[7613754.99989927,665362.687442109],
			[7613946.99984336,674652.43756336]],
      "spatialReference":{"wkid":102726}}};
      
   
      var d = new doh.Deferred();
         
      function showResults(graphics)
      {
       
        if (graphics == null || graphics.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
		 //t.assertEqual(3, graphics[0].rings.length); 
         //t.assertEqual(4326, graphics[0].spatialReference.wkid); 
         
         }
               
        d.callback(true);
      }
      
     var outSR = new esri.SpatialReference({ wkid: 4326 });
      var graphic = new esri.Graphic(multipointGraphicJSON);
      var graphics = [];
	  graphics.push(graphic);
	  var params = new esri.tasks.BufferParameters();
      //params.features = graphics;
	  params.geometries = esri.getGeometries(graphics);
	  params.distances = [ 5, 10 ];
      params.unit = esri.tasks.BufferParameters.UNIT_FOOT;
      params.bufferSpatialReference = new esri.SpatialReference({wkid: 32662});
      params.outSpatialReference = outSR;
      dojo.connect(geometryService,"onBufferComplete",showResults);
      geometryService.buffer(params);
      
      return d;
            
    }
  },
 
  {
    name: "polylineGraphic",
    timeout: 3000,
    runTest: function(t)
    {
      
      var polylineGraphicJSON = {"geometry":
      	{"paths":[[[7641156.97298236,665234.497081682],
      	[7641047.39183669,665234.144064024],[7640990.17115061,665231.872086942],
      	[7640948.32215294,665241.718852013],[7640934.37008111,665272.030143097],
      	[7640929.44587836,665307.723969355],[7640938.06200285,665344.649092346],
      	[7640977.30897161,665407.533152938]]],
      "spatialReference":{"wkid":102726}}};
                 
      var d = new doh.Deferred();
         
      function showResults(graphics)
      {
       
        if (graphics == null || graphics.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
          //t.assertEqual(1, graphics[0].rings.length); 
          //t.assertEqual(4326, graphics[0].spatialReference.wkid); 
          
         }
               
        d.callback(true);
      }
      
      var outSR = new esri.SpatialReference({ wkid: 4326 });
      var graphic = new esri.Graphic(polylineGraphicJSON);
      var graphics = [];
	  graphics.push(graphic);
	  var params = new esri.tasks.BufferParameters();
      //params.features = graphics;
	  params.geometries = esri.getGeometries(graphics);
	  params.distances = [ 5, 10 ];
      params.unit = esri.tasks.BufferParameters.UNIT_FOOT;
      params.bufferSpatialReference = new esri.SpatialReference({wkid: 32662});
      params.outSpatialReference = outSR;
    
      dojo.connect(geometryService,"onBufferComplete",showResults);
      geometryService.buffer(params);
      
      return d;
            
    }
  },

  {
    name: "polygonGraphic",
    timeout: 3000,
    runTest: function(t)
    {
      
     
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
         
      function showResults(graphics)
      {
       
        if (graphics == null || graphics.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         //t.assertEqual(1, graphics[0].rings.length); 
         //t.assertEqual(4326, graphics[0].spatialReference.wkid);
        }
               
        d.callback(true);
      }
      
      var outSR = new esri.SpatialReference({ wkid: 4326 });
      var graphic = new esri.Graphic(polygonGraphicJSON);
      var graphics = [];
	  graphics.push(graphic);
	  var params = new esri.tasks.BufferParameters();
      //params.features = graphics;
	  params.geometries = esri.getGeometries(graphics);
	  params.distances = [ 5, 10 ];
      params.unit = esri.tasks.BufferParameters.UNIT_FOOT;
      params.bufferSpatialReference = new esri.SpatialReference({wkid: 32662});
      params.outSpatialReference = outSR;
    
      dojo.connect(geometryService,"onBufferComplete",showResults);
      geometryService.buffer(params);
      
      return d;
            
    }
  }**/
  ], 
  
  function()//setUp()
  {
  	esriConfig.request.proxyUrl = "../../proxy.jsp";
    esriConfig.request.forceProxy = false;
  	geometryService = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
	 
  }, 
  
  function()//tearDown
  {
    geometryService = null;
    
  });
