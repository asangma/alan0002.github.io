dojo.provide("esri.tests.tasks.gpasync.fSetClassParamTestOutPoly");

dojo.require("esri.tasks.gp");

var gpTask;

doh.registerGroup("tasks.gpasync.fSetClassParamTestOutPoly", [{
    name: "gpAsync",
    timeout: 6000,
    runTest: function(t){
        //create input param
        var polyFeaturesetJson = {
            "geometryType": "esriGeometryPolygon",
            "spatialReference": {
                "wkid": 26944
            },
            "features": [{
                "attributes": {
                    "OBJECTID": 1,
                    "ID": 9878,
                    "FIPSSTCO": "06019",
                    "TRACT2000": "006300",
                    "BLOCK2000": "3018",
                    "STFID": "060190063003018",
                    "Shape_Leng": 5394.7086111899998,
                    "Shape_Area": 1164451.0575900001,
                    "POP2000": 154,
                    "WGT_INT": 154,
                    "WGT_FLT": 1.16445,
                    "WGT_DBL": 1164451.0575900001,
                    "CASE_INT": 6300,
                    "CASE_FLT": 0.063,
                    "CASE_DBL": 66345300,
                    "CASE_TXT": "006300",
                    "DIM_INT": 154,
                    "DIM_FLT": 1.16445,
                    "DIM_DBL": 1164451.0575900001,
                    "CASE_DATE": -49161600000,
                    "A_DATE_FLD": -878601600000,
                    "A_TXT_FLD": "5394.70861119266",
                    "ZERO_FLD": 0,
                    "NEG_FLD": -154,
                    "geocompID": 1,
                    "SELF_INT": 304,
                    "SELF_DBL": 304407866.47500002,
                    "SELF_FLT": 3.04408E-04
                },
                "geometry": {
                    "rings": [[[1960366.2575374665, 641906.11193317233], [1960480.9383855732, 642313.49102955172], [1960308.9245294132, 642314.83885355294], [1960306.9441694112, 642079.82406133402], [1959867.2214170017, 642089.5235173431], [1959867.5867130021, 642110.27227736241], [1959867.9623690024, 642133.24028538377], [1959869.1064490036, 642205.80609345145], [1959877.1166810109, 642714.21078992484], [1960673.2035697524, 642710.52946992149], [1961478.2752825022, 642695.78512590774], [1961465.7470664906, 641896.89342116367], [1961238.9749622792, 641897.9135411646], [1961174.5618102192, 641897.20570916403], [1961063.1930581157, 641898.70840516535], [1961000.9293620575, 641898.54695716524], [1960916.3066019788, 641899.59730116627], [1960866.2994499323, 641899.60300516617], [1960678.4409617572, 641900.46075716708], [1960366.2575374665, 641906.11193317233]]]
                }
            }]
        };
        
       
        var polyFeatureSet = esri.tasks.FeatureSet(polyFeaturesetJson);
        var params = {
            "Point_FS": "",
            "Line_FS": "",
            "Poly_FS": polyFeatureSet
        };
        
        var d = new doh.Deferred();
        function statusCallback(jobInfo){
            console.log(jobInfo.jobStatus);
            
        }
        function showResult(jobInfo){
            gpTask.getResultData(jobInfo.jobId, "Output_Poly_FC");
        }
        function getData(result){
			t.assertEqual(result.dataType, "GPFeatureRecordSetLayer");
			t.assertTrue(result.value.features.length>0);
            d.callback(true);
            
        }
        dojo.connect(gpTask, "onGetResultDataComplete", getData);
		gpTask.submitJob(params, showResult, statusCallback);
        return d;
        
    }
}], function()//setUp()

{
    esriConfig.request.proxyUrl = "../../../esri/tests/proxy.jsp";
    esriConfig.request.forceProxy = false;
    gpTask = new esri.tasks.Geoprocessor("http://servery/ArcGIS/rest/services/GPServices/byVal_async/GPServer/FSetFClassParamTests");
}, function()//tearDown
{
    gpTask = null;
});

