define([
    "../../portal/Portal",
    "../../core/domUtils",
    "../../kernel",
    "../../request",
    "../../symbols/support/jsonUtils",
    "../Widget",
    "../_Tooltip",
    "../editing/TemplatePicker",
    "../support/busyIndicator",

    "./symbolUtil",

    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",

    "dojo/_base/array",
    "../../core/declare",
    "dojo/_base/kernel",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/promise/all",
    "dojo/sniff",
    "dojo/store/Memory",
    "dojo/store/Observable",

    "dojox/gfx",

    "dojo/i18n!../../nls/jsapi",

    "dojo/text!./templates/MarkerSymbolPicker.html",

    "dijit/form/Select"
  ],
  function (
    Portal, domUtils, esriKernel, request, symbolJsonUtils, Widget, TooltipMixin, TemplatePicker, busyIndicator,
    symbolUtil,
    TemplatedMixin, WidgetsInTemplateMixin,
    array, declare, kernel, lang, Deferred, domClass, domConstruct, domStyle, all, has, Memory, Observable,
    gfx,
    nlsJsapi,
    template
  ) {
    var DEFAULT_PORTAL_URL = "http://arcgis.com/";

    var MarkerSymbolPicker = declare("esri.widgets.SymbolStyler.MarkerSymbolPicker",
      [ Widget, TemplatedMixin, WidgetsInTemplateMixin, TooltipMixin ],
      {
        baseClass: "esriMarkerSymbolPicker",

        templateString: template,

        labels: nlsJsapi.widgets.symbolEditor,

        css: {
          noSymbols: "esriNoSymbols",
          defaultSymbols: "esriDefaultSymbols",
          loadingIndicator: "esriLoadingIndicator",
          loading: "esriLoading",
          typeInput: "esriTypeInput",
          container: "esriContainer",
          overlay: "esriOverlay",
          content: "esriContent",
          centerContainer: "esriCenterContainer",
          table: "esriTable",
          tableCell: "esriTableCell",
          centerBlock: "esriCenterBlock"
        },

        portal: DEFAULT_PORTAL_URL,

        displayMode: "portal",

        _symbolTypesStore: null,
        _symbolItemStore: null,

        _noSymbolsOverlay: null,

        _templatePicker: null,

        _portal: null,

        _portalLoadTimeoutInMs: 3000,

        _loadingIndicator: null,

        _storageItemKeyBase: "markerSymbolPicker/symbol",

        _defaultSimpleMarkerSymbols: [
          {
            "name": "Circle",
            "type": "esriSMS",
            "style": "esriSMSCircle",
            "color": [0, 0, 128, 128],
            "size": 18,
            "outline": {
              "color": [0, 0, 128, 255],
              "width": 1
            }
          }, {
            "name": "Square",
            "type": "esriSMS",
            "style": "esriSMSSquare",
            "color": [0, 0, 128, 128],
            "size": 18,
            "outline": {
              "color": [0, 0, 128, 255],
              "width": 1
            }
          }, {
            "name": "Diamond",
            "type": "esriSMS",
            "style": "esriSMSDiamond",
            "color": [0, 0, 128, 128],
            "size": 18,
            "outline": {
              "color": [0, 0, 128, 255],
              "width": 1
            }
          }, {
            "name": "Cross",
            "type": "esriSMS",
            "style": "esriSMSCross",
            "color": [0, 0, 128, 128],
            "size": 18,
            "outline": {
              "color": [0, 0, 128, 255],
              "width": 1
            }
          }, {
            "name": "X",
            "type": "esriSMS",
            "style": "esriSMSX",
            "color": [0, 0, 128, 128],
            "size": 18,
            "outline": {
              "color": [0, 0, 128, 255],
              "width": 1
            }
          }
        ],

        postCreate: function () {
          this.inherited(arguments);

          this._symbolTypesStore = new Observable(new Memory());
          this._symbolItemStore = new Memory();

          this.dap_markerCategoryInput.set({
            labelAttr: "name",
            sortByLabel: false
          });

          this.createTooltip(this.dap_markerCategoryInput, this.labels.selectCategoryTooltip);
        },

        _updateTemplatePickerIfHeightless: function () {
          var height = domStyle.get(this._templatePicker.domNode, "height");

          if (height === 0) {
            this._templatePicker.update();
          }
        },

        startup: function () {
          this.inherited(arguments);

          var templatePicker = new TemplatePicker({
              rows: "auto",
              columns: 6,
              items: [],
              emptyMessage: ""
            },
            this.dap_templatePicker);

          templatePicker.startup();

          this._templatePicker = templatePicker;

          templatePicker.on("selection-change", lang.hitch(this, function () {
            var selectedItem= templatePicker.getSelected(),
                selection;

            if(!selectedItem) {
              return;
            }

            selection = symbolUtil.cloneSymbol(selectedItem.item.symbol);

            this.emit("symbol-select", {
              selection: selection
            });
          }));

          this._loadingIndicator = busyIndicator.create(this.dap_symbolViewport);

          this.own(
            this._loadingIndicator
          );

          this.dap_markerCategoryInput.on("change", lang.hitch(this, function (category) {
            this.clearSelection();
            this._fetchSymbols(category);
          }));

          this._normalizeSymbolStorage();
          this._loadStoredSymbolItems();

          this._setUpSymbolCategories().then(lang.hitch(this, this.updateDisplay));
        },

        _fetchSymbols: function (id) {
          var symbolItem,
              symbolItemType;

          this._templatePicker.items = [];

          symbolItem = this._symbolItemStore.query({ id: id })[0];
          if (symbolItem) {
            this._saveRecentItem(symbolItem);
            this._updateSymbolOptions(symbolItem.items);
            return;
          }

          symbolItemType = this._symbolTypesStore.query({ id: id });

          this._showLoadingIndicator();
          this._getSymbolListData(symbolItemType)
            .then(lang.hitch(this, this._symbolItemsFromJson))
            .then(lang.hitch(this, function (symbolItems) {

              var symbolItem = {
                    id: id,
                    items: symbolItems
                  },
                  defaultType;

              this._symbolItemStore.put(symbolItem);

              this._saveRecentItem(symbolItem);

              defaultType = this._symbolTypesStore.query({ defaultType: true })[0];
              if (defaultType && defaultType.id === id) {
                this._saveDefaultItem(symbolItem);
              }

              return symbolItems;
            }))
            .then(lang.hitch(this, this._updateSymbolOptions));
        },

        _saveRecentItem: function (symbolItem) {
          var recentItem = {
            id: symbolItem.id,
            items: this._symbolItemsToJson(symbolItem.items)
          };

          sessionStorage.setItem(this._getRecentItemKey(), JSON.stringify(recentItem));
        },

        _getRecentItemKey: function () {
          return this._toItemKey("/recent");
        },

        _toItemKey: function (key) {
          return this._storageItemKeyBase + key;
        },

        _getDefaultItemKey: function () {
          return this._toItemKey("/default");
        },

        _getTypesItemKey: function () {
          return this._toItemKey("/types");
        },

        _getVersionItemKey: function () {
          return this._toItemKey("/version");
        },

        _saveDefaultItem: function (symbolItem) {
          var defaultItem = {
            id: symbolItem.id,
            items: this._symbolItemsToJson(symbolItem.items)
          };

          localStorage.setItem(this._getDefaultItemKey(), JSON.stringify(defaultItem));
        },

        _showNoSymbolsMessage: function () {
          this._hideLoadingIndicator();

          domClass.add(this.domNode, this.css.noSymbols);
          this._placeNoSymbolsOverlay();

        },

        _placeNoSymbolsOverlay: function () {
          var overlay,
              inner,
              middle,
              outer,
              css;

          if (this._noSymbolsOverlay) {
            return;
          }

          css = this.css;

          overlay = domConstruct.create("div", { "class": css.overlay });
          outer = domConstruct.create("div", { "class": css.centerContainer + " " + css.table }, overlay);
          middle = domConstruct.create("div", { "class": css.tableCell }, outer);
          inner = domConstruct.create("div", { "class": css.centerBlock }, middle);

          domConstruct.create("div", {
            "class": css.content,
            innerHTML: this.labels.symbolLoadError
          }, inner);

          domConstruct.place(overlay, this.domNode);

          this._noSymbolsOverlay = overlay;
        },

        _getStorageVersionKey: function () {
          return esriKernel.version + "|" + kernel.locale;
        },

        _normalizeSymbolStorage: function () {
          var storedSymbolVersion = localStorage.getItem(this._getVersionItemKey()),
              versionKey = this._getStorageVersionKey();

          if (storedSymbolVersion !== versionKey) {
            localStorage.setItem(this._getVersionItemKey(), versionKey);

            localStorage.removeItem(this._getTypesItemKey());
            localStorage.removeItem(this._getDefaultItemKey());
            sessionStorage.removeItem(this._getRecentItemKey());
          }
        },

        _loadStoredSymbolItems: function () {
          var defaultSymbolItem = this._loadDefaultSymbolItem(),
              recentSymbolItem = this._loadRecentSymbolItem();

          if (defaultSymbolItem) {
            this._symbolItemStore.put(this._symbolItemsFromSymbolItemJson(defaultSymbolItem));
          }

          if (recentSymbolItem) {
            this._symbolItemStore.put(this._symbolItemsFromSymbolItemJson(recentSymbolItem));
          }
        },

        _loadDefaultSymbolItem: function () {
          var defaultSymbolItemJson = localStorage.getItem(this._getDefaultItemKey());
          if (defaultSymbolItemJson) {
            return JSON.parse(defaultSymbolItemJson);
          }
        },

        _loadRecentSymbolItem: function () {
          var recentSymbolItemJson = sessionStorage.getItem(this._getRecentItemKey());
          if (recentSymbolItemJson) {
            return JSON.parse(recentSymbolItemJson);
          }
        },

        _loadSymbolTypes: function () {
          var symbolTypesJson = localStorage.getItem(this._getTypesItemKey());
          if (symbolTypesJson) {
            return JSON.parse(symbolTypesJson);
          }
        },

        _saveSymbolTypes: function (symbolTypes) {
          localStorage.setItem(this._getTypesItemKey(), JSON.stringify(symbolTypes));
        },

        _symbolItemsFromSymbolItemJson: function (symbolItem) {
          symbolItem.items = array.map(symbolItem.items, function (item) {
            return {
              symbol: symbolJsonUtils.fromJSON(item.symbol)
            };
          });

          return symbolItem;
        },

        _fetchSymbolTypes: function () {
          var deferred = new Deferred(),
              symbolTypes = this._loadSymbolTypes();

          if (symbolTypes) {
            deferred.resolve(symbolTypes);
            return deferred.promise;
          }

          return this._getSymbolListGroupId()
            .then(lang.hitch(this, this._getSymbolListItems))
            .then(lang.hitch(this, function (symbolTypes) {
              this._saveSymbolTypes(symbolTypes);
              return symbolTypes;
            }));
        },

        _setUpSymbolCategories: function () {
          this._showLoadingIndicator();

          return this._initPortal()
            .then(lang.hitch(this, this._fetchSymbolTypes))
            .then(lang.hitch(this, this._setUpSymbolSelect),

            lang.hitch(this, function () {
              this._showNoSymbolsMessage();
            }));
        },

        _setUpSymbolSelect: function (symbolItems) {
          var symbolTypeStore = this._symbolTypesStore,
              selectedItemId,
              recentSymbolItem,
              recentSymbolType;

          symbolTypeStore.setData(symbolItems);

          array.forEach(symbolItems, function (item) {
            if (item.defaultType) {
              selectedItemId = item.id;
            }
          });

          recentSymbolItem = this._loadRecentSymbolItem();
          if (recentSymbolItem) {
            recentSymbolType = symbolTypeStore.query({ id: recentSymbolItem.id })[0];
            if (recentSymbolType) {
              selectedItemId = recentSymbolItem.id;
            }
          }

          this.dap_markerCategoryInput.set("store", symbolTypeStore);
          this.dap_markerCategoryInput.set("value", selectedItemId, false);
        },

        _showLoadingIndicator: function () {
          if (has("ie") <= 8) {
            domClass.add(this.domNode, this.css.loading);
          }
          else {
            this._loadingIndicator.show();
          }
        },

        _hideLoadingIndicator: function () {
          if (has("ie") <= 8) {
            domClass.remove(this.domNode, this.css.loading);
          }
          else {
            this._loadingIndicator.hide();
          }
        },

        _initPortal: function () {
          var deferred = new Deferred(),
              portal   = this.portal || DEFAULT_PORTAL_URL,
              portalInstance;

          if (typeof portal === "string") {
            portalInstance = new Portal.Portal(portal);
          }
          else if (portal.declaredClass) {
            portalInstance = portal;
          }
          else {
            portalInstance = new Portal.Portal({
              self: portal
            });
          }

          if (portalInstance.loaded) {
            this._portal = portalInstance;
            deferred.resolve();
            return deferred.promise;
          }

          this.own(
            portalInstance.on("load", lang.hitch(this, function() {
              this._portal = portalInstance;
              deferred.resolve();
            }))
          );

          setTimeout(function() {
            deferred.reject();
          }, this._portalLoadTimeoutInMs);

          return deferred.promise;
        },

        _getSymbolListGroupId: function () {
          var deferred = new Deferred();

          this._portal.queryGroups({
            q: this._portal.symbolSetsGroupQuery
          }).then(function (groups) {
            var firstGroup = groups.results[0];
            deferred.resolve(firstGroup.id);
          }, function () {
            deferred.reject();
          });

          return deferred.promise;
        },

        _getSymbolListItems: function (groupId) {
          var deferred = new Deferred(),
              portal = this._portal,
              query = "group:" + groupId + " AND type:\"Symbol Set\"",
              symbolItems = [];

          if (gfx.renderer === "vml") {
            query += " AND -typekeywords:\"by value\"";
          }
          else {
            query += " AND (typekeywords:\"by value\" AND typekeywords:\"marker\")";
          }

          portal.queryItems({
            q: query,
            num: 20,
            sortField: "title"
          }).then(lang.hitch(this, function (items) {
              var listItems = items.results,
                  typeKeywords,
                  title,
                  symbolItem,
                  isDefaultType;

              array.forEach(listItems, function (item) {
                typeKeywords = item.typeKeywords.join(" ");

                if (typeKeywords.indexOf("marker") > -1) {
                  title = item.title;

                  symbolItem = {
                    name: title,
                    id: item.id,
                    title: item.title,
                    keywords: typeKeywords,
                    dataUrl: item.itemDataUrl
                  };

                  isDefaultType = typeKeywords.indexOf("default") > -1;
                  if (isDefaultType) {
                    symbolItem.defaultType = true;
                    symbolItems.unshift(symbolItem);
                  }
                  else {
                    symbolItems.push(symbolItem);
                  }

                }
              }, this);

              if (symbolItems.length > 0) {
                deferred.resolve(symbolItems);
              }
              else {
                deferred.reject();
              }
            }),
            function () {
              deferred.reject();
            });

          return deferred.promise;
        },

        _getSymbolListData: function (items) {
          var itemDataPromises = array.map(items, function (item) {
            return request({ url: item.dataUrl }).promise;
          });

          return all(itemDataPromises).then(function (data) {
            return data[0];
          });
        },

        _symbolItemsFromJson: function (symbolsJson) {
          return array.map(symbolsJson, function (symbolJson) {
            return {
              symbol: symbolJsonUtils.fromJSON(symbolJson)
            };
          });
        },

        _symbolItemsToJson: function (symbolItems) {
          return array.map(symbolItems, function (symbolItem) {
            return {
              symbol: symbolItem.symbol.toJSON()
            };
          });
        },

        _updateSymbolOptions: function (symbolItems) {
          var templatePicker = this._templatePicker;

          templatePicker.items = symbolItems;
          templatePicker.update();
          templatePicker.domNode.parentNode.scrollTop = 0;

          this._hideLoadingIndicator();
        },

        _setDisplayModeAttr: function (mode) {
          if (this.displayMode === mode) {
            return;
          }

          this._set("displayMode", mode);
          this.updateDisplay(mode);
        },

        updateDisplay: function () {
          var categoryInput = this.dap_markerCategoryInput;

          this.clearSelection();

          if (this.displayMode === "portal") {
            this._fetchSymbols(categoryInput.value);

            domUtils.show(categoryInput.domNode);
            domClass.remove(this.domNode, this.css.defaultSymbols);
          }
          else if (this.displayMode === "default") {
            this._updateSymbolOptions(this._symbolItemsFromJson(this._defaultSimpleMarkerSymbols));

            domUtils.hide(categoryInput.domNode);
            domClass.add(this.domNode, this.css.defaultSymbols);
          }
        },

        clearSelection: function () {
          this._templatePicker.clearSelection();
        },

        resetSelection: function () {
          var categoryInput = this.dap_markerCategoryInput,
              categories = categoryInput.get("options");

          categoryInput.set("value", categories[0]);

          this.clearSelection();
        }
      });

    return MarkerSymbolPicker;
  });
