define([
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Color",

  "dojo/dom-construct",
  "dojo/number",
  "dojo/on",
  "dojo/query",
  "dojo/topic",

  "dojo/date/locale",

  "dojo/dnd/Source",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",

  "../renderers/SimpleRenderer",

  "../symbols/SimpleFillSymbol",

  "../tasks/ImageServiceIdentifyTask",
  "../tasks/QueryTask",

  "../tasks/support/ImageServiceIdentifyParameters",
  "../tasks/support/Query",

  "../geometry/Polygon",
  "../geometry/Point",
  "../geometry/Extent",

  "../layers/GraphicsLayer",

  "../layers/support/MosaicRule",
  
  "dojo/i18n!../nls/jsapi",
  
  "dojo/text!./templates/MosaicRule.html",

  "dijit/Calendar",
  "dijit/form/DropDownButton",
  "dijit/form/CheckBox",
  "dijit/TooltipDialog",
  "dijit/layout/ContentPane"
],

function (
  declare, lang, array, Color,
  domConstruct, number, on, query, topic,
  locale,
  dndSource,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  SimpleRenderer,
  SimpleFillSymbol,
  ImageServiceIdentifyTask, QueryTask,
  ImageServiceIdentifyParameters, esriQuery,
  Polygon, Point, Extent,
  GraphicsLayer,
  MosaicRule,
  jsapiBundle,
  template
  ) {
  var Widget = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    declaredClass: "esri.widgets.MosaicRule",
    templateString: template,
    widgetsInTemplate: true,
    layer: null, //layer on which the rendering rule is set
    map: null, //map object
    parent: null, //boolean, if true, the parent element will be resized
    hideApplyButton: false,
    hideLockRasterSelectionIdButton: false,
    _MosaicRuleObject: null, //Mosaic rule object to set the mosaic properties
    _fieldType: null, //array for storing the type of order field(i.e date, integer, double etc)
    _identifyTask: null,
    _identify: null, //identify for getting IDs for lock raster method
    _queryTask: null,
    _query: null, //query for getting geometry for lock raster method
    _graphicsLayer: null, //highlights individual rasters
    _app: null,
    _initialExtent: null, //initial map extent
    _getpoint: null, //boolean, if false clears the selection list for layerlist
    _internalApplyMosaic: false, //boolean, this stores the info if the mosaic rule is set within the widget
    _previousOrderFieldIndex: -1,

    constructor: function (args) {
      declare.safeMixin(this, args);
      this._i18n = jsapiBundle;
      //this._MosaicRuleObject = new MosaicRule();
      var renderer = new SimpleRenderer(new SimpleFillSymbol().setColor(new Color([150, 150, 150, 0.5])));
      this._graphicsLayer = new GraphicsLayer();
      this._graphicsLayer.setRenderer(renderer);
      this.map.addLayer(this._graphicsLayer);
    },

    startup: function () {
      this.inherited(arguments);
      var onclickTooltip = lang.hitch(this, "_onclickTooltip");
      var oncloseTooltip = lang.hitch(this, "_oncloseTooltip");
      var onclickLayerlist = lang.hitch(this, "_onclickLayerlist");
      var OnOpenQueryPopup = lang.hitch(this, "_OnOpenQueryPopup");
      var OnCloseQueryPopup = lang.hitch(this, "_OnCloseQueryPopup");
      var OnChangeMosaicRule = lang.hitch(this, "_OnChangeMosaicRule");
      var OnChangeOrderField = lang.hitch(this, "_OnChangeOrderField");
      var OnChangeLockRaster = lang.hitch(this, "_OnChangeLockRaster");
      var OnClickCurrentExtent = lang.hitch(this, "_OnClickCurrentExtent");
      var OnChangeMosaicOperator = lang.hitch(this, "_OnChangeMosaicOperator");
      var OnClickDescending = lang.hitch(this, "_OnClickDescending");
      var OnChangeQueryOrderField = lang.hitch(this, "_OnChangeQueryOrderField");
      var OnChangeQueryOperator = lang.hitch(this, "_OnChangeQueryOperator");
      var OnKeyupQueryValue = lang.hitch(this, "_OnKeyupQueryValue");
      var OnClickApplyMosaic = lang.hitch(this, "_OnClickApplyMosaic");
      var OnClickResetMosaic = lang.hitch(this, "_OnClickResetMosaic");
      this._lockRasterTooltip.on("click", onclickTooltip);
      this._lockRasterTooltip.on("close", oncloseTooltip);
      this._queryTooltip.on("open", OnOpenQueryPopup);
      this._queryTooltip.on("close", OnCloseQueryPopup);
      on(this._layerList, "click", onclickLayerlist);
      on(this._mosaicRule, "change", OnChangeMosaicRule);
      on(this._orderField, "change", OnChangeOrderField);
      on(this._lockRaster, "keyup", OnChangeLockRaster);
      on(this._aoi, "click", OnClickCurrentExtent);
      on(this._mosaicOperator, "change", OnChangeMosaicOperator);
      on(this._descending, "click", OnClickDescending);
      on(this._queryOrderField, "change", OnChangeQueryOrderField);
      on(this._queryOperator, "change", OnChangeQueryOperator);
      on(this._queryValue, "keyup", OnKeyupQueryValue);
      on(this._apply, "click", OnClickApplyMosaic);
      topic.subscribe("onMosaicRuleApply", OnClickApplyMosaic);
      topic.subscribe("onMosaicRuleReset", OnClickResetMosaic);
      this._descending.checked = false;
      //this._MosaicRuleObject.ascending = !this._descending.checked;
      if (this.hideApplyButton) {
        this._apply.style.display = "none";
      }
      if (this.hideLockRasterSelectionIdButton) {
        this._lockRasterIdSelect.domNode.style.display = "none";
        this._lockRaster.style.width = "100%";
      }

      // disable query functionality...
      this._where.style.display = "none";
      this._whereLabel.style.display = "none";
      this._queryBlock.domNode.style.display = "none";
    },

    _init: function () {
      this._MosaicRuleObject = new MosaicRule();
      this._MosaicRuleObject.ascending = true;
      this._getpoint = 0;
      this._fieldType = [];
      this._app = {};
      domConstruct.empty(this._layerList);
      this._orderValueDate.domNode.style.display = "none";
      this._identifyTask = new ImageServiceIdentifyTask(this.layer.url);
      this._identify = new ImageServiceIdentifyParameters();
      this._queryTask = new QueryTask(this.layer.url);
      this._query = new esriQuery();
    },

    _buildRasterList: function () {
      this._lockRasterMsg.style.display = "";
      this._lockRasterMsg.innerHTML = this._i18n.widgets.mosaicRule.lockRasterRequestMsg;

      // Use map extent if you are zoomed into the layer else use layer's full extent
      // because Identify does not work well if the extent is outside the layers extent
      var extent = new Extent(this.layer.fullExtent.toJSON());
      if (this.layer.fullExtent.contains(this.map.extent)) {
        extent = new Extent(this.map.extent.toJSON());
      }

      if (this.layer.version >= 10 && this.map.wrapAround180) {
        extent = extent._normalize(true);
      }

      // convert extent to polygon
      var polygon = Polygon.fromExtent(extent);

      var psX = (extent.xmax - extent.xmin) / (this.map.width * 2);
      var psY = (extent.ymax - extent.ymin) / (this.map.height * 2);
      var psSR = extent.spatialReference;
      var pixelSize = new Point(psX, psY, psSR);

      var theTask = this._identifyTask;
      var theTaskArgs = this._identify;
      if (this.layer.version > 10.1) {
        theTask = this._queryTask;
        theTaskArgs = this._query;
      }

      // set parameters
      theTaskArgs.geometry = polygon;
      theTaskArgs.pixelSize = pixelSize;
      theTaskArgs.returnGeometry = false;

      var errorRastersInAOI = lang.hitch(this, "_errorRastersInAOI");
      var showRastersInAOI = lang.hitch(this, "_showRastersInAOI");
      theTask.execute(theTaskArgs, function (results) {
        showRastersInAOI(results);
      }, function (error) {
        errorRastersInAOI(error);
      });
    },

    _setLayerAttr: function (value) {
      this.inherited(arguments);

      this.layer = value;
      // if someone else changes the mosaic rule on the layer from outside of this dijit then it has to refresh itself to reflect the current state...
      this.layer.on("mosaic-rule-change", lang.hitch(this, "_onLayerMosaicRuleChange"));  //lang.partial(lang.hitch(this, "_setDefaultValues"), this.layer.mosaicRule)

      this._init();

      var i;
      for (i = this._mosaicRule.options.length - 1; i >= 0; i--) {
        this._mosaicRule.remove(i);
      }

      for (i = this._mosaicOperator.options.length - 1; i >= 0; i--) {
        this._mosaicOperator.remove(i);
      }

      i = this._orderField.options.length;
      while (i > 0) {
        this._orderField.remove(i - 1);
        i = this._orderField.options.length;
      }
      //for( i = this._orderField.options.length - 1; i >= 0; i--) {
      //  this._orderField.remove(i);
      //}
      this._orderValueText.value = "";

      this._where.value = "<where>";
      this._orderFieldBlock.style.display = "";
      this._lockRasterBlock.style.display = "";
      this._descendingBlock.style.display = "";
      this._graphicsLayer.clear();
      
      var initUsingServiceInfo = lang.hitch(this, "_initUsingServiceInfo");
      if (this.layer.loaded) {
        this._initUsingServiceInfo(this.layer);
      }
      else {
        this.layer.on("load", initUsingServiceInfo);
      }
    },

    _initUsingServiceInfo: function (layer) {
      // hide all controls for non MD services
      if (!layer.fields || layer.fields.length === 0) {
        this._mosaicRuleLabel.innerHTML =  this._i18n.widgets.mosaicRule.mosaicruleNotApplicable;
        this._hideAllControls();
        return;
      }
      
      // Populate controls using the default mosaic propeties i.e. Mosaic method,mosaic Operator, Sortfield & Sort value of the service.
      var extent = new Extent(layer.extent);
      this._initialExtent = extent;
      if (!this.hideLockRasterSelectionIdButton) {
        this._buildRasterList(); // get rasters for locking only if the lock raster selection is enabled
      }

      // Populate a drop down list of the allowed sort fields supported by the service
      this._populateOrderFieldsList(layer.fields);
      if (layer.sortField)//If layer.sortField exists then set the _MosaicRuleObject
      {
        this._MosaicRuleObject.sortField = layer.sortField;
      }

      if (layer.sortValue)//If layer.sortvalue exists then set the _MosaicRuleObject
      {
        this._orderValueText.value = layer.sortValue;
        this._MosaicRuleObject.sortValue = layer.sortValue;
        if(this._fieldType[this._orderField.selectedIndex] === "esriFieldTypeDate")
        {
          this._orderValueDate.set("value",new Date(this._MosaicRuleObject.sortValue));
        }
      }

      // the list of mosaic methods if allowed mosaic methods are not defined within the service
      // these should not be localized
      var mosaicMethodsList = "None,ByAttribute,Center,Nadir,LockRaster,NorthWest,Seamline";

      //Only for image service version 10.1 or higher , default mosaic properties are specified.
      if (layer.hasOwnProperty("currentVersion") && layer.currentVersion >= 10.1 && layer.allowedMosaicMethods.length > 1) {
        mosaicMethodsList = layer.allowedMosaicMethods;
        if (mosaicMethodsList.toLowerCase().indexOf("none") < 0) {
          mosaicMethodsList = mosaicMethodsList + ",None";
        }
      }

      this._populateMosaicMethodsList(mosaicMethodsList);
      var defMosaicMethod = layer.defaultMosaicMethod;
      if (!defMosaicMethod) {
        defMosaicMethod = "northwest";
      }
      this._MosaicRuleObject.method = this._esriStringMosaicMethodToEnum(defMosaicMethod);
      this._populateMosaicOperatorsList(layer.defaultMosaicMethod);
      this._MosaicRuleObject.operation = this._esriStringMosaicOperatorToEnum(layer.mosaicOperator);
      this._MosaicRuleObject.ascending = true;
      
      if(this.layer.mosaicRule) {
          if(this.layer.mosaicRule.multidimensionalDefinition) {
              this._MosaicRuleObject.multidimensionalDefinition = this.layer.mosaicRule.multidimensionalDefinition;
          }
      }
      
      var iMosaicRuleObject = (this.layer && this.layer.mosaicRule) ? this.layer.mosaicRule : this._MosaicRuleObject;
      this._setDefaultValues(iMosaicRuleObject);
    },

    _populateOrderFieldsList: function (fields) {
      fields.sort(function(a,b){
        return a.alias.localeCompare(b.alias);
      });
      var t;
      for (t in fields) {
        if (fields[t].type === "esriFieldTypeDouble" || fields[t].type === "esriFieldTypeSingle" || fields[t].type === "esriFieldTypeInteger" || fields[t].type === "esriFieldTypeSmallInteger" || fields[t].type === "esriFieldTypeOID" || fields[t].type === "esriFieldTypeDate") {
          this._orderField.add(new Option(fields[t].alias, fields[t].name), this._orderField.length);
          this._queryOrderField.add(new Option(fields[t].name), this._queryOrderField.length);
          this._fieldType.push(fields[t].type);
        }
      }

      if (this._orderField.children.length === 0)
      {
        this._orderField.add(new Option(this._i18n.widgets.mosaicRule.orderFieldNotFound, this._i18n.widgets.mosaicRule.orderFieldNotFound), true);
      }
    },

    _populateMosaicMethodsList: function (mosaicMethodsList) {
      //Build a drop down list of the allowed Mosaic Methods
      //since order is important we have to do it this way...
      if (mosaicMethodsList.toLowerCase().indexOf("none") >= 0) {
        this._addItemToMosaicMethodList("none");
      }
      if (mosaicMethodsList.toLowerCase().indexOf("byattribute") >= 0) {
        this._addItemToMosaicMethodList("byattribute");
      }
      if (mosaicMethodsList.toLowerCase().indexOf("center") >= 0) {
        this._addItemToMosaicMethodList("center");
      }
      if (mosaicMethodsList.toLowerCase().indexOf("northwest") >= 0) {
        this._addItemToMosaicMethodList("northwest");
      }
      if (mosaicMethodsList.toLowerCase().indexOf("nadir") >= 0) {
        this._addItemToMosaicMethodList("nadir");
      }
      if (mosaicMethodsList.toLowerCase().indexOf("seamline") >= 0) {
        this._addItemToMosaicMethodList("seamline");
      }
      if (mosaicMethodsList.toLowerCase().indexOf("lockraster") >= 0) {
        this._addItemToMosaicMethodList("lockraster");
      }      
    },
    
    _addItemToMosaicMethodList: function (methodName) {
      var alias = this._mosaicMethodNameToAlias(methodName);
      this._mosaicRule.add(new Option(alias, methodName), this._mosaicRule.length);
    },
      
    _populateMosaicOperatorsList: function (mosaicMethod) {
      var numOps = this._mosaicOperator.options.length;
      var prevSelectedMosaicOperator = numOps ? this._mosaicOperator.options[this._mosaicOperator.selectedIndex].value.toLowerCase() : null;
      var i;
      for (i = numOps - 1; i >= 0; i--) {
        this._mosaicOperator.remove(i);
      }

      if (!mosaicMethod || mosaicMethod.toLowerCase() !== "seamline") {
        this._mosaicOperator.add(new Option(this._i18n.widgets.mosaicRule.firstAlias, "First"), 0);
        //this._mosaicOperator.add(new Option(this._i18n.widgets.mosaicRule.lastAlias, "Last"), 1);
        this._mosaicOperator.add(new Option(this._i18n.widgets.mosaicRule.minAlias, "Min"), 2);
        this._mosaicOperator.add(new Option(this._i18n.widgets.mosaicRule.maxAlias, "Max"), 3);
        this._mosaicOperator.add(new Option(this._i18n.widgets.mosaicRule.averageAlias, "Mean"), 4);
        this._mosaicOperator.add(new Option(this._i18n.widgets.mosaicRule.blendAlias, "Blend"), 5);
      } else {
        this._mosaicOperator.add(new Option(this._i18n.widgets.mosaicRule.firstAlias, "First"), 0);
        this._mosaicOperator.add(new Option(this._i18n.widgets.mosaicRule.blendAlias, "Blend"), 1);
      }

      this._mosaicOperator.selectedIndex = 0;
      if (prevSelectedMosaicOperator !== null) {
        for (i = this._mosaicOperator.options.length - 1; i >= 0; i--) {
          var value = this._mosaicOperator.children[i].value;
          if (value.toLowerCase() === prevSelectedMosaicOperator.toLowerCase()) {
            this._mosaicOperator.selectedIndex = i;
            break;
          }
        }
      }
    },

    _onLayerMosaicRuleChange: function () {
      if (this._internalApplyMosaic) {
        this._internalApplyMosaic = false;
        return;
      }

      this._setDefaultValues(this.layer.mosaicRule);
    },

    _setDefaultValues: function (mosaicRuleObject) {
      if (!mosaicRuleObject) {
        return;
      }

      //If mosaicRuleObject.sortField exists then match and set the index for drop down list of orderField
      var h;
      var value;
      if (mosaicRuleObject.sortField) {
        for (h = 0; h < this._orderField.children.length; h++) {
          //Browser specific code
          value = this._orderField.children[h].value;
          if (mosaicRuleObject.sortField.toLowerCase() === value.toLowerCase()) {
            this._orderField.selectedIndex = h;
            this._OnChangeOrderField();
            //modify display based on the sortField
            break;
          }
        }
      }

      if (mosaicRuleObject.sortValue)//If mosaicRuleObject.sortvalue exists then set the _MosaicRuleObject
      {
        this._MosaicRuleObject.sortValue = mosaicRuleObject.sortValue;
        this._MosaicRuleObject.sortField = mosaicRuleObject.sortField;
        this._orderValueText.value = mosaicRuleObject.sortValue;
        if(this._fieldType[this._orderField.selectedIndex] === "esriFieldTypeDate")
          {
            this._orderValueDate.set('value',new Date(mosaicRuleObject.sortValue));
          }
      }

      var selectedMosaicOperator = this._esriEnumMosaicOperatorToString(mosaicRuleObject.operation);
      for (h = 0; h < this._mosaicOperator.children.length; h++) {
        value = this._mosaicOperator.children[h].value;
        if (selectedMosaicOperator.toLowerCase() === value.toLowerCase()) {//Match and set the index for drop down list of Mosaic Operator
          this._mosaicOperator.selectedIndex = h;
          this._OnChangeMosaicOperator();
          break;
        }
      }
      
      var selectedMosaicMethod = this._esriEnumMosaicMethodToString(mosaicRuleObject.method);
      for (h = 0; h < this._mosaicRule.children.length; h++) {
        value = this._mosaicRule.children[h].value;
        if (selectedMosaicMethod.toLowerCase() === value.toLowerCase())//Match and set the index for drop down list of MosaicRule
        {
          this._mosaicRule.selectedIndex = h;
          this._OnChangeMosaicRule();
          break;
        }
      }

      if (selectedMosaicMethod.toLowerCase() === "lockraster" && mosaicRuleObject.lockRasterIds) {
        this._lockRaster.value = mosaicRuleObject.lockRasterIds;
      }

      if (mosaicRuleObject.where) {
        this._where.value = mosaicRuleObject.where;
      }
      
      if (mosaicRuleObject.ascending !== null) {
        this._descending.checked = !mosaicRuleObject.ascending;
      } else {
        this._descending.checked = false;
      }

    },

    _selectAllCheckboxOnChange: function () {
      var checkboxOnChange = lang.hitch(this, "_checkboxOnChange");
      var checkboxSelectAll = query(".mosaicRuleLayerlistSelectCheckbox", this._layerList);
      var checkboxSelectItemlist = query(".mosaicRuleLayerlistCheckbox", this._layerList);
      checkboxSelectAll.forEach(function (selectall) {
        if (!selectall.checked) {
          checkboxSelectItemlist.forEach(function (each_checkbox) {
            each_checkbox.checked = false;
            checkboxOnChange();
          });
        } else {
          checkboxSelectItemlist.forEach(function (each_checkbox) {
            each_checkbox.checked = true;
            checkboxOnChange();
          });
        }
      });
    },

    _OnOpenQueryPopup: function () {
      this._where.disabled = true;
    },

    _OnCloseQueryPopup: function () {
      this._where.disabled = false;
      if (this._queryOrderField.options[this._queryOrderField.selectedIndex].text !== "<None>") {
        try {
          // for IE earlier than version 8
          this._queryOrderField.add(new Option("<None>"), this._queryOrderField.options[0]);
        } catch (err1) {
          this._queryOrderField.add(new Option("<None>"), 0);
        }
        this._queryOrderField.selectedIndex = 0;
      }

      if (this._queryOperator.options[this._queryOperator.selectedIndex].text !== "<None>") {
        try {
          // for IE earlier than version 8
          this._queryOperator.add(new Option("<None>"), this._queryOperator.options[0]);
        } catch (err2) {
          this._queryOperator.add(new Option("<None>"), 0);
        }
        this._queryOperator.selectedIndex = 0;
      }

      this._queryValue.value = "";
    },

    _onclickLayerlist: function () {
      this._getpoint = 1;
    },

    _onclickTooltip: function () {
      if (this._getpoint === 0) {
        this._app.dndSource.selectNone();
        this._graphicsLayer.clear();
      }

      this._getpoint = 0;
    },

    _oncloseTooltip: function () {
      this._graphicsLayer.clear();
    },

    _checkboxOnChange: function () {
      var _rasterlist = [];
      var length = 0;
      var checked_length = 0;
      var checkboxSelectAll = query(".mosaicRuleLayerlistSelectCheckbox", this._layerList);
      var CheckboxList = query(".mosaicRuleLayerlistCheckbox", this._layerList);
      CheckboxList.forEach(function (checkbox) {
        length++;
        if (checkbox.checked === true) {
          checked_length++;
          _rasterlist.push(parseInt(checkbox.id, 10));
        }
      });
      if (checked_length !== length) {
        checkboxSelectAll.forEach(function (selectall) {
          selectall.checked = false;
        });
      }
      if (checked_length === length) {
        checkboxSelectAll.forEach(function (selectall) {
          selectall.checked = true;
        });
      }
      if (_rasterlist.length === 0) {
        this._lockRaster.value = null;
      } else {
        this._lockRaster.value = _rasterlist;
      }
    },

    _selectRaster: function () {
      this._graphicsLayer.clear();
      var setGraphicQuery = lang.hitch(this, "_setGraphicQuery");
      var selectList = this._app.dndSource.getSelectedNodes();
      selectList.forEach(function (select) {
        var elem = query(".mosaicRuleLayerlistCheckbox", select);
        elem.forEach(function (elem1) {
          setGraphicQuery(elem1.id);
        });
      });
    },

    _setGraphicQuery: function (id) {
      var addResultsToMap = lang.hitch(this, "_addResultsToMap");
      this._query.geometry = this._initialExtent;
      this._query.returnGeometry = true;
      this._query.where = "OBJECTID = " + id;
      this._queryTask.execute(this._query, addResultsToMap);
    },

    _addResultsToMap: function (featureSet) {
      var addEachFeatureToMap = lang.hitch(this, "_addEachFeatureToMap");
      featureSet.features.forEach(addEachFeatureToMap);
    },

    _addEachFeatureToMap: function (feature) {
      this._graphicsLayer.add(feature);
    },

    _reorderRaster: function () {
      var List = query(".mosaicRuleLayerlistCheckbox", this._layerList);
      var CheckboxList = [];
      List.forEach(function (checkbox) {
        if (checkbox.checked === true) {
          CheckboxList.push(parseInt(checkbox.id, 10));
        }
      });
      var len = CheckboxList.length;
      var chk = 0;
      var a;
      for (a = 0; a !== len / 2; a++) {
        chk = 0;
        var k;
        for (k = 0; k < CheckboxList.length - 1; k++) {
          if (CheckboxList[CheckboxList.length - 1] === CheckboxList[k]) {
            CheckboxList.splice((CheckboxList.length - 1), 1);
            chk = 1;
            break;
          }
        }
        if (chk === 0) {
          break;
        }
      }
      if (CheckboxList.length === 0) {
        this._lockRaster.value = null;
      } else {
        this._lockRaster.value = CheckboxList;
      }
    },

    _showRastersInAOI: function (results) {
      // the results could be from query or identify
      this._graphicsLayer.clear();

      var features;
      if (results && results.catalogItems) {
        features = results.catalogItems.features;
      } else {
        features = results.features;
      }

      if ((!results || !features || features.length < 1) && !this.hideLockRasterSelectionIdButton) {
        this._lockRasterMsg.innerHTML = this._i18n.widgets.mosaicRule.lockRasterRequestNoRasterMsg;
        return;
      }

      this._lockRasterMsg.innerHTML = this._i18n.widgets.mosaicRule.lockRasterRequestDoneMsg;
      this._lockRasterMsg.style.display = "none";
      if (this._app.hasOwnProperty("dndSource")) {
        this._app.dndSource.destroy();
        domConstruct.empty(this._layerList);
      }

      var defaultLayerLockRasterIDs = [];
      if (this.layer && this.layer.mosaicRule && this.layer.mosaicRule.lockRasterIds) {
        defaultLayerLockRasterIDs = this.layer.mosaicRule.lockRasterIds;
      }

      var list = [];
      var checkbox_list = [];
      var checkboxOnChange = lang.hitch(this, "_checkboxOnChange");
      var selectAllCheckboxOnChange = lang.hitch(this, "_selectAllCheckboxOnChange");
      var i;
      for (i = 0; i < features.length; i++) {
        var checkboxBlock = domConstruct.create('div');
        var checkbox = domConstruct.create('input');
        checkbox.type = "checkbox";
        checkbox.className = "mosaicRuleLayerlistCheckbox";
        checkbox.id = features[i].attributes.OBJECTID;
        if (features[i].attributes.hasOwnProperty("checked")) {
          if (features[i].attributes.checked) {
            checkbox.checked = true;
            list.push(features[i].attributes.OBJECTID);
          } else {
            checkbox.checked = false;
          }
        } else {
          if (defaultLayerLockRasterIDs.length === 0) {
            checkbox.checked = true;
          } else {
            checkbox.checked = (array.indexOf(defaultLayerLockRasterIDs, features[i].attributes.OBJECTID) === -1 ? false : true);
          }
          list.push(features[i].attributes.OBJECTID);
        }
        on(checkbox, "change", checkboxOnChange);
        checkboxBlock.appendChild(checkbox);
        var checkLabel = domConstruct.create('label');
        checkLabel.appendChild(document.createTextNode(features[i].attributes.OBJECTID));
        checkboxBlock.appendChild(checkLabel);
        checkbox_list.push(checkboxBlock);
      }

      if (features.length > 0) {
        if (!features[0].attributes.hasOwnProperty("checked") && defaultLayerLockRasterIDs.length <= 0) {
          this._lockRaster.value = list;
        }
      }

      this._MosaicRuleObject.ascending = true;
      var checkbox_select = domConstruct.create('input');
      checkbox_select.type = "checkbox";
      checkbox_select.id = "select";
      checkbox_select.name = this._i18n.widgets.mosaicRule.selectAllLabel;
      checkbox_select.className = "mosaicRuleLayerlistSelectCheckbox";
      if (results.hasOwnProperty("selectAll")) {
        if (results.selectAll) {
          checkbox_select.checked = true;
        } else {
          checkbox_select.checked = false;
        }
      } else {
        checkbox_select.checked = true;
      }

      on(checkbox_select, "change", selectAllCheckboxOnChange);

      var selectAllBlock = domConstruct.create('div');
      selectAllBlock.appendChild(checkbox_select);
      var checkLabel1 = domConstruct.create('label');
      checkLabel1.appendChild(document.createTextNode(this._i18n.widgets.mosaicRule.selectAllLabel));
      selectAllBlock.appendChild(checkLabel1);
      this._layerList.appendChild(selectAllBlock);
      this._app.dndSource = new dndSource(this._layerList);
      this._app.dndSource.insertNodes(false, checkbox_list);
      var reorderRaster = lang.hitch(this, "_reorderRaster");
      var selectRaster = lang.hitch(this, "_selectRaster");
      this._app.dndSource.on("DndDrop", reorderRaster);
      this._app.dndSource.on("MouseUp", selectRaster);
    },

    _errorRastersInAOI: function () {
      this._lockRasterMsg.innerHTML = this._i18n.widgets.mosaicRule.lockRasterRequestErrorMsg;
      return;
    },

    _OnChangeLockRaster: function () {
      var results = {};
      var RasterList = [];
      var features = [];
      var displayRaster = this._lockRaster.value.split(",");
      var List = query(".mosaicRuleLayerlistCheckbox", this._layerList);
      List.forEach(function (checkbox) {
        RasterList.push(checkbox.id);
        checkbox.checked = false;
      });
      var i;
      var x;
      if (displayRaster.length > 0) {
        for (i = 0; i < displayRaster.length; i++) {
          if (displayRaster[i].length !== 0 && !isNaN(displayRaster[i])) {
            var idx = array.indexOf(RasterList, displayRaster[i]);
            if (idx !== -1) {
              x = {};
              x.attributes = {};
              x.attributes.OBJECTID = displayRaster[i];
              x.attributes.checked = 1;
              features.push(x);
            }
          }
        }
      }

      var setFlag;
      for (i = 0; i < RasterList.length; i++) {
        setFlag = 0;
        var j;
        for (j = 0; j < features.length; j++) {
          if (RasterList[i] === features[j].attributes.OBJECTID) {
            setFlag = 1;
          }
        }

        if (setFlag === 0) {
          x = {};
          x.attributes = {};
          x.attributes.OBJECTID = RasterList[i];
          x.attributes.checked = 0;
          features.push(x);
        }
      }

      results.catalogItems = {};
      results.catalogItems.features = features;
      results.selectAll = 0;
      if (RasterList.length === displayRaster.length) {
        results.selectAll = 1;
      }

      this._showRastersInAOI(results);

    },

    _OnClickCurrentExtent: function () {
      this._buildRasterList();
    },

    //set the mosaic rule on to the layer
    _OnClickApplyMosaic: function () {
      var temp = [];
      //set the lockrasterids property if mosaic rule is lockraster
      if (this._MosaicRuleObject.method === MosaicRule.METHOD_LOCKRASTER) {
        var displayRaster = this._lockRaster.value.split(",");
        if (displayRaster.length > 0) {
          var i;
          for (i = 0; i < displayRaster.length; i++) {
            if (displayRaster[i].length === 0 || isNaN(displayRaster[i])) {
              displayRaster.splice(i, 1);
              i--;
            }
          }
          if (displayRaster.length === 0) {
            return;
          }
          for (i = 0; i < displayRaster.length; i++) {
            temp.push(parseInt(displayRaster[i], 10));
          }
          this._MosaicRuleObject.lockRasterIds = temp;
        } else {
          return;
        }
      }

      //set the order value property if mosaic rule is by attribute
      if (this._MosaicRuleObject.method === MosaicRule.METHOD_ATTRIBUTE) {
        if (this._fieldType[this._orderField.selectedIndex] === "esriFieldTypeSmallInteger" || this._fieldType[this._orderField.selectedIndex] === "esriFieldTypeInteger" || this._fieldType[this._orderField.selectedIndex] === "esriFieldTypeDouble" || this._fieldType[this._orderField.selectedIndex] === "esriFieldTypeSingle") {
          this._MosaicRuleObject.sortValue = number.parse(this._orderValueText.value);
        } else {
          this._MosaicRuleObject.sortValue = locale.format(this._orderValueDate.get('value'), {datePattern: "yyyy/MM/dd"});
        }
      }

      //set the where clause
      if (this._where.value !== "<where>" && this._where.value.length > 1) {
        this._MosaicRuleObject.where = this._where.value;
      } else {
        this._MosaicRuleObject.where = null;
      }
      
      if(this.layer.mosaicRule) {
          if(this.layer.mosaicRule.multidimensionalDefinition) {
              this._MosaicRuleObject.multidimensionalDefinition = this.layer.mosaicRule.multidimensionalDefinition;
          }
      }

      this._internalApplyMosaic = true;
      this.layer.setMosaicRule(this._MosaicRuleObject);
    },

    _OnClickResetMosaic: function () {
      if (!this.layer) {
        return;
      }

      this.layer.mosaicRule = null;
      this._mosaicRule.options.length = 0;
      this._orderField.options.length = 0;
      this._previousOrderFieldIndex = -1;
      this._initUsingServiceInfo(this.layer);
      this._OnClickApplyMosaic();
    },

    //set the order field and change the display based on the orderfield type
    _OnChangeOrderField: function () {
      //set the order field property if mosaic rule is by attribute
      var fieldName = this._orderField.children[this._orderField.selectedIndex].value;
      this._MosaicRuleObject.sortField = fieldName;
      var fieldType = this._fieldType[this._orderField.selectedIndex];
      switch (fieldType) {
        case "esriFieldTypeOID":
        case "esriFieldTypeInteger":
        case "esriFieldTypeSmallInteger":
        case "esriFieldTypeDouble":
        case "esriFieldTypeSingle":
          this._orderValueTextBlock.style.display = "";
          this._showDateControl(false);
          this._orderValueText.value = this._getDefaultOrderFieldValue(fieldType, fieldName);
          break;
        case "esriFieldTypeDate":
          this._orderValueTextBlock.style.display = "";
          this._showDateControl(true);
          var defVal = this._getDefaultOrderFieldValue(fieldType, fieldName);
          this._orderValueDate.set('value', defVal);
          break;
        default:
          this._orderValueTextBlock.style.display = "none";
          this._showDateControl(false);
      }
      this._previousOrderFieldIndex = this._orderField.selectedIndex;
    },

    _getDefaultOrderFieldValue: function(fieldType, fieldName) {
      if (this._previousOrderFieldIndex < 0) {
        if (fieldType === "esriFieldTypeDate") {
          if (this.layer.sortField && fieldName.toLowerCase() === this.layer.sortField.toLowerCase() && this.layer.sortValue) {
            return new Date(this.layer.sortValue);
          }
          return new Date();
        }
        return "0";
      }
      
      var prevFieldType = this._fieldType[this._previousOrderFieldIndex];
      var prevFieldValue = this._orderValueText.value;
      if (prevFieldType === "esriFieldTypeDate") {
        prevFieldValue = new Date(this._orderValueDate.get('value'));
      }
      
      var startField;
      var endField;
      var maxTime;
      if (this.layer.timeInfo) {
        startField = this.layer.timeInfo.startTimeField;
        endField = this.layer.timeInfo.endTimeField;
        if (this.layer.timeInfo.timeExtent) {
          maxTime = this.layer.timeInfo.timeExtent.endTime;
        }
      }
      
      if (prevFieldType && prevFieldType !== fieldType) {
        if (this._isFieldNumeric(fieldType)) {
          return "0";
        } else if (fieldType === "esriFieldTypeDate") {
          if ((startField && fieldName.toLowerCase() === startField.toLowerCase()) || (endField && fieldName.toLowerCase() === endField.toLowerCase())) {
            return maxTime;
          }
          if (this.layer.sortField && fieldName.toLowerCase() === this.layer.sortField.toLowerCase() && this.layer.sortValue) {
            return new Date(this.layer.sortValue);
          }
          return new Date(); 
        }
        return "";
      }
      
      return prevFieldValue;
    },
      
    _isFieldNumeric: function(fieldType) {
      var retVal = false;
      if (fieldType === "esriFieldTypeOID"
      ||  fieldType === "esriFieldTypeInteger"
      ||  fieldType === "esriFieldTypeSmallInteger"
      ||  fieldType === "esriFieldTypeDouble"
      ||  fieldType === "esriFieldTypeSingle") {
        retVal = true;
      }
      
      return retVal;
    },
      
    //set the various mosaic operation
    _OnChangeMosaicOperator: function () {
      this._MosaicRuleObject.operation = this._esriStringMosaicOperatorToEnum(this._mosaicOperator.options[this._mosaicOperator.selectedIndex].value);
    },

    //set the ascending property
    _OnClickDescending: function () {
      this._MosaicRuleObject.ascending = false;
      if (!this._descending.checked) {
        this._MosaicRuleObject.ascending = true;
      }
    },

    //setting the various mosaic methods and based on that change the UI
    _OnChangeMosaicRule: function () {
      var currentMosaicRule = this._mosaicRule.options[this._mosaicRule.selectedIndex].value;
      this._populateMosaicOperatorsList(currentMosaicRule);
      this._OnChangeMosaicOperator();
      
      this._graphicsLayer.clear();
      this._lockRasterBlock.style.display = "";
      this._orderFieldBlock.style.display = "";
      this._descendingBlock.style.display = "";
      if (this._MosaicRuleObject.ascending === null) {
        this._MosaicRuleObject.ascending = !this._descending.checked;
      }
      this._apply.value = "APPLY";
      switch (currentMosaicRule.toLowerCase()) {
        case "none":
          this._MosaicRuleObject.lockRasterIds = null;
          this._MosaicRuleObject.sortField = null;
          this._MosaicRuleObject.sortValue = null;
          this._orderValueTextBlock.style.display = "none";
          this._lockRasterBlock.style.display = "none";
          this._orderFieldBlock.style.display = "none";
          this._MosaicRuleObject.method = MosaicRule.METHOD_NONE;
          break;
        case "byattribute":
          this._MosaicRuleObject.sortField = this._orderField.options[this._orderField.selectedIndex].value;
          this._MosaicRuleObject.lockRasterIds = null;
          this._lockRasterBlock.style.display = "none";
          this._OnChangeOrderField();
          this._MosaicRuleObject.method = MosaicRule.METHOD_ATTRIBUTE;
          break;
        case "center":
          this._MosaicRuleObject.sortField = null;
          this._MosaicRuleObject.sortValue = null;
          this._MosaicRuleObject.lockRasterIds = null;
          this._orderValueTextBlock.style.display = "none";
          this._lockRasterBlock.style.display = "none";
          this._orderFieldBlock.style.display = "none";
          this._MosaicRuleObject.method = MosaicRule.METHOD_CENTER;
          break;
        case "nadir":
          this._MosaicRuleObject.sortField = null;
          this._MosaicRuleObject.sortValue = null;
          this._MosaicRuleObject.lockRasterIds = null;
          this._orderValueTextBlock.style.display = "none";
          this._lockRasterBlock.style.display = "none";
          this._orderFieldBlock.style.display = "none";
          this._MosaicRuleObject.method = MosaicRule.METHOD_NADIR;
          break;
        case "viewpoint":
          this._MosaicRuleObject.sortField = null;
          this._MosaicRuleObject.sortValue = null;
          this._MosaicRuleObject.lockRasterIds = null;
          this._orderValueTextBlock.style.display = "none";
          this._lockRasterBlock.style.display = "none";
          this._orderFieldBlock.style.display = "none";
          this._MosaicRuleObject.method = MosaicRule.METHOD_VIEWPOINT;
          break;
        case "lockraster":
          this._MosaicRuleObject.sortField = null;
          this._MosaicRuleObject.sortValue = null;
          this._orderValueTextBlock.style.display = "none";
          this._orderFieldBlock.style.display = "none";
          this._MosaicRuleObject.method = MosaicRule.METHOD_LOCKRASTER;
          break;
        case "northwest":
          this._MosaicRuleObject.sortField = null;
          this._MosaicRuleObject.sortValue = null;
          this._MosaicRuleObject.lockRasterIds = null;
          this._orderValueTextBlock.style.display = "none";
          this._lockRasterBlock.style.display = "none";
          this._orderFieldBlock.style.display = "none";
          this._MosaicRuleObject.method = MosaicRule.METHOD_NORTHWEST;
          break;
        case "seamline":
          this._MosaicRuleObject.ascending = null;
          this._MosaicRuleObject.sortField = null;
          this._MosaicRuleObject.sortValue = null;
          this._MosaicRuleObject.lockRasterIds = null;
          this._orderValueTextBlock.style.display = "none";
          this._lockRasterBlock.style.display = "none";
          this._orderFieldBlock.style.display = "none";
          this._descendingBlock.style.display = "none";
          this._MosaicRuleObject.method = MosaicRule.METHOD_SEAMLINE;
          break;
        default:
          console.log("info not available");
      }
    },

    _OnChangeQueryOrderField: function () {
      this._where.value = "";
      var value = this._queryOrderField.children[0].innerText;
      if (!value) {
        value = this._queryOrderField.children[0].text;
      }
      if (value === "<None>") {
        this._queryOrderField.remove(0);
      }
      this._where.value = this._queryOrderField.options[this._queryOrderField.selectedIndex].text;
      if (this._queryOperator.options[this._queryOperator.selectedIndex].text !== "<None>") {
        this._where.value = this._where.value + " " + this._queryOperator.options[this._queryOperator.selectedIndex].text;
      }
      if (this._queryValue.value.length > 0) {
        this._where.value = this._where.value + " " + this._queryValue.value;
      }
    },

    _OnChangeQueryOperator: function () {
      this._where.value = "";
      var value = this._queryOperator.children[0].innerText;
      if (!value) {
        value = this._queryOperator.children[0].text;
      }
      if (value === "<None>") {
        this._queryOperator.remove(0);
      }
      if (this._queryOrderField.options[this._queryOrderField.selectedIndex].text !== "<None>") {
        this._where.value = this._queryOrderField.options[this._queryOrderField.selectedIndex].text;
      }
      this._where.value = this._where.value + " " + this._queryOperator.options[this._queryOperator.selectedIndex].text;
      if (this._queryValue.value.length > 0) {
        this._where.value = this._where.value + " " + this._queryValue.value;
      }
    },

    _OnKeyupQueryValue: function () {
      this._where.value = "";
      if (this._queryOrderField.options[this._queryOrderField.selectedIndex].text !== "<None>") {
        this._where.value = this._queryOrderField.options[this._queryOrderField.selectedIndex].text;
      }
      if (this._queryOperator.options[this._queryOperator.selectedIndex].text !== "<None>") {
        this._where.value = this._where.value + " " + this._queryOperator.options[this._queryOperator.selectedIndex].text;
      }
      this._where.value = this._where.value + " " + this._queryValue.value;
    },

    _esriEnumMosaicMethodToString: function (enumMosaicMethod) {
      var method = "none";
      switch (enumMosaicMethod) {
        case MosaicRule.METHOD_ATTRIBUTE:
          method = "byattribute";
          break;
        case MosaicRule.METHOD_CENTER:
          method = "center";
          break;
        case MosaicRule.METHOD_LOCKRASTER:
          method = "lockraster";
          break;
        case MosaicRule.METHOD_NADIR:
          method = "nadir";
          break;
        case MosaicRule.METHOD_NORTHWEST:
          method = "northwest";
          break;
        case MosaicRule.METHOD_SEAMLINE:
          method = "seamline";
          break;
        case MosaicRule.METHOD_VIEWPOINT:
          method = "viewpoint";
          break;
      }

      return method;
    },

    _esriStringMosaicMethodToEnum: function (stringMosaicMethod) {
      if (!stringMosaicMethod) {
        return;
      }

      var methodEnum = MosaicRule.METHOD_NONE;
      switch (stringMosaicMethod.toLowerCase()) {
        case "byattribute":
          methodEnum = MosaicRule.METHOD_ATTRIBUTE;
          break;
        case "center":
          methodEnum = MosaicRule.METHOD_CENTER;
          break;
        case "lockraster":
          methodEnum = MosaicRule.METHOD_LOCKRASTER;
          break;
        case "nadir":
          methodEnum = MosaicRule.METHOD_NADIR;
          break;
        case "northwest":
          methodEnum = MosaicRule.METHOD_NORTHWEST;
          break;
        case "seamline":
          methodEnum = MosaicRule.METHOD_SEAMLINE;
          break;
        case "viewpoint":
          methodEnum = MosaicRule.METHOD_VIEWPOINT;
          break;
      }

      return methodEnum;
    },

    _esriStringMosaicOperatorToEnum: function (stringMosaicOperator) {
      if (!stringMosaicOperator) {
        return;
      }

      switch (stringMosaicOperator.toLowerCase()) {
        case "first":
          return MosaicRule.OPERATION_FIRST;
        case "last":
          return MosaicRule.OPERATION_LAST;
        case "max":
          return MosaicRule.OPERATION_MAX;
        case "min":
          return MosaicRule.OPERATION_MIN;
        case "blend":
          return MosaicRule.OPERATION_BLEND;
        case "mean":
          return MosaicRule.OPERATION_MEAN;
      }
    },

    _esriEnumMosaicOperatorToString: function (enumMosaicOperator) {
      var operator = "first";
      switch (enumMosaicOperator) {
        case MosaicRule.OPERATION_FIRST:
          operator = "first";
          break;
        case MosaicRule.OPERATION_LAST:
          operator = "last";
          break;
        case MosaicRule.OPERATION_MAX:
          operator = "max";
          break;
        case MosaicRule.OPERATION_MIN:
          operator = "min";
          break;
        case MosaicRule.OPERATION_BLEND:
          operator = "blend";
          break;
        case MosaicRule.OPERATION_MEAN:
          operator = "mean";
          break;
      }

      return operator;
    },
    
    _mosaicMethodNameToAlias: function (name) {
      if (!name) {
        return;
      }

      var alias = "";
      switch (name.toLowerCase()) {
        case "none":
          alias = this._i18n.widgets.mosaicRule.noneAlias;
          break;        
        case "byattribute":
          alias = this._i18n.widgets.mosaicRule.byAttributeAlias;
          break;
        case "center":
          alias = this._i18n.widgets.mosaicRule.centerAlias;
          break;
        case "lockraster":
          alias = this._i18n.widgets.mosaicRule.lockRasterAlias;
          break;
        case "nadir":
          alias = this._i18n.widgets.mosaicRule.nadirAlias;
          break;
        case "northwest":
          alias = this._i18n.widgets.mosaicRule.northWestAlias;
          break;
        case "seamline":
          alias = this._i18n.widgets.mosaicRule.seamlineAlias;
          break;
        case "viewpoint":
          alias = this._i18n.widgets.mosaicRule.viewPointAlias;
          break;
      }

      return alias;
    },
      
    _hideAllControls: function() {
      this._mosaicRule.style.display = "none";
      this._mosaicOperatorLabelBlock.style.display = "none";
      this._mosaicOperatorBlock.style.display = "none";
      this._orderFieldBlock.style.display = "none";
      this._orderValueTextBlock.style.display = "none";
      this._lockRasterBlock.style.display = "none";
      this._descendingBlock.style.display = "none";
      this._apply.style.display = "none";      
    },
      
    _showDateControl: function(show) {
      if (show) {
        this._orderValueDate.domNode.style.display = "";
        this._orderValueText.style.display = "none";
      } else {
        this._orderValueDate.domNode.style.display = "none";
        this._orderValueText.style.display = "";
      }
    }
      
  });

  return Widget;
});
