dojo.provide("esri.tests.tasks.find.sanityModule");

dojo.require("esri.tests.tasks.find.findTaskTest");
dojo.require("esri.tests.tasks.find.findParametersTest");
dojo.require("esri.tests.tasks.find.findResultTest");
dojo.require("esri.tests.tasks.find.findTaskTest_Base");

dojo.require("esri.tests.tasks.find.findTaskTest_Contains");

//added new tests
dojo.require("esri.tests.tasks.find.findParam_containsTest");
dojo.require("esri.tests.tasks.find.findParam_outSpatialReferenceTest");
dojo.require("esri.tests.tasks.find.findParam_returnGeometryTest");
dojo.require("esri.tests.tasks.find.findResult_displayFieldNameTest");
dojo.require("esri.tests.tasks.find.findResult_layerIdTest");
dojo.require("esri.tests.tasks.find.findResult_layerNameTest");
dojo.require("esri.tests.tasks.find.findTask_onCompleteTest");