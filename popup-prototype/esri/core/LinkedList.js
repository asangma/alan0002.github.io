define([
  "./declare",
  
  "../core/Accessor",
  "../core/Evented"
],
function (
  declare,
  Accessor, Evented
) {

   var LinkedList = declare([Accessor, Evented],
    /** @lends  esri/core/LinkedList.prototype */
   {
    /** 
     * the next item in the list
     * @type {Object}
     */
    next: function() {
        var n = this.item || this.first;
        if(n && n.next){
            this.item = n.next;
        } else {
            this.item = null;
        }
        return this.item;
    },
    /**
     * Add an item to the head of the list and sets the cursor to the head.
     * @param {Object} item
     * @return {esri/core/LinkedList} self
     */
    add: function(item) {
        if(!item){
            return false;
        }
        if(this.count === 0){
            this.last = item;
        } else {
            item.next = this.first;
        }
        this.first = item;
        this.item = item;
        this.count++;
        this.emit("add", item);
        return this;
    },
    /**
     * Remove an item from the list. Resets the cursor to the head.
     * @param  {Object} item
     * @return {esri/core/LinkedList} self
     */
    remove: function(item){
        if(!item && this.item != null){
            item = this.item;
        }
        var c = this.first,
            c0 = null;
        while(c != item && c.next){
            c0 = this.item;
            c = this.next();
        }
        if(c == item){
            if(c.next){
                if(!c0){
                    this.first = c.next;
                } else {
                    c0.next = c.next;
                }
            } else {
                c0.next = null;
                this.last = c0;
            }
            this.item = this.first;
            this.emit("remove", item);
        }
        return this;
    },

    reset: function(){
        this.item = this.first;
    },

    empty: function(destroy){
        this.reset();
        var c = this.item,
            c0 = c.next;
        while(c != null){
            c.next = null;
            if(destroy && c.destroy && typeof c.destroy == "function"){
                c.destroy();
            }
            c = this.item = c0;
            c0 = this.next();
        }
        this.first = null;
        this.last = null;
        return this;
    },

    first: null,
    last: null,
    count: 0
    //index: -1,
    
   });
   return LinkedList; 
});