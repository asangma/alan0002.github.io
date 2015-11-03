dojo.provide("esri.tests.tasks.gpsync.simpleParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpsync.simpleParamTest", [{
    name: "gpSync",
    timeout: 3000,
    runTest: function(t){
        //create input param
         var params = {
            "Input_String": "test",
            "Input_Long": 123456,
			"Input_Double":123.456,
			"Input_Boolean":false,
			"Input_Date":1199145600000,
			"Input_Linear_Unit":"",
				
        };
		
		var d = new doh.Deferred();
		
		function showResult(result){
			console.log(dojo.toJson(result));
			for (var i =0;i<result.length;i++){
				switch(result[i].paramName){
					case "Output_String":
						t.assertEqual(result[i].dataType,"GPString");
						t.assertEqual(result[i].value,"test");
					break;
					case "Output_Date":
						t.assertEqual(result[i].dataType,"GPDate");
						t.assertEqual(result[i].value,"Mon Dec 31 2007 16:00:00 GMT-0800 (Pacific Standard Time)");
					break;
					case "Output_Long":
						t.assertEqual(result[i].dataType,"GPLong");
						t.assertEqual(result[i].value,123456);
					break;
					case "Output_Long":
						t.assertEqual(result[i].dataType,"GPLong");
						t.assertEqual(result[i].value,123456);
					break;
					case "Output_Double":
						t.assertEqual(result[i].dataType,"GPDouble");
						t.assertEqual(result[i].value,123.456);
					break;
					case "Output_Boolean":
						t.assertEqual(result[i].dataType,"GPBoolean");
						t.assertFalse(result[i].value);
					break;
					case "Output_Linear_Unit":
						t.assertEqual(result[i].dataType,"GPLinearUnit");
						t.assertEqual(result[i].value.distance,101);
						t.assertEqual(result[i].value.units,"esriKilometers");
					break;
					
					
				}
				
				
				
			}
			d.callback(true);
			
		}
        gpTask.execute(params, showResult);
        return d;
        
    }
}], function()//setUp()
{
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_sync/GPServer/SimpleParamTest");
}, function()//tearDown
{
    gpTask = null;
});
