define(
[
  "require", 
  "../../core/declare",
  "dojo/_base/lang", 
  "dojo/_base/connect",
  "dojo/_base/array",
  "dojo/_base/kernel",

  "dojo/has",
  "dojo/query",
  "dojo/sniff", 
  "dojo/dom-class", 
  "dojo/dom-construct", 
  "dojo/dom-geometry", 
  "dojo/dom-style", 

  "dijit/_Widget",
  "dijit/_Templated",

  "dojo/data/ItemFileReadStore",
  "dojox/grid/DataGrid",
  "dojox/gfx",

  "../../layers/FeatureLayer",
  "../../symbols/PictureMarkerSymbol",
  "./TemplatePickerItem",

  "../../kernel",
  "../../core/lang",
  "../../request",
  "../Widget",

  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/TemplatePicker.html"
], function(
  require, declare, lang, connect, array, dojoNS,
  has, query, sniff, domClass, domConstruct, domGeometry, domStyle,
  _Widget, _Templated,
  ItemFileReadStore, DataGrid, gfx,
  FeatureLayer, PictureMarkerSymbol, TemplatePickerItem,
  esriKernel, esriLang, esriRequest, Widget,
  jsapiBundle, widgetTemplate
) {

// TODO
// IE - left border for selection is not visible for some cells
// There are some issues with rendered width of the widget in Safari and Firefox on Linux
// Collapsible groups
// Ability/API to Add/Remove/Update templates
// Add a "view" option which can be "grid" or "list"
// [DONE] Automatically set the width of the widget? 
// [DONE] Polyline template - use a straight line across instead of zig-zag

/******************
 * CSS class names
 ******************
 *  templatePicker
 *    grid
 *    groupLabel
 *    item
 *    itemLabel
 *    itemSymbol
 *    selectedItem
 *    tooltip
 ******************/

 /************************
 * Template Picker Dijit
 ************************/

  var TP = declare([ Widget, _Widget, _Templated], {
    declaredClass: "esri.widgets.editing.TemplatePicker",

    // Let the dijit framework know that the template for this dijit 
    // uses other dijits such as BorderContainer, StackContainer, Grid etc
    widgetsInTemplate: true,
    
    // Let the dijit framework know the location of the template file where
    // the UI for this dijit is defined 
    // templatePath: dojo.moduleUrl("esri.widgets.editing", "templates/TemplatePicker.html"),
    templateString: widgetTemplate,
    
    // Path to the folder containing the resources used by this dijit.
    // This can be used to refer to images in the template or other
    // resources
    // basePath: dojo.moduleUrl("esri.widgets.editing"),
    basePath: require.toUrl(".") + "/",
    
    /********************
     * Public properties
     ********************/
    
    featureLayers: null,
    
    items: null, // [ { label: <String>, symbol: <esri.symbol.Symbol>, description: <String> } ];
    
    grouping: true,
    
    // groupLabelFunction: undefined
    // See: _cellGetGroup function
    
    showTooltip: false,
    
    maxLabelLength: 0,
    
    rows: 4,
    
    _rows: 0,
    
    columns: 3,
    
    surfaceWidth: 30, // in pixels
    
    surfaceHeight: 30, // in pixels
    
    emptyMessage: "", // passed on to grid as noDataMessage. See TemplatePicker.html
    
    useLegend: true,
    
    legendCache: {}, // intended as static member of this class
    
    // Implicit public properties: grid, tooltip
    
    /**********************
     * Internal Properties
     **********************/
    
    _uniqueId: { id: 0 },
    
    _assumedCellWidth: 90, // in pixels
    
    _initialAutoWidth: 300, // in pixels
    
    _initialAutoHeight: 200, // in pixels
    
    _ieTimer: 150, // milliseconds
    
    /*************
     * Overrides
     *************/
    
    // This section provides implementation for some of the extension points
    // (methods) exposed by the dijit framework. See the following document
    // for more information about a dijit's life-cycle and when these methods
    // are called, see:
    // http://docs.dojocampus.org/dijit/_Widget#lifecycle
    
    constructor: function(params, srcNodeRef) {
      params = params || {};
      if (!params.items && !params.featureLayers) {
        console.error("TemplatePicker: please provide 'featureLayers' or 'items' parameter in the constructor");
      }
      this._dojo14x = (dojoNS.version.minor >= 4); // 1.4.0 or later
      this._itemWidgets = {};
      
      // We still need to do this here because the implicit _setXXAttr methods
      // are called after "buildRendering" phase and before "startup" is called.
      // But we preprocess in "postMixInProperties" where we need sane _flChanged
      if (params.featureLayers && params.featureLayers.length) {
        this._flChanged = 1;
      }
      
      // this._nls = dojo.getObject("bundle.widgets.templatePicker", false, esri);
      this._nls = jsapiBundle.widgets.templatePicker;
      
      // passed on to grid as noDataMessage. See TemplatePicker.html
      this.emptyMessage = params.emptyMessage || 
                          (this._nls && this._nls.creationDisabled) ||
                          "";
    },
    
    postMixInProperties: function() {
      this.inherited(arguments);
      
      // pre-processing of the input data
      this._preprocess();
    },

    startup: function() {
      // overriding methods typically call their implementation up the inheritance chain
      this.inherited(arguments);
      
      if (this.rows === "auto" && this.columns === "auto") {
        var box = domGeometry.getContentBox(this.domNode);
        if (!box.w) {
          this.domNode.style.width = this._initialAutoWidth + "px";
        }
        if (!box.h) {
          this.domNode.style.height = this._initialAutoHeight + "px";
        }
        box = domGeometry.getContentBox(this.domNode);
        this._columns = Math.floor( box.w / this._assumedCellWidth ) || 1;
      }
      
      this._applyGridPatches();
      this._setGridLayout();

      // event handlers for the grid
      connect.connect(this.grid, "onRowClick", this, this._rowClicked);
      
      this._setGridData();
      
  //    if (this.rows === "auto" && this.columns === "auto") {
  //      this.grid._resize();
  //    }
      
      this._toggleTooltip();
      
      if ( has("ie") < 9) {
        this._repaintItems = lang.hitch(this, this._repaintItems);
        setTimeout(this._repaintItems, this._ieTimer);
      }
      //this.inherited(arguments);
    },
    
    destroy: function() {
      //connect.disconnect(this._renderConnect);
      
      this.showTooltip = false;
      this._toggleTooltip();
      this._clearLegendInfo();
      
      this.featureLayers = this.items =  this.grid =  
      this._flItems = this._itItems = this._groupRowIndices = 
      this._selectedCell = this._selectedInfo = this._selectedItem = null; //this._renderConnect = null;
      
      this.inherited(arguments);
    },
    
    /*****************
     * Public Methods
     *****************/
    
    getSelected: function() {
      return this._selectedCell ? this._selectedItem : null;
    },
    
    clearSelection: function() {
      var cellNode = this._selectedCell, info = this._selectedInfo;
      if (cellNode) {
        // fake a row click event to clear the selection
        this._rowClicked({ cellNode: cellNode, rowIndex: info.selRow, cellIndex: info.selCol });
      }
    },
    
    update: function(/*Boolean?*/ resize) {
      var doResize = (this.rows === "auto" && this.columns === "auto" && resize) ? true : false,
          grid = this.grid, box;
      
      if (doResize) {
        var domNode = this.domNode, 
            id = domNode.id, width, item = dojoNS.query("#" + id + ".templatePicker div.item")[0];
        
        box = domGeometry.getContentBox(domNode);
        
        item = item && item.parentNode;
        // No "item" indicates template picker has nothing to show
        
        if (item) {
          width = domGeometry.position(item).w;
        }
        else {
          width = this._assumedCellWidth;
        }
        
        this._columns = Math.floor( ( box.w - grid.views.views[0].getScrollbarWidth() ) / width );
        this._columns = this._columns || 1;
        //grid.render();
        //grid.prerender();
      }
      
      var previous = this._rows;
      this._preprocess();
      var current = this._rows;
      
      this._setGridLayout();
      this._setGridData();
      
      if (current !== previous) {
        //console.log(previous, current);
        grid.set("autoHeight", this._rows, false);
      }
      
      if (doResize) {
        grid._resize({ w: box.w, h: box.h });
        
        // At Dojo 1.4.1, for some reason this node becomes
        // a "block" after resize
        grid.viewsHeaderNode.style.display = "none";
        //grid.adaptWidth(); 
        //grid.adaptHeight();
      }
      else {
        grid.update();
      }
      
      this._toggleTooltip();
      
      // restore selected item
      var self = this, selected = this.getSelected();
      if (selected) {
        grid.store.fetch({
          onComplete: function(its) {
            var found = self._locate(selected, self._selectedInfo, its);
            var cellNode = found && grid.views.views[0].getCellNode(found[0], found[1]);
            if (cellNode) {
              // fake a row click event to restore the selection
              self._rowClicked({ cellNode: cellNode, rowIndex: found[0], cellIndex: found[1] }, true);
            }
            
          }
        });
      }

      if ( has("ie") < 9) {
        setTimeout(this._repaintItems, this._ieTimer);
      }
      
      // This is typically done automatically by setting noDataMessage property
      // of the grid (see constrcutor and template html). However when grouping
      // is disabled, grid has a stray row (grid.rowCount is 1) and hence prevents
      // display of emptyMessage.
      // Let's handle it here
      var layers = this.featureLayers, items = this.items;
      if (
        (!layers || !layers.length) &&
        (!items || !items.length) && 
        grid && this.emptyMessage
      ) {
        grid.showMessage(this.emptyMessage);
      }
    },
    
    /*********
     * Events
     *********/
    _eventMap: {
      "selection-change": true
    },
    onSelectionChange: function() {},
    
    /*****************
     * Setter Methods
     *****************/
    
    _setUseLegendAttr: function(use) {
      var previous = this.useLegend;
      //console.log("[ _setUseLegendAttr ] ", previous, use);
      
      if (!this._started || previous !== use) {
        if (use) {
          this._flChanged = 1;
        }
        else {
          this._clearLegendInfo();
        }
      }

      this.useLegend = use;
    },
    
    _setFeatureLayersAttr: function(layers) {
      var previous = this.featureLayers;
      //console.log("[ _setFeatureLayersAttr ] ", previous, layers);

      if (!this._started || previous !== layers) {
        this._flChanged = 1;
      }
      
      this.featureLayers = layers;
    },
    
    /*******************
     * Internal Methods
     *******************/
    _adjustRowsCols : function(items){
      if (this.rows === "auto" && this.columns === "auto") {
        if (!this._started) {
          this._rows = false;
          this._columns = null;
          this._autoWidth = false;
        }
        return;
      }

      // adjust rows and columns
      var len = 0;
      this._rows = this.rows;
      this._columns = this.columns;
      if (this.rows === "auto") {
        
        if (this.featureLayers) {
          if (this.grouping) {
            len = items.length;
            array.forEach(items, function(subItems) {
              len += Math.ceil(subItems.length / this.columns);
            }, this);
          }
          else {
            array.forEach(items, function(subItems) {
              len += subItems.length;
            }, this);
            len = Math.ceil(len / this.columns);
          }
        }
        else {
          len = Math.ceil(items.length / this.columns);
        }

        this._rows = len; // used in the template
      }
      else if (this.columns === "auto") {

        if (this.featureLayers) {
          if (this.grouping) {
            // TODO
            // what does this layout even mean? (Not supported)
            len = 3;
          }
          else {
            array.forEach(items, function(subItems) {
              len += subItems.length;
            }, this);
            len = Math.ceil(len / this.rows);
          }
        }
        else {
          len = Math.ceil(items.length / this.rows);
        }
        
        this._columns = len;
      }
    },
    
    _preprocess: function() {
      if (this.items) {
        // grouping not supported for 'items'
        this.grouping = false;
      }
      
      this._autoWidth = false;
      if (this.rows === "auto" || this.columns === "auto") {
        this._autoWidth = true;  // used in the template
      }      

      var items;
      if (this.featureLayers) {
        // Handles the case where some feature layer added in "selection-only"
        // mode where the features are actually rendered using a dynamic map
        // service layer
        if (this.useLegend && this._flChanged) {
          // This array contains the indices of "this.featureLayers" array.
          // Indicates these layers should use the legend symbols instead 
          // of the renderer returned by the feature layer resource
          this._legendIndices = [];
          
          // This array contains the indices of "this.featureLayers" array.
          // Indicates outstanding legend request for these layers
          this._loadingIndices = [];
          
          // A dictionary that maps an index of "this.featureLayers" array
          // to a dictionary that maps a "value" to its symbol info object 
          // obtained from legend response
          this._legendSymbols = {};
          
          this._ignoreLegends();
          this._loadingLegends = [];
          
          clearTimeout(this._legendTimer);
          this._legendTimer = null;
          
          this._processSelectionLayers();

          // We've processed "this.featureLayers". Not dirty anymore
          // until the user sets a different value for this.featureLayers
          this._flChanged = 0;
        }
        if (array.every(this.featureLayers, function(featureLayer){return featureLayer.loaded;})) {
          items = this._flItems = this._getItemsFromLayers(this.featureLayers);
          this._adjustRowsCols(items);
        }
        else {
          var count = this.featureLayers.length;
          //var layers = [];          
          array.forEach(this.featureLayers, function(featureLayer){
            if (featureLayer.loaded) {
              count--;
              //layers.push(featureLayer);
            }
            else {
              var loadHandler = connect.connect(featureLayer, "onLoad", this, function(){
                connect.disconnect(loadHandler);
                loadHandler = null;
                count--;
                //layers.push(layer);
                if (!count) {
                  //items = this._flItems = this._getItemsFromLayers(layers);
                  //this._adjustRowsCols(items);
                  this.update();
                }
              });
            }
          }, this);
        }
      }
      else {
        items = this._itItems = this._getItemsFromItems(this.items);
        this._adjustRowsCols(items);
      }      
      
      /*if (this._dojo14x && this.grouping) {
        this._rows *= 2; // each row has an inner row, remember?
      }*/
    },
    
    _processSelectionLayers: function() {
      // 1. find selection mode feature layers that have been added to the map
      // 2. group these layers by their respective services
      // 3. find if the map service corresponding to those feature services have been added to the map as well
      // 4. make legend requests for each of these map services
      // 5. use these legend symbols instead of the renderer returned by feature layer resource
      
      var map, serviceUrl, info, layers, key, indices, legend,
          mapServiceDict = {
            /***
            "<map-service-url>": {
              "featureLayers": {
                "<layer-id>": <FeatureLayer>,
                ...
              },
              
              "indices": [ <layer-id>, ... ],
              "mapServiceUrl": "<string>",
              "mapServiceLayer": <ArcGISMapServiceLayer>
            },
            ...
            ***/
          };
      
      // mapServiceDict would contain one entry for each map service that we want to
      // fetch legend for. Each map service entry would provide legend symbols
      // for one or more featureLayers dislayed in this template picker
      array.forEach(this.featureLayers, function(layer, idx) {
        if (
          layer.mode === FeatureLayer.MODE_SELECTION && 
          layer._map && layer.url && layer._params.drawMode &&
          // TODO
          !layer.source // Why not?
        ) {
          serviceUrl = lang.trim(layer._url.path)
                         .replace(/\/(MapServer|FeatureServer).*/ig, "\/MapServer")
                         .replace(/^https?:\/\//ig, "")
                         .toLowerCase();
                        
          info = (mapServiceDict[serviceUrl] = mapServiceDict[serviceUrl] || {}); 
          layers = (info.featureLayers = info.featureLayers || {});
          indices = (info.indices = info.indices || []);

          layers[idx] = layer;
          indices.push(idx);
          map = layer._map;
        }
      });
      
      if (map) { // indicates there is atleast one legend request to be made
        array.forEach(map.layerIds, function(layer) {
          layer = map.getLayer(layer);
          
          // TODO
          // Should we wait for the layer to load before attempting to read "version"?
          if (
            layer && layer.url && (layer.getImageUrl || layer.getTileUrl) && 
            layer.loaded && layer.version >= 10.1
          ) {
            serviceUrl = lang.trim(layer._url.path).replace(/(\/MapServer).*/ig, "$1");
            key = serviceUrl.replace(/^https?:\/\//ig, "").toLowerCase();
          
            if (mapServiceDict[key] && (!mapServiceDict[key].mapServiceUrl)) {
              //console.log("FOUND matching map service layer: ", layer, serviceUrl);

              info = mapServiceDict[key];
              info.mapServiceUrl = serviceUrl;
              info.mapServiceLayer = layer;
              
              this._legendIndices = this._legendIndices.concat(info.indices);
              
              legend = this._fetchLegend({
                pickerInstance: this,
                info: info
              }, key);
              
              if (legend.then) {
                this._loadingIndices = this._loadingIndices.concat(info.indices);
                this._loadingLegends.push(legend);
              }
              else {
                this._processLegendResponse(legend, info);
              }
            }
          }
        }, this);
      }
      
      //console.log("mapServiceDict = ", mapServiceDict);
      //this._printLegendInfo();
    },
    
    _fetchLegend: function(context, key) {
      //console.log("making legend request...");
      
      var proto = TP.prototype,
          legend = proto.legendCache[key];
      
      if (!legend) {
        legend = (proto.legendCache[key] = esriRequest({
          url: context.info.mapServiceUrl/*.replace("symbols", "sadfsad")*/ + "/legend",
          content: { f: "json" },
          callbackParamName: "callback"
        }));
        
        legend._contexts = [ context ];
        
        legend.always(
          function(response) {
            //console.log("success/error: ", response);
            
            if (legend.canceled) {
              return;
            }
            
            // add this legend response/error to the cache
            proto.legendCache[key] = response;
            
            var contexts = legend._contexts;
            legend._contexts = null;
            
            array.forEach(contexts, function(ctxt) {
              var pickerInstance = ctxt.pickerInstance, info = ctxt.info, found;
              
              if (pickerInstance._destroyed) {
                return;
              }
              
              // update pendingIndices list
              array.forEach(info.indices, function(idx) {
                found = array.indexOf(pickerInstance._loadingIndices, idx);
                if (found > -1) {
                  pickerInstance._loadingIndices.splice(found, 1);
                }
              });
              
              found = array.indexOf(pickerInstance._loadingLegends, legend);
              if (found > -1) {
                pickerInstance._loadingLegends.splice(found, 1);
              }
              
              pickerInstance._processLegendResponse(response, info);
            });
          }
        );
      }
      else if (legend.then) {
        legend._contexts.push(context);
      }
      
      return legend;
    },
    
    _clearLegendInfo: function() {
      clearTimeout(this._legendTimer);
      this._ignoreLegends();

      this._legendIndices = this._loadingIndices = this._legendSymbols = 
      this._loadingLegends = this._legendTimer = null;
    },
    
    _ignoreLegends: function() {
      if (this._loadingLegends) {
        array.forEach(this._loadingLegends, function(legend) {
          var found = -1;
          
          array.some(legend._contexts, function(ctxt, idx) {
            if (ctxt.pickerInstance === this) {
              found = idx;
            }
            
            return (found > -1);
          }, this);
          
          if (found > -1) {
            legend._contexts.splice(found, 1);
          }
        }, this);
      }
    },
    
    /*_printLegendInfo: function() {
      console.log("=========================");
      console.log("useLegend = ", this.useLegend);
      console.log("legend indices = ", this._legendIndices);
      console.log("loading indices = ", this._loadingIndices);
      console.log("loading legends = ", this._loadingLegends);
      console.log("legend symbols = ", this._legendSymbols);
      console.log("timer = ", this._legendTimer);
      console.log("changed = ", this._flChanged);
      console.log("=========================");
    },*/
    
    _processLegendResponse: function(legend, info) {
      //console.log("processing legend response from....", info.mapServiceUrl, arguments);
      
      if (legend && !(legend instanceof Error)) {
        // iterate over indices and process the legend info
        array.forEach(info.indices, function(idx) {
          var layerId = info.featureLayers[idx].layerId, i,
              baseUrl = info.mapServiceUrl + "/" + layerId + "/images/", 
              token = info.mapServiceLayer._getToken(), found, obj, values, url;
          
          if (this._legendSymbols[idx]) {
            return;
          }
          
          found = null;
          array.some(legend.layers, function(layerObj) {
            if (layerObj.layerId == layerId) {
              found = layerObj;
            }
            
            return !!found;
          });
          
          if (found) {
            //console.log("found legend = ", found);
            obj = (this._legendSymbols[idx] = {});
            
            array.forEach(found.legend, function(symbolObj) {
              values = symbolObj.values;
              
              if (values && values.length) {
                // unique value or class breaks renderer
                for (i = 0; i < values.length; i++) {
                  obj[values[i]] = symbolObj;
                }
              }
              else {
                // simple renderer (or defaultSymbol of unique value or class breaks?)
                obj.defaultSymbol = symbolObj;
              }
                      
              // Convert relative urls to absolute image urls.
              // Use token where required.
              // This block of code borrowed from FeatureLayer._initLayer method.
              url = symbolObj.url;
              if (url && !symbolObj._fixed) {
                symbolObj._fixed = 1;
                
                // translate relative image resources to absolute paths
                if ( (url.search(/https?\:/) === -1) ) {
                  symbolObj.url = baseUrl + url;
                }
                
                // we're not going through esri.request. So, we need to append 
                // the token ourselves
                if (token && symbolObj.url.search(/https?\:/) !== -1) {
                  symbolObj.url += ( 
                    ((symbolObj.url.indexOf("?") > -1) ? "&" : "?") + 
                    "token=" + token 
                  );
                }
              }
              //console.log("url = " + symbolObj.url);

            });
          }
        }, this);
        
        //console.log("processed legend symbols: ", this._legendSymbols);
      }
      else {
        var found;
        
        array.forEach(info.indices, function(idx) {
          found = array.indexOf(this._legendIndices, idx);
          if (found > -1) {
            this._legendIndices.splice(found, 1);
          }
        }, this);
      }
      
      // In any case, trigger update if the widget already started up.
      var self = this;
      if (self._started && !self._legendTimer) {
        self._legendTimer = setTimeout(function() {
          clearTimeout(self._legendTimer);
          self._legendTimer = null;
          
          if (!self._destroyed) {
            self.update();
          }
        }, 0);
      }
    },
    
    _applyGridPatches: function() {
      var grid = this.grid;

      // patching for "autoWidth and grid header display" issue
      // see sitepen ticket: https://support.sitepen.com/issues/20400
      var oldAdaptWidth = grid.adaptWidth, views, i, view;
      
      grid.adaptWidth = function(){
        views = this.views.views;
        
        for(i = 0; view=views[i]; i++){
          domStyle.set(view.headerNode, 'display', 'block');
        }
        
        oldAdaptWidth.apply(this, arguments);
        
        for(i = 0; view=views[i]; i++){
          domStyle.set(view.headerNode, 'display', 'none');
        }
      };

      if (this._dojo14x) {
        if (this.rows !== "auto" && this.columns !== "auto") {
          //console.log("fetch complete patch applied...");
          // see https://support.sitepen.com/issues/20422#note-16
          var fetchConnect = connect.connect(grid, "_onFetchComplete", this, function() {
            connect.disconnect(fetchConnect);
            this.grid.set("autoHeight", this._rows);
          });
        }

        // cleanup gfx surfaces as needed
        // see https://support.sitepen.com/issues/20422#note-10
        connect.connect(grid, "_onDelete", this, this._destroyItems);
        connect.connect(grid, "_clearData", this, this._destroyItems);
        connect.connect(grid, "destroy", this, this._destroyItems);
        
        var focus = grid.focus;
        if (focus && focus.findAndFocusGridCell) {
          // disable focusing on the current selection
          // when scrollbar is clicked (odd ui behavior)
          focus.findAndFocusGridCell = function() { return false; };
        }
      }
    },
    
    _setGridLayout: function() {
      // grid cell "getter" function
      var getFunc = function(sequence) {
        return function(inRowIndex, inItem) {
          return this._cellGet(sequence, inRowIndex, inItem);
        };
      };
      
      // item fields definition
      var formatterFunc = lang.hitch(this, this._cellFormatter),
          cells = [], cols = this._columns, i;
      
      for (i = 0; i < cols; i++) {
        cells.push({ field: "cell" + i, get: lang.hitch(this, getFunc(i)), formatter: formatterFunc });
      }

      var layout = { cells: [ cells ] };
      
      if (this.grouping) {
        // group field definition
        var groupField = { field: "groupName", colSpan: cols, get: lang.hitch(this, this._cellGetGroup), formatter: lang.hitch(this, this._cellGroupFormatter) };
        layout.cells.push([ groupField ]);
      }
      
      //console.log("grid per page = ", this.grid.rowsPerPage);
      //console.log("current _rows = ", this._rows);

      // final grid structure/layout
      var grid = this.grid, defaultRPP = DataGrid.prototype.rowsPerPage;
      
      grid.set("rowsPerPage", (this._rows > defaultRPP)? this._rows : defaultRPP);
      
      grid.set("structure", layout);
      
      //dojo.disconnect(this._renderConnect);
      //this._renderConnect = dojo.connect(grid.views.views[0], "onAfterRow", this, this._afterRowFunc);
    },
    
    _setGridData: function() {
      // get store items
      var storeItems = [];
      
      if (this.grouping) {
        this._groupRowIndices = [];
        var prevIndex, prevNumRows, cols = this._columns;
        
        array.forEach(this._flItems, function(subItems, idx) {
          // store item for group name row
          storeItems.push({});
          
          // housekeeping
          var index = (idx === 0) ? 0 : (prevIndex + prevNumRows + 1);
          this._groupRowIndices.push(index);
          prevIndex = index;
          prevNumRows = Math.ceil(subItems.length / cols);
          
          // store items for templates
          storeItems = storeItems.concat(this._getStoreItems(subItems));
        }, this);
        
        //console.log("Group row indices = " , this._groupRowIndices);
      }
      else {
        if (this.featureLayers) {
          array.forEach(this._flItems, function(subItems) {
            storeItems = storeItems.concat(subItems);
          });
          storeItems = this._getStoreItems(storeItems);
        }
        else {
          storeItems = this._getStoreItems(this._itItems);
        }
      }
      
      // data store for the grid
      var store = new ItemFileReadStore({ 
        data: { items: storeItems }
      });
      this.grid.setStore(store);
    },
    
    _toggleTooltip: function() {
      if (this.showTooltip) { // enable if not already enabled
        if (this.tooltip) {
          return;
        }
        
        this.tooltip = domConstruct.create("div", { "class": "tooltip" },this.domNode);
        this.tooltip.style.display = "none";
        this.tooltip.style.position = "fixed";
        
        var grid = this.grid;
        this._mouseOverConnect = connect.connect(grid, "onCellMouseOver", this, this._cellMouseOver);
        this._mouseOutConnect = connect.connect(grid, "onCellMouseOut", this, this._cellMouseOut);
      }
      else { // disable
        if (this.tooltip) {
          connect.disconnect(this._mouseOverConnect);
          connect.disconnect(this._mouseOutConnect);
          domConstruct.destroy(this.tooltip);
          this.tooltip = null;
        }
      }
    },
    
    _rowClicked: function(evt, silent) {
      //console.log("[ ROW CLICK ] ", evt);
      var cellNode = evt.cellNode, row = evt.rowIndex, col = evt.cellIndex;
      
      // get clicked cell info
      var cell = this._getCellInfo(cellNode, row, col);
      if (!cell) {
        // clicked an invalid cell
        return;
      }
      
      var store = this.grid.store;
      if (store.getValue(cell, "loadingCell")) {
        return;
      }
      
      // unselect the previous selection
      if (this._selectedCell) {
        domClass.remove(this._selectedCell, "selectedItem");
      }
      
      if (cellNode !== this._selectedCell) {
        domClass.add(cellNode, "selectedItem");
        this._selectedCell = cellNode;
        
        this._selectedItem = {
          featureLayer: store.getValue(cell, "layer"),
          type: store.getValue(cell, "type"),
          template: store.getValue(cell, "template"),
          symbolInfo: store.getValue(cell, "symbolInfo"),
          item: this._getItem(cell)
        };
        
        this._selectedInfo = {
          selRow: row,
          selCol: col,
          index1: store.getValue(cell, "index1"),
          index2: store.getValue(cell, "index2"),
          index: store.getValue(cell, "index")
        };
        //this._selRow = row;
        //this._selCol = col;
      }
      else {
        this._selectedCell = this._selectedInfo = this._selectedItem = null;
      }
      
      if (!silent) {
        this.onSelectionChange();
      }
    },
    
    _locate: function(selected, info, storeItems) {
      var store = this.grid.store, cols = new Array(this._columns);
      var found, index1 = info.index1, index2 = info.index2, index = info.index, item = selected.item;
      
      array.some(storeItems, function(storeItem, rowIndex) {
        return array.some(cols, function(ignore, cellIndex) {
          var cell = store.getValue(storeItem, "cell" + cellIndex);
          
          if (cell && 
             (item ? (index === store.getValue(cell, "index")) : (index1 === store.getValue(cell, "index1")  && index2 === store.getValue(cell, "index2")) )
             ) {
            found = [ rowIndex, cellIndex ];
            return true; 
          }
          else {
            return false;
          }
        });
      });
      
      return found;
    },
    
    _getCellInfo: function(cellNode, row, col) {
      if (!cellNode) {
        // Just return if the user clicked any area inside the grid
        // that does not have a cell
        return;
      }

      //console.log(row + ", " + col);

      var grid = this.grid;
      var item = grid.getItem(row);
      var cell = grid.store.getValue(item, "cell" + col);
      //console.log(cell && grid.store.getValue(cell, "label"));
      return cell;
    },
    
    _getItem: function(cell) {
      var items = this.items;
      if (items) {
        return items[this.grid.store.getValue(cell, "index")];
      }
    },
    
    _cellMouseOver: function(evt) {
      var tooltip = this.tooltip;
      var cellNode = evt.cellNode, row = evt.rowIndex, col = evt.cellIndex;
      var cell = this._getCellInfo(cellNode, row, col);
      
      if (tooltip && cell) {
        var store = this.grid.store;
        var template = store.getValue(cell, "template");
        var type = store.getValue(cell, "type");
        var symbolInfo = store.getValue(cell, "symbolInfo");
        var layer = store.getValue(cell, "layer");
        var item = this._getItem(cell);
        
        var label = ( item && (item.label + (item.description ? (": " + item.description) : "" )) ) || 
                    (template && (template.name + (template.description ? (": " + template.description) : "" )) ) || 
                    (type && type.name) || 
                    (symbolInfo && (symbolInfo.label + (symbolInfo.description ? (": " + symbolInfo.description) : "" ))) || 
                    ((layer && layer.name + ": ") + "Default");
        
        
        tooltip.style.display = "none";
        tooltip.innerHTML = label;
        var coords = domGeometry.position(cellNode.firstChild);
        domStyle.set(tooltip, { left: (coords.x) + "px", top: (coords.y + coords.h + 5) + "px" });
        tooltip.style.display = "";
      }
    },
    
    _cellMouseOut: function() {
      var tooltip = this.tooltip;
      if (tooltip) {
        tooltip.style.display = "none";
      }
    },
    
    /*_afterRowFunc: function(inRowIndex, inSubRows) {
      //console.log("[ AFTER ROW ] ", inRowIndex);

      var grid = this.grid;
      var item = grid.getItem(inRowIndex);
      if (!item) {
        return;
      }
      
      var cols = this._columns, surfaces = this._surfaces;
      for (var i = 0; i < cols; i++) {
        var cell = grid.store.getValue(item, "cell" + i);
        if (cell) {
          try {
            var sid = grid.store.getValue(cell, "surfaceId");
            surfaces[sid] = this._drawSymbol(sid, grid.store.getValue(cell, "symbol"));
          }
          catch(e) {
            // TODO
            // Need to try catch here for IE.
            // In IE, sometimes createShape crashes because shape.rawNode has no
            // 'path' property yet (slow). This happens when IE is first opened 
            // with a page that has template picker. Everything is fine when the page
            // is refreshed. Instead of crashing, we can try catch here so that
            // atleast the label is displayed for the templates.
            // NOTE: This problem only happens for shapes of type 'path'
            // NOTE: registering 'whenLoaded' function does not solve this problem 
          }
        }
      }
    },
    
    _drawSymbol: function(surfaceId, symbol) {
      var sWidth = this.surfaceWidth, sHeight = this.surfaceHeight;
      var surface = dojox.gfx.createSurface(dojo.byId(surfaceId), sWidth, sHeight);
      if (dojo.isIE) {
        // Fixes an issue in IE where the shape is partially drawn and
        // positioned to the right of the table cell  
        var source = surface.getEventSource();
        dojo.style(source, "position", "relative");
        dojo.style(source.parentNode, "position", "relative");
      }
      var shapeDesc = esri.symbol.getShapeDescriptors(symbol);
      gfxShape = surface.createShape(shapeDesc.defaultShape).setFill(shapeDesc.fill).setStroke(shapeDesc.stroke);
      
      var dim = surface.getDimensions();
      var transform = { dx: dim.width/2, dy: dim.height/2 };
      
      var bbox = gfxShape.getBoundingBox(), width = bbox.width, height = bbox.height;
      if (width > sWidth || height > sHeight) {
        var actualSize = width > height ? width : height;
        var refSize = sWidth < sHeight ? sWidth : sHeight;
        var scaleBy = (refSize - 5) / actualSize;
        dojo.mixin(transform, { xx: scaleBy, yy: scaleBy });
      }

      gfxShape.applyTransform(transform);
      return surface;
    },*/
    
    _destroyItems: function() {
      //console.log("_destroyItems");
      var widgets = this._itemWidgets, w;
      
      for (w in widgets) {
        if(!widgets[w]){
          continue;
        }
        //console.log("destroying... ", w);
        widgets[w].destroy();
        delete widgets[w];
      }
    },
    
    _repaintItems: function() {
      //console.log("_repaintItems");
      var widgets = this._itemWidgets, w;
      
      for (w in widgets) {
        var widget = widgets[w];
        if (widget) {
          widget._repaint(widget._surface);
        }
      }
    },
    
    _getStoreItems: function(inItems) {
      // item = { label: <String>, symbol: <esri.symbol.Symbol> };
      //console.log("[ Create Store ]");
      
      // clone the items
      var uid = this._uniqueId;
      inItems = array.map(inItems, function(item) {
        return lang.mixin({
          "surfaceId": "tpick-surface-" + (uid.id++)
        }, item);
      });
      
      /*//var _uniqueId = 0;
      var uid = this._uniqueId;
      var itemHtml = 
        "<div class='item' style='text-align: center;'>" + 
          "<div class='itemSymbol' id='${surfaceId}'></div>" + 
          "<div class='itemLabel'>${label}</div>" + 
        "</div>";
      
      dojo.map(inItems, function(item) {
        item.surfaceId = "tpick-surface-" + (uid.id++);
        item.content = esri.substitute(item, itemHtml);
      });*/
      
      var len = inItems.length, index = 0, obj = {}, k = 0, prop, filteredItems = [], flag = true, cols = this._columns;
      while (index < len) {
        flag = true;
        prop = "cell" + k;
        obj[prop] = inItems[index];
        index++;
        
        k++;
        if (k % cols === 0) {
          flag = false;
          filteredItems.push(obj);
          obj = {};
          k = 0;
        }
      }
      
      if (flag && len) {
        filteredItems.push(obj);
      }
      
      return filteredItems;
    },
    
    _getItemsFromLayers: function(layers) {
      var items = [];
      
      array.forEach(layers, function(layer, index1) {
        items.push(this._getItemsFromLayer(layer, index1));
      }, this); // layers
      
      return items; // [ [ item1, item2, ... ], ... ]
    },
    
    _getItemsFromLayer: function(layer, index1) {
      var items = [];
      
      if (this.useLegend && array.indexOf(this._loadingIndices, index1) > -1) {
        //console.log("skipping this layer for now...", index1, layer);
        
        // Let's just return one item that shows "Loading" message
        return [{
          label: (this._nls && this._nls.loading) || "",
          symbol: null,
          layer: layer,
          type: null,
          template: null,
          index1: index1,
          index2: 0,
          loadingCell: 1
        }];
      }
      
      // index1 and index2 together represent the
      // location of an item in _flItems

      // find all the templates defined in the layer
      var outTemplates = [];
      
      // layer templates
      outTemplates = outTemplates.concat(layer.templates);
      
      // templates defined for layer types
      array.forEach(layer.types, function(fType) {
        var templates = fType.templates;
        array.forEach(templates, function(fTemplate) {
          fTemplate._type_ = fType;
        });
        outTemplates = outTemplates.concat(templates);
      });
      
      outTemplates = array.filter(outTemplates, esriLang.isDefined);
      
      var renderer = layer.renderer;
      
      if (renderer) {
        var className = renderer.declaredClass.replace("esri.renderer.", "");
        
        if (outTemplates.length > 0) { // use Renderer::getSymbol
        
          array.forEach(outTemplates, function(outTemplate) {
            var proto = outTemplate.prototype;
            
            if (proto) {
              var symbol;
              
              // If this is one of the new unclassed renderers, pick the 
              // symbol from the one class break available in the renderer.
              if (
                renderer.hasVisualVariables() &&
  
                // Checks if we have a class breaks renderer.
                renderer.addBreak && 
                
                // unclassed renderer do not have more than one break.
                renderer.infos &&
                renderer.infos.length === 1
              ) {
                symbol = renderer.infos[0].symbol;
                
                // This renderer can optionally have a defaultSymbol also, but we 
                // should not use it here. This is the reason whey we're NOT calling
                // getSymbol before checking the condition above.
              }
              else {
                symbol = renderer.getSymbol(proto);
              }

              //console.log("original symbol = ", symbol);
              
              if (symbol) {
                var found = null, pms, legend;
                
                // Check if we have a legend symbol that should be used
                if (this.useLegend && array.indexOf(this._legendIndices, index1) > -1) {
                  legend = this._legendSymbols && this._legendSymbols[index1];
                  
                  if (legend) {
                    switch(className) {
                      case "SimpleRenderer":
                        found = legend.defaultSymbol;
                        break;
                        
                      case "UniqueValueRenderer":
                        array.some(renderer.infos, function(info) {
                          if (info.symbol === symbol) {
                            found = legend[info.value];
                          }
                          return !!found;
                        });
                        break;
                        
                      case "ClassBreaksRenderer":
                        array.some(renderer.infos, function(info) {
                          if (info.symbol === symbol) {
                            found = legend[info.maxValue];
                          }
                          return !!found;
                        });
                        break;
                    }
                  }
                  
                  if (found) {
                    pms = JSON.parse(JSON.stringify(PictureMarkerSymbol.defaultProps));
                    pms.url = found.url;
                    pms.imageData = found.imageData;
                    pms.contentType = found.contentType;
                    pms.width = found.width;
                    pms.height = found.height;
                    
                    // For whatever reason legend operation does not return
                    // width and height for the image symbols, but for the most
                    // part, default is 20px by 20px (15pt by 15pt)
                    // http://nil/rest-docs/mslegend.html
                    if (!esriLang.isDefined(pms.width) || !esriLang.isDefined(pms.height)) {
                      pms.width = 15;
                      pms.height = 15;
                    }
                    
                    found = new PictureMarkerSymbol(pms);
                  }
                  
                  //console.log("legend symbol found = ", found);
                }

                items.push({
                  label: this._trimLabel(outTemplate.name),
                  symbol: found || symbol,
                  legendOverride: !!found,
                  layer: layer,
                  type: outTemplate._type_,
                  template: outTemplate,
                  index1: index1,
                  index2: items.length
                });
              }
  //            else {
  //              console.debug("SYMBOL not available: ", outTemplate);
  //            }
            } // prototype available
  //          else {
  //            console.debug("PROTOTYPE not available: ", outTemplate);
  //          }
            delete outTemplate._type_;
          }, this);
          
        } // templates available
        
        else { // use "infos" from renderer (specific to each renderer type)
        
          var infos = [];
          
          if (className === "TemporalRenderer") {
            renderer = renderer.observationRenderer;
            if (renderer) {
              className = renderer.declaredClass.replace("esri.renderer.", "");
            }
          }
          
          switch(className) {
            case "SimpleRenderer":
              infos = [{symbol: renderer.symbol, label: renderer.label, description: renderer.description}];
              break;
            case "UniqueValueRenderer":
            case "ClassBreaksRenderer":
              infos = renderer.infos;
              break;
          }
          
          items = array.map(infos, function(info, idx) {
            return {
              label: this._trimLabel(info.label),
              description: info.description,
              symbolInfo: lang.mixin({constructor: function() {}}, info), // ctor to avoid data store from corrupting it
              symbol: info.symbol,
              layer: layer,
              index1: index1,
              index2: idx
            };
          }, this);
          
        } // no templates
        
      } // layer renderer
      
      return items;
    },
    
    _getItemsFromItems: function(inItems) {
      // clone
      return array.map(inItems, function(item, idx) {
        item = lang.mixin({ index: idx }, item);
        item.label = this._trimLabel(item.label);
        return item;
      }, this);
      
      // [ item1, item2, ... ]
    },
    
    _trimLabel: function(label) {
      var max = this.maxLabelLength;
      if (max && label) {
        if (label.length > max) {
          label = label.substr(0, max) + "...";
        }
      }
      return label || "";
    },
    
    /****************************
     * Item getter and formatter
     ****************************/
    
    _cellGet: function(sequence, inRowIndex, inItem) {
      if(!inItem) {
        return "";
      }
      return this.grid.store.getValue(inItem, "cell" + sequence);
    },
    
    _cellFormatter: function(value) {
      //console.log("[ FORMATTER ] ", value);
      
      if (value) {
        /*value = this.grid.store.getValue(value, "content");
        return value.replace(/&lt;/g, "<");*/
       
        var widgets = this._itemWidgets, store = this.grid.store;
        var sid = store.getValue(value, "surfaceId");
        var w = widgets[sid];
        if(!w){
          w = (widgets[sid] = new TemplatePickerItem({
            id: sid, 
            label: store.getValue(value, "label"),
            symbol: store.getValue(value, "symbol"),
            legendOverride: store.getValue(value, "legendOverride"),
            surfaceWidth: this.surfaceWidth,
            surfaceHeight: this.surfaceHeight,
            template: store.getValue(value, "template") 
          }));
        }
        return w || "";
      }
      else {
        return "";
      }
    },
    
    /**********************************
     * Group name getter and formatter
     **********************************/
    
    _cellGetGroup: function(inRowIndex, inItem) {
      if (!this._groupRowIndices) {
        return "";
      }
      
      var found = array.indexOf(this._groupRowIndices, inRowIndex), layer;
      if(!inItem || found === -1) {
        return "";
      }
      
      layer = this.featureLayers[found];
      
      // featureLayers[found] could be undefined when updating the grid: like this:
      //   widget.grid.attr(featureLayers, [ layer1 ]);
      //   widget.update();
      return (
        layer && 
        (this.groupLabelFunction ? this.groupLabelFunction(layer) : layer.name)
      ) || "";
    },
    
    _cellGroupFormatter: function(value) {
      if (value) {
        return "<div class='groupLabel'>" + value + "</div>";
      }
      else {
        return "";
      }
    }
  });

  

  return TP;
});
