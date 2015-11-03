define(
[
  "require",

  "../../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/kernel",

  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/dom-style",
  "dojo/on",
  
  "dojox/html/entities",

  "dijit/_Widget",
  "dijit/_Templated",

  "../../core/urlUtils",

  "../Widget",

  "dojo/i18n!./nls/PopupLegacy",

  "dojo/NodeList-dom"
], function(
  require,
  declare, lang, array, dojoNS,
  dom, domAttr, domClass, domConstruct, domStyle, on,
  htmlEntities,
  _Widget, _Templated,
  urlUtils,
  Widget,
  jsapiBundle
) {
  
  var counter = 0;
  
  var PR = declare([ Widget, _Widget, _Templated ], {
    declaredClass: "esri.widgets._PopupRenderer",
    
    constructor: function() {
      this._nls = lang.mixin({}, jsapiBundle.widgets.popup);
    },

    /**
     * Properties:
     *   template
     *   graphic
     *   chartTheme
    */
  
    // TODO
    // Can I do this without being "Templated". Perhaps,
    // enlist dojo.parser's help?
    
    templateString:
      "<div class='esri-view-popup'>" +
    
        /** Title and Description **/
        "<div class='main-section'>" +
          "<div class='header' dojoAttachPoint='_title'></div>" + 
          "<div class='hz-line'></div>" +
          "<div dojoAttachPoint='_description'></div>" +
          "<div class='break'></div>" +
        "</div>" +
        
        /** Attachments **/
        "<div class='attachments-section hidden'>" +
          "<div>${_nls.NLS_attach}:</div>" +
          "<ul dojoAttachPoint='_attachmentsList'>" +
          "</ul>" +
          "<div class='break'></div>" + 
        "</div>" +  
        
        /** Media Section **/
        "<div class='media-section hidden'>" +
          "<div class='header' dojoAttachPoint='_mediaTitle'></div>" + 
          "<div class='hz-line'></div>" +
          "<div class='caption' dojoAttachPoint='_mediaCaption'></div>" +
          
          /** Media Gallery **/
          "<div class='gallery' dojoAttachPoint='_gallery'>" +
            "<div class='media-handle prev' dojoAttachPoint='_prevMedia' dojoAttachEvent='onclick: _goToPrevMedia'></div>" +
            "<div class='media-handle next' dojoAttachPoint='_nextMedia' dojoAttachEvent='onclick: _goToNextMedia'></div>" +
           
            "<ul class='summary'>" +
              "<li class='image media-count hidden' dojoAttachPoint='_imageCount'>0</li>" +
              "<li class='image media-icon hidden'></li>" +
              "<li class='chart media-count hidden' dojoAttachPoint='_chartCount'>0</li>" +
              "<li class='chart media-icon hidden'></li>" +
            "</ul>" +
            
            "<div class='frame' dojoAttachPoint='_mediaFrame'></div>" +
            
          "</div>" + // Media Gallery
          
        "</div>" + // Media Section
        
        /** Edit Summary **/
        "<div class='edit-summary-section hidden' dojoAttachPoint='_editSummarySection'>" +
          "<div class='break'></div>" +
          "<div class='break hidden' dojoAttachPoint='_mediaBreak'></div>" +
          "<div class='edit-summary' dojoAttachPoint='_editSummary'></div>" +
        "</div>" +
      
      "</div>",
  
    showTitle: true,
  
    startup: function() {
      this.inherited(arguments);
      
      this.template.getComponents(this.graphic)
          .then(
            lang.hitch(this, this._handleComponentsSuccess), 
            lang.hitch(this, this._handleComponentsError)
          );
    },
    
    destroy: function() {
      if (this._dfd) {
        this._dfd.cancel();
      }
      
      this._destroyFrame();
      
      this.template = this.graphic = this._nls = this._mediaInfos = 
      this._mediaPtr = this._dfd = null;
      
      this.inherited(arguments);
      //console.log("PopupRenderer: destroy");
    },
    
    /*******************
     * Internal Methods
     *******************/
    
    _goToPrevMedia: function() {
      var ptr = this._mediaPtr - 1;
      if (ptr < 0) {
        return;
      }
      
      this._mediaPtr--;
      this._updateUI();
      this._displayMedia();
    },
    
    _goToNextMedia: function() {
      var ptr = this._mediaPtr + 1;
      if (ptr === this._mediaInfos.length) {
        return;
      }
      
      this._mediaPtr++;
      this._updateUI();
      this._displayMedia();
    },
    
    _updateUI: function() {
      var infos = this._mediaInfos, count = infos.length, domNode = this.domNode,
          prevMedia = this._prevMedia, nextMedia = this._nextMedia;
      
      if (count > 1) {
        var numImages = 0, numCharts = 0;
        array.forEach(infos, function(info) {
          if (info.type === "image") {
            numImages++;
          }
          else if (info.type.indexOf("chart") !== -1) {
            numCharts++;
          }
        });
        
        if (numImages) {
          domAttr.set(this._imageCount, "innerHTML", numImages);
          dojoNS.query(".summary .image", domNode).removeClass("hidden");
        }
        
        if (numCharts) {
          domAttr.set(this._chartCount, "innerHTML", numCharts);
          dojoNS.query(".summary .chart", domNode).removeClass("hidden");
        }
      }
      else {
        dojoNS.query(".summary", domNode).addClass("hidden");
        domClass.add(prevMedia, "hidden");
        domClass.add(nextMedia, "hidden");
      }
      
      var ptr = this._mediaPtr;
      if (ptr === 0) {
        domClass.add(prevMedia, "hidden");
      }
      else {
        domClass.remove(prevMedia, "hidden");
      }
      
      if (ptr === count-1) {
        domClass.add(nextMedia, "hidden");
      }
      else {
        domClass.remove(nextMedia, "hidden");
      }
      
      this._destroyFrame();
    },
    
    _displayMedia: function() {
      var info = this._mediaInfos[this._mediaPtr],
          titleText = info.title, capText = info.caption,
          hzLine = dojoNS.query(".media-section .hz-line", this.domNode)[0];
        
      domAttr.set(this._mediaTitle, "innerHTML", titleText);
      domClass[titleText ? "remove" : "add" ](this._mediaTitle, "hidden");
        
      domAttr.set(this._mediaCaption, "innerHTML", capText);
      domClass[capText ? "remove" : "add"](this._mediaCaption, "hidden");
      
      domClass[(titleText && capText) ? "remove" : "add"](hzLine, "hidden");
      
      // Forget any previous "require" invocations
      this._rid = null;
      
      if (info.type === "image") {
        this._showImage(info.value);
      }
      else {
        var self = this,
            modules = [
              "dojox/charting/Chart2D",
              "dojox/charting/action2d/Tooltip"
            ], 
            // "value.theme" is not part of webmap popup spec, but we
            // added it so that developers can override default theme
            chartTheme = info.value.theme || this.chartTheme;

        if (lang.isString(chartTheme)) {
          // Convert dots in legacy module names to AMD slashes
          chartTheme = chartTheme.replace(/\./gi, "/");
          
          if (chartTheme.indexOf("/") === -1) {
            // Assume theme name is relative to dojox/charting/themes folder
            chartTheme = "dojox/charting/themes/" + chartTheme;
          }
        }
        
        if (!chartTheme) {
          chartTheme = "../Rainbow";
        }
        
        modules.push(chartTheme);
        
        // Load modules
        try {
          // Generate a unique id for this load activity
          var rid = (this._rid = counter++);
          
          require(modules, function(Chart2D, ChartTooltip, theme) {
            //console.log("loaded...");
            
            // Proceed only if the widget is expecting us.
            // The widget state that triggered this load activity
            // may be obsolete now.
            if (rid === self._rid) {
              self._rid = null;
              self._showChart(info.type, info.value, Chart2D, ChartTooltip, theme);
            }
          });
        }
        catch(err) {
          console.log("PopupRenderer: error loading modules");
        }
      }
    },
    
    _preventNewTab: function(url) {
      // Returns true if the given url uses "mailto" or "tel" protocol.
      // This is to prevent adding blank target to such links, thereby 
      // preventing browsers from opening a blank tab enroute to opening the 
      // appropriate desktop application.
      // Refs:
      // https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/831
      // https://code.google.com/p/chromium/issues/detail?id=144126
      url = url && lang.trim(url).toLowerCase();
      
      return (
        url && 
        (url.indexOf("mailto:") === 0 || url.indexOf("tel:") === 0)
      );
    },
    
    _showImage: function(value) {
      domClass.add(this._mediaFrame, "image");
      
      var galleryHeight = domStyle.get(this._gallery, "height"),
          anchorNode;
      
      // Using DOM API prevents malicious URL from injecting markup 
      // with event listeners.
      if (value.linkURL) {
        anchorNode = domConstruct.create(
          "a", 
          {
            href:   value.linkURL,
            target: this._preventNewTab(value.linkURL) ? "" : "_blank"
          }, 
          this._mediaFrame
        );
      }
  
      domConstruct.create(
        "img", 
        { 
          className: "esri-popup-media-image",
          src: value.sourceURL 
        }, 
        anchorNode || this._mediaFrame
      );
      
      // Reposition image after it loads based on the actual dimension
      var img = dojoNS.query(".esri-popup-media-image", this._mediaFrame)[0],
          self = this, handle;
          
      handle = on(img, "load", function() {
        handle.remove();
        handle = null;
        
        self._imageLoaded(img, galleryHeight);
      });
    },
    
    _showChart: function(type, value, Chart2D, ChartTooltip, theme) {
      domClass.remove(this._mediaFrame, "image");
      
      var chart = this._chart = new Chart2D(domConstruct.create("div", { 
        "class": "chart" 
      }, this._mediaFrame), { 
        margins: { l:4, t:4, r:4, b:4 } 
      });
      
      if (theme) {
        chart.setTheme(theme);
      }

      // TODO
      // A "grid" plot for line, column and bar charts would be
      // useful
      
      switch(type) {
        case "piechart":
          chart.addPlot("default", { type: "Pie", /*font: "14t", fontColor: "white",*/ labels: false });
          chart.addSeries("Series A", value.fields);
          break;
          
        case "linechart":
          chart.addPlot("default", { type: "Markers" });
          chart.addAxis("x", { min: 0, majorTicks: false, minorTicks: false, majorLabels: false, minorLabels: false });
          chart.addAxis("y", { includeZero: true, vertical: true, fixUpper: "minor" });
          array.forEach(value.fields, function(info, idx) {
            info.x = idx + 1;
          });
          chart.addSeries("Series A", value.fields);
          break;

        case "columnchart":
          chart.addPlot("default", { type: "Columns", gap: 3 });
          chart.addAxis("y", { includeZero: true, vertical: true, fixUpper: "minor" });
          chart.addSeries("Series A", value.fields);
          break;
          
        case "barchart":
          chart.addPlot("default", { type: "Bars", gap: 3 });
          chart.addAxis("x", { includeZero: true, fixUpper: "minor", minorLabels: false });
          chart.addAxis("y", { vertical: true, majorTicks: false, minorTicks: false, majorLabels: false, minorLabels: false });
          chart.addSeries("Series A", value.fields);
          break;
      }
      
      this._action = new ChartTooltip(chart);
      // Tooltip action operates on mouseover, let's
      // intercept and use onclick event. Be careful, this will
      // probably not work for other actions
      // Ref:
      // http://dojotoolkit.org/reference-guide/dojox/charting.html
      // http://www.sitepen.com/blog/2008/06/12/dojo-charting-widgets-tooltips-and-legend/
      // TODO
      /*if (esri.isTouchEnabled) {
        this._action.disconnect();
        chart.connectToPlot("default", this, this._processPlotEvent);
      }*/
      
      chart.render();

      //this._legend = new dojox.charting.widget.Legend({chart: chart}, dojo.byId("legendNode"));
    },
    
    /*_processPlotEvent: function(o) {
      if (o.type === "onmouseover") {
        o.shape.rawNode.style.cursor = "pointer";
        return;
      }
      if (o.type === "onclick") {
        o.type = "onmouseover";
      }
      this._action.process(o);
    },*/
    
    _destroyFrame: function() {
      this._rid = null;
      
      if (this._chart) {
        this._chart.destroy();
        this._chart = null;
      }

      // There is a reason for action being destroyed after
      // the chart: chart.destroy seems to fire onplotreset
      // event. I suspect we should let it be processed in our
      // _processPlotEvent
      if (this._action) {
        this._action.destroy();
        this._action = null;
      }
      
      domAttr.set(this._mediaFrame, "innerHTML", "");
    },
    
    _imageLoaded: function(img, galleryHeight) {
      //console.log("Height = ", img.height, ", Expected = ", galleryHeight);
      
      var imgHeight = img.height;
      if (imgHeight < galleryHeight) {
        var diff = Math.round((galleryHeight - imgHeight) / 2);
        domStyle.set(img, "marginTop", diff + "px");
        //console.log("Adjusted margin-top: ", diff);
      }
    },
    
    _attListHandler: function(dfd, attInfos) {
      if (dfd === this._dfd) {
        this._dfd = null;

        /*// For debugging only. Comment this out in
        // production code when checking in to starteam
        if (attInfos instanceof Error) {
          console.log("query attachments ERROR: ", attInfos);
        }*/
        
        var html = "";
        
        if (!(attInfos instanceof Error) && attInfos && attInfos.length) {
          array.forEach(attInfos, function(info) {
            html += ("<li>");
            html += ("<a href='" + urlUtils.addProxy(info.url) + "' target='_blank'>" + (info.name || "[No name]") + "</a>");
            html += ("</li>");
          });
        }
        
        // TODO
        // Can we store this result in a cache? But when will the 
        // cache entries be invalidated or removed? This is tricky.
        // Policy could be:
        // - clear cache when the number of entries has reached a preset limit
        // - remove the entry for a feature if the user has edited the
        //   attachments while in "Edit" mode
        // - associate timestamps with each entry and clear them after they
        //   attain certain age.
        // I think we need a global resource cache of some sort that the viewer
        // can manage
        
        domAttr.set(this._attachmentsList, "innerHTML", html || "<li>" + this._nls.NLS_noAttach + "</li>");
      }
    }, 
      
    _handleComponentsSuccess:  function(components) {
      if(components) {
        var titleText = this.showTitle ? components.title : "",
            descText = components.description,
            fields = components.fields,
            mediaInfos = components.mediaInfos,
            domNode = this.domNode,
            nls = this._nls, 
            self = this,
            template = this.template,
            graphic = this.graphic; //, tableView;
        
        this._prevMedia.title = nls.NLS_prevMedia;
        this._nextMedia.title = nls.NLS_nextMedia;

        // Main Section: title
        domAttr.set(this._title, "innerHTML", titleText);

        if (!titleText) {
          domClass.add(this._title, "hidden");
        }

        // Main Section: description
        if (!descText && fields) {
          descText = "";

          array.forEach(fields, function(row) {
            descText += ("<tr valign='top'>");
            descText += ("<td class='attr-name'>" + htmlEntities.encode(row[0]) + "</td>");

            // Note: convert attribute field values that just contain URLs 
            // into clickable links
            descText += ("<td class='attr-value'>" +
                        row[1].replace(/^\s*(https?:\/\/[^\s]+)\s*$/i, "<a target='_blank' href='$1' title='$1'>" + nls.NLS_moreInfo + "</a>") + 
                        "</td>");
            descText += ("</tr>");
          });

          if (descText) {
            //tableView = 1;
            descText = "<table class='attr-table' cellpadding='0px' cellspacing='0px'>" + descText + "</table>";
          }
        }

        domAttr.set(this._description, "innerHTML", descText);

        if (!descText) {
          domClass.add(this._description, "hidden");
        }

        // Make links open in a new tab/window
        dojoNS.query("a", this._description).forEach(function(node) {
          //console.log("Link: ", node.target, node.href);
          
          // Do not add blank target in some cases.
          // Remove if link already has blank target.
          if (self._preventNewTab(node.href)) {
            if (node.target === "_blank") {
              domAttr.remove(node, "target");
            }
          }
          else {
            domAttr.set(node, "target", "_blank");
          }
        });

        if (titleText && descText) {
          dojoNS.query(".main-section .hz-line", domNode).removeClass("hidden");
        }
        else {
          if (titleText || descText) {
            dojoNS.query(".main-section .hz-line", domNode).addClass("hidden");
          }
          else {
            dojoNS.query(".main-section", domNode).addClass("hidden");
          }
        }

        // Attachments Section
        var dfd = (this._dfd = template.getAttachments(graphic));
        if (dfd) {
          dfd.always(lang.hitch(this, this._attListHandler, dfd));

          domAttr.set(this._attachmentsList, "innerHTML", "<li>" + nls.NLS_searching + "...</li>");
          dojoNS.query(".attachments-section", domNode).removeClass("hidden");
        }

        // Media Section
        if (mediaInfos && mediaInfos.length) {
          dojoNS.query(".media-section", domNode).removeClass("hidden");
          dom.setSelectable(this._mediaFrame, false);

          this._mediaInfos = mediaInfos;
          this._mediaPtr = 0;
          this._updateUI();
          this._displayMedia();
        }

        // Edit summary
        if (components.editSummary /*&& !tableView*/) {
          domAttr.set(this._editSummary, "innerHTML", components.editSummary);

          // We need this due to the manner in which the attachments section
          // is rendered (i.e. floating media info elements)
          if (mediaInfos && mediaInfos.length) {
            domClass.remove(this._mediaBreak, "hidden");
          }

          domClass.remove(this._editSummarySection, "hidden");
        }
      }
    },
    
    _handleComponentsError: function(error){
      console.log("PopupRenderer: error loading template", error);
    }
      
  });

  return PR;
});
