/******************************************
  esri/widgets/analysis/_AnalysisOptions
******************************************/
define(
[ 
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/has",
  "../../kernel"  
], function(declare, lang, has, esriKernel) {
  var _AnalysisOptions = declare([], {
    declaredClass: "esri.widgets.analysis._AnalysisOptions",
    showSelectFolder: false,
    showChooseExtent: true,
    showHelp: true,
    showCredits: true,
    returnFeatureCollection: false,// returns the result of analysis as feature collection than creating a fetaure service,
    showCloseIcon: true,
    showSelectAnalysisLayer: false,
    map: null,
   
    constructor: function(params){
    },

    _setShowSelectFolderAttr: function(value) {
      this.showSelectFolder = value;
    },
    
    _getShowSelectFolderAttr: function() {
      return this.showSelectFolder;
    },
    
    _setShowChooseExtentAttr: function(value) {
      this.showChooseExtent = value;
    },
    
    _getShowChooseExtentAttr: function() {
      return this.showChooseExtent;
    },
    
    _setMapAttr: function(map) {
      this.map = map;  
    },
    
    _getMapAttr: function() {
      return this.map;
    },   
    
    _setShowHelpAttr: function(value) {
      this.showHelp = value;
    },
      
    _getShowHelpAttr: function() {
      return this.showHelp;
    },
    
    _setReturnFeatureCollectionAttr: function(value) {
      this.returnFeatureCollection = value;
    },
      
    _getReturnFeatureCollectionAttr: function() {
      return this.returnFeatureCollection;
    },    
      
    _setShowCreditsAttr: function(value) {
      this.showCredits = value;
    },
      
    _getShowCreditsAttr: function() {
      return this.showCredits;
    },
    
    _setShowCloseIconAttr: function(value) {
      this.showCloseIcon = value;
    },
      
    _getShowCloseIconAttr: function() {
      return this.showCloseIcon;
    },
    
    _setShowSelectAnalysisLayerAttr: function(value) {
      this.showSelectAnalysisLayer = value;
    },
      
    _getShowSelectAnalysisLayerAttr: function() {
      return this.showSelectAnalysisLayer;
    }
    
  });
  
  
  return _AnalysisOptions;    
});