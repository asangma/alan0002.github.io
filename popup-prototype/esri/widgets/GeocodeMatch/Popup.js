define([
  "require",
  "dojo/_base/array",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/Evented",
  "dojo/on",
  "dojo/uacss",
  "dojo/text!./templates/Popup.html",
  "dojo/i18n!../../nls/jsapi",
  "dijit/form/Button",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "../../kernel",
  "../../geometry/support/webMercatorUtils"
], function (
  require, array, declare, lang, 
  Evented, on, has,
  template, i18n,
  Button, _WidgetBase, _TemplatedMixin, 
  esriKernel, webMercatorUtils
) {
  var basePath = require.toUrl("..");
  var Widget = declare([_WidgetBase, _TemplatedMixin, Evented], {
    templateString: template,
    i18n: i18n,
    reverseRange: 100,
    
    constructor: function (params, srcNodeRef) {
      if(params.rowData){
        this._graphicID = params.graphic.attributes.id;
        if(params.rowData.address){
          if(typeof params.rowData.address === "object"){
            var addressString = "", key;
            for(key in params.rowData.address){
              if(params.rowData.address.hasOwnProperty(key)){
                addressString += params.rowData.address[key] + " ";
              }
            }
            this._address = addressString;
          }else{
            this._address = params.rowData.address;
          }
        }
      }
      if(params.reverseRange){
        this.reverseRange = params.reverseRange;
      }
    },
    
    postCreate: function() {
      this.inherited(arguments); 
      var geographicGeometry;
      if(this._address && this._addressTag){
       this._addressTag.innerHTML =  this._address;
      }else{
        this.geocodeMatch._locator.locationToAddress(this.graphic.geometry, this.reverseRange).then(lang.hitch(this, function (geocodeResults) {
          var resultsAddress = geocodeResults.address, addressString = "", key;
          this.graphic.attributes.reverseGeocodeResults = resultsAddress;
          if(typeof resultsAddress === "object"){
            for(key in resultsAddress){
             if(resultsAddress.hasOwnProperty(key)){
                if(resultsAddress[key] !== null && key !== "Loc_name"){
                  //addressString += "<strong>" +key + "</strong> " + resultsAddress[key] + "<br />";
                  addressString += resultsAddress[key] + " ";
                }
              }
            }
            if(this._addressTag){
              this._addressTag.innerHTML = addressString;
            }
          }else{
            if(this._addressTag){
              this._addressTag.innerHTML = resultsAddress;
            }
          }
          this._matchButtonRef.set("disabled", false);
        }), lang.hitch(this, function (){
          if(this._addressTag){
            this._addressTag.innerHTML = i18n.widgets.geocodeMatch.popup.noAddress;
          }
          this._matchButtonRef.set("disabled", false);
        }));
      }
      geographicGeometry = webMercatorUtils.webMercatorToGeographic(this.graphic.geometry);
      this._Xtag.innerHTML = this.i18n.widgets.geocodeMatch.popup.xTitle + geographicGeometry.x.toFixed(6);
      this._Ytag.innerHTML = this.i18n.widgets.geocodeMatch.popup.yTitle + geographicGeometry.y.toFixed(6);
    
      this._matchButtonRef = new Button({
        "label": this.i18n.widgets.geocodeMatch.popup.matchButtonLabel,
        "class": "esri_PopupButton esri_matchButton",
        "disabled": true
      },  this._matchButton);

      this._discardButtonRef = new Button({
        "label": this.i18n.widgets.geocodeMatch.popup.discardButtonLabel,
        "class": "esri_PopupButton esri_deleteButton"
      },  this._discardButton);
      
      this._listenerHandles = [
        // Match Button
        on(this._matchButtonRef, "click", lang.hitch(this, function() {
          if(this.graphic.attributes.type === this.i18n.widgets.geocodeMatch.customLabel){
            this.geocodeMatch._matchCustomFeature(this.graphic);
          }else{
            this.geocodeMatch._matchFeature(this.graphic.attributes.id);
          }
          this.map.popup.hide();
        })),
        // Discard Button
        on(this._discardButtonRef, "click", lang.hitch(this, function() {
          this.map._layers[this.graphicsLayer.id].remove(this.graphic);
          this.map.popup.hide();
        }))
      ]; 
      // Don't show buttons if feature is matched
      if(this.graphic.attributes.matched === true){
        //domStyle.set(this.esri_popupContent, "display", "none");
        this._discardButtonRef.destroy();
        this._matchButtonRef.destroy();
      // Don't show discard button if feature is unmatched candidate
      }else if(this.graphic.attributes.matched === false && this._address){
        this._discardButtonRef.destroy();
        this._matchButtonRef.set("disabled", false);
      }
      
      this.emit("load", {
        "matchButtonRef" : this._matchButtonRef,
        "discardButtonRef": this._discardButtonRef
      });
    },
    
    startup: function() {
      this.inherited(arguments);
      this.emit("load", {
        "matchButtonRef" : this._matchButtonRef,
        "discardButtonRef": this._discardButtonRef
      });
    },
    
    destroy: function() {
      this.inherited(arguments);
      // Release my resources
      /*
      this._listenerHandles.forEach(function(handle) {
        handle.remove();
      });
      */
      array.forEach(this._listenerHandles, function(handle){
        handle.remove();
      });
    }
  });
  
  return Widget;
});

