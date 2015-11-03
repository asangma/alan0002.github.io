/**
 * The Tags widget allows for input of tags featuring auto-complete, with a drop-down of previously used tags.
 *
 * @module esri/widgets/Tags
 * @private
 */
define([
  "dojo/_base/array",
  "../core/declare",
  "dojo/_base/lang",
  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/dom-style",
  "dojo/html",
  "dojo/keys",
  "dojo/on",
  "dojo/query",
  "dojo/sniff",
  "dojo/string",
  "dojo/store/Memory",

  "dijit/focus",
  "dijit/form/TextBox",
  "dijit/registry",
  "dijit/Tooltip",
  "dijit/_OnDijitClickMixin",
  "dijit/_TemplatedMixin",
  "./Widget",

  "dgrid/OnDemandGrid",
  "dgrid/Selection",
  "dgrid/Keyboard",

  "../core/lang",

  "dojo/i18n!../nls/jsapi",

  "dojo/NodeList-traverse",
  "dojo/NodeList-manipulate"
], function(
  array, declare, lang, dom, domAttr, domClass, domConstruct, domStyle, html, keys, on, query, has,
  string, Memory, focusUtil, TextBox, registry, Tooltip, _OnDijitClickMixin, _TemplatedMixin, Widget,
  OnDemandGrid, Selection, Keyboard, esriLang, i18n
) {

  /**
   * @private
   * @extend module:esri/widgets/Widget
   * @extend module:dijit/_OnDijitClickMixin
   * @extend module:dijit/_TemplatedMixin
   * @constructor module:esri/widgets/Tags
   * @param {Object} properties - properties for Tags
   */
  return declare([Widget, _OnDijitClickMixin, _TemplatedMixin], {

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _attachmentNode: "", // DOM location of this widget (srcNodeRef)
    _autocompleteList: "", // list to hold the in the dropdown autocomplete items
    _grid: "", // dGrid to hold the dropdown list
    _store: "", // hold the array of data in the dropdown list
    _matchParam: "",
    _idProperty: "", // indicates the property to use as the identity property.
    _gridId: "",
    _filterId: "",
    _placeHolder: "", // the input text box placeHolder
    _noDataMsg: "", // No matching data found message
    _inputTextBox: "", // the input text box
    _gridHasFocus: false,
    _metaKeyPressed: false, // meta keys
    _shiftKeyPressed: false, // shift key
    _CSS_STYLES: {
      CLASS_SELECTOR: ".",
      ALL_SELECTOR: ">",
      MULTI: "select2-container select2-container-multi",
      CHOICES: "select2-choices",
      CHOICE: "select2-search-choice",
      SEARCH_CHOICE_FOCUS: "select2-search-choice-focus",
      SEARCH_FIELD: "select2-search-field",
      CLOSE_ICON: "select2-search-choice-close"
    },
    _selRows: [], // selected rows in the dGrid
    _CHOICE_SELECTOR: "",
    _CHOICE_FOCUS: "",
    _CHOICE_FOCUS_ALL: "",

    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    /**
     * declaredClass Description
     * @type {string}
     * @private
     */
    declaredClass: "esri.dijit.Tags",

    /**
     * templateString
     * @type {string}
     * @private
     */
    templateString: "<div class=\"${baseClass}\"></div>",

    /**
     * baseClass
     * @type {string}
     * @private
     */
    baseClass: "esri-tags",

    //----------------------------------
    //  required
    //----------------------------------

    /**
     * Whether the a value is required for this widget.
     * @type {boolean}
     * @default
     */
    required: false,

    //----------------------------------
    //  values
    //----------------------------------

    /**
     * The values array holds the list of raw tags currently selected.
     * @type {Array}
     * @default
     */
    values: [],

    /**
     * Set the 'value' attribute.
     * @param value
     * @private
     */
    _setValueAttr: function(value) {
      this._setTagsAttr(value);
    },

    /**
     * Get the 'value' attribute.
     * @returns {*}
     * @private
     */
    _getValueAttr: function() {
      return this._getTagsAttr();
    },

    /**
     * Set the 'tags' attribute. Synonymous with the 'value' attribute.
     * @param tags
     * @private
     */
    _setTagsAttr: function(tags) {
      // convert to array if given a string
      if(tags && !Array.isArray(tags)) {
        tags = tags.split(",");
      }

      if(this._isIE8) {
        if(this._textTags) {
          this._textTags.set("value", this._getUniqueTags(tags).join(","));
        }
      } else {
        this.clearTags();
        this.prepopulate(tags ? this._getUniqueTags(tags) : []);
      }
    },

    /**
     * Get the 'tags' attribute. Synonymous with the 'value' attribute.
     * @returns {*}
     * @private
     */
    _getTagsAttr: function() {
      if(this._isIE8) {
        return this._textTags ? this._textTags.get("value") : "";
      } else {
        return this.values ? this.values.join(",") : "";
      }
    },

    //----------------------------------
    //  maxWidth
    //----------------------------------

    /**
     * Maximum width for the widget.
     * @type {string}
     * @default
     */
    maxWidth: "auto",

    //----------------------------------
    //  minWidth
    //----------------------------------

    /**
     * Minimum width for the widget.
     * @type {string}
     * @default
     */
    minWidth: "auto",

    //----------------------------------
    //  knownTags (virtual property)
    //----------------------------------

    /**
     * Set the list of known tags. These tags appear in the drop-down grid
     * as options for the user to select from.
     * @param tagList
     * @private
     */
    _setKnownTagsAttr: function(tagList) {
      if(!this._isIE8) {
        this.clearTags();

        var data = (tagList && tagList.length > 0) ? tagList : [];
        this._store = new Memory({idProperty: this._idProperty, data: data});
        this._grid.set("store", this._store);
        this._grid.refresh();
      }
    },

    // --------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function(params) {
      this._idProperty = params.idProperty || "tag";
      this.maxWidth = params.maxWidth || "auto";
      this.minWidth = params.minWidth || "auto";
      this._matchParam = params.matchParam || "first";
      this.values = [];
      this._selRows = [];

      this._CHOICE_ALL_SELECTOR = this._CSS_STYLES.CLASS_SELECTOR + this._CSS_STYLES.CHOICE + this._CSS_STYLES.ALL_SELECTOR;
      this._CHOICE_FOCUS = this._CSS_STYLES.CLASS_SELECTOR + this._CSS_STYLES.SEARCH_CHOICE_FOCUS;
      this._CHOICE_FOCUS_ALL = this._CHOICE_FOCUS + this._CSS_STYLES.ALL_SELECTOR;
    },

    postMixInProperties: function() {
      this.inherited(arguments);

      var datetime = (new Date()).getTime();
      this._tagsId = "userTags-" + datetime;
      this._gridId = "grid-" + datetime;
      this._filterId = "filter-" + datetime;
      this._isIE8 = has("ie") < 9;

      this.i18n = {};
      lang.mixin(this.i18n, i18n.widgets.tags);
    },

    postCreate: function() {
      if(this._isIE8) {
        this._textTags = new TextBox({
          trim: true,
          placeHolder: this.i18n.addTags,
          style: {
            minWidth: this.minWidth,
            maxWidth: this.maxWidth
          }
        }, domConstruct.create("div", {id: this._tagsId}, this.domNode));
        this._textTags.startup();
        domClass.add(this._textTags.domNode, "ie8-style");
      } else {
        this._attachmentNode = domConstruct.create("div", {id: this._tagsId, className: "grid_1"}, this.domNode);

        // create the container DOM, holds the entire <input> text box
        this._createContainerNode();
        // create the list <ul> that will hold the styled tags inside the <input>
        this._createTagList();
        // dGrid dropdown list
        this._createDropDownList();
        // create a single list choice <li>
        this._createInput();

        var firstFilterQuery = lang.hitch(this, function(item, index, items) {
          var filterString = this._inputTextBox ? this._inputTextBox.get("value") + "" : "";
          if(filterString.length < 1) {
            return true;
          }
          if(!item.tag) {
            return false;
          }
          var name = (item.tag + "").toLowerCase();
          var re = name.match(new RegExp("^" + filterString.toLowerCase()));
          if(re !== null) {
            if(re.length > 0) {
              return true;
            }
          }
          return false;
        });

        var allFilterQuery = lang.hitch(this, function(item, index, items) {
          // the filter string
          var filterString = this._inputTextBox ? this._inputTextBox.get("value") + "" : "";
          if(filterString.length < 1) {
            return true;
          }
          if(!item.tag) {
            return false;
          }
          var name = (item.tag + "").toLowerCase();

          if(name.indexOf(filterString.toLowerCase())) {
            return true;
          }
          return false;
        });

        // dGrid (one column and a hidden header)
        var columns = [
          { field: this._idProperty }
        ];
        // attribute used to sort the dropdown list
        var sortAttr = [
          { attribute: this._idProperty, ascending: true }
        ];

        this._store = new Memory({idProperty: this._idProperty, data: []}); // create empty store
        var StandardGrid = declare([OnDemandGrid, Selection, Keyboard]);
        this._grid = new StandardGrid({
          store: this._store,
          showHeader: false,
          noDataMessage: this.i18n.noTagsFound,
          selectionMode: "extended",
          allowSelectAll: true,
          cellNavigation: false,
          columns: columns,
          sort: sortAttr,
          renderRow: this._renderItem
        }, this._dropDownList);
        this._grid.startup();

        domClass.add(this._grid.domNode, "grid-height-limiter"); // limit grid height

        if(this._matchParam === "first") {
          this._grid.query = firstFilterQuery;
        } else {
          this._grid.query = allFilterQuery;
        }

        // connect events
        var timeoutId;
        // watch for keyboard input in the text box
        this.own(this._inputTextBox.watch("value", lang.hitch(this, function(name, oldValue, newValue) {
          if(timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          this._grid.refresh();
        })));

        this.own(this._grid.on(".dgrid-row:click", lang.hitch(this, function(event) {
          var value = "";
          if(!this._shiftKeyPressed && !this._metaKeyPressed) {
            value = this._grid.row(event).data.tag;
            this._createTags(value);
            this._store.remove(value);
            this._grid.refresh();
            this._resetInputTextBox();
          } else if(!event.shiftKey && !event.metaKey && !event.ctrlKey) {
            value = this._selRows[0];
            this._createTags(value);
            this._store.remove(value);
            this._grid.refresh();
            this._resetInputTextBox();
          }
        })));

        this.own(this._grid.on("dgrid-deselect", lang.hitch(this, function(event) {
          this._selRows = [];
          for(var rowIdx in this._grid.selection) {
            if(this._grid.selection.hasOwnProperty(rowIdx)) {
              this._selRows.push(rowIdx);
            }
          }
        })));

        this.own(this._grid.on("dgrid-select", lang.hitch(this, function(event) {
          this._selRows = [];
          for(var rowIdx in this._grid.selection) {
            if(this._grid.selection.hasOwnProperty(rowIdx)) {
              this._selRows.push(rowIdx);
            }
          }
        })));
        this.own(this.connect(this.domNode, "keydown", "_keydownHandler"));

        // Seems to be an issue with dojo.keys and SHIFT in FF
        // Test case: http://cmahlke.esri.com:89/test/dojo/keys.html
        window.onkeydown = lang.hitch(this, function(e) {
          if(e.shiftKey || e.ctrlKey || e.keyCode === 224) {
            this._metaKeyPressed = true;
          }
        });
        this.own(this.connect(document, "onkeydown", lang.hitch(this, function(event) {
          this._shiftKeyPressed = true;
          this._metaKeyPressed = true;
        })));
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Event handlers
    //
    //--------------------------------------------------------------------------

    /**
     * Handle keyboard events.
     * @param evt
     * @private
     */
    _keydownHandler: function(evt) {
      this._clearMessage();

      var selectedTag = query(this._CHOICE_FOCUS, dom.byId(this.id)),
          currentTag = query(this._CSS_STYLES.CLASS_SELECTOR + this._CSS_STYLES.CHOICE, dom.byId(this.id)).last(),
          value,
          partsOfStr,
          newArr,
          i,
          nInputChars;

      if(focusUtil.curNode.value !== undefined) {
        nInputChars = focusUtil.curNode.value.length;
      }

      switch(evt.keyCode) {
        case keys.RIGHT_ARROW:
          this._navigate(selectedTag, nInputChars, currentTag, "right");
          this._hideGrid();
          break;
        case keys.LEFT_ARROW:
          this._navigate(selectedTag, nInputChars, currentTag, "left");
          this._hideGrid();
          break;
        case keys.DOWN_ARROW:
          evt.preventDefault();
          this._unhighlightTag(selectedTag);
          if(domStyle.get(this._gridId, "display") === "none") {
            this._showGrid();
          }
          if(!this._gridHasFocus) {
            this._grid.focus(this._setFocusOnFirstRow(this._grid, 0));
            this._gridHasFocus = true;
          }
          break;
        case keys.UP_ARROW:
          break;
        case keys.BACKSPACE:
          var tagValue;
          // if the input text is EMPTY and no tags are in FOCUS, delete the first encountered node in the tag list
          if(nInputChars === 0 && query(this._CHOICE_FOCUS_ALL).length === 0) {
            if(query(this._CHOICE_ALL_SELECTOR)[query(this._CHOICE_ALL_SELECTOR).length - 1] !== undefined) {
              tagValue = query(this._CHOICE_ALL_SELECTOR)[query(this._CHOICE_ALL_SELECTOR).length - 1].title;
              if(query("li", this._attachmentNode).length > 0) {
                // remove the tag from the list
                domConstruct.destroy(currentTag[0]);
                // get the tag's title, add it back to the store
                if(tagValue !== undefined || "") {
                  try {
                    this._store.add({
                      tag: tagValue
                    });
                  } catch(e) {
                  }
                }
              }
            }
          }

          // One of the tags other than the last tag has focus, delete it
          if(query(this._CHOICE_FOCUS_ALL).length > 0) {
            tagValue = query(this._CHOICE_FOCUS_ALL).text();
            domConstruct.destroy(selectedTag[0]);
            // get the tag"s title, add it back to the store
            if(tagValue !== undefined || "") {
              try {
                this._store.add({
                  tag: tagValue
                });
              } catch(e) {
              }
            }
          }
          // refresh the dGrid and destroy the tag from the list
          this._grid.refresh();
          if(nInputChars === 0) {
            // hide the grid
            this._hideGrid();
          }
          this._removeTag(tagValue);
          this.validate();
          break;
        case keys.CTRL:
          this._metaKeyPressed = true;
          break;
        case keys.META:
          this._metaKeyPressed = true;
          break;
        case keys.SHIFT:
          this._shiftKeyPressed = true;
          break;
        case keys.ENTER:
          // check if there are characters entered in the textbox
          if(nInputChars > 0) {
            // get the value(s) in the input text box
            value = this._stripHTML(focusUtil.curNode.value); // strip HTML
            // user could be manually entering csv
            partsOfStr = value.split(",");
            // need to check if the user manually entered the same tag in the csv, if so remove duplicates
            newArr = [];
            array.forEach(partsOfStr, function(item, i) {
              if(array.indexOf(newArr, item) === -1) {
                newArr.push(string.trim(item));
              }
            });

            array.forEach(newArr, lang.hitch(this, function(entry, i) {
              // do not permit empty strings
              if(!this._isEmpty(entry)) {
                //make sure tag does not already exist
                if(!this._contains(this.values, entry)) {
                  this._createTags(entry);
                }
              }
            }));
          } else {
            for(i = 0; i < this._selRows.length; i++) {
              this._createTags(this._selRows[i]);
              this._store.remove(this._selRows[i]);
            }
            this._shiftKeyPressed = false;
            this._metaKeyPressed = false;
          }
          this._resetInputTextBox();
          evt.preventDefault();
          focusUtil.focus(dom.byId(this._filterId));
          break;
        case keys.TAB:
          if(!(focusUtil.curNode.id === this._filterId && nInputChars === 0)) {
            // check if there are characters entered in the textbox
            if(nInputChars > 0) {
              // get the value(s) in the input text box
              value = this._stripHTML(focusUtil.curNode.value); // strip HTML
              // user could be manually entering csv
              partsOfStr = value.split(",");
              // need to check if the user manually entered the same tag in the csv, if so remove duplicates
              newArr = [];
              array.forEach(partsOfStr, function(item, i) {
                if(array.indexOf(newArr, item) === -1) {
                  newArr.push(string.trim(item));
                }
              });

              array.forEach(newArr, lang.hitch(this, function(entry, i) {
                // do not permit empty strings
                if(!this._isEmpty(entry)) {
                  //make sure tag does not already exist
                  if(!this._contains(this.values, entry)) {
                    this._createTags(entry);
                  }
                }
              }));
            } else {
              for(i = 0; i < this._selRows.length; i++) {
                this._createTags(this._selRows[i]);
                this._store.remove(this._selRows[i]);
              }
              this._shiftKeyPressed = false;
              this._metaKeyPressed = false;
            }
            this._resetInputTextBox();
            evt.preventDefault();
            focusUtil.focus(dom.byId(this._filterId));
          }
          break;
        case keys.ESCAPE:
          this._hideGrid();
          break;
        default:
          if(nInputChars > -1) {
            if(domStyle.get(dom.byId(this._gridId), "display") === "none") {
              this._showGrid();
            }
            this._unhighlightTag(selectedTag);
          }
          this._metaKeyPressed = false;
      }
    },

    /**
     * Handle the blur event.
     * @param name
     * @param oldValue
     * @param newValue
     * @private
     */
    _blurHandler: function(name, oldValue, newValue) {
      if(!this.focused) {
        // focus has shifted from the tag widget to some other dom node
        var value = this._stripHTML(this._inputTextBox.value); // strip HTML
        if(value.length > 0) {
          var newArr = [],
            partsOfStr = value.split(",");
          array.forEach(partsOfStr, function(item, i) {
            if(array.indexOf(newArr, item) === -1) {
              newArr.push(string.trim(item));
            }
          });
          array.forEach(newArr, lang.hitch(this, function(entry, i) {
            // do not permit empty strings
            if(!this._isEmpty(entry)) {
              // add a new tag if there was text
              if(!this._contains(this.values, entry)) {
                this._createTags(entry);
              }
            }
          }));
          this._resetInputTextBox();
          this._hideGrid();
        } else {
          this._hideGrid();
        }
      }

      this.validate();
    },

    // --------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Clear the validation message and corresponding tooltip.
     */
    _clearMessage: function() {
      this._displayMessage(null);
    },

    /**
     * Display the validation message. If the message is null or not set, or the
     * widget doesn't have focus, hide the tooltip displaying the message.
     * @param message
     * @private
     */
    _displayMessage: function(message) {
      var node = this._isIE8 ? this._textTags.domNode : dom.byId(this._tagsId);
      if(message && this.focused) {
        Tooltip.show(message, node);
      } else {
        Tooltip.hide(node);
      }
    },

    /**
     * Reset the input textbox value.
     * @private
     */
    _resetInputTextBox: function() {
      this._inputTextBox.set("value", "");
    },

    /**
     * Check if the string is empty. Returns true if empty, false otherwise.
     * @param str
     * @returns {boolean}
     * @private
     */
    _isEmpty: function(str) {
      return str.trim().length === 0;
    },

    /**
     * Navigate the autocomplete grid.
     * @param selectedTag
     * @param nInputChars
     * @param currentTag
     * @param dir
     * @private
     */
    _navigate: function(selectedTag, nInputChars, currentTag, dir) {
      if(selectedTag.length > 0 && nInputChars < 1) {
        if(dir === "right") {
          this._hightlightTag(selectedTag.next());
        } else {
          this._hightlightTag(selectedTag.prev());
        }
        this._unhighlightTag(selectedTag);
      } else {
        if(nInputChars < 1) {
          this._hightlightTag(currentTag);
        }
      }
    },

    /**
     * Check the array, arr, to see if it contains the item.
     * @param arr
     * @param item
     * @returns {boolean}
     * @private
     */
    _contains: function(arr, item) {
      return array.indexOf(arr, item) >= 0;
    },

    /**
     * Highlight a specific tag.
     * @param tag
     * @private
     */
    _hightlightTag: function(tag) {
      tag.addClass(this._CSS_STYLES.SEARCH_CHOICE_FOCUS);
    },

    /**
     * Unhighlight a specific tag.
     * @param tag
     * @private
     */
    _unhighlightTag: function(tag) {
      tag.removeClass(this._CSS_STYLES.SEARCH_CHOICE_FOCUS);
    },

    /**
     * Remove a tag.
     * @param tag
     * @private
     */
    _removeTag: function(tag) {
      if(tag && array.indexOf(this.values, tag) !== -1) {
        this.values.splice(array.indexOf(this.values, tag), 1);
      }
    },

    /**
     * Hide the autocomplete grid.
     * @private
     */
    _hideGrid: function() {
      if(dom.byId(this._gridId)) {
        domStyle.set(dom.byId(this._gridId), "display", "none");
      }
      this._gridHasFocus = false;
    },

    /**
     * Show the autocomplete grid.
     * @private
     */
    _showGrid: function() {
      domStyle.set(dom.byId(this._gridId), "display", "block");
      // expand the width of the dGrid to equal the input text box
      var textBoxWidth = domStyle.get(dom.byId(this._attachmentNode), "width");
      domStyle.set(dom.byId(this._gridId), "width", textBoxWidth + "px");
    },

    /**
     * Set the focus on the first row of the grid.
     * @param grid
     * @param index
     * @returns {*}
     * @private
     */
    _setFocusOnFirstRow: function(grid, index) {
      return query(".dgrid-content .dgrid-cell", this._grid.domNode)[index] ||
        query(".dgrid-content .dgrid-row", this._grid.domNode)[index];
    },

    /**
     * Create the tag(s) represented by the value.
     * @param value
     * @private
     */
    _createTags: function(value) {
      // remove style for any selected nodes
      query(this._CHOICE_FOCUS, dom.byId(this.id)).removeClass("select2-search-choice-focus");
      // create a new <li> tag
      var listItemNode = domConstruct.create("li", null, this._autocompleteList);
      // add style to new tag
      domClass.add(listItemNode, this._CSS_STYLES.CHOICE);
      // set text of new tag
      var listItemDivNode = domConstruct.create("div", {
        title: value
      }, listItemNode);
      html.set(listItemDivNode, this._htmlEncode(value));
      // create a close icon for the new tag
      var listItemNodeLink = domConstruct.create("a", { href: "#" }, listItemDivNode);
      domClass.add(listItemNodeLink, this._CSS_STYLES.CLOSE_ICON);
      // event handler for the close icon (removes the tag and re-adds the item to the store)
      on(listItemNodeLink, "click", lang.hitch(this, function(evt) {
        var tagValue = evt.target.parentElement.innerText || evt.target.parentElement.textContent;
        try {
          this._store.add({
            tag: tagValue
          });
        } catch(e) {
        }
        this._grid.refresh();
        this._removeTag(tagValue);

        this._emitRemoved(tagValue);
        this._emitChanged();
        domConstruct.destroy(evt.target.parentNode.parentNode);
        evt.preventDefault();
      }));
      var inputTextBox = registry.byId(this._filterId);
      domConstruct.place(inputTextBox.domNode, this._autocompleteList, "last");
      this._hideGrid();
      this.values.push(value);

      this._emitAdded(value);
      this._emitChanged();
    },

    /**
     * Emit the 'tags-add' event, setting the 'tag' property on the Event object
     * to the tag that was added.
     * @param tag
     * @private
     */
    _emitAdded: function(tag) {
      this.emit("tags-add", {tag: tag});
    },

    /**
     * Emit the 'tags-remove' event, setting the 'tag' property on the Event object
     * to the tag that was removed.
     * @param tag
     * @private
     */
    _emitRemoved: function(tag) {
      this.emit("tags-remove", {tag: tag});
    },

    /**
     * Emit a 'tags-change' event, setting the 'tags' property on the Event object
     * to the list of current tags.
     * @private
     */
    _emitChanged: function() {
      this.emit("tags-change", {tags: this.get("tags")});
    },

    /**
     * Render the item tag.
     * @param item
     * @returns {div}
     * @private
     */
    _renderItem: function(item) {
      return domConstruct.create("div", {
        innerHTML: item.tag
      });
    },

    /**
     * Create the container node for the widget.
     * @private
     */
    _createContainerNode: function() {
      // create the DOM for this widget
      this._containerNode = domConstruct.create("div", null, this._attachmentNode);
      // add style to the container
      domClass.add(this._containerNode, this._CSS_STYLES.MULTI);
      // since the widget's width expands as the list size increases we need to set the maximum width of
      // the widget
      domStyle.set(this._containerNode, {
        maxWidth: this.maxWidth,
        minWidth: this.minWidth
      });
    },

    /**
     * Create the tag list for use in the autocomplete list.
     * @private
     */
    _createTagList: function() {
      // autocomplete list (<ul>) holds the list of tags already in the input text box
      this._autocompleteList = domConstruct.create("ul", null, this._containerNode);
      // add style to the list of tags
      domClass.add(this._autocompleteList, this._CSS_STYLES.CHOICES);
    },

    /**
     * Create the widget for input of tags.
     * @private
     */
    _createInput: function() {
      // single autocomplete list choice
      var autocompleteListItem = domConstruct.create("li", null, this._autocompleteList, "last");
      // add style to a single choice
      domClass.add(autocompleteListItem, this._CSS_STYLES.SEARCH_FIELD);

      // input text box
      this._inputTextBox = new TextBox({
        id: this._filterId,
        placeHolder: this.i18n.addTags, //this._placeHolder,
        intermediateChanges: true,
        trim: true,
        style: { border: "none" }
      }, autocompleteListItem);
      domClass.add(this._inputTextBox, "input-text-box");
      domStyle.set(this._inputTextBox, "width", this.minWidth);
      if(has("ie") > 8 || has("trident") > 4) { // IE 9, 10, 11 (incl. emulation) needs different style applied
        domClass.add(this._inputTextBox.domNode, "ie-style");
      }

      this.own(focusUtil.watch("curNode", lang.hitch(this, this._blurHandler)));
    },

    /**
     * Create the drop-down list for displaying tags.
     * @private
     */
    _createDropDownList: function() {
      this._dropDownList = domConstruct.create("div", {
        id: this._gridId
      }, this._containerNode);
      domClass.add(this._dropDownList, "drop-down-list");
      domStyle.set(this._dropDownList, "width", this.minWidth);
    },

    /**
     * Filter the tags by uniqueness.
     * @param tags
     * @returns {Array}
     * @private
     */
    _getUniqueTags: function(tags) {
      var strippedTags = [],
        stripped;
      // strip HTML and only add tag if it still has content
      // https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/1976
      array.forEach(tags, lang.hitch(this, function(tag) {
        stripped = this._stripHTML(tag);
        if(esriLang.isDefined(stripped) && stripped.length > 0) {
          strippedTags.push(stripped);
        }
      }));

      return array.filter(strippedTags, lang.hitch(this, function(tag, pos) {
        return array.indexOf(strippedTags, tag) === pos;
      }));
    },

    /**
     * Strip HTML from a string.
     * @param str
     * @returns {*}
     * @private
     */
    _stripHTML: function(str) {
      return str.replace(/<(?:.|\s)*?>/g, "");
    },

    /**
     * Encode specific characters with HTML entity codes.
     * @param str
     * @returns {*}
     * @private
     */
    _htmlEncode: function (str) {
      return (!str) ? str : string.escape(str);
    },

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Returns true if the widget is valid given its constraints, false otherwise.
     * If 'required' is set, then one or more tags are required in order to be valid.
     * @returns {*|boolean}
     */
    isValid: function() {
      var value = this.get("value");
      return !this.required || (esriLang.isDefined(value) && value.length > 0);
    },

    /**
     * Support for dijit/form/Form validation.
     */
    validate: function() {
      if(this._created && !this.isValid()) {
        domAttr.set(this.domNode, "aria-invalid", "true");
        this._displayMessage(this.i18n.required);
      } else {
        domAttr.set(this.domNode, "aria-invalid", "false");
        this._clearMessage();
      }
    },

    /**
     * Reset support in case this is a child of a dijit/form/Form.
     */
    reset: function() {
      this.clearTags();
    },

    /**
     * Assign focus to this widget. Will trigger validation checks
     * and display the validation message if the widget is required
     * and input doesn't meet validation requirements.
     */
    focus: function() {
      // focus on widget to trigger any validation warning
      focusUtil.focus(this.domNode);
      // then ensure caret set in input
      if(this._isIE8) {
        this._textTags.focus();
      } else {
        this._inputTextBox.focus();
      }
    },

    /**
     * Pre-populate the list of selected tags.
     * @param tags
     */
    prepopulate: function(tags) {
      array.forEach(tags, lang.hitch(this, function(tag, i) {
        this._createTags(tag);
        this._store.remove(tag);
      }));
    },

    /**
     * Clear the selected tags.
     */
    clearTags: function() {
      var tags = query(this._CSS_STYLES.CLASS_SELECTOR + this._CSS_STYLES.CHOICE, dom.byId(this.id)),
          changing = false,
          tagValue;
      if(tags.length > 0) {
        changing = true;
        array.forEach(tags, lang.hitch(this, function(tag, i) {
          try {
            tagValue = query(this._CHOICE_ALL_SELECTOR, dom.byId(this.id))[0].title;
            this._store.add({
              tag: tagValue
            });
          } catch(e) {
          }
          domConstruct.destroy(tag);
          this._emitRemoved(tagValue);
        }));
        this.values = [];
        if(changing) {
          this._emitChanged();
        }
      }
    },

    /**
     * Ensure tags are styled.
     * @param tags
     * @param srcNodeRef
     */
    addStyledTags: function(tags, srcNodeRef) {
      domClass.add(dom.byId(srcNodeRef), this._CSS_STYLES.MULTI);
      var list = domConstruct.create("ul", null, dom.byId(srcNodeRef));
      // add style to the list of tags
      domClass.add(list, this._CSS_STYLES.CHOICES);
      domStyle.set(list, "border", "none");
      array.forEach(tags, function(item, i) {
        var listItemNode = domConstruct.create("li", null, list);
        domStyle.set(listItemNode, "padding", "3px 5px 3px 5px");
        // add style to new tag
        domClass.add(listItemNode, "select2-search-resultSet");
        var listItemDivNode = domConstruct.create("div", {
          title: item
        }, listItemNode);
        html.set(listItemDivNode, item);
      });
    }
  });
});
