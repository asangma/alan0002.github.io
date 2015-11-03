define([
  "require",

  "../Widget",

  "../../core/declare",
  "../../core/lang",
  "../../core/urlUtils",

  "dojo/_base/lang",
  "dojo/_base/array",

  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/on",
  "dojo/Deferred",
  "dojo/query",
  "dojo/sniff",
  "dojo/promise/all",

  "dojox/html/entities",

  "dijit/_TemplatedMixin",
  "dijit/a11yclick",

  "dojo/i18n!../../nls/jsapi",

  "dojo/text!./templates/PopupRenderer.html",

  "../../request",
  "../../tasks/support/Query",
  "../../tasks/QueryTask",
  "../../tasks/support/StatisticDefinition",

  "dojo/i18n!dojo/cldr/nls/number"
], function (
  require,
  Widget,
  declare, esriLang, urlUtils,
  lang, array,
  domAttr, domClass, domConstruct, on, Deferred, query, sniff, all,
  htmlEntities,
  _TemplatedMixin, a11yclick,
  i18n,
  dijitTemplate,
  esriRequest,
  Query, QueryTask, StatisticDefinition,
  nlsNumber
) {

  // todo (dris0000): Media design.
  // todo (dris0000): attachments design.
  // todo (dris0000): related features design.

  var css = {
    root: "esri-popup-renderer",
    container: "esri-popup-renderer-container",
    main: "esri-popup-renderer-main",
    title: "esri-popup-renderer-title",
    description: "esri-popup-renderer-description",
    attachments: "esri-popup-renderer-attachments",
    attachmentsTitle: "esri-popup-renderer-attachments-title",
    media: "esri-popup-renderer-media",
    mediaTitle: "esri-popup-renderer-media-title",
    mediaSummary: "esri-popup-renderer-media-summary",
    mediaCount: "esri-popup-renderer-media-count",
    mediaImageSummary: "esri-popup-renderer-media-image-summary",
    mediaImageIcon: "esri-popup-renderer-media-image-icon esri-icon-media",
    mediaChartSummary: "esri-popup-renderer-media-chart-summary",
    mediaChartIcon: "esri-popup-renderer-MediaChartIcon esri-icon-chart",
    mediaSlider: "esri-popup-renderer-media-slider",
    mediaSliderItems: "esri-popup-renderer-media-slider-items",
    mediaSliderItem: "esri-popup-renderer-media-slider-item",
    mediaFrame: "esri-popup-renderer-media-frame",
    edit: "esri-popup-renderer-edit",
    editSummary: "esri-popup-renderer-summary",
    showTitle: "esri-popup-renderer-show-title",
    showAttachments: "esri-popup-renderer-show-attachments",
    showMedia: "esri-popup-renderer-show-media",
    showEdit: "esri-popup-renderer-show-edit",
    numericValue: "esri-numeric-value",
    chart: "esri-chart",
    clearFix: "esri-clearfix"
  };

  var dateFormats = {
    "shortDate": "(datePattern: 'M/d/y', selector: 'date')",
    "shortDateLE": "(datePattern: 'd/M/y', selector: 'date')",
    "longMonthDayYear": "(datePattern: 'MMMM d, y', selector: 'date')",
    "dayShortMonthYear": "(datePattern: 'd MMM y', selector: 'date')",
    "longDate": "(datePattern: 'EEEE, MMMM d, y', selector: 'date')",
    "shortDateShortTime": "(datePattern: 'M/d/y', timePattern: 'h:mm a', selector: 'date and time')",
    "shortDateLEShortTime": "(datePattern: 'd/M/y', timePattern: 'h:mm a', selector: 'date and time')",
    "shortDateShortTime24": "(datePattern: 'M/d/y', timePattern: 'H:mm', selector: 'date and time')",
    "shortDateLEShortTime24": "(datePattern: 'd/M/y', timePattern: 'H:mm', selector: 'date and time')",
    "shortDateLongTime": "(datePattern: 'M/d/y', timePattern: 'h:mm:ss a', selector: 'date and time')",
    "shortDateLELongTime": "(datePattern: 'd/M/y', timePattern: 'h:mm:ss a', selector: 'date and time')",
    "shortDateLongTime24": "(datePattern: 'M/d/y', timePattern: 'H:mm:ss', selector: 'date and time')",
    "shortDateLELongTime24": "(datePattern: 'd/M/y', timePattern: 'H:mm:ss', selector: 'date and time')",
    "longMonthYear": "(datePattern: 'MMMM y', selector: 'date')",
    "shortMonthYear": "(datePattern: 'MMM y', selector: 'date')",
    "year": "(datePattern: 'y', selector: 'date')"
  };

  var counter = 0;

  var PopupRenderer = declare([Widget, _TemplatedMixin], {

    declaredClass: "esri.widgets.Popup.PopupRenderer",

    templateString: dijitTemplate,

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function () {
      this._charts = [];
    },

    postCreate: function () {
      this.inherited(arguments);
      var _self = this;
      this.own(on(this._mediaSliderItems, on.selector("[" + this._mediaIndexDataAttr + "]", a11yclick), function () {
        _self._openMediaItem(this);
      }));
    },

    destroy: function () {
      if (this._dfd) {
        this._dfd.cancel();
      }
      this._destroyCharts();
      this.graphic = this._i18n = this._mediaInfos = this._dfd = null;
      this.inherited(arguments);
    },

    startup: function () {
      this.inherited(arguments);
      this.emit("load");
      this.set("loaded", true);
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _i18n: i18n.widgets.popupRenderer,

    // Regular expression that matches "href" attributes of hyperlinks
    _reHref: /href\s*=\s*\"([^\"]+)\"/ig,

    // Same as _reHref but with single quotes around href value 
    // (instead of double quotes).
    _reHrefApos: /href\s*=\s*\'([^\']+)\'/ig,

    _relatedFieldPrefix: "relationships/",

    _mediaIndexDataAttr: "data-media-index",

    // See: http://en.wikipedia.org/wiki/Date_format_by_country
    _dateFormats: dateFormats,

    css: css,

    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  graphic
    //----------------------------------
    graphic: null,

    _setGraphicAttr: function (newVal) {
      this._destroyCharts();
      this._set("graphic", newVal);
      this.set("title", this._getTitle());
      this.getComponents().then(
        this._handleComponentsSuccess.bind(this),
        this._handleComponentsError.bind(this)
      );
    },

    //----------------------------------
    //  showTitle
    //----------------------------------
    showTitle: true,

    _setShowTitleAttr: function (newVal) {
      this._set("showTitle", newVal);
      this._render();
    },

    //----------------------------------
    //  showContent
    //----------------------------------
    showContent: true,

    _setShowContentAttr: function (newVal) {
      this._set("showContent", newVal);
      this.getComponents();
    },

    //----------------------------------
    //  showAttachments
    //----------------------------------
    showAttachments: true,

    _setShowAttachmentsAttr: function (newVal) {
      this._set("showAttachments", newVal);
      this._render();
    },

    //----------------------------------
    //  showMedia
    //----------------------------------
    showMedia: true,

    _setShowMediaAttr: function (newVal) {
      this._set("showMedia", newVal);
      this._render();
    },


    //----------------------------------
    //  showRelatedRecords
    //----------------------------------
    showRelatedRecords: true,

    _setShowRelatedRecordsAttr: function (newVal) {
      this._set("showRelatedRecords", newVal);
      this.getComponents();
    },

    //----------------------------------
    //  title
    //----------------------------------
    title: "", // readonly

    //----------------------------------
    //  content
    //----------------------------------
    content: null, // readonly

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    getComponents: function () {
      var graphic = this.graphic;
      var template = graphic.getEffectivePopupTemplate();
      /**
       * 1. create deferred for getComponents method
       * 2. read to see popupInfo has related records (by looking into realtionid/fieldName in fieldInfos)
       * 3. if yes , send related records requests
       * 4. or else, call format fill in values , move this to method
       * 5. when responses of 2 comes back do 3
       * 6. resolve the deferred for getComponents method
       */
      var
      //Step 1: create a deferred
        def = new Deferred(),
        rdef,
        relatedFieldsInfo;

      if (this.showRelatedRecords) {
        //step 2: check if related queries need to be sent
        if (template && template.fieldInfos) {
          relatedFieldsInfo = array.filter(template.fieldInfos, function (fieldInfo) {
            return fieldInfo.fieldName.indexOf(this._relatedFieldPrefix) !== -1;
          }, this);
        }
        //step 3
        if (relatedFieldsInfo && relatedFieldsInfo.length > 0) {
          rdef = this._getRelatedRecords({
            graphic: graphic,
            fieldsInfo: relatedFieldsInfo
          });
        }
      }

      if (this.showContent) {
        //step 4, 5, 6
        if (rdef) {
          rdef.always(
            function () {
              def.resolve(this._getPopupValues());
            }
          );
        } else {
          def.resolve(this._getPopupValues());
        }
      } else {
        def.resolve();
      }
      return def.promise;
    },

    getAttachments: function () {
      var graphic = this.graphic;
      var template = graphic.getEffectivePopupTemplate();
      var layer = graphic.layer,
        attributes = graphic.attributes;
      if (this.showAttachments && template.showAttachments &&  layer && layer.hasAttachments && layer.objectIdField) {
        var oid = attributes && attributes[layer.objectIdField];
        if (oid) {
          return this._queryAttachmentInfos(layer, oid);
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _queryAttachmentInfos: function (layer, objectId) {
      var url = layer.url + "/" + objectId + "/attachments";
      var token = layer.token || "";
      return esriRequest({
        url: url,
        content: {
          f: "json",
          token: token
        },
        load: function (response) {
          var infos = response.attachmentInfos;
          array.forEach(infos, function (info) {
            info.url = url + "/" + info.id + "?token=" + token;
            info.objectId = objectId;
          });
        }.bind(this),
        callbackParamName: "callback"
      });
    },

    _openMediaItem: function (e) {
      var idx = domAttr.get(e, this._mediaIndexDataAttr);
      if (idx) {
        idx = parseInt(idx, 10);
        //var info = this._mediaInfos[idx];
      }
    },

    _updateUI: function () {
      var numImages = 0,
        numCharts = 0;
      // empty media slider items
      domAttr.set(this._mediaSliderItems, "innerHTML", "");
      var infos = this._mediaInfos;
      if (infos) {
        infos.forEach(function (info, i) {
          var value = info.value;
          var itemAttr = {
            className: this.css.mediaSliderItem
          };
          itemAttr[this._mediaIndexDataAttr] = i;
          var item = domConstruct.create("div", itemAttr, this._mediaSliderItems);
          if (info.type === "image") {
            var anchorNode;
            // Using DOM API prevents malicious URL from injecting markup 
            // with event listeners.
            if (value.linkURL) {
              anchorNode = domConstruct.create(
                "a", {
                  href: value.linkURL,
                  target: this._preventNewTab(value.linkURL) ? "" : "_blank"
                },
                item
              );
            }
            domConstruct.create(
              "img", {
                alt: "",
                src: value.sourceURL
              },
              anchorNode || item
            );
            numImages++;
          } else if (info.type.indexOf("chart") !== -1) {
            var chartDiv = domConstruct.create("div", {}, item);
            // Forget any previous "require" invocations
            this._rid = null;
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
              chartTheme = "dojox/charting/themes/Claro";
            }
            modules.push(chartTheme);
            // Load modules
            try {
              // Generate a unique id for this load activity
              var rid = (this._rid = counter++);
              require(modules, function (Chart2D, ChartTooltip, theme) {
                // Proceed only if the widget is expecting us.
                // The widget state that triggered this load activity
                // may be obsolete now.
                if (rid === self._rid) {
                  self._rid = null;
                  self._showChart(chartDiv, info.type, info.value, Chart2D, ChartTooltip, theme);
                }
              });
            } catch (err) {
              console.log(this.declaredClass + "::error loading modules");
            }
            numCharts++;
          }
          domConstruct.create("figcaption", {
            textContent: info.title
          }, item);
        }.bind(this));
      }
      domAttr.set(this._imageCount, "innerHTML", "(" + numImages + ")");
      domAttr.set(this._chartCount, "innerHTML", "(" + numCharts + ")");
    },

    _preventNewTab: function (url) {
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

    _showChart: function (chartDiv, type, value, Chart2D, ChartTooltip, theme) {
      var chart = new Chart2D(domConstruct.create("div", {
        "class": this.css.chart
      }, chartDiv), {
        margins: {
          l: 4,
          t: 4,
          r: 4,
          b: 4
        }
      });
      if (theme) {
        chart.setTheme(theme);
      }
      switch (type) {
      case "piechart":
        chart.addPlot("default", {
          type: "Pie",
          /*font: "14t", fontColor: "white",*/
          labels: false
        });
        chart.addSeries("Series A", value.fields);
        break;
      case "linechart":
        chart.addPlot("default", {
          type: "Markers"
        });
        chart.addAxis("x", {
          min: 0,
          majorTicks: false,
          minorTicks: false,
          majorLabels: false,
          minorLabels: false
        });
        chart.addAxis("y", {
          includeZero: true,
          vertical: true,
          fixUpper: "minor"
        });
        array.forEach(value.fields, function (info, idx) {
          info.x = idx + 1;
        });
        chart.addSeries("Series A", value.fields);
        break;
      case "columnchart":
        chart.addPlot("default", {
          type: "Columns",
          gap: 3
        });
        chart.addAxis("y", {
          includeZero: true,
          vertical: true,
          fixUpper: "minor"
        });
        chart.addSeries("Series A", value.fields);
        break;
      case "barchart":
        chart.addPlot("default", {
          type: "Bars",
          gap: 3
        });
        chart.addAxis("x", {
          includeZero: true,
          fixUpper: "minor",
          minorLabels: false
        });
        chart.addAxis("y", {
          vertical: true,
          majorTicks: false,
          minorTicks: false,
          majorLabels: false,
          minorLabels: false
        });
        chart.addSeries("Series A", value.fields);
        break;
      }
      var chartTooltip = new ChartTooltip(chart);
      chart.render();
      this._charts.push(chart);
      this._charts.push(chartTooltip);
    },

    _destroyCharts: function () {
      this._rid = null;
      if (this._charts && this._charts.length) {
        for (var i = 0; i < this._charts.length; i++) {
          this._charts[i].destroy();
        }
      }
      this._charts.length = 0;
    },

    _attListHandler: function (dfd, attInfos) {
      if (dfd === this._dfd) {
        this._dfd = null;
        var html = "";
        if (!(attInfos instanceof Error) && attInfos.attachmentInfos && attInfos.attachmentInfos.length) {
          array.forEach(attInfos.attachmentInfos, function (info) {
            html += ("<li>");
            html += ("<a href=\"" + urlUtils.addProxy(info.url) + "\" target=\"_blank\"><span class=\"esri-icon-download\"></span> " + (info.name || "[No name]") + "</a>");
            html += ("</li>");
          });
        }
        domAttr.set(this._attachmentsList, "innerHTML", html || "<li>" + this._i18n.noAttach + "</li>");
      }
    },

    _render: function () {
      var components = this._components;
      if (components) {
        var titleText = this.showTitle ? components.title : "",
          descText = components.description,
          //fields = components.fields,
          mediaInfos = components.mediaInfos,
          self = this;
        // Main Section: title
        domAttr.set(this._title, "innerHTML", titleText);
        if (titleText) {
          domClass.add(this._container, this.css.showTitle);
        }
        /*
        // Main Section: description
        if (!descText && fields) {
          descText = "";
          if (fields.length) {
            descText = "<table><tbody>";
          }
          array.forEach(fields, function (row) {
            descText += ("<tr>");
            descText += ("<th>" + htmlEntities.encode(row[0]) + "</th>");
            // Convert attribute field values that just contain URLs into clickable links
            descText += ("<td>" +
              row[1].replace(/^\s*(https?:\/\/[^\s]+)\s*$/i, "<a target=\"_blank\" href=\"$1\" title=\"$1\">" + this._i18n.moreInfo + "</a>") +
              "</td>");
            descText += ("</tr>");
          }.bind(this));
          if (fields.length) {
            //tableView = 1;
            descText += "</tbody></table>";
          }
        }
        */
        domAttr.set(this._description, "innerHTML", descText);
        // Make links open in a new tab/window
        query("a", this._description).forEach(function (node) {
          // Do not add blank target in some cases.
          // Remove if link already has blank target.
          if (self._preventNewTab(node.href)) {
            if (node.target === "_blank") {
              domAttr.remove(node, "target");
            }
          } else {
            domAttr.set(node, "target", "_blank");
          }
        });
        // Attachments Section
        // todo (dris0000): loading spinner for attachments
        domClass.remove(this._container, this.css.showAttachments);
        domAttr.set(this._attachmentsList, "innerHTML", "");
        var dfd = (this._dfd = this.getAttachments());
        if (dfd) {
          dfd.always(this._attListHandler.bind(this, dfd));
          domAttr.set(this._attachmentsList, "innerHTML", "<li>" + this._i18n.searching + "&hellip;</li>");
          domClass.add(this._container, this.css.showAttachments);
        }
        // Media Section
        this._mediaInfos = null;
        domClass.remove(this._container, this.css.showMedia);
        if (this.showMedia && mediaInfos && mediaInfos.length) {
          domClass.add(this._container, this.css.showMedia);
          this._mediaInfos = mediaInfos;
        }
        // Edit summary
        domClass.remove(this._container, this.css.showEdit);
        domAttr.set(this._editSummary, "innerHTML", "");
        if (components.editSummary /*&& !tableView*/ ) {
          domAttr.set(this._editSummary, "innerHTML", components.editSummary);
          domClass.add(this._container, this.css.showEdit);
        }
        this._updateUI();
        if (descText) {
          this.set("content", this.domNode);
        } else {
          this.set("content", null);
        }
      }
    },

    _handleComponentsSuccess: function (components) {
      this._components = components;
      this._render();
    },

    _handleComponentsError: function (error) {
      console.log(this.declaredClass + "::error loading template", error);
      this.set("content", null);
    },

    _getTitle: function () {
      var retVal = "";
      if (this.graphic) {
        retVal = this._getPopupValues(true).title;
      }
      return retVal;
    },

    _relatedFeaturesAttributes: function (rInfo, attributes, formatted, relFeature) {
      for (var key in relFeature.attributes) {
        if (relFeature.attributes.hasOwnProperty(key)) {
          if (rInfo.relation.cardinality === "esriRelCardinalityOneToOne") {
            var rName = this._toRelatedFieldName([rInfo.relation.id, key]);
            attributes[rName] = formatted[rName] = relFeature.attributes[key];
          }
        }
      }
    },

    _relatedStatsAttributes: function (rInfo, attributes, formatted, relStatsFeature) {
      for (var key in relStatsFeature.attributes) {
        if (relStatsFeature.attributes.hasOwnProperty(key)) {
          var rName = this._toRelatedFieldName([rInfo.relation.id, key]);
          attributes[rName] = formatted[rName] = relStatsFeature.attributes[key];
        }
      }
    },

    _getPopupValues: function (returnTitleOnly) {
      var
        graphic = this.graphic,
        template = graphic.getEffectivePopupTemplate(),
        layer = graphic.layer,
        attributes = lang.clone(graphic.attributes) || {},
        formatted = lang.clone(attributes),
        fieldInfos = template && template.fieldInfos,
        mediaInfos = template && template.mediaInfos,
        titleText = "",
        descText = "",
        tableView, fieldName, value,
        rid,
        properties = layer && layer._getDateOpts && layer._getDateOpts().properties,
        substOptions = {
          // FeatureLayer::_getDateOpts caches result, but we're going to
          // add "formatter" to it. So, lets create a new object
          dateFormat: {
            properties: properties,
            formatter: "DateFormat" + this._insertOffset(this._dateFormats.shortDateShortTime)
          }
        };
      if (this._relatedInfo) {
        for (rid in this._relatedInfo) {
          if (this._relatedInfo.hasOwnProperty(rid)) {
            var rRecord = this._relatedInfo[rid],
              rInfo = this._relatedLayersInfo[rid];
            if (rRecord) {
              array.forEach(rRecord.relatedFeatures, this._relatedFeaturesAttributes.bind(this, rInfo, attributes, formatted));
              /*array.forEach(rRecord.relatedFeatures, function (relFeature) {
                this._relatedFeaturesAttributes(rInfo, attributes, formatted, relFeature);
              }, this);
              */
              //to support multiple stats
              array.forEach(rRecord.relatedStatsFeatures, this._relatedStatsAttributes.bind(this, rInfo, attributes, formatted));
              /*
              array.forEach(rRecord.relatedStatsFeatures, function (relStatsFeature) {
                this._relatedStatsAttributes(rInfo, attributes, formatted, relStatsFeature);
              }, this);
              */
            }
          }
        }
      }
      if (fieldInfos) {
        // Format values as per fieldInfos and keep them handy
        array.forEach(fieldInfos, function (fieldInfo) {
          fieldName = fieldInfo.fieldName;
          // Modify fieldName to match casing of field names in 
          // layer.fields.
          var lyrFieldInfo = this._getLayerFieldInfo(layer, fieldName);
          if (lyrFieldInfo) {
            fieldName = fieldInfo.fieldName = lyrFieldInfo.name;
          }
          var val = formatted[fieldName];
          // todo (unknown): substOptions should contain info about date fields in related layer as well. 
          formatted[fieldName] = this._formatValue(val, fieldName, substOptions);
          // Let's not format this field twice, so remove it from the generic
          // "properties" list
          if (properties && fieldInfo.format && fieldInfo.format.dateFormat) {
            var pos = array.indexOf(properties, fieldName);
            if (pos > -1) {
              properties.splice(pos, 1);
            }
          }
        }, this);
      }
      // todo (unknown): Need to do domain/type extraction for related layer fields as well.
      if (layer) {
        var types = layer.types,
          typeField = layer.typeIdField,
          typeId = typeField && attributes[typeField];
        for (fieldName in attributes) {
          if (
            attributes.hasOwnProperty(fieldName) &&
            // todo (unknown): For related fields we need to use the related layer to find 
            // domain/type name.
            fieldName.indexOf(this._relatedFieldPrefix) === -1
          ) {
            value = attributes[fieldName];
            if (esriLang.isDefined(value)) {
              var domainName = this._getDomainName(layer, graphic, types, typeId, fieldName, value);
              if (esriLang.isDefined(domainName)) {
                formatted[fieldName] = domainName;
              } else if (fieldName === typeField) {
                var typeName = this._getTypeName(layer, graphic, value);
                if (esriLang.isDefined(typeName)) {
                  formatted[fieldName] = typeName;
                }
              }
            }
          }
        } // loop
      }
      // Main Section: title
      if (template && template.title) {
        var titleHasRelatedFields = !!(
          template.title &&
          template.title.indexOf("{" + this._relatedFieldPrefix) !== -1
        );
        if (!titleHasRelatedFields) {
          // Substitute un-formatted values for fields used in link URLs.
          titleText = this._processFieldsInLinks(this._fixTokens(template.title, layer), attributes);
          titleText = lang.trim(esriLang.substitute(formatted, titleText, substOptions) || "");
        }
      }
      // This option used by PopupTemplate.getTitle
      if (returnTitleOnly) {
        return {
          title: titleText
        };
      }
      // Main Section: description
      if (template && template.content) {
        // Substitute un-formatted values for fields used in link URLs.
        descText = this._processFieldsInLinks(this._fixTokens(template.content, layer), attributes);

        descText = lang.trim(esriLang.substitute(formatted, descText, substOptions) || "");
      }
      if (fieldInfos) {
        tableView = [];
        array.forEach(fieldInfos, function (fieldInfo) {
          fieldName = fieldInfo.fieldName;
          if (fieldName && fieldInfo.visible) {
            tableView.push([
              // Field Name:
              fieldInfo.label || fieldName,
              // Field Value:
              esriLang.substitute(formatted, "${" + fieldName + "}", substOptions) || ""
            ]);
          }
        });
      }
      // Filter out mediaInfos for which one of the following is true:
      // image:
      //  - no sourceURL (invalid mediaInfo)
      //  - feature does not have a value for sourceURL field
      // chart:
      //  - type not one of pie, line, column, bar
      //  - feature does not have values for any of the fields
      var filteredMedia, valid;
      if (mediaInfos) {
        filteredMedia = [];
        array.forEach(mediaInfos, function (minfo) {
          valid = 0;
          value = minfo.value;
          switch (minfo.type) {
          case "image":
            var url = value.sourceURL;
            url = url && lang.trim(esriLang.substitute(attributes, this._fixTokens(url, layer)));
            valid = !!url;
            break;
          case "piechart":
          case "linechart":
          case "columnchart":
          case "barchart":
            var lyrFieldInfo, normField = value.normalizeField;
            // Modify "fields" and "normalizaField" to match casing of field 
            // names in layer.fields.
            value.fields = array.map(value.fields, function (field) {
              lyrFieldInfo = this._getLayerFieldInfo(layer, field);
              return lyrFieldInfo ? lyrFieldInfo.name : field;
            }, this);
            if (normField) {
              lyrFieldInfo = this._getLayerFieldInfo(layer, normField);
              value.normalizeField = lyrFieldInfo ? lyrFieldInfo.name : normField;
            }
            valid = array.some(value.fields, function (field) {
              return (
                esriLang.isDefined(attributes[field]) ||
                (field.indexOf(this._relatedFieldPrefix) !== -1 && this._relatedInfo)
              );
            }, this);
            break;
          default:
            return;
          }
          if (valid) {
            // Clone media info, make substitutions and push into the 
            // outgoing array
            minfo = lang.clone(minfo);
            value = minfo.value;
            // Substitute un-formatted values for fields used in link URLs.
            var mTitle = minfo.title ? this._processFieldsInLinks(this._fixTokens(minfo.title, layer), attributes) : "",
              mCaption = minfo.caption ? this._processFieldsInLinks(this._fixTokens(minfo.caption, layer), attributes) : "";
            minfo.title = mTitle ? lang.trim(esriLang.substitute(formatted, mTitle, substOptions) || "") : "";
            minfo.caption = mCaption ? lang.trim(esriLang.substitute(formatted, mCaption, substOptions) || "") : "";
            if (minfo.type === "image") {
              value.sourceURL = esriLang.substitute(attributes, this._fixTokens(value.sourceURL, layer));
              if (value.linkURL) {
                value.linkURL = lang.trim(esriLang.substitute(attributes, this._fixTokens(value.linkURL, layer)) || "");
              }
            } else { // chart
              var normalizer, fields;
              array.forEach(value.fields, function (fieldName, index) {
                if (fieldName.indexOf(this._relatedFieldPrefix) !== -1) {
                  fields = this._getRelatedChartInfos(fieldName, value, attributes, substOptions);
                  if (fields instanceof Array) {
                    value.fields = fields;
                  } else {
                    value.fields[index] = fields;
                  }
                } else {
                  var data = attributes[fieldName];
                  // note (unknown): Not clear why charting code does not equate undefined values to null
                  data = (data === undefined) ? null : data;
                  normalizer = attributes[value.normalizeField] || 0;
                  if (data && normalizer) {
                    data = data / normalizer;
                  }
                  value.fields[index] = {
                    y: data,

                    // We don't want to format the number of "places" in data if  
                    // we have a normalizer. For example if data=160, normalizer=1536
                    // and fieldFormat.places=0, the tooltip will essentially show 
                    // 0 as the data value which is not desirable
                    tooltip: (template._fieldLabels[fieldName.toLowerCase()] || fieldName) + ":<br/>" +
                      this._formatValue(data, fieldName, substOptions, !!normalizer)
                  };
                }
              }, this);
            }
            filteredMedia.push(minfo);
          }
        }, this);
      }
      return {
        title: titleText,
        description: descText,
        fields: (tableView && tableView.length) ? tableView : null,
        mediaInfos: (filteredMedia && filteredMedia.length) ? filteredMedia : null,
        formatted: formatted,
        editSummary: (layer && layer.getEditSummary) ? layer.getEditSummary(graphic) : ""
      };
    },

    _getRelatedChartInfos: function (fieldName, value, attributes, substOptions) {
      //attributes are the current graphic attributes 
      var fields, rRecord, fInfos, normalizer, data, rid, rInfo, fieldNameArr;
      var graphic = this.graphic;
      var template = graphic.getEffectivePopupTemplate();
      fields = [];
      fieldNameArr = this._fromRelatedFieldName(fieldName);
      rid = fieldNameArr[0];
      rRecord = this._relatedInfo[rid];
      rInfo = this._relatedLayersInfo[rid];
      if (rRecord) {
        array.forEach(rRecord.relatedFeatures, function (feature) {
          var atrObj = feature.attributes,
            obj, key;
          for (key in atrObj) {
            if (atrObj.hasOwnProperty(key)) {
              if (key === fieldNameArr[1]) {
                obj = {};
                data = atrObj[key];
                if (value.normalizeField) {
                  if (value.normalizeField.indexOf(this._relatedFieldPrefix) !== -1) {
                    normalizer = atrObj[this._fromRelatedFieldName(value.normalizeField)[1]];
                  } else {
                    normalizer = attributes[value.normalizeField];
                  }
                }
                if (data && normalizer) {
                  data = data / normalizer;
                }
                //tooltip
                if (value.tooltipField) {
                  if (value.tooltipField.indexOf(this._relatedFieldPrefix) !== -1) {
                    // tooltipField is also related record
                    var tooltipName = this._fromRelatedFieldName(value.tooltipField)[1];
                    obj.tooltip = atrObj[tooltipName] + ":<br/>" +
                      this._formatValue(data, atrObj[tooltipName], substOptions, !!normalizer);
                  } else {
                    obj.tooltip = (template._fieldLabels[fieldName.toLowerCase()] || fieldName) + ":<br/>" + this._formatValue(data, value.tooltipField, substOptions, !!normalizer);
                  }
                } else {
                  //related label is default tooltip when nothing is specified
                  obj.tooltip = data;
                }
                obj.y = data;
                fields.push(obj);
              } // if for key is in the field.y
            } //if for ownProperty check
          } // for
        }, this);
      }
      //spec change needed
      if (rInfo.relation.cardinality === "esriRelCardinalityOneToMany" || rInfo.relation.cardinality === "esriRelCardinalityManyToMany") {
        fInfos = fields;
      } else {
        fInfos = fields[0];
      }
      return fInfos;
    },

    _fixTokens: function (template, layer) {
      // Replace {xyz} with ${xyz}
      var self = this;
      // Note (unknown): existing ${xyz} are retained. 
      // Update: We may not be able to support this case because a 
      // arcgis.com user might enter a monetary value like this: 
      // ${AMOUNT} where expected result is: $10000.
      // This means that a popupInfo constructed in an app built 
      // using the JSAPI cannot use the ${TOKEN} format either as it
      // gets ambiguous
      //return template.replace(/\$?(\{[^\{\r\n]+\})/g, "$$$1");
      return template.replace(/(\{([^\{\r\n]+)\})/g, function () {
        var token = arguments[1];
        var fieldName = arguments[2];
        var fieldInfo = self._getLayerFieldInfo(layer, fieldName);
        // Use field name as defined in layer.fields in case 
        // field names used for popupInfo differ in casing. 
        return "$" + (fieldInfo ? ("{" + fieldInfo.name + "}") : token);
      });
    },

    _encodeAttributes: function (attributes) {
      // Clone given attributes and apply URL encoding and replace 
      // single quotes with its corresponsing HTML entity name.
      // Replacing single quotes with &apos; prevents malformed 
      // HTML markup in popup description of the form:
      //  "<a href='http://www.vresorts.com/FTBeta/tripPlanner/tripPlanner.html?ID::{Name}&amp;ADDRESS::{Address}&amp;URL::{URL}' target='_blank'>Add to Trip</a>"
      //  Note (unknown): the single quotes around href value.
      // Note (unknown): that double quotes are properly encoded during the URL encoding phase.
      var encodedAttributes = lang.clone(attributes) || {},
        fieldName, value, encodedValue;
      for (fieldName in encodedAttributes) {
        if (encodedAttributes.hasOwnProperty(fieldName)) {
          value = encodedAttributes[fieldName];
          if (value && typeof value === "string") {
            encodedValue = encodeURIComponent(value)
              .replace(/\'/g, "&apos;");
            encodedAttributes[fieldName] = encodedValue;
          }
        }
      }
      return encodedAttributes;
    },

    _processFieldsInLinks: function (text, attributes) {
      // Replaces field names embedded within strings of the form: href="..." 
      // with the corresponding values.
      // This method expects that tokens in "text" have already been fixed using 
      // _fixTokens.
      var encodedAttributes = this._encodeAttributes(attributes),
        self = this;
      if (text) {
        text = text
          // Process hrefs with value surrounded by double quotes.
          .replace(this._reHref, function (hrefAttr, hrefValue) {
            return self._addValuesToHref(hrefAttr, hrefValue, attributes, encodedAttributes);
          })
          // Process hrefs with value surrounded by single quotes.
          .replace(this._reHrefApos, function (hrefAttr, hrefValue) {
            return self._addValuesToHref(hrefAttr, hrefValue, attributes, encodedAttributes);
          });
      }
      return text;
    },

    _addValuesToHref: function (hrefAttr, hrefValue, attributes, encodedAttributes) {
      // Substitutes field values into href. Field values will be
      // URL encoded in some cases. 
      hrefValue = hrefValue && lang.trim(hrefValue);
      // Is the entire URL provided by a field?
      // The entire URL is provided by a field.
      // Do not use encoded field values.
      // We're adding pieces of the URL from field(s).
      // Use encoded field values.
      return esriLang.substitute((hrefValue ? (hrefValue.indexOf("${") === 0) : false) ? attributes : encodedAttributes, hrefAttr);
    },

    _getLayerFieldInfo: function (layer, fieldName) {
      // Returns an object describing the field, only if the given layer 
      // is a "FeatureLayer". Graphics layers do not have getField method.
      return (layer && layer.getField) ? layer.getField(fieldName) : null;
    },

    _formatValue: function (val, fieldName, substOptions, preventPlacesFmt) {
      var graphic = this.graphic;
      var template = graphic.getEffectivePopupTemplate();
      var fieldInfo = template._fieldsMap[fieldName.toLowerCase()],
        fmt = fieldInfo && fieldInfo.format,
        // Forced LTR Wrap should only be applied to numbers, but NOT to 
        // numbers that represent date.
        // When not forced, minus sign of negative numbers is displayed after 
        // the number - we want to avoid this.
        isNumericField = (
          typeof val === "number" &&
          array.indexOf(substOptions.dateFormat.properties, fieldName) === -1 &&
          (!fmt || !fmt.dateFormat)
        );

      if (!esriLang.isDefined(val) || !fieldInfo ||
        !esriLang.isDefined(fmt)
      ) {
        return isNumericField ? this._forceLTR(val) : val;
      }
      var formatterFunc = "",
        options = [],
        isNumberFormat = fmt.hasOwnProperty("places") || fmt.hasOwnProperty("digitSeparator"),
        digitSep = fmt.hasOwnProperty("digitSeparator") ? fmt.digitSeparator : true;
      if (isNumberFormat) {
        formatterFunc = "NumberFormat";
        // preventPlacesFmt = true indicates that the value is normalized.
        // If so, we will format number of places for the chart tooltip only if 
        // the normalized field info has format.places greater than 0.
        // todo (unknown): Feels like we need to let the popup author decide number of places for normalized data when displayed as chart tooltip
        options.push(
          "places: " +
          (
            (esriLang.isDefined(fmt.places) && (!preventPlacesFmt || fmt.places > 0)) ? Number(fmt.places) : "Infinity"
          )
        );
        if (options.length) {
          formatterFunc += ("(" + options.join(",") + ")");
        }
      } else if (fmt.dateFormat) {
        // guard against unknown format string
        formatterFunc = "DateFormat" + this._insertOffset(
          this._dateFormats[fmt.dateFormat] || this._dateFormats.shortDateShortTime
        );
      } else {
        // unknown format definition
        return isNumericField ? this._forceLTR(val) : val;
      }
      var formattedValue = esriLang.substitute({
          "myKey": val
        },
        "${myKey:" + formatterFunc + "}",
        substOptions
      ) || "";
      // Remove digit separator if not required
      if (isNumberFormat && !digitSep) {
        if (nlsNumber.group) {
          formattedValue = formattedValue.replace(new RegExp("\\" + nlsNumber.group, "g"), "");
        }
      }
      return isNumericField ? this._forceLTR(formattedValue) : formattedValue;
    },

    _forceLTR: function (value) {
      /*
       * We use esriNumericValue class when displaying numeric attribute field
       * values. We can use it to force LTR text direction - regardless of whether
       * the page is in LTR or RTL mode. Even in LTR mode, a number can be surrounded 
       * by English or RTL scripts - but we need the number to be displayed in LTR
       * direction. 
       * When not forced, minus sign of negative numbers is displayed after 
       * the number - we want to avoid this.
       */
      var ieVersion = sniff("ie");
      // We dont want to apply LTR for IE versions 10 or earlier. When applied,
      // IE shows regression in a scenario.
      // https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/517#issuecomment-83181
      // Note (unknown): has(ie) ideally returns undefined starting from IE 11.
      return (ieVersion && ieVersion <= 10) ? value : ("<span class=\"" + this.css.numericValue + "\">" + value + "</span>");
    },

    _insertOffset: function (formatString) {
      if (formatString) {
        // Insert utcOffset into the format string if available
        // See: http://mediawikidev.esri.com/index.php/ArcGIS.com/V1.7spec
        formatString = esriLang.isDefined(this.utcOffset) ?
          formatString.replace(/\)\s*$/, ", utcOffset:" + this.utcOffset + ")") :
          formatString;
      }
      return formatString;
    },

    _getDomainName: function () {
      var layer = arguments[0],
        graphic = arguments[1],
        fieldName = arguments[4],
        value = arguments[5];
      var domain = layer.getDomain && layer.getDomain(fieldName, {
        feature: graphic
      });
      return (domain && domain.codedValues) ? domain.getName(value) : null;
    },

    _getTypeName: function (layer, graphic) {
      var type = layer.getType && layer.getType(graphic);
      return type && type.name;
    },

    _getRelatedRecords: function (params) {
      var graphic = params.graphic,
        def = new Deferred(),
        key;
      if (!this._relatedLayersInfo) {
        this._getRelatedLayersInfo(params).then(function (response) {
          for (key in response) {
            if (response.hasOwnProperty(key)) {
              if (response[key]) {
                this._relatedLayersInfo[key].relatedLayerInfo = response[key];
              }
            }
          }
          //send queries on the relatedlayers for this feature
          this._queryRelatedLayers(graphic).then(function (res) {
            this._setRelatedRecords(graphic, res);
            def.resolve(res);
          }.bind(this), this._handlerErrorResponse.bind(this, def));

        }.bind(this), this._handlerErrorResponse.bind(this, def));
      } else {
        //send queries on the relatedlayers for this feature
        this._queryRelatedLayers(graphic).then(function (res) {
          this._setRelatedRecords(graphic, res);
          def.resolve(res);
        }.bind(this), this._handlerErrorResponse.bind(this, def));
      }
      return def.promise;
    },

    _getRelatedLayersInfo: function (params) {
      // todo (dris0000): loading spinner for related records
      var graphic = params.graphic,
        fieldsInfo = params.fieldsInfo,
        layer, key,
        defList = {};
      layer = graphic.layer;
      if (!this._relatedLayersInfo) {
        this._relatedLayersInfo = {};
      }
      array.forEach(fieldsInfo, function (fInfo) {
        var fieldNameArr, relationId, fieldName, statisticDefinition, matchedReltn;
        fieldNameArr = this._fromRelatedFieldName(fInfo.fieldName);
        relationId = fieldNameArr[0];
        fieldName = fieldNameArr[1];
        if (relationId) {
          if (!this._relatedLayersInfo[relationId]) {
            array.some(layer.relationships, function (rel) {
              if (rel.id == relationId) {
                matchedReltn = rel;
                return true;
              }
            });
            if (matchedReltn) {
              this._relatedLayersInfo[relationId] = {
                relation: matchedReltn,
                relatedFields: [],
                outStatistics: []
              };
            }
          }
          if (this._relatedLayersInfo[relationId]) {
            this._relatedLayersInfo[relationId].relatedFields.push(fieldName);
            if (fInfo.statisticType) {
              statisticDefinition = new StatisticDefinition();
              statisticDefinition.statisticType = fInfo.statisticType;
              statisticDefinition.onStatisticField = fieldName;
              statisticDefinition.outStatisticFieldName = fieldName;
              this._relatedLayersInfo[relationId].outStatistics.push(statisticDefinition);
            }
          }
        }
      }, this);
      //get the layer definition (meta data) about the related layers
      for (key in this._relatedLayersInfo) {
        if (this._relatedLayersInfo.hasOwnProperty(key)) {
          var relation, relatedLayerUrl;
          if (this._relatedLayersInfo[key]) {
            relation = this._relatedLayersInfo[key].relation;
            relatedLayerUrl = (layer.url).replace(/[0-9]+$/, relation.relatedTableId);
            this._relatedLayersInfo[key].relatedLayerUrl = relatedLayerUrl;
            defList[key] = esriRequest({
              url: relatedLayerUrl,
              content: {
                f: "json"
              },
              callbackParamName: "callback"
            });
          }
        }
      }
      return all(defList);
    },

    _queryRelatedLayers: function (graphic) {
      var defList = {},
        key;
      for (key in this._relatedLayersInfo) {
        if (this._relatedLayersInfo.hasOwnProperty(key)) {
          defList[key] = this._queryRelatedLayer({
            graphic: graphic,
            relatedInfo: this._relatedLayersInfo[key]
          });
        }
      }
      return all(defList);
    },

    _queryRelatedLayer: function (params) {
      var graphic, layer, layerPos, destinationRelation, qry, qryTask, whereExp, destKeyFieldType, statsQry, layerInfo, qList, rInfo, relatedLayerUrl, relation;
      graphic = params.graphic;
      layer = graphic.layer;
      layerPos = layer.url.match(/[0-9]+$/g)[0];
      rInfo = params.relatedInfo;
      layerInfo = rInfo.relatedLayerInfo;
      relatedLayerUrl = rInfo.relatedLayerUrl;
      relation = rInfo.relation;
      array.some(layerInfo.relationships, function (destnRelation) {
        if (destnRelation.relatedTableId === parseInt(layerPos, 10)) {
          destinationRelation = destnRelation;
          return true;
        }
      }, this);
      if (destinationRelation) {
        qry = new Query();
        array.some(layerInfo.fields, function (field) {
          if (field.name === destinationRelation.keyField) {
            if (array.indexOf(["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble"], field.type) !== -1) {
              destKeyFieldType = "number";
            } else {
              destKeyFieldType = "string";
            }
            return true;
          }
        });
        if (destKeyFieldType === "string") {
          whereExp = destinationRelation.keyField + "='" + graphic.attributes[relation.keyField] + "'";
        } else {
          whereExp = destinationRelation.keyField + "=" + graphic.attributes[relation.keyField];
        }
        qry.where = whereExp;
        qry.outFields = rInfo.relatedFields; //["*"];
        if (rInfo.outStatistics && rInfo.outStatistics.length > 0 && layerInfo.supportsStatistics) {
          //create new stats query
          statsQry = new Query();
          statsQry.where = qry.where;
          statsQry.outFields = qry.outFields;
          statsQry.outStatistics = rInfo.outStatistics;
        }
        qryTask = new QueryTask(relatedLayerUrl);
        qList = [];
        qList.push(qryTask.execute(qry));
        if (statsQry) {
          qList.push(qryTask.execute(statsQry));
        }
      }
      return all(qList);
    },

    _setRelatedRecords: function () {
      var response = arguments[1];
      /**
        response is a hashtable , key is relationId
        response : {
          relationId: [
            0: queryResponse,
            1: <optional> statsQueryResponse
          ],
          ...
        }
      * @private
      */
      this._relatedInfo = []; // to store related information for the clicked graphic{relation: <relationobj>, feature: <fetaure>, relatedRecords: <relatedRecords>
      var rid;
      for (rid in response) {
        if (response.hasOwnProperty(rid)) {
          if (response[rid]) {
            var resObj = response[rid];
            this._relatedInfo[rid] = {};
            this._relatedInfo[rid].relatedFeatures = resObj[0].features;
            if (esriLang.isDefined(resObj[1])) {
              this._relatedInfo[rid].relatedStatsFeatures = resObj[1].features;
            }
          }
        }
      }
    },

    _handlerErrorResponse: function (def, error) {
      def.reject(error);
    },

    _fromRelatedFieldName: function (fieldName) {
      var fieldNameArr = [],
        temp;
      if (fieldName.indexOf(this._relatedFieldPrefix) !== -1) {
        temp = fieldName.split("/");
        fieldNameArr = temp.slice(1);
      }
      return fieldNameArr;
    },

    _toRelatedFieldName: function (fieldArr) {
      var rName = "";
      if (fieldArr && fieldArr.length > 0) {
        rName = this._relatedFieldPrefix + fieldArr[0] + "/" + fieldArr[1];
      }
      return rName;
    }

  });

  return PopupRenderer;
});