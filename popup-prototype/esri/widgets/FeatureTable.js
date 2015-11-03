define([
  "dojo/aspect",
  "dojo/on",
  "dojo/Evented",
  "dojo/number",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  
  "dojo/text!./FeatureTable/templates/FeatureTable.html",
  "dojo/i18n!../nls/jsapi",
  "dojo/store/Cache",
  "dojo/store/Memory",
  "dojo/store/Observable",
  "dojo/string",

  "dojo/dom-construct",
  "dojo/dom-class",
  
  "dojo/fx/Toggler",
  
  "dijit/_WidgetBase",
  "dijit/_OnDijitClickMixin",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  
  "dijit/Dialog",
  "dijit/Menu",
  "dijit/MenuItem",
  "dijit/form/DropDownButton",

  "dijit/form/TimeTextBox",
  "dijit/form/DateTextBox",

  "dijit/form/Button",	

  "dgrid/OnDemandGrid",
  "dgrid/Selection",
  "dgrid/Keyboard",
  "dgrid/Editor",
  "dgrid/extensions/DijitRegistry",
  "dgrid/extensions/ColumnHider",
  "dgrid/extensions/ColumnResizer",
  
  "../core/lang",
  "../config",
 
  "../geometry/Extent",
  "../layers/FeatureLayer",

  "../tasks/support/Query",
  "../tasks/support/StatisticDefinition",
  "../tasks/QueryTask",
  
  "./FeatureLayerQueryStore",
  
  "dijit/layout/BorderContainer", // Do these need to be imported?
  "dijit/layout/ContentPane",
  
  "dojo/query!css2",
  "dojo/domReady!"
], function (
  aspect, on, Evented, number, declare, lang, array,
  template, i18n, Cache, Memory, Observable, string, domConstruct, domClass,
  Toggler,
  _WidgetBase, _OnDijitClickMixin, _TemplatedMixin,  _WidgetsInTemplateMixin, 
  Dialog, Menu, MenuItem, DropDownButton, TimeTextBox, DateTextBox,
  Button,
  OnDemandGrid, Selection, Keyboard, Editor, DijitRegistry, ColumnHider, ColumnResizer,
  esriLang, esriConfig,
  Extent, FeatureLayer, Query, StatisticDefinition, QueryTask,
  FeatureLayerQueryStore, BorderContainer, ContentPane
) {
    
    var Widget = declare([_WidgetBase, _OnDijitClickMixin, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

    // Default Properties
    baseClass:'esriFeatureTable',
    basePath: require.toUrl("esri/widgets/FeatureTable/"),
    loaded:false,
    templateString: template,
    widgetsInTemplate:true,
    i18n: i18n,
    
    // Dynamic Public Properties
    // --- Data
    map: null,

    idProperty: "id",
    columns: [],
    dataStore: null,
    grid: null,
    gridMenu: null,

    _featureSet: null,
    
    // Constructor Properties
    featureLayer: null,
    currentLayer: null,
    dateOptions: {
      "timeEnabled" : false,
      "timePattern" :  "HH:mm:ss",
      "datePattern" : "YYYY-MM-DD"
    },

    hiddenFields: [],
    outFields: ["*"],
    readOnly: false,
    
    // Grid Constructor Options
    gridOptions: {},
    noDataMessage: "No Data",
    allowSelectAll: false,
    cellNavigation: false,
    selectionMode: "extended",
    
    _layerInfo: {},
    _editorTrackingInfos: {},
    
    _gridHeaderText: "${gridTitle} (${featureCount} features, ${featureSelectedCount} selected)",
    _gridTitle: "Placeholder",
    _featureCount: 0,
    _featureSelectedCount: 0,
    _currentSelectedRows: [],
    _currentSelectedRowIds: [],
    _filteredRowIds: [],
    
    disableLayerClick: true,
    syncSelection: true, //unused
    updateLayerSelection: false,
    
    _batchCount: 0,
    _defaultBatchCount: 25,
    _defaultFeatureCount: 2000,
    
    _toggler: null,
    
    constructor: function (options, srcRefNode) {
      declare.safeMixin(this, options);
      
      if(!srcRefNode){
        return;
      }

      // -- DOM node ID assignment
      this.gridId = srcRefNode + "_grid";
      this.bcNodeId = srcRefNode + "_bcNode";
      this.gridMenuId = srcRefNode + "_gridMenu";
      this.gridContainerId = srcRefNode + "_gridContainer";
      this.optionNodeId = srcRefNode + "_optionNode";
      
      // Grid Declaration
      this.StandardGrid = declare([DijitRegistry, OnDemandGrid, Selection, Keyboard, ColumnHider, ColumnResizer]);
      
      // All Event Listeners and Handles
      this._listenerHandles = [];
      
      // Constructor Params
      this.currentLayer = options.featureLayer || null;
      this.map = options.map || null;
      this.dateOptions = options.dateOptions || this.dateOptions;
      this.hiddenFields = options.hiddenFields || [];
      this.readOnly = options.readOnly || false;
      
      // Public Properties
      if(options.gridOptions){
        this.gridOptions = options.gridOptions || {};
        this.noDataMessage = options.gridOptions.noDataMessage ||this.noDataMessage;
        this.allowSelectAll = options.gridOptions.allowSelectAll ||this.allowSelectAll;
        this.cellNavigation = options.gridOptions.cellNavigation ||this.cellNavigation;
        this.selectionMode = options.gridOptions.selectionMode ||this.selectionMode;
      }
      
    }, // End constructor

    // Purpose:
    // -- Internal Map Check
    postCreate: function () {
      this.inherited(arguments);  
      // Hook up Map Interaction Events
      if(this.map){
        on(this.map, "load", lang.hitch(this, function(){
          // Why is this commented out? -Jon
          //this._listenerHandles.push(this._layerClickEvent());
        }));
      }

    }, 

    // Purpose:
    // -- Required step by the end-user to bring the widget to life
    startup: function (){
      // If layer already contains an error, bail out
      if(this.currentLayer && this.currentLayer.loadError){
         this._showLoadError(this.currentLayer.loadError.message);
        return;
      }
      
      this.inherited(arguments);
      // Check if the Feature Layer is loaded
      // Do not continue startup process until layer is loaded
      if (this.domNode && this.currentLayer.loaded) {
        this._init();
      }else{
        
        // When the Feature Layer is loaded, build the widget
        on(this.currentLayer, "load", lang.hitch(this, function(){
          this._init();
        }));
        
        // For Feature Layer load errors
        on(this.currentLayer, "error", lang.hitch(this, function(){
          if(this.currentLayer.loadError){
            this._showLoadError(this.currentLayer.loadError.message);
          }else{
            this._showLoadError("");
          }
        }));
        
      }
    }, 

    // Purpose:
    // -- Obliterate the Widget!
    destroy: function (){
    
      // Remove Event Handlers
      array.forEach(this._listenerHandles, function(handle){
        handle.remove();
      });
      
     // Handle the Map
      if(this.map){
        this.map.popup.clearFeatures();
        this.map.popup.hide();
      }
      this.map = null;
      
      // Required in case the grid gets recreated in the application context
      if(this.grid){
        this.grid._destroyColumns();
        this.grid.destroy();
      }
      
      this._bcNode.destroyRecursive();
      
      // Do Not Remove
      delete this.columns;
      delete this._layerInfo;    
            
      // Nullify Important Properties
      this.grid = null;
      this.columns = null;     
      this.dataStore = null;   
      this.gridMenu = null;
      this.currentLayer = null;
      this.featureLayer = null;
      this.dateOptions = null;
      this.idProperty = null;
      this.hiddenFields = null;
      this.params = null;
      this._featureSet = null;

      this.inherited(arguments);  

    },

    // Purpose:
    // -- public implementation of private _resize() method
    // -- resizes application
    resize: function(){
      this._resize();
    },
    
    ///////////////////
    // Private Functions 
    ///////////////////
    // Purpose:
    // -- 
    // Params:
    // -- 
    // Returns:
    // --  
    _init: function(){

        // Shamelessly taken from AttributeInspector.js 
        // Specify a userID for each layer
        this._userIds = {};
        var layerId = this.currentLayer.id;
        if (this.currentLayer.credential) {
          this._userIds[layerId] = this.currentLayer.credential.userId;
        }
        if (this._layerInfo.userId) {
          this._userIds[layerId] = this._layerInfo.userId;
        }
        
        // Connect events - LEGACY STYLE
        // TODO - RECONNECT FOR EDITING
        //this._connect(fLayer, "onSelectionComplete", lang.hitch(this, "onLayerSelectionChange", this._layerInfo));
        //this._connect(fLayer, "onSelectionClear", lang.hitch(this, "onLayerSelectionClear", this._layerInfo));
        //this._connect(fLayer, 'onEditsComplete', lang.hitch(this, 'onLayerEditsComplete', this._layerInfo));
        this._layerInfo.showAttachments = this.currentLayer.hasAttachments ? (esriLang.isDefined(this._layerInfo.showAttachments) ? this._layerInfo.showAttachments : true) : false;
        //this._layerInfo.hideFields = this._layerInfo.hideFields || [];
        //this._layerInfo.htmlFields = this._layerInfo.htmlFields || [];
        this._layerInfo.isEditable = this.currentLayer.isEditable() ? (esriLang.isDefined(this._layerInfo.isEditable) ? this._layerInfo.isEditable : true) : false;
        this._layerInfo.typeIdField =  this.currentLayer.typeIdField;
        this._layerInfo.layerId = this.currentLayer.id;
        this._layerInfo.types = this.currentLayer.types;
        this._layerInfo.fields = this.currentLayer.fields;
        this._layerInfo._fieldInfo = [];
        this._layerInfo._features = [];
        
        this._getEditingInfo();


      // Get the Unique ID used for Store Sorting/Querying/Filtering
      this.idProperty =  this.currentLayer.objectIdField;

      // Create the Grid
      this.grid = this._initGrid();
      this.grid.startup();
      this.grid.resize();
      
      // --- Grid Events
      this._listenerHandles.push(this._gridSelectEvent());
      this._listenerHandles.push(this._gridDeselectEvent());
      this._listenerHandles.push(this._gridRefreshEvent());
      
      // Create the Menu
      this._createTableMenu();
      
      //Create Table Open/Close Toggle
      this._toggler = this._createTableToggle();
      this._listenerHandles.push(this._tableToggleClickEvent());
      
      // Check if the FeatureLayer supports StatisticDefinition calls
      this._listenerHandles.push(this._columnClickEvent());
      
      // Widget Load Event
      this.loaded = true;
      this.emit("load", this.loaded);

      // Loading Indicators (Message & Spinner)
      this.grid.noDataMessage = "";
      this._gridHeaderNode.innerHTML = "Loading Feature Data...";
      
      // Grid State 
      this._resize();
      //this.grid.refresh();

      // Start the Spinner
      this._toggleLoadingIndicator(true);

      // Get Data from the FeatureLayer
      this._getFeatureCount().then(lang.hitch(this, this._queryFeatureLayer));
      this._listenerHandles.push(this._layerClickEvent()); 

      
    }, // End _init()
    
    selectRows: function(selectionData){
    
      var rowObjs = [], 
        graphicIds = [], 
        id;
        
      this.grid.clearSelection();

      if(selectionData[0] && selectionData[0].declaredClass === "esri.Graphic"){
        array.forEach(selectionData, lang.hitch(this, function(feature){
          graphicIds.push(feature.attributes[this.idProperty]);
        }));
        selectionData = graphicIds;
      }

      if(selectionData.length === 1){
        id = selectionData[0];
        // Get the Row object and its index based on selected idProperty
        var rowObj = this.dataStore.get(selectionData);
        var rowIndex = this.dataStore.data.indexOf(rowObj);
        // Select the Row based on its idProperty
        this.grid.select(id);
        // Update Grid
        this._updateGridSelection([rowObj]);
        // Update Header
        this._updateGridHeaderText();
        // Roughly calculate the Height to scroll
        // NOTE : Some rows will be taller than this based on the contents of a specific row
        this.grid.scrollTo({"x" : 0, "y": (this.grid.rowHeight * rowIndex)});
        // Scroll directly to that Row
        if(this.grid.row(id).element){
          this.grid.row(id).element.scrollIntoView();
        }
      }else{
        // Many
        array.forEach(selectionData, lang.hitch(this, function(rowId){
          rowObjs.push(this.dataStore.get(rowId));
        }));
        this._updateGridSelection(rowObjs);
        this._updateGridHeaderText();
      }

    },
    
   // Purpose:
    // -- 
    // Params:
    // -- 
    // Returns:
    // --  
    _layerClickEvent: function(){
    
      var listener = on(this.currentLayer, "click", lang.hitch(this, function(evt){
        
        if(this.disableLayerClick){
        return;
        }
        
        if (evt.graphic) {
          // Graphics have attributes, do selection
          if (evt.graphic.attributes) {  
            // Check if Graphic has an ID
            if (evt.graphic.attributes[this.idProperty]) {
            
              // Variable References
              var graphicObj = evt.graphic;
              var id = graphicObj.attributes[this.idProperty];
              // Create a Query based on the selected graphic id
              var query = new Query();
              query.returnGeometry = (this.map) ? true : false;
              query.objectIds = [id];
              
              // Query the FeatureLayer
              this.currentLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this, function(result){
                
                // Checks if selected Graphic belongs to the featureLayer
                if(result.length){
                 
                 // Show Selection on Map
                  if(this.map){
                    // Calculate Center
                    var center = this._calcGraphicsExtent(result).getCenter();
                    this.map.centerAt(center).then(lang.hitch(this, function(){
                      this.map.popup.setFeatures(result);
                      //this.map.popup.show(center);
                    }));
                  }
                  
                  // Get the Row object and its index based on selected idProperty
                  var rowObj = this.dataStore.get(id);
                  var rowIndex = this.dataStore.data.indexOf(rowObj);
                  // Clear the current selection
                  this.grid.clearSelection();
                  // Select the Row based on its idProperty
                  this.grid.select(id);
                  // Update Grid
                  this._updateGridSelection([rowObj]);
                  // Update Header
                  this._updateGridHeaderText();
                  // Roughly calculate the Height to scroll
                  // NOTE : Some rows will be taller than this based on the contents of a specific row
                  this.grid.scrollTo({"x" : 0, "y": (this.grid.rowHeight * rowIndex)});
                  // Scroll directly to that Row
                  if(this.grid.row(id).element){
                    this.grid.row(id).element.scrollIntoView();
                  }
                }
              }));
            }
          }
        }
      }));
      return listener;
    }, // End _layerClickEvent()
    
    filterSelectedRecords: function(toggle){
      if(toggle){
        this._showSelectedRecords();
      }else{
        this.grid.set("query", {});
      }
    
    },
    
    // Purpose:
    // -- 
    // Params:
    // -- 
    // Returns:
    // --  
    _selectFeatures: function(){
    
    }, // End _selectFeatures()
    
    // Purpose:
    // -- 
    // Params:
    // -- 
    // Returns:
    // --  
    _updateGridSelection: function(rowArray){
      // Check if update or reset
      if(rowArray){
        // Update
        this._currentSelectedRowIds = [];
        this._currentSelectedRows = rowArray;
        this._featureSelectedCount = rowArray.length;
        // Loop for ID array
        array.forEach(rowArray, lang.hitch(this, function(row){
          this._currentSelectedRowIds.push(row[this.idProperty]);
        }));
      }else{
        // Reset
        this._currentSelectedRowIds = [];
        this._currentSelectedRows = [];
        this._featureSelectedCount = 0;
      }
    }, // End _updateGridSelection()
    
    // Purpose:
    // -- 
    // Params:
    // -- 
    // Returns:
    // --  
    _showInfoWindow: function(){
    
    },
    
    // Purpose:
    // -- 
    // Params:
    // -- 
    // Returns:
    // --  
    _hideInfoWindow: function(){
    
    },
    
    // Purpose:
    // -- 
    // Returns:
    // --  
    _getEditingInfo: function(){
    
        var editorTrackingFields = [];
        // 
        if (this.currentLayer.editFieldsInfo){
          if (this.currentLayer.editFieldsInfo.creatorField) {
            editorTrackingFields.push(this.currentLayer.editFieldsInfo.creatorField);
          }
          if (this.currentLayer.editFieldsInfo.creationDateField) {
            editorTrackingFields.push(this.currentLayer.editFieldsInfo.creationDateField);
          }
          if (this.currentLayer.editFieldsInfo.editorField) {
            editorTrackingFields.push(this.currentLayer.editFieldsInfo.editorField);
          }
          if (this.currentLayer.editFieldsInfo.editDateField) {
            editorTrackingFields.push(this.currentLayer.editFieldsInfo.editDateField);
          }
        }
        
        // Save Information 
        this._editorTrackingInfos[this.currentLayer.id] = editorTrackingFields;
      
    },
    
    // Purpose:
    // -- Event Triggers when the grid is refreshed
    // Returns:
    // --  grid refresh handler (Object)
    _gridRefreshEvent:function(){
      var listener = on(this.grid, "dgrid-refresh-complete", lang.hitch(this, function(evt){
        // Has Columns
        if(this.grid.columns[0]){
          this.emit("dgrid-refresh-complete", evt);
        }
      }));
      return listener;
    },
    
    // Purpose:
    // -- Event Trigger when grid row is selected
    // Returns:
    // --  grid select handler (Object)
    _gridSelectEvent: function(){
    
      var listener = on(this.grid, "dgrid-select", lang.hitch(this, function(evt){
        
        this.emit("dgrid-select", evt.rows);
        
        // Get Selected Rows/Features
        var featureArray = [];
        array.forEach(evt.rows, lang.hitch(this, function(row){
          featureArray.push(row.data);
        }));
        
        // Update Selection
        this._updateGridSelection(featureArray);
        this._updateGridHeaderText();
        
        // Show Features on the Map
        if(this.map){
          // Reset InfoWindow
          this.map.popup.clearFeatures();
          this.map.popup.hide();
          
          // Create the Query
          var query = new Query();
          query.returnGeometry = (this.map) ? true : false;
          query.objectIds = this._currentSelectedRowIds;
          
          if(this.updateLayerSelection){
            // Run Query
            //this._featureLayer.selectFeatures
            this.map.getLayer(this.currentLayer.id).selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this, function(featureSet){
              if(featureSet.length){
                // Calculate Center
                var center = this._calcGraphicsExtent(featureSet).getCenter();
                this.map.centerAt(center).then(lang.hitch(this, function(){
                  this.map.popup.setFeatures(featureSet);
                  //this.map.popup.show(center);
                }));
              }
            }));
          }
        }
        
      }));
      return listener;   
    },
    
    // Purpose:
    // -- Event Trigger when grid row is deselected
    // Returns:
    // --  grid deselect handler (Object)
    _gridDeselectEvent: function(){
      var listener = on(this.grid, "dgrid-deselect", lang.hitch(this, function(evt){
        this.emit("dgrid-deselect", evt.rows);
        // Update Selection 
        // NOTE : _updateGridSelection call is possibly redundant
        this._updateGridSelection();
        this._updateGridHeaderText();
        
      }));
      return listener;   
    },
    
    // Purpose:
    // -- Gets the total number of features from the feature layer
    // Returns:
    // -- count (Integer) representing total number of features
    _getFeatureCount: function(){
    
      var query = new Query();
      query.returnGeometry = false;
      query.returnIdsOnly = false;
      query.where = "1=1";
      esriConfig.request.timeout = 10000;
      
      return this.currentLayer.queryCount(query).then(lang.hitch(this, function(count) {
        // Default
        esriConfig.request.timeout = 60000;
        this._featureCount = count;
        return count;
      }), function(){
        // Error
        esriConfig.request.timeout = 60000;
        this._featureCount = this._defaultFeatureCount;
        console.log("Could not get feature count. Defaulting to 2000 features");
        return null;
      });

    },
    
    // Purpose:
    // -- Queries the Feature Layer for Features
    // -- Triggers Store building process
    _queryFeatureLayer: function(){

      // Query Definition
      var query = new Query();
      query.where = "1=1";
      query.outFields = this.outFields;
      query.returnGeometry = false;

      // Original implementation did not handle query errors gracefully
      // -- this.currentLayer.queryFeatures(query).then(lang.hitch(this, function(featureSet) { }));
      this.currentLayer.queryFeatures(query, lang.hitch(this, function(featureSet){

        var maxCount = esriLang.isDefined(this.currentLayer.maxRecordCount) ? this.currentLayer.maxRecordCount : 1000;
        this._batchCount = Math.min(maxCount, this._defaultBatchCount);
          
        // Hide the Loading Indicator
        this._toggleLoadingIndicator(false);
        this.grid.noDataMessage = this.noDataMessage;
        // Data
        this._featureSet = featureSet;
        
        // Columns
        this._generateColumnsFromFields(featureSet.fields);
        this.grid.set("columns", this.columns);

        // Update Text
        this._updateGridHeaderText();
        
        // Check if FeatureLayer has more Features than returned in the Query
        if(featureSet.exceededTransferLimit){
          this._generateCacheStore();
        }else{
          this._generateMemoryStore(featureSet.features);
        }

        // Save Feature Info for Application State       
        this._layerInfo._features = featureSet.features;
        this.grid.set("store", this.dataStore); 
        
      }), (lang.hitch(this, function(err){
        // Display Error Message
        this._showLoadError(err.message);
      })));
      

    },
    
    
    // Purpose:
    // -- Generates Columns Object based on featureLayer.fields
    // -- fieldsArray contains information about each field on a given layer
    // -- the field information is used to determine how to present the data (editable, hidden etc)
    // Params:
    // -- Array of Fields (Objects)
    _generateColumnsFromFields: function(fieldArray){
      var columnArray = [];
      array.forEach(fieldArray, lang.hitch(this, function(field, idx){

        // Get Type & Domain
        var isTypeIdField = ((this._layerInfo.typeIdField) && (field.name === this._layerInfo.typeIdField)) || false;
        var isDomainField = (this.currentLayer.fields[idx].domain) || false;

        // Hidden?
        var isHidden = (array.indexOf(this.hiddenFields, field.name) !== -1) || (field.type === "esriFieldTypeOID" || field.type === "esriFieldTypeGlobalID") || (array.indexOf(this._editorTrackingInfos[this.currentLayer.id], field.name) !== -1);
        // Editable?
        var isEditable = (this._layerInfo.isEditable && (this._layerInfo.isEditable && field.name !== this.idProperty) && this.readOnly === false);
        // Nullable?
        var isNullable = this.currentLayer.fields[idx].nullable || false;
        // Date Field?
        var isDate = (field.type === "esriFieldTypeDate");
        
        this._layerInfo._fieldInfo[idx] = {
          "idx": idx,
          "name": field.name,
          "type": field.type,
          "isDomainField": isDomainField,
          "isTypeIdField": isTypeIdField,
          "isHidden": isHidden,
          "isEditable": isEditable,
          "isNullable": isNullable,
          "isDate": isDate        
        };

        if(isDate){
        
          if(!isEditable){
            // Not Editable, Show as a String
           columnArray.push(this._generateDateTimeColumn(field, this._layerInfo._fieldInfo[idx]));
          }else{
          
            if(this.dateOptions.timeEnabled){
              // Show Both Date and Time Editor Digits
              columnArray.push(this._generateDateTimeEditorColumn(field, this._layerInfo._fieldInfo[idx]));
            }else{
              // Show Only Date Editor Digit
              columnArray.push(this._generateDateTimeEditorColumn(field, this._layerInfo._fieldInfo[idx]));
            }
            
          }
          
        }else if(isDomainField){
        
            columnArray.push({
              "label" : field.alias,
              "field" : field.name,
              "type": field.type, 
              "hidden": isHidden,
              "get": lang.hitch(this, function(obj){
                  var value = this._findFirst(this.currentLayer.fields[idx].domain.codedValues, "code", obj[field.name]);
                  return (value !== null) ? value.name : null;
              })
            });
        
        
        }else if(isTypeIdField){
        
            columnArray.push({
              "label" : field.alias,
              "field" : field.name,
              "type": field.type, 
              "hidden": isHidden,
              "get": lang.hitch(this, function(obj){
                // Convert Unix Timestamp to Javascript Date Object
                var value = this._findFirst(this._layerInfo.types, "id", obj[field.name]);
                return (value !== null) ? value.name : null;
              })
            });
            
        }else{
        // Not A Date, Domain or Type Field
        // Still need to check for codedType value 
          columnArray.push({
              "label" : field.alias,
              "field" : field.name,
              "type": field.type, 
              "hidden": isHidden,
              "get": lang.hitch(this, function(obj){
                     
                 // Checks to see if this field has a domain in the types array of the FeatureLayer
                  var codedType, typeCheck = this._findFirst(this._layerInfo.types, "id", obj[this._layerInfo.typeIdField]);
                  
                  // If Coded Values are found...
                  if(typeCheck && typeCheck.domains && typeCheck.domains[field.name] && typeCheck.domains[field.name].codedValues){
                    codedType = this._findFirst(typeCheck.domains[field.name].codedValues, "code", obj[field.name]);
                  }
                  
                  return codedType ? codedType.name : obj[field.name];
                  
              })
            });

        }// end if/else loop

      }));
      this.columns = columnArray;
    },
    
    // Purpose:
    // -- 
    // Params:
    // -- field is the field object with name, alias, length etc (Object)
    // -- fieldInfo is this._layerInfo._fieldInfo[columnIdx] (Object)
    // Returns:
    // -- 
    _generateDateTimeColumn: function(field, fieldInfo){

       var columnDefinition = {
          "label" : field.alias,
          "field" : field.name,
          "type": field.type,
          "hidden": fieldInfo.isHidden,
          "get": lang.hitch(this, function(obj){
            // Convert Unix Timestamp to Javascript Date Object
            var value = (obj[field.name] === '') ? null : new Date(obj[field.name]);
            if(!this.dateOptions.timeEnabled){
              value = value.toDateString();
            }
            return value;
          })
        };
        return columnDefinition;
    },

    // Purpose:
    // -- 
    // Params:
    // -- field is the field object with name, alias, length etc (Object)
    // -- fieldInfo is this._layerInfo._fieldInfo[columnIdx] (Object)
    // Returns:
    // -- 
    _generateDateTimeEditorColumn: function(field, fieldInfo){
     
      var columnDefinition;
      
      // Show Both Date and Time Text Editing Dijits
      if(this.dateOptions.timeEnabled){
      
       columnDefinition = {
          "label" : field.alias,
          "field" : field.name,
          "type": field.type, 
          "hidden": fieldInfo.isHidden,
          "get": lang.hitch(this, function(obj){
            // Convert Unix Timestamp to Javascript Date Object
            return (obj[field.name] === '') ? null : new Date(obj[field.name]);
          }),
          "renderCell" : lang.hitch(this, function(object, value, node, options) {
          
            // Create the DateTextBox widget
            var dateWidget = new DateTextBox({
              "value": value,
              "datePattern" : this.dateOptions.datePattern
            });
            dateWidget.placeAt(node);
            
            // Create the TimeTextBox widget
            var timeWidget = new TimeTextBox({
              "value": value, 
              "timePattern" : this.dateOptions.timePattern
            });
            timeWidget.placeAt(node);
            //timeWidget.on("data-change", function(){});
          })
        };
        
      }else{
      
        // No Time Dijit Required
        columnDefinition = Editor({
          "label" : field.alias,
          "field" : field.name,
          "type": field.type,
          "hidden": fieldInfo.isHidden,
          "get": lang.hitch(this, function(obj){
            // Convert Unix Timestamp to Javascript Date Object
            return (obj[field.name] === '') ? null : new Date(obj[field.name]);
          })
        }, DateTextBox);

      }
      // Return the column object for the given Date field
      return columnDefinition;
    },
    
    // Purpose:
    // -- 
    // Params:
    // -- 
    _generateCacheStore: function(){
    
      var qtStore = new FeatureLayerQueryStore({
        layer: this.currentLayer,
        objectIds: null, // null for hosted FS that support server side paging
        totalCount: this._featureCount,
        batchCount: this._batchCount,
        where: "1=1",
        orderByFields: ""
      });

      var mStore = new Memory();
      this.dataStore = new Cache(qtStore, mStore, {});   
    },
    
    // Purpose:
    // -- generates the data-store for the dGrid using a Memory Object
    // -- each store item is represented by a feature's attributes
    // Params:
    // -- Array of Features (ideally from a FeatureLayer or FeatureCollection)
    _generateMemoryStore: function(featureArray){
      var attributeArray = [];
      // Loop through Features and get attributes 
      array.forEach(featureArray, lang.hitch(this, function(feature){
          attributeArray.push(feature.attributes);
      }));
      // Create the Store
      this.dataStore = new Observable(new Memory({"data": attributeArray, "idProperty": this.idProperty}));
    },
    
    // Purpose:
    // -- Creates & returns the grid
    // Returns:
    // --  grid Object (which is set to this.grid)
    _initGrid: function(){
      // Create the Store
      this.dataStore = new Observable(new Memory({"data": null, "idProperty": this.idProperty}));
      // Create the Grid
      var grid = new this.StandardGrid({
        store: this.dataStore,
        columns: this.columns,
        noDataMessage: this.noDataMessage,
        selectionMode: this.selectionMode,
        allowSelectAll: this.allowSelectAll,
        cellNavigation: this.cellNavigation
      }, this.gridId);
      
      // Handles destroying extra widgets
      // -- Potential Memory Leaks 
      aspect.before(grid, "removeRow", lang.hitch(this, function(rowElement){
        array.forEach(this.columns.length, lang.hitch(this, function(col, idx){
          var cellElement = grid.cell(rowElement, idx).element,
          widget = (cellElement.contents || cellElement).widget;
          if(widget){ widget.destroyRecursive(); }
        }));
      }));
      
      // Disconnects Header Sort Handler from Grid.js 
      aspect.after(grid, "renderHeader", lang.hitch(this, function(){
        grid._sortListener.remove();
      }));

      return grid;
    },
    
    // Purpose:
    // -- Resize the Application
    _resize: function(){
      this._bcNode.resize();
      this._gridMenu.resize();
      this._gridContainer.resize();
      if(this.grid){
        this.grid.resize();
      }
    },
    
    // Purpose:
    // -- Updates Grid Header Text with Feature and Selection Count
    _updateGridHeaderText: function(){
      this._gridHeaderNode.innerHTML =  string.substitute(this._gridHeaderText, { 
        "gridTitle": this.currentLayer.name, 
        "featureCount": this._featureCount, 
        "featureSelectedCount": this._featureSelectedCount
      });
    },
    
    // Purpose:
    // -- When a Column is clicked, show the Menu
    // Returns:
    // --  Click event for column header menu
    _columnClickEvent: function(){
      return on(this.grid, ".dgrid-header .dgrid-cell:click", lang.hitch(this, this._showColumnMenu));
    },
    
    // Purpose:
    // -- Column Menu Generator 
    // Params:
    // -- evt (right-click event object)
    _showColumnMenu: function(evt){

      // Store reference to previous Menu so we can properly destroy it
      // Fixes Memory Leak Issue from the Viewer logic 
      if(this.columnMenu){ 
        this._oldColumnMenu = this.columnMenu;
        this.columnMenu = null;
      }
      
      // Create the Menu
      this.columnMenu = new Menu({});
      
      // Selected Column ID and FieldType (for Statistics MenuItem)
      var cell = this.grid.cell(evt);
      var columnId = cell.column.id;
      var fieldType = this.columns[columnId].type;

      // Static Menu Options
      var labelArray = [i18n.widgets.FeatureTable.sortAsc, i18n.widgets.FeatureTable.sortDesc];
      var iconArray = ["iconSortAscending", "iconSortDescending"];
      var functionArray = [this._sortAscending, this._sortDescending];
      
      // Generate the Menu
      array.forEach(labelArray, lang.hitch(this, function (name, index) {
        var menuItem = new MenuItem({
          label: name,
          iconClass: iconArray[index],
          baseClass: "esriFeatureTable_menuItem",
          onClick: lang.hitch(this, functionArray[index], columnId)
        });
        this.columnMenu.addChild(menuItem);
      }));
      
      if(this.currentLayer.supportsStatistics){
        // Dynamic Menu Option
        if (fieldType === "esriFieldTypeDouble" || fieldType === "esriFieldTypeSingle" || fieldType === "esriFieldTypeInteger" || fieldType === "esriFieldTypeSmallInteger"){
          var menuItem = new MenuItem({
            label: "Statistics",
            iconClass: "iconTableStatistics",
            baseClass: "esriFeatureTable_menuItem",
            onClick: lang.hitch(this, this._getColumnStats, columnId)
          });
          this.columnMenu.addChild(menuItem);
        }
      }
      // Start the Menu
      this.columnMenu.startup();

      // Open the Menu
      this.columnMenu._openMyself({
        "target" : evt.target,
        "delegatedTarget" : cell,
        "iframe" : null,
        "coords" : { 
          x: evt.pageX, 
          y: evt.pageY
        }
      });
      
      // Close Even for Menus
      // Fixes Memory Leak Issue from the Viewer logic 
      on(this.columnMenu, "close", lang.hitch(this, function(){
        if(this._oldColumnMenu){
          this._oldColumnMenu.destroyRecursive();
          this._oldColumnMenu = null;
        }
      }));

    },
    
    // Purpose:
    // -- Sort Column Contents in Ascending Order
    _sortAscending: function(columnId, evt){
      this.grid.set("sort", [{ attribute: this.columns[columnId].field, ascending: true }]);
    },    
    
    // Purpose:
    // -- Sort Column Contents in Descending Order
    _sortDescending: function(columnId, evt){
      this.grid.set("sort", [{ attribute: this.columns[columnId].field, descending: true }]);
    },
    
    // Purpose:
    // -- Generates Column Statistics
    // Params:
    // -- columnId (Integer) -- target column to generate statistics for
    // -- evt (Object) -- click event, passed reference
    _getColumnStats: function(columnId, evt){
      
      var fieldName = this.columns[columnId].field;

      var query = new Query();
      query.outFields = [fieldName];
      query.outStatistics = [];
      query.where = "1=1";        
      
      var definitions = ["count", "sum", "min", "max", "avg", "stddev"];
      var definitionNames = ["countField", "sumField", "minField", "maxField", "avgField", "stddevField"];
      
      array.forEach(definitions, lang.hitch(this, function(d, idx){
        var def = new StatisticDefinition();
        def.statisticType = d;
        def.onStatisticField = fieldName;
        def.outStatisticFieldName = definitionNames[idx];
        def.displayFieldName = fieldName;
        query.outStatistics.push(def);
      }));
      
      var ids = [];
      
      // If the Grid is filtered, show statistics based on the filter
      if(this._filteredRowIds.length > 0){
        ids = this._filteredRowIds;
      }
      /*else{
        array.forEach(this._featureSet.features, lang.hitch(this, function(feature){
          ids.push( feature.attributes[this.idProperty] );
        }));
      }
      */
      
      if (query.where && ids.length > 0) {
        query.where = "(" + query.where + ") AND (" + this.idProperty + " IN (" + ids.toString() + "))";
      } 
      /*else {
        query.where = this.idProperty + " IN (" + ids.toString() + ")";
      }
      */

      var queryTask = new QueryTask(this.currentLayer.url);
      
      // Run the Query
      queryTask.execute(query).then(lang.hitch(this, function(result) {
        if (result.features && result.features.length) {
          this._showStatisticsDialog(result, fieldName);
        }
      }), function(err) {
        console.log("Could not get statistics.", err ? err.message: err);
      });

    },
    
    // Purpose:
    // -- Generates the statistics pop-up for column menu
    // Params:
    // -- data (Array) of Features, fieldName (String)
    _showStatisticsDialog: function(data, fieldName){

      // If statisticsDialog is already showing, destroy it
      if(this.statisticsDialog){
        this.statisticsDialog.destroy();
      }
      
      // Get Attributes to run Statistics on
      var attributes = data.features[0].attributes;
      
      // Stat Number Manipulation
      var p = {pattern: "#,###,###,##0.########"};
      
      // Loop Vars
      var definitions = ["count", "sum", "min", "max", "avg", "stddev"];
      var definitionTitles = ["Number of Values", "Sum of Values", "Minimum", "Maximum", "Average", "Standard Deviation"];
      
      // Content Container for Dialog
      var wrapper = domConstruct.create("div", {
        className: "esriAGOTableStatistics",
        innerHTML: ""
      });
      
      // Set Dialog Title
      domConstruct.create("div", {
        className: "header",
        innerHTML: "Field: " + fieldName
      }, wrapper);      
      
      // Create a Horizontal break line
      domConstruct.create("div", {
        className: "hzLine",
        innerHTML: ""
      }, wrapper);    
      
      // Create the Table Node
      var table = domConstruct.create("table", {
        className: "attrTable",
        innerHTML: "",
        style: {
          cellpadding:0, 
          cellspacing:0
        }
      }, wrapper);
      

      var lowerCase = {};
      for (var key in attributes) {
        if (attributes.hasOwnProperty(key)) {
          lowerCase[key.toLowerCase()] = attributes[key];
        }
      }

      var tbody = domConstruct.create("tbody", {}, table);
      
      var tr = domConstruct.create("tr",{valign:"top"},tbody);
      domConstruct.create("td", {"class":"attrName", innerHTML: definitionTitles[0]}, tr);
      domConstruct.create("td", {"class":"attrValue", innerHTML: esriLang.isDefined(lowerCase["countfield"]) ? number.format(lowerCase["countfield"], p) : ""}, tr);
      
      tr = domConstruct.create("tr",{valign:"top"},tbody);
      domConstruct.create("td", {"class":"attrName", innerHTML: definitionTitles[1]}, tr);
      domConstruct.create("td", {"class":"attrValue", innerHTML: esriLang.isDefined(lowerCase["sumfield"]) ? number.format(lowerCase["sumfield"], p) : ""}, tr);
      
      tr = domConstruct.create("tr",{valign:"top"},tbody);
      domConstruct.create("td", {"class":"attrName", innerHTML: definitionTitles[2]}, tr);
      domConstruct.create("td", {"class":"attrValue", innerHTML: esriLang.isDefined(lowerCase["minfield"]) ? number.format(lowerCase["minfield"], p) : ""}, tr);
      
      tr = domConstruct.create("tr",{valign:"top"},tbody);
      domConstruct.create("td", {"class":"attrName", innerHTML: definitionTitles[3]}, tr);
      domConstruct.create("td", {"class":"attrValue", innerHTML: esriLang.isDefined(lowerCase["maxfield"]) ? number.format(lowerCase["maxfield"], p) : ""}, tr);
      
      tr = domConstruct.create("tr",{valign:"top"},tbody);
      domConstruct.create("td", {"class":"attrName", innerHTML: definitionTitles[4]}, tr);
      domConstruct.create("td", {"class":"attrValue", innerHTML: esriLang.isDefined(lowerCase["avgfield"]) ? number.format(number.round(lowerCase["avgfield"], this._roundPos(lowerCase["avgfield"])), p) : ""}, tr);
      
      tr = domConstruct.create("tr",{valign:"top"},tbody);
      domConstruct.create("td", {"class":"attrName", innerHTML: definitionTitles[5]}, tr);
      domConstruct.create("td", {"class":"attrValue", innerHTML: esriLang.isDefined(lowerCase["stddevfield"]) ? number.format(number.round(lowerCase["stddevfield"], this._roundPos(lowerCase["stddevfield"])), p) : ""}, tr);

      // Padding for Close Button
      domConstruct.create("div", {
        className: "break",
        innerHTML: ""
      }, wrapper);          

      // Create the Dialog
      this.statisticsDialog = new Dialog({
        title: "Statistics",
        content: wrapper,
        baseClass: "esriFeatureTable_dialog"
      });
      
      // Create the Close Button Node
      var closeBtnNode = domConstruct.create("button", { type: "button" }, this.statisticsDialog.containerNode);
      
      // Hook up the Button to an Event
      var closeBtnRef = new Button({
        label: "Close",
        baseClass: "primary dijitButton",
        onClick: lang.hitch(this, function(){
            this.statisticsDialog.hide();
        })
      }, closeBtnNode);
      
      // Show the Dialog
      this.statisticsDialog.show();

    },
    
  
   /* MENU FUNCTIONS */
    // Purpose:
    // -- Reset grid sort to default (based on this.idProperty)
    _defaultSortOrder: function(){
      this.grid.set("sort", [{ attribute: this.idProperty, ascending: true }]);
    },
    
    // Purpose:
    // -- 
    // Params:
    // -- 
    // Returns:
    // --  
    _filterRows: function(){

    },
    
    // Purpose:
    // -- Show only the Selected Records in the grid, using a typical query
    // Returns:
    // -- Boolean representing a successful selection (via query)
    _showSelectedRecords: function(){

      // Get Ids of Selected Rows for Query Filter
      var idArray = this._filteredRowIds = this._currentSelectedRowIds;
      if(this._currentSelectedRows && this._currentSelectedRowIds){
        // Calculate the filter based on Ids of Selected Rows
        this.grid.set("query", lang.hitch(this, function(item, index, items) {
          if (~idArray.indexOf(item[this.idProperty])) { return true;}
          return false;
        }));

      }
    },
    
    // Purpose:
    // -- Center map based on union extent of the current selection
    _centerOnSelection: function(){
    
      var idArray = this._currentSelectedRowIds, query = new Query();
      query.objectIds = idArray;
      query.outFields = ["*"];

      if(this._currentSelectedRows.length > 0 && this._currentSelectedRowIds.length > 0){
        // Query for the records with the given object IDs and populate the grid
        this.currentLayer.queryFeatures(query, lang.hitch(this, function (featureSet) {
          this.map.setExtent(this._calcGraphicsExtent(featureSet.features));
        }));
      }
    },
    
    // Purpose:
    // -- Public Implementation
    // -- Remove current selection; Reset store query
    clearSelection: function(){
      this._clearSelection();
    },
    
    // Purpose:
    // -- Remove current selection; Reset store query
    _clearSelection: function(){

      this._currentSelectedRowIds = [];
      this._currentSelectedRows = [];
      this._featureSelectedCount = 0;
      //this.grid.clearSelection();
      this._filteredRowIds = [];
      this.grid.set("query", {});
      this._updateGridHeaderText();
      if(this.map){
        this.map.popup.clearFeatures();
        this.map.popup.hide();
      }
    },
    
    // Purpose:
    // -- 
    // Params:
    // -- 
    // Returns:
    // -- 
    _deleteSelectedFeatures: function(){

    },
    
    // Purpose:
    // -- 
    // Params:
    // -- 
    // Returns:
    // -- 
    _showAttachments: function(){
    
    },    
    
    // Purpose:
    // -- Table Menu Option - Show/Hide Columns
    _showHideColumns: function(){
      // Private function for ColumnHider widget
      this.grid._toggleColumnHiderMenu();
    },
    
    // Purpose:
    // -- 
    // Params:
    // -- 
    // Returns:
    // -- 
    _exportToCSV: function(){
    
    },
    
    // Purpose:
    // -- Generates dojo Toggler, 
    // -- hooked up to the _gridContainer dom-node using its id (this.gridContainerId)
    // Returns:
    // -- toggler Dijit reference; ready to be hooked up to an event
    _createTableToggle: function(){
      var toggler = new Toggler({
        node: this.gridContainerId
      });
      this._toggleOpened = true;
      return toggler;
    },
    
    // Purpose:
    // -- Generates Click Event for Table Toggle Button
    // Returns:
    // -- Click Event for Table Toggle Button
    _tableToggleClickEvent: function(){
     
      var listener = on(this.tableCloseButton, "click", lang.hitch(this, function(){
        
        // Show or Hide
        if(this._toggleOpened){
          
          // Update CSS for Toggle Button
          domClass.remove(this.tableCloseButton, "toggleOpened");
          domClass.add(this.tableCloseButton, "toggleClosed");
          
          // Hide the Table
          this._toggler.hide();
          this._gridContainer.domNode.style.display = "none";

          // Fix for Scrollbars
          this._resize();
          
        }else{
          
          // Update CSS for Toggle Button
          domClass.remove(this.tableCloseButton, "toggleClosed");
          domClass.add(this.tableCloseButton, "toggleOpened");
          
          // Show the Table
          this._toggler.show();
          this._gridContainer.domNode.style.display = "block";
          
          // Fix for Scrollbars
          this._resize();
        }
        
        // App State - Keep track of toggle
        this._toggleOpened = !this._toggleOpened;
        
      }));
      return listener;
    },
    
    // Purpose:
    // -- Generates the Table Options Menu
    // -- Includes support for custom functions via the widget constructor
    _createTableMenu: function(){
      
      // Menu
      this.gridMenu = new Menu({});
      
      /*
      var labelArray = [
        "Default Sort Order", 
        "Filter (NYI)", 
        "Show Selected Records", 
        "Clear Selection", 
        "Show Attachments (NYI)", 
        "Show/Hide Columns", 
        "Export to CSV (NYI)"
      ];
      
      var functionArray = [
        this._defaultSortOrder, 
        this._filterRows, 
        this._showSelectedRecords, 
        this._clearSelection, 
        this._showAttachments, 
        this._showHideColumns, 
        this._exportToCSV
      ];
      //i18n.widgets.FeatureTable.defaultSort,
      var labelArray = [
        "Default Sort Order", 
        "Show Selected Records", 
        "Clear Selection", 
        "Show/Hide Columns"
      ];*/
      var labelArray = [
        i18n.widgets.FeatureTable.defaultSort, 
        i18n.widgets.FeatureTable.showSelected, 
        i18n.widgets.FeatureTable.clearSelection, 
        i18n.widgets.FeatureTable.toggleColumns
      ];
      
      var functionArray = [
        this._defaultSortOrder, 
        this._showSelectedRecords, 
        this._clearSelection, 
        this._showHideColumns
      ];
      
      
      // Only show this menu option if widget has reference to Map
      /*
      if(this.map){
        labelArray.push("Center on Selection");
        functionArray.push(this._centerOnSelection);
      }
      */
      // Only allow user to delete selected features if editing is enabled
      /*  
      if(this.currentLayer.isEditable()){
        labelArray.push("Delete Selected Features (NYI)");
        functionArray.push(this._deleteSelectedFeatures);
      }
      */
     // Menu Options passed in via constructor
      /*
      if(this._externalMenuFunctions){
        array.forEach(this._externalMenuFunctions, lang.hitch(this, function(item){
          labelArray.push(item.label);
          functionArray.push(item.functionReference);
        });
      }
      */
      
      // Generate the Menu Options
      array.forEach(labelArray, lang.hitch(this, function (name, index) {
        var menuItem = new MenuItem({
          label: name,
          baseClass: "esriFeatureTable_menuItem",
          // Event Handlers
          onClick: lang.hitch(this, functionArray[index])
        });
        this.gridMenu.addChild(menuItem);
      }));

      // Create the Button Node
      var ddBtn = new DropDownButton({
        //label: "Table Options",
        label: i18n.widgets.geocodeMatch.match.tableOptionsLabel,
        dropDown: this.gridMenu
      }, this.optionNodeId);
            
      // Start the Menu
      this.gridMenu.startup();
    },
    
    // Purpose:
    // -- Calculates decimal depth for rounding
    // -- This function can be found in the viewer
    // Params:
    // -- value (Integer)
    // Returns:
    // -- Accuracy of rounding
    _roundPos: function(value) {
      if (value >= 1000) {
        return 0;
      }
      if (value >= 10) {
        return 2;
      }
      if (value >= 0) {
        return 4;
      }
      return 6;
    },

    // Purpose:
    // -- Calculates the combined extent of an array of graphics
    // Params:
    // -- Array of Graphic Objects (can be a single graphic in the array)
    // Returns:
    // -- new Extent (Object)
    _calcGraphicsExtent: function (graphicsArray) {
      var g = graphicsArray[0].geometry,
        fullExt = g.getExtent(),
        ext, i, il = graphicsArray.length;
      if (fullExt === null) {
        fullExt = new Extent(g.x, g.y, g.x, g.y, g.spatialReference);
      }
      for (i = 1; i < il; i++) {
        g = graphicsArray[i].geometry;
        ext = g.getExtent();
        if (ext === null) {
          ext = new Extent(g.x, g.y, g.x, g.y, g.spatialReference);
        }
        fullExt = fullExt.union(ext);
      }
      return fullExt;
    },
    
    // Purpose:
    // -- Used to toggle the loading indicator on feature load
    // Params:
    // -- showMe (Boolean) 
    _toggleLoadingIndicator: function(showMe){
      if(showMe){
        this._gridLoadingIndicatorNode.style.display = "block";
      }else{
        this._gridLoadingIndicatorNode.style.display = "none";
      }
    },
    
    // Purpose:
    // -- Finds the first instance of a key/value pair in an array
    // -- Taken from AttributeInspector.js
    // Params:
    // -- Array, Key, Value
    // Returns:
    // -- first matching key/value pair found in the array
    _findFirst: function(collection, propertyName, value){
        var result = array.filter(collection, function(item){
            return item.hasOwnProperty(propertyName) && item[propertyName] === value;
        });
        return (result && result.length) ? result[0] : null;
      },
    
    // Purpose:
    // -- Generic Load Error Message for the Table Header
    // Params:
    // -- error message (String)
    _showLoadError: function(){
      this._toggleLoadingIndicator(false);
      this._gridHeaderNode.innerHTML = "Error Loading Data.";
    }
    
  });
  
  return Widget;
});
