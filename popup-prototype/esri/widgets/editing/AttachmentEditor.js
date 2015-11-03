define(
[
    "require", 
    "../../core/declare",
    "dojo/_base/lang", 
    "dojo/_base/connect", 
    "dojo/_base/array", 
    "dojo/_base/kernel", 

    "dojo/has",
    "dojo/query", 
    "dojo/io-query",
    "dojo/dom-attr",

    "dijit/_Widget",
    "dijit/_Templated",

    "../../kernel",
    "../../core/lang",
    "../../core/domUtils",

    "dojo/text!./templates/AttachmentEditor.html",

    "dojo/i18n!../../nls/jsapi",
    "dojo/NodeList-dom" // for NodeList.orphan
], function(
    require, declare, lang, connect, array, dojoNS,
    has, query, ioQuery, domAttr,
    _Widget, _Templated,
    esriKernel, esriLang, domUtils,
    widgetTemplate,
    jsapiBundle
) {
    var AE = declare([_Widget, _Templated], {
        declaredClass: "esri.widgets.editing.AttachmentEditor",

        widgetsInTemplate: true,
        // templatePath: dojo.moduleUrl("esri.widgets.editing", "templates/AttachmentEditor.html"),
        // templatePath: require.toUrl("./templates/AttachmentEditor.html"),
        templateString: widgetTemplate, 
        // basePath: dojo.moduleUrl("esri.widgets.editing"),
        basePath: require.toUrl(".") + "/",

        _listHtml: "<span id='node_${oid}_${attid}'><a href='${href}' target='_blank'>${name}</a>",
        _deleteBtnHtml: "(<span style='cursor:pointer;color:red;font-weight:bold;' class='deleteAttachment' id='${attid}');'>X</span>)",
        _endHtml: "<br/></span>",
        _aeConnects: [],
        _layerEditingCapChecked: {},
        _layerEditingCap: {},

        /*************
         * Overrides
         *************/
        constructor: function(params, srcNodeRef) {
            // Mixin i18n strings
            lang.mixin(this, jsapiBundle.widgets.attachmentEditor);
        },

        startup: function() {
            this.inherited(arguments);
            this._uploadField_connect = connect.connect(this._uploadField, "onchange", this, function(){
              // IE11 double addAttachment fix
              if(this._uploadField.value.length > 0){
                this._addAttachment();
              }
            });//"_addAttachment");
            this._uploadFieldFocus_connect = connect.connect(this._uploadField, "onfocus", lang.hitch(this, function(e){
              domUtils.hide(this._attachmentError);
            }));
        },

        destroy: function() {
            array.forEach(this._aeConnects, connect.disconnect);
            connect.disconnect(this._uploadField_connect);
            connect.disconnect(this._uploadFieldFocus_connect);
            this.inherited(arguments);
        },

        /*****************
         * Public Methods
         *****************/
        showAttachments: function(feature, featureLayer) {
            var list = this._attachmentList;
            list.innerHTML = this.NLS_none;
            this._uploadField.value = "";
            array.forEach(this.domNode.children, function(child, idx){
              domUtils.show(child);
            });
            domUtils.hide(this._attachmentError);
            if (!feature) { return; }
            this._featureLayer = feature.getLayer() || featureLayer;
            if (!this._featureLayer) { return; }
            //if the feature is part of a graphicslayer, instead of featureLayer, for instance, this is
            //a create only featureLayer, then the new added feature is a client graphic temporarily.
            //For this case, hide the attachment editor to prevent users from uploading.
            if (this._featureLayer.declaredClass !== "esri.layers.FeatureLayer" || !this._featureLayer.getEditCapabilities) {
              domUtils.hide(this._uploadForm);
              array.forEach(this.domNode.children, function(child, idx){
                domUtils.hide(child);
              });
              return;
            }
            this._currentLayerId = this._featureLayer.id;
            if (!this._layerEditingCapChecked[this._currentLayerId]) {
              this._layerEditingCap[this._currentLayerId] = this._featureLayer.getEditCapabilities();
              this._layerEditingCapChecked[this._currentLayerId] = true;
            }
            this._featureCanUpdate = this._featureLayer.getEditCapabilities({feature: feature}).canUpdate;
            this._oid = feature.attributes[this._featureLayer.objectIdField];
            this._getAttachments(feature);
        },

        /*******************
         * Internal Methods
         *******************/
        _getAttachments: function(feature) {
            if (!this._featureLayer || !this._featureLayer.queryAttachmentInfos){ return; }
            this._featureLayer.queryAttachmentInfos(this._oid, lang.hitch(this, "_onQueryAttachmentInfosComplete"));
        },

        _addAttachment: function() {
            domUtils.hide(this._attachmentError);
            if (!this._featureLayer || !this._featureLayer.addAttachment){ return; }
            this._featureLayer.addAttachment(this._oid, this._uploadForm, lang.hitch(this, "_onAddAttachmentComplete"), lang.hitch(this, "_onAddAttachmentError"));
        },

        _deleteAttachment: function(oid, attid) {
            this._featureLayer.deleteAttachments(oid, [attid], lang.hitch(this, "_onDeleteAttachmentComplete"));
        },

        _onQueryAttachmentInfosComplete: function(response) {
            var htmlMarkup = this._listHtml + this._deleteBtnHtml + this._endHtml;
            this._uploadForm.style.display = "block";
            if ((!this._featureCanUpdate && this._layerEditingCap[this._currentLayerId].canUpdate) || 
               (!this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate)) {
              htmlMarkup = this._listHtml + this._endHtml;
              this._uploadForm.style.display = "none";
            }
            else if (this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate) {
              htmlMarkup = this._listHtml + this._endHtml;
            }
            var list = this._attachmentList,
                links = array.map(response, lang.hitch(this, function(info) {
                    return esriLang.substitute({
                        href: info.url,
                        name: info.name,
                        oid: info.objectId,
                        attid: info.id
                    }, htmlMarkup);
                }));
            
            list.innerHTML = links.join("") || this.NLS_none;
            this._updateConnects();
        },

        _onAddAttachmentComplete: function(response) {
            var uploadField = this._uploadField;
            var uploadFieldVal = uploadField.value;
            var pos = uploadFieldVal.lastIndexOf("\\");
            if (pos > -1) {
                uploadFieldVal = uploadFieldVal.substring(pos + 1, uploadFieldVal.length);
            }
            uploadFieldVal = uploadFieldVal.replace(/\ /g, '_');

            var list = this._attachmentList,
                params = ioQuery.objectToQuery({
                  gdbVersion: this._featureLayer.gdbVersion,
                  token: this._featureLayer._getToken()
                });
                
            var htmlMarkup = this._listHtml + this._deleteBtnHtml + this._endHtml;
            if (this._layerEditingCap[this._currentLayerId].canCreate && !this._layerEditingCap[this._currentLayerId].canUpdate) {
              htmlMarkup = this._listHtml + this._endHtml;
            }
            var link = esriLang.substitute({
                href: this._featureLayer._url.path + "/" + response.objectId + "/attachments/" + response.attachmentId + (params ? ("?" + params) : ""),
                name: uploadFieldVal,
                oid: response.objectId,
                attid: response.attachmentId
            }, htmlMarkup);
            list.innerHTML = list.innerHTML == this.NLS_none ? link : (list.innerHTML + link);
            this._updateConnects();
            uploadField.value = "";
        },

        _onAddAttachmentError: function(error){
          if (error && esriLang.isDefined(error.code)){
            var errorMsg,
                attachmentError = this._attachmentError;
            if (error.code === 400){
               // 400 is returned for unsupported attachment file types
              errorMsg = this.NLS_fileNotSupported;
            } else {
              errorMsg = error.message || (error.details && error.details.length && error.details[0]);
            }
            domAttr.set(attachmentError, 'innerHTML', (errorMsg || this.NLS_error));
            domUtils.show(attachmentError);
          }
        },

        _onDeleteAttachmentComplete: function(response) {
            var success = array.every(response, function(result) { return result.success; }),
                list = this._attachmentList;
            if (success) {
              dojoNS.query("#node_" + response[0].objectId + "_" + response[0].attachmentId).orphan();
              if (!list.children || !list.children.length){
                list.innerHTML = this.NLS_none;
              }
            }
        },

        _updateConnects: function() {
            array.forEach(this._aeConnects, connect.disconnect);
            dojoNS.query('.deleteAttachment').forEach( function(item) {
                this._aeConnects.push(connect.connect(item, "onclick", lang.hitch(this, "_deleteAttachment", this._oid, item.id)));
            }, this);
        }
    });

    

    return AE;
});
