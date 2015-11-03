define([
    "../../core/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/sniff",
    "dojo/on",
    "dojo/Deferred"
], function (
    declare,
    array,
    lang,
    domClass,
    domConstruct,
    sniff,
    on,
    Deferred
) {

    var animationend = function() {
        var bodyStyle = document.getElementsByTagName("body")[0].style;
        if (bodyStyle.animationName !== undefined) {
            animationend = function() {
                return "animationend";
            };
        }
        else if (bodyStyle.webkitAnimationName !== undefined) {
            animationend = function() {
                return "webkitAnimationEnd";
            };
        }
        else {
            animationend = function() {
                
            };
        }
        return animationend();
    };

    var AnimationItem = declare(null, {

        _oldNode: null,
        _targets: null,
        _deferred: null,

        start: function (targets, oldNode) {
            this._oldNode = oldNode;
            this._deferred = new Deferred();
            if (!animationend()) {
                this.finish();
                return this._deferred.promise;
            }
            this._targets = targets;

            on.once(targets[0].node, animationend(), lang.hitch(this, this.finish));

            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                domClass.add(target.node, target.classes);
                domClass.add(target.node, "Anim_Common");
            }
            return this._deferred.promise;
        },

        finish: function () {
            if (this._targets) {
                for (var i = 0; i < this._targets.length; i++) {
                    var target = this._targets[i];
                    domClass.remove(target.node, target.classes);
                    domClass.remove(target.node, "Anim_Common");
                }
                this._targets = null;
            }
            if (this._oldNode) {
                domConstruct.destroy(this._oldNode);
                this._oldNode = null;
            }
            this._deferred.resolve();
        }
    });

    var AnimationHelper = declare(null, {

        progress: null,

        _items: null,
        _flySurfaceNode: null,

        constructor: function (flySurfaceNode) {
            this._flySurfaceNode = flySurfaceNode;
            this._items = [];
        },

        start: function (targets, oldNode) {
            var item = new AnimationItem();
            this._items.push(item);
            if (!this.progress) {
                this.progress = new Deferred();
            }
            return item.start(targets, oldNode).then(lang.hitch(this, this._onItemFinished, item));
        },

        _onItemFinished: function (item) {
            var index = array.indexOf(this._items, item);
            if (index >= 0) {
                this._items.splice(index, 1);
                if (this._items.length === 0 && this.progress) {
                    this.progress.resolve();
                    this.progress = null;
                }
            }
        },

        finish: function () {
            var items = this._items;
            while (items.length > 0) {
                items[items.length - 1].finish();
            }
        },

        fly: function (node, className, anchors) {
            var clone = node.cloneNode(true);
            if (!anchors) {
                anchors = ["top", "left"];
            }
            if (!animationend()) {
                return clone;
            }
            var nodeRect = node.getBoundingClientRect();
            var parentRect = this._flySurfaceNode.getBoundingClientRect();
            domClass.add(clone, "Anim_FlyingObj");
            for (var i = 0; i < anchors.length; i++) {
                var anchor = anchors[i];
                var mult = anchor === "right" || anchor === "bottom" ? -1 : 1;
                clone.style[anchor] = mult * (nodeRect[anchor] - parentRect[anchor]) + "px";
            }
            this._flySurfaceNode.appendChild(clone);
            this.start([{
                node: clone,
                classes: [className]
            }], clone);
            return clone;
        }
    });

    return AnimationHelper;
});