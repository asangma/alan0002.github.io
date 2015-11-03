define(["require", "dojo/aspect", "dojo/_base/array", "dojo/Deferred", "dojo/when"], function(require, aspect, array, Deferred, when){
  /**
   * A mixin class to add support for instance-level "plugins". (not AMD plugins)
   * A plugin is a defined AMD module that returns an object with methods named
   * "add" and "remove". A "declaredId" property is recomended, but not required.
   * @alias esri/PluginTarget
   */
  function PluginTarget(){
    aspect.after(this.constructor._meta, "ctor", this._pluginsHandler, true);
    this._plugins = {};
  }
  
  PluginTarget.prototype = {
    
    /**
     * Add a plugin module to this target class. Fires the `plugin-add` event.
     * @param {string} id - "require" style AMD module path
     * @param {object?} options - options passed to the plugin's `add` method
     * @return {Promise} Promise resolves after the event with the plugin's id
     */
    addPlugin: function(id, options){
      var that = this,
        registered = this._plugins,
        dfd = new Deferred();
        
      try {
        require([id], function(plugin){
          
          if((id in registered)){
            dfd.resolve({
              id: registered[id].declaredId || id.replace(/\//g,".")
            });
          }
          else {
            registered[id] = plugin;
            
            when(plugin.add(that, options), function(){
              var evtData = {id: plugin.declaredId || id.replace(/\//g,".")};
              that.emit("plugin-add", evtData);
              dfd.resolve(evtData);
            }, function(err){
              dfd.reject(err);
            });
          }
          
        });
      } catch (err){
        dfd.reject(err);
      }
      
      return dfd.promise;
    },
    
    /**
     * Remove the specified plugin. Fires the `plugin-remove` event.
     * @param  {string} id - "require" style AMD module path
     */
    removePlugin: function(id){
      if(id in this._plugins){
        var plugin = this._plugins[id];
        plugin.remove(this);
        delete this._plugins[id];
        this.emit("plugin-remove", {id: plugin.declaredId || id.replace(/\//g,".")});
      }
    },
    
    _pluginsHandler: function(){
      var that = this;
      
      array.some(arguments, function(arg){
        if(arg && arg.plugins && arg.plugins instanceof Array){
          var plugins = arg.plugins,
          p, id, i;
          
          for (i = 0; i < plugins.length; i++) {
            p = plugins[i];
            id = (p instanceof Object) ? p.id : p;
            that.addPlugin(id, p.options);
          }
          
          return true; //stop processing
        }
      });
    }
    
  };
  
  return PluginTarget;
});
