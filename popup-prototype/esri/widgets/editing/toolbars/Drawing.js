define(
[
    "../../../core/declare",
    "dojo/_base/lang", 
    "dojo/_base/array", 
    "dojo/_base/connect", 

    "dojo/has", 

    "dijit/_CssStateMixin",

    "../Util",
    "./ToolbarBase",
    "../tools/ButtonToolBase",

    "../tools/Cut",
    "../tools/Union",
    "../tools/Reshape",
    "../tools/Editing",
    "../tools/EditingTools",
    "../tools/Selection",
    "../tools/SelectionTools",

    "../../../kernel"
], function(
    declare, lang, array, connect,
    has,
    _CssStateMixin,
    editingUtil, ToolbarBase, ButtonToolBase,
    Cut, Union, Reshape, Editing, EditingTools, Selection, SelectionTools, 
    esriKernel
) {
    var Drawing = declare([ToolbarBase, _CssStateMixin], {
        declaredClass: "esri.widgets.editing.toolbars.Drawing",

        /*********
        * Events
        *********/
        onShowAttributeInspector: function(){},

        /************
        * Overrides 
        ************/
        _activateTool: function(tool, deactivateIfSelected){
            this._settings.editor._activeTool = tool;
            if (tool !== "EDITING"){
                this._settings.templatePicker.clearSelection();
            }

            if (tool !== "ATTRIBUTES"){
                this._settings.editor._hideAttributeInspector();
            }

            if (tool === "CLEAR"){
                return;
            }
            this.inherited(arguments);
        },
        
        /*******************
       * Internal Methods
       *******************/
        _initializeToolbar: function(){
            var layers = this._settings.layers;
            array.forEach(layers, function(layer){
                this._tbConnects.push(connect.connect(layer, "onSelectionComplete", this, "_updateUI"));
            }, this);
        },

        activateEditing: function(drawTool, layer){
            this._tools.EDITING._activateTool(drawTool, layer.geometryType);
            this._activeTool = this._tools.EDITING;
            this._activeTool.setChecked(true);
        },

        _updateUI: function(){
            if (this._settings.undoManager){
                this._tools.UNDO.set('disabled', this._settings.undoManager.canUndo === false);
                this._tools.REDO.set('disabled', this._settings.undoManager.canRedo === false);
            }
            this._selectedFeatures = editingUtil.getSelection(this._settings.layers);
            var count = this._selectedFeatures.length;
            if (this._tools.DELETE) {
                this._tools.DELETE.set('disabled', count <= 0);
            }
            if (this._tools.CLEAR) {
                this._tools.CLEAR.set('disabled', count <= 0);
            }
            if (this._tools.ATTRIBUTES){
                this._tools.ATTRIBUTES.set('disabled', count <= 0);
            }
            if (this._tools.UNION){ 
                this._tools.UNION.set('disabled', count < 2);
            }
        },

        _toolFinished: function(tool){
            if (tool === "ATTRIBUTES" && (this._selectedFeatures && this._selectedFeatures.length)){
                this.onShowAttributeInspector(this._selectedFeatures[0]);
            }

            if (tool === "SELECT" || tool === "CUT" || tool === "RESHAPING" || tool === "EDITING"){
                this._activeTool.deactivate();
                this._activeTool.setChecked(false);
                this._activeTool = null;
            }
            
            if (tool === "DELETE"){
                this.onDelete();
            }

            this._updateUI();
        },

        _createTools: function(){
            this._tools.SELECT = new Selection({
                settings: this._settings,
                onClick: lang.hitch(this, "_activateTool", "SELECT", true),
                onFinished: lang.hitch(this, "_toolFinished", "SELECT")
            });
            this.addChild(this._tools.SELECT);

            this._tools.CLEAR = new ButtonToolBase(lang.mixin(SelectionTools.selectClear,{
                settings: this._settings,
                onClick: lang.hitch(this._settings.editor, "_clearSelection", false)
            }));
            this.addChild(this._tools.CLEAR);
            this._createSeparator();

            this._tools.ATTRIBUTES = new ButtonToolBase(lang.mixin(EditingTools.attributes,
            {
                settings: this._settings,
                onClick: lang.hitch(this, "_toolFinished", "ATTRIBUTES")
            }));
            this.addChild(this._tools.ATTRIBUTES);
            this._createSeparator();

            this._tools.EDITING = new Editing({
                settings: this._settings,
                onClick: lang.hitch(this, "_activateTool", "EDITING", true),
                onApplyEdits: lang.hitch(this, "onApplyEdits"),
                onFinished: lang.hitch(this, "_toolFinished", "EDITING")
            });
            this.addChild(this._tools.EDITING);

            this._tools.DELETE = new ButtonToolBase(lang.mixin(EditingTools.del,
            {
                settings: this._settings,
                onClick: lang.hitch(this, "_toolFinished", "DELETE")
            }));
            this.addChild(this._tools.DELETE);

            if (this._settings.toolbarOptions){
                if (this._settings.toolbarOptions.cutVisible || this._settings.toolbarOptions.mergeVisible || this._settings.toolbarOptions.reshapeVisible){
                    this._createSeparator();
                }
                if (this._settings.toolbarOptions.cutVisible){
                    this._tools.CUT = new Cut({
                        settings: this._settings,
                        onFinished: lang.hitch(this, "_toolFinished", "CUT"),
                        onClick: lang.hitch(this, "_activateTool", "CUT", true),
                        onApplyEdits: lang.hitch(this, "onApplyEdits")
                    });
                    this.addChild(this._tools.CUT);
                }

                if (this._settings.toolbarOptions.mergeVisible){
                    this._tools.UNION = new Union({
                        settings: this._settings,
                        onFinished: lang.hitch(this, "_toolFinished", "UNION"),
                        onApplyEdits: lang.hitch(this, "onApplyEdits")

                    });
                    this.addChild(this._tools.UNION);
                }

                if (this._settings.toolbarOptions.reshapeVisible){
                    this._tools.RESHAPING = new Reshape({
                        settings: this._settings,
                        onClick: lang.hitch(this, "_activateTool", "RESHAPING", true),
                        onFinished: lang.hitch(this, "_toolFinished", "RESHAPING"),
                        onApplyEdits: lang.hitch(this, "onApplyEdits")
                    });
                    this.addChild(this._tools.RESHAPING);
                }
            }
            
            if (this._settings.enableUndoRedo){
                this._createSeparator();
                this._tools.UNDO = new ButtonToolBase(lang.mixin(EditingTools.undo,
                {
                    settings: this._settings,
                    onClick: lang.hitch(this, function() { this._tools.UNDO.set('disabled', true); this._tools.REDO.set('disabled', true); this._settings.editor._undo(); })
                }));
                
                this.addChild(this._tools.UNDO);
                this._tools.REDO = new ButtonToolBase(lang.mixin(EditingTools.redo,
                {
                    settings: this._settings,
                    onClick: lang.hitch(this, function() { this._tools.UNDO.set('disabled', true); this._tools.REDO.set('disabled', true); this._settings.editor._redo(); })
                }));
                this.addChild(this._tools.REDO);
            }
        }
    });

    

    return Drawing;
});
