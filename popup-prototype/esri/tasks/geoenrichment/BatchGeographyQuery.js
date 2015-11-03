define([
  "../../core/declare",
  "./GeographyQuery"
], function(declare, GeographyQuery) {

  return declare("esri.tasks.geoenrichment.BatchGeographyQuery", GeographyQuery, {
    // summary:
    //      Represents BatchStandardGeographyQuery parameters to search for geographies by ID or Name

    // where: Array
    //      Array of queries, see GeographyQuery.where
    where: null,

    constructor: function(json) {
      if (json) {
          this.where = json.where || json.geographyQueries;
      }
    },

    toJson: function() {
      var json = this.inherited(arguments);
      delete json.geographyQuery;
      
      if (this.where) {
        json.geographyQueries = this.where;
      }

      return json;
    }

  });

});
