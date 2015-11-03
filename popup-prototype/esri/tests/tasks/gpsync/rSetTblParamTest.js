dojo.provide("esri.tests.tasks.gpsync.rSetTblParamTest");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpsync.rSetTblParamTest", [{
    name: "gpSync",
    timeout: 6000,
    runTest: function(t){
        //create input param
        var inputRecordSetJson = {
            "features": [{
                "attributes": {
                    "OID": 1,
                    "TextFld": "a",
                    "SIntFld": 1,
                    "LIntFld": 1000,
                    "DblFld": 0.12345,
                    "DateFld": 229564800000
                }
            }, {
                "attributes": {
                    "OID": 2,
                    "TextFld": "b",
                    "SIntFld": 200,
                    "LIntFld": 20000,
                    "DblFld": 12345.123449999999,
                    "DateFld": 282096000000
                }
            }, {
                "attributes": {
                    "OID": 3,
                    "TextFld": "c",
                    "SIntFld": 3000,
                    "LIntFld": 3000000,
                    "DblFld": 9.9999999999999995e-007,
                    "DateFld": 335059200000
                }
            }, {
                "attributes": {
                    "OID": 4,
                    "TextFld": "d",
                    "SIntFld": 30000,
                    "LIntFld": 1000000000,
                    "DblFld": 10000000000000,
                    "DateFld": 417744000000
                }
            }],
            "exceededTransferLimit": false
        };
        
		var inputRecordSet = new esri.tasks.FeatureSet(inputRecordSetJson);
        var params = {
            "Input_Record_Set": inputRecordSet
            
        };
        
        var d = new doh.Deferred();
        
        function showResult(result){
           
			switch (result[0].paramName) {
				case "Output_DBF":
					t.assertEqual(result[0].dataType, "GPRecordSet");
					t.assertTrue(result[0].value.features.length>0);
					break;
				case "Output_GDB_Table":
					t.assertEqual(result[0].dataType, "GPRecordSet");
					t.assertTrue(result[0].value.features.length>0);
			}
            d.callback(true); 
            
        }
        
        gpTask.execute(params, showResult);
		return d;
      
    }
}], function()//setUp()
{
    esriConfig.request.proxyUrl = "../../proxy.jsp";
    esriConfig.request.forceProxy = false;
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_sync/GPServer/RSetTblParamTest");
}, function()//tearDown
{
    gpTask = null;
});
