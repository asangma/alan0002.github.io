define([
    "../../core/declare",
    "dojo/Evented"
], function (declare, Evented) {

    return declare([Evented], {

        metadata: null,

        constructor: function () {
            this.metadata = {
                name: "StdGeographyName",
                address: "address"
            };
        },

        getData: function () {
            throw new Error("Not implemented"); //abstract
        }

    });

});