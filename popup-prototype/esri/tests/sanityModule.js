dojo.provide("esri.tests.sanityModule");  

try {
  //arcgis portal
  dojo.require("esri.tests.arcgis.sanityModule");

  //createmap
  dojo.require("esri.tests.createmap.sanityModule");
	
  //geometry tests
  dojo.require("esri.tests.geometry.sanityModule");
  
  //graphic tests
  dojo.require("esri.tests.graphic.sanityModule");


 //json tests
  dojo.require("esri.tests.json.sanityModule");

 //layers tests
  dojo.require("esri.tests.layers.sanityModule");
  
  
  //misc tests
  dojo.require("esri.tests.misc.sanityModule");

  //map tests
  dojo.require("esri.tests.map.sanityModule");

  
  //renderer tests
  dojo.require("esri.tests.renderer.sanityModule");
  
  //simplifiedapi tests
  dojo.require("esri.tests.simplifiedapi.sanityModule");
  
  //symbol tests
  dojo.require("esri.tests.symbols.sanityModule");

  //task tests
  dojo.require("esri.tests.tasks.sanityModule");

  
  //Time tests
  dojo.require("esri.tests.time.sanityModule");

  
  //virtualearth tests
  dojo.require("esri.tests.virtualearth.sanityModule");
  
  //crs
  dojo.require("esri.tests.crs.sanityModule");

  //esrinamespace test
  dojo.require("esri.tests.esrinamespace.sanityModule");
  
  //jsoncrs (json parsing fix)
  dojo.require("esri.tests.jsoncrs.sanityModule");
  

}
catch (e) {
  dojo.debug(e);
}