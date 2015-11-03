define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",

  "dojo/dom",
  "dojo/dom-class",
  "dojo/dom-construct",

  "dojo/on",

  "dijit/Menu",
  "dijit/MenuItem",
  "dijit/form/Button",
  "dijit/form/ComboButton",

  "../tasks/PrintTask",
  "../tasks/support/PrintParameters",

  "../core/domUtils",
  "../core/Evented",

  "dojo/i18n!../nls/jsapi"
], function(
  declare, lang, array,
  dom, domClass, domConstruct,
  on,
  Menu, MenuItem, Button, ComboButton,
  PrintTask, PrintParameters,
  domUtils, esriEvented,
  jsapiBundle
) {
  var Print = declare([esriEvented], {
    declaredClass: "esri.widgets.Print",
    
    constructor: function (params, srcNodeRef) {
      params = params || {};
      this.url = params.url;
      this.async = params.async;
      this.map = params.map;
      this.templates = params.templates;
      this.extraParams = params.extraParameters;
      var localStrings = jsapiBundle.widgets.print;
      this._printText = localStrings.NLS_print;
      this._printingText = localStrings.NLS_printing;
      this._printoutText = localStrings.NLS_printout;
      if (!this.templates) {
        this.templates = [{
          label: this._printText,
          format: "PNG32",
          layout: "MAP_ONLY",
          exportOptions: {
            width: 800,
            height: 1100,
            dpi: 96
          }
        }];
      }

      this.printDomNode = domConstruct.create("div");
      domClass.add(this.printDomNode, "esriPrint");
      srcNodeRef = dom.byId(srcNodeRef);
      srcNodeRef.appendChild(this.printDomNode);
    },

    startup: function () {
      this._createPrintButton();
    },

    destroy: function () {
      this.map = null;
      domConstruct.destroy(this.printDomNode);
    },

    hide: function () {
      domUtils.hide(this.printDomNode);
    },

    show: function () {
      domUtils.show(this.printDomNode);
    },

    printMap: function (template) {
      this.emit("print-start");
      this._printButton.setAttribute("label", this._printingText);
      this._printButton.setAttribute("disabled", true);
      var map = this.map;
      var printTask = new PrintTask(this.url, {async: this.async});
      var params = new PrintParameters();
      params.map = map;
      params.template = template;
      params.extraParameters = this.extraParams;
      printTask.execute(params, lang.hitch(this, this._printComplete), lang.hitch(this, this._printError));
    },

    _createPrintButton: function () {
      var templates = this.templates;

      if (templates.length === 1) {
        this._printButton = new Button({
          label: this._printText,
          onClick: lang.hitch(this, function () {
            this.printMap(templates[0]);
          })
        });
        this.printDomNode.appendChild(this._printButton.domNode);

      } else {
        this._printButton = new ComboButton({
          label: this._printText,
          onClick: lang.hitch(this, function () {
            this.printMap(templates[0]);
          })
        });
        this.printDomNode.appendChild(this._printButton.domNode);
        var menu = new Menu({
          style: "display: none;"
        });
        array.forEach(templates, function (template) {
          var menuItem = new MenuItem({
            label: template.label,
            onClick: lang.hitch(this, function () {
              this.printMap(template);
            })
          });
          menu.addChild(menuItem);
        }, this);

        this._printButton.setAttribute("dropDown", menu);
      }
      domClass.add(this._printButton.domNode, "esriPrintButton");
    },

    _printComplete: function (result) {
      this.emit("print-complete", {
        value: result
      });
      var appHostSplits = window.location.host.split(".");
      var appDomain = appHostSplits.length > 1 ? appHostSplits[appHostSplits.length - 2] + "." + appHostSplits[appHostSplits.length - 1] : window.location.host;
      var urlHostSplits = result.url.split("://")[1].split("/")[0].split(".");
      var urlDomain = urlHostSplits.length > 1 ? urlHostSplits[urlHostSplits.length - 2] + "." + urlHostSplits[urlHostSplits.length - 1] : result.url.split("://")[1].split("/")[0];
      if (appDomain.toLowerCase() === urlDomain.toLowerCase()) {
        window.open(result.url);
        this._removeAllChildren(this.printDomNode);
        this._createPrintButton();
      } else {
        this._printButton.domNode.style.display = "none";
        var printAnchor = domConstruct.create("a", {
          href: result.url,
          target: "_blank",
          innerHTML: this._printoutText
        });
        on(printAnchor, "click", lang.hitch(this, this._hyperlinkClick));
        this._removeAllChildren(this.printDomNode);
        domClass.add(printAnchor, "esriPrintout");
        this.printDomNode.appendChild(printAnchor);
      }
    },

    _printError: function (err) {
      this._removeAllChildren(this.printDomNode);
      this._createPrintButton();
      console.error(err);
      this.emit("error", {
        error: err
      });
    },

    _hyperlinkClick: function () {
      this._removeAllChildren(this.printDomNode);
      this._createPrintButton();
    },

    _removeAllChildren: function (domNode) {
      while (domNode.hasChildNodes()) {
        domNode.removeChild(domNode.lastChild);
      }
    }
  });

  return Print;
});
