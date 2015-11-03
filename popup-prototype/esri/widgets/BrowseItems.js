define([
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/dom-class",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/string",
  "dojo/on",
  "dojo/aspect",
  "dojo/has",
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/mouse",
  "dojo/query",
  "dojo/parser",
  "dijit/registry",
  "dijit/TooltipDialog",
  "dijit/popup",
  "dojo/promise/all",
  "dojo/Deferred",
  "dgrid/Grid",
  "dgrid/extensions/Pagination",
  "dgrid/extensions/DijitRegistry",
  "dgrid/OnDemandGrid",
  "dgrid/Selection",
  "dgrid/Keyboard",
  "dgrid/util/touch",
  "put-selector/put",
  "dojo/store/Observable",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/form/Select",
  "../portal/Portal",
  "../core/PluginTarget",
  "dojo/i18n!../nls/jsapi",
  "./_RefreshMixin",
  "dojo/NodeList-dom",
  "../kernel",
  "../core/lang"
],
  function (declare,
            lang,
            array,
            domClass,
            domStyle,
            domAttr,
            dojoString,
            on,
            aspect,
            has,
            dom,
            domConstruct,
            dojoMouse,
            query,
            parser,
            registry,
            TooltipDialog,
            popup,
            promise,
            Deferred,
            Grid,
            Pagination,
            DijitRegistry,
            OnDemandGrid,
            Selection,
            Keyboard,
            touchUtil,
            put,
            Observable,
            _WidgetBase,
            _TemplatedMixin,
            _WidgetsInTemplateMixin,
            Select,
            esriPortal,
            PlugInTarget,
            jsapiBundle,
            RefreshMixin,
            esriNS, 
            esriLang) {

    var ItemStore = declare(null, {

        idProperty: "id",

        constructor: function (options) {
          declare.safeMixin(this, options);
        },

        get: function (id, options) {
          return esriPortal.PortalUtil.request(this.portalUrl + "content/items/" + id, options).then(function (item) {
            return new esriPortal.PortalItem(lang.mixin(item, {"portal": this.portal}));
          });
        },

        getIdentity: function (object) {
          return object[this.idProperty];
        },

        query: function (query, options) {
          var queryParams = lang.isObject(query) ? query : {"q": query};

          if (options) {
            queryParams = lang.mixin(queryParams, {"num": options.count, "start": ((options.start || 0) + 1)});
            if (options.sort && options.sort.length) {
              var sort = options.sort[0];
              queryParams = lang.mixin(queryParams, {"sortField": encodeURIComponent((sort.attribute === "created") ? "uploaded" : sort.attribute), "sortOrder": sort.descending ? "desc" : "asc"});
            }
          }

          var results = this.portal.queryItems(queryParams, true).then(function (result) {
            result.results.total = result.total;
            return result.results;
          });

          return esriPortal.PortalResult(results);
        }
      });

    var BrowseItems =  declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, PlugInTarget], {

      templateString:
        "<div>" +
          "<p data-dojo-attach-point=\"messageNode\" class=\"hide\"></p>" +
          "<div style=\"width:100%\" class=\"esriLeadingMargin1\"><select id=\"${id}" + "_categorySelect\"" + "class=\"categorySelect\"></select>"+
          "<div id=\"${id}" + "_search\"" + "class=\"esriTrailingMargin2 esriFloatTrailing searchBar\"><input class=\"esriSearchBox dijitTextBox\" type=\"text\" placeholder:'${i18n.searchFor}'></div></div>" +
          "<div id=\"${id}" + "_grid\"" + "class=\"dgrid-autoheight\"></div>" +
          "<br />" +
        "</div>",

      _galleryTemplate:
        "<div style='opacity:1;' class='grid-item gallery-view'>" +
          "${item:_formatItemTitle}" +
          "${item:_formatThumbnail}" +
         "</div>",

      _popupTemplate:
        "<div class=\"esriBrowsePopup quiet-scroll\">" +
          "<p>{summary}</p>" +
        "</div>",

      baseClass: "esriBrowseItems",

      postMixInProperties: function() {
        this.inherited(arguments);
        this.i18n = {};
        lang.mixin(this.i18n, jsapiBundle.gallery);
      },
      
      postCreate: function () {
        this.inherited(arguments);
          // Overwrite canSearchPublic settings on the org to be true
          // otherwise we wouldnt find the templates since they are public

          if(this.self) {
            this._portal = new esriPortal.Portal({"url": this.portalUrl, "self": this.self});
            this._portal.on("load", lang.hitch(this, this._fetchData));
          }
          else {
             this._portal = new esriPortal.Portal(this.portalUrl);
             this._portal.signIn().then(lang.hitch(this, this._fetchData));
           }
      },
      
      destroy: function () {
        this.inherited(arguments);

        //this._grid.store.close();
        if (this._grid) {
          this._grid.destroy();
        }

        this._img_connect.remove();
        this._img_connect_error.remove();

        if (this._queryTimer) {
          clearTimeout(this._queryTimer);
        }

        this._grid = this._portal = null;
      },
        
      _setPortalUrlAttr: function(url) {
        this.portalUrl = url;
      },

      _setSelfAttr: function(self) {
        this.self = self;
      },

      _setPluginAttr: function(plugIn) {
        this.addPlugin(plugIn);
      },

      _setMessageAttr: function(msg) {
        domAttr.set(this.messageNode, "innerHTML", msg);
        domClass.remove(this.messageNode, "hide");
      },
      
      _setCategoriesAttr: function(items) {
         this.items = items;
      },

      _setDisabledAttr: function (value) {
        var widgets = registry.findWidgets(this.domNode).concat(registry.findWidgets(this._content));
        array.forEach(widgets, function (widget) {
          widget.set("disabled", value);
        });
        //Bug in disabling select dijit
        domClass[(value ? "add" : "remove")](this._interval.domNode, "dijitTextBoxDisabled");
      },

      _setSortAttr: function(sortAttr) {
        this.sortAttribute = sortAttr;
      },

      _setSortDescendingAttr: function (sortDesc) {
        this.sortDescending = sortDesc;
      },

      _getSelectionAttr: function () {
        var selection = this._grid.selection;
        for (var key in selection) {
          if(selection.hasOwnProperty(key)) {
             break;
          }
        }
        return key && this._grid.row(key).data;
      },
      
      _setGalleryTemplateAttr: function(str) {
        if(esriLang.isDefined(str)) {
          this._galleryTemplate = str;
        }
      },
      
      _setFormatThumbnailAttr: function(value) {
        if(esriLang.isDefined(value) && typeof value === "function") {
         this._formatThumbnail = value;
        }
      },
      
      _setFormatItemTitleAttr: function(value) {
        if(esriLang.isDefined(value) && typeof value === "function") {
         this._formatItemTitle = value;
        }
      },
      
      _setItemsPerPageAttr: function(value) {
        this._set("itemsPerPage", value);  
      },

      _setPagingLinksAttr: function(value) {
        this._set("pagingLinks", value);  
      },
      
      _setCategoryTypeAttr: function(value) {
        this._set("categoryType", value);  
      },
      
      _getQueryAttr: function(){
        return this._grid && this._grid.get("query");
      },
      
      _setQueryAttr: function(value) {
        if(this._grid) {
          this._grid.set("query", value);
        }
      },
      
      _validate: function () {
        var selected = this.get("selection");
        return !!selected;
      },

      _showPopup: function(evt) {
        this._closePopup();
        var row = this._grid.row(evt),
          node = query("img", row.element)[0],
          info = {"summary":row.data.snippet};

        if (info && info.summary) {
          this._tooltip = new TooltipDialog({
            content: lang.replace(this._popupTemplate, info)
          });
          popup.open({
            className: "esriBrowsePopup",
            popup: this._tooltip,
            around: node,
            orient: ["after-centered", "before-centered"]
          });
          this._onCloseConnect = query(".dijitDialogCloseIcon", this._tooltip.domNode).on("click", lang.hitch(this, function (e) {
            e.preventDefault();
            this._closePopup();
          }));
        }
      },

      _closePopup: function () {
        if (this._tooltip) {
          this._onCloseConnect.remove();
          popup.close(this._tooltip);
          this._tooltip.destroyRecursive();
          this._tooltip = this._onCloseConnect = undefined;
        }
      },

      // clear timeout for query
      _clearQueryTimeout: function () {
        clearTimeout(this._queryTimer);
      },

      _createGrid: function () {
        var CustomGrid = declare([Grid, Pagination, Selection, RefreshMixin, DijitRegistry]),
          store = new Observable(new ItemStore({"portal": this._portal})),
          filterQuery = this._currentFilter,
          _renderer = lang.hitch(this, function (obj) {
            obj.snippet = obj.snippet || "";
            var div = put("div"),
              node = dojoString.substitute(this._galleryTemplate, {"item": obj, "i18n": this.i18n}, null, this);
            domConstruct.place(node, div);
            return div;
          });

        this._grid = new CustomGrid({
          store: store,
          className: "dgrid-autoheight",
          query: filterQuery,
          selectionMode: "single",
          pagingLinks: this.get("pagingLinks") || 2,
          rowsPerPage: this.get("itemsPerPage") || 6,
          loadingMessage: "Loading items...",
          showLoadingMessage: false,
          renderRow: _renderer,
          sort: [
            { attribute: "title" }
          ]
        }, this.id + "_grid");
        this._grid.startup();
        //console.log(this.categories);
        if(this.categories && this.categories.length > 0) {
          this._categorySelect = new Select({
                                            options: this.categories,
                                            sortByLabel: false,
                                            "class": "categorySelect"
                                          }, this.id + "_categorySelect");
          this._categorySelect.set("value", this.categories[0].value);
          this.own(this._categorySelect.on("change", lang.hitch(this, function(value) {
            //console.log(value);
            var newQuery;
            if(!this._origQuery) {
              this._origQuery = this._grid.get("query");
            }
            newQuery = this._origQuery; 
            if(value) {
              newQuery +=  " AND (" + this.get("categoryType") + ":" + value + ")";
            } 
            this._fetchItems(newQuery);
          })));
        }
        this.own(
          this._grid.on(mouseUtil.enterRow, lang.hitch(this, function (evt) {
            this._showPopup(evt);
          })),
          this._grid.on(mouseUtil.leaveRow, lang.hitch(this, function (evt) {
            this._closePopup(evt);
          })),
          this._grid.on("dgrid-refresh-complete", lang.hitch(this, function(evt){
            query(".dgrid-footer", this.domNode)[this._grid._total <= this._grid.rowsPerPage ? "addClass" : "removeClass"]("hide");
          })),
          this._grid.on("refresh", lang.hitch(this, function() {
            if (this._img_connect) {
              this._img_connect.remove();
              this._img_connect_error.remove();
              this._img_connect = null;
              this._img_connect_error = null;
            }
            this._img_connect = query(".grid-item-thumb", this._grid.domNode).on("load", lang.hitch(this, function (evt) {
              var row = this._grid.row(evt);
              if (row && row.element){
                query(".grid-item", row.element).addClass("fadeIn").style("opacity", "1");
              }
            }));
            this._img_connect_error = query(".grid-item-thumb", this._grid.domNode).on("error", lang.hitch(this, function (evt) {
              domAttr.set(evt.target, "src", (this._portal.staticImagesUrl + "/desktopapp.png"));
            }));
          })),
          this._grid.on("dgrid-select,dgrid-deselect", lang.hitch(this, function() {
            //console.log(this.get("selection"));
            var params = {
              selection: this.get("selection")
            };
            this.emit("select-change", params);
          })),
          on(dom.byId(this.id + "_search"), "keyup", lang.hitch(this, function(e){
            e.preventDefault();
            // Reset timer between keys
            this._clearQueryTimeout();
            // suggest
            this._queryTimer = setTimeout(lang.hitch(this, function () {
              this._fetchItems(this._currentFilter, domAttr.get(e.target, "value"));
            }), (this.searchKeypressDelay || 250));

          }))
        );
      },

      _fetchData: function () {
        this._user = this._portal.getPortalUser();
        return this.plugIn.fetchData();
      },

      _fetchItems: function (query, searchQuery) {
        var queryOptions = {sort: [
            {attribute: this.sortAttribute || "title", descending: this.sortDescending || false}
          ]},
          search = searchQuery ? (" title:" + searchQuery + "* ") : "",
          dfd = new Deferred();

        setTimeout(lang.hitch(this, function () {
          this._currentFilter = query;
          if (!this._grid) {
            this._createGrid();
          } else {
            this._grid.set("query", (this._currentFilter + search), queryOptions);
          }
          dfd.resolve(this._grid);
        }), 60);

        return dfd;
      },

      _formatThumbnail: function (item) {
        var thmbSrc = item.thumbnailUrl || this._portal.staticImagesUrl + "/desktopapp.png";
        return "<img class='grid-item-thumb' width='187px' height='125px' alt='' src='" + thmbSrc + "'>";
      },

      _formatItemTitle: function (item) {
        return "<h5>" + (item.title || item.name || "<No Title>") + "</h5>";
      },
      
      clear: function() {
        this._grid.clearSelection();
      }

    });
    return BrowseItems;  
  });
