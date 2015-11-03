/**
 * Allows you to use [basemaps](http://wiki.openstreetmap.org/wiki/List_of_OSM-based_services) from [OpenStreetMap](http://openstreetmap.org). 
 * Set the [tileservers](#tileServers) property to change which OpenStreetMap tiles you want to use.
 * 
 * An instance of this class is also a [Promise](../guide/working-with-promises/#classes-as-promises).
 * This allows you to execute code once the promise resolves, or when the layer finishes loading its resources. 
 * See [then()](#then) for additional details.
 * 
 * @module esri/layers/OpenStreetMapLayer
 * @since 4.0
 * @see [Sample - OpenStreetMapLayer (2D)](../sample-code/2d/osm2d/)
 * @see [Sample - OpenStreetMapLayer (3D)](../sample-code/3d/osm3d/)
 * @see module:esri/layers/ArcGISTiledLayer
 * @see module:esri/layers/WebTiledLayer
 */
define(
[
  "dojo/_base/lang",

  "../core/declare",

  "../config",
  
  "./WebTiledLayer"
],
function(
  lang,
  declare, 
  config,
  WebTiledLayer
) {

  config.request.corsEnabledServers.push(
    "a.tile.openstreetmap.org",
    "b.tile.openstreetmap.org",
    "c.tile.openstreetmap.org"
  );

  /**
  * @extends module:esri/layers/WebTiledLayer
  * @constructor module:esri/layers/OpenStreetMapLayer
  * @param {Object} properties - See the [properties](#properties) for a list of all the properties
  *                              that may be passed into the constructor.
  */      
  var OpenStreetMapLayer = declare(WebTiledLayer, 
  /** @lends module:esri/layers/OpenStreetMapLayer.prototype */                              
  {
    declaredClass: "esri.layers.OpenStreetMapLayer",
      
    /**
    * @name url
    * @instance
    * @type {string}
    * @ignore 
    */  

    //--------------------------------------------------------------------------
    //
    //  LifeCycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function() {
      return lang.mixin(this.inherited(arguments), {
        urlTemplate: "//${subDomain}.tile.openstreetmap.org/${level}/${col}/${row}.png",
        subDomains: ["a", "b", "c"],
        copyright: "Map data &copy; OpenStreetMap contributors, CC-BY-SA"
      });
    }
    
  });

  return OpenStreetMapLayer;  
});
