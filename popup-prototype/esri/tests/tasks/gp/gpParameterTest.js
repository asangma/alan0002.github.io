dojo.provide("esri.tests.tasks.gp.gpParameterTest");

dojo.require("esri.tasks.gp");

var gpAsynch;

var baseValues = [];
baseValues.Output_String = 
    {
        dataType: "GPString",
        value: "hello test"
    };

//Sun Apr 10 16:00:00 PST 1977 //GP Generated
//Sun Apr 10 1977 16:00:00 GMT-0800 (PST) //JSAPI transformed
baseValues.Output_Date = 
    {
        dataType: "GPDate",
        value: "Sun Apr 10 1977 16:00:00 GMT-0800 (PST)"
    };

baseValues.Output_Long = 
    {
        dataType: "GPLong",
        value: 1
    };
baseValues.Output_Double = 
    {
        dataType: "GPDouble",
        value: 545.64
    };
baseValues.Output_Boolean = 
    {
        dataType: "GPBoolean",
        value: true
    };
baseValues.Output_Linear_Unit = 
    {
        dataType: "GPLinearUnit",
        value: 
            {
                "distance": 101,
                "units": "esriKilometers",
                "preamble": null,
                "declaredClass": "esri.tasks.LinearUnit"
            }
    };
//baseValues.Output_ = { dataType: "", value: "" };

doh.registerGroup("tasks.gp.gpParameterTest", [
    //GP.execute
    {
        name: "BasicParamTypesSync",
        timeout: 10000,
        runTest: function(t)
        {
            var d = new doh.Deferred();
            d.addCallback(compareResults);
            
            function dCallback()
            {
                d.callback(arguments);
            }
            
            function compareResults(args)
            {
                var status = args[0];
                var messages = args[1];
                var paramValues = args[2];
                
                if (status) 
                {
                    var paramValue, baseValue;
                    for (var i = 0, il = paramValues.length; i < il; i++) 
                    {
                        paramValue = paramValues[i];
                        baseValue = baseValues[paramValue.paramName];
                        t.assertEqual(baseValue.dataType, paramValue.dataType);
                        t.assertEqual(baseValue.value, paramValue.value);
                    }
                }
            }
            
            //gp = new esri.tasks.Geoprocessor("http://trollxp:8399/arcgis/rest/services/gp/ByValSync/GPServer/SimpleParamTest");
            var gpSynch = new esri.tasks.Geoprocessor("http://orthogonal.esri.com/arcgis/services/ByValTools/SimpleParamTest");
            gpSynch.execute(
                {
                    Input_String: "hello test"
                }, dCallback);
            return d;
        }
    }, 

    //GP.submitJob
    {
        name: "BasicParamTypesAsync_Output_String",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();
            d.addCallback(compareResults);
            
            function dCallback(paramValue)
            {
                d.callback(paramValue);
            }
            
            function getResult(jobInfo)
            {
                t.assertEqual(true, (jobInfo instanceof esri.tasks.JobInfo));
                t.assertEqual(esri.tasks.JobInfo.STATUS_SUCCEEDED, jobInfo.jobStatus);
                gpAsynch.getResultData(jobInfo.jobId, "Output_String", dCallback);
            }
            
            function compareResults(paramValue)
            {
                var baseValue = baseValues.Output_String;
                t.assertEqual(baseValue.dataType, paramValue.dataType);
                t.assertEqual(baseValue.value, paramValue.value);
            }
            
            
            gpAsynch.submitJob(
                {
                    Input_String: "hello test"
                }, getResult);
            return d;
        }
    }, 

    {
        name: "BasicParamTypesAsync_Output_Date",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();
            d.addCallback(compareResults);
            
            function dCallback(paramValue)
            {
                d.callback(paramValue);
            }
            
            function getResult(jobInfo)
            {
                t.assertEqual(true, (jobInfo instanceof esri.tasks.JobInfo));
                t.assertEqual(esri.tasks.JobInfo.STATUS_SUCCEEDED, jobInfo.jobStatus);
                gpAsynch.getResultData(jobInfo.jobId, "Output_Date", dCallback);
            }
            
            function compareResults(paramValue)
            {
                var baseValue = baseValues.Output_Date;
                t.assertEqual(baseValue.dataType, paramValue.dataType);
                t.assertEqual(baseValue.value, paramValue.value);
            }
            
            //gpAsynch = new esri.tasks.Geoprocessor("http://trollxp:8399/arcgis/rest/services/gp/ByValAsync/GPServer/SimpleParamTest");
            gpAsynch.submitJob(
                {
                    Input_Date: new Date("Sun Apr 10 1977 16:00:00 GMT-0800 (PST)")
                }, getResult);
            return d;
        }
    }, 

    {
        name: "BasicParamTypesAsync_Output_Long",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();
            d.addCallback(compareResults);
            
            function dCallback(paramValue)
            {
                d.callback(paramValue);
            }
            
            function getResult(jobInfo)
            {
                t.assertEqual(true, (jobInfo instanceof esri.tasks.JobInfo));
                t.assertEqual(esri.tasks.JobInfo.STATUS_SUCCEEDED, jobInfo.jobStatus);
                gpAsynch.getResultData(jobInfo.jobId, "Output_Long", dCallback);
            }
            
            function compareResults(paramValue)
            {
                var baseValue = baseValues.Output_Long;
                t.assertEqual(baseValue.dataType, paramValue.dataType);
                t.assertEqual(baseValue.value, paramValue.value);
            }
            
            //gpAsynch = new esri.tasks.Geoprocessor("http://trollxp:8399/arcgis/rest/services/gp/ByValAsync/GPServer/SimpleParamTest");
            gpAsynch.submitJob(
                {
                    Input_Long: 1
                }, getResult);
            return d;
        }
    }, 

    {
        name: "BasicParamTypesAsync_Output_Double",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();
            d.addCallback(compareResults);
            
            function dCallback(paramValue)
            {
                d.callback(paramValue);
            }
            
            function getResult(jobInfo)
            {
                t.assertEqual(true, (jobInfo instanceof esri.tasks.JobInfo));
                t.assertEqual(esri.tasks.JobInfo.STATUS_SUCCEEDED, jobInfo.jobStatus);
                gpAsynch.getResultData(jobInfo.jobId, "Output_Double", dCallback);
            }
            
            function compareResults(paramValue)
            {
                var baseValue = baseValues.Output_Double;
                t.assertEqual(baseValue.dataType, paramValue.dataType);
                t.assertEqual(baseValue.value, paramValue.value);
            }
            
            //gp = new esri.tasks.Geoprocessor("http://trollxp:8399/arcgis/rest/services/gp/ByValAsync/GPServer/SimpleParamTest");
            gpAsynch.submitJob(
                {
                    Input_Double: 545.64
                }, getResult);
            return d;
        }
    }, 
    {
        name: "BasicParamTypesAsync_Output_Boolean",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();
            d.addCallback(compareResults);
            
            function dCallback(paramValue)
            {
                d.callback(paramValue);
            }
            
            function getResult(jobInfo)
            {
                t.assertEqual(true, (jobInfo instanceof esri.tasks.JobInfo));
                t.assertEqual(esri.tasks.JobInfo.STATUS_SUCCEEDED, jobInfo.jobStatus);
                gpAsynch.getResultData(jobInfo.jobId, "Output_Boolean", dCallback);
            }
            
            function compareResults(paramValue)
            {
                var baseValue = baseValues.Output_Boolean;
                t.assertEqual(baseValue.dataType, paramValue.dataType);
                t.assertEqual(baseValue.value, paramValue.value);
            }
            
            //gpAsynch = new esri.tasks.Geoprocessor("http://trollxp:8399/arcgis/rest/servicegpAsynchgp/ByValAsync/GPServer/SimpleParamTest");
            gpAsynch.submitJob(
                {
                    Input_Boolean: true
                }, getResult);
            return d;
        }
    }, 

    {
        name: "BasicParamTypesAsync_Output_Linear_Unit",
        timeout: 5000,
        runTest: function(t)
        {
            var d = new doh.Deferred();
            d.addCallback(compareResults);
            
            function dCallback(paramValue)
            {
                d.callback(paramValue);
            }
            
            function getResult(jobInfo)
            {
                t.assertEqual(true, (jobInfo instanceof esri.tasks.JobInfo));
                t.assertEqual(esri.tasks.JobInfo.STATUS_SUCCEEDED, jobInfo.jobStatus);
                gpAsynch.getResultData(jobInfo.jobId, "Output_Linear_Unit", dCallback);
            }
            
            function compareResults(paramValue)
            {
                var baseValue = baseValues.Output_Linear_Unit;
                t.assertEqual(baseValue.dataType, paramValue.dataType);
                t.assertEqual(baseValue.value, paramValue.value);
            }
            
            //gp = new esri.tasks.Geoprocessor("http://trollxp:8399/arcgis/rest/services/gp/ByValAsync/GPServer/SimpleParamTest");
            gpAsynch.submitJob(
                {
                    Input_Linear_Unit: new esri.tasks.LinearUnit(
                        {
                            distance: 101,
                            units: "esriKilometers"
                        })
                }, getResult);
				
            return d;
        }
    }], 
	
	function()//setUp()
	{ 
	   console.log("1");
	   gpAsynch = new esri.tasks.Geoprocessor("http://orthogonal.esri.com/arcgis/services/ByValToolsAsynch/SimpleParamTest");
        console.log("3");	   
	}, 
	
	function()//tearDown
	{ 
	   gpAsynch = null;
	}
);
