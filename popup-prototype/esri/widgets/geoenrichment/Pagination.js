define([
    "../../core/declare",
    "dojo/_base/lang",
    "dojox/mvc/Templated",
    "dojo/aspect",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-construct",
	"dojo/on",
    "dgrid/List",
    "dijit/_WidgetBase",
    "./AnimationHelper",
    "dojo/text!./templates/Pagination.html",
    "dijit/layout/ContentPane"
    
], function (
    declare,
    lang,
    Templated,
    aspect,
    domClass,
    domGeom,
    domConstruct,
    on,
    List,
    _WidgetBase,
    AnimationHelper,
    template
    
    ) {

    var Pagination = declare("esri.widgets.geoenrichment.Pagination", [_WidgetBase, Templated], {
        templateString: template,
        items: null,

        paneNode: null,

        _pageCount: 0,
        _pageSize: 0,
        currentPage: 0,
        minRows:1,
        minColumns: 1,

        scrollAnim: null,

        constructor: function () {
            this.inherited(arguments);
            this.scrollAnim = new AnimationHelper();
        },

        buildRendering: function () {
            this.inherited(arguments);
        },
        
        resize: function () {
            this.scrollAnim.finish();
            
            var items = this.items || [];
            var itemsPane = this.itemsNode.parentNode; //this.paneNode.domNode;
            var itemsNode = this.itemsNode.firstChild;
            if (!itemsNode) {
                itemsNode = domConstruct.create("div", null, this.itemsNode);
            }

            var self = this;

            var childNodes = itemsNode.childNodes;
            var marginBox = childNodes.length >= 1 ? domGeom.getMarginBox(itemsNode.firstChild) : { h: 0, w: 0, fake: true };

            function widthGreaterThenMin() {
                return itemsPane.clientWidth > marginBox.w * self.minColumns;
            }
            function heightGreaterThenMin() {
                return itemsPane.clientHeight > marginBox.h * self.minRows;
            }

            function needScroll() {
                return (itemsPane.scrollHeight - 2 > itemsPane.clientHeight && heightGreaterThenMin()) ||
                        (itemsPane.scrollWidth - 2 > itemsPane.clientWidth && widthGreaterThenMin());
            }

            while (!needScroll() && childNodes.length < items.length) {
                var node = this.createItemContainer();
                on(node, "click", lang.hitch(this, this.onItemClick, node));
                itemsNode.appendChild(node);
                if (marginBox.fake) {
                    marginBox = domGeom.getMarginBox(itemsNode.firstChild);
                }
            }
            while ((needScroll() && childNodes.length > 1) || childNodes.length > items.length) {
                domConstruct.destroy(itemsNode.lastChild);
            }

            var pageSize = this._pageSize = childNodes.length;
            var pageCount = this._pageCount = pageSize === 0 ? 0 : Math.ceil(items.length / pageSize);
            this.currentPage = this._coerceCurrentPage(this.currentPage);

            var nodeIndex = 0;
            var itemIndex = pageSize * this.currentPage;
            while (nodeIndex < pageSize && itemIndex < items.length) {
                this.updateItemContainer(childNodes[nodeIndex], items[itemIndex]);
                nodeIndex++;
                itemIndex++;
            }
            while (nodeIndex < pageSize) {
                domConstruct.destroy(itemsNode.lastChild);
                nodeIndex++;
            }

            var bulletsNode = this.bulletsNode;
            bulletsNode.innerHTML = "";
            if (pageCount > 1) {
                for (var i = 0; i < pageCount; i++) {
                    var bullet = domConstruct.create("span", { "class": "Pagination_Bullet", innerHTML: "&bull;" }, bulletsNode);
                    on(bullet, "click", lang.hitch(this, this.set, "currentPage", i));
                }
            }

            this._updateNavigationControls();
        },


        createItemContainer: function () {
        },

        updateItemContainer: function (node, item) {},

        onItemClick: function (node) {
            this.onSelect(node);
        },

        _coerceCurrentPage: function (currentPage) {
            if (currentPage < 0) {
                currentPage = 0;
            }
            else if (currentPage >= this._pageCount) {
                currentPage = this._pageCount - 1;
            }
            return currentPage;
        },

        _updateNavigationControls: function () {
            var currentPage = this.currentPage;

            //
            //update triangle buttons visibility
            //
            if (this.backNode) {
                this.backNode.style.display = currentPage > 0 ? "" : "none";
            }
            if (this.forwardNode) {
                this.forwardNode.style.display = currentPage < this._pageCount - 1 ? "" : "none";
            }
            //
            //update bullet buttons
            //
            var bullets = this.bulletsNode.childNodes;
            for (var i = 0; i < bullets.length; i++) {
                if (i == currentPage) {
                    domClass.add(bullets[i], "Pagination_BulletCurrent");
                }
                else {
                    domClass.remove(bullets[i], "Pagination_BulletCurrent");
                }
            }
        },

        _setCurrentPageAttr: function (currentPage) {
            currentPage = this._coerceCurrentPage(currentPage);
            if (this.currentPage === currentPage) {
                return;
            }
            this.scrollAnim.finish();
            var items = this.items || [];
            var itemsNode = this.itemsNode;
            var nodeIndex = 0;
            var itemIndex = this._pageSize * currentPage;
            var oldItemsNode = this.itemsNode.firstChild;
            var newItemsNode = domConstruct.create("div");

            while (nodeIndex < this._pageSize && itemIndex < items.length) {
                var node = this.createItemContainer();
                on(node, "click", lang.hitch(this, this.onItemClick, node));
                this.updateItemContainer(node, items[itemIndex]);
                newItemsNode.appendChild(node);
                nodeIndex++;
                itemIndex++;
            }

            if (currentPage === this.currentPage + 1 ) {
                itemsNode.appendChild(newItemsNode);
                this._slideAnim(itemsNode, oldItemsNode, ["Pagination_SlideAnim", "Anim_SlideLeft"]);
            }
            else if (currentPage === this.currentPage - 1 ) {
                itemsNode.insertBefore(newItemsNode, itemsNode.firstChild);
                this._slideAnim(itemsNode, oldItemsNode, ["Pagination_SlideAnim", "Anim_SlideRight"]);
            }
            else {
                itemsNode.appendChild(newItemsNode);

                this.scrollAnim.start([{
                    node: oldItemsNode,
                    classes: ["Pagination_FadeAnim", "Anim_FadeOut"]

                }, {
                    node: newItemsNode,
                    classes: ["Pagination_FadeAnim", "Anim_FadeIn"]
                }], oldItemsNode);
            }

            this.currentPage = currentPage;
            this._updateNavigationControls();
        },

        _slideAnim: function (itemsNode, oldItemsNode, slideClasses) {
            itemsNode.parentNode.style.overflow = "hidden";
            this.scrollAnim.start([{
                node: itemsNode,
                classes: slideClasses
            }], oldItemsNode).then(function () {
                itemsNode.parentNode.style.overflow = "";
            });
        },

        _back: function () {
            this.set("currentPage", this.currentPage - 1);
        },

        _forward: function () {
            this.set("currentPage", this.currentPage + 1);
        },
        
        _onSelect: function (data) {
            this.set("selectedItems", [data]);

            this.onSelect();

        },
        onSelect: function () { }
        
    });

    return Pagination;

});