dojo.provide("esri.tests.crs.scripts.coolio.actions");
dojo.require("dojo.cookie");
dojo.require("dijit.ProgressBar");

coolio.actions.foo = function() { dojo.byId("coolioOutput").innerHTML = "coolio.actions.foo was called"; }