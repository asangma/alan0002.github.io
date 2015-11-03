define([
    "../kernel",
    "../core/numberUtils",
    
    "dijit/_OnDijitClickMixin",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetBase",
    "dijit/form/NumberTextBox",
    
    "dojo/i18n!../nls/jsapi",
    "dojo/on",
    "dojo/_base/array",
    "../core/declare",
    "dojo/_base/lang",
    
    "dojo/dnd/move",
    
    "dojo/dom-geometry",    
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/Evented",
    "dojo/number",
    "dojo/has",
    
    "dojo/text!./RendererSlider/templates/RendererSlider.html"
  ],
  function (
    esriKernel, numberUtils,
    _OnDijitClickMixin, _TemplatedMixin, _WidgetBase, NumberTextBox,
    i18n, on, array, declare, lang, 
    move, domGeo, domConstruct, domStyle, Evented, dojoNumber, has, 
    template
  ) {

    var RendererSlider = declare("esri.widgets.RendererSlider", [_WidgetBase, _TemplatedMixin, _OnDijitClickMixin, Evented], {
      
      templateString: template,
      theme: "Slider",
      intermediateChanges: false,
      type: null,
      
      minimum: 0, // absolute minimum value of the slider
      maximum: 100, // absolute maximum value of the slider
      
      values: [50], // Represents the handle position in between minimum and maximum
      precision: 2,

      // Handles
      handles: [], // Array of Indexes indicating which items from the values array to display as handles
      primaryHandle: null, // Special case where the central handle controls the movement of the top and bottom handles
      
      showHandles: null, 
      showTicks: null,
      
      // Split up into two sets of labels      
      showLabels: null,
      _visibleLabels: ["data", "handle"],  // Two sets of labels controlled by one property
      
      // Labels & Labelling
      minLabel: null,
      maxLabel: null,      
      classificationMethod: null,
      normalizationType: null,      
      _roundedDataLabels: [],  // rounded labels for minimum and maximum
      _roundedHandleLabels: [], // rounded labels for handle values

      // Text Editor Nodes
      _maximumNumberEditor: null,
      _minimumNumberEditor: null,
      
      // Internals
      _valueDifferenceByIndex: [],
      _primaryHandleIdx: null,
      _currentTopValue: [],      
      _isLTR: true,
      _isZoomed: false,      

      constructor: function (options, srcNodeRef) {
     
        this.inherited(arguments);
        this.domNode = srcNodeRef;

        this._css = {
          container: "esriRendererSlider",
          slidernode: "sliderNode",
          sliderarea: "sliderArea",
          sliderarearight: "sliderAreaRight",
          topLabelNode: "topLabelNode",
          bottomLabelNode: "bottomLabelNode"
        };
        
        // UX Properties
        this.showLabels = options.showLabels || this._visibleLabels;
        this.showHandles = options.showHandles || true;
        this.showTicks = options.showTicks || true;
        
        this.minimum = options.minimum || this.minimum; // Default to 0 if no minimum
        this.maximum = options.maximum || this.maximum; // Default to 100 if no maximum
        
        // Needed for tracking percentage(%) labels
        this.classificationMethod = options.classificationMethod || null; 
        this.normalizationType = options.normalizationType || null;
        
      },
      
      postCreate: function(){
        this.inherited(arguments);      

      },

      startup: function () {
        this.inherited(arguments);
        
        this._sliderHeight = domStyle.get(this._sliderArea, "height") || 200; 
        
        if(this.minimum === this.maximum){
            if(this.values && this.values.length > 0){
              this.minimum = 0;
              this.maximum = this.values[0] * 2;
            }else{
              console.log("values array is empty.");
            }
        }

        // Required for Generation of Handle Positions (top/left in boundaries)
        this._isLTR = domGeo.isBodyLtr();
        if(!this._isLRT){
          var padding = domStyle.get(this._sliderNode, "padding-left") + domStyle.get(this._sliderNode, "padding-right");
          var width = Math.round(domStyle.get(this._sliderNode, "width"));
          this._sliderNodeWidth_RTL = padding + width + 4; //4 because of handle itself
        }
        
        // UX 
        this._updateRoundedLabels();
        this._generateLabelEditors();
        this._generateMoveables();
        this.watch("values", this._valuesChange);
      },

      _generateLabelEditors: function(){
        // Don't generate label editors for HeatmapSliders
        if(this.type === "HeatmapSlider"){
          return;
        }
        
        // Create the NumberTextBoxes
        on(this._topNode, "click", lang.hitch(this, this._generateMaxEditor));
        on(this._botNode, "click", lang.hitch(this, this._generateMinEditor));
        
      },
      
      _generateMaxEditor: function(){
        
        // Ref
        var minLabel = this.minLabel;
        var maxLabel = this.maxLabel;
        
        // Already set... quit to avoid registry errors
        if(this._maximumNumberEditor && this._topLabelNode ){ return; }
        if(this._isZoomed){ return; }

        // Save Current Value(s)
        var currentMax = this.maximum;

        // Empty Node
        this._topNode.innerHTML = "";
        
        // Create the Container
        this._topLabelNode = domConstruct.create("input", {
          type: "text"
        }, this._topNode);
        
        // Get Nearest Handle
        var lastHandleValue;

        if(this.handles && this.handles.length > 0){
          lastHandleValue = this.values[this.handles[this.handles.length-1]];
        }else{
          lastHandleValue = this.values[this.values.length-1];
        }

        if (typeof lastHandleValue === "object") { 
          lastHandleValue = lastHandleValue.value; 
        }
        
        // Create the NumberTextBox
        var maximumNumberEditor = new NumberTextBox({
          "value" : Number(currentMax),
          "required": true,
          "constraints": {
            "min": lastHandleValue,
            "places": "0,20"
          }
        }, this._topLabelNode);
        this._maximumNumberEditor = maximumNumberEditor;

        // Focus & Select to allow immediate editing
        maximumNumberEditor.startup();
        maximumNumberEditor.focus();
        maximumNumberEditor.textbox.select();
        
        var originalValidate = false;
        // Enter Key Listener
        on(maximumNumberEditor, "keydown", lang.hitch(this, function(evt){

          if(originalValidate !== false){
            maximumNumberEditor.validate = originalValidate;
          }

          // Enter Key
          if(evt.keyCode === 13){
            // Trigger Blur
            if(maximumNumberEditor.get("value") <= maximumNumberEditor.constraints.max && maximumNumberEditor.get("value") >= maximumNumberEditor.constraints.min){
              maximumNumberEditor.focusNode.blur();
            }else{
              originalValidate = maximumNumberEditor.validate;
              maximumNumberEditor.validate(false);
              maximumNumberEditor.validate = function(){ return false;};
            }
          }
          
          // Esc Key
          if(evt.keyCode === 27){
            console.log("Esc");
          }

        }));

        // When focus is lost...
        var that = this;  
        on(maximumNumberEditor, "blur", function(){
        
          var roundedMax = (isNaN(maxLabel)) ? maxLabel : numberUtils.round([minLabel, maxLabel])[1];
          var formattedMax = (isNaN(roundedMax) || roundedMax === null) ? maxLabel : numberUtils.format(roundedMax);
          var fallbackMax = numberUtils.format(that._roundedDataLabels[1]) || numberUtils.format(currentMax);
          
          that._topNode.innerHTML = formattedMax || fallbackMax;
            
          this.destroy();
          that._maximumNumberEditor = null;
        });

        // Update UI
        on(this._maximumNumberEditor, "change", lang.hitch(this, function(evt){

          // Invalid Value, Reset
          if(evt < Number(lastHandleValue) || isNaN(evt) || evt === undefined){
          
            var roundedMax = (isNaN(maxLabel)) ? maxLabel : numberUtils.round([minLabel, maxLabel])[1];
            var formattedMax = (isNaN(roundedMax) || roundedMax === null) ? maxLabel : numberUtils.format(roundedMax);
            var fallbackMax = numberUtils.format(this._roundedDataLabels[1]) || numberUtils.format(currentMax);
            this._topNode.innerHTML = formattedMax || fallbackMax;
            
            return;
          }
          
          // Update Refs
          this._topNode.innerHTML = numberUtils.format(evt);
          this.maximum = evt;
          //this.maxLabel = evt;
          
          // Update App State
          this._reset();
          this._updateRoundedLabels();                       
          this._generateMoveables();
          this._generateLabelEditors();
          this.emit("data-value-change", {"min": this.minimum, "max": this.maximum, "values": lang.clone(this.values)});

        }));
          
      },
      
      _generateMinEditor: function(){
        
        // Ref
        var minLabel = this.minLabel;
        var maxLabel = this.maxLabel;
        
        // Already set... quit to avoid registry errors
        if(this._minimumNumberEditor && this._botLabelNode ){ return; }
        if(this._isZoomed){ return; }
        
        // Save Current Value(s)
        var currentMin = this.minimum;

        // Empty Node
        this._botNode.innerHTML = "";
        
        // Create the Container
        this._botLabelNode = domConstruct.create("input", {
          type: "text"
        }, this._botNode);
        
        // Get Nearest Handle
        var firstHandleValue;

        if(this.handles && this.handles.length > 0){
          firstHandleValue = this.values[this.handles[0]];
        }else{
          firstHandleValue = this.values[0];
        }

        if (typeof firstHandleValue === "object") { firstHandleValue = firstHandleValue.value; }
        
        // Create the NumberTextBox
        var minimumNumberEditor = new NumberTextBox({
          "value" : Number(currentMin),
          "required": true,
          "constraints": {
            "max": firstHandleValue,
            "places": "0,20"
          }
        }, this._botLabelNode);
        this._minimumNumberEditor = minimumNumberEditor;
        
        // Focus & Select to allow immediate editing
        minimumNumberEditor.startup();
        minimumNumberEditor.focus();
        minimumNumberEditor.textbox.select();
         
        var originalValidate = false;
        // Enter Key Listener
        on(minimumNumberEditor, "keydown", lang.hitch(this, function(evt){
          
          if(originalValidate !== false){
            minimumNumberEditor.validate = originalValidate;
          }
          // Enter Key
          if(evt.keyCode === 13){
            // Trigger Blur
            if(minimumNumberEditor.get("value") <= minimumNumberEditor.constraints.max && minimumNumberEditor.get("value") >= minimumNumberEditor.constraints.min){
              minimumNumberEditor.focusNode.blur();
            }else{
              originalValidate = minimumNumberEditor.validate;
              minimumNumberEditor.validate(false);
              minimumNumberEditor.validate = function(){ return false;};
            }
          }
          
          // Esc Key
          if(evt.keyCode === 27){
            console.log("Esc");
          }

        }));
        
        var that = this;  
        on(minimumNumberEditor, "blur", function(){

          var roundedMin = (isNaN(minLabel)) ? minLabel : numberUtils.round([minLabel, maxLabel])[0];
          var formattedMin = (isNaN(roundedMin) || roundedMin === null) ? minLabel : numberUtils.format(roundedMin);
          var fallbackMin = numberUtils.format(that._roundedDataLabels[0]) || numberUtils.format(currentMin);
          
          that._botNode.innerHTML = formattedMin || fallbackMin;          
          

          this.destroy();
          that._minimumNumberEditor = null;
        });
        
        // Update UI
        on(this._minimumNumberEditor, "change", lang.hitch(this, function(evt){
        
          // Cancel if value is greater than the maximum
          if(evt > Number(firstHandleValue) || isNaN(evt) || evt === undefined){      
            var roundedMin = (isNaN(minLabel)) ? minLabel : numberUtils.round([minLabel, maxLabel])[0];
            var formattedMin = (isNaN(roundedMin) || roundedMin === null) ? minLabel : numberUtils.format(roundedMin);
            var fallbackMin = numberUtils.format(this._roundedDataLabels[0]) || numberUtils.format(currentMin);            
            this._botNode.innerHTML = formattedMin || fallbackMin;
            return;
          }
          
          // Update Refs
          this._botNode.innerHTML = numberUtils.format(evt);
          this.minimum = evt;
          
          // Update App State
          this._reset();
          this._updateRoundedLabels();                       
          this._generateMoveables();
          this._generateLabelEditors();
          this.emit("data-value-change", {"min": this.minimum, "max": this.maximum});

        }));
        
      },
      
      _generateMoveables: function(){
      
        // Local References
        var sliderNode = this._sliderNode,
          sliderHeight = this._sliderHeight,
          min = this.get("minimum"),
          max = this.get("maximum"),
          minLabel = this.get("minLabel"),
          maxLabel = this.get("maxLabel"),
          precision = this.get("precision"),
          step = this.get("step") || Math.pow(10, -precision),
          showLabels = this.get("showLabels"),
          showTicks = this.get("showTicks"),
          setValue = lang.hitch(this, this.setValue),
          values = this.get("values"),
          moveables;

        //if(showLabels === true || (typeof showLabels ==="object" && showLabels.indexOf("data") !== -1)){
        if(showLabels === true || (typeof showLabels ==="object" && array.indexOf(showLabels, "data") !== -1)){
        
          // Show custom labels if set (minLabel/maxLabel)
          // -- HeatmapSlider uses minLabel/maxLabel for High/Low strings
          // -- if labels are Numbers, round them
          var roundedMin = (isNaN(minLabel)) ? minLabel : numberUtils.round([minLabel, maxLabel])[0];
          var roundedMax = (isNaN(maxLabel)) ? maxLabel : numberUtils.round([minLabel, maxLabel])[1];
          var formattedMin = (isNaN(roundedMin) || roundedMin === null) ? minLabel : numberUtils.format(roundedMin);
          var formattedMax = (isNaN(roundedMax) || roundedMax === null) ? maxLabel : numberUtils.format(roundedMax);
          // Get previously rounded labels in case minLabel and maxLabel aren't set
          var fallbackMax = numberUtils.format(this._roundedDataLabels[1]) || numberUtils.format(max);
          var fallbackMin = numberUtils.format(this._roundedDataLabels[0]) || numberUtils.format(min);

          this._topNode.innerHTML = formattedMax || fallbackMax;
          this._botNode.innerHTML = formattedMin || fallbackMin;
          
        }else{
          // Data Labels are disabled... show empty space
          this._topNode.innerHTML = "&nbsp;";
          this._botNode.innerHTML =  "&nbsp;";
        }        

        // Reset App State
        this._primaryHandleIdx = null;

        moveables = array.map(values, lang.hitch(this, function (value, i) {
        
          // Save a Reference to the Primary Handle
          if(value && value.primaryHandle){
            this._primaryHandleIdx = i;
          }
          
          if (typeof value === "object" && value.hidden) { return null; }
          if (typeof value === "object") { value = value.value; }
          
          var handlerPosition,
            handlerPositionFromTop,
            moveable,
            handler,
            label,
            constrainedMoveable, tickClass;

          handlerPosition = (value - min) / (max - min);
          handlerPositionFromTop = Math.round((1 - handlerPosition) * sliderHeight);
          
          // Get the Top and Left values for the handles for alignment
          /*
          var handlerPositionFromLeft;
          
          if(this._isLTR){
          handlerPositionFromLeft = 0;
          }else{
          handlerPositionFromLeft = this._sliderNodeWidth_RTL + this.rampWidth
          }
           = (this._isLTR) ? 0 : this._sliderNodeWidth_RTL;
           */
          var handlerPositionFromLeft = (this._isLTR) ? 0 : this._sliderNodeWidth_RTL;
          var leftStyleString = "left: " + handlerPositionFromLeft + "px;";
          var topStyleString =  "top: " + handlerPositionFromTop + "px;";
          var combinedStyleString = topStyleString + " " + leftStyleString;
          
          moveable = domConstruct.create("div", {
            //style: moveableStyle,
            style: combinedStyleString,
            className: "moveable"
          }, sliderNode);

          handler = domConstruct.create("div", {
            className: "handler"
          }, moveable);

          moveable._handler = handler;
          

          // Generate Handle Labels
          if (this.type !== "HeatmapSlider" && (showLabels === true || (typeof showLabels ==="object" && array.indexOf(showLabels, "handles") !== -1))){

            // Create the basic label, populate with current data value
            label = domConstruct.create("div", {
              className: "handlerLabel",
              innerHTML: numberUtils.format(this._roundedHandleLabels[i])
            }, moveable);
            
            moveable._label = label;

            // Generate Editable Labels
            on(label, "click", lang.hitch(this, function(){
            
              // NumberTextBox Exists
              if(moveable._numberEditor){
                return;
              }
             
              var previousIdx, 
                nextIdx, 
                previousValue,
                nextValue,
                editorMinValue,
                editorMaxValue;
                
              // Store current value
              var updatedValue =  this.values[i];
              if (typeof updatedValue === "object") { 
                updatedValue = updatedValue.value; 
              }
              
              // Save for later widget enhancements
              //var currentValue = label.innerHTML;
              label.innerHTML = "";

              // Create a container node
              var numberEditorNode = domConstruct.create("input", {
                type: "text",
                className: "NumberTextBoxContainer"
              }, label);
              
              if(this.handles.length > 0){
              
                previousIdx = (this.handles[array.indexOf(this.handles , i) - 1 ] !== null) ? this.handles[array.indexOf(this.handles , i) - 1] : null;       
                nextIdx = (this.handles[array.indexOf(this.handles , i) + 1] !== null) ? this.handles[array.indexOf(this.handles , i) + 1] : null;    
                previousValue = this.values[previousIdx];
                nextValue = this.values[nextIdx];
                
                // Object Conversion
                if (typeof previousValue === "object") { 
                  previousValue = previousValue.value; 
                } 
                if (typeof nextValue === "object") { 
                  nextValue = nextValue.value; 
                }          

              }else{
              
                previousValue = this.values[i-1];
                nextValue = this.values[i+1];
                
                // Object Conversion
                if (typeof previousValue === "object") { 
                  previousValue = previousValue.value; 
                } 
                if (typeof nextValue === "object") { 
                  nextValue = nextValue.value; 
                }      
                
              }

              if(previousValue !== undefined && previousValue !== null){
                editorMinValue = previousValue;
              }else{
                editorMinValue = min;
              }
              
              if(nextValue !== undefined && nextValue !== null){
                editorMaxValue = nextValue;
              }else{
                editorMaxValue = max;
              }
             
              // Create the NumberTextBox dijit
              var numberEditor = new NumberTextBox({
                "value" : updatedValue,
                "constraints" : {
                  "min": editorMinValue, 
                  "max" : editorMaxValue,
                  "places": "0,20"
                }
              }, numberEditorNode);
              
              moveable._numberEditor = numberEditor;

              var originalValidate = false;
              // Enter Key Listener
              on(numberEditor, "keydown", lang.hitch(this, function(evt){
                
                if(originalValidate !== false){
                  numberEditor.validate = originalValidate;
                }
                
                // Enter Key
                if(evt.keyCode === 13){
                  // Trigger Blur
                  if(numberEditor.get("value")  <=  numberEditor.constraints.max && numberEditor.get("value") >= numberEditor.constraints.min){
                    numberEditor.focusNode.blur();
                  }else{
                    originalValidate = numberEditor.validate;
                    numberEditor.validate(false);
                    numberEditor.validate = function(){ return false;};
                  }
                }
                
                // Esc Key
                if(evt.keyCode === 27){                
                  console.log("Esc");
                }
              }));
              
              // When focus is lost...
              on(numberEditor, "blur", lang.hitch(this, function(){
              
                // If user input is not a number, reset data to last valid value
                if(isNaN(numberEditor.get("value"))){
                  numberEditor.set("value", updatedValue);
                }
                
                // Update the Label and kill the NumberTextBox
                // -- Old Implementation before labelling updates 
                label.innerHTML = numberUtils.format(this._roundedHandleLabels[i]);

                numberEditor.destroy();
                moveable._numberEditor = null;            
              }));

              // Update UI
              on(numberEditor, "change", lang.hitch(this, function(evt){
              
                if(evt > numberEditor.constraints.max || evt < numberEditor.constraints.min || isNaN(evt) || evt === undefined){
                  label.innerHTML = numberUtils.format(this._roundedHandleLabels[i]);
                  return;
                }
                
                if (typeof this.values[i] === "object") { 
                  this.values[i].value = evt;
                }else{
                  this.values[i] = evt;
                }
                
                this._reset();
                this._updateRoundedLabels();                
                this._generateMoveables();
                this._generateLabelEditors();
               
                this.emit("handle-value-change", {values: this.values});
              }));
              
              // Allows the user to type in a value immediately 
              numberEditor.focus();
              numberEditor.textbox.select();

            }));

          }

          if (showTicks) {

            // Swap the white and black borders depending on the index
            tickClass =  (i === 0) ? "handlerTick handlerTickBottom" : "handlerTick handlerTickTop";
            
            // Shorten the Tick using the class
            // Improve this logic before release
            if(this.type === "HeatmapSlider"){
              tickClass = tickClass + " heatmapTick";
            }

            moveable._tick = domConstruct.create("div", {
              className: tickClass
            }, moveable);
          }

          constrainedMoveable = new move.constrainedMoveable(moveable, {
            handle: handler,
            within: true,
            constraints: lang.hitch(this,  function () {
              return {
                t: 0,
                l: (this._isLTR) ? 0 : this._sliderNodeWidth_RTL,
                w: 0,
                h: sliderHeight
              };
            })
          });

          constrainedMoveable.onMoveStart = lang.hitch(this, function (evt) {
          
            var previousIdx, 
              nextIdx, 
              previousMoveable, 
              nextMoveable, 
              previousMoveableTop, 
              nextMoveableTop, 
              previousPx, 
              nextPx;
            
            this._currentTopValue[i] = evt.node.style.top;

            if(moveable._numberEditor){
              moveable._numberEditor.destroy();
              moveable._numberEditor = null;
            }
            
            if(this._primaryHandleIdx !== i){
              
              // Logic is Fun!
              // ...if previousIdx is null, this is the first handle 
              // ...if nextIdx is null, this is the last handle
              // ...if both are not null, the handle is in between these handles
              // 1) Get the top values from both handles and set constraints
              // t = top
              // -- top indicates pixel distance of the above handle to the very top of the slider
              // -- e.g. aboveHandleTopValue
              // h = height
              // -- how far the moveable can move. 
              // -- height is calculated by sliderHeight - (aboveHandleTopValue + belowHandleTopValue)
              // -- e.g. given 3 handles
              // -- 0-100 data range, 25, 50, 75
              // 2) if we are doing the calculation for 50, t is handle75.top, h
              // -- h is now equal to 200 - handle75.top + handle25.top
              // 3) Now get the current handle...
              // 4) Check its boundaries and update accordingly

              if(this.handles.length > 0){
                
                previousIdx = (this.handles[array.indexOf(this.handles , i) - 1] !== null) ? this.handles[array.indexOf(this.handles , i) - 1] : null;       
                nextIdx = (this.handles[array.indexOf(this.handles , i) + 1] !== null) ? this.handles[array.indexOf(this.handles , i) + 1] : null;       
                
                previousMoveable = moveables[previousIdx];
                nextMoveable = moveables[nextIdx];
                
              }else{
                previousMoveable = moveables[i - 1];
                nextMoveable = moveables[i + 1];
              }

              if(previousMoveable && nextMoveable){

                previousMoveableTop = previousMoveable.style.top;
                nextMoveableTop = nextMoveable.style.top;
                previousPx = Number(previousMoveableTop.replace("px",""));
                nextPx = Number(nextMoveableTop.replace("px",""));
                
                constrainedMoveable.constraints = lang.hitch(this, function(){
                  return {     
                    t: nextPx + 2,     
                    l: (this._isLTR) ? 0 : this._sliderNodeWidth_RTL,     
                    w: 0,     
                    h: sliderHeight - nextPx - (sliderHeight - previousPx + 4)
                    }; 
                });
              
              }else if(previousMoveable){
              
                previousMoveableTop = previousMoveable.style.top;
                previousPx = Number(previousMoveableTop.replace("px",""));

                constrainedMoveable.constraints = lang.hitch(this, function(){
                  return {     
                    t: 0,     
                    l: (this._isLTR) ? 0 : this._sliderNodeWidth_RTL,     
                    w: 0,     
                    h: sliderHeight - (sliderHeight - previousPx + 2)
                    }; 
                });
                
              }else if(nextMoveable){

                nextMoveableTop = nextMoveable.style.top;
                nextPx = Number(nextMoveableTop.replace("px",""));

                constrainedMoveable.constraints = lang.hitch(this, function(){
                  return {     
                    t: nextPx + 2,     
                    l: (this._isLTR) ? 0 : this._sliderNodeWidth_RTL, 
                    w: 0,     
                    h: sliderHeight - (nextPx + 2)
                    }; 
                });
                
              }
            
            }else{
              console.log("this is the primary handle... it needs special rules... set some boundaries on it");
            }

          });
          
          constrainedMoveable.onMoved = lang.hitch(this, function (evt) {
            var position, outValue;
            
            // Special Case: Primary Handle
            if(i === this._primaryHandleIdx){

              var pixelDifference = Number(this._currentTopValue[i].replace("px","")) - Number(evt.node.style.top.replace("px",""));
              this._currentTopValue[i] = evt.node.style.top;
              
              array.forEach(moveables, lang.hitch(this, function(mover, idx){
              
                // Check for Handle
                if(mover){
                  
                  // Get Current Attributes
                  var currentTop = Number(mover.style.top.replace("px",""));

                  // Calculate the new style.top value
                  var newTopValue = currentTop - pixelDifference; 
                  
                  // Calculate the new label value
                  position = 1 - Number(newTopValue/sliderHeight);
                  outValue = parseFloat((Math.round((position * (max-min) + min) / step) * step).toFixed(precision));
                  
                  // Only Update if within max/min
                  if(outValue < min || outValue > max){
                    return;
                  }
                  
                  // Update the Slider
                  domStyle.set(mover, "top", newTopValue + "px");
                  
                  // Update Internal Reference
                  setValue(idx, outValue, false);
                    
                  // Update the Label
                  if (mover._label) {
                    mover._label.innerHTML = numberUtils.format(outValue);
                  }

                }
                
              }));
              
            }

            position = 1 - Number(evt.node.style.top.replace("px",""))/sliderHeight;
            outValue = parseFloat((Math.round((position * (max-min) + min) / step) * step));

            // Small Numbers....
            if(min < 1 && min > -1 && max < 1 && max > -1 ){
              outValue = ((position * (max-min) + min) / step) * step;
            }

            // Update the Label
            if (label) {
              label.innerHTML = numberUtils.format(numberUtils.round([this._roundedHandleLabels[i-1], outValue, this._roundedHandleLabels[i+1]])[1]);
            }
            
            setValue(i, outValue, false);
            
          });

          constrainedMoveable.onMoveStop = lang.hitch(this, function (evt) {
          
            var position, outValue;
            
            // Assignments
            position = 1 - Number(evt.node.style.top.replace("px",""))/sliderHeight;
            outValue = parseFloat((Math.round((position * (max-min) + min) / step) * step).toFixed(20));

            // Small Numbers...
            if(min < 1 && min > -1 && max < 1 && max > -1 ){
              outValue = ((position * (max-min) + min) / step) * step;
            }
            
            setValue(i, outValue, true);
            
            // Update the Labels via Praveen's method           
            this._updateRoundedLabels();

            if (label) {
              label.innerHTML = numberUtils.format(this._roundedHandleLabels[i]);
            }            

          });
          
          // Hide the Handles
          if(!this.showHandles){
            domStyle.set(handler, "display", "none");
          }
          
          return moveable;
          
        }));

        // Done and done!
        // -- Set reference to updated property
        this.moveables = moveables;
      
      },

      _updateRoundedLabels: function(){
      
        // Rounded boundaries (min/max)
        this._roundedDataLabels = numberUtils.round([this.minimum, this.maximum]);
        
        // Rounded Handle Labels
        switch(this.type){
          case "SizeInfoSlider":
            this._roundedHandleLabels = numberUtils.round(this.values);
            break;
          case "ColorInfoSlider":
            this._roundedHandleLabels = numberUtils.round(this._getValuesFromObject(this.values)); 
            break;
          case "ClassedSizeSlider":
            this._roundedHandleLabels = numberUtils.round(this.values);              
            break;
          case "ClassedColorSlider":
            this._roundedHandleLabels = numberUtils.round(this.values); 
            break;         
          case "OpacitySlider":
            this._roundedHandleLabels = numberUtils.round(this._getValuesFromObject(this.values)); 
            break;            
          default:
            //console.log("Label rounding is unsupported for this slider type: ", this.type);
        }
      },
      
      // Purpose:
      // -- Removes individuals from the moveables array, set to empty
      // Notes:
      // -- Moveables are individual domNode so the remove function is publicly accessible
      _reset: function(){
        // Loop and Destroy
        array.forEach(this.moveables, lang.hitch(this, function(moveable){
          if(moveable){
            //moveable.remove();
            // -- NOTES: the above is invalid for IE8> hence the use of removeChild() 
            moveable.parentElement.removeChild(moveable);
          }
        }));
        // Clear out one more time just in case...
        this.moveables = [];
      },
      
      _getValuesFromObject: function(obj){
        var arr = [];
        array.forEach(obj, function(o){
          arr.push(o.value);
        });
        return arr;
      },
      
      // Used for SmartLabelling but unused as of 2/20/2015
       _getDecimalPlaces: function(number) {
        // toFixed produces a fixed representation accurate to 20 decimal places
        // without an exponent.
        // The ^-?\d*\. strips off any sign, integer portion, and decimal point
        // leaving only the decimal fraction.
        // The 0+$ strips off any trailing zeroes.
        return dojoNumber.format(number, { places: "0,20", round: -1 }).replace(/^-?\d*\.?|0+$/g, '').length;
      },     
      
      // Purpose:
      // -- updates value property and bubbles up proper event
      // Notes:
      // -- Jerome Legacy Code
      setValue: function (index, value, atStop) {
      
        // Local Reference
        var values = this.get("values"),
            tempValues = values.slice(0);

        // Scope for Async
        if (typeof values[0] === "object") {
          tempValues[index].value = value;
        } else {
          tempValues[index] = value;
        }
        
        // Handle is Moving... Update Internals
        // -- this should fire its own update
        if (this.intermediateChanges || atStop) {
          this.set("values", tempValues);
        }
        
        // Events for top-level sliders
        if (atStop) {
          this.emit("stop", { values: this.get("values") });
        } else {
          this.emit("slide", { values: tempValues });
        }
      },
      
      // Purpose:
      // -- trigger function for bubbling up value change event
      _valuesChange: function () {
        this.emit("change", { values: this.get("values") });
      }
    });
  
    
    
    return RendererSlider;
  });
