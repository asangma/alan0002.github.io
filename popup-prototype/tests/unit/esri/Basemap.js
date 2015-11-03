define([
  "intern!object",
  "intern/chai!assert",
  "esri/Basemap",
  "esri/portal/Portal",
  "esri/portal/PortalItem"
], function(
  registerSuite,
  assert,
  Basemap,
  Portal, PortalItem
) {
  var worldImageryUrl = "//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

  registerSuite({

    name: "esri/Basemap",

    "load": {
      "fromJSON reads properties synchronously": function() {
        var bm = Basemap.fromJSON({
          id: "basemap-id",
          title: "Title"
        });

        assert.equal(bm.id, "basemap-id", "id");
        assert.equal(bm.title, "Title", "title");
      },

      "fromJSON does not create layers": function() {
        var bm = Basemap.fromJSON({
          baseMapLayers: [{
            url: worldImageryUrl
          }]
        });

        assert.equal(bm.baseLayers.length, 0, "baseLayers length");
        assert.equal(bm.referenceLayers.length, 0, "number of reference layers");
        assert.equal(bm.elevationLayers.length, 0, "number of elevation layers");
      },

      "fromJSON resolves when first base layer is loaded": function() {
        var bm = Basemap.fromJSON({
          baseMapLayers: [{
            url: worldImageryUrl
          }]
        });

        return bm.load().then(function() {
          assert.equal(bm.loadStatus, "loaded", "loadStatus");
          assert.equal(bm.baseLayers.length, 1, "number of base layers");

          var bl = bm.baseLayers.getItemAt(0);

          assert.equal(bl.url, "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer", "base layer url");

          assert(bl.isResolved(), "base layer should be resolved");
          assert.equal(bl.loadStatus, "loaded", "base layer should be loaded");

          assert(bm.tileInfo, "tileInfo");
          assert(bm.initialExtent.equals(bl.initialExtent), "initialExtent");
          assert(bm.spatialReference.equals(bl.spatialReference), "spatialReference");

          assert.equal(bm.referenceLayers.length, 0, "number of reference layers");
          assert.equal(bm.elevationLayers.length, 0, "number of elevation layers");
        });
      },

      "fromJSON resolves when first elevation layer is loaded if there are no base layers": function() {
        var bm = Basemap.fromJSON({
          elevationLayers: [{
            id: "globalElevation",
            url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
            layerType: "ArcGISTiledElevationServiceLayer"
          }]
        });

        return bm.load().then(function() {
          assert.equal(bm.loadStatus, "loaded", "loadStatus");
          assert.equal(bm.baseLayers.length, 0, "number of base layers");

          assert.equal(bm.elevationLayers.length, 1, "number of elevation layers");

          var el = bm.elevationLayers.getItemAt(0);
          assert.equal(el.url, "http://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer", "elevation layer url");

          assert(el.isResolved(), "elevation layer should be resolved");
          assert.equal(el.loadStatus, "loaded", "elevation layer should be loaded");

          assert(bm.tileInfo, "tileInfo");
          assert(bm.initialExtent.equals(el.initialExtent), "initialExtent");
          assert(bm.spatialReference.equals(el.spatialReference), "spatialReference");
        });
      },

      "from portalItem resolves when first base layer is loaded": function() {
        var bm = new Basemap({
          portalItem: {
            id: "86de95d4e0244cba80f0fa2c9403a7b2"
          }
        });

        return bm.load().then(function() {
          assert.equal(bm.loadStatus, "loaded", "loadStatus");
          assert.equal(bm.baseLayers.length, 1, "number of base layers");

          var bl = bm.baseLayers.getItemAt(0);

          assert.equal(bl.url, "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer", "base layer url");

          assert(bl.isResolved(), "base layer should be resolved");
          assert.equal(bl.loadStatus, "loaded", "base layer should be loaded");

          assert(bm.tileInfo, "tileInfo");
          assert(bm.initialExtent.equals(bl.initialExtent), "initialExtent");
          assert(bm.spatialReference.equals(bl.spatialReference), "spatialReference");

          assert.equal(bm.referenceLayers.length, 0, "number of reference layers");
          assert.equal(bm.elevationLayers.length, 0, "number of elevation layers");
        });
      }
    }
  });
});
