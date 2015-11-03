/**
 * Mixin for {@link module:esri/Map}.
 *
 * @module esri/BasemapMixin
 * @mixin
 * @since 4.0
 */
define(
[
  "./core/declare",
  "dojo/_base/lang",

  "./core/Accessor",
  "./core/Promise",
  "./Basemap",
  "./basemaps"
],
function(
  declare, lang,
  Accessor, Promise, Basemap, basemaps
) {

  var errors = {
    prefix: "Map.basemap: ",
    unknownBasemap: "Map.basemap: Unable to find basemap definition for: \"{basemapName}\". Try one of these: {list}",
    invalidBasemap: "Map.basemap: Unable to add basemap: \"{basemapName}\"."
  };

  var BasemapMixin = declare([Accessor, Promise],
  /** @lends module:esri/BasemapMixin */
  {
    declaredClass: "esri.BasemapMixin",

    classMetadata: {
      properties: {
        basemap: {
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._basemapCache = {};
    },

    destroy: function() {
      this._basemapCache = {};
    },

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  basemap
    //----------------------------------

    /**
     * Specifies a basemap for the map. The basemap is a set of tiled layers that give
     * geographic context to the {@link module:esri/views/MapView MapView} or
     * {@link module:esri/views/SceneView SceneView} and the other [operational layers](#layers)
     * in the map.
     * 
     * This value can be an instance of {@link module:esri/Basemap Basemap} or one
     * of the strings listed in the table below.
     * 
     * Value | Description
     * ------|------------
     * streets | ![basemap-streets](../assets/img/apiref/basemap/streets.jpg)
     * satellite | ![basemap-satellite](../assets/img/apiref/basemap/satellite.jpg)
     * hybrid | ![basemap-hybrid](../assets/img/apiref/basemap/hybrid.jpg)
     * topo | ![basemap-topo](../assets/img/apiref/basemap/topo.jpg)
     * gray | ![basemap-gray](../assets/img/apiref/basemap/gray.jpg)
     * dark-gray | ![basemap-dark-gray](../assets/img/apiref/basemap/dark-gray.jpg)
     * oceans | ![basemap-oceans](../assets/img/apiref/basemap/oceans.jpg)
     * national-geographic | ![basemap-national-geographic](../assets/img/apiref/basemap/national-geographic.jpg)
     * terrain | ![basemap-terrain](../assets/img/apiref/basemap/terrain.jpg)
     * osm | ![basemap-osm](../assets/img/apiref/basemap/osm.jpg)
     *
     * @type {module:esri/Basemap | string}
     * 
     * @example
     * //Set the basemap in the constructor
     * var map = new Map({
     *   basemap: "streets"
     * });
     * 
     * //Set the basemap after the map instance is created
     * map.basemap = "topo";
     */
    basemap: null,

    _basemapSetter: function(value, oldValue) {
      var cache = this._basemapCache,
          id;
      
      // 1. normalize the input to a JSON Object or typed Basemap
      if (typeof value === "string") {
        // Is the name valid?
        if (!basemaps[value]) {
          // invalid one, print a message in the console
          var available = [], mapName;
          for (mapName in basemaps) {
            if (basemaps.hasOwnProperty(mapName)) {
              available.push(mapName);
            }
          }
          console.log(lang.replace(errors.unknownBasemap, {
            basemapName: value,
            list: available.join(", ")
          }));
          return;
        }

        id = value;

        // ok, valid, do we already have it as a typed Basemap?
        if (cache[id]) {
          value = cache[id];
        }
        else {
          value = Basemap.fromJSON(basemaps[id]);
        }
      }
      else {
        if (value && !(value instanceof Basemap) && value._meta === undefined) {
          // Automatically cast to Basemap instance
          value = new Basemap(value);
        }

        id = value && value.id;
      }

      if (oldValue === value) { return oldValue; }

      return value;
    }

  });

  return BasemapMixin;
});
