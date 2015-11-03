define(
[
  "../../../core/declare",
  "dojo/_base/lang",
  
  "../../../core/Accessor",
  "../../../core/Promise",
  "../../../request",
  "../../../core/urlUtils",
  "../../../tasks/QueryTask"
],
function(
  declare, lang, 
  Accessor, Promise, esriRequest, urlUtils, QueryTask
) {

  var FeatureLayerSource = declare([Accessor, Promise], {

    classMetadata: {
      computed: {
        parsedUrl: ["url"],
        queryTask: ["url", "source", "gdbVersion"]
      }
    },
    
    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    getDefaults: function(properties) {
      var defaults = this.inherited(arguments);
      var layer = properties.layer;
      if (layer) {
        defaults = lang.mixin(defaults, {
          url:             layer.url,
          source:          layer.source,
          gdbVersion:      layer.gdbVersion
        });
      }
      return defaults;
    },
    
    initialize: function() {
      this.addResolvingPromise(this._fetchService());
    },

    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  layer
    //----------------------------------

    /**
     * @todo description
     */    

    //----------------------------------
    //  parsedUrl
    //----------------------------------

    /**
     * @todo description
     */

    _parsedUrlGetter: function() {
      return this.url ? urlUtils.urlToObject(this.url) : null;
    },

    //----------------------------------
    //  queryTask
    //----------------------------------

    /**
     * @todo description
     */

    _queryTaskGetter: function() {
      return new QueryTask({
        url: this.url,
        source: this.source,
        gdbVersion: this.gdbVersion
      });
    },
    
    //----------------------------------
    //  url
    //----------------------------------

    /**
     * @todo description
     */

    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    queryFeatures: function(query) {
      return this.queryTask.execute(query);
    },

    /*queryIds: function(query) {
      return this.queryTask.executeForIds(query);
    },

    queryCount: function(query) {
      return this.queryTask.executeForCount(query);
    },

    queryExtent: function(query) {
      return this.queryTask.executeForExtent(query);
    },

    queryRelatedFeatures: function(query) {
      return this.queryTask.executeRelationshipQuery(query);
    },*/

    /*******************
     * Internal methods
     *******************/

    _fetchService: function() {
      return esriRequest({
        url:               this.parsedUrl.path,
        content:           lang.mixin({ f: "json" }, this.parsedUrl.query),
        handleAs:          "json",
        callbackParamName: "callback"
      }).then(function(response) {
        // Update URL scheme if the response was obtained via HTTPS
        // See esri/request for context regarding "response._ssl"
        if (response._ssl) {
          delete response._ssl;
          this.url = this.url.replace(/^http:/i, "https:");
        }
        this.layerDefinition = response;
      }.bind(this));
    }
    
  });

  return FeatureLayerSource;
});
