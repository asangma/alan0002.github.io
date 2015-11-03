define(
[
  "../core/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/kernel",

  "dojo/keys",
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/dom-class",
  "dojo/dom-geometry",
  "dojo/on",
  "dojo/window",

  "dojo/i18n!../nls/jsapi",

  "../core/domUtils",
  "../geometry/Extent",
  "./BookmarkItem",
  "../core/Evented"
], function(
  declare, lang, array, dojoNS,
  keys, on, dom, domConstruct, domClass, domGeometry, win,
  jsapiBundle,
  domUtils, Extent, BookmarkItem, esriEvented
) {
  var BM = declare(esriEvented, {
    declaredClass: "esri.widgets.Bookmarks",

    constructor: function (params, srcNodeRef) {
      this.map = params.map;
      this.editable = params.editable;
      this.initBookmarks = params.bookmarks;
      this._clickHandlers = this._mouseOverHandlers = this._mouseOutHandlers = this._removeHandlers = this._editHandlers = [];
      this.bookmarkDomNode = domConstruct.create("div");
      domClass.add(this.bookmarkDomNode, "esriBookmarkList");
      this.bookmarkTable = domConstruct.create("table");
      domClass.add(this.bookmarkTable, "esriBookmarkTable");
      this.bookmarkDomNode.appendChild(this.bookmarkTable);
      srcNodeRef = dom.byId(srcNodeRef);
      srcNodeRef.appendChild(this.bookmarkDomNode);
      this.scrNodeRef = srcNodeRef;
      domClass.add(this.scrNodeRef, "esriBookmarks");
      this._addInitialBookmarks();
    },
    
    emitRemove: function () {
      this.emit("remove");
    },

    addBookmark: function (bookmarkItem) {
      var newBookmark;
      if (bookmarkItem.declaredClass == "esri.widgets.BookmarkItem") {
        newBookmark = bookmarkItem;
        this.bookmarks.push(newBookmark);
      } else {
        var newExtent = new Extent(bookmarkItem.extent);
        newBookmark = new BookmarkItem({
          name: bookmarkItem.name,
          extent: newExtent
        });
        this.bookmarks.push(newBookmark);
      }
      
      var domNode;
      if (this.editable) {
        var localStrings = jsapiBundle.widgets.bookmarks;
        var bookmarkEditStr = localStrings.NLS_bookmark_edit;
        var bookmarkRemoveStr = localStrings.NLS_bookmark_remove;
        domNode = domConstruct.create("div", {
          innerHTML: "<div class='esriBookmarkLabel'>" + bookmarkItem.name + "</div><div title='" + bookmarkRemoveStr + "' class='esriBookmarkRemoveImage'><br/></div><div title='" + bookmarkEditStr + "' class='esriBookmarkEditImage'><br/></div>"
        });
        var editImage = dojoNS.query('.esriBookmarkEditImage', domNode)[0];
        var removeImage = dojoNS.query('.esriBookmarkRemoveImage', domNode)[0];
        this._removeHandlers.push(on(removeImage, "click", this._removeBookmark.bind(this)));
        this._editHandlers.push(on(editImage, "click", this._editBookmarkLabel.bind(this)));
      } else {
        domNode = domConstruct.create("div", {
          innerHTML: "<div class='esriBookmarkLabel' style='width: 210px;'>" + bookmarkItem.name + "</div>"
        });
      }
      domClass.add(domNode, "esriBookmarkItem");
      var bookmarkExtent;
      if (bookmarkItem.extent.declaredClass == "esri.geometry.Extent") {
        bookmarkExtent = bookmarkItem.extent;
      } else {
        bookmarkExtent = new Extent(bookmarkItem.extent);
      }

      var bookmarkLabel = dojoNS.query('.esriBookmarkLabel', domNode)[0];
      this._clickHandlers.push(on(bookmarkLabel, "click", lang.hitch(this, "_onClickHandler", bookmarkItem)));
      this._mouseOverHandlers.push(on(domNode, "mouseover", function () {
        domClass.add(this, "esriBookmarkHighlight");
      }));
      this._mouseOutHandlers.push(on(domNode, "mouseout", function () {
        domClass.remove(this, "esriBookmarkHighlight");
      }));
      var table = this.bookmarkTable;
      var insertPosition;
      if (this.editable) {
        //insertPosition = table.rows.length - 1;
        insertPosition = table.rows.length;
      } else {
        insertPosition = table.rows.length;
      }
      var newRow = table.insertRow(insertPosition);
      var newCell = newRow.insertCell(0);
      newCell.appendChild(domNode);
      
      win.scrollIntoView(domNode);
    },

    removeBookmark: function (bookmarkName) {
      var i;
      var bookMarksDom = dojoNS.query(".esriBookmarkLabel", this.bookmarkDomNode);
      var removedBookmarks = array.filter(bookMarksDom, function (item) {
        return item.innerHTML == bookmarkName;
      });
      array.forEach(removedBookmarks, function (removedBookmark) {
        removedBookmark.parentNode.parentNode.parentNode.parentNode.removeChild(removedBookmark.parentNode.parentNode.parentNode);
      });
      for (i = this.bookmarks.length - 1; i >= 0; i-- ) {
        if (this.bookmarks[i].name == bookmarkName) {
          this.bookmarks.splice(i, 1);
        }
      }
      this.emitRemove();
    },

    hide: function () {
      domUtils.hide(this.bookmarkDomNode);
    },

    show: function () {
      domUtils.show(this.bookmarkDomNode);
    },

    destroy: function () {
      this.map = null;
      array.forEach(this._clickHandlers, function (handler) {
        handler.remove();
      });
      array.forEach(this._mouseOverHandlers, function (handler) {
        handler.remove();
      });
      array.forEach(this._mouseOutHandlers, function (handler) {
        handler.remove();
      });
      array.forEach(this._removeHandlers, function (handler) {
        handler.remove();
      });
      array.forEach(this._editHandlers, function (handler) {
        handler.remove();
      });
      domConstruct.destroy(this.bookmarkDomNode);
    },

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
      var jsonArray = [];
      array.forEach(this.bookmarks, function (bookmarkItem, idx) {
        jsonArray.push(bookmarkItem.toJSON());
      });
      return jsonArray;
    },

    _addInitialBookmarks: function () {
      if (this.editable) {
        var localStrings = jsapiBundle.widgets.bookmarks;
        var addBookmarkStr = localStrings.NLS_add_bookmark;
        var newBookmarkDom = domConstruct.create("div", {
          innerHTML: "<div>" + addBookmarkStr + "</div>"
        });
        domClass.add(newBookmarkDom, 'esriBookmarkItem');
        domClass.add(newBookmarkDom, 'esriAddBookmark');
        this._clickHandlers.push(on(newBookmarkDom, "click", this._newBookmark.bind(this)));
        this._mouseOverHandlers.push(on(newBookmarkDom, "mouseover", function () {
          domClass.add(this, "esriBookmarkHighlight");
        }));
        this._mouseOutHandlers.push(on(newBookmarkDom, "mouseout", function () {
          domClass.remove(this, "esriBookmarkHighlight");
        }));
        /*
        var table = this.bookmarkTable;
        var newRow = table.insertRow(0);
        var newCell = newRow.insertCell(0);
        newCell.appendChild(newBookmarkDom);
        */
        //instead of adding the "Add Bookmark" to the last row of the table,
        //add it to the bottom of the widget, so that table can be scrolled without having to overlap with this.
        this.scrNodeRef.appendChild(newBookmarkDom);
      }
      this.bookmarks = [];
      array.forEach(this.initBookmarks, function (bookmarkItem, idx) {
        this.addBookmark(bookmarkItem);
      }, this);
    },

    _removeBookmark: function (e) {
      this.bookmarks.splice(e.target.parentNode.parentNode.parentNode.rowIndex, 1);
      e.target.parentNode.parentNode.parentNode.parentNode.removeChild(e.target.parentNode.parentNode.parentNode);
      this.emitRemove();
    },

    _editBookmarkLabel: function (e) {
      var node = e.target.parentNode;
      var position = domGeometry.position(node, true);
      var y = position.y;
      var editBox = domConstruct.create("div", {
        innerHTML: "<input type='text' class='esriBookmarkEditBox' style='left:" + position.x + "px; top:" + y + "px;'/>"
      });
      this._inputBox = dojoNS.query("input", editBox)[0];
      this._label = dojoNS.query('.esriBookmarkLabel', node)[0];
      var localStrings = jsapiBundle.widgets.bookmarks;
      var untitled = localStrings.NLS_new_bookmark;
      if (this._label.innerHTML == untitled) {
        this._inputBox.value =  "";
      }
      else {
        this._inputBox.value = this._label.innerHTML;
      }
      on(this._inputBox, "keyup", function(key){
        switch(key.keyCode){
          case keys.ENTER:
            this._finishEdit();
            break;
          default:
            break;     
        }
      }.bind(this));
      on(this._inputBox, "blur", this._finishEdit.bind(this));
      node.appendChild(editBox);
      this._inputBox.focus();
      
      // check input box position after focus; might have changed if bookmark is inside a scrolled list
      position = domGeometry.position(node, true);
      this._inputBox.style.left = position.x + "px";
      this._inputBox.style.top = position.y + "px";
    },
    
    _finishEdit: function () {
      //when using the enter key to finish the adding, it removes the textbox,
      //which triggers onblur, then it tries to remove the textbox again.
      //workaround here
      try {      
        this._inputBox.parentNode.parentNode.removeChild(this._inputBox.parentNode);
      }
      catch (error) {
        //don't worry, it's guarded.
      }
      var localStrings = jsapiBundle.widgets.bookmarks;
      var untitled = localStrings.NLS_new_bookmark;
      if (this._inputBox.value == "") {
        this._label.innerHTML = untitled;
      }
      else {
        this._label.innerHTML = this._inputBox.value;
      }
      var bookMarksDom = dojoNS.query(".esriBookmarkLabel", this.bookmarkDomNode);
      array.forEach(this.bookmarks, function (bookmarkItem, idx) {
        bookmarkItem.name = bookMarksDom[idx].innerHTML;
      });
      this.emit("edit");
    },

    _newBookmark: function () {
      var map = this.map,
          localStrings = jsapiBundle.widgets.bookmarks,
          bookmarkName = localStrings.NLS_new_bookmark,
          mapExtent = map.extent,
          normalizedExtent;
          
      if (map.spatialReference.isWrappable()) {
        var xmin = Extent.prototype._normalizeX(mapExtent.xmin, map.spatialReference._getInfo()).x;
        var xmax = Extent.prototype._normalizeX(mapExtent.xmax, map.spatialReference._getInfo()).x;
        if (xmin > xmax) {
          //means the extent crosses date time line
          //choose the bigger part as the new extent
          var webMercatorFlag = map.spatialReference.isWebMercator(),
              maxX = webMercatorFlag ? 20037508.342788905 : 180,
              minX = webMercatorFlag ? -20037508.342788905 : -180,
              newXmin, newXmax;
          if (Math.abs(xmin - maxX) >  Math.abs(xmax - minX)) {
            newXmin = xmin;
            newXmax = maxX;
          }
          else {
            newXmin = minX;
            newXmax = xmax;
          }
          normalizedExtent = new Extent(newXmin, mapExtent.ymin, newXmax, mapExtent.ymax, map.spatialReference);
        }
        else {
          normalizedExtent = new Extent(xmin, mapExtent.ymin, xmax, mapExtent.ymax, map.spatialReference);
        }      
      }
      else {    
        normalizedExtent = mapExtent;
      }

      var bookmarkItem = new BookmarkItem({
        "name": bookmarkName,
        "extent": normalizedExtent
      });
      this.addBookmark(bookmarkItem);
      var bookmarkItemNodes = dojoNS.query('.esriBookmarkItem', this.bookmarkDomNode);
      var newBookmarkItemNode = bookmarkItemNodes[bookmarkItemNodes.length - 1];
      var e = {
        "target": {
          "parentNode": null
        }
      };
      e.target.parentNode = newBookmarkItemNode;
      this._editBookmarkLabel(e);
    }, 
    
    _onClickHandler: function (bookmarkItem){
      var bookmarkExtent = bookmarkItem.extent;
      if (!bookmarkItem.extent.declaredClass) {
        bookmarkExtent = new Extent(bookmarkItem.extent);
      }
      this.map.setExtent(bookmarkExtent);
      this.emit("click");
    }
  });

  return BM;
});
