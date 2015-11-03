dojo.provide("esri.tests.simplifiedapi.geometry.point");

dojo.require("esri.geometry");

doh.registerGroup("simplifiedapi.geometry.point", [
    {
        name: "testPointXY",
        timeout: 3000,
        runTest: function(t){
            var point = new esri.geometry.Point(-100, 40);

            t.assertEqual("4326",point.spatialReference.wkid);
            t.assertEqual("point",point.type);
            t.assertEqual(-100,point.x);
            t.assertEqual(40,point.y);

        }

    },
    {
        name: "testPointLatXLonY",
        timeout: 3000,
        runTest: function(t){
            var point = new esri.geometry.Point({"latitude": 40, "longitude": -100});

            t.assertEqual("4326",point.spatialReference.wkid);
            t.assertEqual("point",point.type);
            t.assertEqual(-100,point.x);
            t.assertEqual(40,point.y);

        }

    },
    {
        name: "testPointXYArray",
        timeout: 3000,
        runTest: function(t){
            var point = new esri.geometry.Point([-100, 40]);

            t.assertEqual("4326",point.spatialReference.wkid);
            t.assertEqual("point",point.type);
            t.assertEqual(-100,point.x);
            t.assertEqual(40,point.y);

        }

    }
    ]
	);
