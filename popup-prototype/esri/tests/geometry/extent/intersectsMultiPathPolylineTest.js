dojo.provide("esri.tests.geometry.extent.intersectsMultiPathPolylineTest");

dojo.require("esri.geometry");

var extent;
doh.registerGroup("geometry.extent.intersectsMultiPathPolylineTest", [{
    name: "AllWithinExtent",
    timeout: 5000,
    runTest: function(t){
        var path1 = [[-120.91078533310154, 32.8926263461524], [-109.2516587072285, 43.66848580339868]];
        var path2 = [[-120.91078533310154, 32.8926263461524], [-109.2516587072285, 43.66848580339868]];
        var path3 = [[-120.91078533310154, 32.8926263461524], [-109.2516587072285, 43.66848580339868]];
        var polyline = new esri.geometry.Polyline(new esri.SpatialReference({
            wkid: 4326
        }));
        polyline.addPath(path1);
        polyline.addPath(path2);
        polyline.addPath(path3);
        
        t.assertTrue(extent.intersects(polyline));
        
    }
}, {
    name: "oneLineCrossExtentLine",
    timeout: 5000,
    runTest: function(t){
        var path1 = [[-120.91078533310154, 32.8926263461524], [-109.2516587072285, 43.66848580339868]];
        var path2 = [[-110.48823274330594, 12.224174600286567], [-60.14200413158147, 42.07860489987054]];
        var path3 = [[-78.69061467274312, 12.577481467737265], [-53.60582708374358, 25.119875262237038]];
        var polyline = new esri.geometry.Polyline(new esri.SpatialReference({
            wkid: 4326
        }));
        polyline.addPath(path1);
        polyline.addPath(path2);
        polyline.addPath(path3);
        t.assertTrue(extent.intersects(polyline));
        
        
    }
}, {
    name: "allOutSideExtent",
    timeout: 5000,
    runTest: function(t){
        var path1 = [[-176.55661695658648, 44.37509953830008], [-151.4718293675869, 59.39064140495475]];
        var path2 = [[-165.0741437644388, 31.479398876349606], [-121.26409220055224, 57.27080020025056]];
        var path3 = [[-168.78386587267113, 36.425695020659376], [-132.56991195897456, 62.21709634456033]];
        var polyline = new esri.geometry.Polyline(new esri.SpatialReference({
            wkid: 4326
        }));
        polyline.addPath(path1);
        polyline.addPath(path2);
        polyline.addPath(path3);
        t.assertFalse(extent.intersects(polyline));
        
    }
}, ], function()//setUp()
{
    extent = new esri.geometry.Extent(-124.09054714015782, 17.523777612047034, -71.27117045627847, 50.557969718687296, new esri.SpatialReference({
        wkid: 4326
    }));
    
    
}, function()//tearDown
{
    extent = null;
    
});

