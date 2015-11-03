define([
    "../../core/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/promise/all",
    "dojo/has",
    "../../kernel"
  ],
  function (declare,
            lang,
            array,
            promise,
            has,
            esriNS
    ) {

    var PluginAnalysisLayers = declare(null, {

      constructor: function(parameters) {
        lang.mixin(this, parameters);
      },

      fetchData: function () {
        this._portal = this.parent._portal;
        this._user = this._portal.getPortalUser();
        var groupQuery;
        return this._fetchGroups().then(lang.hitch(this, function (result) {
          groupQuery = array.map(result || [], function (group) {
            if (group) {
              return "group:\"" + group.id + "\"";
            }
          }).join(" OR ");
          return this._fetchGroupItems(groupQuery);
        }));
      },

      _fetchGroup: function (name, queryParams) {
        this._groups = this._groups || [];
        return this._groups[name] || this._portal.queryGroups(queryParams, true).then(lang.hitch(this, function (groups) {
          if(groups.total > 0 && groups.results) {
            this._groups[name] = groups.results;
          }
          return this._groups[name] || [];
        }));
      },

      _fetchGroupItems: function (groupQuery, query) {
        //console.log(groupQuery);
        var searchQuery = "(type:\"Map Service\" OR type:\"Feature Service\") typekeywords:\"Analysis Ready\" " + "(" + groupQuery + ")" +
            (query ? (" " + query) : "");
        
        if (!this._portal.user.demographics) {
          searchQuery += " -typekeywords:\"Requires Credits\"";
        } 
        //console.log(searchQuery);
        return this.parent._fetchItems(searchQuery);
      },

      _fetchGroups: function() {
        return this._fetchEsriAnalysisLayers();
      },

      _fetchEsriAnalysisLayers: function() {
        var esriAnalysisGroupQuery, params, countryCode ;
        countryCode = (this._portal && this._portal.region) || (this._portal.user && this._portal.user.region) || this._portal.ipCntryCode || "US";
        if (countryCode === "WO") {
          esriAnalysisGroupQuery = "title:\"Featured Maps And Apps\" AND owner:esri";
        } else {
          esriAnalysisGroupQuery = "(title:\"Featured Maps And Apps\" AND owner:esri) OR (tags:\"gallery\" AND owner:\"Esri_cy_" + countryCode + "\")";
        }        
        params = {"q": esriAnalysisGroupQuery, "num":100, "start":0};
        return this._fetchGroup("esriAnalysisLayers", params).then(lang.hitch(this, function(result){
          return result;
        }));
      }

    });

    // All plugins must implement these functions regardless of their
    // internal architecture.
    lang.mixin(PluginAnalysisLayers, {

      // Called by PluginTarget.addPlugin
      add: function(browseItemsDlg, options) {
        if (!browseItemsDlg.plugIn) {
          var parameters = options || {};
          parameters.parent = browseItemsDlg;
          browseItemsDlg.plugIn = new PluginAnalysisLayers(parameters);
        }
      },

      // Called by PluginTarget.removePlugin
      remove: function(browseItemsDlg) {
        if (browseItemsDlg.plugIn) {
          browseItemsDlg.plugIn.destroy();
          delete browseItemsDlg.plugIn;
        }
      }

    });

    return PluginAnalysisLayers;
  });