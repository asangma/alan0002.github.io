define(
[
    "../../../core/declare",
    "dojo/_base/lang", 
    "dojo/_base/array", 
    "dojo/_base/connect", 

    "dojo/has", 

    "dijit/Toolbar",
    "dijit/ToolbarSeparator",

    "../../../kernel",
    "../../../core/lang"
], function(
    declare, lang, array, connect, 
    has,
    Toolbar, ToolbarSeparator,
    esriKernel, esriLang
) {
    var TBB = declare([ Toolbar ], {
        declaredClass: "esri.widgets.editing.toolbars.ToolbarBase",

        _enabled : true, 

        /*********
        * Events
        *********/
        graphicsAdded : function() {},
        drawEnd       : function() {},
        onApplyEdits  : function() {},
        onDelete      : function() {},

        /************
        * Overrides 
        ************/
        constructor: function(params, srcNodeRef){
            if (!params || !params.settings){
                return;
            }

            this._tools = []; 
            this._tbConnects = []; 
            
            this._initialize(params.settings);
        },
        
        postCreate : function() {
            this._createTools();
            this.deactivate();
        },

        destroy: function(){
            var tool;
            var tools = this._tools;
            for (tool in tools){
                if (tools.hasOwnProperty(tool) && esriLang.isDefined(this._tools[tool])){
                    this._tools[tool].destroy();
                }
            }
            array.forEach(this._tbConnects, connect.disconnect);
            this.inherited(arguments);
        },
        
        /********************
        * Public Methods
        *********************/
        activate : function(geometry){ this._enabled = true; },
        
        deactivate: function(){
            var tool;
            //if (!this._enabled){ return; }
            
            this._enabled      = false;
            this._layer        = null;
            this._geometryType = null;
            
            var tools = this._tools;
            for (tool in tools){
                if (tools.hasOwnProperty(tool)){
                    this._tools[tool].deactivate();
                    this._tools[tool].setChecked(false);
                }
            }
        },
                
        isEnabled : function() {
            return this._enabled;
        },
        
        setActiveSymbol : function(symbol) {
            this._activeSymbol = symbol;
        },

       /*******************
       * Internal Methods
       *******************/
       _getSymbol   : function() {},
       _createTools : function() {},
       
       _initialize : function(settings){
           this._settings = settings;
           this._toolbar = settings.drawToolbar;
           this._editToolbar = settings.editToolbar;

           this._initializeToolbar();
       },

       _activateTool : function(tool, deactivateIfActive){
           if (this._activeTool){
               this._activeTool.deactivate();
           }

           if (deactivateIfActive === true && this._activeTool == this._tools[tool]) {
               this._activeTool.setChecked(false);
               this._activeTool = null;
           } else {
               this._activeTool = this._tools[tool];
               this._activeTool.setChecked(true);
               this._activeTool.activate(null);
           }
       },

        _createSeparator: function(){
            this.addChild(new ToolbarSeparator());
        }
    });

    

    return TBB;
});
