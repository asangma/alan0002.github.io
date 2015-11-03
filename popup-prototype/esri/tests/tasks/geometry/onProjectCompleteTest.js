dojo.provide("esri.tests.tasks.geometry.onProjectCompleteTest");

var geometryService;

doh.registerGroup("tasks.geometry.onProjectCompleteTest", [
  {
    name: "pointGraphic",
    timeout: 3000,
    runTest: function(t)
    {
      
       var expectedResultJSON = {"x":-122.647677101485,"y":45.552160552444,"spatialReference":{"wkid":4326}};
       var pointGraphicJSON = {"geometry":{"x":7651987.49987769,"y":694715.750126943,
       "spatialReference":{"wkid":102726}}};
      
      var outSR = new esri.SpatialReference({ wkid: 4326});
      
      var d = new doh.Deferred();
         
      function showResults(graphics)
      {
       
        if (graphics == null || graphics.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         t.assertEqual(dojo.toJson(expectedResultJSON), dojo.toJson(graphics[0].toJSON()));
          
        }
               
        d.callback(true);
      }
      
      var graphic = new esri.Graphic(pointGraphicJSON);
      var graphics = [];
      graphics.push(graphic);
   	  dojo.connect(geometryService,"onProjectComplete",showResults);
      geometryService.project(esri.getGeometries(graphics),outSR);
      
      
      return d;
            
    }
  },
 /**
  {
    name: "multipointGraphic",
    timeout: 3000,
    runTest: function(t)
    {
      
       var expectedResultJSON = {"points":[[-122.778601416171,45.4656194787125],
	   [-122.793613684033,45.4688027458717],
	   [-122.793893582419,45.4942865302182]],"spatialReference":{"wkid":4326}};;
       
       var multipointGraphicJSON = {"geometry":
      	{"points":[[7617572.00013928,664093.562355682],
      		[7613754.99989927,665362.687442109],
			[7613946.99984336,674652.43756336]],
      "spatialReference":{"wkid":102726}}};
      
      var outSR = new esri.SpatialReference({ wkid: 4326 });
      
      var d = new doh.Deferred();
         
      function showResults(graphics)
      {
       
        if (graphics == null || graphics.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         console.debug(graphics.length);
         t.assertEqual(dojo.toJson(expectedResultJSON), dojo.toJson(graphics[0].toJSON()));
          
         
         }
               
        d.callback(true);
      }
      
      var graphic = new esri.Graphic(multipointGraphicJSON);
      var graphics = [];
      graphics.push(graphic);
      dojo.connect(geometryService,"onProjectComplete",showResults);
      geometryService.project(esri.getGeometries(graphics),outSR);
      dojo.disconnect(showResults);
      
      return d;
            
    }
  },
 
  {
    name: "polylineGraphic",
    timeout: 3000,
    runTest: function(t)
    {
      var expectedResultJSON = {"paths":[[[-122.686826282779,45.4705349944436],
	  [-122.687253249644,45.4705258915539],[-122.68747598129,45.4705154138975],
	  [-122.687640093146,45.4705393034179],[-122.687697659215,45.4706213722485],
	  [-122.687720614608,45.4707188688393],[-122.687690937278,45.4708207467957],
	  [-122.687544639631,45.4709960712593]]],"spatialReference":{"wkid":4326}};
      
      var polylineGraphicJSON = {"geometry":
      	{"paths":[[[7641156.97298236,665234.497081682],
      	[7641047.39183669,665234.144064024],[7640990.17115061,665231.872086942],
      	[7640948.32215294,665241.718852013],[7640934.37008111,665272.030143097],
      	[7640929.44587836,665307.723969355],[7640938.06200285,665344.649092346],
      	[7640977.30897161,665407.533152938]]],
      "spatialReference":{"wkid":102726}}};
      
      var outSR = new esri.SpatialReference({ wkid: 4326 });
      
      var d = new doh.Deferred();
         
      function showResults(graphics)
      {
       
        if (graphics == null || graphics.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         console.debug(graphics.length);
         t.assertEqual(dojo.toJson(expectedResultJSON), dojo.toJson(graphics[0].toJSON()));
          
         }
               
        d.callback(true);
      }
      
      var graphic = new esri.Graphic(polylineGraphicJSON);
      var graphics = [];
      graphics.push(graphic);
      dojo.connect(geometryService,"onProjectComplete",showResults);
      geometryService.project(esri.getGeometries(graphics),outSR);
      dojo.disconnect(showResults);
      
      return d;
            
    }
  },

  {
    name: "polygonGraphic",
    timeout: 3000,
    runTest: function(t)
    {
      
     var expectedResultJSON =  {"rings":[[[-122.759567885174,45.4520416116347],
	 [-122.75956725175,45.4520256753158],[-122.759639362884,45.4520254562882],
	 [-122.759640663478,45.4520091389122],[-122.759641957278,45.4519926506324],
	 [-122.75956788494,45.4519925662037],[-122.75956891995,45.4519695664942],[-122.759567843841,45.4519424926515],[-122.759723779017,45.4519425080531],[-122.759724950558,45.4519719808423],[-122.759724467344,45.4520088606302],[-122.759725694655,45.452039704221],[-122.759725150121,45.4520750413778],[-122.759567286056,45.4520755779633],
	 [-122.759567885174,45.4520416116347]]],"spatialReference":{"wkid":4326}};
      
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
      
      var outSR = new esri.SpatialReference({ wkid: 4326 });
      
      var d = new doh.Deferred();
         
      function showResults(graphics)
      {
       
        if (graphics == null || graphics.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         console.debug(graphics.length);
         t.assertEqual(dojo.toJson(expectedResultJSON), dojo.toJson(graphics[0].toJSON()));
        }
               
        d.callback(true);
      }
      
      var graphic = new esri.Graphic(polygonGraphicJSON);
      var graphics = [];
      graphics.push(graphic);
      dojo.connect(geometryService,"onProjectComplete",showResults);
      geometryService.project(esri.getGeometries(graphics),outSR);
      dojo.disconnect(showResults);
      
      return d;
            
    }
  },
  
  {
    name: "extentGraphic",
    timeout: 3000,
    runTest: function(t)
    {
     
     var expectedResultJSON = {"xmin":-122.688186848217,"ymin":45.4702503353262,
	 "xmax":-122.687794329926,"ymax":45.4705127267112,"spatialReference":{"wkid":4326}};
     
     var extentGraphicJSON={"geometry":
      	{
                    "xmin": 7640807.778,
                    "ymin": 665140.129,
                    "xmax": 7640905.989,
                    "ymax": 665233.172,
      "spatialReference":{"wkid":102726}}};
      
      var outSR = new esri.SpatialReference({ wkid: 4326 });
      
      var d = new doh.Deferred();
         
      function showResults(graphics)
      {
       
        if (graphics == null || graphics.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         console.debug(graphics.length);
         t.assertEqual(dojo.toJson(expectedResultJSON), dojo.toJson(graphics[0].toJSON()));
        }
               
        d.callback(true);
      }
      
      var graphic = new esri.Graphic(extentGraphicJSON);
      var graphics = [];
      graphics.push(graphic);
      dojo.connect(geometryService,"onProjectComplete",showResults);
      geometryService.project(esri.getGeometries(graphics),outSR);
      
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
