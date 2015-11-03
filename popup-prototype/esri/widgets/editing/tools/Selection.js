define(
[
    "../../../core/declare",
    "dojo/_base/lang", 
    "dojo/_base/array", 
    "dojo/_base/connect", 
    "dojo/_base/Color", 

    "dojo/has", 

    "../../../symbols/SimpleMarkerSymbol",
    "../../../symbols/SimpleLineSymbol",
    "../../../symbols/SimpleFillSymbol",

    "./Edit",
    "./SelectionTools",
    "./DropDownToolBase",

    "../../../kernel"
], function(
    declare, lang, array, connect, Color,
    has,
    SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
    Edit, SelectionTools, DropDownToolBase,
    esriKernel
) {
    var Selection = declare([ DropDownToolBase ] ,{
        declaredClass: "esri.widgets.editing.tools.Selection",
        
        _enabled : true,
        /************
        * Overrides 
        ************/
        activate : function() {
          this.inherited(arguments);
          this._sConnect = connect.connect(this._toolbar, "onDrawEnd", this, "_onDrawEnd");
        },
        
        deactivate: function() {
          this.inherited(arguments);
          connect.disconnect(this._sConnect);
          delete this._sConnect;
        },
        
        _initializeTool : function() {
            this._createSymbols();
            this._initializeLayers();
            this._toolTypes = ["select", "selectadd", "selectremove"];
        },
        
        /*****************
        * Event Listeners
        *****************/
        _onDrawEnd : function(geometry){
            this.inherited(arguments);
            this._settings.editor._hideAttributeInspector();
            var layers = this._settings.layers;
            this._selectMethod = this._activeTool._selectMethod;
            this._settings.editor._selectionHelper.selectFeaturesByGeometry(layers, geometry, this._selectMethod, lang.hitch(this, "onFinished"));
        },

        /*******************
        * Internal Methods
        *******************/
        _createSymbols : function() {
            this._pointSelectionSymbol    = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 1), new Color([255, 0, 0, 0.5])) ;
            this._polylineSelectionSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 200, 255]), 2);
            this._polygonSelectionSymbol  = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 1), new Color([0, 200, 255, 0.5]));                  
        },
        
        _initializeLayers : function() {
            var layers = this._settings.layers;
            array.forEach(layers, this._setSelectionSymbol, this);
        },
        
        _setSelectionSymbol : function(layer){
          var symbol = null;
          switch(layer.geometryType){
              case "esriGeometryPoint": symbol = this._pointSelectionSymbol; break;
              case "esriGeometryPolyline": symbol = this._polylineSelectionSymbol; break;
              case "esriGeometryPolygon": symbol = this._polygonSelectionSymbol; break;
          }
          layer.setSelectionSymbol(layer._selectionSymbol || symbol);
        },
        
         _createTools : function() {
            array.forEach(this._toolTypes, this._createTool, this);
            this.inherited(arguments);
        },
        
        _createTool : function(toolName){
          var params = lang.mixin(SelectionTools[toolName], {settings: this._settings, onClick: lang.hitch(this, "onItemClicked", SelectionTools[toolName].id)});
          this._tools[toolName.toUpperCase()] = new Edit(params); 
        }
    });

    

    return Selection;
});
