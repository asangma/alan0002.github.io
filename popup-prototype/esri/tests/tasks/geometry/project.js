dojo.provide("esri.tests.tasks.geometry.project");

dojo.require("esri.tasks.query");
dojo.require("esri.tasks.geometry");

doh.registerGroup("tasks.geometry.project",
  [
    {
      name: "Point",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();

        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/3");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        var fields = (query.outFields = ["NAME", "ADDRESS", "CITY", "STATE", "ZIPCODE", "DISTRICT"]);
        query.where = "FID = 100";

        queryTask.execute(query, function(featureSet) {
          var outSR = new esri.SpatialReference({ wkid: 4326 });

          function assert(graphics) {
            t.assertEqual(featureSet.features.length, graphics.length);

            var graphic = graphics[0];
            var attributes = graphic.attributes;
            var field;
            
            t.assertTrue(graphic.geometry instanceof esri.geometry.Point);
            t.assertEqual(outSR.wkid, graphic.geometry.spatialReference.wkid);
            for (var i=0, il=fields.length; i<il; i++) {
              field = fields[i];
              t.assertTrue(attributes.hasOwnProperty(field));
              t.assertEqual(featureSet.features[0].attributes[field], attributes[field]);
            }

            d.callback(true);
          }
                                        
          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.project(featureSet.features, outSR, assert);
        });
        
        return d;
      }
    },
  
    {
      name: "Multiple Points",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();
        
        //query zoning layer
        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/3");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.where = "CITY = 'Beaverton'";
        var fields = (query.outFields = ["NAME", "ADDRESS", "CITY", "STATE", "ZIPCODE", "DISTRICT"]);
        
        queryTask.execute(query, function(featureSet) {
          var outSR = new esri.SpatialReference({ wkid: 4326 });
          
          function assert(graphics) {
            t.assertEqual(featureSet.features.length, graphics.length);

            var graphic, attributes, field;
            for (var i=0, il=graphics.length; i<il; i++) {
              graphic = graphics[i];
              attributes = graphic.attributes;

              t.assertTrue(graphics[i].geometry instanceof esri.geometry.Point);
              t.assertEqual(outSR.wkid, graphics[i].geometry.spatialReference.wkid);

              for (var j=0, jl=fields.length; j<jl; j++) {
                field = fields[j];
                t.assertTrue(attributes.hasOwnProperty(field));
                t.assertEqual(featureSet.features[i].attributes[field], attributes[field]);
              }
            }

            d.callback(true);
          }
                                        
          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.project(featureSet.features, outSR, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "Extent",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();

        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/8");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        var fields = (query.outFields = ["AREA", "CITY_NO", "CITY", "ZONE"]);
        query.where = "FID = 25";

        queryTask.execute(query, function(featureSet) {
          var outSR = new esri.SpatialReference({ wkid: 4326 });

          function assert(graphics) {
            t.assertEqual(featureSet.features.length, graphics.length);

            var graphic = graphics[0];
            var attributes = graphic.attributes;
            var field;
            
            t.assertTrue(graphic.geometry instanceof esri.geometry.Extent);
            t.assertEqual(outSR.wkid, graphic.geometry.spatialReference.wkid);
            for (var i=0, il=fields.length; i<il; i++) {
              field = fields[i];
              t.assertTrue(attributes.hasOwnProperty(field));
              t.assertEqual(featureSet.features[0].attributes[field], attributes[field]);
            }

            d.callback(true);
          }
                                        
          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          var extent = featureSet.features[0].geometry.getExtent();
          gs.project([new esri.Graphic(extent, null, featureSet.features[0].attributes)], outSR, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "Multiple Extents",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();

        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/8");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        var fields = (query.outFields = ["AREA", "CITY_NO", "CITY", "ZONE"]);
        query.where = "FID = 24 OR FID = 25";

        queryTask.execute(query, function(featureSet) {
          var outSR = new esri.SpatialReference({ wkid: 4326 });
          
          function assert(graphics) {
            t.assertEqual(featureSet.features.length, graphics.length);

            var graphic, attributes, field;
            for (var i=0, il=graphics.length; i<il; i++) {
              graphic = graphics[i];
              attributes = graphic.attributes;
              t.assertTrue(graphic.geometry instanceof esri.geometry.Extent);
              t.assertEqual(outSR.wkid, graphic.geometry.spatialReference.wkid);

              for (var j=0, jl=fields.length; j<jl; j++) {
                field = fields[j];
                t.assertTrue(graphic.attributes.hasOwnProperty(field));
                t.assertEqual(featureSet.features[i].attributes[field], attributes[field]);
              }
            }
                        
            d.callback(true);
          }
                                        
          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          var features = featureSet.features;
          var extents = [];
          for (var i=0, il=features.length; i<il; i++) {
            extents[i] = new esri.Graphic(features[i].geometry.getExtent(), null, features[i].attributes);
          }
          gs.project(extents, outSR, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "Multipoint",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();

        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/2");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        var fields = (query.outFields = ["animalnum", "species"]);
        query.text = "2";
        
        queryTask.execute(query, function(featureSet) {
          var outSR = new esri.SpatialReference({ wkid: 4326 });
          
          function assert(graphics) {
            t.assertEqual(featureSet.features.length, graphics.length);

            var graphic = graphics[0];
            var attributes = graphic.attributes;
            var field;

            t.assertTrue(graphic.geometry instanceof esri.geometry.Multipoint);
            t.assertEqual(featureSet.features[0].geometry.points.length, graphic.geometry.points.length);
            t.assertEqual(outSR.wkid, graphic.geometry.spatialReference.wkid);
            
            for (var i=0, il=fields.length; i<il; i++) {
              field = fields[i];
              t.assertTrue(attributes.hasOwnProperty(field));
              t.assertEqual(featureSet.features[0].attributes[field], attributes[field]);
            }

            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.project(featureSet.features, outSR, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "Multiple Multipoint",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();

        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/2");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        var fields = (query.outFields = ["animalnum", "species"]);
        query.where = "Id = 2 OR Id = 6";
        
        var outSR = new esri.SpatialReference({ wkid: 4326 });
        queryTask.execute(query, function(featureSet) {
          function assert(graphics) {
            t.assertEqual(featureSet.features.length, graphics.length);

            var graphic, attributes, field;
            for (var i=0, il=graphics.length; i<il; i++) {
              graphic = graphics[i];
              attributes = graphic.attributes;

              t.assertTrue(graphic.geometry instanceof esri.geometry.Multipoint);
              t.assertEqual(featureSet.features[i].geometry.points.length, graphic.geometry.points.length);
              t.assertEqual(outSR.wkid, graphic.geometry.spatialReference.wkid);
              
              for (var j=0, jl=fields.length; j<jl; j++) {
                field = fields[j];
                t.assertTrue(graphic.attributes.hasOwnProperty(field));
                t.assertEqual(featureSet.features[i].attributes[field], attributes[field]);
              }
            }

            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.project(featureSet.features, outSR, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "Polyline",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();
        
        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/5");
        var query = new esri.tasks.Query();
        query.returnGeometry = true;
        var fields = (query.outFields = ["LENGTH", "STREETNAME", "STATE"]);
        query.where = "FID = 7245";
        
        queryTask.execute(query, function(featureSet) {
          var outSR = new esri.SpatialReference({ wkid: 4326 });
          
          function assert(graphics) {
            t.assertEqual(featureSet.features.length, graphics.length);

            var graphic = graphics[0];
            var attributes = graphic.attributes;
            var field;

            t.assertTrue(graphic.geometry instanceof esri.geometry.Polyline);
            t.assertEqual(featureSet.features[0].geometry.paths.length, graphic.geometry.paths.length);
            t.assertEqual(outSR.wkid, graphic.geometry.spatialReference.wkid);

            for (var i=0, il=fields.length; i<il; i++) {
              field = fields[i];
              t.assertTrue(attributes.hasOwnProperty(field));
              t.assertEqual(featureSet.features[0].attributes[field], attributes[field]);
            }

            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.project(featureSet.features, outSR, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "Multiple Polylines",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();
        
        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/5");
        var query = new esri.tasks.Query();
        query.returnGeometry = true;
        var fields = (query.outFields = ["LENGTH", "STREETNAME", "STATE"]);
        query.text = "CULLY";
        
        queryTask.execute(query, function(featureSet) {
          var outSR = new esri.SpatialReference({ wkid: 4326 });
          
          function assert(graphics) {
            t.assertEqual(featureSet.features.length, graphics.length);

            var graphic, attributes, field;
            for (var i=0, il=graphics.length; i<il; i++) {
              graphic = graphics[i];
              attributes = graphic.attributes;

              t.assertTrue(graphic.geometry instanceof esri.geometry.Polyline);
              t.assertEqual(featureSet.features[i].geometry.paths.length, graphic.geometry.paths.length);
              t.assertEqual(outSR.wkid, graphic.geometry.spatialReference.wkid);
              
              for (var j=0, jl=fields.length; j<jl; j++) {
                field = fields[j];
                t.assertTrue(graphic.attributes.hasOwnProperty(field));
                t.assertEqual(featureSet.features[i].attributes[field], attributes[field]);
              }
            }

            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.project(featureSet.features, outSR, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "Polygon",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();
        
        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/6");
        var query = new esri.tasks.Query();
        query.returnGeometry = true;
        var fields = (query.outFields = ["AREA", "EZONE"]);
        query.where = "FID = 4";
        
        queryTask.execute(query, function(featureSet) {
          var outSR = new esri.SpatialReference({ wkid: 4326 });
          
          function assert(graphics) {
            t.assertEqual(featureSet.features.length, graphics.length);

            var graphic = graphics[0];
            var attributes = graphic.attributes;
            var field;

            t.assertTrue(graphic.geometry instanceof esri.geometry.Polygon);
            t.assertEqual(featureSet.features[0].geometry.rings.length, graphic.geometry.rings.length);
            t.assertEqual(outSR.wkid, graphic.geometry.spatialReference.wkid);

            for (var i=0, il=fields.length; i<il; i++) {
              field = fields[i];
              t.assertTrue(attributes.hasOwnProperty(field));
              t.assertEqual(featureSet.features[0].attributes[field], attributes[field]);
            }

            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.project(featureSet.features, outSR, assert);
        });
        
        return d;
      }
    },
    
    {
      name: "Multiple Polylgons",
      timeout: 5000,
      runTest: function(t) {
        var d = new doh.Deferred();
        
        var queryTask = new esri.tasks.QueryTask("http://servery/ArcGIS/rest/services/Portland/PortlandMap/MapServer/6");
        var query = new esri.tasks.Query();
        query.returnGeometry = true;
        var fields = (query.outFields = ["AREA", "EZONE"]);
        query.where = "FID = 4 OR FID = 26";
        
        queryTask.execute(query, function(featureSet) {
          var outSR = new esri.SpatialReference({ wkid: 4326 });
          
          function assert(graphics) {
            t.assertEqual(featureSet.features.length, graphics.length);

            var graphic, attributes, field;
            for (var i=0, il=graphics.length; i<il; i++) {
              graphic = graphics[i];
              attributes = graphic.attributes;

              t.assertTrue(graphic.geometry instanceof esri.geometry.Polygon);
              t.assertEqual(featureSet.features[i].geometry.rings.length, graphic.geometry.rings.length);
              t.assertEqual(outSR.wkid, graphic.geometry.spatialReference.wkid);
              
              for (var j=0, jl=fields.length; j<jl; j++) {
                field = fields[j];
                t.assertTrue(graphic.attributes.hasOwnProperty(field));
                t.assertEqual(featureSet.features[i].attributes[field], attributes[field]);
              }
            }

            d.callback(true);
          }

          var gs = new esri.tasks.GeometryService("http://servery/ArcGIS/rest/services/Geometry/GeometryServer");
          gs.project(featureSet.features, outSR, assert);
        });
        
        return d;
      }
    }
  ],
    
  function()//setUp()
  {
    esriConfig.request.proxyUrl = "../../proxy.jsp";
    esriConfig.request.forceProxy = false;    
  },
  
  function()//tearDown
  {
  }
);

/*
            function projectToWebMercator(evt)
            {//102113
                map.graphics.clear();
                var point = evt.mapPoint;
                var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND);
                var graphic = new esri.Graphic(point, symbol);
                var outSR = new esri.SpatialReference(
                    {
                        wkid: 102726 
                    });
                map.graphics.add(graphic);
                
                gs.project([graphic], outSR, function(features)
                {
                    console.log("in gs callback");
                    pt = features[0].geometry;
                    graphic.setInfoTemplate(new esri.InfoTemplate("Coordinates", "<p>&nbsp;X: " + pt.x +
                    "<br/>&nbsp;Y: " +
                    pt.y +
                    "</p>" +
                    "<input type='button' value='Convert back to LatLong' onclick='projectToLatLong();' />" +
                    "<div id='latlong'></div>"));
                    map.infoWindow.setTitle(graphic.getTitle()).setContent(graphic.getContent()).show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
                });
            }
            
            function projectToLatLong()
            {
                // This is a bug - I think Jayant has fixed it. 
                pt.spatialReference = pt.spatialReference.wkid;
                
                var symbol = new esri.symbol.SimpleMarkerSymbol();
                var graphic = new esri.Graphic(pt, symbol);
                var outSR = new esri.SpatialReference(
                    {
                        wkid: 4326
                    });
                
                gs.project([graphic], outSR, function(features)
                {
                    pt = features[0].geometry;
                    dojo.byId("latlong").innerHTML = "&nbsp;Latitude = " + pt.y + "<br/>&nbsp;Longitude = " + pt.x;
                });
            }
 */