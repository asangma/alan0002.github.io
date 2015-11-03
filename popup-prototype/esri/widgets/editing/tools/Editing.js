define(
[
    "../../../core/declare",
    "dojo/_base/lang", 
    "dojo/_base/array", 

    "dojo/has", 

    "../../../layers/support/FeatureTemplate",
	
    "./Edit",
    "./EditingTools",
    "./DropDownToolBase",

    "../../../kernel", "../../../core/lang"
], function(
    declare, lang, array, 
    has,
    FeatureTemplate, Edit, EditingTools, DropDownToolBase,
    esriKernel, esriLang
) {
    var Editing = declare([ DropDownToolBase ], {
        declaredClass: "esri.widgets.editing.tools.Editing",

        _enabled : false,
        /********************
        * Overrides
        *********************/ 
        deactivate: function() {
            if (!this._enabled){ return; }
            this._enabled = false;
            this.inherited(arguments);
            this._settings.templatePicker.clearSelection();
        },
        
        onItemClicked : function(toolId, evt){
            this.inherited(arguments);
            if (this._activeTool === this._tools.AUTOCOMPLETE){
              this._settings.editor._drawingTool = FeatureTemplate.TOOL_AUTO_COMPLETE_POLYGON;
            }
        },

        /*******************
        * Internal Methods
        *******************/
       _activateTool: function(drawTool, geometryType){
           var i;
           this.enable(geometryType);
           //Only show available tools in menu
           for (i in this._tools){
                if (this._tools.hasOwnProperty(i)){
                    this.dropDown.removeChild(this._tools[i]);
                    if (this._tools[i]._enabled === true){
                        this.dropDown.addChild(this._tools[i]);
                    }
                }
           }
           if (this._geometryType !== geometryType || this._activeTool._enabled === false){
             this._activeTool = this._tools[drawTool.toUpperCase()];
           }
           this._geometryType = geometryType;
           this._activeTool.activate();
           this._activeTool.setChecked(true);
           this._updateUI();
       },
       
        _initializeTool : function(settings){
            this.inherited(arguments);
            this._initializeTools();
        },

        _initializeTools : function() {
          var layers = this._settings.layers;
          var editor = this._settings.editor;
          var point = false, line = false, poly = false;
          var drawingTools = this._toolTypes = [];
          var geomType;
          array.forEach(layers, function(layer){
             geomType = layer.geometryType;
             point  = point || geomType === "esriGeometryPoint";
             line   = line  || geomType === "esriGeometryPolyline";
             poly   = poly  || geomType === "esriGeometryPolygon";
             drawingTools = drawingTools.concat(array.map(this._getTemplatesFromLayer(layer), lang.hitch(this, function(template){
                 return editor._toDrawTool(template.drawingTool, layer);
             })));
          }, this);

          var createOptions = this._settings.createOptions;
          if (point){ this._toolTypes.push("point"); }
          if (line) { this._toolTypes = this._toolTypes.concat(createOptions.polylineDrawTools); }
          if (poly) { this._toolTypes = this._toolTypes.concat(createOptions.polygonDrawTools); }
          
          this._toolTypes = this._toUnique(this._toolTypes.concat(drawingTools));
        },

        _toUnique : function(arr){
            var test = {};
            return array.filter(arr, function(val){
                return test[val] ? false : (test[val] = true);
            });
        },

        _getTemplatesFromLayer : function(layer){
            var templates = layer.templates || [];
            var types = layer.types;
            array.forEach(types, function(type){ templates = templates.concat(type.templates); });
            return array.filter(templates, esriLang.isDefined);
        },
       
        _createTools : function() {
            array.forEach(this._toolTypes, this._createTool, this);
            this.inherited(arguments);
        },
        
        _createTool : function(toolName){
          var params = lang.mixin(EditingTools[toolName], {settings: this._settings, onClick: lang.hitch(this, "onItemClicked", EditingTools[toolName].id)});
          this._tools[toolName.toUpperCase()] = new Edit(params); 
        }
    });

    

    return Editing;
});
