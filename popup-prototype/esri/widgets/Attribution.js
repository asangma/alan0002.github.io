/**
 * Displays attribution text for the layers in a map. 
 * The text displayed for the layers is either a list of data providers or sources as defined in the layer's custom attribution data, or the copyright text. 
 * The widget automatically updates based on layer visibility and map extent.
 * The widget displays a single line of attribution that can be expanded with a single click to view all data sources. 
 *
 * @module esri/widgets/Attribution
 * @since 4.0
 * @see [Attribution.css](css/source-code/esri/widgets/Attribution/css/Attribution.css)
 */ 
 define([
  "dojo/_base/event",  
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/kernel",
  "dojo/on",

  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/dom-style",
  "dojo/dom-class",
  "dojo/dom-geometry",
  
  "../core/declare",
  "../core/Collection",
  "../core/lang",

  "../geometry/SpatialReference",
  "../geometry/support/webMercatorUtils",
  "../geometry/Extent",

  "./Widget"
],
function(
  event, lang, array, dojoNS, on,
  domAttr, domConstruct, domStyle, domClass, domGeometry,
  declare, Collection, esriLang,
  SpatialReference, webMercatorUtils, Extent,
  Widget
) {
  /**
   * @extends module:esri/widgets/Widget
   * @constructor module:esri/widgets/Attribution
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                                 that may be passed into the constructor.
   * @param {string} srcNodeRef - Reference or id of the HTML element in which this widget renders. 
   */
  var Attribution = declare([Widget],
  /** @lends module:esri/widgets/Attribution.prototype */  
  {

    //--------------------------------------------------------------------------
    //
    //  Public Properties
    //
    //--------------------------------------------------------------------------
    
    /**
     * declaredClass Description
     * @type {string}
     * @private
     */    
    declaredClass: "esri.widgets.Attribution", 
    
    /**
     * baseClass Description
     * @type {string}
     * @private
     */    
    baseClass: "esri-attribution",
    
    /**
     * Text used to split Attribution by {@link module:esri/layers/Layer Layers}
     * 
     * @type {string}
     */    
    itemDelimiter: " | ",
    
    /**
     * Map Description
     * @type {module:esri/Map}
     * @private
     */    
    map: null,
    
    /**
     * The view in which this widget renders.
     * 
     * @type {module:esri/views/SceneView | module:esri/views/MapView}
     */        
    view: null,
    
    _setViewAttr: function(value) {
      this.view = value;
      this._setupView(value);
    },
    
    /**
     * Span with class: `.esriAttributionList`
     * 
     * @type {HTMLSpanElement}
     */    
    listNode: null,
    
    /**
     * Dictionary of LayerIds and associated DOMNodes
     * 
     * @type {Object}
     * @private
     */        
    itemNodes: {},
    
    /**
     * Dictionary of CSS classes used by this widget.
     * 
     * @type {Object<string,string>}
     */        
    css: {},
    
    /**
     * Default width of the widget (in pixels)
     * 
     * @type {number}
     */     
    maxWidth: 100,
    
    _setMaxWidthAttr: function(value) {
      this.maxWidth = value;
      this._updateMaxWidth(value);
    },
    
    //--------------------------------------------------------------------------
    //
    //  Internal Properties/Variables
    //
    //--------------------------------------------------------------------------
   
    //Array of Event Handlers for the View
    _eventConnections : [],
    
    _attributions: {},
    _pendingDfds: {},
    _activeLayerIds: [], 
    _sharedLayers: [],
    _lastItem: null,
    
    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function(properties, srcNodeRef) {
      
      this.attributionLayerViews = new Collection();
      
      // CSS
      this.css = {
        // Attribution.css
        openClass: "esri-attribution-open",
        listClass: "esri-attribution-list",
        itemClass: "esri-attribution-item",
        lastItemClass: "esri-attribution-last-item",
        delimiterClass: "esri-attribution-delim",
        // common.css
        interactiveClass: "esri-interactive",
        hiddenClass: "esri-hidden"
      };
      
    },
    
    buildRendering: function(){

      this.inherited(arguments);
      
      var structure = "<span class='" + this.css.listClass + "'></span>";
      domAttr.set(this.domNode, "innerHTML", structure);
      this.listNode = dojoNS.query(".esri-attribution-list", this.domNode)[0];
      this.itemNodes = {};

    },
    
    postCreate: function () {

      this.inherited(arguments);
      var view = this.view;
      
      if (view) {
        this._setupView(view);
      }

    },
    
    destroy: function() {
      this.inherited(arguments);

      // Kill Connections
      this._removeEventConnections();
      domConstruct.destroy(this.listNode);
      
      if (this._mapWatcher) {
        this._mapWatcher.remove();
        this._mapWatcher = null;
      }
      
      if(this._viewWatcher){
        this._viewWatcher.remove();
        this._viewWatcher = null;
      }
      
      this.map = this.view = null;      
      
    },
    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------


    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _setupView: function(view) {

      if (!view) {
        return;
      }
      
      this.map = null;
      this.view = view;
      
      if(view.map){
        this.map = view.map;
        this._init();
      }else{
        if (this._mapWatcher) {
          this._mapWatcher.remove();
        }

        this._mapWatcher = view.watch("map", function(evt){
          this.map = evt;
          this._init();
        }.bind(this));
      }
      
    },
    
    _init: function(){

      var map = this.map, 
        view = this.view;
      
      if(!map || !view){
        return;
      }
        
      this._viewWatcher = view.watch("stationary", lang.hitch(this, this._onViewExtentChange));
      
      // View/Map Event Handlers
      this._removeEventConnections(); // Reset
      this._eventConnections = [
        on(view.layerViewsFlat, "change", lang.hitch(this, this._updateLayers)),
        on(this.listNode.parentNode, "click", lang.hitch(this, this._toggleOpenStateHandler))
      ];
      
      // When Map is Loaded...
      // TODO -- try view.then()?
      map.then(lang.hitch(this, function(evt){
        
        // Get current layers from the LayerView
        // --  Filter the data using the hasAttributionData property (boolean)
        var attributionLayerViews = view.layerViewsFlat.map(
          function(lv) {
            return lv;
          }
        ).filter(
          function(view) {
            return view.layer.hasAttributionData || view.layer.copyright || view.layer.copyrightText;
          }
        );
        
        // Update and Parse
        this.set("attributionLayerViews", attributionLayerViews);
        this._parseLayerViews();

      })); // end map.then
    },
    
    // Creates the DOMNode where the Attribution text lives on the map
    _createNode: function(layerId, layerView) {
      
      if (!this.domNode) {
        // Do not create node if there is no UI
        return;
      }
      
      var node,
        map = this.map, 
        view = this.view, 
        extent = view.get("extent"), 
        mapLevel = view.get("zoom") || 1, 
        info = this._attributions[layerId], 
        visible = true, // TODO - Placeholder...
        share = this._checkShareInfo(layerId), 
        sharedWith = share && share.sharedWith,
        sharedNode = sharedWith && this.itemNodes[sharedWith],
        text = (lang.isString(info) ? info : this._getContributorsList(info, extent, mapLevel));

      // If some of the Attributions are shared...
      if (sharedNode) {
        this.itemNodes[layerId] = sharedNode;
        this._toggleItem(sharedNode, visible, share.index);
        
      } else { // Create an attribution node for this layer
        node = (this.itemNodes[layerId] = domConstruct.create("span", {
          "class": this.css.itemClass,
          "innerHTML": text ? (text + this._getDelimiter()) : ""
        }, this.listNode));
        
        // TODO - this is currently always true 
        if (visible) {
          this._setLastItem(node);
        }else{
          domClass.add(node, this.css.hiddenClass);
        }
      }
      
      // Update CSS
      this._adjustCursorStyle();
    },
    
    
    //--------------------------------------------------------------------------
    //
    //  Data Management 
    //
    //--------------------------------------------------------------------------
    
    _checkShareInfo: function(layerId) {
      var attributions = this._attributions, info, i, found = -1,
          searchInfo = attributions[layerId], sharedWith;
      
      if (searchInfo && lang.isString(searchInfo)) {
        for (i in attributions) {
          info = attributions[i];
          
          // Does layerId have copyright text that is a duplicate of 
          // another layer's text that we already know of?
          if (i !== layerId && info && lang.isString(info)) {
            if (info.length === searchInfo.length && info.toLowerCase() === searchInfo.toLowerCase()) {
              sharedWith = i;
              break;
            }
          }
        }
        
        var sharedLayers = this._sharedLayers, len = sharedLayers.length, group;
        
        if (sharedWith) {
          for (i = 0; i < len; i++) {
            group = sharedLayers[i];
            
            // Is the original already part of a group?
            // If so, add this layerId to that group
            if (array.indexOf(group, sharedWith) !== -1) {
              found = i;
              group.push(layerId);
              break;
            }
          }
          
          // Create a new group
          if (found === -1) {
            found = sharedLayers.push([ sharedWith, layerId ]) - 1;
          }
        }
      }
      
      return (found > -1) ? { 
        index: found,
        sharedWith: sharedWith
      } : null;
    },
    
    _getGroupIndex: function(layerId) {
      var sharedLayers = this._sharedLayers, i, len = sharedLayers.length,
          found = -1;
      
      for (i = 0; i < len; i++) {
        if (array.indexOf(sharedLayers[i], layerId) !== -1) {
          found = i;
          break;
        }
      }
      
      return found;
    },
    
    _createIndexByLevel: function(attributionData, bingLevelFix) {
      
      // bingLevelFix will be true for VETiledLayer
      var contributors = attributionData.contributors, contributor, areas, area,
        i, ilen = contributors ? contributors.length : 0,
        j, jlen, z, sr = SpatialReference.WGS84,
        retVal = {}, feature, bbox;
      
      for (i = 0; i < ilen; i++) {
        contributor = contributors[i];
        areas = contributor.coverageAreas;
        jlen = areas ? areas.length : 0;
        
        for (j = 0; j < jlen; j++) {
          area = areas[j];
          bbox = area.bbox;
          
          // TODO
          // Do we need to create a graphic instance here?
          feature = {
            // bbox array order: ymin, xmin, ymax, xmax
            // We have this order to match bing imageryProviders format
            extent: webMercatorUtils.geographicToWebMercator(
              new Extent(bbox[1], bbox[0], bbox[3], bbox[2], sr)
            ),

            // TODO
            // Do we need a separate attributes object for the properties below?
            attribution: contributor.attribution || "",
            // NOTE
            // Need to subtract 1 from min and max zoom level because Map
            // normally rewrites LOD.Level with the LOD's index in the LODS
            // array (why?). So, map level 0 means level ID 1 for bing layer
            // Let's fix the level here.
            zoomMin: area.zoomMin - ((bingLevelFix && area.zoomMin) ? 1 : 0),
            zoomMax: area.zoomMax - ((bingLevelFix && area.zoomMax) ? 1 : 0),
            score: esriLang.isDefined(area.score) ? area.score : 100,
            objectId: i
          };
          
          for (z = feature.zoomMin; z <= feature.zoomMax; z++) {
            retVal[z] = retVal[z] || [];
            retVal[z].push(feature);
          }
        }
      }
      return retVal;
    },
    
    _getContributorsList: function(contributorsIndex, extent, mapLevel) {
      
      var list = "";
      // NOTE: mapLevel in 4.x can be decimal... round for now
      mapLevel = Math.round(mapLevel);
      // Round mapLevel down to guarantee Attributions based on the largest available key #2115 
      mapLevel = Math.min(contributorsIndex.maxKey, mapLevel);
      
      if (extent && esriLang.isDefined(mapLevel) && mapLevel > -1) {

        var contributors = contributorsIndex[mapLevel], contributor,
          mapCenter = extent.get("center").normalize(),
          i, ilen = contributors ? contributors.length : 0,
          match = [], seen = {};

        // Get contributors with matching extent
        for (i = 0; i < ilen; i++) {
          contributor = contributors[i];

          // Add Contribution to match array if the following criteria are met:
          // -- Check if contributor is already accounted for in the seen{} dictionary
          // -- Check if map (view) center is within the contributor extent
          if (!seen[contributor.objectId] && contributor.extent.contains(mapCenter)) {
            seen[contributor.objectId] = 1;
            match.push(contributor);
          }
        }

        // Sort by descending order of score
        // -- High score before low score 
        // -- Lower id before higher id 
        match.sort(function(a, b) {
          return (b.score - a.score) || (a.objectId - b.objectId);
        });
        
        // Extract Contributor Names
        ilen = match.length;
        for (i = 0; i < ilen; i++) {
          match[i] = match[i].attribution;
        }
        
        // Combine the Contributors Array
        list = match.join(", ");
      }
      
      return list;
    },
    
    //--------------------------------------------------------------------------
    //
    //  UI Logic
    //
    //--------------------------------------------------------------------------
    
    // Styling the cursor based on widgets 'Open' state
    _adjustCursorStyle: function () {
      
      var node = this.listNode.parentNode,
        height = domGeometry.position(node, true).h;
      
      if (domClass.contains(node, this.css.openClass)){
        domClass.remove(node, this.css.openClass);
        // -- If collapsing the attribution widget results in a small height, that should be click-able
        if (height > domGeometry.position(node, true).h){
          domClass.add(node, [this.css.interactiveClass, this.css.openClass]);
        } else {
          domClass.remove(node, this.css.interactiveClass);
        }
      } else {
        domClass.add(node, this.css.openClass);
        // -- If expanding the attribution widget results in a larger height, that should be click-able
        if (height < domGeometry.position(node, true).h){
          domClass.add(node, this.css.interactiveClass);
        } else {
          domClass.remove(node, this.css.interactiveClass);
        }
        domClass.remove(node, this.css.openClass);
      }
    },
    
    // Toggles the Attribution widget 'Open'
    // -- scrollWidth must be greater than clientWidth
    _toggleOpenState: function(){
      var node = this.listNode.parentNode;
      // -- If Attribution is already expanded, close it
      if (domClass.contains(node, this.css.openClass)){
        domClass.remove(node, this.css.openClass);
      } else if (node.scrollWidth > node.clientWidth){
        // -- Only expand when there is more content than what the user sees
        domClass.add(node, this.css.openClass);
      }
    },
    
    // Toggles the visibility of an Attribution snippet
    // -- Directly tied to group visibility (if applicable) 
    _toggleItem: function(node, visible, groupIndex) {
      // If this node is shared, then hide it only when all shared layers are hidden too
      if (groupIndex > -1 && !visible) {
        var group = this._sharedLayers[groupIndex], i, len = group.length,
          activeLayers = this._activeLayerIds;
        
        // At least one of the sharing layers is still active so we cannot hide this node
        for (i = 0; i < len; i++) {
          if (array.indexOf(activeLayers, group[i]) !== -1) {
            return;
          }
        }
      }
      // Update UX
      if(visible){
        domClass.remove(node, this.css.hiddenClass);
      }else{
        domClass.add(node, this.css.hiddenClass);
      }
      this._updateLastItem();
    },
    
    // Find and update the last visible item node in the list
    _updateLastItem: function() {
      var children = this.listNode.childNodes, 
        i, len = children.length, child;

      if (len) {
        for (i = len - 1; i >= 0; i--) {
          child = children[i];
          
          if (!domClass.contains(child, this.css.hiddenClass)) {
            this._setLastItem(child);          
            break;
          }
        }
      }
      this._adjustCursorStyle();
    },
    
    // Last attribution item in the list will not display the delimiter
    _setLastItem: function(node) {
      
      var itemClass = this.css.itemClass, 
        lastItemClass = this.css.lastItemClass;
      
      if (this._lastItem) {
        domClass.replace(this._lastItem, itemClass, lastItemClass);
      }

      if (node) {
        domClass.replace(node, lastItemClass, itemClass);
        this._lastItem = node;
      }
    },
    
    // Returns the delimiter for Attribution string generation 
    _getDelimiter: function() {
      var delim = this.itemDelimiter;
      return delim ? ("<span class='" + this.css.delimiterClass + "'>" + delim + "</span>") : "";
    },
    
    //--------------------------------------------------------------------------
    //
    //  Internal Event Logic
    //
    //--------------------------------------------------------------------------
    
    _updateMaxWidth: function(value){
      domStyle.set(this.listNode.parentNode, "max-width", Math.floor(value) + "px");
      this._adjustCursorStyle();
    },
    
    _updateAttribution: function(evt) {
      //console.log("Attribution Updated...");
    },
    
    _toggleOpenStateHandler: function(e){
      event.stop(e);
      this._toggleOpenState();
    },

    _setAttributionLayerViewsAttr: function(col) {
      this._set("attributionLayerViews" , col);
      col.on("change", lang.hitch(this, this._updateAttribution));
    },
    
    _parseLayerViews: function(){
      array.forEach(this.attributionLayerViews.items, lang.hitch(this, function(lv){
        this._onLayerAdd(lv);
      }));
    },
    
    _removeEventConnections: function(){
      array.forEach(this._eventConnections, lang.hitch(this, function(conn){
        conn.remove();
      }));
      this._eventConnections = [];
    },
    
    _onAttributionLoad: function(self, layerView, response) {

      var attributions = self._attributions,
        layer = layerView.layer,
        dfds = self._pendingDfds, 
        layerId = layer.id,
        layerViewId = layerView.id;
          
      if (!dfds || !dfds[layerId]) {
        // We're not interested in this layer/attribution anymore
        // Can happen when this widget is destroyed or the layer
        // is removed from map before attribution data can be loaded.
        return;
      }
      
      delete dfds[layerId];
      delete dfds[layerViewId];
      
      if (!response || response instanceof Error) {
        response = "";
      }
      
      if (response) {
        attributions[layerViewId] = self._createIndexByLevel(
          response, 
          layer.declaredClass.toLowerCase().indexOf("vetiledlayer") !== -1
        );
      }
      else {
        attributions[layerViewId] = layer.copyright || layer.copyrightText || "";
      }

      if (attributions[layerViewId]) {
        if (!layerView.suspended) {
          self._activeLayerIds.push(layerViewId);
          
          // Get the key values to find the 'closest/max' 
          var keys = Object.keys(attributions[layerViewId]).map(function (key) {
            return Number(key); // Convert the keys from string for Math 
          });
          
          // Save the max as a property of self._attributions
          attributions[layerViewId].maxKey = Math.max.apply(Math, keys);
          
        }

        self._createNode(layerViewId, layerView);
      }
      else {
        // No attribution data and no copyright - just ignore this layer
        self._onLayerRemove(layerView);
      }
      
    },    
    
    _updateLayers: function(evt) {
      
      var added = array.filter(evt.added, function(lv) { 
        return lv.layer.hasAttributionData || lv.layer.copyright || lv.layer.copyrightText;
      });
      
      added = array.map(added, lang.hitch(this, function(lv) { 
        this._eventConnections.push(lv.watch("suspended", lang.hitch(this, this._onLayerToggle)));
        this._onLayerAdd(lv);
        return lv; 
      }));
      this.attributionLayerViews.addItems(added);

      var removed = array.map(evt.removed, lang.hitch(this, function(lv) { 
        this._onLayerRemove(lv);
        return lv; 
      }));
      this.attributionLayerViews.removeItems(removed);
    },
    
    _onLayerAdd: function(layerView) {
      
      var addedLayer = layerView.layer,
        layerViewId = layerView.id,
        layerId = addedLayer.id,      
        attributions = this._attributions;

      try {

        if (esriLang.isDefined(attributions[layerId]) || esriLang.isDefined(attributions[layerViewId]) || !addedLayer.showAttribution) {
          return;
        }
        
        if (addedLayer.hasAttributionData) {
        
          var dfd = addedLayer.getAttributionData();
          this._pendingDfds[layerId] = 1;
          attributions[layerViewId] = dfd;
          dfd.then(lang.partial(this._onAttributionLoad, this, layerView));

        } else {
        
          // Attempt to Update attributions[] with copyright text
          attributions[layerViewId] = addedLayer.copyright || addedLayer.copyrightText || "";
          
          if (attributions[layerViewId]) {
            // Make sure the LayerView is not suspended
            if (!layerView.suspended) {
              this._activeLayerIds.push(layerViewId);
            }
            // Create the Text
            this._createNode(layerViewId, layerView);
          }
          else {
            // No attribution data, No copyright - just ignore this layer
            this._onLayerRemove(layerView);
          }
        }
        // TODO -- If VETiledLayer, connect to onMapStyleChange event
      } catch (err) {
        //console.log("Attribution: _onLayerAdd");
      }
    },

    _onLayerRemove: function(layerView) {
      
      var layerId = layerView.id, 
        nodes = this.itemNodes, 
        idx, idx2 = -1;
      
      try {

        // Force Toggle 
        this._onLayerToggle(true, false, "suspended", layerView);
        
        // Remove Attribution and Deferred references
        delete this._attributions[layerId];
        delete this._pendingDfds[layerId];

        idx = this._getGroupIndex(layerId);
        if (idx !== -1) {
          idx2 = array.indexOf(this._sharedLayers[idx], layerId);
          
          if (idx2 !== -1) {
            this._sharedLayers[idx].splice(idx2, 1);
            
            // One layer doesn't make a group
            if (this._sharedLayers[idx].length <= 1) {
              this._sharedLayers.splice(idx, 1);
            }
          }
        }
        
        if (nodes[layerId] && idx2 === -1) {
          domConstruct.destroy(nodes[layerId]);
        }

        delete nodes[layerId];
        
        // Update the separator
        this._updateLastItem();
      }
      catch (err) {
       //console.log("Attribution: _onLayerRemove");
      }
    },
    
    _onLayerToggle: function(isSuspended, wasSuspended, name, layerView) {

      var layerId = layerView.id,
        info = this._attributions[layerId],
        node = this.itemNodes[layerId],
        view = this.view,
        extent = view.get("extent"),
        zoom = view.get("zoom");

      // Show Attribution for Applicable Contributors
      if(!isSuspended){
      
        if (info) { // do we know about this layer?
          if (array.indexOf(this._activeLayerIds, layerId) === -1) {
            this._activeLayerIds.push(layerId);
          }
            
          if (node) {
            var text = lang.isString(info) ? info : this._getContributorsList(info, extent, zoom);
            // No need to update layers that just have copyright
            if (!lang.isString(info)) {
              domAttr.set(node, "innerHTML", (text ? (text + this._getDelimiter()) : ""));
            }

            if (text) {
              this._toggleItem(node, true, this._getGroupIndex(layerId));
            }
          }
        }
            
      }else{ // Hide Attribution while Layer is suspended
      
        if (this._attributions[layerId]) { // do we know about this layer?
          
          var idx = array.indexOf(this._activeLayerIds, layerId);
          node = this.itemNodes[layerId];

          if (idx !== -1) {
            this._activeLayerIds.splice(idx, 1);
          }
            
          if (node) {
            this._toggleItem(node, false, this._getGroupIndex(layerId));
          }
        }
        
      }
    },

    // Updates the Attribution String when view has changed
    _onViewExtentChange: function(newVal, oldVal, name, target){
      if (newVal) {
        var layerIds = this._activeLayerIds,
          attributions = this._attributions,
          nodes = this.itemNodes,
          len = layerIds.length || 0,
          i,
          layerId,
          info,
          node;

        for (i = 0; i < len; i++) {
          layerId = layerIds[i];
          info = attributions[layerId];
          node = nodes[layerId];

          if (node && !lang.isString(info)) {
            var text = this._getContributorsList(info, target.get("extent"), target.get("zoom"));
            domAttr.set(node, "innerHTML", (text ? (text + this._getDelimiter()) : ""));
            this._toggleItem(node, !!text, -1);
          }
        }
      }
      this._adjustCursorStyle();
    }
  });

  return Attribution;

});
