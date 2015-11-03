define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/kernel",

  "dojo/dom-style",
  "dojo/dom-construct",

  "dojo/on",

  "dojo/i18n!../nls/jsapi",

  "../core/lang",
  "../core/domUtils",

  "../layers/FeatureLayer",

  "../layers/support/InheritedDomain",

  "dijit/_Widget",
  "dijit/_Templated",

  "dijit/Editor",
  "dijit/_editor/plugins/LinkDialog",
  "dijit/_editor/plugins/TextColor",

  "./Widget",
  "./editing/AttachmentEditor",
  "./editing/Util",

  "dijit/form/DateTextBox",
  "dijit/form/TextBox",
  "dijit/form/NumberTextBox",
  "dijit/form/FilteringSelect",
  "dijit/form/NumberSpinner",
  "dijit/form/Button",
  "dijit/form/SimpleTextarea",
  "dijit/form/ValidationTextBox",
  "dijit/form/TimeTextBox",
  "dijit/Tooltip",

  "dojo/data/ItemFileReadStore",

  "dojox/date/islamic",
  "dojox/date/islamic/Date",
  "dojox/date/islamic/locale",

  "dojo/text!./templates/AttributeInspector.html"
],
function(
  declare, lang, array, kernel,
  domStyle, domConstruct,
  on,
  jsapiBundle,
  esriLang, domUtils,
  FeatureLayer,
  InheritedDomain,
  _Widget, _Templated,
  Editor, LinkDialog, TextColor,
  Widget, AttachmentEditor, Util, DateTextBox, TextBox, NumberTextBox, FilteringSelect, NumberSpinner, Button, SimpleTextarea, ValidationTextBox, TimeTextBox, Tooltip,
  ItemFileReadStore,
  islamic, islmaicDate, islamicLocale,
  widgetTemplate
) {
  
/******************
* CSS class names
******************
* esriAttributeInspector
* atiLayerName
* atiField
* atiRichTextField
* atiTextAreaField
* atiLabel
* atiNavMessage
* atiButtons
* atiNavButtons
* atiButton
* atiPrevIcon
* atiNextIcon
* atiFirstIcon
* atiLastIcon
* atiDeleteButton
* atiAttachmentEditor
* atiTooltip
******************/
    
    var ATI = declare([ Widget, _Widget, _Templated], {
      declaredClass: "esri.widgets.AttributeInspector",

      widgetsInTemplate: true,
      //
      // not 100% sure about using require.toUrl ...
      // might want to use dojo/text in the dependency list instead
      //
      // templatePath: dojo.moduleUrl("esri.widgets", "templates/AttributeInspector.html"),
      // templatePath: require.toUrl("./templates/AttributeInspector.html"),
      templateString: widgetTemplate,
      _navMessage: "( ${idx} ${of} ${numFeatures} )",

/************
* Overrides
************/
      constructor: function(params, srcNodeRef){
          // Mixin i18n strings
          lang.mixin(this, jsapiBundle.widgets.attributeInspector);
          params = params || {};
          if (!params.featureLayer && !params.layerInfos){
              console.error("esri.AttributeInspector: please provide correct parameter in the constructor");
          }
          
          /*
          if(params.map){
          this.map = params.map;
            if(this.map._params.showInfoWindowOnClick){
              this.usePopupManager = true;
              this.map.setInfoWindowOnClick(false);
            }
          }
          */
          
          this._datePackage = this._getDatePackage(params);
          this._layerInfos = params.layerInfos || [{ featureLayer: params.featureLayer, options: params.options || [] }];
          //
          this._layerInfos = array.filter(this._layerInfos, function(item){
            return !item.disableAttributeUpdate;
          });
          this._aiConnects = [];
          this._selection = [];
          this._toolTips = [];
          this._numFeatures = 0;
          this._featureIdx = 0;
          this._currentLInfo = null;
          this._currentFeature = null;
          this._hideNavButtons = params.hideNavButtons || false;

      },

      postCreate: function(){
        if (array.every(this._layerInfos, function(layerInfo){return layerInfo.featureLayer.loaded;})) {
          this._initLayerInfos();
          this._createAttachmentEditor();
          this.onFirstFeature();
        }
        else {
          var count = this._layerInfos.length;
          array.forEach(this._layerInfos, function(layerInfo){
            var featureLayer = layerInfo.featureLayer;
            if (featureLayer.loaded) {
              count--;
            }
            else {
              var loadHandler = featureLayer.on("load", function(layer){
                loadHandler.remove();
                loadHandler = null;
                count--;
                if (!count) {
                  this._initLayerInfos();
                  this._createAttachmentEditor();
                  this.onFirstFeature();
                }
              }.bind(this));
            }
          }, this);
        }
      },

      destroy: function(){
      
        this._destroyAttributeTable();

        array.forEach( this._aiConnects, function(handle) {
          handle.remove();
        });
        delete this._aiConnects;

        if (this._attachmentEditor){
          this._attachmentEditor.destroy();
          delete this._attachmentEditor;
        }
        
        /*
        if(this.map && this.usePopupManager){
          this.map.setInfoWindowOnClick(true);
        }
        */
        
        delete this._layerInfos;
        
        this._selection = this._currentFeature = this._currentLInfo = this._attributes = this._layerInfos = null;
        this.inherited(arguments);
      },

/*****************
* Public Methods
*****************/
      refresh: function(){
          this._updateSelection();
      },

      first: function(){
          this.onFirstFeature();
      },

      last: function(){
          this.onLastFeature();
      },

      next: function(){
          this.onNextFeature();
      },

      previous: function(){
          this.onPreviousFeature();
      },
      
      showFeature: function(feature, fLayer){
        if (fLayer) {
          this._createOnlyFirstTime = true;
        }
        this._updateSelection([feature], fLayer);
        this._updateUI();
      },

/*****************
* Event Listeners
*****************/
      onLayerSelectionChange: function(layer, selection, selectionMethod){
        this._createOnlyFirstTime = false;
        this._featureIdx = (selectionMethod === FeatureLayer.SELECTION_NEW) ? 0 : this._featureIdx;
        this._updateSelection();
        this._updateUI();
      },

      onLayerSelectionClear: function(){
        if (!this._selection || this._selection.length <= 0){ return; }
        this._numFeatures = 0;
        this._featureIdx = 0;
        this._selection = [];
        this._currentFeature = null;
        this._currentLInfo = null;
        this._updateUI();
      },

      onLayerEditsComplete: function(lInfo, adds, updates, deletes){
        deletes = deletes || [];
        if (deletes.length){
          var selection = this._selection;
          var oidFld = lInfo.featureLayer.objectIdField;
          array.forEach(deletes, lang.hitch(this, function(del){
            array.some(selection, lang.hitch(this, function(item, idx){
                if (item.attributes[oidFld] !== del.objectId){ return false; }
                this._selection.splice(idx, 1);
                return true;
            }));
          }));
       }

        adds = adds || [];
        if (adds.length){
            this._selection = Util.findFeatures(adds, lInfo.featureLayer);
            this._featureIdx = 0;
        }

        var numFeatures = this._numFeatures = this._selection ? this._selection.length : 0;
        if (adds.length){
            var feature = numFeatures ? this._selection[this._featureIdx] : null;
            if (feature) {
              var fLayer = feature.getLayer();
              var editCapabilities = fLayer.getEditCapabilities();
              if (!(editCapabilities.canCreate && !editCapabilities.canUpdate)) {
                this._showFeature(feature);
              }
            }
            //show the UI;
            this._updateUI();
        }
        //when featurelayer.applyEdits() completes, it's not necessary to refresh the UI of attributeInsepctor for update case
        //because UI part shouldn't change.
        //So that the following line has been commented out.
        //If it's needed for some special cases, at least don't scroll it to top.
        //this._updateUI();
      },

      onFieldValueChange: function(fInfo, newFieldVal){
        newFieldVal = (typeof newFieldVal === 'undefined') ? null : newFieldVal;
        var field = fInfo.field;
        // Convert to epoch time if fieldType is date/time
        if (field.type === "esriFieldTypeDate"){
          if(fInfo.dijit instanceof Array){
            // Get individual date values for sync
            var dateObj = fInfo.dijit[0].getValue();
            var timeObj = fInfo.dijit[1].getValue();
            if(dateObj && timeObj){
              newFieldVal = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), timeObj.getHours(), timeObj.getMinutes(), timeObj.getSeconds(), timeObj.getMilliseconds());
            }else{
             newFieldVal = dateObj || timeObj || null;
            }     
            // Sync the Data -- NOTE: causes event to fire twice       
            //fInfo.dijit[0].setValue(newFieldVal);
            //fInfo.dijit[1].setValue(newFieldVal);
          }else{
            newFieldVal = fInfo.dijit.getValue();
          }
          newFieldVal = (newFieldVal && newFieldVal.getTime) ? newFieldVal.getTime() : (newFieldVal && newFieldVal.toGregorian ? newFieldVal.toGregorian().getTime() : newFieldVal);
        }
        
        if (this._currentFeature.attributes[field.name] === newFieldVal){ return; } 

        var lInfo = this._currentLInfo;
        var feature = this._currentFeature;
        var fieldName = field.name;
        // If typeField changed, update all domain fields
        if (fieldName === lInfo.typeIdField){
            var type = this._findFirst(lInfo.types, 'id', newFieldVal);
            var fInfos = lInfo.fieldInfos;
            array.forEach(fInfos, function(fInfo){
              field = fInfo.field;
              if (!field || field.name === lInfo.typeIdField){ return; }
              var node = fInfo.dijit;
              var domain = this._setFieldDomain(node, type, field);
              if (domain && node){
                this._setValue(node, feature.attributes[field.name] + '');
                if (node.isValid() === false){
                  this._setValue(node, null);
                }
              }
            }, this);
        }

        this.emit("attribute-change", {
          feature: feature,
          fieldName: fieldName,
          fieldValue: newFieldVal
        });
      },

      onDeleteBtn: function(evt){
          this._deleteFeature();
      },

      onNextFeature: function(evt){
          this._onNextFeature(1);
      },

      onPreviousFeature: function(evt){
          this._onNextFeature( -1);
      },

      onFirstFeature: function(evt){
          this._onNextFeature(this._featureIdx * -1);
      },

      onLastFeature: function(evt){
          this._onNextFeature((this._numFeatures - 1) - this._featureIdx);
      },

/*******************
* Internal Methods
*******************/
      _initLayerInfos: function(){
        var lInfos = this._layerInfos;
        this._editorTrackingInfos = {};
        array.forEach(lInfos, this._initLayerInfo, this);
      },

      _initLayerInfo: function(lInfo){
        var fLayer = lInfo.featureLayer,
            globalIdFieldInFInfos,
            oidFieldInFInfos;
        
        //specify user ids for each secured layer
        this._userIds = {};
        var layerId = fLayer.id;
        if (fLayer.credential) {
          this._userIds[layerId] = fLayer.credential.userId;
        }
        if (lInfo.userId) {
          this._userIds[layerId] = lInfo.userId;
        }
        
        // Connect events
        this._connect(fLayer, "onSelectionComplete", lang.hitch(this, "onLayerSelectionChange", lInfo));
        this._connect(fLayer, "onSelectionClear", lang.hitch(this, "onLayerSelectionClear", lInfo));
        this._connect(fLayer, 'onEditsComplete', lang.hitch(this, 'onLayerEditsComplete', lInfo));

        // Initialize layerInfo metadata
        lInfo.showAttachments = fLayer.hasAttachments ? (esriLang.isDefined(lInfo.showAttachments) ? lInfo.showAttachments : true) : false;
        lInfo.hideFields = lInfo.hideFields || [];
        lInfo.htmlFields = lInfo.htmlFields || [];
        lInfo.isEditable = fLayer.isEditable() ? (esriLang.isDefined(lInfo.isEditable) ? lInfo.isEditable : true) : false;
        lInfo.typeIdField = fLayer.typeIdField;
        lInfo.layerId = fLayer.id;
        lInfo.types = fLayer.types;
        
        // Hide globalId and objectId by default, unless inserted into fInfos
        if (fLayer.globalIdField){
          globalIdFieldInFInfos = this._findFirst(lInfo.fieldInfos, "fieldName", fLayer.globalIdField);
          if (!globalIdFieldInFInfos && !lInfo.showGlobalID){
            lInfo.hideFields.push(fLayer.globalIdField);
          }
        }
                                            
        oidFieldInFInfos = this._findFirst(lInfo.fieldInfos, "fieldName", fLayer.objectIdField);
        if (!oidFieldInFInfos && !lInfo.showObjectID){
          lInfo.hideFields.push(fLayer.objectIdField);
        }
        
        // Initialize fieldInfos (if no fieldInfos in layerInfo then create default fieldInfos)
        var fields = this._getFields(lInfo.featureLayer);
        if (!fields){ return; }
        //var fInfos = (lInfo.fieldInfos && lInfo.fieldInfos.length) ? dojo.clone(lInfo.fieldInfos) : [];
        var fInfos = lInfo.fieldInfos || [];
        fInfos = array.map(fInfos, function(fInfo){
          return lang.mixin({}, fInfo);
        });
        if (!fInfos.length){
            fields = array.filter(fields, lang.hitch(this, function(field){ return !this._isInFields(field.name, lInfo.hideFields); }));
            lInfo.fieldInfos = array.map(fields, lang.hitch(this, function(field){
                var stringFieldOption = (this._isInFields(field.name, lInfo.htmlFields ) ? ATI.STRING_FIELD_OPTION_RICHTEXT : ATI.STRING_FIELD_OPTION_TEXTBOX);
                return {'fieldName':field.name, 'field':field, 'stringFieldOption': stringFieldOption};
            }));
        } else {
            lInfo.fieldInfos = array.filter(array.map(fInfos, lang.hitch(this, function(fInfo){
              var stringFieldOption = fInfo.stringFieldOption || (this._isInFields(fInfo.fieldName, lInfo.htmlFields) ? ATI.STRING_FIELD_OPTION_RICHTEXT : ATI.STRING_FIELD_OPTION_TEXTBOX);
              return lang.mixin(fInfo, {'field': this._findFirst(fields, 'name', fInfo.fieldName), 'stringFieldOption':stringFieldOption});
            })), 'return item.field;');
        }
        
        // Support legacy case of using showGlobalID and showObjectId, if set to true
        // add them to the fInfos if not there
        if (lInfo.showGlobalID && !globalIdFieldInFInfos){
          fInfos.push(this._findFirst(fields, "name", fLayer.globalIdField));
        }
        
        if (lInfo.showObjectID && !oidFieldInFInfos){
          fInfos.push(this._findFirst(fields, "name", fLayer.objectIdField));
        }
      
        //find editor tracking info
        var editorTrackingFields = [];
        if (fLayer.editFieldsInfo){
          if (fLayer.editFieldsInfo.creatorField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.creatorField);
          }
          if (fLayer.editFieldsInfo.creationDateField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.creationDateField);
          }
          if (fLayer.editFieldsInfo.editorField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.editorField);
          }
          if (fLayer.editFieldsInfo.editDateField) {
            editorTrackingFields.push(fLayer.editFieldsInfo.editDateField);
          }
        }
        this._editorTrackingInfos[fLayer.id] = editorTrackingFields;
      },

      _createAttachmentEditor: function(){
        this._attachmentEditor = null;
        var lInfos = this._layerInfos;
        var create = array.filter(lInfos, function(item) {
            return item.showAttachments;
        });
        if (!create || !create.length){ return; }
        this._attachmentEditor = new AttachmentEditor({'class':'atiAttachmentEditor'}, this.attachmentEditor);
        this._attachmentEditor.startup();
      },

      _setCurrentLInfo: function(lInfo){
        // Set the layerInfo for the feature currently being edited
        var currentLayer = this._currentLInfo ? this._currentLInfo.featureLayer : null;
        var fLayer = lInfo.featureLayer;
        //Update currentLayerInfo only if layer has changed since last call
        //But if ownershipbasedAccessControl is enabled, it should recreate the table since the editable fields may change according to features
        //If it's a create only feature layer, the table should be recreated every time as well.
        if (currentLayer && currentLayer.id === fLayer.id && !currentLayer.ownershipBasedAccessControlForFeatures){
            var editCapabilities = fLayer.getEditCapabilities();
            if (!(editCapabilities.canCreate && !editCapabilities.canUpdate)) {
                return;
            }
        }
        this._currentLInfo = lInfo;
        this._createTable();
      },

      _updateSelection: function(selectedFeatures, fLayer) {
        this._selection = selectedFeatures || [];
        var lInfos = this._layerInfos;
        array.forEach(lInfos, this._getSelection, this);
        var numFeatures = this._selection.length;
        this._numFeatures = this._selection.length;
        var feature = numFeatures ? this._selection[this._featureIdx] : null;
        this._showFeature(feature, fLayer);
      },

      _getSelection: function(lInfo){
        var selection = lInfo.featureLayer.getSelectedFeatures();
        this._selection = this._selection.concat(selection);
        //dojo.forEach(selection, function(feature){ feature.__lInfo = lInfo; }, this);
      },

      _updateUI: function(){
        var numFeatures = this._numFeatures;
        var lInfo = this._currentLInfo;
        this.layerName.innerHTML = (!lInfo || numFeatures === 0) ? this.NLS_noFeaturesSelected : (lInfo.featureLayer ? lInfo.featureLayer.name : '');

        domStyle.set(this.attributeTable, "display", numFeatures ? "" : "none");
        domStyle.set(this.editButtons, "display", numFeatures ? "": "none");
        domStyle.set(this.navButtons, "display", (!this._hideNavButtons && (numFeatures > 1) ? "": "none"));
        this.navMessage.innerHTML = esriLang.substitute({idx: this._featureIdx + 1, of:this.NLS_of, numFeatures:this._numFeatures}, this._navMessage);
        
        if (this._attachmentEditor){
            domStyle.set(this._attachmentEditor.domNode, "display", ((lInfo && lInfo.showAttachments) && numFeatures) ? "": "none");
        }
        
        var showDeleteBtn = ((lInfo && lInfo.showDeleteButton === false) || !this._canDelete) ? false: true;
        domStyle.set(this.deleteBtn.domNode, "display", showDeleteBtn ? "": "none");
        
        // Reset the scrollbar to top
        if (this.domNode.parentNode && this.domNode.parentNode.scrollTop > 0){ this.domNode.parentNode.scrollTop = 0; }
      },

      _onNextFeature: function(direction){
        this._featureIdx += direction;
        if (this._featureIdx < 0){
            this._featureIdx = this._numFeatures - 1;
        } else if (this._featureIdx >= this._numFeatures){
            this._featureIdx = 0;
        }
        var feature = this._selection.length ? this._selection[this._featureIdx] : null;
        this._showFeature(feature);
        this._updateUI();
        this.emit("next", {
          feature: feature
        });
      },

      _deleteFeature: function(){
        this.emit("delete", {
          feature: this._currentFeature
        });
      },

      _showFeature: function(feature, fLayer){
        //Return if called with feature already being edited
        //if (!feature || feature === this._currentFeature){ return; }
        if (!feature){ return; }
        this._currentFeature = feature;
        var featureLayer = fLayer ? fLayer : feature.getLayer();
        //get edit capabilities info
        var featureEditCapabilities = featureLayer.getEditCapabilities({feature: feature, userId: this._userIds[featureLayer.id]});
        this._canUpdate = featureEditCapabilities.canUpdate;
        this._canDelete = featureEditCapabilities.canDelete;
        
        var lInfo = this._getLInfoFromFeatureLayer(featureLayer);
        if (!lInfo){ return; }
        this._setCurrentLInfo(lInfo);
        var attributes = feature.attributes;
        var type = this._findFirst(lInfo.types, 'id', attributes[lInfo.typeIdField]);
        var node, field = null;
        var fInfos = lInfo.fieldInfos;
        array.forEach(fInfos, function(fInfo){
        
            field = fInfo.field;
            var nodes = [];
            
            if(fInfo.dijit && fInfo.dijit.length > 1){
              array.forEach(fInfo.dijit, function(d){
                nodes.push(d);
              });
            }else{
              nodes.push(fInfo.dijit);
            }
            
            array.forEach(nodes, lang.hitch(this, function(node){
              if (!node){ return; }
              
              var domain = this._setFieldDomain(node, type, field);
              var value = attributes[field.name];
              value = (value && domain && domain.codedValues && domain.codedValues.length) ? (domain.codedValues[value] ? domain.codedValues[value].name : value) : value;
              if (!esriLang.isDefined(value)){ value = ''; }
              if (node.declaredClass === "dijit.form.DateTextBox" || node.declaredClass === "dijit.form.TimeTextBox"){
                  value = (value === '') ? null : new Date(value);
              } else if (node.declaredClass === 'dijit.form.FilteringSelect'){
                  node._lastValueReported = null;
                  value = attributes[field.name] + '';
              }
              try{
                  this._setValue(node, value);
                  if (node.declaredClass === 'dijit.form.FilteringSelect' && node.isValid() === false){
                    this._setValue(node, null);
                  }
              } catch(error){
                  node.set('displayedValue', this.NLS_errorInvalid, false);
              }
            }));
            
        }, this);
        
        if (this._attachmentEditor && lInfo.showAttachments){
            this._attachmentEditor.showAttachments(this._currentFeature);
        }
        
        var editorTrackingInfo = featureLayer.getEditSummary(feature);
        if (editorTrackingInfo) {
          this.editorTrackingInfoDiv.innerHTML = editorTrackingInfo;
          domUtils.show(this.editorTrackingInfoDiv);
        } else {
          domUtils.hide(this.editorTrackingInfoDiv);
        }
      },

      _setFieldDomain: function(node, type, field){
        if (!node){ return null; }
        var domain = field.domain;
        if (type && type.domains){
          if (type.domains[field.name] && type.domains[field.name] instanceof InheritedDomain === false){
            domain = type.domains[field.name];
          }
        }
        if (!domain){ return null; }
        if (domain.codedValues && domain.codedValues.length > 0){
          node.set("store", this._toStore(array.map(domain.codedValues, function(item) {
              return { id: item.code += '', name: item.name };
          })));
          this._setValue(node, domain.codedValues[0].code);
        } else{
          node.constraints = { min: esriLang.isDefined(domain.minValue) ? domain.minValue : Number.MIN_VALUE, max: esriLang.isDefined(domain.maxValue) ? domain.maxValue : Number.MAX_VALUE};
          this._setValue(node, node.constraints.min);
        }
        return domain;
      },
      
      _setValue : function(node, value){
        if (!node.set){ return; }
        node._onChangeActive = false;
        node.set('value', value, true);
        node._onChangeActive = true;
      },

      _getFields: function(featureLayer){
        var outFields = featureLayer._getOutFields();
        if (!outFields){ return null; }
        var fields = featureLayer.fields;
        return (outFields == "*") ? fields : array.filter(array.map(outFields, lang.hitch(this, '_findFirst', fields, 'name')), esriLang.isDefined);
      },

      _isInFields: function(fieldName, fieldArr){
        if (!fieldName || !fieldArr && !fieldArr.length){ return false; }
        return array.some(fieldArr, function(name){
            return name.toLowerCase() === fieldName.toLowerCase();
        });
      },

      _findFirst: function(collection, propertyName, value){
        var result = array.filter(collection, function(item){
            return item.hasOwnProperty(propertyName) && item[propertyName] === value;
        });
        return (result && result.length) ? result[0] : null;
      },
      
      _getLInfoFromFeatureLayer: function(fLayer){
        var layerId = fLayer ? fLayer.id : null;
        return this._findFirst(this._layerInfos, "layerId", layerId);
      },

      _createTable: function(){
        this._destroyAttributeTable();
        this.attributeTable.innerHTML = "";
        this._attributes = domConstruct.create("table", { cellspacing: "0", cellpadding: "0" }, this.attributeTable);
        var tbody = domConstruct.create("tbody", null, this._attributes);
        var feature = this._currentFeature;
        var lInfo = this._currentLInfo;
        var type = this._findFirst(lInfo.types, 'id', feature.attributes[lInfo.typeIdField]);
        var fInfos = lInfo.fieldInfos;
        array.forEach(fInfos, lang.hitch(this, '_createField', type, tbody), this);
        this._createOnlyFirstTime = false;
      },
      
      _createField: function(type, tbody, fInfo){
        var lInfo = this._currentLInfo;
        var field = fInfo.field;
        if (this._isInFields(field.name, lInfo.hideFields)){ return; }
        if (this._isInFields(field.name, this._editorTrackingInfos[lInfo.featureLayer.id])){ return; }
        var node = domConstruct.create("tr", null, tbody);
        //var isRichTextFld = fInfo.stringFieldOption === esri.widgets.AttributeInspector.STRING_FIELD_OPTION_RICHTEXT;
        var td = domConstruct.create("td", { innerHTML: fInfo.label || field.alias || field.name, 'class': 'atiLabel' }, node);
        //if (!isRichTextFld){ td = dojo.create("td", null, node); }
        td = domConstruct.create("td", null, node);
        
        var fieldDijit, timeDijit = null;
        var disabled = false;
        if (fInfo.customField){
          domConstruct.place(fInfo.customField.domNode || fInfo.customField, domConstruct.create("div", null, td), "first");
          fieldDijit = fInfo.customField;
        }
        //check ownership based access control and capabilities by this._canUpdate
        else if (lInfo.isEditable === false || field.editable === false || fInfo.isEditable === false ||
                   field.type === "esriFieldTypeOID" || field.type === "esriFieldTypeGlobalID"||
              (!this._canUpdate && !this._createOnlyFirstTime)){
            disabled = true;
        }
        
        if (!fieldDijit && (lInfo.typeIdField && field.name.toLowerCase() == lInfo.typeIdField.toLowerCase())){
            fieldDijit = this._createTypeField(field, fInfo, td);
        } else if (!fieldDijit) {
            fieldDijit = this._createDomainField(field, fInfo, type, td);
        }
        
        if (!fieldDijit){
          switch (field.type){
            case "esriFieldTypeString":
              fieldDijit = this._createStringField(field, fInfo, td);
              break;
            case "esriFieldTypeDate":
              fieldDijit = this._createDateField(field, fInfo, td);
              if(fInfo.format && fInfo.format.time){
                timeDijit = this._createTimeField(field, fInfo, td);
              }
              break;
            case "esriFieldTypeInteger":
            case "esriFieldTypeSmallInteger":
              fieldDijit = this._createIntField(field, fInfo, td);
              break;
            case "esriFieldTypeSingle":
            case "esriFieldTypeDouble":
              fieldDijit = this._createFltField(field, fInfo, td);
              break;
            default:
              fieldDijit = this._createStringField(field, fInfo, td);
              break;
          }
        }
        // Add tooltip
        if (fInfo.tooltip && fInfo.tooltip.length){ this._toolTips.push(new Tooltip({ connectId: [fieldDijit.id], label:fInfo.tooltip}));}
        fieldDijit.onChange = lang.hitch(this, "onFieldValueChange", fInfo);
        fieldDijit.set('disabled', disabled);
        
        if(timeDijit){
          fInfo.dijit = [fieldDijit, timeDijit];
          timeDijit.onChange = lang.hitch(this, "onFieldValueChange", fInfo);
          timeDijit.set('disabled', disabled);
        }else{
          fInfo.dijit = fieldDijit;
        }
      },

      _createTypeField: function(field, fInfo, node){
        return new FilteringSelect({
          'class': 'atiField',
          name: field.alias || field.name,
          store: this._toStore(array.map(this._currentLInfo.types, function(item) {
              return { id: item.id, name: item.name };
          })),
          searchAttr: "name"
        }, domConstruct.create("div", null, node));
      },

      _createDomainField: function(field, fInfo, type, node){
        var domain = field.domain;
        if (type && type.domains){
          if (type.domains[field.name] && type.domains[field.name] instanceof InheritedDomain === false){
            domain = type.domains[field.name];
          }
        }
        if (!domain){ return null; }
        if (domain.codedValues){
          return new FilteringSelect({
            'class': 'atiField',
            name: field.alias || field.name,
            //store: null,
            searchAttr: "name",
            required: field.nullable || false
          }, domConstruct.create("div", null, node));
        } else{
          return new NumberSpinner({
            'class': 'atiField'
          }, domConstruct.create("div", null, node));
        }
      },

      _createStringField: function(field, fInfo, node){
        var params = {
          'class': 'atiField',
          trim: true,
          maxLength: field.length
        };
        
        if (fInfo.stringFieldOption === ATI.STRING_FIELD_OPTION_TEXTAREA){
          params['class'] += ' atiTextAreaField';
          return new SimpleTextarea(params, domConstruct.create("div", null, node));
        }else if(fInfo.stringFieldOption === ATI.STRING_FIELD_OPTION_RICHTEXT){
          //node.colSpan = 2;
          params['class'] += ' atiRichTextField';
          params.height = '100%';
          params.width = '100%';
          params.plugins = fInfo.richTextPlugins || ['bold', 'italic', 'underline', 'foreColor', 'hiliteColor', '|', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', '|', 'insertOrderedList', 'insertUnorderedList', 'indent', 'outdent', '|', 'createLink'];
          var editorField = new Editor(params, domConstruct.create("div", null, node));
          editorField.startup();
          return editorField;
        }else{
          if (!field.nullable || !(fInfo.field && fInfo.field.nullable)) {
            return new ValidationTextBox({required: true}, domConstruct.create("div", null, node));
          } else {
            return new TextBox(params, domConstruct.create("div", null, node));
          }
        }
      },

      _createTimeField: function(field, fInfo, node){
        var params = {'class': 'atiField', 'trim': true, "constraints": {"formatLength" : "medium"}};
        if (this._datePackage){  params.datePackage = this._datePackage; }
        return new TimeTextBox(params, domConstruct.create("div", null, node));
      },
      
      _createDateField: function(field, fInfo, node){
          var params = {'class': 'atiField', 'trim': true};
          if (this._datePackage){ params.datePackage = this._datePackage; }
          return new DateTextBox(params, domConstruct.create("div", null, node));
      },

      _createIntField: function(field, fInfo, node){
        var cons = (field.type === "esriFieldTypeSmallInteger") ? {min:-32768, max: 32767, places: 0 } : { places: 0 };
        return new NumberTextBox({
            'class': 'atiField',
            constraints: cons,
            invalidMessage: this.NLS_validationInt,
            trim: true
        }, domConstruct.create("div", null, node));
      },

      _createFltField: function(field, fInfo, node){
        return new NumberTextBox({
            'class': 'atiField',
            trim: true,
            constraints: {"places": "0,20"},
            invalidMessage: this.NLS_validationFlt
        }, domConstruct.create("div", null, node));
      },

      _toStore: function(items){
        return new ItemFileReadStore({
            data: { identifier: "id", label: "name", items: items }
        });
      },
      
      _connect: function(node, evt, func){
        this._aiConnects.push(on(node, evt, func));
      },
      
      _getDatePackage: function(params) {
        if (params.datePackage === null){
          return null;
        } else if (params.datePackage){
          return params.datePackage;
        } else if (kernel.locale === 'ar'){
          return 'dojox.date.islamic';
        }else{
          return null;
        }
      },

      _destroyAttributeTable: function(){
        var lInfos = this._layerInfos;
        array.forEach(lInfos, function(lInfo){
          var fInfos = lInfo.fieldInfos;
          array.forEach(fInfos, function(fInfo){
            var dijit = fInfo.dijit;
            if (dijit){
                dijit._onChangeHandle = null;
                if (fInfo.customField){ return; }
                if(dijit instanceof Array){
                  array.forEach(dijit, lang.hitch(this, function(d){
                  if (d.destroyRecursive){
                    d.destroyRecursive();
                  } else if (d.destroy){
                    d.destroy();
                  }
                  d._onChangeHandle = null;
                  }));
                }else{
                  if (dijit.destroyRecursive){
                    dijit.destroyRecursive();
                  } else if (dijit.destroy){
                    dijit.destroy();
                  }
                }
            }
            fInfo.dijit = null;
          }, this);
        }, this);
        var toolTips = this._toolTips;
        array.forEach(toolTips, function(item) {
          item.destroy();
        });
        this._toolTips = [];
        if (this._attributes){
          domConstruct.destroy(this._attributes);
        }
      }
    });
 
    lang.mixin(ATI, {
        STRING_FIELD_OPTION_RICHTEXT: "richtext", STRING_FIELD_OPTION_TEXTAREA: "textarea", STRING_FIELD_OPTION_TEXTBOX: "textbox"
    });

    return ATI;
});
