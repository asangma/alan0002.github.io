dojo.provide("esri.tests.tasks.geometry.simplifyTest");

var geometryService;

doh.registerGroup("tasks.geometry.simplifyTest", [
  
  {
    name: "polygonGraphic",
    timeout: 3000,
    runTest: function(t)
    {
      
     var expectedResultJSON = {"rings":[[[-6.50517086299993,-13.403129548],
	 [-6.67968749999994,-13.781248927],[-7.03124999999994,-13.781248927],
	 [-6.50517086299993,-13.403129548]],[[13.6161782300001,1.05909011300002],
	 [-6.50517086299993,-13.403129548],[3.75737188200003,8.83237973300004],
	 [13.6161782300001,1.05909011300002]],[[13.6161782300001,1.05909011300002],
	 [49.2187500000001,26.6484385730001],[31.9921875000001,-13.429686427],
	 [13.6161782300001,1.05909011300002]],[[3.75737188200003,8.83237973300004],
	 [-4.57031249999994,15.398438573],[20.7421875000001,45.6328135730001],
	 [3.75737188200003,8.83237973300004]]],"spatialReference":{"wkid":4326}};
      
      var polygonGraphicJSON={"geometry":
      	{"rings":[[[49.21875,26.648438572883606],
      	[31.9921875,-13.429686427116394],[-4.5703125,15.398438572883606],
      	[20.7421875,45.632813572883606],[-6.6796875,-13.781248927116394],
      	[-7.03125,-13.781248927116394],[49.21875,26.648438572883606]]],
      	"spatialReference":{"wkid":4326}}};
           
      
      var d = new doh.Deferred();
         
      function showResults(graphics)
      {
       console.log("result:"+graphics);
        if (graphics == null || graphics.length == 0) 
        {
          t.assertTrue(false);
        }
        else 
        {
         //console.debug(dojo.toJson(graphics[0].toJSON()));
         t.assertEqual(dojo.toJson(expectedResultJSON), dojo.toJson(graphics[0].toJSON()));
        }
               
        d.callback(true);
      }
      
      	var graphic = new esri.Graphic(polygonGraphicJSON);
      	graphics = [];
      	graphics.push(graphic);
		
      	geometryService.simplify(esri.getGeometries(graphics),showResults); 
      return d;
            
    }
  }
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
