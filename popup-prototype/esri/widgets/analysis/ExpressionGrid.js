/******************************************
  esri/widgets/analysis/ExpressionGrid
******************************************/
define(
[ 
  "require",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/connect",
  "dojo/has",
  "dojo/string",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/dom-class",
  "dojo/store/Memory",
  "dojo/store/Observable",
  "dojo/Evented",
  "dojo/_base/event",
  "dojo/window", // winUtils.scrollIntoView
  
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_OnDijitClickMixin",
  "dijit/_FocusMixin",
  "dijit/registry",
  "dijit/form/Button",
  "dijit/form/CheckBox",
  "dijit/form/Form",
  "dijit/form/Select",
  "dijit/form/ToggleButton",
  "dijit/form/TextBox",
  "dijit/form/ValidationTextBox",
  "dijit/layout/ContentPane",
  "dijit/Dialog",
  "dijit/InlineEditBox",
   
  "dgrid/OnDemandGrid", 
  "dgrid/Keyboard", 
  "dgrid/Selection",
  "dgrid/extensions/DijitRegistry",
  "./tree",
  
  
  "put-selector/put",
  
  "../../kernel",
  "../../core/lang",
  "./ExpressionForm",
  "dojo/i18n!../../nls/jsapi",
  "dojo/text!./templates/ExpressionGrid.html"
], function(require, declare, lang, array, connection, has, string, domStyle, domAttr, domConstruct, query, domClass, Memory, Observable, Evented, event, winUtils, _WidgetBase,
   _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, registry, Button, CheckBox, Form, Select, ToggleButton, TextBox, ValidationTextBox, ContentPane, Dialog,
   InlineEditBox, OnDemandGrid, Keyboard, Selection, DijitRegistry, tree, put, esriKernel, esriLang, ExpressionForm, jsapiBundle, template) {
  ////console.log(tree);  
  var SelectionGrid, ExpressionGrid;
  SelectionGrid = declare([tree, OnDemandGrid, Selection, Keyboard, DijitRegistry]);
  
  ExpressionGrid = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,  _OnDijitClickMixin, _FocusMixin, Evented], {

    declaredClass: "esri.widgets.analysis.ExpressionGrid",

    templateString: template,
    basePath: require.toUrl("."),
    widgetsInTemplate: true,
    indentWidth: 10,
    refreshOptions: {keepScrollPosition: true},
    allowAllInputOperands: false,
    _selectedIds: [],
    /************
     * Overrides
     ************/
    constructor: function(params){
      if (params.containerNode) {
        this.container = params.containerNode;
      }
    },
    
    destroy: function(){
      this.inherited(arguments);
    },
    
    postMixInProperties: function(){
      this.inherited(arguments);
      this.i18n = {};
      lang.mixin(this.i18n, jsapiBundle.common);
      lang.mixin(this.i18n, jsapiBundle.analysisTools);
      lang.mixin(this.i18n, jsapiBundle.analysisMsgCodes);
      lang.mixin(this.i18n, jsapiBundle.expressionGrid);
      //console.log("i18n SUCCESS", this.i18n);
    },
    
    postCreate: function(){
      this.inherited(arguments);
      var columns;
      // some sample data
      // global var expressionStore
      //jshint newcap: false
      this.expressionStore = Observable(new Memory({
       idProperty: "id",
       allExpressionText: "",
       data: [
        {
          id: 0,
          operator: "",
          expressionText: "" // an empty item to create tree with this as root
        }/*,
        {
          id: 1,
          operator: "",
          expressionText: "Parcels intersects FloodRiskZones",
          parent: 0
        },
        {
          id: 2,
          operator: "and",
          expressionText: "Parcels where Parcel_value > 250,000",
          parent: 1
        },
        {
          id: 3,
          operator: "and",
          expressionText: "Parcels intersects FireRiskZones",
          parent: 2
        },
        {
          id: 4,
          operator: "and",
          expressionText: "Parcels where Parcel_value > 350,000",
          parent: 3
        }*/
       ],
       getChildren: function(object) {
         return this.query({parent: object.id});
       },
       
       getAllChildren: function(object) {
         var children, sub;
         children = this.getChildren(object);
         if (children.total > 0 ) {
           array.forEach(children, function(child) {
             //console.log("==> ", child);
             sub = this.getAllChildren(child);
             if(sub.total > 0) {
               array.forEach(sub, function(schild){
                 children[children.total] = schild;
                 children.total = children.total + 1;
               }, this);
             }
           }, this);
         }
         return children;
       },
       
       getExpressions: function(object, isSubNode) {
         var children, sub, exp, temp, subnodes;
         //Proposed Pipeline intersects Pump Stations(Pump Stations within a distance of 3 Miles from Existing PipelinePump Stations within a distance of 3 Miles from highways) 
         children = this.getChildren(object);
         if (children.total > 0 ) {
           exp= [];
           temp = {};
           temp.operator = object.operator;
           temp.layer = object.layer;
           if(object.where) {
             temp.where = object.where;
           }
           else {
             temp.selectingLayer = object.selectingLayer;
             temp.spatialRel  = object.spatialRel ;
             if(object.distance) {
               temp.distance = object.distance;
               temp.units = object.units;
             }
             
           }
           if(this.allExpressionText.indexOf(object.text) === -1) {
             this.allExpressionText += object.operator + " ( " +  object.text + " ";
           }
           exp.push(temp); ///add parent;
           array.forEach(children, function(child, index) {
             //console.log("==> ", child);
             sub = this.getExpressions(child, (index === children.total - 1) ? true : false);
             //console.log(sub);
             //console.log(index);
             //console.log(children.total);
             subnodes = this.getChildren(child);
             if(subnodes.total > 0) {
               if(!child._isAdd) {
                 this.allExpressionText += ")";
               }
               child._isAdd = true;
             }             
             exp.push(sub);// can be obj or array
           }, this);
         }
         else {
           exp = {};
           exp.operator = object.operator;
           exp.layer = object.layer;
           if(object.where) {
             exp.where = object.where;
           }
           else {
             exp.selectingLayer = object.selectingLayer;
             exp.spatialRel  = object.spatialRel ;
             if(object.distance) {
               exp.distance = object.distance;
               exp.units = object.units;
             }
           }
           if(this.allExpressionText.indexOf(object.text) === -1) {
             this.allExpressionText += object.operator + " " + object.text + " ";
             if(isSubNode && isSubNode === true) {
               this.allExpressionText += ")";
             }
           }
         }
         return exp;
       },
       
       getLabel: function (object) {
         return object.text; 
       },
       mayHaveChildren: function(object) {
         return object.id !== 1;
       }  
    }));
      //console.log(this.expressionStore);
      columns = { // you can declare columns as an object hash (key translates to field)
        operator: tree({
          label:"", 
          renderCell:lang.hitch(this, this._renderExpOperatorCell), 
          shouldExpand: function(){ return true; }, 
          sortable: false,
          indentWidth: 10,
          renderExpando: function (level, hasChildren, expanded, object) {
            ////console.log("using custom renderer for expamnd collapse");
            //    overides default implementation for column.renderExpando.
            ////console.log(object);
            var dir, cls, node;
            dir = this.grid.isRTL ? "right" : "left";
            cls = ".dgrid-expando-icon";
            /*if (hasChildren) {
                cls += ".ui-icon.ui-icon-triangle-1-" + (expanded ? "se" : "e");
            }*/
            if (level === 1) {
              node = put("div" + cls + "[style=width:0;height:0;]");
            }
            else {
              node = put("div" + cls + "[style=width:0;height:0;]");
            }
            node.innerHTML = " "; // for opera to space things properly
            return node;
          }
        })
        //action: {label: "", renderCell: lang.hitch(this, this._renderActionButtons), sortable: false}
      };
      this.expressiongrid = new SelectionGrid({
        store: this.expressionStore,
        query: {expressionText: ""},
        selectionMode: "extended",
        columns: columns,
        showHeader: false,
        allowSelectAll: true,
        allowSelect: function(row) {
          if(row && row.data && row.data.id === 0) { // if root node
              // return false to hide selector?
              return false;
          } else {
              return true;
          }
        }          
      }, this._gridDiv);
      /*this.expressiongrid.on(mouseUtil.enterRow, lang.hitch(this, function(event){
        var rowElement = this.expressiongrid.cell(event);
        var actionCell = this.expressiongrid.cell(rowElement.row.id, "action");
        domStyle.set(query("div",actionCell.element)[0], "display","");
      }));
      
      this.expressiongrid.on(mouseUtil.leaveRow, lang.hitch(this, function(event){
        var rowElement = this.expressiongrid.cell(event);
        var actionCell = this.expressiongrid.cell(rowElement.row.id, "action");
        domStyle.set(query("div",actionCell.element)[0], "display","none");
      }));*/
      this.expressiongrid.on("dgrid-select", lang.hitch(this, this._handleExpressiongridSelect));
      this.expressiongrid.startup();
      
      this.expressiongrid.keepScrollPosition = true;
      if(!this.allowAllInputOperands){
        this._expressionForm.set("firstOperands", [this.analysisLayer]);
      }
      else {
        this._expressionForm.set("firstOperands", this.inputLayers); //for derive new locations
      }
      this._expressionForm.set("selectedFirstOperand", this.analysisLayer);
      this._expressionForm.set("inputOperands", this.inputLayers);
      this._expressionForm.set("showReadyToUseLayers", this.get("showReadyToUseLayers"));
      this._expressionForm.init();
      this._expressionForm.on("add-expression", lang.hitch(this, this._handleExpressionFormAdd));
      this._expressionForm.on("cancel-expression", lang.hitch(this, this._handleExpressionFormCancel));
  },
  
    _handleExpressiongridSelect: function(event) {
      //console.log("selction obj", event.grid.selection);
      var object, key, children, isSingleSelected, selStr, isAlreadyAdded;
      this._selectedObj = event.grid.selection;
      if(this._selectedObj && this._selectedIds && this._selectedIds.length > 0) {
        isAlreadyAdded = true; 
        selStr = this._selectedIds.toString();
        for (key in this._selectedObj) {
          if(this._selectedObj.hasOwnProperty(key)) {
            key = parseInt(key, 10);
            isAlreadyAdded = (selStr.indexOf(key) !== -1);
          }
        }
        if(isAlreadyAdded) {
          return;  
        }
      }
      this._selectedIds = [];
      this._selectedRows = [];
      for (key in this._selectedObj) {
        if(this._selectedObj.hasOwnProperty(key)) {
          key = parseInt(key, 10);
          //console.log(key);
          if(this._selectedObj[key] === true && key !== 0) {
            this._selectedIds.push(key);
            this._selectedRows.push(this.expressiongrid.cell(key).row);
            object =  this.expressiongrid.cell(key).row.data;
            children = this.expressionStore.getAllChildren(object);
            //console.log(children);
            if(children.total > 0) {
              array.forEach(children, function(child){
                  this._selectedIds.push(child.id);
                  this._selectedRows.push(this.expressiongrid.cell(child.id).row);
                  this.expressiongrid.select(child.id);
              }, this);
            }
          }
          if(this._selectedObj[key] === true && key === 0) {
            this._groupBtn.set("disabled", true);
            this._ungroupBtn.set("disabled", true);
            this._removeBtn.set("disabled", true);
            this._editBtn.set("disabled", true);
            this._addBtn.set("disabled", false);
            this._viewBtn.set("disabled", true);
          }
        }
        
      }
      //console.log("Selected IDs and Rows");
      //console.log("#################");
      //console.log(this._selectedIds);
      //console.log(this._selectedRows);
      //console.log("#################");
      /////////////////////////////////
      if(this._selectedIds.length > 0 ) {
        isSingleSelected = (this._selectedIds.length === 1);
        this._groupBtn.set("disabled", isSingleSelected || (this.expressionStore.data.length <= 3));
        this._ungroupBtn.set("disabled", isSingleSelected || (this.expressionStore.data.length <= 3));
        this._removeBtn.set("disabled",  false);
        this._editBtn.set("disabled", !isSingleSelected);
        this._addBtn.set("disabled", !isSingleSelected);
        this._viewBtn.set("disabled", false);
      }
      /////////////////////////////////////
    },
  
    _renderExpOperatorCell: function(object, value, node, options) {
      /*console.log("Success ########################");
      console.log(object);
      console.log(value);
      console.log(options);
      console.log("object has parent ===>   ", object.parent);
      console.log("Success#######################");*/
      
      if(!object.expressionText) {
        if(this.expressionStore.data.length === 1) {
          domConstruct.create("label", {"innerHTML": this.i18n.addExprDescription,
          style : {
            fontStyle: "italic",
            textAlign: "center",
            display: "inline-block",
            width: "105%",
            fontWeight: "lighter"
          }}, node);
        }
        else {
          domStyle.set(node, "display", "none");
        }
      }
      else if(object.expressionText) {
         var exptable, expTd, operatorBtn, dir, expLabel, expTr, indentPx, children, operatorTdWidth, indentTd, indentTdWidth, indentDiv, operatorTd;
         operatorTdWidth = 32;
         indentTdWidth = 0;
         dir = this._gridPane.isRTL ? "marginRight" : "marginLeft";
         exptable = domConstruct.create("table", {"class": "esriExpressionTable"}, node);
         if(options.level > 1) {
           indentPx = ((options.level * options.level * this.indentWidth) + 8) + "px";
           domStyle.set(exptable, dir, indentPx);
           /*
           ///////////////
           //console.log("parent of this child is", this.expressionStore.get(object.parent));
           //console.log("parent grid is" , this.expressiongrid.cell(object.parent).element);
           var pElement = this.expressiongrid.cell(object.parent).element;
           //console.log(pElement);*/
           ////////////
         }
         else {
           domStyle.set(exptable, dir, "5px");
         }
         expTr =  domConstruct.create("tr", {}, exptable);
         children = this.expressionStore.getAllChildren(object);
         //console.log(children);
         //console.log(children.total);
         if(options.level > 0 && children.total > 0) {
           //operatorTdWidth = operatorTdWidth + ((this.indentWidth * children.total * 2) + 8);
           if(options.level === 1) {
             indentTdWidth = (this.indentWidth *  2 * options.level) + (32 - 8);
           }
           else {
             indentTdWidth = (this.indentWidth * options.level * 2) + this.indentWidth;
           }
         }
         operatorTd = domConstruct.create("td", {"class": "expressionTd"}, expTr);
         domStyle.set(operatorTd, "width", operatorTdWidth +"px");
         indentTd = domConstruct.create("td", {"class": "expressionTd"}, expTr);
         domStyle.set(indentTd, "width", indentTdWidth +"px");
         indentDiv = domConstruct.create("div", {}, indentTd);
         domStyle.set(indentDiv, "width", indentTdWidth +"px");
         /*if(children.total > 0) {
           domStyle.set(indentTd, "border-left", "1px dashed grey");
           domStyle.set(indentDiv, "border-", "1px dashed grey");
         }*/
         
         if(value) {
           operatorBtn = domConstruct.create("div", {
            "innerHTML": this.i18n[value],
            name: object.operator,
            id: object.id,
            "class": "esriAnalysisOperatorButton",
            onclick: lang.hitch(this, function(e){
               event.stop(e);
               var node = e.target, obj, val;
               obj = this.expressionStore.get(node.id);
               this.expressiongrid.clearSelection();
               this._selectedRows = [];
               this._selectedIds = [];
               val = domAttr.get(node, "name");
               node.innerHTML = (val === "and") ? this.i18n.or : this.i18n.and;
               domAttr.set(node, "name", (val === "and") ? "or" : "and");
               obj.operator = (val === "and" ? "or" : "and");
               this.expressionStore.put(obj);
               this.expressiongrid.refresh(this.refreshOptions);
             })
          }, operatorTd, "first");
        }
        else {
          operatorBtn = domConstruct.create("div",{"style": "width:32px;"},operatorTd);
        }
        
        //indentDiv = domConstruct.create("div", {}, operatorTd, "last");
        //domStyle.set(indentDiv, "width", indentDivWidth +"px");
        expTd = domConstruct.create("td" , { "class":"esriAnalysisExpression expressionTd"}, expTr);
        expLabel = domConstruct.create("label", { "class": "", title: this.expressionStore.getLabel(object), "innerHTML": object.expressionText}, expTd);
        //console.log(exptable);
      }
      return node;
    },
  
    /*_renderActionButtons: function(object, value, node, options) {
      //console.log(node);
      if(!object.expression) {
        domStyle.set(node, "display", "none");
      }    
      var actionDiv = domConstruct.create("div", {"style":{
         id: "ctr_"+object.id,
         display:"none"
       }, 
       "class": "esriFloatTrailing"}, node);
      var editButton = new Button({   
        rowId : object.id,
        label: "Edit",
        iconClass:'esriAnalysisEditIcon',
        showLabel: false
      });
      var deleteButton = new Button({
        rowId : object.id,
        label: "Remove",
        iconClass:'esriAnalysisRemoveIcon',
        showLabel: false
      });
      editButton.on("click", lang.hitch(this, function(id, e) {
        this._testdiv.innerHTML ="Editing Expression ===> " + this.expressionStore.get(id).expression;
        this._expDialog.show();
        return false;
      }, object.id));    
      deleteButton.on("click", lang.hitch(this, function(id, e) {
        e.preventDefault();
        this.expressionStore.remove(id);
        //console.log("removed ...............");
        return false;
      }, object.id));
      editButton.placeAt(actionDiv);
      deleteButton.placeAt(actionDiv);
      
      return actionDiv;
    },*/
   
    _clear: function() {
      this._selectedIds = [];
      this.expressiongrid.clearSelection();
      this.expressiongrid.refresh(this.refreshOptions);
      this._groupBtn.set("disabled", true);
      this._ungroupBtn.set("disabled", true);
      this._removeBtn.set("disabled", true);
      this._editBtn.set("disabled", true);
      this._addBtn.set("disabled", false);
      this._viewBtn.set("disabled", this.expressionStore.data.length === 1 ? true : false);
      if(this.expressionStore.data.length === 1) {
        if(!this.allowAllInputOperands){
          this._expressionForm.set("firstOperands", [this.analysisLayer]);
        }
        else {
          this._expressionForm.set("firstOperands", this.inputLayers); //for derive new locations
        }
        this._expressionForm.set("selectedFirstOperand", this.analysisLayer);
        this._expressionForm.set("inputOperands", this.inputLayers);        
      }
    },
    
    _handleAddButtonClick: function(e) {
      //console.log("********************");
      //console.log(this.expressionStore);
      //console.log("*******************");
      this._expDialog.set("title", this.i18n.addExpr);
      this._expressionForm.set("action", "add");
      this._expressionForm.clear();
      //this._testdiv.innerHTML ="Adding New Expression";
      this._expDialog.show();
    },
    
    _handleEditButtonClick: function(e) {
      event.stop(e);
      this._expDialog.set("title", this.i18n.editExpr);
      //console.log(this._selectedIds);
      if(this._selectedIds && this._selectedIds.length === 0) {
        return false;
      }
      var object, item;
      object = this._selectedIds[0];
      //this._testdiv.innerHTML ="Editing Expression ===> " + this.expressionStore.get(this._selectedIds[0]).expression;
      //console.log("Editing Expression ===> " + this.expressionStore.get(this._selectedIds[0]).expression);
      item = this.expressionStore.get(this._selectedIds[0]);
      this._expressionForm.set("action", "edit");
      this._expressionForm.clear();
      this._expressionForm.set("expression", item);
      this._expDialog.show();
    },
    
    _handleRemoveButtonClick: function(e) {
      event.stop(e);
      if(this._selectedIds && this._selectedIds.length === 0) {
        return false;
      }
      array.forEach(this._selectedIds , function(id){
        this.expressionStore.remove(id);  
      }, this);
      this._clear();
      this.emit("update-expressions", this.expressionStore.query());// to notify to the tool using it
    },
    
    _handleGroupButtonClick: function(e) {
      //console.log(this._selectedRows);
      //console.log(this._selectedIds);
      var idArray, parentIndex, rowItem;
      if(this._selectedIds && this._selectedIds.length === 0) {
        return false;
      }
      idArray = array.map(this._selectedIds, function(id) {
        return parseInt(id, 10);
      });
      parentIndex = this._arrayMin(idArray);
      //console.log(parentIndex);
      //console.log(this.expressionStore.mayHaveChildren(this.expressionStore.get(parentIndex)));
      array.forEach(this._selectedRows, function(row, i){
        rowItem = this.expressiongrid.cell(this._selectedRows[i].id);
        if(this._selectedRows[i].id > 1 && this._selectedRows[i].id !== parentIndex) {
          if(rowItem.row.data.parent === 0 && this.expressionStore.mayHaveChildren(this.expressionStore.get(parentIndex))) {
            rowItem.row.data.parent = parentIndex;
          }
          //console.log("notifying ", rowItem.row.data);
          this.expressionStore.put(rowItem.row.data);
        }
        this.expressiongrid.refresh(this.refreshOptions);
      }, this);
      this._clear();
      
    },
    
    _handleUngroupButtonClick: function(e) {
      //console.log(this._selectedRows);
      //console.log(this._selectedIds);
      var idArray, parentIndex, rowItem;
      if(this._selectedIds && this._selectedIds.length === 0) {
        return false;
      }
      idArray = array.map(this._selectedIds, function(id) {
        return parseInt(id, 10);
      });
      parentIndex = this._arrayMin(idArray);
      //console.log(parentIndex);
      array.forEach(this._selectedRows, function(row, i){
        rowItem = this.expressiongrid.cell(this._selectedRows[i].id);
        if(this._selectedRows[i].id > 1 && this._selectedRows[i].id !== parentIndex) {
          if(rowItem.row.data.parent === parentIndex) {
            rowItem.row.data.parent = 0;
          }
          //console.log("notifying ", rowItem.row.data);
          this.expressionStore.put(rowItem.row.data);
        }
        this.expressiongrid.refresh(this.refreshOptions);
      }, this);
      this._clear();   
    },
    
    _handleExpressionFormAdd: function(expObj) {
      //console.log("Success", expObj);
      var storeObj = {}, parentIndex;
      if(expObj.action === "add"){
        storeObj = {
          id: this.expressionStore.data.length,
          operator: (this.expressionStore.data.length === 1)? "" : "and" //default
        };
        //storeObj.expression = expObj.text;
        //console.log(this._selectedIds);
        if(this._selectedIds.length === 0) {
          storeObj.parent = 0;
        }
        else if(this._selectedIds.length === 1) {
          parentIndex = parseInt(this._selectedIds[0], 10);
          storeObj.parent = this.expressionStore.mayHaveChildren(this.expressionStore.get(parentIndex))? parentIndex : 0;
        }
      }
      else {
        storeObj = this.expressionStore.get(parseInt(this._selectedIds[0], 10));
        //edit may have changed the operator also 
        if(storeObj.where && expObj.expression.spatialRel){
          //attribute to spatial
          delete storeObj.where;
        }
        if(storeObj.spatialRel && expObj.expression.where) {
          //spatial to attribute
          delete storeObj.spatialRel;
          delete storeObj.selectingLayer;
          if(storeObj.distance) {
              delete storeObj.distance;
              delete storeObj.units;
          }
        }
      }
      lang.mixin(storeObj, expObj.expression);
      storeObj.expressionText = expObj.displayText; // may be called displayText
      storeObj.text = expObj.text;
      this.expressionStore.put(storeObj);
      this.expressiongrid.refresh(this.refreshOptions);
      this._expDialog.hide();
      if(!this.allowAllInputOperands){
        this._updateFirstOperands(expObj.expression);// for the expression form input operands
      }
      this._clear();
      this.validate();
      this.emit("update-expressions", this.expressionStore.query());// to notify to the tool using it
    },
    
    _handleExpressionFormCancel: function() {
      this._expDialog.hide();
      this._clear();
    },
    
    _handleViewButtonClick: function(value) {
      var expressions;
      this._viewBtn.set("label", value ? this.i18n.viewGrid : this.i18n.viewText);
      this._viewBtn.set("iconClass", value ? "esriAnalysisGridIcon" : "esriAnalysisTextIcon");
      if(value) {
        this._groupBtn.set("disabled", value);
        this._ungroupBtn.set("disabled", value);
        this._removeBtn.set("disabled", value);
        this._editBtn.set("disabled", value);
        this._addBtn.set("disabled", value);
      }
      expressions = this.get("expressions");
      //console.log(this.expressionStore.allExpressionText);
      domStyle.set(this._textDiv, "display", value? "": "none");
      domStyle.set(this._gridDiv, "display", value? "none": "");
      domAttr.set(this._textDiv, "innerHTML", value? this.expressionStore.allExpressionText : "");
      if(!value) {
        this._clear();
      }
    },
    
    _updateFirstOperands: function(expression) {
      //update form inputOperands
      var firstOperands;
      firstOperands = this.get("selectedLayers");
      this._expressionForm.set("firstOperands", firstOperands);
    },
    
    _getInputLayerById: function(id) {
      array.forEach(this.inputLayers, function(item){
        if(item.id === id){
          return item;
        }
      }, this);
    },
            
    _arrayMin: function(arr) { 
      return Math.min.apply(Math, arr); 
    },
    
    _setInputLayersAttr: function(lyrArray) {
      //console.log("expression grid prop");
      //console.log(this.inputLayers);
      this.inputLayers = lyrArray;
    },
    
    _getInputLayersAttr: function() {
      /*this.inputLayers = array.map(this._inputLayersSelect.get("value"), function(value){
        return this.featureLayers[parseInt(value, 10)];
      }, this);*/
      return this.inputLayers;
    },    
    
    
    _setAnalysisLayerAttr: function(layer) {
      //console.log("expression grid prop");
      //console.log("analysis", layer);
      this.analysisLayer = layer;
    },

    _getAnalysisLayerAttr: function() {
      return this.analysisLayer;
    },
    
    _setSelectedLayersAttr: function(lyrArray) {
      //console.log("expression grid prop");
      //console.log(this.inputLayers);
      this.selectedLayers = lyrArray;
    },
    
    _getSelectedLayersAttr: function() {
      var selectedIds = [], selectedLayers = [];
      array.forEach(this.expressionStore.data, function(item, index){
        if(esriLang.isDefined(item.layer)) {
          if(array.indexOf(selectedIds, item.layer) === -1) {
          selectedIds.push(item.layer);
          selectedLayers.push(this.inputLayers[item.layer]);
          }
        }
        if(esriLang.isDefined(item.selectingLayer)){
          if(array.indexOf(selectedIds, item.selectingLayer) === -1){
            selectedIds.push(item.selectingLayer);
            selectedLayers.push(this.inputLayers[item.selectingLayer]);
          }
        }
      }, this);
      this.selectedLayers = selectedLayers;
      //console.log("************************ inputLayers", this.selectedLayers);
      this.set("selectedLayerIds", selectedIds);
      return this.selectedLayers;
    },
    
    _setSelectedLayerIdsAttr: function(ids) {
      this.selectedLayerIds = ids;
    },
    
    _getSelectedLayerIdsAttr: function() {
      return this.selectedLayerIds;
    },
    
    _getSelectedLayersMapAttr: function() {
      var obj = {};
      obj.inputLayers = this.get("inputLayers");
      obj.selectedLayers = this.get("selectedLayers");
      obj.selectedLayerIds = this.get("selectedLayerIds");
      return obj;
    },
    
    _getExpressionsAttr: function() {
      //console.log("Success Great things are happening ");
      var expressions = [], exp, temp;
      //reset
      this.expressionStore.allExpressionText = "";
      array.forEach(this.expressionStore.data, function(item, index) {
        item._isAdd = false;
      });
      
      array.forEach(this.expressionStore.data, function(item, index){
        if(index !== 0) {
          ////////////////////////////
          temp = {};
          temp.operator = item.operator;
          temp.layer = item.layer;
          if(item.where) {
            temp.where = item.where;
          }
          else {
            temp.selectingLayer = item.selectingLayer;
            temp.spatialRel  = item.spatialRel ;
            if(item.distance) {
              temp.distance = item.distance;
              temp.units = item.units;
            }
          }          
          ////////////////////////////
          if(!this._findElementInMultiArray(expressions, temp)) { 
            exp = this.expressionStore.getExpressions(item);
            //console.log("Success ==> ", exp, index);
            expressions.push(exp);  
          }
        }
      }, this);
      //console.log("generated expressions \n");
      //console.log(expressions);
      //console.log("generated expressions json format \n");
      //console.log(JSON.stringify(expressions));
      return expressions;
    },
    
    _getExpressionMapAttr: function() {
      // now update the Expressions based on selected Layers
      var layerMap, expressions;
      layerMap = this.get("selectedLayersMap");
      expressions = this.get("expressions");
      console.log(this.expressionStore.allExpressionText);
      expressions = this._updateExpressions(expressions, layerMap);
      //console.log(expressions);
      //console.log(layerMap);
      return {expressions: expressions, inputLayers: layerMap.selectedLayers, expressionString: this.expressionStore.allExpressionText};
    },
    
    _setShowReadyToUseLayers: function(value) {
      this._set("showReadyToUseLayers", value);
    },
    
    _updateExpressions: function(expArr, layerMap) {
      array.forEach(expArr, function(item, index){
        if(item instanceof Array || item.length) {
          item = this._updateExpressions(item, layerMap);
        }
        else {
          if(esriLang.isDefined(item.layer) && array.indexOf(layerMap.selectedLayerIds, item.layer) !== -1) {
            item.layer = array.indexOf(layerMap.selectedLayerIds, item.layer);
          }
          if(esriLang.isDefined(item.selectingLayer) && array.indexOf(layerMap.selectedLayerIds, item.selectingLayer) !== -1) {
            item.selectingLayer = array.indexOf(layerMap.selectedLayerIds, item.selectingLayer);
          }
        }
      }, this); 
      return expArr;
    },
    
    
    _findElementInMultiArray: function(arr, obj) {
      var found = false;
      array.forEach(arr, function(item, index){
        if(JSON.stringify(obj) === JSON.stringify(item)) {
          found = true;
          return found;
        }
        else {
          if(item instanceof Array || item.length) {
            found = this._findElementInMultiArray(item, obj);
          }
        }
      }, this);
      return found;
    },
    
    _setPrimaryActionButttonClassAttr: function(str) {
      this.primaryActionButttonClass = str;
    },
    
    _getCssClassesAttr: function() {
      return this.primaryActionButttonClass;
    },
    
    validate: function() {
      var isValid;
      isValid = (this.expressionStore.data.length !== 1);
      if(!isValid) {
        winUtils.scrollIntoView(this.expressiongrid.domNode);
        this.expressiongrid.focus();
        domStyle.set(this.expressiongrid.domNode,"borderColor","#f94");
      }
      else {
        domStyle.set(this.expressiongrid.domNode,"borderColor","#bba");
      }
      return isValid;
    }    
  });
  
  return ExpressionGrid;  
  
});

  


