define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/_base/event",
  "dojo/dom-construct",
  "dojo/dom-class",
  "dojo/dom-style",
  "dojo/keys"
], function(
  declare, lang, connect, event, domConstruct, domClass, domStyle, keys) {
  var TE = declare(null, {
    declaredClass: "esri.toolbars.TextEditor",
    constructor: function(graphic, map, toolbar) {
      this._graphic = graphic;
      this._map = map;
      this._toolbar = toolbar;
      this._enable(this._graphic);
    },
    
    destroy: function() {
      this._disable();
    },
    
    /***************************
     * Events
     *   onEditStart (graphic, textBox)
     *   onEditEnd (graphic)
     ***************************/
    onEditStart: function(){},
    onEditEnd: function(){},
    /*******************
     * Internal Methods
     *******************/
    
    _enable: function(graphic) {
      if (this._editBox) {
        connect.disconnect(this._addEditBoxHandler);
        this._addEditBoxHandler = null;
        return ;
      }
      
      this._map.navigationManager.setImmediateClick(true);
      this._addEditBoxHandler = connect.connect(graphic.getLayer(), "onDblClick", this, function(evt){
        this._map.navigationManager.setImmediateClick(false);
        if (evt.graphic == graphic) {
          event.stop(evt);
          connect.disconnect(this._addEditBoxHandler);
          this._addEditBoxHandler = null;
          this._addTextBox(graphic);
        }
      });
    },
    
    _disable: function () {
      this._applyEdit();
      if (this._addEditBoxHandler) {
        //_addEditBoxHandler should be gone,
        //just for safe reason.
        connect.disconnect(this._addEditBoxHandler);
        this._addEditBoxHandler = null;
      }
      this._removeTextBox();
      this.onEditEnd(this._graphic);
      this._toolbar.onTextEditEnd(this._graphic);
    },
    
    _addTextBox: function(graphic, textStr){
      if (this._editBox) {
        return ;
      }
      
      var text;
      if (!graphic.symbol.text) {
        //if text is missing, assign a tempt text, then remove it.
        //that's the only way to find the location of the text box.
        graphic.symbol.text = "Tempt text";
        graphic.setSymbol(graphic.symbol);
        text = "";
      }
      
      var style = this._createInputTextStyle(graphic, this._map);

      if (text !== "") {
        text = textStr || graphic.symbol.text;
      }
      this._editBox = domConstruct.create("input", {
        type: "text",
        value: text
      });
      domStyle.set(this._editBox, style);
      domClass.add(this._editBox, "esriTextEditorInput");

      this._map.container.appendChild(this._editBox);
      this._editBox.focus();
      //enable listening to enter key
      this._editBoxKeyHandler = connect.connect(this._editBox, "onkeyup", lang.hitch(this, function(e){
        if (e.keyCode == keys.ENTER || e.keyCode === keys.TAB) {
          this._disable();
        }
      }));
      
      this._editBoxBlurHandler = connect.connect(this._editBox, "onblur", lang.hitch(this, function(e){
        this._disable();
      }));
      
      graphic.symbol.text = "";
      graphic.setSymbol(graphic.symbol);
      graphic.hide();
      
      var box = this._editBox;
      //when map moves/pans, the box should move accordingly
      if (!this._disableBoxHandler) {
        this._disableBoxHandler = this._map.on("zoom-start", lang.hitch(this, function(){
          this._disable();
        }));
      }
      this._moveBoxHandler = this._map.on("pan", function(e){
        domStyle.set(box, {
          "left": (this._editBoxLeft + e.delta.x) + "px",
          "top": (this._editBoxTop + e.delta.y) + "px"
        });
      });
      this._moveBoxStartHandler = this._map.on("pan-start", function(){
        this._editBoxLeft = parseFloat(domStyle.get(box, "left"));
        this._editBoxTop = parseFloat(domStyle.get(box, "top"));
      });
      
      this.onEditStart(graphic, this._editBox);
      this._toolbar.onTextEditStart(graphic, this._editBox);
    },
    
    _removeTextBox: function () {
      //this event must be remove before removing the text box
      //otherwise onblur will fire even after the text box is gone.
      if (this._editBoxBlurHandler) {
        connect.disconnect(this._editBoxBlurHandler);
        this._editBoxBlurHandler = null;
      }
      if (this._editBox) {
        this._editBox.parentNode.removeChild(this._editBox);
        this._editBox = null;
      }
      if (this._disableBoxHandler) {
        this._disableBoxHandler.remove();
        this._disableBoxHandler = null;
      }
      if (this._moveBoxHandler) {
        this._moveBoxHandler.remove();
        this._moveBoxHandler = null;
      }
      if (this._moveBoxStartHandler) {
        this._moveBoxStartHandler.remove();
        this._moveBoxStartHandler = null;
      }
      if (this._editBoxKeyHandler) {
        connect.disconnect(this._editBoxKeyHandler);
        this._editBoxKeyHandler = null;
      }
    },
    
    _createInputTextStyle: function (graphic, map) {
      var node = graphic.getDojoShape(),
        clientBox = node.getTransformedBoundingBox(),
        x = Math.abs(clientBox[0].x - clientBox[1].x),        
        width = x/Math.cos(graphic.symbol.angle/180*Math.PI),
        //shift the text box toward left and top
        //in order to make it align with the original text
        editBoxLeft = clientBox[0].x,
        //when the text symbol has angle, move certain distance towards bottom
        //because the textbox is always horizontal,
        //so it would not locate on the up left corner of the rotated symbol
        editBoxTop = clientBox[0].y,
        font = graphic.symbol.font,
        style = {
          "font-family": font.family,
          "font-size": font.size + "px",
          "font-style": font.style,
          "font-variant": font.variant,
          "font-weight": font.weight,
          "left": editBoxLeft + "px",
          "top": editBoxTop + "px",
          "width": width + "px"
        };

      return style;
    },
    
    _applyEdit: function () {
      if (this._editBox) {
        if (this._editBox.value) {
          this._graphic.show();
          var symbol = this._graphic.symbol;
          symbol.text = this._editBox.value;
          this._graphic.setSymbol(symbol);
        }
        else {
          this._graphic.getLayer().remove(this._graphic);
        }
      }
    }
  });

  

  return TE;
});
