define([

    "../../core/declare",
    "./EnrichParametersBase"

], function (declare, EnrichParametersBase) {

    var ReportParameters = declare("esri.tasks.geoenrichment.ReportParameters", [EnrichParametersBase], {
        // summary:
        //      Represents GeoenrichmentTask.createReport parameters

        // reportID: String
        //      Report ID to generate PDF or Excel file from. Use 'GeoenrichmentTask.getReports' method to get the list of available reports.
        reportID: null,

        // format: String
        //      Output report format: "pdf" or "xlsx"
        format: "pdf",

        // fields: ReportParameters.__Fields
        //      Additional choices to customize reports
        fields: null,

        constructor: function (json) {
            if (json) {
                this.reportID = json.report || json.reportID || null;
                this.format = json.format;
                this.fields = json.reportFields || json.fields || null;
            }
        },

        toJson: function () {
            var json = this.inherited(arguments);

            if (this.reportID) {
                json.report = this.reportID;
            }
            if (this.format) {
                json.format = this.format;
            }
            if (this.fields) {
                json.reportFields = this.fields;
            }

            return json;
        }

    });

    /*=====

    ReportParameters.__Fields = {
        // address: String
        //      Study area address text.
        // areadesc2: String
        //      Area description text.
        // binarylogo: String
        //      Custom logo graphic specified as MIME64 string.
        // latitude: String
        //      Study area latitude text.
        // longitude: String
        //      Study area longitude text.
        // logo: String
        //      Custom logo graphic specified as a complete URL reference.
        // locationname: String
        //      Custom location name.
        // mapurl: String
        //      Replaces default background map.
        // reportstyle: String
        //      Style to get the report in. Available styles are "Screen" and "Paper". Default: "Screen".
        // subtitle: String
        //      Report subtitle
        // title: String
        //      Report title
    };
    
    =====*/

    return ReportParameters;

});