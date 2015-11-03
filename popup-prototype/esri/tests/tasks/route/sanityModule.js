dojo.provide("esri.tests.tasks.route.sanityModule");

//below param with boolean are null by default
dojo.require("esri.tests.tasks.route.routeParams_useTimeWindowsTest");
dojo.require("esri.tests.tasks.route.routeParams_preserveFirstStopTest");
dojo.require("esri.tests.tasks.route.routeParams_preserveLastStopTest");
dojo.require("esri.tests.tasks.route.routeParams_useHierarchyTest");
dojo.require("esri.tests.tasks.route.routeParams_ignoreInvalidLocationTest");
dojo.require("esri.tests.tasks.route.routeParams_findBestSequenceTest");
dojo.require("esri.tests.tasks.route.routeParams_doNotLocateOnRestrictedElementsTest");

//below param with String and String Array
dojo.require("esri.tests.tasks.route.routeParams_accumulateAttributesTest");
dojo.require("esri.tests.tasks.route.routeParams_attributeParameterValuesTest");
dojo.require("esri.tests.tasks.route.routeParams_directionsLanguageTest");
dojo.require("esri.tests.tasks.route.routeParams_directionsLengthUnitsTest");
dojo.require("esri.tests.tasks.route.routeParams_directionsTimeAttributeTest");
dojo.require("esri.tests.tasks.route.routeParams_impedanceAttributeTest");

dojo.require("esri.tests.tasks.route.routeParams_outputGeometryPrecisionUnitsTest");
dojo.require("esri.tests.tasks.route.routeParams_outputLinesTest");
dojo.require("esri.tests.tasks.route.routeParams_restrictionAttributesTest");
dojo.require("esri.tests.tasks.route.routeParams_restrictUTurnsTest");

//number param
dojo.require("esri.tests.tasks.route.routeParams_outputGeometryPrecisionTest");

//other param
dojo.require("esri.tests.tasks.route.routeParams_outSpatialReferenceTest");

//routeResult
dojo.require("esri.tests.tasks.route.routeResult_stopsTest");
dojo.require("esri.tests.tasks.route.routeResult_routeTest");
dojo.require("esri.tests.tasks.route.routeResult_DirectionsTest");

//directionsFeatureSet properties
dojo.require("esri.tests.tasks.route.directionsFeatureSet_propertiesTest");
dojo.require("esri.tests.tasks.route.routeTask_onSolveCompleteTest");

//barriers
dojo.require("esri.tests.tasks.route.returnBarriersTest");
dojo.require("esri.tests.tasks.route.returnPolygonBarriersTest");
dojo.require("esri.tests.tasks.route.returnPolylineBarriersTest");


//stops
dojo.require("esri.tests.tasks.route.returnStopsTest");
