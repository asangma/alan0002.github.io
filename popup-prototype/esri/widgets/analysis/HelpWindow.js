define(
[ 
  "require",
  "dojo/_base/array",
  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/_base/event",
  "dojo/_base/kernel",
  "dojo/aspect",
  "dojo/has",
  "dojo/dom-construct",
  "dojo/dom-class",
  "dojo/dom-attr",
  "dojo/dom-style",
  "dojo/query",
  "dojo/window",
  "dojo/dom-geometry",
  
  "dijit/_Widget",
  "dijit/TooltipDialog",
  "dijit/popup",
  
  "../../kernel",
  "../../core/lang",
  "../../request",
  "../Widget",
  "dojo/i18n!../../nls/jsapi"
],

function(require, array, declare, lang, connection, event, kernel, aspect, has, domConstruct, domClass, domAttr, domStyle,  query, win, domGeom, _Widget, TooltipDialog, popup, esriKernel, esriLang, esriRequest, Widget, jsapiBundle) {
 
  var HelpWindow = declare([_Widget], {
    declaredClass: "esri.widgets.analysis.HelpWindow",
    i18n: null,
    basePath: require.toUrl("."),
    onlineHelpMap: null,
    showLearnMore: false,
    "class": "esriAnalyisHelpWindow",
    
    
    postMixInProperties: function() {
      this.inherited(arguments);
      this.i18n = {};
      lang.mixin(this.i18n, jsapiBundle.common);
      lang.mixin(this.i18n, jsapiBundle.analysisHelp);
    },
    
    postCreate: function() {
      this.inherited(arguments);
      //on domnode leave close the help window
      /*if(this.tooltipHelpDlg) {
        connection.connect(this.tooltipHelpDlg.domNode, connection.mouse.leave, lang.hitch(this, this.close));
      }*/
      var rtlLocales = ["ar", "he"], i, rLocale, url;
      this.onlineHelpMap = {};
      for(i = 0; i<rtlLocales.length; i=i+1) {
        rLocale = rtlLocales[i];
        if (kernel.locale && kernel.locale.indexOf(rLocale) !== -1) {
          if(kernel.locale.indexOf("-")!== -1) {
            if(kernel.locale.indexOf(rLocale + "-") !== -1) {
              this._isRightToLeft = true; 
            }
          }
          else {
          this._isRightToLeft = true; 
          }
        }
      }
      //this.basePath = "//dczpx2rvsugxm.cloudfront.net/cdn/2855/js/esri/widgets/analysis";
      url = this._getAbsoluteUrl(this.basePath) + "/help/helpmap.json";
      //console.log(this.basePath);
      //console.log(url);
      esriRequest({
        "url":url}).then(lang.hitch(this, function(result) {
         //console.log(result);
         this.onlineHelpMap = result.map;
         //console.log(this.onlineHelpMap);
      }));
    },
    
    _getAbsoluteUrl: function(url) {
      if (/^https?\:/i.test(url)) {
          // Example: "http://servicesbeta.esri.com/jsapi/arcgis/3.4/js/esri/widgets"
          // http://help.arcgis.com/en/webapi/javascript/arcgis/samples/map_currentextent/index.html
          // Already an absolute link. Nothing to do here.
          return url;
      } else if (/^\/\//i.test(url)) {
          // Example: "//dczpx2rvsugxm.cloudfront.net/cdn/2419/js/esri/widgets"
          // https://devext.arcgis.com/home/webmap/viewer.html?useExisting=1
          return window.location.protocol + url;
      } else if (/^\//i.test(url)) {
          // Example: "/jsapi/src/js/esri/widgets"
          // http://pponnusamy.esri.com:9090/jsapi/mapapps/testing/v34/amd/map-legacy.html
          return window.location.protocol + "//" + window.location.host + url;
      }
    },
    
    _computeSize: function(helpId) {
      var size = {
        w: 400,
        h: 200
      };
      if(helpId.indexOf("Category") !== -1) {
        size.w = 400;
        size.h = 320;
      }
      else if(helpId.indexOf("Tool") !== -1) {
        size.w = 400;
        size.h = 320;
      }
      else if(helpId.indexOf("toolDescription") !== -1) {
        size.w = 400;
        size.h = 520;
      }
      return size;
    },
   
    _setHelpTopicAttr: function(helpId) {
      //console.log(helpId);
      if(this.tooltipHelpDlg) {
        popup.close(this.tooltipHelpDlg);
        this.tooltipHelpDlg.destroy();
        this.tooltipHelpDlg = null;
      }
      var appLocale, helpLocales, containerAppUrl, size, structure, helpUrl, locArr, learnMoreUrl, env, resourcesHelpLocales;
      this.showLearnMore = false; //default case
      env = (this._analysisGpServer && this._analysisGpServer.indexOf("dev") !== -1) ? "dev" : ((this._analysisGpServer && this._analysisGpServer.indexOf("qa") !== -1) ?  "uat" : "");
      appLocale = lang.clone(kernel.locale);
      if (appLocale === "nb") {
        appLocale = "no";
      }
      helpLocales = ["ar", "cs", "da", "de", "es", "el", "et", "fi", "fr", "it", "ja", "ko", "lt", "lv", "ru", "nl", "no", "pl", "pt-br", "pt-pt", "ro", "sv", "th", "tr", "vi", "zh-cn"];
      resourcesHelpLocales = ["ar", "da", "de", "es", "fr", "it", "ja", "ko", "ru", "nl", "no", "pl", "pt-br", "pt-pt", "ro", "zh-cn"];
      containerAppUrl = require.toUrl("esri/widgets/analysis/help/");
      helpUrl = containerAppUrl + this.helpFileName + ".html";
      
      if(esriLang.isDefined(this.onlineHelpMap[this.helpFileName]) && esriLang.isDefined(this.onlineHelpMap[this.helpFileName][helpId]) ) {
        this.showLearnMore = true;
        learnMoreUrl = "http://doc" + env + ".arcgis.com/en/arcgis-online/use-maps/" + this.onlineHelpMap[this.helpFileName][helpId];
      }
      
      if (array.indexOf(helpLocales, appLocale) !== -1) {
        if(appLocale.indexOf("-")!== -1) {
          locArr = appLocale.split("-");
          appLocale = locArr[0] + "-" + locArr[1].toUpperCase(); 
        }
        helpUrl = containerAppUrl + appLocale + "/" + this.helpFileName + ".html";
      }
      
      if (array.indexOf(resourcesHelpLocales, appLocale) !== -1) {
        if(this.showLearnMore) {
            learnMoreUrl = "http://doc" + env + ".arcgis.com/"+ appLocale +"/arcgis-online/use-maps/" + this.onlineHelpMap[this.helpFileName][helpId];
        }
      }
      //check for learn more
      
      
      size = this._computeSize(helpId);
      this._size = size;
      structure = 
       "<div class='' style='position:relative'"+ 
          "<div class='sizer content'>" +
            "<div class='contentPane'>" +
             "<div class='esriFloatTrailing' style='padding:0;'>"+
                "<a href='#' class='esriAnalysisCloseIcon' title='"+ this.i18n.close +"'>"+
                  "</a>"+
             "</div>"+           
             "<iframe frameborder='0'  id='"+ helpId +"' src='"+ helpUrl +"#"+ helpId +
              "' width='"+ size.w +"' height='"+ size.h  +"' marginheight='0' marginwidth='0'></iframe>"+
            "</div>" +
          "</div>" +
          "<div class='sizer'>" + 
            "<div class='actionsPane'>" + 
              "<div class='actionList"+ (this.showLearnMore? "'>": " hidden'>") + 
                "<a class='action zoomTo' href='"+ (this.showLearnMore? learnMoreUrl : "#")  +"' target='_help'>" + this.i18n.learnMore + "</a>" + 
              "</div>" +
            "</div>" +
          "</div>" +
          "</div>"+
        "</div>" ;
      this.tooltipHelpDlg = new TooltipDialog({
        "preload":true, 
        "content": structure,
        "class": "esriHelpPopup esriHelpPopupWrapper esriAnalyisHelpWindow"
       // open link to view the HTML help
      });
      this.tooltipHelpDlg.startup();
    },
    
    
    show: function(event, params) {
      //console.log("showing help for ID", helpId) ;
      //console.log(event);
      this.helpFileName =  params.helpFileName;
      this._analysisGpServer = params.analysisGpServer; 
      this.set("helpTopic", params.helpId);
      var handleOpen = aspect.after(popup, "open", lang.hitch(this, function() {
        query(".esriAnalysisCloseIcon", this.tooltipHelpDlg.domNode).on("click", lang.hitch(this, this.close));
        handleOpen.remove();
      }));
      var x = event.pageX,
          vport = win.getBox(),
          analysisWidgetNode,
          analysisWidgetCoords,
          shift;
      shift = false;
      if(params.helpParentNode) {
        analysisWidgetNode = params.helpParentNode; 
      }
      if(analysisWidgetNode) {
        analysisWidgetCoords = domGeom.position(analysisWidgetNode);
      }
      if(analysisWidgetCoords && !this._isRightToLeft && (vport.w - event.pageX < analysisWidgetCoords.w)) {
        shift = true; 
        x = analysisWidgetCoords.x - this._size.w - 10;
      }
      //in RTL when the widget container is on the right in the viewport
      //T.B.D simplify
      else if(this._isRightToLeft && (x - 40) <  this._size.w) {
        x = analysisWidgetCoords.w + this._size.w + 80;
      }
      popup.open({
        popup: this.tooltipHelpDlg,
        x: (this._isRightToLeft === true || shift) ? x - 40 : x + 40,
        y: event.screenY - event.pageY + 10,
        //around: event.currentTarget,
        //orient: { 'BL': 'TL', 'BR': 'TR', 'TL': 'BL', 'TR': 'BR' },
        //orient:[ "above-alt", "above-alt", "above-alt", "above-alt" ],
        onCancel: lang.hitch(this, function(){
          //console.log(self.id + ": cancel of child");
          this.close();
        }),
        onExecute: function(){
          //console.log(self.id + ": execute of child");
          //popup.close(this.tooltipHelpDlg);
          this.close();
          //self.open = false;
        }
      });  
      if(this.tooltipHelpDlg.domNode.parentNode) {
        domStyle.set(this.tooltipHelpDlg.domNode.parentNode, "overflowY", "hidden");
      }
    },
    
    close: function(event, helpId) {
      popup.close(this.tooltipHelpDlg);
    }
  });

  
  return HelpWindow;  
});
    
