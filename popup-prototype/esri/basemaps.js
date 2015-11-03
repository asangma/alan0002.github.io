define([
  "require",

  "dojo/i18n!./nls/jsapi"
],
function(
  require,
  nls
) {

  var defaultElevation = {
    id: "globalElevation",		
    url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",		
    layerType: "ArcGISTiledElevationServiceLayer",		
    showLegend: false		
  };

  var basemaps = {
    /*
       {
         title:        "<String>",
         thumbnailUrl: "<String>" // Not in WebMap, but BasemapGallery?
         itemId:       "<String>" // Not in WebMap, but BasemapGallery?
         baseMapLayers: [
           {
             id:            "<String>",
             url:           "<String>",
             type:          "<String>", // OpenStreetMap, BingMapsHybrid, BingMapsRoad, BingMapsAerial
             opacity:       <Number>,
             visibility:    <Boolean>,
             isReference:   <Boolean>,
             itemId:        "<String>", // Not supported
             displayLevels: <Number[]>, // Not supported
             showLegend:    <Boolean>,  // Not supported

             // Not in WebMap, but BasemapGallery?
             bandIds:       <Number[]>, // Not supported
             visibleLayers: <Number[]>  // Not supported
           }
         ]
       }
      */

    "streets": {
      id: "streets",
      title: nls.basemaps.streets,
      thumbnailUrl: require.toUrl("./images/basemap/streets.jpg"),
      itemId: "d8855ee4d3d74413babfb0f41203b168",
      baseMapLayers: [{
        url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
        showLegend: false
      }],
      elevationLayers: [defaultElevation]
    },

    "satellite": {
      id: "satellite",
      title: nls.basemaps.satellite,
      thumbnailUrl: require.toUrl("./images/basemap/satellite.jpg"),
      itemId: "86de95d4e0244cba80f0fa2c9403a7b2",
      baseMapLayers: [{
        url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
        showLegend: false
      }],
      elevationLayers: [defaultElevation]
    },

    "hybrid": {
      id: "hybrid",
      title: nls.basemaps.hybrid,
      thumbnailUrl: require.toUrl("./images/basemap/hybrid.jpg"),
      itemId: "413fd05bbd7342f5991d5ec96f4f8b18",
      baseMapLayers: [{
        url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
        showLegend: false
      }, {
        url: "//services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer",
        isReference: true,
        showLegend: false
      }],
      elevationLayers: [defaultElevation]
    },

    "terrain": {
      id: "terrain",
      title: nls.basemaps.terrain,
      thumbnailUrl: require.toUrl("./images/basemap/terrain.jpg"),
      itemId: "aab054ab883c4a4094c72e949566ad40",
      baseMapLayers: [{
        url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer",
        showLegend: false
      }, {
        url: "//services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer",
        isReference: true,
        showLegend: false
      }],
      elevationLayers: [defaultElevation]
    },

    "topo": {
      id: "topo",
      title: nls.basemaps.topo,
      thumbnailUrl: require.toUrl("./images/basemap/topo.jpg"),
      itemId: "6e03e8c26aad4b9c92a87c1063ddb0e3",
      baseMapLayers: [{
        url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer",
        showLegend: false
      }],
      elevationLayers: [defaultElevation]
    },

    "gray": {
      id: "gray",
      title: nls.basemaps.gray,
      thumbnailUrl: require.toUrl("./images/basemap/gray.jpg"),
      itemId: "8b3b470883a744aeb60e5fff0a319ce7",
      baseMapLayers: [{
        url: "//services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer",
        showLegend: false
      }, {
        url: "//services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer",
        isReference: true,
        showLegend: false
      }],
      elevationLayers: [defaultElevation]
    },

    "dark-gray": {
      id: "dark-gray",
      title: nls.basemaps["dark-gray"],
      thumbnailUrl: require.toUrl("./images/basemap/dark-gray.jpg"),
      itemId: "da65bacab5bd4defb576f839b6b28098",
      baseMapLayers: [{
        url: "//services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer",
        showLegend: false
      }, {
        url: "//services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer",
        isReference: true,
        showLegend: false
      }],
      elevationLayers: [defaultElevation]
    },

    "oceans": {
      id: "oceans",
      title: nls.basemaps.oceans,
      thumbnailUrl: require.toUrl("./images/basemap/oceans.jpg"),
      itemId: "48b8cec7ebf04b5fbdcaf70d09daff21",
      baseMapLayers: [{
        url: "//services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer",
        showLegend: false
      }, {
        url: "//services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer",
        isReference: true,
        showLegend: false
      }],
      elevationLayers: [defaultElevation]
    },

    "national-geographic": {
      id: "national-geographic",
      title: nls.basemaps["national-geographic"],
      thumbnailUrl: require.toUrl("./images/basemap/national-geographic.jpg"),
      itemId: "509e2d6b034246d692a461724ae2d62c",
      baseMapLayers: [{
        url: "//services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer",
        showLegend: false
      }],
      elevationLayers: [defaultElevation]
    },

    "osm": {
      id: "osm",
      title: nls.basemaps.osm,
      thumbnailUrl: require.toUrl("./images/basemap/osm.jpg"),
      itemId: "5d2bfa736f8448b3a1708e1f6be23eed",
      baseMapLayers: [{
        layerType: "OpenStreetMap",
        showLegend: false
      }],
      elevationLayers: [defaultElevation]
    },

    "vector-streets": {
      id: "vector-streets",
      title: "Vector Streets",
      thumbnailUrl: require.toUrl("./images/basemap/streets.jpg"),
      baseMapLayers: [{
        id: "vector-streets",
        layerType: "VectorTiledLayer",
        url: "//basemapsbeta.arcgis.com/arcgis/rest/services/World_Basemap/VectorTileServer",
        showLegend: false
      }]
    },

    "vector-streets-night": {
      id: "vector-streets-night",
      title: "Vector Streets Night",
      thumbnailUrl: require.toUrl("./images/basemap/streets.jpg"),
      baseMapLayers: [{
        id: "vector-streets-night",
        layerType: "VectorTiledLayer",
        url: "//basemapsbeta.arcgis.com/arcgis/rest/services/World_Basemap/VectorTileServer",
        styleUrl: "//basemapsbeta.arcgis.com/preview/styles/StreetMapNight/data.json",
        showLegend: false
      }]
    },

    "vector-streets-relief": {
      id: "vector-streets-relief",
      title: "Vector Streets Relief",
      thumbnailUrl: require.toUrl("./images/basemap/streets.jpg"),
      baseMapLayers: [{
        id: "hillshade",
        url: "//services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer ",
        showLegend: false
      },
      {
        id: "vector-streets-relief",
        layerType: "VectorTiledLayer",
        url: "//basemapsbeta.arcgis.com/arcgis/rest/services/World_Basemap/VectorTileServer",
        styleUrl: "//basemapsbeta.arcgis.com/preview/styles/StreetMapRelief/data.json",
        showLegend: false
      }]
    },

    "vector-streets-mobile": {
      id: "vector-streets-mobile",
      title: "Vector Streets Mobile",
      thumbnailUrl: require.toUrl("./images/basemap/streets.jpg"),
      baseMapLayers: [{
        id: "vector-streets-mobile",
        layerType: "VectorTiledLayer",
        url: "//basemapsbeta.arcgis.com/arcgis/rest/services/World_Basemap/VectorTileServer",
        styleUrl: "//basemapsbeta.arcgis.com/preview/styles/StreetMapMobile/data.json",
        showLegend: false
      }]
    },

    "vector-canvas-light": {
      id: "vector-canvas-light",
      title: "Vector Light Canvas",
      thumbnailUrl: require.toUrl("./images/basemap/gray.jpg"),
      baseMapLayers: [{
        id: "vector-canvas-light",
        layerType: "VectorTiledLayer",
        url: "//basemapsbeta.arcgis.com/arcgis/rest/services/World_Basemap/VectorTileServer",
        styleUrl: "//basemapsbeta.arcgis.com/preview/styles/CanvasLight/data.json",
        showLegend: false
      }]
    },

    "vector-canvas-dark": {
      id: "vector-canvas-dark",
      title: "Vector Dark Canvas",
      thumbnailUrl: require.toUrl("./images/basemap/dark-gray.jpg"),
      baseMapLayers: [{
        id: "vector-canvas-dark",
        layerType: "VectorTiledLayer",
        url: "//basemapsbeta.arcgis.com/arcgis/rest/services/World_Basemap/VectorTileServer",
        styleUrl: "//basemapsbeta.arcgis.com/preview/styles/CanvasDark/data.json",
        showLegend: false
      }]
    }
  };

  return basemaps;
});
