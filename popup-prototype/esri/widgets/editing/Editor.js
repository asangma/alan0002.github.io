define(
[
  "../../config",

  "../../core/declare",
  "../../core/domUtils",
  "../../core/promiseList",
  "../../core/undoManager",

  "../../geometry/Polygon",
  "../../geometry/Polyline",
  "../../geometry/support/graphicsUtils",

  "../../Graphic",

  "../../layers/FeatureLayer",

  "../../layers/support/FeatureTemplate",

  "../../tasks/support/Query",

  "../../toolbars/draw",
  "../../toolbars/edit",

  "../AttributeInspector",

  "./Add",
  "./Delete",
  "./SelectionHelper",
  "./TemplatePicker",
  "./Update",
  "./Util",

  "./toolbars/Drawing",

  "dijit/_Templated",
  "dijit/_Widget",

  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/_base/kernel",
  "dojo/_base/lang",

  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/string",

  "dojo/i18n!../../nls/jsapi",

  "dojo/text!./templates/Editor.html",

  // used in the widget's template
  "dijit/ProgressBar",
  "dojo/NodeList-dom"
],
function(
  esriConfig,
  declare, domUtils, promiseList, UndoManager,
  Polygon, Polyline, graphicsUtils,
  Graphic,
  FeatureLayer,
  FeatureTemplate,
  Query,
  Draw, EditToolbar,
  AttributeInspector,
  Add, Delete, SelectionHelper, TemplatePicker, Update, editUtil,
  EditDrawingToolbar,
  _Templated, _Widget,
  array, connect, dojoNS, lang,
  domClass, domConstruct, query, string,
  jsapiBundle,
  widgetTemplate
) {
  var Editor = declare([ _Widget, _Templated ], {
    declaredClass: "esri.widgets.editing.Editor",

    widgetsInTemplate: true,
    // templatePath: dojo.moduleUrl("esri.widgets.editing", "templates/Editor.html"),
    templateString: widgetTemplate,
    //events
    onLoad: function(){},
    
    /********************
     * Overrides
     *********************/
    constructor: function (params, srcNodeRef) {
        params = params || {};
        if (!params.settings) {
            console.error("Editor: please provide 'settings' parameter in the constructor");
        }
        if (!params.settings.layerInfos) {
            console.error("Editor: please provide 'layerInfos' parameter in the constructor");
        }
        this._settings = params.settings;
        this._eConnects = [];
    },

    startup: function () {
        this.inherited(arguments);
        this._setDefaultOptions();
        
        var lInfos = this._settings.layerInfos;
        if (array.every(lInfos, function(layerInfo){return layerInfo.featureLayer.loaded;})) {
          this._initLayers();
          this._connectEvents();
          this._createWidgets();
          this.onLoad();
          this.loaded = true;
        }
        else {
          var count = lInfos.length;         
          array.forEach(lInfos, function(layerInfo){
            var featureLayer = layerInfo.featureLayer;
            if (featureLayer.loaded) {
              count--;
            }
            else {
              var loadHandler = connect.connect(featureLayer, "onLoad", this, function(layer){
                connect.disconnect(loadHandler);
                loadHandler = null;
                count--;
                if (!count) {
                  this._initLayers();
                  this._connectEvents();
                  this._createWidgets();
                  this.onLoad();
                  this.loaded = true;
                }
              });
            }
          }, this);
        }

        this._reset();
        this._enableMapClickHandler();
    },

    stopEditing: function(callback) {
      this._updateCurrentFeature(lang.hitch(this, function() {
        this._clearSelection(false);
        callback && callback();
      }));
    },

    destroy: function () {
        if (this.drawingToolbar) {
            this.drawingToolbar.destroy();
        }

        if (this.attributeInspector) {
            this.attributeInspector.destroy();
        }

        if (this.templatePicker) {
            this.templatePicker.destroy();
        }
        
        if (this._selectionHelper){
            this._selectionHelper.destroy();
        }

        if (this._drawToolbar){
          this._drawToolbar.deactivate();
        }
        
        //if (this.undoManager){
          //TODO: when undomanager implements destroy
          //this.undoManager.destroy();
        //}

        this._reset();
        this._disableMapClickHandler();
        // use of connect.disconnect below is probably a problem
        array.forEach(this._eConnects, connect.disconnect);
        connect.disconnect(this._dtConnect);
        connect.disconnect(this._templatePickerOnSelectionChangeEvent);
                
        this._layer = this._currentGraphic = this._activeType = this._activeTemplate = this._drawingTool =
        this._drawToolbar = this._editToolbar = this.drawingToolbar = this.attributeInspector = this.templatePicker =
        this.undoManager = null;
        
        if (this._settings.map.popup && this._settings.map.popup.clearFeatures){ 
          this._settings.map.popup.clearFeatures(); 
        }

        this.inherited(arguments);
    },

    /*******************
     * Initialization
     *******************/
    _setDefaultOptions: function () {
        this._drawToolbar = this._settings.drawToolbar || new Draw(this._settings.map);
        this._settings.drawToolbar = this._drawToolbar;
        this._editToolbar = this._settings.editToolbar || new EditToolbar(this._settings.map, {textSymbolEditorHolder: this.domNode});
        this._settings.editToolbar = this._editToolbar;
        this._settings.toolbarVisible = this._settings.toolbarVisible || false;
        this._settings.toolbarOptions = lang.mixin({reshapeVisible: false, cutVisible: false,  mergeVisible: false }, this._settings.toolbarOptions);
        this._settings.createOptions = lang.mixin({polylineDrawTools: [Editor.CREATE_TOOL_POLYLINE], polygonDrawTools: [Editor.CREATE_TOOL_POLYGON], editAttributesImmediately: true }, this._settings.createOptions);
        this._settings.singleSelectionTolerance = this._settings.singleSelectionTolerance || 3;
        this._settings.maxUndoRedoOperations = this._settings.maxUndoRedoOperations || 10;
        this._settings.editor = this;
        this._usePopup = this._settings.usePopup = this._settings.map.popup._setPagerCallbacks ? true : false;
        this._datePackage = this._settings.datePackage;
        
        this._settings.geometryService = this._settings.geometryService || esriConfig.geometryService;
        esriConfig.geometryService = esriConfig.geometryService || this._settings.geometryService;
    },

    _initLayers: function () {
        this._settings.layers = [];
        this._settings.userIds = {};
        this._settings.createOnlyLayer = {};
        var lInfos = this._settings.layerInfos;
        array.forEach(lInfos, function(layer) {
            if (layer.featureLayer && layer.featureLayer.loaded){
                this._settings.layers.push(layer.featureLayer);
                var layerId = layer.featureLayer.id;
                if (layer.featureLayer.credential) {
                  this._settings.userIds[layerId] = layer.featureLayer.credential.userId;
                }
                if (layer.userId) {
                  this._settings.userIds[layerId] = layer.userId;
                }
                var editCapabilities = layer.featureLayer.getEditCapabilities();
                if (editCapabilities.canCreate && !editCapabilities.canUpdate) {
                  this._settings.createOnlyLayer[layerId] = true;
                }
                else {
                  this._settings.createOnlyLayer[layerId] = false;
                }                
                //for textsymbol point, it doesn't need attributeInspector.
                if (this._isTextSymbolPointLayer(layer.featureLayer)) {
                  layer.disableAttributeUpdate = true;
                }
            }
        }, this);
    },

    _reset: function () {
        this._hideAttributeInspector();
        this._editToolbar.deactivate();
        
        this._editVertices = true;
        this._layer = null;
        this._currentGraphic = null;
        this._activeType = null;
        this._activeTemplate = null;
        this._drawingTool = null;
        this._attributeChanged = false;
    },
    
    _saveFeatureOnClient: function (feature) {
      //feature is a geometry object here.      
      var selected = this.templatePicker.getSelected();
      var selectedSymbol;
      if (selected.template) {
        selectedSymbol = selected.featureLayer.renderer.getSymbol(selected.template.prototype);
      }
      else {
        selectedSymbol = selected.symbolInfo.symbol;
      }
      var att = selected.template.prototype.attributes;
      this._tempGraphic = new Graphic(feature, selectedSymbol, att, null);     
      var map = this._settings.map;
      map.graphics.add(this._tempGraphic);
      var point = this._findCenterPoint(feature);
      this._createAttributeInspector(true);
      map.popup.setTitle(selected.featureLayer ? selected.featureLayer.name : jsapiBundle.widgets.attributeInspector.NLS_title);
      this.attributeInspector.showFeature(this._tempGraphic, selected.featureLayer); 
      //map.popup.show(point, map.getInfoWindowAnchor(point));
      this._showInfoWindow(point, map.getInfoWindowAnchor(point));
      if (this._settings.createOnlyLayer[selected.featureLayer.id]) {
        this._infoWindowHideEvent = connect.connect(map.popup, "onHide", this, "_infoWindowHide");        
      }
      connect.disconnect(this._templatePickerOnSelectionChangeEvent);      
      this.templatePicker.clearSelection();       
      this._drawToolbar.deactivate();      
      this._enableMapClickHandler();
        
      if (this.drawingToolbar){
        this.drawingToolbar.deactivate();
      }
      this._templatePickerOnSelectionChangeEvent = connect.connect(this.templatePicker, "onSelectionChange", lang.hitch(this, "_onCreateFeature"));
    },
    
    _saveAttributesOnClient: function (feature, fieldName, newFieldValue) {
      this._tempGraphic.attributes[fieldName] = (typeof(newFieldValue) === "number" && isNaN(newFieldValue)) ? null : newFieldValue;
    },
    
    _infoWindowHide: function(){
      this._createFeature(this._tempGraphic.geometry, this._tempGraphic.attributes);
      connect.disconnect(this._infoWindowHideEvent);
    },

    _createFeature: function (feature, attributes) {
        // Cache center point, for case of wraparound
        this._editClickPoint = this._findCenterPoint(feature);
        
        // Point feature
        if (!feature.rings) {
            this._applyEdits([{ layer: this._layer, adds: [this._createGraphic(feature, attributes)]}]);
            return;
        }

        // Polyline || Polygon, simplify first
        this._simplify(feature, lang.hitch(this, function (geometry) {
            if (this._drawingTool !== FeatureTemplate.TOOL_AUTO_COMPLETE_POLYGON) {
                this._applyEdits([{ layer: this._layer, adds: [this._createGraphic(geometry, attributes)]}]);
            } else {
                // AutoComplete Drawing Tool
                this._autoComplete(geometry, lang.hitch(this, function (geometries) {
                    if (geometries && geometries.length){
                        this._applyEdits([{ layer: this._layer, adds: array.map(geometries, lang.hitch(this, function(geometry){ return this._createGraphic(geometry, attributes); }))}]);
                    }
                }));
            }
        }));
    },
    
    _updateCurrentFeature : function(callback){
        //Applys edits to feature currently being edited if it was modified
        var modifiedFeature = this._isModified();
        if (modifiedFeature) {
            this._updateFeature(modifiedFeature, callback);
        } else if (callback) {
            callback(false);
        }
    },

    _updateFeature: function (feature, callback) {
        var geom = feature.geometry;
        // Point feature
        if (!geom.rings) {
            this._applyEdits([{ layer: feature.getLayer(), updates: [feature]}], callback);
        } else {
          // Polyline || Polygon, simplify first
          this._simplify(geom, lang.hitch(this, function (geometry) {
            this._applyEdits([{ layer: feature.getLayer(), updates: [lang.mixin(feature, {geometry:geometry})]}], callback);
          }));
        }
    },

    _deleteFeature: function (feature, callback) {
        var edits = [];
        if (!feature) {
            var layers = this._settings.layers;
            edits = array.map(
              array.filter(layers, function(layer){ 
                return layer.getSelectedFeatures().length > 0; 
              }), function(item) {
                return {layer:item, deletes: item.getSelectedFeatures()};
              });
            if ((!edits || !edits.length) && this._currentGraphic) {
                edits.push({ layer: this._layer, deletes: [this._currentGraphic] });
            }
        } else {
            edits.push({ layer: feature.getLayer(), deletes: [feature] });
        }
        this._applyEdits(edits, callback);
    },

    _stopEditing: function (layer, adds, updates, deletes) {
        domUtils.hide(this.progressBar.domNode);
        this._undoRedoAdd();
        var mapService;
        if (layer._isSelOnly === true || layer.mode === 1 || layer.mode === 6) {
            if (adds && adds.length) { // selection only layer and ondemand mode, if it's auto mode (6), it might be ondemand
                // "select" new feature to pull it to the client
                this.templatePicker.clearSelection();
                var query = new Query();
                query.objectIds = [adds[0].objectId];
                if (!this._settings.createOnlyLayer[layer.id]) {
                  this._selectFeatures([layer], query, lang.hitch(this, "_onEditFeature"));
                }
                else {
                  this._settings.map.graphics.remove(this._tempGraphic);
                }
            }
        } else { // Not "selection only" layer
            // Refresh any map services corresponding to this feature layer
            mapService = this._selectionHelper.findMapService(this._settings.map, layer);
            if (mapService) { mapService.refresh(); }
            if (adds && adds.length) {
                this.templatePicker.clearSelection();
                if (!this._settings.createOnlyLayer[layer.id]) {
                  editUtil.findFeatures(adds, layer, lang.hitch(this, "_onEditFeature"));
                }
                else {
                  this._settings.map.graphics.remove(this._tempGraphic);
                }
            }
        }
        
        if (deletes && deletes.length){
          this._clearSelection(true);
          if (this._undoRedo){
              mapService = this._selectionHelper.findMapService(layer, this._settings.map);
              if (mapService) { mapService.refresh(); }
          }
        }
        
        if (this._undoRedo && updates && updates.length){
          mapService = this._selectionHelper.findMapService(layer, this._settings.map);
          if (mapService) { mapService.refresh(); }
          this.attributeInspector.refresh();
          this._undoRedo = false;
        }
        
        if (this.drawingToolbar){
          this.drawingToolbar._updateUI();
        }
        this._undoRedo = false;
    },
        
    _undoRedoAdd: function(){
        this._settings._isApplyEditsCall = false;
        if (!this._settings.undoManager){ return;}
        if (this._activeTool === "CUT" || this._activeTool === "UNION"){ return; }
        var edit = (this._edits && this._edits.length) ? this._edits[0] : null;
        if (!edit){ return; }
        var adds = edit.adds || [];
        var updates = edit.updates || [];
        var deletes = edit.deletes || [];
        var param = {featureLayer: edit.layer};
        if (adds.length){
          this.undoManager.add(new Add(lang.mixin(param, {addedGraphics:adds})));
        } else if (deletes.length){
          this.undoManager.add(new Delete(lang.mixin(param, {deletedGraphics:deletes})));
        } else if (updates.length && this._preUpdates){
          this.undoManager.add(new Update(lang.mixin(param, {preUpdatedGraphics:[this._preUpdates], postUpdatedGraphics:updates})));
        }
        this._edits = null;
        this._preUpdates = null;
    },

    _activateDrawToolbar: function (template) {
        this._layer = template.featureLayer;
        this._activeType = template.type;
        this._activeTemplate = template.template;
        this._drawingTool = this._activeTemplate ? this._activeTemplate.drawingTool : null;
        this._drawTool = this._toDrawTool(this._drawingTool, template.featureLayer);
        connect.disconnect(this._dtConnect);
        //only create is allow for the feature service, for this case, 
        //editor should NOT create a feature right away when onDrawEnd event fires.
        //Because if creating it, it would be NOT possible to add attributes information later on.
        //The solution is to associate the close event of the infowindow, and hold on sending request
        //to server until the window is closed so that users have a chance to input attribute values.
        if (this._settings.createOnlyLayer[template.featureLayer.id]) {
          this._dtConnect = connect.connect(this._drawToolbar, "onDrawEnd", this, "_saveFeatureOnClient");
        }
        else {
          this._dtConnect = connect.connect(this._drawToolbar, "onDrawEnd", this, "_createFeature");
        }
        this._editToolbar.deactivate();
        this._disableMapClickHandler();
        if (!this.drawingToolbar){
            this._drawToolbar.activate(this._drawTool);
        } else {
            this.drawingToolbar.activateEditing(this._drawTool, this._layer);
        }
    },

    _activateEditToolbar: function (feature, info) {
        var layer = feature.getLayer();
        var geometryType = layer ? layer.geometryType : null;
        var isTextSymbolPoint = this._isTextSymbolPoint(feature);
        var editOptions = EditToolbar.MOVE;
        if (geometryType !== "esriGeometryPoint" && this._isNotesFeature(feature) === true) {
            editOptions = editOptions | EditToolbar.ROTATE | EditToolbar.SCALE;
            this._editVertices = false;
        } else if (geometryType !== "esriGeometryPoint" && this._editVertices === true) {
            editOptions = editOptions | EditToolbar.ROTATE | EditToolbar.SCALE;
            this._editVertices = false;
        } else if (isTextSymbolPoint) {
            editOptions = editOptions | EditToolbar.ROTATE | EditToolbar.SCALE | EditToolbar.EDIT_TEXT;
            this._editVertices = false;
        } else {
            editOptions = editOptions | EditToolbar.EDIT_VERTICES;
            this._editVertices = true;
        }
        this._attributeChanged = this._isModified();
        this._preUpdates = new Graphic(lang.clone(feature.toJSON()));
        //ownership base access control
        var editCapabilities = layer.getEditCapabilities({feature: feature, userId: this._settings.userIds[layer.id]});
        var currentLayerInfo = array.filter(this._settings.layerInfos, function(item){
          return item.featureLayer["layerId"] === layer.layerId;
        })[0];
        if (editCapabilities.canUpdate && !currentLayerInfo.disableGeometryUpdate && layer.allowGeometryUpdates) {
          this._editToolbar.activate(editOptions, feature);
          //go to text editing mode when a textsymbol point is created.
          if (isTextSymbolPoint) {
            this._editToolbar._textEditor._addTextBox(feature);
            if (this._editToolbar._textSymbolEditor) {
              this._editToolbar._textSymbolEditor.hide();
            }
          }
        }
        
        if (!this._settings.map.popup.isShowing && !this._updateAttributeDisabled(feature)){
          var point = (info && info.screenPoint) || this._findCenterPoint(feature); 
          //this._settings.map.popup.show(point, this._settings.map.getInfoWindowAnchor(point));
          this._showInfoWindow(point, this._settings.map.getInfoWindowAnchor(point));
        }
    },

    _createGraphic: function (geometry, attributes) {

        var symbol = (this._activeType && this._activeType.symbol) || this._layer.defaultSymbol;
        var graphic = new Graphic(geometry, symbol, attributes);
        if (this._activeTemplate || attributes) {
          graphic.attributes = attributes || lang.mixin({}, this._activeTemplate.prototype.attributes);
        } else {
          graphic.attributes = graphic.attributes || [];
          array.forEach(this._layer.fields, function(field){ 
            graphic.attributes[field.name] = null; 
          }, this);
        }

        return graphic;
    },

    /********************
     * Events
     *********************/
    _connectEvents: function () {
        var layers = this._settings.layers;
        array.forEach(layers, function(item) {
          this._connect(item, 'onEditsComplete', lang.hitch(this, '_stopEditing', item));
        }, this);
        array.forEach(layers, function(item) {
          this._connect(item, 'onBeforeApplyEdits', lang.hitch(this, function() { 
            domUtils.show(this.progressBar.domNode); 
            this._settings._isApplyEditsCall = true;  
          }));
        }, this);
        this._connect(this._editToolbar, "onGraphicClick", lang.hitch(this, "_activateEditToolbar"));
        this._connect(this._editToolbar, "onGraphicFirstMove", lang.hitch(this, "_hideAttributeInspector"));
        this._connect(this._editToolbar, "onVertexFirstMove", lang.hitch(this, "_hideAttributeInspector"));
        this._connect(this._editToolbar, "onScaleStart", lang.hitch(this, "_hideAttributeInspector"));
        this._connect(this._editToolbar, "onRotateStart", lang.hitch(this, "_hideAttributeInspector"));
    },

    _connect: function(node, evt, func){
        this._eConnects.push(connect.connect(node, evt, func));
    },

    /********************
     * Widgets
     *********************/
    _createWidgets: function () {
        this._selectionHelper = new SelectionHelper(this._settings);
        this._createTemplatePicker();
        this._createAttributeInspector();
        this._createDrawingToolbar();
        this._createUndoRedoManager();
    },

    _createTemplatePicker: function () {
        if (!this._settings.templatePicker) {
            var layers = array.filter(this._settings.layers, function(item){
              return item.getEditCapabilities().canCreate;
            });
            this.templatePicker = new TemplatePicker({
                'class': 'esriTemplatePicker',
                featureLayers: layers,
                showTooltip: true,
                maxLabelLength: this._settings.typesCharacterLimit,
                columns: "auto",
                rows: "auto"
            }, this.templatePickerDiv);
            this.templatePicker.startup();
            this._settings.templatePicker = this.templatePicker;
        }
        else {
            this.templatePicker = this._settings.templatePicker;
            domUtils.hide(this.templatePickerDiv);
        }
        
        this._templatePickerOnSelectionChangeEvent = connect.connect(this.templatePicker, "onSelectionChange", lang.hitch(this, "_onCreateFeature"));
    },

    _createAttributeInspector: function (createOnly) {
        if (!this._settings.attributeInspector) {
            this._customAttributeInspector = false;
            var map = this._settings.map;

            this.attributeInspector = new AttributeInspector({
                layerInfos: this._settings.layerInfos,
                hideNavButtons: this._usePopup,
                datePackage: this._datePackage
            }, domConstruct.create("div"));
            this.attributeInspector.startup();
            map.popup.setContent(this.attributeInspector.domNode);
            
            map.popup.setTitle(jsapiBundle.widgets.attributeInspector.NLS_title);
            map.popup.resize(350, 375);
            dojoNS.query('.esriAttributeInspector .atiLayerName').style({display:'none'});
        }
        else {
            this._customAttributeInspector = true;
            this.attributeInspector = this._settings.attributeInspector;
        }
        
        this._connect(this.attributeInspector, "onDelete", lang.hitch(this, "_deleteFeature"));
        this._connect(this.attributeInspector, "onNext", lang.hitch(this, function(feature) {
            this._updateCurrentFeature(lang.hitch(this, function() { 
                this._attributeChanged = false;
                this._onEditFeature(feature);  
            }));
        }));
        
        if (this._usePopup){
            this._settings.map.popup._setPagerCallbacks(this.attributeInspector, lang.hitch(this.attributeInspector, "next"), lang.hitch(this.attributeInspector, "previous"));
        }

        if (createOnly) {
            this._connect(this.attributeInspector, "onAttributeChange", lang.hitch(this, "_saveAttributesOnClient"));
        }
        else {
            this._connect(this.attributeInspector, "onAttributeChange", lang.hitch(this, function (feature, fieldName, newFieldValue) {

                this._preUpdates = new Graphic(lang.clone(feature.toJSON()));
                //if the field is non-nullable, make empty string new value as null,
                //so that service will reject it as expected.
                var fl = feature.getLayer();
                var field = array.filter(fl.fields, function(field){
                  return field.name === fieldName;
                })[0];
                if (field && !field.nullable && newFieldValue === "") {
                  newFieldValue = null;
                }
                this._currentGraphic.attributes[fieldName] = (typeof(newFieldValue) === "number" && isNaN(newFieldValue)) ? null : newFieldValue;
                this._updateFeature(this._currentGraphic, null);
                this._attributeChanged = false;
            }));
        }
    },

    _createDrawingToolbar: function () {
        if (this._settings.toolbarVisible === true) {
            this.drawingToolbar = new EditDrawingToolbar({
                'class': 'esriDrawingToolbar',
                drawToolbar: this._drawToolbar,
                editToolbar: this._editToolbar,
                settings: this._settings,
                onDelete: lang.hitch(this, "_deleteFeature"),
                onApplyEdits: lang.hitch(this, "_applyEdits"),
                onShowAttributeInspector: lang.hitch(this, "_onEditFeature")
            }, this.drawingToolbarDiv);
        }
    },
    
    _createUndoRedoManager: function() {
        if (!this._settings.enableUndoRedo && !this._settings.undoManager){ return; }
        this._settings.enableUndoRedo = true;
        this.undoManager = this._settings.undoManager;
        if (!this.undoManager){
          this.undoManager = this._settings.undoManager = new UndoManager({maxOperations: this._settings.maxUndoRedoOperations});
        }
        
        this._connect(document, "onkeypress", lang.hitch(this, function(evt){
            if (evt.metaKey || evt.ctrlKey){
              if (evt.charOrCode === 'z'){ this._undo(); }
              if (evt.charOrCode === 'y'){ this._redo(); }
            }
        }));
    },

    _enableMapClickHandler: function () {
        this._mapClickHandler = connect.connect(this._settings.map, "onClick", lang.hitch(this, function (evt) {
            if (this._drawToolbar._geometryType) { return; }
            
            if (this._activeTool === "SELECT"){
                this._activeTool = "";
                return;
            }
            
            this._updateCurrentFeature(lang.hitch(this, function() {
                this._reset();
                this._updateSelection(evt);
            }));
        }));
    },

    _disableMapClickHandler: function () {
        connect.disconnect(this._mapClickHandler);
    },

    _onCreateFeature: function () {
        var template = this.templatePicker.getSelected();
        if (template){
            // Check for a feature that was being edited
            this._updateCurrentFeature(lang.hitch(this, function(){
                if (this._currentGraphic) { this._clearSelection(false); }
                this._reset();
                this._activateDrawToolbar(template);
            }));
        } else {
            this._reset();
            connect.disconnect(this._dtConnect);
            this._drawToolbar.deactivate();
            this._enableMapClickHandler();
            if (this.drawingToolbar){
              this.drawingToolbar.deactivate();
            }
        }
    },
    
    _isTextSymbolPoint: function(graphic) {
      if ((graphic.geometry.type === "point" || graphic.geometry.type === "multipoint")) {
        var layer = graphic.getLayer(),
            renderer = layer.renderer,
            symbol = graphic.symbol || layer._getSymbol(graphic);

        // Edit toolbar uses this logic also.
        // See also: esri.toolbars.Edit._prepareTextSymbolEditing
        // TODO
        // Find a better way to make this easy.
        if (
          !symbol &&
  
          // If this is one of the new unclassed renderers, pick the 
          // symbol from the one class break available in the renderer.
          // If there were a defaultSymbol, _getSymbol would have already 
          // returned it.
          renderer.hasVisualVariables() &&
          renderer.addBreak && 
          renderer.infos &&
          renderer.infos.length === 1
        ) {
          symbol = renderer.infos[0].symbol || renderer.defaultSymbol;
    
          // This renderer can optionally have a defaultSymbol also, but we 
          // should not use it here.
        }
        
        if (symbol && symbol.type === "textsymbol") {
          return true;
        }
      }

      return false;
    },
    
    _isTextSymbolPointLayer: function(featureLayer) {
      if (featureLayer.geometryType === "esriGeometryPoint"
          && featureLayer.renderer
          && featureLayer.renderer._symbols
          && featureLayer.renderer._symbols[0]
          && featureLayer.renderer._symbols[0].symbol
          && featureLayer.renderer._symbols[0].symbol.type === "textsymbol") {
        return true;
      }
      
      return false;
    },
    
    _updateAttributeDisabled: function(feature) {
      var fLayer = feature.getLayer();
      if (!fLayer) {
        return false;
      }
      
      var i, layerInfo, disableAttributeUpdate = false;
      for (i = 0; i < this._settings.layerInfos.length; i++) {
        layerInfo = this._settings.layerInfos[i];
        if (layerInfo.featureLayer == fLayer) {
          disableAttributeUpdate = layerInfo.disableAttributeUpdate;
          break;
        }
      }
      
      return disableAttributeUpdate;
    },
    
    _onEditFeature: function (feature, point) {
        feature = (lang.isArray(feature) ? feature[0] : feature) || null;
        if (!feature){ return; }
        this._layer = feature.getLayer();
        if (!this._customAttributeInspector && !this._updateAttributeDisabled(feature)) {
            point = point || this._editClickPoint || this._findCenterPoint(feature);
            
            if(this._currentFeatureCount > 1){
              // Number Logic for InfoWindow (X of Y) - Added in 3.11
              var index = this._popupFeatures.indexOf(feature);
              var displayValue= this._currentFeatureCount - this._popupFeatures.indexOf(feature) + 1;
              if (displayValue > this._currentFeatureCount){
                displayValue = 1;
              }
              //this._settings.map.popup.setTitle("(" +  displayValue + " of " + this._currentFeatureCount + ")");
              this._settings.map.popup.setTitle( string.substitute( jsapiBundle.widgets.popup.NLS_pagingInfo, { index: displayValue, total: this._currentFeatureCount}));
            }else{
              // Only 1 Feature
              this._settings.map.popup.setTitle(this._layer ? this._layer.name : jsapiBundle.widgets.attributeInspector.NLS_title);
            }
            if (this.drawingToolbar || !this._settings.map.popup.isShowing){
                //this._settings.map.popup.show(point, this._settings.map.getInfoWindowAnchor(point));
                this._showInfoWindow(point, this._settings.map.getInfoWindowAnchor(point));
            }
            this._editClickPoint = null;
        }
        if (feature === this._currentGraphic){ return; }
        this._editVertices = true;
        this._currentGraphic = feature;
        if (feature.getDojoShape()){ feature.getDojoShape().moveToFront(); }
        this._activateEditToolbar(feature);
    },

    _applyEdits: function (edits, callback) {
        edits = edits || [];
        if (edits.length <= 0) { return; }
        //editor tracking
        /*var featureLayer = edits[0].layer;     
        var editFieldsInfo = featureLayer.editFieldsInfo;
        var date;
        if (edits[0].adds && editFieldsInfo) {
          if (editFieldsInfo.creatorField){
            var creatorField = editFieldsInfo.creatorField;  
            edits[0].adds[0].attributes[creatorField] = this._settings.userIds[featureLayer.layerId];
          }
          if (editFieldsInfo.creationDateField){
            var creationDateField = editFieldsInfo.creationDateField;
            date = new Date();            
            edits[0].adds[0].attributes[creationDateField] = date;
          }
          if (editFieldsInfo.editorField){
            var editorField = editFieldsInfo.editorField;  
          edits[0].adds[0].attributes[editorField] = this._settings.userIds[featureLayer.layerId];
          }
          if (editFieldsInfo.editDateField){
            var editDateField = editFieldsInfo.editDateField;
            date = new Date();            
            edits[0].adds[0].attributes[editDateField] = date;
          }
        }
        if (edits[0].updates && editFieldsInfo) {
          if (editFieldsInfo.editorField){
            var editorField = editFieldsInfo.editorField;  
          edits[0].updates[0].attributes[editorField] = this._settings.userIds[featureLayer.layerId];
          }
          if (editFieldsInfo.editDateField){
            var editDateField = editFieldsInfo.editDateField;
            date = new Date();            
            edits[0].updates[0].attributes[editDateField] = date;
          }
        }*/
        
        this._edits = edits;
        
        //esri.show(this.progressBar.domNode);
        var deferreds = [];
        array.forEach(edits, function (edit) {
          if (edit.layer) {
            deferreds.push(edit.layer.applyEdits(edit.adds, edit.updates, edit.deletes));
          }
        });

        if (deferreds.length > 0) {
          this._deferredsList = promiseList(deferreds).then(lang.hitch(this, function() {
            domUtils.hide(this.progressBar.domNode);
            
            if (callback) {
                callback();
            }
        
            // Editor uses the infowindow in such a way that infowindow.setContent
            // is only called once when attribute inspector is setup initially
            // when the editor is initialized. From then on, attribute inspector
            // keeps changing its content as needed. This will result in incorrect
            // positioning of popup (esri.widgets.Popup) pointer (left, right) - for example
            // when creating a new point feature 
            // Hence this piece of code. 
            var map = this._settings.map;
            if (map && map.popup.reposition && map.popup.isShowing) {
              map.popup.reposition();
            }
          }));
        }
    },
    
    _undo: function() {
      if (this._settings.undoManager && !this._settings._isApplyEditsCall){
          this._editToolbar.deactivate();
          //this._hideAttributeInspector();
          this._undoRedo = true;
          this._settings.undoManager.undo();
      }
    },
    
    _redo: function() {
      if (this._settings.undoManager && !this._settings._isApplyEditsCall){
          this._editToolbar.deactivate();
          //this._hideAttributeInspector();
          this._undoRedo = true;
          this._settings.undoManager.redo();
      }
    },

    /********************
     * Helpers
     *********************/
   _simplify : function(geometry, callback){
        if (Polygon.prototype.isSelfIntersecting(geometry)){
            this._settings.geometryService.simplify([geometry], function(simplifiedGeometries){
                  var geometry = (simplifiedGeometries && simplifiedGeometries.length) ? simplifiedGeometries[0] : geometry;
                  if (callback) {
                      callback(geometry);
                  }
            });
        } else if (callback) {
            callback(geometry);
        }
    },
    
    _autoComplete : function(geometry, callback){
        var layers = this._getLayers("esriGeometryPolygon");
        
        var query = new Query(); 
        query.geometry = geometry;
        query.returnGeometry = true;

        this._selectFeatures(layers, query, lang.hitch(this, function(selectionSet){
            if (!selectionSet || selectionSet.length <= 0) {
                if (callback) {
                    callback([geometry]);
                }
            } else {
                this._settings.geometryService.autoComplete(graphicsUtils.getGeometries(selectionSet), this._toPolylines([query.geometry]), function(geometries){
                    if (callback) {
                        callback(geometries);
                    }
                });
            }
        }));
    },
    
    _getLayers : function(geomType) {
         var layers = this._settings.layers;
         return array.filter(layers, function(layer){ return layer.geometryType === geomType; });
    },

    _selectFeatures: function (layers, query, callback, mode) {
        this._selectionHelper.selectFeatures(layers, query, mode || FeatureLayer.SELECTION_NEW, callback);
    },

    _updateSelection: function (evt) {
        var mapPoint = evt.mapPoint,
            graphic = evt.graphic;

        //those textsymbol point layers should not be selected with selection symbol,
        //they should keep the text symbol all time.
        //additionally, it shouldn't popup the infowindow.
        this._selectionHelper.selectFeaturesByGeometry(this._settings.layers, mapPoint, FeatureLayer.SELECTION_NEW, lang.hitch(this, function(features) {
            var containsGraphic = array.some(features, lang.hitch(this, function(item){ 
              return item == graphic; 
            }));
            if (graphic && !containsGraphic){
                var gLayer = graphic.getLayer();
                if (this._isValidLayer(gLayer)) {
                  var query  = new Query();
                  query.objectIds = [graphic.attributes[gLayer.objectIdField]];
                  this._selectionHelper.selectFeatures([gLayer], query, FeatureLayer.SELECTION_ADD, lang.hitch(this, function(features){
                      this._updatePopupButtons(features);
                      this._onEditFeature(features, mapPoint);
                  }));
                } else {
                  this._clearSelection();
                }
                
            } else if (features && features.length) {
                this._updatePopupButtons(features);
                this._onEditFeature(features, mapPoint);
            } else{
                this._clearSelection();
            }
        }));
        
        if (graphic && this._isTextSymbolPoint(graphic)) {
          var editOptions  = 0;        
          editOptions = editOptions | EditToolbar.MOVE | EditToolbar.ROTATE | EditToolbar.SCALE | EditToolbar.EDIT_TEXT;  
          this._editToolbar.activate(editOptions, graphic);
        }
    },
    
    _updatePopupButtons: function(features) {
        if (!this._usePopup || !features){ 
          this._popupFeatures = null;
          this._currentFeatureCount = null;
          return; 
        }
        var count = features.length;
        var buttons = [this._settings.map.popup._prevFeatureButton, this._settings.map.popup._nextFeatureButton];
        array.forEach(buttons, lang.hitch(this, function(item){ 
          (count > 1) ? domClass.remove(item, "hidden") : domClass.add(item, "hidden");
        }));

        var atiLayerNameDisplayValue = (count > 1) ? "block" : "none";
        dojoNS.query('.esriAttributeInspector .atiLayerName').style({display:atiLayerNameDisplayValue});
        
        this._currentFeatureCount = count;
        this._popupFeatures = features;
    },
    
    _clearSelection: function(doNotRefresh){
      this._currentFeatureCount = 0;
      this._popupFeatures = null;
      this._selectionHelper.clearSelection(doNotRefresh || false);
      this._reset();
    },

    _findCenterPoint: function (graphic) {
        var geometry = graphic.geometry || graphic;
        var point;
        switch (geometry.type) {
        case "point":
            point = geometry;
            break;
        case "polyline":
            var pathLength = geometry.paths[0].length;
            point = geometry.getPoint(0, Math.ceil(pathLength / 2));
            break;
        case "polygon":
            var lastRing = geometry.rings.length - 1;
            var lastPoint = geometry.rings[lastRing].length - 1;
            point = geometry.getPoint(lastRing, lastPoint);
            break;
        }
        return this._settings.map.toScreen(point);
    },

    _hideAttributeInspector: function () {
        if (!this._customAttributeInspector && this._settings.map.popup) {
            this._settings.map.popup.hide();
        }
    },

    _toPolylines : function(polygons) {
        var polylines = array.map(polygons, function(polygon) {
          var polyline = new Polyline(polygon.spatialReference);
          array.forEach(polygon.rings, function(ring) { 
            polyline.addPath(ring); 
          });
          return polyline;
        });
        return polylines;
   },

    _isNotesFeature: function (feature) {
        var layer = feature.getLayer();
        var types = layer ? layer.types || null : null;
        if (!types) {
            return false;
        }
        var typeId = feature.attributes[layer.typeIdField];
        var templates;
        array.some(types, function(type){ 
          if (type.id === typeId) {
              templates = type.templates;
              return true;
          }
          return false; 
        });
        
        if (!templates) {
            return false;
        }
        var template = templates[0] || null;
        if (!template) {
            return false;
        }
        var drawingTool = this._isShapeTool(template.drawingTool) || null;
        return drawingTool ? true : false;
    },
    
    _isValidLayer: function(layer){
      var i;
      var lInfos = this._settings.layerInfos;
      for (i = 0; i < lInfos.length; i++) {
        var validLayer = lInfos[i];
        if (layer.id == validLayer.layerId) {
          return true;
        }
      }
      return false;
    },

    _isShapeTool: function (drawingTool) {
        switch (drawingTool) {
        case FeatureTemplate.TOOL_ARROW:
            return Draw.ARROW;
        case FeatureTemplate.TOOL_LEFT_ARROW:
            return Draw.LEFT_ARROW;
        case FeatureTemplate.TOOL_RIGHT_ARROW:
            return Draw.RIGHT_ARROW;
        case FeatureTemplate.TOOL_UP_ARROW:
            return Draw.UP_ARROW;
        case FeatureTemplate.TOOL_DOWN_ARROW:
            return Draw.DOWN_ARROW;
        case FeatureTemplate.TOOL_CIRCLE:
            return Draw.CIRCLE;
        case FeatureTemplate.TOOL_ELLIPSE:
            return Draw.ELLIPSE;
        case FeatureTemplate.TOOL_TRIANGLE:
            return Draw.TRIANGLE;
        case FeatureTemplate.TOOL_RECTANGLE:
            return Draw.RECTANGLE;
        default:
            return null;
        }
    },

    _toDrawTool: function (drawingTool, layer) {
        var geometryType = layer.geometryType;
        switch (drawingTool) {
        case FeatureTemplate.TOOL_POINT:
            return Draw.POINT;
        case FeatureTemplate.TOOL_ARROW:
            return Draw.ARROW;
        case FeatureTemplate.TOOL_LEFT_ARROW:
            return Draw.LEFT_ARROW;
        case FeatureTemplate.TOOL_RIGHT_ARROW:
            return Draw.RIGHT_ARROW;
        case FeatureTemplate.TOOL_UP_ARROW:
            return Draw.UP_ARROW;
        case FeatureTemplate.TOOL_DOWN_ARROW:
            return Draw.DOWN_ARROW;
        case FeatureTemplate.TOOL_CIRCLE:
            return Draw.CIRCLE;
        case FeatureTemplate.TOOL_ELLIPSE:
            return Draw.ELLIPSE;
        case FeatureTemplate.TOOL_TRIANGLE:
            return Draw.TRIANGLE;
        case FeatureTemplate.TOOL_RECTANGLE:
            return Draw.RECTANGLE;
        case FeatureTemplate.TOOL_LINE:
            return Draw.POLYLINE;
        case FeatureTemplate.TOOL_POLYGON:
            return Draw.POLYGON;
        case FeatureTemplate.TOOL_FREEHAND:
            if (geometryType === "esriGeometryPolyline") {
                return Draw.FREEHAND_POLYLINE;
            } else {
                return Draw.FREEHAND_POLYGON;
            }
            break;
        default:
            //No drawTool specified, pick a default for them
            var drawType = Draw.POINT;
            if (geometryType === "esriGeometryPolyline") {
                drawType = Draw.POLYLINE;
                if (this._settings.createOptions.polylineDrawTools[0] === Editor.CREATE_TOOL_FREEHAND_POLYLINE) {
                    drawType = Draw.FREEHAND_POLYLINE;
                }
            } else if (geometryType === "esriGeometryPolygon") {
                drawType = Draw.POLYGON;
                if (this._settings.createOptions.polygonDrawTools[0] === Editor.CREATE_TOOL_FREEHAND_POLYGON) {
                    drawType = Draw.FREEHAND_POLYGON;
                }
            }
            return drawType;
        }
    },

    _isModified: function () {
        var status = this._editToolbar.getCurrentState();
        return ((status.isModified || this._attributeChanged) && status.graphic) ? status.graphic :  null;
    },
    
    _showInfoWindow: function(point, anchor){      
      if (!this._customAttributeInspector){                   
        this._settings.map.popup.show(point, anchor);
      }
    }
  });

  lang.mixin(Editor, {
      CREATE_TOOL_POLYLINE: "polyline", CREATE_TOOL_FREEHAND_POLYLINE: "freehandpolyline", CREATE_TOOL_POLYGON: "polygon", CREATE_TOOL_FREEHAND_POLYGON: "freehandpolygon",
      CREATE_TOOL_AUTOCOMPLETE: "autocomplete", CREATE_TOOL_RECTANGLE: "rectangle", CREATE_TOOL_TRIANGLE: "triangle", CREATE_TOOL_CIRCLE: "circle",
      CREATE_TOOL_ELLIPSE: "ellipse", CREATE_TOOL_ARROW: "arrow", CREATE_TOOL_UP_ARROW: "uparrow", CREATE_TOOL_DOWN_ARROW: "downarrow", CREATE_TOOL_RIGHT_ARROW: "rightarrow", CREATE_TOOL_LEFT_ARROW: "leftarrow"
  });

  

  return Editor;
});
