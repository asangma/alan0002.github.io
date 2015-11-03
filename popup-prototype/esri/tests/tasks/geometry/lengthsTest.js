dojo.provide("esri.tests.tasks.geometry.lengthsTest");



doh.registerGroup("tasks.geometry.lengthsTest", [
  
  {
    name: "lengths",
    timeout: 3000,
    runTest: function(t)
    {
       
       var expectedLengths = [391.282862928325];
                  	  
    	var polylineGraphicJSON = {"geometry":
      	{"paths":[[[7641156.97298236,665234.497081682],
      	[7641047.39183669,665234.144064024],[7640990.17115061,665231.872086942],
      	[7640948.32215294,665241.718852013],[7640934.37008111,665272.030143097],
      	[7640929.44587836,665307.723969355],[7640938.06200285,665344.649092346],
      	[7640977.30897161,665407.533152938]]],
      "spatialReference":{"wkid":102726}}};
      
      var geometryService = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
           
      var d = new doh.Deferred();
         
      function showResults(lengths)
      {
       
        if (lengths == null) 
        {
          t.assertTrue(false);
        }
        else 
        {
        	var lengths = lengths.lengths;
           	t.assertEqual(expectedLengths, lengths[0]);
         }
               
        d.callback(true);
      }
      
      var graphic = new esri.Graphic(polylineGraphicJSON);
      var graphics = [];
      graphics.push(graphic);
     
      geometryService.lengths(graphics,showResults);
      
      return d;
            
    }
  }
  ] 
  
  );
