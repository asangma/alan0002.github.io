(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/**
* Content Page
*/

var Store = _interopRequire(require("./lib/store.js"));

var Intent = _interopRequire(require("./content/intent"));

var Model = _interopRequire(require("./content/model"));

var View = _interopRequire(require("./content/view"));

var path = window.location.pathname;

if (path.includes("organization-name")) {
  console.log(path);
  var data = require("./content/data/org-content");
  console.log(data);
} else if (path.includes("groups")) {
  // var data = require('./content/data/group-content')
  var data = require("./content/data/user-content");
} else if (path.includes("favorites")) {
  // var data = require('./content/data/favorite-content')
  var data = require("./content/data/user-content");
} else if (path.includes("atlas")) {
  // var data = require('./content/data/atlas-content')
  var data = require("./content/data/user-content");
} else {
  var data = require("./content/data/user-content");
}

data.selected = [];
data.hidden = [];

localStorage.clear();
var store = Store("user-content", data);

var ROOT = document.querySelector(".js-content-view");

var intent = Intent(ROOT);
var model = Model(intent, store);
var view = View(model, ROOT);

},{"./content/data/org-content":3,"./content/data/user-content":4,"./content/intent":5,"./content/model":6,"./content/view":8,"./lib/store.js":12}],2:[function(require,module,exports){
"use strict";

var appExcludes = ["open", "publish", "export", "download", "update"];

var layerExcludes = ["configure", "publish", "download", "update"];

var mapExcludes = ["export", "publish", "configure", "download", "update"];

var publishableFileExcludes = ["open", "export", "configure"];

var dumbFileExcludes = ["open", "export", "publish", "configure"];

var actions = ["open", "export", "publish", "configure", "download", "update", "change owner", "change tags", "move to group", "share", "edit permisions"];

var types = [{
  name: "Feature Service",
  excludes: layerExcludes
}, {
  name: "File Geodatabase",
  excludes: publishableFileExcludes
}, {
  name: "Feature Collection",
  excludes: publishableFileExcludes
}, {
  name: "CSV Collection",
  excludes: publishableFileExcludes
}, {
  name: "CSV",
  excludes: publishableFileExcludes
}, {
  name: "Shapefile",
  excludes: publishableFileExcludes
}, {
  name: "GeoJson",
  excludes: publishableFileExcludes
}, {
  name: "Code Attachment",
  excludes: dumbFileExcludes
}, {
  name: "Web Mapping Application",
  excludes: appExcludes
}, {
  name: "Application",
  excludes: appExcludes
}, {
  name: "Web Map",
  excludes: mapExcludes
}, {
  name: "Map Service",
  excludes: mapExcludes
}];

module.exports = {
  actions: actions,
  types: types
};

},{}],3:[function(require,module,exports){
"use strict";module.exports = {orgid:"rOo16HdIMeOBI4Mb", total:400, start:1, num:400, nextStart:-1, currentFolder:null, items:[{id:"3b420eda93784af694eddaeee1fa9594", owner:"patrickarlt7104", created:1393135802000, modified:1407279563000, guid:null, name:null, title:"Portland Neighborhoods", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:" The original shapefile for this data is available from the City of Portland at https://www.portlandoregon.gov/bts/article/268487", tags:["portland"], snippet:"Import of neighborhood boundaries in Portland Oregon.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.839, 45.43], [-122.468, 45.658]], spatialReference:null, accessInformation:"City of Portland", licenseInfo:" Please abide by the <span style='color: rgb(0, 0, 0); font-family: sans-serif; font-size: 12px; line-height: 16.799999237060547px; background-color: rgb(255, 255, 255);'>agreement on </span><font color='#000000' face='sans-serif'><span style='font-size: 12px; line-height: 16.799999237060547px;'>https://www.portlandoregon.gov/bts/article/268487</span></font>", culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Neighborhoods_pdx/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:14854}, {id:"7f64390c13ad4f6fbd0877f3147c2954", owner:"NikolasWise", created:1427387715000, modified:1427909195000, guid:null, name:"New Construction Residential Permits", title:"New Construction Residential Permits in Portland Oregon", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"<div>Feature service consumes data from the City of Portland residential permits from the past 30 or 40 years. This layer filters type to New Construction only. Data provides all sort of totally cool stuff that is sweet as hell.</div><div><br /></div><div>http://www.fillmurray.com/460/300<br /></div><div><br /></div>Feature Service generated from running the Derive New Locations solutions:<div><i><u>Expression</u>  residential_permits where NEWCLASS is 'NEW CONSTRUCTION' </i></div>", tags:["Urban Systems", "Planning", "Parcels", "Housing", "Residential"], snippet:"Analysis Feature Service generated from Find Existing Locations showing New Construction Residential permit in the city of Portland Oregon 1990 - 2015 ish.", thumbnail:"thumbnail/133.jpeg", documentation:null, extent:[[-122.92551561443946, 45.43263567210335], [-122.47859428785532, 45.72043794922693]], spatialReference:null, accessInformation:"City of Portland", licenseInfo:"Free use.<div><br /></div><div><a href='http://www.fillmurray.com/460/300' target='_blank'>Good Job</a><br /></div>", culture:"en-us", properties:{jobId:"j1303f688fd8d49a2a6349049afa32bf1", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/DeriveNewLocations/jobs/j1303f688fd8d49a2a6349049afa32bf1"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/New Construction Residential Permits/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:23}, {id:"967db8a7756448baab90c7de385196b7", owner:"patrickarlt7104", created:1392213003000, modified:1396308770000, guid:null, name:null, title:"LA Rail Lines", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["la"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-118.38991659837446, 33.76807028526216], [-118.08066823373953, 34.16905810164268]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/RailLines1212/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:7414}, {id:"df6265d7467a43e09d6412bc24a9e94c", owner:"aaronpk", created:1275657057000, modified:1366148794073, guid:null, name:"Team Jordan - Live on Everest Map_1275427307298", title:"Live on Everest Mapping Application", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Ready To Use", "Silverlight", "Web Map"], description:"<span><span><span><span><span><span><span><span><p style='text-align: right;'></p><p style='text-align: left;'><img alt='' src='https://s3.amazonaws.com/github/ribbons/forkme_left_red_aa0000.png' /></p><p style='text-align: left;'><span style='line-height: 1.3846153846153846;'>On May 22, 9:45 AM, Jordan Romero became the youngest person to summit Mt. Everest.</span></p></span><p><span>The Live on Everest mapping application was designed by the ESRI EDN Team and <a href='http://www.arcgis.com/home/www.jordanromero.com'>Team Jordan</a> to share this climbing experie</span><span style='line-height: 1.3846153846153846;'>nce with the world. </span></p></span></span></span></span></span></span></span><span><span><span><span><span><span><span><p><span>When the team's GPS was in Track mode, their geolocation was acquired every 10 minutes and plotted on the map in &quot;near&quot; real-time, resulting in a &quot;Team Jordan is OK.  We are trekking.&quot; message.  Through this mechanism, the team was able to let everyone know exactly where they were, what they were doing, and if they were safe.  </span></p><p><span>The application also integrates with social media.  Therefore, when the team uploaded new images to Flickr, pictures were automatically geocoded and added to the map so you could essentially see what the team was experiencing. Their Facebook and Blog entries were also aggregated through a Twitter extension in order to keep everyone up to date with their latest posts.</span></p><p><span>Products, services and technologies:</span></p><p><span><a href='http://www.esri.com/software/arcgis/arcgisonline/index.html'>ArcGIS Online</a>, <a href='http://www.esri.com/software/arcgis/arcgisserver/index.html'>ArcGIS Server</a>, <a href='http://www.arcgis.com/home/item.html?id=df6265d7467a43e09d6412bc24a9e94c#/arcgisserver/apis/silverlight/index.cfm?fa=codeGallery'>ArcGIS API for Microsoft Silverlight/WPF</a></span></p><p><span><a href='http://www.findmespot.com/en/'>SPOT</a>, <a href='http://www.meteoexploration.com/'>Meteoweather</a></span></p><p><span><a href='http://www.flickr.com/'>Flickr</a>, <a href='http://twitter.com/'>Twitter</a></span></p><p><br /></p><p><img alt='' src='http://cdn.cooperhewitt.org/2012/02/23/gitHub-download-button.png' /></p><p style='text-align: right;'><br /></p><p><span></span></p></span></span></span></span></span></span></span>", tags:["Silverlight", "social media", "flickr", "twitter"], snippet:"Real-time geolocation application - Team Jordan climbing Mt. Everest", thumbnail:"thumbnail/EverestThumbnail_Small.png", documentation:null, extent:[[84.594, 27.321], [87.676, 29.751]], spatialReference:null, accessInformation:null, licenseInfo:"<br />", culture:null, properties:null, url:"http://edn1.esri.com/everest", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:2, numRatings:6, avgRating:3.928570032119751, numViews:2931}, {id:"8c70df3a65fe41888799b782009e09f6", owner:"NikolasWise", created:1427230905000, modified:1427240556000, guid:null, name:null, title:"taxlots", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["buildathon", "taxlots"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.50419083647898, 44.854008595757556], [-121.64691311441425, 45.80915498435848]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/taxlots/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:9}, {id:"3fa6ec5c225b48ca8ab3d56f268873b4", owner:"NikolasWise", created:1427224763000, modified:1427225177000, guid:null, name:null, title:"residential_permits", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["buildathon", "residential", "housing", "permits"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.92776073641969, 45.427416188647406], [-122.47431425876334, 45.72824343353439]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/residential_permits/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:13}, {id:"b083315ef60148838230df5f2f923414", owner:"NikolasWise", created:1408138200000, modified:1427395505000, guid:null, name:null, title:"Building_Footprints_pdx", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["pdx", "buildings"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.20152672561757, 45.18870619006695], [-121.91569256433102, 45.7389538485741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Building_Footprints_pdx/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:229}, {id:"78f12ffcbc9644e5bf27104a3d9bf703", owner:"NikolasWise", created:1427222699000, modified:1427222767000, guid:null, name:null, title:"Comp_Plan_BPS_150319.gdb", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Multilayer", "Service", "Hosted Service"], description:null, tags:["buildathon", "planning"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83920746703001, 45.429090720873155], [-122.46801457212878, 45.658205995501994]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Comp_Plan_BPS_150319.gdb/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:8}, {id:"10e4465ea6044bfaaa1d24a0cb0a6e80", owner:"NikolasWise", created:1427224463000, modified:1427224508000, guid:null, name:null, title:"affordable_housing", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["buildathon", "affordable", "housing"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.15192357839341, 45.13494864094282], [-121.74400624824672, 45.835444102357414]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/affordable_housing/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:9}, {id:"3fe3d88e5d5d44b6ab0fe2caa38399fd", owner:"NikolasWise", created:1408144096000, modified:1408144151000, guid:null, name:null, title:"Portland Neighborhoods", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["pdx", "neighborhoods"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83920741021238, 45.429530909362406], [-122.46803041323938, 45.658204081007284]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Neighborhoods/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:326}, {id:"02f2e39f81a64629a1dbf127b61815ce", owner:"NikolasWise", created:1408061352000, modified:1408062000000, guid:null, name:null, title:"Zoning Data", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["pdx", "zoning"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83920751133117, 45.429090720174614], [-122.46801457272088, 45.65820708375028]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Zoning_Data/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:800}, {id:"6b4a86a74f2e45f5a4f9710f71c9b551", owner:"NikolasWise", created:1399400057000, modified:1399414714000, guid:null, name:null, title:"business_licenses", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["pdx", "business"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83499999999997, 45.43499999999999], [-122.474, 45.64000000000001]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/business_licenses/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:35}, {id:"3af4c68ecc4248a0ac8a232f4c1c1ba7", owner:"NikolasWise", created:1407972665000, modified:1407974958000, guid:null, name:null, title:"Portland Streets", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["pdx", "portland", "streets"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83819252638149, 45.42955303473569], [-122.46865304576401, 45.655176462942315]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Streets/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:452}, {id:"a5e5e5ac3cfc44dfa8e90b92cd7289fb", owner:"NikolasWise", created:1408378310000, modified:1408378466000, guid:null, name:"Eliot Building Footprints", title:"Eliot Building Footprints", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j5a32f53f6f204b7c9ffe906bb276b7f0", "Service", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Building_Footprints_pdx.<div><i><u>Expression</u>  Building_Footprints_pdx completely within Portland Neighborhoods and Portland Neighborhoods where NAME is 'ELIOT' </i></div>", tags:["Analysis Result", "Find Existing Locations", "Building_Footprints_pdx"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.68035232088216, 45.533685666034096], [-122.65870133521179, 45.54819065785652]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Eliot Building Footprints/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:12}, {id:"4cdabc15592744baa53288a3072740a0", owner:"NikolasWise", created:1429110235000, modified:1429114510000, guid:null, name:"Find Locations in Portland Contours - Contours_5ft_pdx_(1)", title:"AAAAAAAAFind Locations in Portland Contours - Contours_5ft_pdx_(1)", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Portland Contours - Contours_5ft_pdx_(1)"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.70345094432786, 45.51938019069081], [-122.6310521034549, 45.55660322947741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in Portland Contours - Contours_5ft_pdx_(1)/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:15}, {id:"351617fcc3b847b2943b7d9461e6ec31", owner:"NikolasWise", created:1429732284000, modified:1429909472000, guid:null, name:"Lower Albina - Zoning Data", title:"Lower Albina - Zoning Data", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Zoning Data - Zoning_pdx.<div><i><u>Expression</u>  Zoning Data - Zoning_pdx intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Zoning Data - Zoning_pdx"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.74381633378464, 45.519346162936195], [-122.6203122294986, 45.577225097615795]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j69a8cdc5f94b40ebb94884465bd29450", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j69a8cdc5f94b40ebb94884465bd29450"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Zoning Data/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"026978eb7e0b488389dff1817ae27f7a", owner:"NikolasWise", created:1421965148000, modified:1421965435000, guid:null, name:null, title:"Hancock", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "geodesignProjectIDad036b3503cf4a558546b6810a0beca3", "geodesignUserWebMap", "Map", "Online Map", "Web Map"], description:null, tags:["architecture", "development", "geodesign", "geodesignUserWebMap"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.67318743099861, 45.53508413812163], [-122.65645044674709, 45.54242606135188]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"f8adc083077f4f7fa2bc7309d36887f4", owner:"NikolasWise", created:1429731669000, modified:1429740256000, guid:null, name:"Lower Albina - Rail Nods", title:"Lower Albina - Rail Nods", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Rail Lines - rail_nodes.<div><i><u>Expression</u>  Rail Lines - rail_nodes intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Rail Lines - rail_nodes"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.69700799983639, 45.526064000280414], [-122.66376000010492, 45.55139199926705]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jec783a10dadd46bdbfe78d9081013e66", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jec783a10dadd46bdbfe78d9081013e66"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Rail Nods/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"2a2a25eadea04a4386547fd4600eb31c", owner:"NikolasWise", created:1427570405000, modified:1427570406000, guid:null, name:null, title:"Public 2014 USA Median Household Income", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Dynamic", "Map Service", "Multilayer", "Service"], description:"<font size='2'><font style='color: rgb(77, 77, 77); font-family: '><span style='line-height: 1.5em;'>This map layer shows the median household income in the U.S. in 2014 in a multiscale map by state, county, ZIP Code, tract and block group. </span></font><span style='color: rgb(31, 73, 125);'>Median household income is estimated for 2014 in\r\ncurrent dollars, including an adjustment for inflation or cost-of-living\r\nincreases.</span><font style='color: rgb(77, 77, 77); font-family: '><br /></font></font><div style='margin: 0px; padding: 0px; color: rgb(77, 77, 77); font-family: '><font size='2'><br /></font></div><div style='margin: 0px; padding: 0px; color: rgb(77, 77, 77); font-family: '><div style='margin: 0px; padding: 0px; line-height: 18px;'><font size='2'><span style='line-height: 22px;'>The pop-up is configured to include the following information for each geography level:</span></font></div><div style='margin: 0px; padding: 0px;'><ul><li><font color='#4d4d4d' size='2'><span style='line-height: 22px;'>Median household income</span></font></li><li><font color='#4d4d4d' size='2'><span style='line-height: 22px;'>Median household income by age of householder</span></font></li><li><font color='#4d4d4d' size='2'><span style='line-height: 22px;'>Count of households by income level (Householder age 15 to 24)</span></font></li><li><font color='#4d4d4d' size='2'><span style='line-height: 22px;'>Count of households by income level (Householder age 25 to 34)<br /></span></font></li><li><font color='#4d4d4d' size='2'><span style='line-height: 22px;'>Count of households by income level (Householder age 35 to 44)<br /></span></font></li><li><font color='#4d4d4d' size='2'><span style='line-height: 22px;'>Count of households by income level (Householder age 45 to 54)<br /></span></font></li><li><font color='#4d4d4d' size='2'><span style='line-height: 22px;'>Count of households by income level (Householder age 55 to 64)<br /></span></font></li><li><font color='#4d4d4d' size='2'><span style='line-height: 22px;'>Count of households by income level (Householder age 65 to 74)<br /></span></font></li><li><font color='#4d4d4d' size='2'><span style='line-height: 22px;'>Count of households by income level (Householder age 75 plus)</span></font></li></ul><div><font size='2'><span style='line-height: 18px; overflow: auto;'><span style='line-height: 1.5em;'>T</span><span style='line-height: 1.5em; overflow: auto;'>he data shown is from Esri's </span></span><span style='line-height: 18px;'>2014 Updated Demographic</span><span style='line-height: 18px; overflow: auto;'><span style='line-height: 1.5em; overflow: auto;'> estimates using Census 2010 geographies</span></span><span style='line-height: 18px; overflow: auto;'><span style='line-height: 1.5em; overflow: auto;'>. The map adds increasing level of detail as you zoom in, from state, to county, to ZIP Code, to tract, to block group data.  </span></span><span style='line-height: 22px;'><br /></span></font></div><div><span style='line-height: 18px; overflow: auto;'><span style='line-height: 1.5em; overflow: auto;'><font size='2'><br /></font></span></span></div><font size='2'><span style='overflow: auto;'><span style='line-height: 1.5em; overflow: auto;'><span style='font-weight: bold;'>Esri's U.S. Updated Demographic (2014/2019) Data</span> – Population, age, income, sex, race, and home value marital status are among the variables included in the database. Each year, Esri's Data Development team employs its </span></span><a href='http://www.esri.com/data/esri_data/demographic-overview/data-vendor-study/about-accuracy-study' style='color: rgb(33, 117, 155); line-height: 18px; outline: none !important;' target='_blank'>proven methodologies</a><span style='line-height: 18px; overflow: auto;'><span style='line-height: 1.5em; overflow: auto;'> to update more than 2,000 demographic variables for a variety of U.S. geographies. </span></span></font></div><div style='margin: 0px; padding: 0px; line-height: 18px;'><span style='line-height: 1.5em;'><font size='2'><br /></font></span></div><div style='margin: 0px; padding: 0px; line-height: 18px;'><font size='2'><span style='line-height: 1.5em;'><b>Additional Esri Resources:</b></span><br /></font></div><div style='margin: 0px; padding: 0px;'><ul><li><a href='http://doc.arcgis.com/en/esri-demographics/' style='color: rgb(33, 117, 155); outline: none !important;' target='_blank'><font size='2'>Esri Demographics</font></a></li><li><font size='2'><a href='http://doc.arcgis.com/en/esri-demographics/data/updated-demographics.htm' style='color: rgb(33, 117, 155); outline: none !important;' target='_blank'>U.S. 2014/2019 Esri Updated Demographics</a><br /></font></li><li><font size='2'><a href='http://doc.arcgis.com/en/esri-demographics/reference/essential-vocabulary.htm' style='color: rgb(33, 117, 155); outline: none !important;' target='_blank'>Essential demographic vocabulary</a></font></li></ul></div></div>", tags:["USA", "KeyFacts", "Wealth", "Policy", "maps", "census", "population", "household", "income", "block groups", "tracts", "counties", "states", "demographics", "US", "US Census Bureau", "Census Bureau", "US Department of Commerce", "DOC", "National", "Cloud", "North America", "United States", "median", "Median Income", "median household income", "Key Facts", "KeyUSFacts", "householder", "householder age", "income level", "income range", "household income"], snippet:"This map layer shows the median household income in the U.S. in 2014 in a multiscale map by state, county, ZIP Code, tract and block group. ArcGIS Online subscription required.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-179.1473, 18.9108], [-66.9499, 71.3905]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://demographics4.arcgis.com/arcgis/rest/services/USA_Demographics_and_Boundaries_2014/MapServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"f849bf55d9a2486caf8637fdaebdd0c7", owner:"NikolasWise", created:1429109918000, modified:1429110146000, guid:null, name:"Taxlots, Lower Albina Plus", title:"Taxlots, Lower Albina Plus", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots intersects Map Notes_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.69857684190309, 45.522983621730226], [-122.6364389435826, 45.55462985952095]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jc77d441c590a4896805f52b69b83e2fe", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jc77d441c590a4896805f52b69b83e2fe"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Taxlots, Lower Albina Plus/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"34578079401e473fbaacbb8a0bab9d7b", owner:"NikolasWise", created:1429110823000, modified:1429740011000, guid:null, name:null, title:"Lower Albina Base", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["pdx", "lower albina", "base", "contours", "taxlots"], snippet:"Base layer for tile generation for Lower Albina. Shows taxlot outlines and 5ft contours (val tied to elevation).", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.705, 45.5128], [-122.6107, 45.5554]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:19}, {id:"e1e22b60651345f1b72bacd6b2e23cbf", owner:"NikolasWise", created:1421965143000, modified:1421965311000, guid:null, name:null, title:"Scenario A", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "geodesignProjectIDad036b3503cf4a558546b6810a0beca3", "geodesignScenario", "Service"], description:null, tags:["architecture", "development", "geodesign", "geodesignScenario"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/ForGeodesignIdad036b3503cf4a558546b6810a0beca3/FeatureServer", access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"4e4715eca4914939a23c45ac5f824cca", owner:"aaronpk", created:1297694481000, modified:1366148790000, guid:null, name:"Haiti_Realtime_Map.nmf", title:"Haiti Real-time Map", type:"Explorer Map", typeKeywords:["Map", "Explorer Map", "Explorer Document", "2D", "3D", "ArcGIS Explorer", "nmf"], description:"<span><span><p><span>This ArcGIS Explorer map contains social media (Twitter, Flickr, YouTube) and other GeoRSS feeds that you can use to model the disaster situation in Haiti.  </span></p><p><span>You need to download the <span><span><a href='http://www.arcgisonline.com/home/item.html?id=90a0c98594424d42a3db656a832803db'>ArcGIS Explorer Twitter Add-in</a></span> to perform your own real-time queries. <p><span><p><span></span></p><p></p></span></p><p></p><p></p></span></span></p><p></p><p><span><b>Layers</b></span></p><p><span>Flickr - <a href='http://api.flickr.com/services/feeds/geo/?tags=haiti,earthquake'>http://api.flickr.com/services/feeds/geo/?tags=haiti,earthquake</a></span></p><p><span>YouTube - <a href='http://gdata.youtube.com/feeds/api/videos?q=haiti+earthquake&amp;max-results=50&amp;v=2&amp;lr=en&amp;&amp;location=18.7086916,-72.965698&amp;location-radius=60mi'>http://gdata.youtube.com/feeds/api/videos?q=haiti+earthquake&amp;max-results=50&amp;v=2&amp;lr=en&amp;&amp;location=18.7086916,-72.965698&amp;location-radius=60mi</a></span></p><p><span>USGS - <a href='http://earthquake.usgs.gov/earthquakes/shakemap/rss.xml'>http://earthquake.usgs.gov/earthquakes/shakemap/rss.xml</a></span></p><p><span>GeoEye PortAuPrince - <a href='http://events.arcgisonline.com/ArcGIS/services//GeoEye_PortAuPrince_Jan13'>http://events.arcgisonline.com/ArcGIS/services//GeoEye_PortAuPrince_Jan13</a></span></p><p><span>UN Base Map - <a href='http://events.arcgisonline.com/ArcGIS/services//UN_Haiti_Base_Map'>http://events.arcgisonline.com/ArcGIS/services//UN_Haiti_Base_Map</a></span></p><p><span><b>Other Downloads:</b></span></p><p><span><a href='http://resources.esri.com/arcgisexplorer/900/index.cfm?fa=download'>ArcGIS Explorer</a></span></p><p><span><span><a href='http://www.arcgisonline.com/home/item.html?id=90a0c98594424d42a3db656a832803db'>ArcGIS Explorer Twitter Add-in</a></span> <p><span><p><span></span></p><p></p></span></p><p></p><p></p></span></p><p></p></span></span>", tags:["Haiti", "Twitter", "GeoRSS", "Social media", "social media", "vgi"], snippet:"This ArcGIS Explorer map contains social media (Twitter, Flickr, YouTube) and other GeoRSS feeds that you can use to model the disaster situation in Haiti.", thumbnail:"thumbnail/MapThumbnail.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:"<span><span></span></span>", culture:null, properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:1, numRatings:0, avgRating:0, numViews:259}, {id:"083cc532e6734437b94210a4a38bcfd9", owner:"NikolasWise", created:1400161555000, modified:1400176483000, guid:null, name:null, title:"PortlandCafesAudit", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["select", "portland", "cafes", "pdx", "coffee"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.75528899999999, 45.460536999999995], [-122.53689999999999, 45.60081799999998]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/PortlandCafesAudit/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:30}, {id:"c703eba8e7e348588d69ce601e4e04f2", owner:"NikolasWise", created:1399320260000, modified:1408143573000, guid:null, name:null, title:"Portland Contours", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["Contours PDX"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83912440972034, 45.42955176940826], [-122.46803363310653, 45.65620826510416]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Contours_5ft_pdx_(1)/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:17}, {id:"6ee36b9f768d431f9f2c83eb5255e92f", owner:"NikolasWise", created:1408379860000, modified:1408379889000, guid:null, name:null, title:"Portland Freight Facillities", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["pdx", "freight"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.78736849046682, 45.48858745353771], [-122.57854390329284, 45.646990672730276]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Freight_Facillities/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"c3f89809824e439a94549b506e70aaf8", owner:"NikolasWise", created:1409955401000, modified:1409957942000, guid:null, name:null, title:"USA Rail Network", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["Rail", "usa"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-158.15217840029896, 20.880175229584843], [-66.9839120317456, 64.92614594282772]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/USA_Rail_Network/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:4}, {id:"4c860330a2d944a98741b916d624271e", owner:"NikolasWise", created:1410208241000, modified:1410211629000, guid:null, name:null, title:"Rail Lines", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["rail"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-158.152192999907, 20.88017900026067], [-66.98391099999259, 64.92614800062975]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Rail_Lines/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:10}, {id:"cafed3fe485d4d7bb631038d30fbcd87", owner:"NikolasWise", created:1427221557000, modified:1427222522000, guid:null, name:null, title:"2010_Census_Data.gdb", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Multilayer", "Service", "Hosted Service"], description:null, tags:["buildathon", "census"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.85965749130091, 44.845361165776374], [-121.49681824827151, 46.39486875984364]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/2010_Census_Data.gdb/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:4}, {id:"b1fcc46807604da4897ea2e12dd9a8ce", owner:"NikolasWise", created:1427220980000, modified:1427221003000, guid:null, name:null, title:"Central_City_Development.gdb", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["buildathon", "buildings", "development"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.70093138918352, 45.4874711735984], [-122.64821340510385, 45.542544732687055]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Central_City_Development.gdb/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:4}, {id:"75918f4afa42423a9f796beee53b4cd9", owner:"NikolasWise", created:1427490473000, modified:1427490918000, guid:null, name:null, title:"NonPark_vacant_BLInon_openspace", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["Vacant Lots", "development"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83838504671921, 45.429198721870655], [-122.46877781252756, 45.646537860148676]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/NonPark_vacant_BLInon_openspace/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:5}, {id:"8926cd1be76640b5b720436fd0827493", owner:"NikolasWise", created:1427491832000, modified:1427512117000, guid:null, name:null, title:"Vacant Lots", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer"], description:null, tags:["Vacant Lots"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8384, 45.4292], [-122.4688, 45.6465]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/ArcGIS/rest/services/NonPark_vacant_BLInon_openspace/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:6}, {id:"a71df32554d64547a96ac0c0dcaf9480", owner:"NikolasWise", created:1421965141000, modified:1421965141000, guid:null, name:null, title:"Hancock - Project Web Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "geodesignProjectIDad036b3503cf4a558546b6810a0beca3", "geodesignProjectWebMap", "geodesignTemplateIDba1b0b15ba184d71ba34d12b48678baa", "geodesignTemplateWebMapID583dd44507f54fd18ab7d8c439e62e75", "Map", "Online Map", "Web Map"], description:null, tags:["architecture", "development", "geodesign", "geodesignProjectWebMap"], snippet:"Land use planning of Hancock Project", thumbnail:null, documentation:null, extent:[[-130.8691, 18.8058], [-51.7676, 56.117]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"9903e836f16b423e838a310436f8613e", owner:"aaronpk", created:1348582777000, modified:1366148967653, guid:null, name:null, title:"2012 Portland Meet Up", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["meetup", "portland"], snippet:"2012 Portland Meetup", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6895, 45.5116], [-122.6519, 45.5333]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:1, numRatings:0, avgRating:0, numViews:19}, {id:"96d6b33d0bc342839a55cb7e204adfd8", owner:"patrickarlt7104", created:1392214054000, modified:1396308777000, guid:null, name:"Drive from merge temp 1 (1 2 3 4 Minutes)", title:"Drive Times from La Rail Stations", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/CreateDriveTimeAreas/jobs/j312bc3fdf128418385f9c23457a9e736", "Service", "Hosted Service"], description:null, tags:["Analysis Result", "Drive Times"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-118.42365646399998, 33.74893760700007], [-118.01289176899996, 34.20068931600008]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Drive from merge temp 1 (1 2 3 4 Minutes)/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2582}, {id:"3b7c15047bee472a95b2266554e8b30f", owner:"patrickarlt7104", created:1392213726000, modified:1396308814000, guid:null, name:"merge temp 1", title:"LA Rail Stations", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/MergeLayers/jobs/j8b7d50fdd5d54feba92c61b8047bf130", "Service", "Hosted Service"], description:null, tags:["Analysis Result", "Merge Layers"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-118.3888949786351, 33.76807098915315], [-118.0812120171346, 34.168503996647864]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/merge temp 1/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2520}, {id:"a539e9fe98964fbca427fe84629db1be", owner:"patrickarlt7104", created:1398336639000, modified:1398351253000, guid:null, name:null, title:"Heritage Trees Portland", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:" The original shapefile for this data is available from the City of Portland at https://www.portlandoregon.gov/bts/article/268487", tags:["portland"], snippet:"Heritage trees in Portland Oregon", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.7495015860359, 45.434350202022266], [-122.50184198231008, 45.59759774005731]], spatialReference:null, accessInformation:"City of Portland", licenseInfo:" <span style='line-height: 1.3846153846153846;'>Please abide by the agreement on https://www.portlandoregon.gov/bts/article/268487</span><div><span style='line-height: 1.3846153846153846;'><br /></span></div>", culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Heritage_Trees_Portland/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:1, numRatings:0, avgRating:0, numViews:116}, {id:"1cecbde6a8ec467ab0cff3cb66fecb9d", owner:"NikolasWise", created:1400161485000, modified:1400175954000, guid:null, name:"PortlandCafesAudit.csv", title:"PortlandCafesAudit", type:"CSV", typeKeywords:["CSV"], description:null, tags:["select", "portland", "cafes", "pdx", "coffee"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"0064f04f7e164e978d080be01fcef274", owner:"NikolasWise", created:1408136563000, modified:1408137673000, guid:null, name:null, title:"Oregon Rivers", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["pdx", "rivers"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-124.80037495627111, 41.12689542735855], [-115.57252313083976, 46.53052470661367]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Rivers/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:69}, {id:"688c2c0e2cc24538ba5e9e2afa3a4d55", owner:"NikolasWise", created:1427396325000, modified:1427396366000, guid:null, name:"Mike's Property", title:"Mike's Property", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots where OWNER1 is 'BAILEYWICK PROPERTIES III LLC' </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.66145265034821, 45.54049123786054], [-122.6580517499551, 45.54172864022957]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jf4920c1074c54dba9f35c531283d2669", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jf4920c1074c54dba9f35c531283d2669"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Mike's Property/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"a16a98be8e2f40a29de895988b023840", owner:"NikolasWise", created:1427570706000, modified:1427571572203, guid:null, name:null, title:"2010Census", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Multilayer", "Service", "Hosted Service"], description:null, tags:["buildathon"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.85965749130091, 44.845361165776374], [-121.49681824827151, 46.39486875984364]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/2010Census/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"4df070f92b2a471e81ba9a6236bfb4a9", owner:"NikolasWise", created:1428769967000, modified:1428770124000, guid:null, name:"Find Locations in taxlots", title:"Find Locations in taxlots", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots where OWNER1 contains 'BAILEYWICK ' </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.66614620936717, 45.53781430975056], [-122.65300157773464, 45.544997894172134]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"je92c184635aa4c14b5240936e2b33f12", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/je92c184635aa4c14b5240936e2b33f12"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in taxlots/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"51caabbaf8f841b2b42b9c5daee24308", owner:"NikolasWise", created:1428770382000, modified:1428770556000, guid:null, name:"Find Locations in taxlots by addr", title:"Find Locations in taxlots by addr", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots where OWNERADDR contains '535 NE THOMPSON' </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.66614620936717, 45.53710851604541], [-122.65300157773464, 45.544997894172134]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j3470c53a77234b44835e8d3761ee69c7", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j3470c53a77234b44835e8d3761ee69c7"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in taxlots by addr/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"6ca3f49b66554d8aac37af0d3b369b48", owner:"NikolasWise", created:1428871408000, modified:1428871429000, guid:null, name:"Find Locations in New Construction Residential Permits in Portland Oregon", title:"Find Locations in New Construction Residential Permits in Portland Oregon", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  New Construction Residential Permits in Portland Oregon.<div><i><u>Expression</u>  New Construction Residential Permits in Portland Oregon where UNITS is 2 </i></div>", tags:["Analysis Result", "Find Existing Locations", "New Construction Residential Permits in Portland Oregon"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.738724545312, 45.45044191515667], [-122.52013763724585, 45.58581359716104]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j24a2158e8df045e1b916ec61f8781de2", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j24a2158e8df045e1b916ec61f8781de2"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in New Construction Residential Permits in Portland Oregon/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d9a819163ea842da8301d0bd5040a880", owner:"NikolasWise", created:1428871726000, modified:1428871747000, guid:null, name:"New Const. Sw foot greatter than 3000", title:"New Const. Sw foot greatter than 3000", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  New Construction Residential Permits in Portland Oregon.<div><i><u>Expression</u>  New Construction Residential Permits in Portland Oregon where SQFT is greater than 3000 </i></div>", tags:["Analysis Result", "Find Existing Locations", "New Construction Residential Permits in Portland Oregon"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.68343095515866, 45.542649933625], [-122.6372728352878, 45.55855599826892]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd67f358c592b4031af930002afee4c5f", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd67f358c592b4031af930002afee4c5f"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/New Const. Sw foot greatter than 3000/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"fcbbe850ed5f4beaa8024ba09a3a2eed", owner:"NikolasWise", created:1429114580000, modified:1429114594000, guid:null, name:"Find Locations in Portland Contours - Contours_5ft_pdx_(1)", title:"contour tiles one", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["tile", "lower albina"], snippet:"tiles yo", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.70345094432786, 45.51938019069081], [-122.6310521034549, 45.55660322947741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/contour_tiles_one/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"03bff3f3239a4fc1888a458a8f4fa87e", owner:"NikolasWise", created:1429293436000, modified:1429293486000, guid:null, name:"Find Locations in Portland Streets", title:"Find Locations in Portland Streets", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Streets.<div><i><u>Expression</u>  Portland Streets intersects Map Notes_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Portland Streets"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.69612324372316, 45.51889047656072], [-122.63587608258176, 45.556405172054035]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jfe0b4c2f33984e0e9d0725b79c38bd40", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jfe0b4c2f33984e0e9d0725b79c38bd40"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in Portland Streets/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"77c1aeb7122c42c79fc74b21fac95824", owner:"NikolasWise", created:1429731379000, modified:1429731401000, guid:null, name:"Lower Albina - Light Rail", title:"Lower Albina - Light Rail", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Light Rail Lines.<div><i><u>Expression</u>  Portland Light Rail Lines intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Portland Light Rail Lines"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.69866901264449, 45.511512687068176], [-122.56451221590046, 45.605449969030694]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jf7909bff05db4f37b5501e65d5de7db7", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jf7909bff05db4f37b5501e65d5de7db7"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Light Rail/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"e89739a322994ad8a810f8c6ec030a9d", owner:"NikolasWise", created:1429731780000, modified:1429731812000, guid:null, name:"Lower Albina - Rail Lines", title:"Lower Albina - Rail Lines", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Rail Lines.<div><i><u>Expression</u>  Rail Lines intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Rail Lines"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.73620900020839, 45.50784100033907], [-122.5436939999395, 45.56014000008432]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j9435d5aa65894808ba9477587d557ed9", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j9435d5aa65894808ba9477587d557ed9"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Rail Lines/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"c56b2872536d4587ad4baa050acc1e40", owner:"NikolasWise", created:1429732145000, modified:1429732192000, guid:null, name:"Lower Albina - Neighborhoods", title:"Lower Albina - Neighborhoods", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Neighborhoods.<div><i><u>Expression</u>  Portland Neighborhoods intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Portland Neighborhoods"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.76812048556181, 45.50535324905417], [-122.61496777278434, 45.58518327623564]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j4101bfbdeade44c884b1ed5871df9f32", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j4101bfbdeade44c884b1ed5871df9f32"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Neighborhoods/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"58f5b8a4425e41a299e6a7c9a2b156e5", owner:"aaronpk", created:1280316231000, modified:1366148791033, guid:null, name:"GeoWeb", title:"GeoWeb 2010 Real-time ArcGIS Twitter Service", type:"Map Service", typeKeywords:["Data", "Service", "Map Service", "ArcGIS Server"], description:"<span><span><span><span><p><span><span><span>This is a live ArcGIS Server service that is geocoding and tracking all conversations on Twitter for the <a href=\"http://www.geoweb.org/\" target=\"_self\">GeoWeb 2010 conference</a>.</span></span></span></p><p><span><span><span>The service can be consumed by any ArcGIS client that supports ArcGIS REST services.</span></span></span></p><p><span><span><span>Slide presentation <a href=\"http://www.slideshare.net/agup2009/building-realtime-gis-applications-with-twitter\" target=\"_self\">here</a>.</span></span></span></p></span></span></span></span>", tags:["GeoWeb", "Twitter", "ArcGIS Server"], snippet:"GeoWeb 2010 Real-time ArcGIS Twitter Service", thumbnail:"thumbnail/GeoWebTwitterService.png", documentation:null, extent:[[-147.153, -74.277], [172.892, 78.205]], spatialReference:"4326", accessInformation:null, licenseInfo:"<span><span><span><span><span><span><span></span></span></span></span></span></span></span>", culture:null, properties:null, url:"http://edn1.esri.com/ArcGIS/rest/services/GeoWeb/MapServer", access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:50}, {id:"6db3360563f6408892fa4f9b8570f632", owner:"aaronpk", created:1279021934000, modified:1366148791513, guid:null, name:"UC_Everest.nmf", title:"Team Jordan on Mt. Everest - UC 2010", type:"Explorer Map", typeKeywords:["Map", "Explorer Map", "Explorer Document", "2D", "3D", "ArcGIS Explorer", "nmf"], description:"<span><span><span><p><span>The North route Team Jordan took to climb Mt. Everest.  <span>Fly through the terrain to the summit.</span></span></p><p><span>This map is an ArcGIS Explorer Desktop .nmf map.</span></p><p><span></span></p></span></span></span>", tags:["social media", "arcgis explorer", "jordan romero"], snippet:"North Route Team Jordan took to climb Mt. Everest.", thumbnail:"thumbnail/AGXEverest.jpg", documentation:null, extent:[[85.428, 27.901], [86.361, 28.581]], spatialReference:null, accessInformation:null, licenseInfo:"<span><span><span><span></span></span></span></span>", culture:null, properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:44}, {id:"6e358cd612064494869a30a9ce37db87", owner:"patrickarlt7104", created:1389623115000, modified:1396309017000, guid:null, name:null, title:"universities-2", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["demo"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.4771383269997, 30.44075985800049], [-71.09347506099965, 47.65622714400045]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/universities-2/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2113}, {id:"0e31df6e8df14699b59437d04de0a823", owner:"smorehouse_Esri23", created:1425343259000, modified:1425495366000, guid:null, name:null, title:"National Register of Historic Places", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:"This map is drawn directly from a &quot;raw&quot; database of historic places registered with the National Park service.  In general, more information on specific places can be found at wikipedia or other online resources...", tags:["historic places"], snippet:"nps map service", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-72.2305, 41.4842], [-71.8713, 41.6271]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:23}, {id:"719ee5db3b304fcc99345b558a1a9176", owner:"patrickarlt7104", created:1425594729000, modified:1426804351000, guid:null, name:"Aggregation of Trimet Transit Stops to Portland Neighborhoods", title:"Aggregation of Trimet Transit Stops to Portland Neighborhoods", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "webmap_2.1", "Hosted Service"], description:"Feature Service generated from running the Aggregate Points solutions. Points from Trimet Transit Stops were aggregated to Portland Neighborhoods with Population", tags:["Analysis Result", "Aggregate Points", "Trimet Transit Stops", "Portland Neighborhoods with Population"], snippet:"Analysis Feature Service generated from Aggregate Points", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83674938105494, 45.432536007925506], [-122.47202418503875, 45.652877592725076]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jdd22167b50324401810fbe33934582b3", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/AggregatePoints/jobs/jdd22167b50324401810fbe33934582b3"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Aggregation of Trimet Transit Stops to Portland Neighborhoods/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:18}, {id:"253963c605ed40cba91afae21a40c675", owner:"patrickarlt7104", created:1425596448000, modified:1426804434000, guid:null, name:"Trimet Transit Stops In Portland Neighborhoods", title:"Trimet Transit Stops In Portland Neighborhoods", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "webmap_2.1", "Hosted Service"], description:"Feature Service generated from running the Aggregate Points solutions. Points from Trimet Transit Stops were aggregated to Portland Neighborhoods - Neighborhoods_pdx", tags:["Analysis Result", "Aggregate Points", "Trimet Transit Stops", "Portland Neighborhoods - Neighborhoods_pdx"], snippet:"Analysis Feature Service generated from Aggregate Points", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83674938105494, 45.432536007925506], [-122.47202418503875, 45.652877592725076]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j3d6da9d16ad142939f3b93131a9379a3", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/AggregatePoints/jobs/j3d6da9d16ad142939f3b93131a9379a3"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Trimet Transit Stops In Portland Neighborhoods/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:6}, {id:"e20400bc293947ceaeea4ff90c41d526", owner:"NikolasWise", created:1427240895000, modified:1427241222000, guid:null, name:"Summarize taxlots within Map Notes_Areas", title:"Summarize taxlots within Map Notes_Areas", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Summarize Within solution. taxlots were summarized within Map Notes_Areas", tags:["Analysis Result", "Summarize Within", "Map Notes_Areas", "taxlots"], snippet:"Analysis Feature Service generated from Summarize Within", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.66112517220634, 45.50121940320645], [-122.61812399724685, 45.50693414415285]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j88b1e2966bb74902aecf465600565f3b", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/SummarizeWithin/jobs/j88b1e2966bb74902aecf465600565f3b"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Summarize taxlots within Map Notes_Areas/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8e5e8d9269544312b6163967d432191b", owner:"NikolasWise", created:1425490406000, modified:1425490890000, guid:null, name:"Summarize Map Notes_Areas within USA Detailed Water Bodies", title:"Portland Water Bodies", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Polygons for water bodies in the Portland OR area", tags:["pdx", "rivers", "water"], snippet:"Analysis Feature Service generated from Summarize Within", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.1836662289133, 44.749231338355635], [-120.69129371603212, 45.8508434293808]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd4378d1ff3354f4a8667b104cbc30123", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/SummarizeWithin/jobs/jd4378d1ff3354f4a8667b104cbc30123"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Summarize Map Notes_Areas within USA Detailed Water Bodies/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"4303304041a2417cb453fcdab4db07c8", owner:"NikolasWise", created:1427512582000, modified:1427512589000, guid:null, name:null, title:"PlotPDXBase", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["Vacant Lots"], snippet:"Basemap for PlotPDX", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.7229, 45.5435], [-122.6341, 45.5808]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"2f0911f891734af8a933ac7d502f2703", owner:"aaronpk", created:1280149470000, modified:1366148790029, guid:null, name:null, title:"GeoWeb 2010 Real-time ArcGIS Twitter Map", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:"<span><span><span><p><span><span><span><span>This map consumes a live ArcGIS Server Twitter service and visualizes the conversations that took place for GeoWeb 2010.  </span></span></span></span></p><p><span><span><span><span>The slide presenation can be viewed <a href=\"http://www.slideshare.net/agup2009/building-realtime-gis-applications-with-twitter\" target=\"_self\">here</a>.</span></span></span></span></p></span></span></span>", tags:["Geoweb"], snippet:"This is a map of geolocated tweets for GeoWeb 2010.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-135.1585, -40.4155], [40.6228, 66.3893]], spatialReference:null, accessInformation:null, licenseInfo:"<span><span><span><span><span><span><span></span></span></span></span></span></span></span>", culture:null, properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:730}, {id:"a60d86f93720447f951ec790cfcb0dcc", owner:"jyaganeh@esri.com", created:1361299389000, modified:1361317389000, guid:null, name:null, title:"Meteors", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["meteors"], snippet:"Map based on the Meteors Feature Service", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-124.3706, 22.4827], [-67.5494, 57.1187]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:18}, {id:"05dedb7cb29448af9bfdceb428171720", owner:"aaronpk", created:1288971281000, modified:1366148789079, guid:null, name:null, title:"Esri Dev Meet Up Portland", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:"<span><span><span></span></span></span>", tags:["meetup"], snippet:"Area map", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.1532, 45.2119], [-122.1699, 45.7732]], spatialReference:null, accessInformation:null, licenseInfo:"<span><span><span></span></span></span>", culture:null, properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:86}, {id:"34b1c0bda04044cbb8f87b6d5c8e9e4e", owner:"aaronpk", created:1279127257000, modified:1366148790028, guid:null, name:null, title:"Team Jordan - AGS Service", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:null, tags:["everest", "social media", "jordan romero"], snippet:"Team Jordan - AGS Service", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[84.7677, 27.5106], [88.3026, 28.9408]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:224}, {id:"5672644adb914ea7af5046f2c6996f02", owner:"aaronpk", created:1319044866000, modified:1366148790765, guid:null, name:null, title:"Markets", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:null, tags:["Markets"], snippet:"Markets", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-87.8196882476148, 41.7850606602158], [-87.3951764116361, 41.9887540636908]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:14}, {id:"89e277fd738d4fb6a8eee1c538d7a61c", owner:"aaronpk", created:1291128718000, modified:1366148791608, guid:null, name:null, title:"2010 Portland Meet Up", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["devmeetup; portland; map"], snippet:"The first dev meet up location.", thumbnail:"thumbnail/thumbnail.png", documentation:null, extent:[[-122.702404321416, 45.4901569435511], [-122.654082984909, 45.5358495551226]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:38}, {id:"83dab4a080cd4f8099160bb1f5c83785", owner:"aaronpk", created:1297887166000, modified:1366148791432, guid:null, name:"california_storm_1297900012887", title:"California Storm", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:null, tags:["California", "storm", "rain", "snow"], snippet:"Map of Tweets for California Storm", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-136.626, 13.5739], [-56.8213, 58.0735]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:51}, {id:"9f40aad26272459eabaf7c572e8c9691", owner:"aaronpk", created:1291128415000, modified:1366148792922, guid:null, name:null, title:"Esri Dev Meet Up Seattle - 12/7/2010", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map"], description:null, tags:["devmeetup; seattle"], snippet:"The first dev meet up location.", thumbnail:"thumbnail/thumbnail.png", documentation:null, extent:[[-122.349692109084, 47.597784], [-122.319253890916, 47.625474]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:32}, {id:"9da57636fc054af7b8cf60af4f8923b1", owner:"aaronpk", created:1318328371000, modified:1366148792848, guid:null, name:"tahquitz_boy_scout_camp_1318341961962", title:"Tahquitz Boy Scout Camp", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:null, tags:["Tahquitz", "Boy Scout Camp"], snippet:"Tahquitz Boy Scout Camp", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-116.9114, 34.1621], [-116.8874, 34.1713]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:27}, {id:"d1ea9bf6c3f44d13aefefcaeb0b1045c", owner:"aaronpk", created:1315847162000, modified:1366148793887, guid:null, name:"chicago_pizza_1315861452364", title:"Chicago Pizza", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:null, tags:["pizza"], snippet:"Chicago Pizza", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-99.9866, 33.0569], [-70.0379, 45.9759]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:27}, {id:"ef06a60fdd1448c6a9a4e36d1cc27aba", owner:"aaronpk", created:1289246531000, modified:1366148794386, guid:null, name:null, title:"Esri Dev Meet Up Seattle", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:"<span></span>", tags:["devmeetup", "social media"], snippet:"Dev Meet Up location.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.4486, 47.4905], [-122.2103, 47.7164]], spatialReference:null, accessInformation:null, licenseInfo:"<span></span>", culture:null, properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:45}, {id:"4c1354367f5f40af9f7a5ba8b638f6b9", owner:"aaronpk", created:1348583035000, modified:1366148967680, guid:null, name:"2012_seattle_meetup_1348597436128", title:"2012 Seattle Meetup", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["meetup", "seattle"], snippet:"2012 Seattle Meetup", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.3542, 47.6017], [-122.3016, 47.6225]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:5}, {id:"34fe0b1f411f45f8957f503bf52a6e11", owner:"patrickarlt7104", created:1396293568000, modified:1396308506000, guid:null, name:"Summarize Graffiti Reports within Police Precinct", title:"Summarize Graffiti Reports within Police Precinct", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/SummarizeWithin/jobs/ja212d4fb359042dda9830142ed2f9763", "Service", "Hosted Service"], description:"Feature Service generated from running the Summarize Within solution. Graffiti Reports were summarized within Police Precinct", tags:["Analysis Result", "Summarize Within", "Police Precinct", "Graffiti Reports"], snippet:"Analysis Feature Service generated from Summarize Within", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-74.25559136399994, 40.49611539500006], [-73.70000906399997, 40.91553277600008]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Summarize Graffiti Reports within Police Precinct/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:21}, {id:"011a7aa51f134f03b079fc7cdc633bb0", owner:"patrickarlt7104", created:1396301720000, modified:1398270182000, guid:null, name:null, title:"Portland Parks", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"  The original shapefile for this data is available from the City of Portland at https://www.portlandoregon.gov/bts/article/268487", tags:["parks", "portland"], snippet:"City parks in Portland Oregon", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.82939979822214, 45.42352328209874], [-122.37509388958975, 45.65758453762113]], spatialReference:null, accessInformation:null, licenseInfo:"  Please abide by the <span style='color: rgb(0, 0, 0); font-family: sans-serif; font-size: 12px; line-height: 16.799999237060547px; background-color: rgb(255, 255, 255);'>agreement on </span><font color='#000000' face='sans-serif'><span style='font-size: 12px; line-height: 16.799999237060547px;'>https://www.portlandoregon.gov/bts/article/268487</span></font>", culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Parks/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:154}, {id:"191e7d0605a24a7ea42e802b4d5742bb", owner:"patrickarlt7104", created:1398255527000, modified:1398270266000, guid:null, name:null, title:"Portland Bicycle Network", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"   The original shapefile for this data is available from the City of Portland at https://www.portlandoregon.gov/bts/article/268487", tags:["portland", "cycling", "bikes"], snippet:"Bicycle network in Portland Oregon", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.84852232732496, 45.429604356882], [-122.46847943740904, 45.64439025505505]], spatialReference:null, accessInformation:"City of Portland", licenseInfo:"   Please abide by the <span style='color: rgb(0, 0, 0); font-family: sans-serif; font-size: 12px; line-height: 16.799999237060547px; background-color: rgb(255, 255, 255);'>agreement on </span><font color='#000000' face='sans-serif'><span style='font-size: 12px; line-height: 16.799999237060547px;'>https://www.portlandoregon.gov/bts/article/268487</span></font>", culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Bicycle_Network/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:9}, {id:"b67bc6da241640808b7762b65a66f9e2", owner:"patrickarlt7104", created:1398257235000, modified:1398272087000, guid:null, name:null, title:"Portland Bicycle Parking", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:" The original shapefile for this data is available from the City of Portland at https://www.portlandoregon.gov/bts/article/268487", tags:["portland", "bikes", "cycling"], snippet:"Bicycle parking locations in Portland Oregon", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.78590228488319, 45.45705780196005], [-122.5284403032808, 45.603859822243685]], spatialReference:null, accessInformation:"City of Portland", licenseInfo:" <span style='line-height: 1.3846153846153846;'>Please abide by the agreement on https://www.portlandoregon.gov/bts/article/268487</span><div><span style='line-height: 1.3846153846153846;'><br /></span></div>", culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Bicycle_Parking/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:14}, {id:"e1afea9387bf4deda6890b75f95ec8b4", owner:"patrickarlt7104", created:1398336925000, modified:1398351457000, guid:null, name:null, title:"Portland Park Tails", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:" The original shapefile for this data is available from the City of Portland at https://www.portlandoregon.gov/bts/article/268487", tags:["portland"], snippet:"Park trails in City of Portland Parks", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.88433694547471, 45.393439115739525], [-122.37431789194252, 45.65727762936744]], spatialReference:null, accessInformation:"City of Portland", licenseInfo:" <span style='line-height: 1.3846153846153846;'>Please abide by the agreement on https://www.portlandoregon.gov/bts/article/268487</span><div><span style='line-height: 1.3846153846153846;'><br /></span></div>", culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Park_Tails/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:11}, {id:"57a04b3e44d24a50899e7aaebbef4a5e", owner:"patrickarlt7104", created:1398336775000, modified:1398351233000, guid:null, name:null, title:"Portland ZIP Codes", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:" <span style='line-height: 1.3846153846153846;'>The original shapefile for this data is available from the City of Portland at https://www.portlandoregon.gov/bts/article/268487</span><div><span style='line-height: 1.3846153846153846;'><br /></span></div>", tags:["portland"], snippet:"ZIP codes in Portland Oregon", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8392075336923, 45.429530909380745], [-122.46803041323938, 45.65820707149017]], spatialReference:null, accessInformation:"City of Portland", licenseInfo:" <span style='line-height: 1.3846153846153846;'>Please abide by the agreement on https://www.portlandoregon.gov/bts/article/268487</span><div><span style='line-height: 1.3846153846153846;'><br /></span></div>", culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_ZIP_Codes/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:14}, {id:"614e1970ac2a469dbeb388b139b0b85d", owner:"amber-case", created:1399295976000, modified:1399314332000, guid:null, name:null, title:"Portland Bike Route Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["bike", "portland", "blueberry", "map"], snippet:"Description of the map.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.7047, 45.4965], [-122.5939, 45.544]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:42}, {id:"1c727f983fb249f2ae90f851f768bd5a", owner:"joslislo", created:1399400032000, modified:1399414442000, guid:null, name:null, title:"Lee County Hospitals at Risk", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:"<font face='Arial'><font size='2'>This map illustrates sites throughout the US that have marketed </font></font><span style='font-family: Verdana, Helvetica, sans-serif; font-size: 11px; line-height: normal; background-color: rgb(255, 255, 255);'>nütrino</span><font face='Arial'><font size='2'> products.  The sites are symbolized based on annual </font></font><span style='font-family: Verdana, Helvetica, sans-serif; font-size: 11px; line-height: normal; background-color: rgb(255, 255, 255);'>nütrino</span><font face='Arial'><font size='2'> product sales.  <span style='text-align: left; line-height: 18px; font-size: small; background-color: rgb(255, 255, 255);'>This is fictitious content created by Esri for educational purposes. </span><span style='text-align: left; line-height: 18px; font-size: small; background-color: rgb(255, 255, 255);'>The data and related materials are made available through Esri (http://www.esri.com) and are intended for educational purposes only (see Access and Use Constraints section).</span></font></font>", tags:["Esri Training Services", "ARC1", "Florida", "Lee Country", "storm surge"], snippet:"This map illustrates sites throughout the US that have marketed nütrino products. This is fictitious content created by Esri for educational purposes.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-82.4205, 26.2639], [-81.3658, 26.9502]], spatialReference:null, accessInformation:"This content is provided by Esri and derived from data provided by USGS GNIS.", licenseInfo:"<font size='2'><font face='Arial'>  <font style='line-height: 18px; font-size: 12px; background-color: rgb(255, 255, 255);'>Use of this Data is restricted to training, demonstration, and educational purposes only. This Data cannot be sold or used for marketing without the express written consent of Environmental Systems Research Institute Inc. THE DATA AND RELATED MATERIALS MAY CONTAIN SOME NONCONFORMITIES, DEFECTS, OR ERRORS. ESRI DOES NOT WARRANT THAT THE DATA WILL MEET USER'S NEEDS OR EXPECTATIONS; THAT THE USE OF THE DATA WILL BE UNINTERRUPTED; OR THAT ALL NONCONFORMITIES, DEFECTS, OR ERRORS CAN OR WILL BE CORRECTED. ESRI IS NOT INVITING RELIANCE ON THIS DATA, AND THE USER SHOULD ALWAYS VERIFY ACTUAL DATA. THE DATA AND RELATED MATERIALS ARE PROVIDED &quot;AS-IS,&quot; WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. IN NO EVENT SHALL ESRI AND/OR ITS LICENSOR(S) BE LIABLE FOR COSTS OF PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOST PROFITS, LOST SALES, OR BUSINESS EXPENDITURES, INVESTMENTS, OR COMMITMENTS IN CONNECTION WITH ANY BUSINESS; LOSS OF ANY GOODWILL; OR FOR ANY INDIRECT, SPECIAL, INCIDENTAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THIS AGREEMENT OR USE OF THE DATA AND RELATED MATERIALS, HOWEVER CAUSED, ON ANY THEORY OF LIABILITY, AND WHETHER OR NOT ESRI OR ITS LICENSOR(S) HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. THESE LIMITATIONS SHALL APPLY NOTWITHSTANDING ANY FAILURE OF ESSENTIAL PURPOSE OF ANY EXCLUSIVE REMEDY. In the event that the data vendor(s) has (have) granted the end user permission to redistribute the Geodata, please use proper proprietary or copyright attribution for the various data vendor(s), and provide the associated metadata file(s) with the Geodata</font><span style='line-height: 18px; font-size: 12px; background-color: rgb(255, 255, 255);'>.</span></font></font>", culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"9a588d1c6bf54ad6a9fdf8837c82c44d", owner:"kenichi", created:1405013966000, modified:1408990057000, guid:null, name:null, title:"UC Underground", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:" foo things", tags:["elfathon"], snippet:"Underground meetup spots", thumbnail:"thumbnail/esriuc.png", documentation:null, extent:[[-117.1661, 32.7022], [-117.1428, 32.717]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:110}, {id:"dc106c2972984e77ba508101e833d08f", owner:"jsievert", created:1423692581000, modified:1423693426000, guid:null, name:"zwickelmania - Density", title:"zwickelmania - Density", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Calculate Density solution.", tags:["Analysis Result", "Calculate Density", "zwickelmania"], snippet:"Analysis Feature Service generated from Calculate Density", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.95704541005198, 45.367768353589696], [-122.60119257731525, 45.58883403176735]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/zwickelmania - Density/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:6}, {id:"f989b8fef84e456ba23b7a038226f27d", owner:"jsievert", created:1423693365000, modified:1423847357000, guid:null, name:null, title:"Zwickelmania 2015", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["zwickelmania", "2015"], snippet:"Zwickelmania 2015 Map", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8317, 45.4466], [-122.4726, 45.5777]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:37}, {id:"f54c1ac3ce224ea09cfbf6123d9999a9", owner:"patrickarlt7104", created:1425594649000, modified:1425594677000, guid:null, name:"Portland Neighborhoods with Population", title:"Portland Neighborhoods with Population", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Enrich layer solution. Portland Neighborhoods - Neighborhoods_pdx were enriched", tags:["Analysis Result", "Enrich Layer", "Portland Neighborhoods - Neighborhoods_pdx"], snippet:"Analysis Feature Service generated from Enrich layer", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83674938105494, 45.432536007925506], [-122.47202418503875, 45.652877592725076]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j84b262f84b76485788dc076f9316ac23", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/EnrichLayer/jobs/j84b262f84b76485788dc076f9316ac23"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland Neighborhoods with Population/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"7be8fc073a754b3f8bff51875c743864", owner:"patrickarlt7104", created:1405531255000, modified:1427236334000, guid:null, name:"Enriched Portland Neighborhoods - Neighborhoods_pdx", title:"Enriched Portland Neighborhoods - Neighborhoods_pdx", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/EnrichLayer/jobs/j51db6ca8e3ac45b2ab69805c48123719", "Service", "Hosted Service"], description:"Feature Service generated from running the Enrich layer solution. Portland Neighborhoods - Neighborhoods_pdx were enriched", tags:["Analysis Result", "Enrich Layer", "Portland Neighborhoods - Neighborhoods_pdx"], snippet:"Analysis Feature Service generated from Enrich layer", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83674938105494, 45.432536007925506], [-122.47202418503875, 45.652877592725076]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Enriched Portland Neighborhoods - Neighborhoods_pdx/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:372}, {id:"e5bde9f32fa8432ca584a027fbfe1997", owner:"patrickarlt7104", created:1398351827000, modified:1428017293000, guid:null, name:null, title:"Portland Parks and Trees", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["portland", "parks", "trees"], snippet:"Description of the map.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.759, 45.447], [-122.571, 45.591]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"3899751c87de4c5988b2d1273c17f749", owner:"patrickarlt7104", created:1425594491000, modified:1429821836000, guid:null, name:"Portland Neighborhoods", title:"Portland Neighborhoods", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "webmap_2.1", "Hosted Service"], description:"Feature Service generated from running the Enrich layer solution. Portland Neighborhoods - Neighborhoods_pdx were enriched", tags:["Analysis Result", "Enrich Layer", "Portland Neighborhoods - Neighborhoods_pdx"], snippet:"Analysis Feature Service generated from Enrich layer", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83674938105494, 45.432536007925506], [-122.47202418503875, 45.652877592725076]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j6340405ece0745358d4257933b173fc1", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/EnrichLayer/jobs/j6340405ece0745358d4257933b173fc1"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland Neighborhoods/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:5}, {id:"25a87293c38a472f9f3b4ef6bd0d0403", owner:"aaronpk", created:1433199993000, modified:1433200021000, guid:null, name:"Drive from Salt and Straw_Points (2 Miles)", title:"Drive from Salt and Straw_Points (2 Miles)", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Create Drive Times solution.", tags:["Analysis Result", "Drive Times", "Salt and Straw_Points"], snippet:"Analysis Feature Service generated from Create Drive Times", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.7325172423943, 45.480245589867216], [-122.5887889861295, 45.58220481890311]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jb88e79e170b14655a114d6c96df41673", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/CreateDriveTimeAreas/jobs/jb88e79e170b14655a114d6c96df41673"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Drive from Salt and Straw_Points (2 Miles)/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"32b755ad7a4e4b66a408d6257901362e", owner:"aaronpk", created:1433200295000, modified:1433200331000, guid:null, name:"Drive from Salt and Straw_Points (3 Miles)", title:"Drive from Salt and Straw_Points (3 Miles)", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Create Drive Times solution.", tags:["Analysis Result", "Drive Times", "Salt and Straw_Points"], snippet:"Analysis Feature Service generated from Create Drive Times", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.75048446705321, 45.46542549110284], [-122.56857681318506, 45.59253501917244]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jfd2d791353e84a3f8bfa670adbdee887", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/CreateDriveTimeAreas/jobs/jfd2d791353e84a3f8bfa670adbdee887"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Drive from Salt and Straw_Points (3 Miles)/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"f40be048d8044f5885473cef49052ee2", owner:"aaronpk", created:1433200469000, modified:1433200495000, guid:null, name:"Drive from Salt and Straw_Points (5 10 15 Minutes)", title:"Drive from Salt and Straw_Points (5 10 15 Minutes)", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Create Drive Times solution.", tags:["Analysis Result", "Drive Times", "Salt and Straw_Points"], snippet:"Analysis Feature Service generated from Create Drive Times", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.85379028275582, 45.419610976732926], [-122.48593139561767, 45.65698814411098]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j98d444cc314b4ca99a7ba7a3abac5d0d", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/CreateDriveTimeAreas/jobs/j98d444cc314b4ca99a7ba7a3abac5d0d"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Drive from Salt and Straw_Points (5 10 15 Minutes)/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"606127d04f5b4fee8a81309e43ae3d57", owner:"NikolasWise", created:1408143570000, modified:1408145665139, guid:null, name:null, title:"Portland Curbs", type:"Feature Service", typeKeywords:["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"], description:null, tags:["pdx", "curbs"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.8377686972933, 45.42954311271277], [-122.46829305973334, 45.644858655294925]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Curbs/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:3}, {id:"e3bb939b350a49d3b5e488cfdf2dffce", owner:"NikolasWise", created:1426786706000, modified:1426786720000, guid:null, name:"Summarize Map Notes_Areas within USA Detailed Water Bodies", title:"Summarize Map Notes_Areas within USA Detailed Water Bodies", type:"Feature Collection", typeKeywords:["Data", "Feature Collection", "Singlelayer"], description:"Polygons for water bodies in the Portland OR area", tags:["what"], snippet:"huh?", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.1836662289133, 44.749231338355635], [-120.69129371603212, 45.8508434293808]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd4378d1ff3354f4a8667b104cbc30123", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/SummarizeWithin/jobs/jd4378d1ff3354f4a8667b104cbc30123"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"a683e5cce08246c096ce1da8d306eab5", owner:"NikolasWise", created:1427393738000, modified:1427394837000, guid:null, name:"Building_Footprints_pdx_geojson.geojson", title:"Building_Footprints_pdx geojson", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["pdx", "buildings"], snippet:null, thumbnail:null, documentation:null, extent:[[-123.20152672561757, 45.18870619006695], [-121.91569256433102, 45.7389538485741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"6a426641d1df4d63bdc39998de9cb99e", owner:"NikolasWise", created:1427396468000, modified:1427396485000, guid:null, name:"mikes again again", title:"mikes again again", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots where OWNERADDR is '535 NE THOMPSON ST' </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[[-122.66614620936717, 45.53051933780511], [-122.64330790331778, 45.544997894172134]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j0e797b17c9a64b8fb884e82a6e1b7414", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j0e797b17c9a64b8fb884e82a6e1b7414"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/mikes again again/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"b35efc2bc2f84d408cd65f007eb2b108", owner:"NikolasWise", created:1427393376000, modified:1427396993000, guid:null, name:"residential_permits_geojson.geojson", title:"residential_permits geojson", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.92776073641969, 45.427416188647406], [-122.47431425876334, 45.72824343353439]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"474556d356164beb95e6b021acc78461", owner:"NikolasWise", created:1427393492000, modified:1427397516000, guid:null, name:"business_licenses_geojson.geojson", title:"business_licenses geojson", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.83499999999997, 45.43499999999999], [-122.474, 45.64000000000001]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"785d6e0a6cc941539b72e23d23226a6f", owner:"NikolasWise", created:1428770809000, modified:1428770970000, guid:null, name:"Find Locations in taxlots strimer", title:"Find Locations in taxlots strimer", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots where OWNER1 contains 'STREIMER' </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.67577521586337, 45.541092874116174], [-122.67282652019776, 45.54220032248946]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j8608c01c8a714c2292b994ca0ac6a81a", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j8608c01c8a714c2292b994ca0ac6a81a"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in taxlots strimer/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"02f1a0ee7e1c4e24a7cfa6bce33ae6b4", owner:"NikolasWise", created:1429108647000, modified:1429108702000, guid:null, name:"Eliot_Building_Footprints_GeoJSON.geojson", title:"Eliot Building Footprints GeoJSON", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Building_Footprints_pdx.<div><i><u>Expression</u>  Building_Footprints_pdx completely within Portland Neighborhoods and Portland Neighborhoods where NAME is 'ELIOT' </i></div>", tags:["pdx", "footprints", "geojson"], snippet:"Yup", thumbnail:null, documentation:null, extent:[[-122.68035232088216, 45.533685666034096], [-122.65870133521179, 45.54819065785652]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"e43ad17bc3ce4c97acf810d155dd07c5", owner:"NikolasWise", created:1429112647000, modified:1429112698000, guid:null, name:"Lower_Albina_Contours.geojson", title:"Lower Albina Contours", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["geojson"], snippet:"yup", thumbnail:null, documentation:null, extent:[[-122.70345094432786, 45.51938019069081], [-122.6310521034549, 45.55660322947741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"a4c4ee76c9a64c03b260b2a5edc7d073", owner:"NikolasWise", created:1429195667000, modified:1429195694000, guid:null, name:"contours_.shp.zip", title:"contours .shp", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["shapefile"], snippet:"yup", thumbnail:null, documentation:null, extent:[[-122.70345094432786, 45.51938019069081], [-122.6310521034549, 45.55660322947741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"64dd1a2bbcfc41e59f91416ad8860536", owner:"NikolasWise", created:1429195815000, modified:1429195839000, guid:null, name:"contours_csv.zip", title:"contours csv", type:"CSV Collection", typeKeywords:["CSV Collection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["csv"], snippet:"yup", thumbnail:null, documentation:null, extent:[[-122.70345094432786, 45.51938019069081], [-122.6310521034549, 45.55660322947741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"7f0f959e7089452baca04990a7d5a930", owner:"NikolasWise", created:1429195969000, modified:1429196021000, guid:null, name:"contuors_geojson.geojson", title:"contuors geojson", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["geojson"], snippet:"again", thumbnail:null, documentation:null, extent:[[-122.70345094432786, 45.51938019069081], [-122.6310521034549, 45.55660322947741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"65f53d9002c34a8fa998fa74b4e304f8", owner:"NikolasWise", created:1429294671000, modified:1429294724000, guid:null, name:"Find_Locations_in_Portland_Streets_GeoJSON.geojson", title:"Find Locations in Portland Streets GeoJSON", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Streets.<div><i><u>Expression</u>  Portland Streets intersects Map Notes_Areas </i></div>", tags:["geojson"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[[-122.69612324372316, 45.51889047656072], [-122.63587608258176, 45.556405172054035]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jfe0b4c2f33984e0e9d0725b79c38bd40", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jfe0b4c2f33984e0e9d0725b79c38bd40"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"c82c00f63a53422ea91ab6092a0c9386", owner:"NikolasWise", created:1429731892000, modified:1429731962000, guid:null, name:"Lower Albina - Business Liscenses", title:"Lower Albina - Business Liscenses", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  business_licenses.<div><i><u>Expression</u>  business_licenses completely within Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "business_licenses"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.69700000033876, 45.5230000000949], [-122.63699999986804, 45.55200000002888]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j653114a0857d417eb28c7a25dff1bbae", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j653114a0857d417eb28c7a25dff1bbae"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Business Liscenses/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"44e9f75c3c734ebaac5fc378e89a5e1f", owner:"NikolasWise", created:1429740345000, modified:1429740395000, guid:null, name:"Lower_Albina_-_Light_Rail_Geojson.geojson", title:"Lower Albina - Light Rail Geojson", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Light Rail Lines.<div><i><u>Expression</u>  Portland Light Rail Lines intersects Study Area_Areas </i></div>", tags:["geojson"], snippet:"geojson", thumbnail:null, documentation:null, extent:[[-122.69866901264449, 45.511512687068176], [-122.56451221590046, 45.605449969030694]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jf7909bff05db4f37b5501e65d5de7db7", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jf7909bff05db4f37b5501e65d5de7db7"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"ef26b7c68ee94cbe9a8cb012c059f99b", owner:"NikolasWise", created:1429740378000, modified:1429740399000, guid:null, name:"Lower_Albina_-_Rail_Nods.geojson", title:"Lower Albina - Rail Nods", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Rail Lines - rail_nodes.<div><i><u>Expression</u>  Rail Lines - rail_nodes intersects Study Area_Areas </i></div>", tags:["geojson"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[[-122.69700799983639, 45.526064000280414], [-122.66376000010492, 45.55139199926705]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jec783a10dadd46bdbfe78d9081013e66", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jec783a10dadd46bdbfe78d9081013e66"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d4ab3bdcecec453796644f6920003607", owner:"NikolasWise", created:1429740354000, modified:1429740404000, guid:null, name:"Lower_Albina_-_Neighborhoods.geojson", title:"Lower Albina - Neighborhoods", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Neighborhoods.<div><i><u>Expression</u>  Portland Neighborhoods intersects Study Area_Areas </i></div>", tags:["geojs"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[[-122.76812048556181, 45.50535324905417], [-122.61496777278434, 45.58518327623564]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j4101bfbdeade44c884b1ed5871df9f32", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j4101bfbdeade44c884b1ed5871df9f32"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8e688c432a4b4693b45b89dae885fab1", owner:"NikolasWise", created:1429740367000, modified:1429740417000, guid:null, name:"Lower_Albina_-_Rail_Lines.geojson", title:"Lower Albina - Rail Lines", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Rail Lines.<div><i><u>Expression</u>  Rail Lines intersects Study Area_Areas </i></div>", tags:["geojson"], snippet:"yup", thumbnail:null, documentation:null, extent:[[-122.73620900020839, 45.50784100033907], [-122.5436939999395, 45.56014000008432]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j9435d5aa65894808ba9477587d557ed9", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j9435d5aa65894808ba9477587d557ed9"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"f3ad1cb7083f4cd9a40927f63337e458", owner:"NikolasWise", created:1432665146000, modified:1432665202000, guid:null, name:null, title:"Scenic Resource Zoning-Copy", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["pdx", "weird"], snippet:"weird!", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6586, 45.4704], [-122.2806, 45.6411]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"69c819a96be240d4bd79094d5f95223b", owner:"NikolasWise", created:1435084751000, modified:1435084801000, guid:null, name:"Find_Locations_in_Portland_Contours_-_Contours_5ft_pdx_28129.zip", title:"Find Locations in Portland Contours - Contours_5ft_pdx_(1)", type:"File Geodatabase", typeKeywords:["File Geodatabase"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["tag"], snippet:"hey", thumbnail:null, documentation:null, extent:[[-122.70345094432786, 45.51938019069081], [-122.6310521034549, 45.55660322947741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"fae98966d3c742e685ff1d0cd0ae159d", owner:"NikolasWise", created:1421965133000, modified:1421965137000, guid:null, name:"ForGeodesignIdad036b3503cf4a558546b6810a0beca3", title:"Hancock - Project Feature Service", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "geodesignProjectFeatureService", "geodesignProjectIDad036b3503cf4a558546b6810a0beca3", "geodesignTemplateFeatureServiceID6332f7b7a9374e49a35d5c257b8c701f", "geodesignTemplateIDba1b0b15ba184d71ba34d12b48678baa", "Service", "Hosted Service"], description:null, tags:["geodesignProjectFeatureService"], snippet:"Land use planning of Hancock Project", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/ForGeodesignIdad036b3503cf4a558546b6810a0beca3/FeatureServer", access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"c63e21c3cb734b08850c748bb098d9cd", owner:"aaronpk", created:1329225357000, modified:1366148793774, guid:null, name:"Team Jordan Antarctica Expedition_1329243357508", title:"Team Jordan Antarctica Expedition", type:"Web Mapping Application", typeKeywords:["Web Map", "Map", "Online Map", "Mapping Site", "Flex", "Ready To Use"], description:"<p>This application was developed with ArcGIS Server and the ArcGIS Flex API.  The applicaiton has three components:</p><p>1. Live GPS tracking integrated with GeoPro's geolocation system.  GPS locations were recorded and updated live every 10 minutes while the team was tracking.</p><p>2. Integrated Facebook publishing applications that extended the GPS functionality so that users could automatically publish text messages from Iridium Extreme to Facebook.</p><p>3. Community component that allows users to join and participate in a fitness challenge.  The web app is fully integrated into Facebook.</p>", tags:["Social media; geolocation; facebook"], snippet:"Live tracking and social media application used to track Team Jordan for their final 7 summits climb.", thumbnail:"thumbnail/aa-antarctica.png", documentation:null, extent:[], spatialReference:null, accessInformation:"GeoPro, Network Innovations, meteoexploration", licenseInfo:null, culture:"en-us", properties:null, url:"http://edn1.esri.com/antarctica/", access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:3}, {id:"d115bd3bc4174fa58f238b4679c6c81e", owner:"aaronpk", created:1280149586000, modified:1366148793804, guid:null, name:null, title:"DevSummit 2010 Twitter Analysis Map", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:"<span></span>", tags:["GeoWeb"], snippet:"Analysis of DevSummit Twitter information", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[155.7861, -76.452], [147.3486, 81.027]], spatialReference:null, accessInformation:null, licenseInfo:"<span></span>", culture:null, properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:40}, {id:"a9db58939b4747828db28a0b2e3f8525", owner:"paulcpederson", created:1365706107000, modified:1366152773000, guid:null, name:null, title:"GeoTroggers Service SF", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["San Francisco", "Hotspots"], snippet:"A Map of geotriggers in Downtown San Francisco, CA", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.4357, 37.7845], [-122.3844, 37.8094]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:29}, {id:"9c3f5f50559e4dd689777b07b6db6cb5", owner:"paulcpederson", created:-1, modified:1376499804636, guid:null, name:null, title:"USA Topo Road Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:"<span><span><span><span><span><p><span><span><span>This map presents land cover and detailed topographic maps for the United States. It uses the <a href='http://www.arcgis.com/home/item.html?id=99cd5fbd98934028802b4f797c4b1732' target='_self'>USA Topographic Map service</a>. The map includes the National Park Service (NPS) Natural Earth physical map at 1.24km per pixel for the world at small scales, i-cubed eTOPO 1:250,000-scale maps for the contiguous United States at medium scales, and National Geographic TOPO! 1:100,000 and 1:24,000-scale maps (1:250,000 and 1:63,000 in Alaska) for the United States at large scales. The TOPO! maps are seamless, scanned images of United States Geological Survey (USGS) paper topographic maps.</span></span></span></p><p><span><span><span>The maps provide a very useful basemap for a variety of applications, particularly in rural areas where the topographic maps provide unique detail and features from other basemaps.</span></span></span></p><p>To add this map service into a desktop application directly, go to the entry for the <a href='http://www.arcgis.com/home/item.html?id=99cd5fbd98934028802b4f797c4b1732' target='_self'>USA Topo Maps map service</a>. <br /></p><p><b>Tip:</b> Here are some famous locations as they appear in this web map, accessed by including their location in the URL that launches the map:</p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;extent=-112.818602,35.850748,-111.553801,36.555520' target='_self'>Grand Canyon, Arizona</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;extent=-122.578926,37.720084,-122.258263,37.927545' target='_self'>Golden Gate, California</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;center=-74.044939,40.689601&amp;level=14' target='_self'>The Statue of Liberty, New York</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;center=-77.036466,38.897281&amp;level=14' target='_self'>Washington DC</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;center=-109.364209,36.139685&amp;level=12' target='_self'>Canyon De Chelly, Arizona</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;center=-110.484538,44.573916&amp;level=9' target='_self'>Yellowstone National Park, Wyoming</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;center=-115.811111,37.235&amp;level=12' target='_self'>Area 51, Nevada</a></i></span></span></span></span></span></p></span></span></span></span></span>", tags:["topographic", "topography", "topo", "US", "USA", "road", "interstate"], snippet:"This map features the us road network over detailed USGS topographic maps for the United States at multiple scales.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-111.5617, 36.7043], [-104.1569, 40.8061]], spatialReference:null, accessInformation:"U.S. Geological Survey, National Geographic, i-cubed", licenseInfo:"<span style='overflow: auto;'><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><img src='http://downloads.esri.com/blogs/arcgisonline/esrilogo_new.png' />This work is licensed under the Web Services and API Terms of Use.   <br />                                <a href='http://links.esri.com/e800-summary' target='_blank'><strong>View Summary</strong></a>  |  <a href='http://links.esri.com/agol_tou' target='_blank'><strong>View Terms of Use</strong></a>    </span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>", culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"2504324912ec4dc6a8706f32fc9b301d", owner:"paulcpederson", created:-1, modified:1376500795219, guid:null, name:null, title:"Digital Aeronautical Flight Information File", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:"<span><span><span><span><span><p><span><span><span>This map presents land cover and detailed topographic maps for the United States. It uses the <a href='http://www.arcgis.com/home/item.html?id=99cd5fbd98934028802b4f797c4b1732' target='_self'>USA Topographic Map service</a>. The map includes the National Park Service (NPS) Natural Earth physical map at 1.24km per pixel for the world at small scales, i-cubed eTOPO 1:250,000-scale maps for the contiguous United States at medium scales, and National Geographic TOPO! 1:100,000 and 1:24,000-scale maps (1:250,000 and 1:63,000 in Alaska) for the United States at large scales. The TOPO! maps are seamless, scanned images of United States Geological Survey (USGS) paper topographic maps.</span></span></span></p><p><span><span><span>The maps provide a very useful basemap for a variety of applications, particularly in rural areas where the topographic maps provide unique detail and features from other basemaps.</span></span></span></p><p>To add this map service into a desktop application directly, go to the entry for the <a href='http://www.arcgis.com/home/item.html?id=99cd5fbd98934028802b4f797c4b1732' target='_self'>USA Topo Maps map service</a>. <br /></p><p><b>Tip:</b> Here are some famous locations as they appear in this web map, accessed by including their location in the URL that launches the map:</p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;extent=-112.818602,35.850748,-111.553801,36.555520' target='_self'>Grand Canyon, Arizona</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;extent=-122.578926,37.720084,-122.258263,37.927545' target='_self'>Golden Gate, California</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;center=-74.044939,40.689601&amp;level=14' target='_self'>The Statue of Liberty, New York</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;center=-77.036466,38.897281&amp;level=14' target='_self'>Washington DC</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;center=-109.364209,36.139685&amp;level=12' target='_self'>Canyon De Chelly, Arizona</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;center=-110.484538,44.573916&amp;level=9' target='_self'>Yellowstone National Park, Wyoming</a></i></span></span></span></span></span></p><p><span><span><span><span><span><i><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=931d892ac7a843d7ba29d085e0433465&amp;center=-115.811111,37.235&amp;level=12' target='_self'>Area 51, Nevada</a></i></span></span></span></span></span></p></span></span></span></span></span>", tags:["imagery", "flight", "aeronautics", "flight information", "airports", "navy"], snippet:"Aeronautic Routes and Flight Information with Imagery Basemap", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-88.3064, 41.7002], [-87.3808, 42.1905]], spatialReference:null, accessInformation:"U.S. Geological Survey, National Geographic, i-cubed", licenseInfo:"<span style='overflow: auto;'><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><img src='http://downloads.esri.com/blogs/arcgisonline/esrilogo_new.png' />This work is licensed under the Web Services and API Terms of Use.   <br />                                <a href='http://links.esri.com/e800-summary' target='_blank'><strong>View Summary</strong></a>  |  <a href='http://links.esri.com/agol_tou' target='_blank'><strong>View Terms of Use</strong></a>    </span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>", culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"bbf45b28b8994f189987482e7762a847", owner:"paulcpederson", created:1392047341000, modified:1392065341000, guid:null, name:null, title:"ArcGIS Online World Navigation Charts-Copy", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:"<span><span><img alt='ArcGIS Online' src='http://www.arcgis.com/home/images/esri-94GlobeLogo_4C.png' /><span><span><br />The World Navigation Charts is hosted by ArcGIS Online.  <br /><br /></span></span></span></span><a href='http://www.arcgis.com/home/item.html?id=83e5d4e5401143a18b50b853fc63b350' target='_self'>More information about this map</a><br /><span><span><span><span><br /><a href='http://www.esri.com/software/arcgis/arcgisonline/standard-maps.html' target='_self'>List of other map services hosted by ArcGIS Online</a></span></span></span></span><span><span></span></span>", tags:["ArcGIS Online", "basemap", "ESRI", "hosted services"], snippet:"World Navigation Charts hosted by ArcGIS Online.  You can use the search to quickly find an address or place you're interested in.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.9382, 46.5843], [-121.1037, 47.9099]], spatialReference:null, accessInformation:null, licenseInfo:"<span><span></span></span>", culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"ac8d7f7fad274c7b9464244a5f03f52c", owner:"patrickarlt7104", created:1398786849000, modified:1398801264000, guid:null, name:null, title:"Park Tiles", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Hosted Service"], description:"  The original shapefile for this data is available from the City of Portland at https://www.portlandoregon.gov/bts/article/268487", tags:["tile"], snippet:"City parks in Portland Oregon", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.82939979822214, 45.42352328209874], [-122.37509388958975, 45.65758453762113]], spatialReference:null, accessInformation:null, licenseInfo:"  Please abide by the <span style='color: rgb(0, 0, 0); font-family: sans-serif; font-size: 12px; line-height: 16.799999237060547px; background-color: rgb(255, 255, 255);'>agreement on </span><font color='#000000' face='sans-serif'><span style='font-size: 12px; line-height: 16.799999237060547px;'>https://www.portlandoregon.gov/bts/article/268487</span></font>", culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Park_Tiles/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"39e1cd236169412fac9f5d441240b27f", owner:"jsievert", created:1404757785000, modified:1404774614000, guid:null, name:null, title:"Portland", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["elf"], snippet:"Portland map for testing", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6852, 45.5134], [-122.6754, 45.517]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:32}, {id:"79bff54d6c124f3abf9885148bf7b4a5", owner:"MCharbonneau_Esri23", created:1405002214000, modified:1405016752000, guid:null, name:null, title:"Ruperts Points of Interest", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:"<br /><font size='4'><span><span><span><span><span><span><span><font face='Verdana'><b>To view this map : </b></font></span></span></span></span></span></span></span></font><b><font face='Verdana' size='4'><a href='http://storymaps.esri.com/stories/shortlist-sandiego/' target='_self'>click here</a></font></b><br /><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><font size='3'>  </font><br /><p><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span>I  am lucky enough to live in San Diego and love sharing information about  the city and region with others, so he</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><span><span><span><span><span><span><span>re is a map with some of my recommended places to go. I've aimed to give you a useful quick overview of the area and highlight some great places to go to get you started whether you have just a few hours or a few days free. The map is especially useful if you are attending a convention in downtown San Diego and would like to find places to visit in downtown and also perhaps get to the beach during your stay, with or without a car. <br /></span></span></span></span></span></span></span></p><p><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span>This web map is the underlying map used in the <a href='http://storymaps.esri.com/stories/shortlist-sandiego/' target='_blank'>San Diego Shortlist story map</a> which utilizes the Esri Story Maps Shortlist application template. For more information see the </span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><a href='http://storymaps.arcgis.com/en/app-list/shortlist/' target='_blank'>Shortlist section</a><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span> of the </span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><a href='http://storymaps.arcgis.com' target='_blank'>Story Maps website</a><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span>.</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><span style='line-height: 1.3846153846153846;'> </span></p><p><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><br /></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></p><p><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><b>Quick San Diego tips<br /> </b></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></p><p><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><i>Click the link below to go to that area on the map. The map will be launched in your browser using a basic template automatically zoomed in on that area (via extent parameters included in the URL).<br /></i></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></p><p><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><i><br /></i></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></p><ul><li><a href='http://www.arcgis.com/apps/OnePane/basicviewer/index.html?&amp;extent=%7B%22xmin%22:-13043228.831849137,%22ymin%22:3856150.4546638354,%22xmax%22:-13040847.340686565,%22ymax%22:3857958.6681142542,%22spatialReference%22:%7B%22wkid%22:102100%7D%7D&amp;appid=e5f5244d34f4429999a44b07246e4f5a' target='_blank'>The Gaslamp Quarter</a><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span> is the famous partying hub of San Diego, centered along Fifth Avenue between Harbor Drive to the south and C Street to the north. Historic Victorian buildings with many clubs, restaurants, bars, and shops. Very lively, fun and busy. </span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></li></ul><p><br /></p><ul><li><a href='http://www.arcgis.com/apps/OnePane/basicviewer/index.html?&amp;extent=%7B%22xmin%22:-13044243.438159544,%22ymin%22:3857651.851369913,%22xmax%22:-13041861.946996972,%22ymax%22:3859500.6719916095,%22spatialReference%22:%7B%22wkid%22:102100%7D%7D&amp;appid=e5f5244d34f4429999a44b07246e4f5a' target='_blank'>Little Italy</a><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span> in downtown San Diego is a quieter alternative to the Gaslamp for a place to go. More relaxed and less hectic. India Street between Ash to the south and Hawthorn to the north.  You can walk there from the Convention Center or take a rickshaw, and it also has its own trolley station. Some great modern architecture and many restaurants and cafes reflecting the area's Italian heritage.</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span> <a href='http://www.caffeitalialittleitaly.com' target='_blank'>Caffe Italia</a><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span> is the unofficial community center. On Saturday mornings (9am - 1.30pm) there is a great open air street market, the </span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><a href='http://www.littleitalysd.com/mercato/' target='_blank'>Little Italy Mercato</a><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span>. It's a great way to spend the morning in San Diego. Just head to the intersection of Date and India. There are plenty of food vendors at the market so you can get brunch as you browse.</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></li></ul><p><br /></p><ul><li><a href='http://www.arcgis.com/apps/OnePane/basicviewer/index.html?&amp;extent=%7B%22xmin%22:-13057981.598084053,%22ymin%22:3872519.2237081947,%22xmax%22:-13048455.633434025,%22ymax%22:3879752.0775096696,%22spatialReference%22:%7B%22wkid%22:102100%7D%7D&amp;appid=e5f5244d34f4429999a44b07246e4f5a' target='_blank'>La Jolla</a> has the most beautiful coastline in San Diego and is your best bet for an afternoon or day at the beach or exploring the coast. La Jolla Shores beach is all-round the nicest beach in the area with excellent swimming, changing rooms, easy parking, harmless leopard sharks, kayak and surf/SUP board rental shops one block away, etc. You can explore the rocky La Jolla Cove with its coastal trail and sea caves, and see baby seals at Children's Pool. You can also browse the shops, galleries and restaurants in trendy upscale La Jolla Village, or visit the excellent Birch Aquarium which is part of the Scripps Institution of Oceanography. </li></ul><p><br /></p><ul><li><a href='http://www.arcgis.com/apps/OnePane/basicviewer/index.html?&amp;extent=%7B%22xmin%22:-13055578.609007304,%22ymin%22:3863408.8853991967,%22xmax%22:-13046052.644357277,%22ymax%22:3870641.7392006717,%22spatialReference%22:%7B%22wkid%22:102100%7D%7D&amp;appid=e5f5244d34f4429999a44b07246e4f5a' target='_blank'>Mission Beach</a><b> </b>is the epicenter of beach culture in San Diego. It's a peninsula with the ocean and a lively boardwalk on one side, and peaceful Mission Bay Park on the other. Charming alleyways with tiny beach houses criss-cross the peninsula. Mission Bay Park has a great bike/jogging path around the lovely Sail Bay in its northwest corner. Just to the north is the busy Pacific Beach commercial area and Crystal Pier, and just north of there is the quieter Pacific Beach, with its mellow surfing scene. This area is not as swimming friendly as La Jolla Shores because of the heavy shore break. You can rent sailboats, kayaks, and SUP boards, for use on Mission Bay. SeaWorld is on the south edge of Mission Bay.</li></ul><p><br /></p><ul><li><a href='http://www.arcgis.com/apps/OnePane/basicviewer/index.html?&amp;extent=%7B%22xmin%22:-13042597.450020635,%22ymin%22:3858578.2665868955,%22xmax%22:-13040215.958858063,%22ymax%22:3860386.4800373143,%22spatialReference%22:%7B%22wkid%22:102100%7D%7D&amp;appid=e5f5244d34f4429999a44b07246e4f5a' target='_blank'>Balboa Park</a> just northeast of downtown, is one of the country's largest urban cultural parks. It is a great place to spend some free time: Botanic building, huge lily pond, the Old Globe Theater, and museums (including the Timken Museum of Art which is a great way to see masterpieces of art because there is no admission charge!).</li></ul><p><br /></p><p><b>Transit tip: How do I get to Mission Beach, La Jolla and SeaWorld from downtown San Diego without a car?</b></p><p>A yellow cab can work especially if you have a group. Or to get to Mission Beach, Pacific Beach, La Jolla Village, and La Jolla Shores take <a href='http://www.sdcommute.com/Services/Route.aspx?r=30' target='_self'>bus route 30</a> which leaves Broadway in downtown San Diego up to 4 times an hour on weekdays before 7pm. After 7pm or weekends, simply take the Green line <a href='http://www.sdmts.com/trolley/trolley.asp' target='_self'>trolley</a> north from downtown or Green line trolley west from Mission Valley to the Old Town Transit Center, and you can pick up bus route 30 there. Also at Old Town Transit Center you can take <a href='http://www.sdcommute.com/Services/Route.aspx?r=8' target='_self'>bus route 8</a> which goes to Mission Beach and Pacific Beach and <a href='http://www.sdcommute.com/Services/Route.aspx?r=9' target='_self'>bus route 9</a> which goes to Pacific Beach via <a href='http://www.seaworld.com/sandiego/' target='_self'>SeaWorld</a>. A $5 day pass is good for all trolleys and bus routes. <span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><br /></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></p><p><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span>A really fun and innovative alternative to a conventional car rental is the <a href='http://www.car2go.com' target='_blank'>Car2Go</a>  program, which is an innovative fleet of electric Smart Cars you can  rent anywhere in the city by the minute, hour, or day, but you have to  join the program ahead of time to get your member card: <a href='http://sandiego.car2go.com/' target='_self'>http://sandiego.car2go.com/</a></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>. <br /></p><p><br /></p><p><b>For more information</b></p><p><span><span><span><span><span><span><span>The official San Diego visitor website </span></span></span></span></span></span></span><a href='http://www.sandiego.org' target='_blank'>http://www.sandiego.org</a><span><span><span><span><span><span><span> has a useful list of </span></span></span></span></span></span></span><a href='http://www.sandiego.org/article/Visitors/795' target='_blank'>25 fun and free things to do</a><span><span><span><span><span><span><span>.</span></span></span></span></span></span></span></p><p><span><span><span><span><span><span><span>San Diego Union Tribune things to do section: </span></span></span></span></span></span></span><a href='http://www.utsandiego.com/news/night-and-day' target='_blank'>http://www.utsandiego.com/news/night-and-day</a><br /></p><p><span><span><span><span><span><span><span>San Diego CityBeat weekly paper: </span></span></span></span></span></span></span><a href='http://www.sdcitybeat.com' target='_blank'>http://www.sdcitybeat.com</a></p><p><span><span><span><span><span><span><span>San Diego Magazine has good info about events and things to do: </span></span></span></span></span></span></span><a href='http://www.sandiegomagazine.com/' target='_blank'>http://www.sandiegomagazine.com/</a></p><p><span><span><span><span><span><span><span>San Diego trolley info: </span></span></span></span></span></span></span><a href='http://www.sdmts.com/trolley/trolley.asp' target='_blank'>http://www.sdmts.com/trolley/trolley.asp</a></p><p><span><span><span><span><span><span><span>San Diego bus info and regional transit: </span></span></span></span></span></span></span><a href='http://www.sdmts.com/' target='_blank'>http://www.sdmts.com/</a></p><p><span><span><span><span><span><span><span>Car2Go - a 100% electric fleet of super-cute Smart Cars you can rent to get around San Diego: </span></span></span></span></span></span></span><a href='http://www.car2go.com/' target='_blank'>http://www.car2go.com</a></p></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><p><span><span><span><span><span><span><span>Here's a TripAdvisor page that features info from this map: </span></span></span></span></span></span></span><a href='http://www.tripadvisor.com/Travel-g60750-c120025/San-Diego:California:Places.To.Visit.html' target='_blank'>http://www.tripadvisor.com/Travel-g60750-c120025/San-Diego:California:Places.To.Visit.html</a></p><p>Modern San Diego: <a href='http://www.modernsandiego.com/' target='_blank'>http://www.modernsandiego.com/</a></p><p><br /></p><p><b><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span>Esri User Conference: </span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></b><a href='http://www.esri.com' target='_blank'>Esri</a><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span>, who make the ArcGIS mapping system, holds its </span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><a href='http://www.esri.com/events/user-conference/index.html' target='_blank'>annual user conference</a><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span> in San Diego every year in the San Diego Convention Center downtown. I work for Esri and if you are attending the user conference, I hope this map helps you make the most of your spare time in San Diego, and perhaps gives you some ideas of maps and presentations you can make with ArcGIS!! For example, a city could use this Shortlist template to showcase planning improvements, a military base could use it to highlight environmental remediation efforts, or researchers could use it to make it easy for people to find sites of special scientific interest on the beds of the oceans, etc.<br /></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></p><p><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><br /></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></p><p><span style='overflow: auto;'><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span style='font-weight: bold;'>Anyone can make this map!!!!!</span> <br /></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></p><p><span style='overflow: auto;'><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span>This map simply contains seven shapefiles that I assembled in ArcMap and then zipped up and uploaded into an ArcGIS web map that uses the light grey basemap. (You could also upload or reference the points via a CSV file). In the shapefiles, my place descriptions are quite long so they are divided over multiple text fields in the shapefiles, each with a maximum of 254 characters (the max length allowed in a shapefile). This works out quite nicely because in mapping apps that use the map, the developer you can choose how long the descriptions will be in the popups by including either all the Description fields or just the first ones. I also have text fields in the shapefiles containing the URL to each photo, the URL of the website for each place, etc. The photos are all resized to 200x150 pixels (which is the recommended size for including in popups) and stored on a web server I have access to. I configured the popups using ArcGIS Explorer Online which gives you more options, such as the ability to have a 'Website' link in each popup that links to the value of the website field for each feature. I also created the presentation slides using ArcGIS Explorer Online. The map is displayed in a web mapping app using a new Story Map template we created. This template will be available in the Fall.</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></p><p><br /></p><p style='font-style: italic;'><font size='2'>Inspiration for this map and the Shortlist template came from <a href='http://flipboard.com/' target='_blank'>Flipboard</a>, <a href='http://www.coolhunting.com/' target='_blank'>Cool Hunting</a>, <a href='http://www.architizer.com' target='_blank'>Architizer</a>, and Richard Saul Wurman's Access guides.<br /></font></p><p><br /></p><p><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><br /></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></p></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>", tags:["elfathon"], snippet:"Rupert Essinger from the Esri Story Maps team shares a selection of cool places to go in this Southern Californian beach city where he lives.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-117.3561, 32.6582], [-117.012, 32.899]], spatialReference:null, accessInformation:"The basemaps used in this map include data from SanGIS (the City and County of San Diego) and San Diego Association of Governments (SANDAG)", licenseInfo:"<span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span>This disclaimer applies to this web map and the San Diego Shortlist web mapping application that uses this web map. This map is not supported by advertising and the institutions and businesses shown on it where selected purely by the map's author as subjective editorial content.  <br /><br />These recommended places are unofficial and responsibility for the accuracy and utility of the places on this map is mine alone and does not reflect the views or commercial interests of my employer, Esri, who make the ArcGIS mapping system. I have no commercial interests in any of the businesses recommended here, and have not received any sort of payment or benefit from their inclusion in the map. <br /></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>", culture:"en-us", properties:null, url:null, access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"535b5444bc67480684ae062b597ceb13", owner:"jsievert", created:1406658134000, modified:1408642855000, guid:null, name:null, title:"Alcohol", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Presentation Map", "Web Map"], description:" Added by pat", tags:["portland alcohol"], snippet:"Alcohol Spending", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.9244, 45.3437], [-122.2405, 45.5879]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:10}, {id:"312b16bd34884523b4c2ae3a38168ffc", owner:"patrickarlt7104", created:1410990375000, modified:1410990376000, guid:null, name:null, title:"Traffic", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Service Proxy"], description:"<div style='text-align:Left;'><div><div><p style='margin:0 0 0 0;'><span>The map layers in this service provide color-coded maps of the traffic conditions you can expect for the present time (the default). The map shows present traffic as a blend of live and typical information. Live speeds are used wherever available and are established from real-time sensor readings. Typical speeds come from a record of average speeds, which are collected over several weeks within the last year or so. Layers also show current incident locations where available. </span></p><p style='margin:0 0 0 0;'><span>By changing the map time, the service can also provide past and future conditions. Live readings from sensors are saved for 12 hours, so setting the map time back within 12 hours allows you to see a actual recorded traffic speeds, supplemented with typical averages by default. You can choose to turn off the average speeds and see only the recorded live traffic speeds for any time within the 12-hour window. Predictive traffic conditions are shown for any time in the future.</span></p><p style='margin:0 0 0 0;'><span>The color-coded traffic map layer can be used to represent relative traffic speeds; this is a common type of a map for online services and is used to provide context for routing, navigation, and field operations. A color-coded traffic map can be requested for the current time and any time in the future. A map for a future request might be used for planning purposes.</span></p><p style='margin:0 0 0 0;'><span>The map also includes dynamic traffic incidents showing the location of accidents, construction, closures, and other issues that could potentially impact the flow of traffic. Traffic incidents are commonly used to provide context for routing, navigation and field operations. Incidents are not features; they cannot be exported and stored for later use or additional analysis.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Data source</span></p><p style='margin:0 0 0 0;'><span>Esri’s typical speed records and live and predictive traffic feeds come directly from HERE (</span><a href='http://www.HERE.com'><span><span>www.HERE.com</span></span></a><span><span>). HERE collects billions of GPS and cell phone probe records per month and, where available, uses sensor and toll-tag data to augment the probe data collected. An advanced algorithm compiles the data and computes accurate speeds. </span></span><span>The real-time and predictive traffic data is updated every five minutes through traffic feeds.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Data coverage</span></p><p style='margin:0 0 0 0;'><span>The service works globally and can be used to visualize traffic speeds and incidents in many countries. Check the </span><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=b7a893e8e1e04311bd925ea25cb8d7c7&amp;extent=-142.207,-43.4529,152.0508,70.729'><span><span>service coverage web map</span></span></a><span /><span> to determine availability in your area of interest. Look at the coverage map to learn whether a country currently supports traffic. The support for traffic incidents can be determined by identifying a country. For detailed information on this service, visit the </span><a href='http://links.esri.com/arcgis-online-network-analysis-rest-api'><span><span>directions and routing documentation</span></span></a><span /><span><span> and the </span></span><a href='http://links.esri.com/arcgis-online-traffic-arcmap'><span><span>ArcGIS Help</span></span></a><span>.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Symbology</span></p><p style='margin:0 0 0 0;'><span>Traffic speeds are displayed as a percentage of free-flow speeds, which is frequently the speed limit or how fast cars tend to travel when unencumbered by other vehicles. The streets are color coded as follows:</span></p><ul><li><p><span>Green (fast): 85 - 100% of free flow speeds</span></p></li><li><p><span>Yellow (moderate): 65 - 85%</span></p></li><li><p><span>Orange (slow); 45 - 65%</span></p></li><li><p><span>Red (stop and go): 0 - 45%</span></p></li></ul><p><span>To view live traffic only—that is, excluding typical traffic conditions—enable the Live Traffic layer and disable the Traffic layer. (You can find these layers under World/Traffic &gt; [region] &gt; [region] Traffic). To view more comprehensive traffic information that includes live and typical conditions, disable the Live Traffic layer and enable the Traffic layer.</span></p><p><span style='font-weight:bold;'>ArcGIS Online organization subscription</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Important Note:</span><span><span>The World Traffic map service is available for users with an ArcGIS Online organizational subscription. To access this map service, you'll need to sign in with an account that is a member of an organizational subscription. If you don't have an organizational subscription, you can create a new account and then sign up for a </span></span><a href='https://www.arcgis.com/about/trial.html'><span><span>30-day trial of ArcGIS Online</span></span></a><span>.</span></p></div></div></div>", tags:["Live Traffic", "Real time traffic", "traffic map", "traffic accidents", "incidents", "congestion", "traffic"], snippet:"This map service presents near real-time traffic information for different regions in the world. The data is updated every 5 minutes. This map service requires an ArcGIS Online organizational subscription.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-180, -59.5368], [180, 83.7257]], spatialReference:"102100", accessInformation:"Esri, HERE", licenseInfo:null, culture:"en-us", properties:null, url:"http://utility.arcgis.com/usrsvcs/servers/312b16bd34884523b4c2ae3a38168ffc/rest/services/World/Traffic/MapServer", sourceUrl:"http://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"0a283cc1c0634c0db03b2bcb84dbc50c", owner:"paulcpederson", created:1377644360000, modified:1416352678000, guid:null, name:"Enriched banks", title:"Enriched banks", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/EnrichLayer/jobs/jd7cd82a97475421cac0d70b31cda64e0", "Service", "Hosted Service"], description:"Feature Service generated from running the Enrich layer solution. banks were enriched", tags:["Analysis Result", "Enrich Layer", "banks"], snippet:"Analysis Feature Service generated from Enrich layer", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.75400204063543, 45.45999920787809], [-122.52500350840766, 45.59500296090092]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Enriched banks/FeatureServer", access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:51}, {id:"c73f39a8063a4be2b97dea7f7726e3e5", owner:"patrickarlt7104", created:1417538448000, modified:1417538448000, guid:null, name:null, title:"Traffic Stuff", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Dynamic", "Map Service", "Multilayer", "Service"], description:"<div style='text-align:Left;'><div><div><p style='margin:0 0 0 0;'><span>The map layers in this service provide color-coded maps of the traffic conditions you can expect for the present time (the default). The map shows present traffic as a blend of live and typical information. Live speeds are used wherever available and are established from real-time sensor readings. Typical speeds come from a record of average speeds, which are collected over several weeks within the last year or so. Layers also show current incident locations where available. </span></p><p style='margin:0 0 0 0;'><span>By changing the map time, the service can also provide past and future conditions. Live readings from sensors are saved for 12 hours, so setting the map time back within 12 hours allows you to see a actual recorded traffic speeds, supplemented with typical averages by default. You can choose to turn off the average speeds and see only the recorded live traffic speeds for any time within the 12-hour window. Predictive traffic conditions are shown for any time in the future.</span></p><p style='margin:0 0 0 0;'><span>The color-coded traffic map layer can be used to represent relative traffic speeds; this is a common type of a map for online services and is used to provide context for routing, navigation, and field operations. A color-coded traffic map can be requested for the current time and any time in the future. A map for a future request might be used for planning purposes.</span></p><p style='margin:0 0 0 0;'><span>The map also includes dynamic traffic incidents showing the location of accidents, construction, closures, and other issues that could potentially impact the flow of traffic. Traffic incidents are commonly used to provide context for routing, navigation and field operations. Incidents are not features; they cannot be exported and stored for later use or additional analysis.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Data source</span></p><p style='margin:0 0 0 0;'><span>Esri’s typical speed records and live and predictive traffic feeds come directly from HERE (</span><a href='http://www.HERE.com'><span><span>www.HERE.com</span></span></a><span><span>). HERE collects billions of GPS and cell phone probe records per month and, where available, uses sensor and toll-tag data to augment the probe data collected. An advanced algorithm compiles the data and computes accurate speeds. </span></span><span>The real-time and predictive traffic data is updated every five minutes through traffic feeds.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Data coverage</span></p><p style='margin:0 0 0 0;'><span>The service works globally and can be used to visualize traffic speeds and incidents in many countries. Check the </span><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=b7a893e8e1e04311bd925ea25cb8d7c7&amp;extent=-142.207,-43.4529,152.0508,70.729'><span><span>service coverage web map</span></span></a><span /><span> to determine availability in your area of interest. Look at the coverage map to learn whether a country currently supports traffic. The support for traffic incidents can be determined by identifying a country. For detailed information on this service, visit the </span><a href='http://links.esri.com/arcgis-online-network-analysis-rest-api'><span><span>directions and routing documentation</span></span></a><span /><span><span> and the </span></span><a href='http://links.esri.com/arcgis-online-traffic-arcmap'><span><span>ArcGIS Help</span></span></a><span>.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Symbology</span></p><p style='margin:0 0 0 0;'><span>Traffic speeds are displayed as a percentage of free-flow speeds, which is frequently the speed limit or how fast cars tend to travel when unencumbered by other vehicles. The streets are color coded as follows:</span></p><ul><li><p><span>Green (fast): 85 - 100% of free flow speeds</span></p></li><li><p><span>Yellow (moderate): 65 - 85%</span></p></li><li><p><span>Orange (slow); 45 - 65%</span></p></li><li><p><span>Red (stop and go): 0 - 45%</span></p></li></ul><p><span>To view live traffic only—that is, excluding typical traffic conditions—enable the Live Traffic layer and disable the Traffic layer. (You can find these layers under World/Traffic &gt; [region] &gt; [region] Traffic). To view more comprehensive traffic information that includes live and typical conditions, disable the Live Traffic layer and enable the Traffic layer.</span></p><p><span style='font-weight:bold;'>ArcGIS Online organization subscription</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Important Note:</span><span><span>The World Traffic map service is available for users with an ArcGIS Online organizational subscription. To access this map service, you'll need to sign in with an account that is a member of an organizational subscription. If you don't have an organizational subscription, you can create a new account and then sign up for a </span></span><a href='https://www.arcgis.com/about/trial.html'><span><span>30-day trial of ArcGIS Online</span></span></a><span>.</span></p></div></div></div>", tags:["Live Traffic", "Real time traffic", "traffic map", "traffic accidents", "incidents", "congestion", "traffic"], snippet:"This map service presents near real-time traffic information for different regions in the world. The data is updated every 5 minutes. This map service requires an ArcGIS Online organizational subscription.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-180, -59.5368], [180, 83.7257]], spatialReference:"102100", accessInformation:"Esri, HERE", licenseInfo:null, culture:"en-us", properties:null, url:"http://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"20a43fced32745309c9498d28ea17c91", owner:"patrickarlt7104", created:1417538495000, modified:1417538496000, guid:null, name:null, title:"Traffic 2", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Dynamic", "Map Service", "Multilayer", "Service"], description:"<div style='text-align:Left;'><div><div><p style='margin:0 0 0 0;'><span>The map layers in this service provide color-coded maps of the traffic conditions you can expect for the present time (the default). The map shows present traffic as a blend of live and typical information. Live speeds are used wherever available and are established from real-time sensor readings. Typical speeds come from a record of average speeds, which are collected over several weeks within the last year or so. Layers also show current incident locations where available. </span></p><p style='margin:0 0 0 0;'><span>By changing the map time, the service can also provide past and future conditions. Live readings from sensors are saved for 12 hours, so setting the map time back within 12 hours allows you to see a actual recorded traffic speeds, supplemented with typical averages by default. You can choose to turn off the average speeds and see only the recorded live traffic speeds for any time within the 12-hour window. Predictive traffic conditions are shown for any time in the future.</span></p><p style='margin:0 0 0 0;'><span>The color-coded traffic map layer can be used to represent relative traffic speeds; this is a common type of a map for online services and is used to provide context for routing, navigation, and field operations. A color-coded traffic map can be requested for the current time and any time in the future. A map for a future request might be used for planning purposes.</span></p><p style='margin:0 0 0 0;'><span>The map also includes dynamic traffic incidents showing the location of accidents, construction, closures, and other issues that could potentially impact the flow of traffic. Traffic incidents are commonly used to provide context for routing, navigation and field operations. Incidents are not features; they cannot be exported and stored for later use or additional analysis.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Data source</span></p><p style='margin:0 0 0 0;'><span>Esri’s typical speed records and live and predictive traffic feeds come directly from HERE (</span><a href='http://www.HERE.com'><span><span>www.HERE.com</span></span></a><span><span>). HERE collects billions of GPS and cell phone probe records per month and, where available, uses sensor and toll-tag data to augment the probe data collected. An advanced algorithm compiles the data and computes accurate speeds. </span></span><span>The real-time and predictive traffic data is updated every five minutes through traffic feeds.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Data coverage</span></p><p style='margin:0 0 0 0;'><span>The service works globally and can be used to visualize traffic speeds and incidents in many countries. Check the </span><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=b7a893e8e1e04311bd925ea25cb8d7c7&amp;extent=-142.207,-43.4529,152.0508,70.729'><span><span>service coverage web map</span></span></a><span /><span> to determine availability in your area of interest. Look at the coverage map to learn whether a country currently supports traffic. The support for traffic incidents can be determined by identifying a country. For detailed information on this service, visit the </span><a href='http://links.esri.com/arcgis-online-network-analysis-rest-api'><span><span>directions and routing documentation</span></span></a><span /><span><span> and the </span></span><a href='http://links.esri.com/arcgis-online-traffic-arcmap'><span><span>ArcGIS Help</span></span></a><span>.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Symbology</span></p><p style='margin:0 0 0 0;'><span>Traffic speeds are displayed as a percentage of free-flow speeds, which is frequently the speed limit or how fast cars tend to travel when unencumbered by other vehicles. The streets are color coded as follows:</span></p><ul><li><p><span>Green (fast): 85 - 100% of free flow speeds</span></p></li><li><p><span>Yellow (moderate): 65 - 85%</span></p></li><li><p><span>Orange (slow); 45 - 65%</span></p></li><li><p><span>Red (stop and go): 0 - 45%</span></p></li></ul><p><span>To view live traffic only—that is, excluding typical traffic conditions—enable the Live Traffic layer and disable the Traffic layer. (You can find these layers under World/Traffic &gt; [region] &gt; [region] Traffic). To view more comprehensive traffic information that includes live and typical conditions, disable the Live Traffic layer and enable the Traffic layer.</span></p><p><span style='font-weight:bold;'>ArcGIS Online organization subscription</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Important Note:</span><span><span>The World Traffic map service is available for users with an ArcGIS Online organizational subscription. To access this map service, you'll need to sign in with an account that is a member of an organizational subscription. If you don't have an organizational subscription, you can create a new account and then sign up for a </span></span><a href='https://www.arcgis.com/about/trial.html'><span><span>30-day trial of ArcGIS Online</span></span></a><span>.</span></p></div></div></div>", tags:["Live Traffic", "Real time traffic", "traffic map", "traffic accidents", "incidents", "congestion", "traffic"], snippet:"This map service presents near real-time traffic information for different regions in the world. The data is updated every 5 minutes. This map service requires an ArcGIS Online organizational subscription.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-180, -59.5368], [180, 83.7257]], spatialReference:"102100", accessInformation:"Esri, HERE", licenseInfo:null, culture:"en-us", properties:null, url:"http://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"5b3cd42fc2c3437d819d24a65b22f05a", owner:"jsievert", created:1414706852000, modified:1421951094000, guid:null, name:"Hot Spots Food", title:"Hot Spots Food", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"Feature Service generated from running the Find Hot Spots solution.", tags:["Analysis Result", "Hot Spots", "Food"], snippet:"Analysis Feature Service generated from Find Hot Spots", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-117.27655154517517, 32.69830405516988], [-117.10914696699032, 32.85857922486693]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Hot Spots Food/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:7}, {id:"2b308a05f9304b37b1def4e15d132f8a", owner:"jsievert", created:1414707038000, modified:1425496182000, guid:null, name:"Food Density", title:"Food Density", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/CalculateDensity/jobs/j5f47ec74b5b440e78332fb2883619e48", "Service", "Hosted Service"], description:"Feature Service generated from running the Calculate Density solution.", tags:["Analysis Result", "Calculate Density", "Food"], snippet:"Analysis Feature Service generated from Calculate Density", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-117.18957429537912, 32.69820020982176], [-117.12968094918715, 32.73102380949818]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Food Density/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:6}, {id:"bdfb1212b020468ba076dabbb4234411", owner:"NikolasWise", created:1404078836000, modified:1404093243000, guid:null, name:null, title:"Zoning Map-Copy-Copy", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Offline", "Online Map", "Web Map"], description:null, tags:["portlandmaps", "BPS", "Planning", "planning", "zoning", "map", "pdx"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6702, 45.5345], [-122.6584, 45.5399]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"eb02e779dd704059a1b4c1db89e08f2b", owner:"NikolasWise", created:1427396426000, modified:1427396428000, guid:null, name:"Mikes Again", title:"Mikes Again", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots where OWNERADDR is '535 NE THOMPSON ST' </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jccc604e68951467fb77cf012e3bad552", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jccc604e68951467fb77cf012e3bad552"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Mikes Again/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8ef8cf9054554607a2e4dc5f83cb8b8a", owner:"NikolasWise", created:1429731151000, modified:1429731169000, guid:null, name:"Lower Albina - River", title:"Lower Albina - River", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Water Bodies - Summarize Map Notes_Areas within USA Detailed Water Bodies.<div><i><u>Expression</u>  Portland Water Bodies - Summarize Map Notes_Areas within USA Detailed Water Bodies intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Portland Water Bodies - Summarize Map Notes_Areas within USA Detailed Water Bodies"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jb61d26f2d8474b31ab476abde6e9d35b", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jb61d26f2d8474b31ab476abde6e9d35b"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - River/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"17366a41957f4ea4b920181ae6fd4a50", owner:"NikolasWise", created:1429740388000, modified:1429740439000, guid:null, name:"Lower_Albina_-_River.geojson", title:"Lower Albina - River", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Water Bodies - Summarize Map Notes_Areas within USA Detailed Water Bodies.<div><i><u>Expression</u>  Portland Water Bodies - Summarize Map Notes_Areas within USA Detailed Water Bodies intersects Study Area_Areas </i></div>", tags:["geojson"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jb61d26f2d8474b31ab476abde6e9d35b", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jb61d26f2d8474b31ab476abde6e9d35b"}, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"989388d1ee2b462fa77b2eceb81ec4ed", owner:"jyaganeh@esri.com", created:1361298717000, modified:1361317270000, guid:null, name:null, title:"Meteors", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["meteors"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-131.116, 19.899], [-60.804, 58.593]], spatialReference:null, accessInformation:"http://www.lpi.usra.edu/meteor/metbull.php", licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Meteors/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:84}, {id:"1fe1bf06d57b401bb3951122ed31020d", owner:"aaronpk", created:1287682733000, modified:1366148789089, guid:null, name:null, title:"Esri Dev Meet Up Boise", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:"<span><span><span></span></span></span>", tags:["Meetup; social media"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-116.2244, 43.6018], [-116.1897, 43.6258]], spatialReference:null, accessInformation:null, licenseInfo:"<span><span><span></span></span></span>", culture:null, properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:55}, {id:"101901d5e4a24a4d872cf73de736a97a", owner:"aaronpk", created:1362924042000, modified:1366148789054, guid:null, name:null, title:"Declared Dangerous Dogs Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["Declared Dangerous Dogs Map"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-98.0683, 30.1503], [-97.4331, 30.4597]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:13}, {id:"324daed7e2b847c7b0aa1781be924e1e", owner:"aaronpk", created:1362919069000, modified:1366148790028, guid:null, name:"restaurant_inspection_score_map_1362933472063", title:"Restaurant_Inspection_Score_Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["Restaurant Inspection Scores"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-98.4826, 29.9483], [-97.0626, 30.7105]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:25}, {id:"42b3368da5bb4b069fbc4ea046cf5939", owner:"aaronpk", created:1362917624000, modified:1366148790775, guid:null, name:null, title:"Restaurant_Inspection_Scores", type:"Feature Service", typeKeywords:["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"], description:null, tags:["Restaurant Inspection Scores"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-160.00000000000028, -79.99999999999996], [160.00000000000028, 79.99999999999996]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Restaurant_Inspection_Scores/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:240}, {id:"66917966b7e84674ac27e5e6b42e9b41", owner:"aaronpk", created:1362923204000, modified:1366148791246, guid:null, name:null, title:"Declared_Dangerous_Dogs_Map", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["Declared Dangerous Dogs"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-97.95134999999983, 30.160000000000032], [-97.53009557999998, 30.44999999999995]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Declared_Dangerous_Dogs_Map/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:58}, {id:"ab4adfbf05bb4c9ab02f02e753174cbe", owner:"aaronpk", created:1362917001000, modified:1366148792847, guid:null, name:null, title:"Austin_Fire_Station_Map", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["Austin Fire Stations"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-160.00000000000028, -79.99999999999996], [160.00000000000028, 79.99999999999996]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Austin_Fire_Station_Map/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:34}, {id:"b6091b9e9e184e2fafd016132412537a", owner:"aaronpk", created:1362917237000, modified:1366148793575, guid:null, name:"austin_fire_station_map_1362931640179", title:"Austin_Fire_Station_Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["Austin Fire Stations"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-98.1102, 30.1313], [-97.4002, 30.5255]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:16}, {id:"e28acfb6b7b24b279328cd9ec607c831", owner:"aaronpk", created:1362924348000, modified:1366148794084, guid:null, name:null, title:"Map_of_Austin_Police_Stations", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["Austin", "Police", "Stations"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-98.0722, 30.1401], [-97.437, 30.4496]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:3}, {id:"5c201db3942e4983a08bde58fc17f723", owner:"patrickarlt7104", created:1359391055000, modified:1359409096000, guid:null, name:null, title:"stops", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["trimet"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.11544800000044, 45.28522700000004], [-122.2730899999999, 45.63772600000002]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/stops/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:48}, {id:"6f6b20dd7a174d659b2621b3014570be", owner:"jyaganeh@esri.com", created:1382459846000, modified:1382474287000, guid:null, name:"Spotifly", title:"Spotifly", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["USA", "Landmarks", "Spotifly", "Offlinehack"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-172.61718749995458, -75.31074258829743], [172.61718749995458, 82.12340334940231]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Spotifly/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:23}, {id:"144c9da7dcb74aa2bf279e1a8f3bdf64", owner:"patrickarlt7104", created:1375446966000, modified:1375461459000, guid:null, name:null, title:"States", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["states"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-179.1473399999999, -14.378799999999957], [179.77848000000003, 71.38961197300003]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/States/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:24}, {id:"e5a20201215b4b4bba9fc77d27b6e4ef", owner:"patrickarlt7104", created:1396290614000, modified:1396308440000, guid:null, name:"Police_Precinct", title:"Police Precinct", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["homepage"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-170.50781249995526, -75.31074258829743], [170.50781249995526, 82.12340334940232]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Police_Precinct/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:12}, {id:"559bcc2a87ab410ea92477c84fe3ef08", owner:"patrickarlt7104", created:1396291367000, modified:1396308744000, guid:null, name:"Graffiti_Reports", title:"Graffiti Reports", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["homepage"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-170.50781249995526, -75.31074258829743], [170.50781249995526, 82.12340334940232]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Graffiti_Reports/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:34}, {id:"2c1662d13e024e4bb142445208447704", owner:"patrickarlt7104", created:1392223659000, modified:1396308758000, guid:null, name:null, title:"Dev Events Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["Pat"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-146.6016, -48.3173], [80.332, 67.0131]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:13}, {id:"5f7178d632b94fd49ed087baa1928be9", owner:"patrickarlt7104", created:1392052555000, modified:1396310558000, guid:null, name:null, title:"Graffiti Visualization", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["NYC", "Crime Visualization"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-74.0998, 40.6177], [-73.7633, 40.7811]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:88}, {id:"cf320e0deacd40ef996cf033864c15c9", owner:"amber-case", created:1399305729000, modified:1399322920000, guid:null, name:null, title:"Heritage Trees in Portland, Oregon", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["trees", "heritage", "civicapps", "portland", "caseorganic"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.761, 45.4966], [-122.6502, 45.5479]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:27}, {id:"a86d8e2cc4c048408c43cbf0e9c19ab1", owner:"joslislo", created:1399399319000, modified:1399399319000, guid:"24026D27-2F3D-4541-9D6D-043B74EF0E1C", name:"StormSurge.mpk", title:"StormSurge", type:"Map Package", typeKeywords:["2D", "ArcMap", "File Geodatabase Feature Class", "Map", "Map Package", "mpk"], description:"Map of hurricane storm surge inundation in southwestern Florida.", tags:["Esri Training Services", "ARC1", "storm surge", "Lee Country", "Florida", "your mom", "your mom's mom"], snippet:"Map of hurricane storm surge inundation in southwestern Florida.", thumbnail:"thumbnail/thumbnail.png", documentation:null, extent:[[-82.6622272611535, 25.776877472536], [-80.8301620827074, 27.3894303764871]], spatialReference:"Albers Conical Equal Area (Florida Geographic Data Library)", accessInformation:"Esri", licenseInfo:"Use of this Data is restricted to training, demonstration, and educational purposes only. This Data cannot be sold or used for marketing without the express written consent of Environmental Systems Research Institute Inc.", culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"fb0736621a594f859a9376558b11da1b", owner:"joslislo", created:1399400185000, modified:1399414653000, guid:null, name:null, title:"Lee County Hospitals at Risk", type:"Web Mapping Application", typeKeywords:["JavaScript", "Map", "Mapping Site", "Online Map", "Ready To Use", "Web Map"], description:" Web application displaying storm surge risk in Lee County, Florida.", tags:["Esri Training Services", "ARC1", "Florida", "Lee Country", "storm surge"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:"Esri", licenseInfo:" <span style='line-height: 1.3846153846153846;'>Use of this Data is restricted to training, demonstration, and educational purposes only. This Data cannot be sold or used for marketing without the express written consent of Environmental Systems Research Institute Inc.</span><div> THE DATA AND RELATED MATERIALS MAY CONTAIN SOME NONCONFORMITIES, DEFECTS, OR ERRORS. ESRI DOES NOT WARRANT THAT THE DATA WILL MEET USER'S NEEDS OR EXPECTATIONS; THAT THE USE OF THE DATA WILL BE UNINTERRUPTED; OR THAT ALL NONCONFORMITIES, DEFECTS, OR ERRORS CAN OR WILL BE CORRECTED. ESRI IS NOT INVITING RELIANCE ON THIS DATA, AND THE USER SHOULD ALWAYS VERIFY ACTUAL DATA.</div><div> THE DATA AND RELATED MATERIALS ARE PROVIDED &quot;AS-IS,&quot; WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</div><div> IN NO EVENT SHALL ESRI AND/OR ITS LICENSOR(S) BE LIABLE FOR COSTS OF PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOST PROFITS, LOST SALES, OR BUSINESS EXPENDITURES, INVESTMENTS, OR COMMITMENTS IN CONNECTION WITH ANY BUSINESS; LOSS OF ANY GOODWILL; OR FOR ANY INDIRECT, SPECIAL, INCIDENTAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THIS AGREEMENT OR USE OF THE DATA AND RELATED MATERIALS, HOWEVER CAUSED, ON ANY THEORY OF LIABILITY, AND WHETHER OR NOT ESRI OR ITS LICENSOR(S) HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. THESE LIMITATIONS SHALL APPLY NOTWITHSTANDING ANY FAILURE OF ESSENTIAL PURPOSE OF ANY EXCLUSIVE REMEDY.</div><div> In the event that the data vendor(s) has (have) granted the end user permission to redistribute the Geodata, please use proper proprietary or copyright attribution for the various data vendor(s), and provide the associated metadata file(s) with the Geodata.</div><div> </div>", culture:"en-us", properties:null, url:"http://esri23.maps.arcgis.com/apps/SimpleMapViewer/index.html?appid=fb0736621a594f859a9376558b11da1b", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"3e52d91fb8b840cabd82062f146d108b", owner:"aaronpk", created:1362924274000, modified:1366148790000, guid:null, name:null, title:"Map_of_Austin_Police_Stations", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["Austin Police Stations"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-97.7931279999998, 30.17545500000001], [-97.69618300000026, 30.414346]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Map_of_Austin_Police_Stations/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:272}, {id:"92048e6ad52d4e78b172fc17e079561e", owner:"kenichi", created:1404909355000, modified:1405012155000, guid:null, name:null, title:"ELF Webmap", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Offline", "Online Map", "Web Map"], description:null, tags:["elf", "elfathon"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8406, 45.4447], [-122.4684, 45.6423]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:272}, {id:"cab9a99792324710a278f07e4a46445d", owner:"jyaganeh@esri.com", created:1404759653000, modified:1405012177000, guid:null, name:"ELF_Points", title:"ELF Points", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["ELF", "elfathon"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.82307147216359, 45.45096046669867], [-122.48592852782814, 45.6361082348944]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/ELF_Points/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:466}, {id:"3c9d257249c643a9b711b32cce78eb32", owner:"kenichi", created:1404999197000, modified:1405014271000, guid:null, name:"UC_Underground", title:"UC Underground", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"Locations of spots for evening meet-ups at the UC", tags:["elfathon"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.82307147216359, 45.45096046669867], [-122.48592852782814, 45.6361082348944]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/UC_Underground/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"e17d7130b2fa4aaabb9e34067490627d", owner:"ahaddad_Esri23", created:1405010281000, modified:1405025407000, guid:null, name:null, title:"PDX", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["elf", "elfathon"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.67722732999943, 45.52148370300046], [-122.67722732999943, 45.52148370300046]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/PDX/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:20}, {id:"eed25f1f249a418f8501f9746f03dc3c", owner:"ahaddad_Esri23", created:1405010298000, modified:1405025613000, guid:null, name:null, title:"PDXDemo", type:"Web Map", typeKeywords:["ArcGIS Online", "Esri Maps For Office V2.1.4", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:"ELF Demo", tags:["elfathon"], snippet:null, thumbnail:"thumbnail/a3ba0b810d34463f9da39b984bc295ee_thumbnail.png", documentation:null, extent:[[-122.716212265013, 45.4977257091169], [-122.621626846311, 45.5397030951997]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:17}, {id:"31dc170fcee64482aac9de4d6a1a73a0", owner:"kenichi", created:1405014150000, modified:1405028894000, guid:null, name:"ELF_polygons", title:"ELF polygons", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"wwwwwwut", tags:["elfathon"], snippet:null, thumbnail:"thumbnail/polygons.png", documentation:null, extent:[[-122.82307147216359, 45.45096046669867], [-122.48592852782814, 45.6361082348944]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/ELF_polygons/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:5}, {id:"52374061cdce42ef809a906f66239e3e", owner:"patrickarlt7104", created:1405159428000, modified:1405174358000, guid:null, name:null, title:"PDX Pedestrian Districts", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["PDX"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.76093719962503, 45.46609621846465], [-122.49498458798588, 45.61871418515808]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/PDX_Pedestrian_Districts/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:15}, {id:"ef90a2cc94bf46d7a4a0e4d8f759452f", owner:"paulcpederson", created:1366154441000, modified:1366168881000, guid:null, name:null, title:"Trimet Stops", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["service"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.11544800000044, 45.28522700000004], [-122.3330099999996, 45.63772600000002]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Trimet_Stops/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:73}, {id:"c1894043ae634f41a20ae5da036bb7eb", owner:"kneemer", created:1408569196000, modified:1410211346000, guid:null, name:null, title:"angle test", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["angles"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-144.482, 33.9591], [-100.8003, 55.1395]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:9}, {id:"c166721728634751b91367ac93704c10", owner:"dstevenson", created:1411050333000, modified:1411050646000, guid:null, name:null, title:"bike racks", type:"Feature Collection", typeKeywords:["Data", "Feature Collection"], description:null, tags:["bike"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6807, 45.5218], [-122.677, 45.5228]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:4}, {id:"9ac7a6c678134953b19234a36ffa886c", owner:"dstevenson", created:1411050243000, modified:1411073017000, guid:null, name:null, title:"Test Bike Racks", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["att hackathon"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6817, 45.521], [-122.6759, 45.5234]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:9}, {id:"80aba26493d946459e5ac973f035d13a", owner:"dstevenson", created:1411050648000, modified:1411166686000, guid:null, name:null, title:"bike racks hosted", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["bike"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6807, 45.5218], [-122.677, 45.5228]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/bike_racks/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:24}, {id:"a243a09d205c483794e6cdbb875f3d12", owner:"kneemer", created:1407431120000, modified:1416010768000, guid:null, name:null, title:"Mineral Operations", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["mines"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-114.55390426318336, 31.871083711105538], [-87.59713636786182, 47.66191789761966]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/minop3x020_nt00020/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:912}, {id:"8e2fe1ee979b4c80a837caac2968d6d4", owner:"patrickarlt7104", created:1417280058000, modified:1420399835000, guid:null, name:null, title:"Airports 2", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["airports"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-175.13563500000004, -53.78147460583161], [179.19544202301995, 78.24671699999998]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Airports_2/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:214}, {id:"f666385dfd6142a690fe10a5f3114e0c", owner:"jsievert", created:1423690116000, modified:1423690140000, guid:null, name:null, title:"zwickelmania", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Involved Lookup", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["zwickelmania", "beer", "2015", "portland"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.95691939984208, 45.36785688243329], [-122.60126601858897, 45.58874584942993]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/zwickelmania/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:23}, {id:"b5c6a071b3134ab899211535b4051447", owner:"smorehouse_Esri23", created:1425495409000, modified:1425495624000, guid:null, name:null, title:"National Register of Historic Places", type:"Web Mapping Application", typeKeywords:["JavaScript", "Map", "Mapping Site", "Online Map", "Web Map"], description:null, tags:["historic places"], snippet:"nps map service", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/apps/PublicInformation/index.html?appid=b5c6a071b3134ab899211535b4051447", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"be1f7e6caa9048ac868c9316e173837c", owner:"kneemer", created:1426094650000, modified:1426793747000, guid:null, name:null, title:"oregoncrime2002_classic", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["smart map"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-124.56602501575065, 41.99246228002075], [-116.4616396730659, 46.285762692319686]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/oregoncrime2002_smart/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:13}, {id:"d020f4e0c40a4006ae7ac7da8fa8b3a4", owner:"kneemer", created:1407450930000, modified:1426796720000, guid:null, name:null, title:"continental divide", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "webmap_2.1", "Hosted Service"], description:null, tags:["geology"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-114.07723999023439, 31.33328628540037], [-105.62832641601562, 49.00041198730467]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/continental_divide/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:689}, {id:"106b240dc2104ad19dc0b053fa4d8eee", owner:"kneemer", created:1426096709000, modified:1427129939000, guid:null, name:null, title:"oregoncrime2002_smarter", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "webmap_2.1", "Hosted Service"], description:null, tags:["smart map"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-124.56602501575065, 41.99246228002075], [-116.4616396730659, 46.285762692319686]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/oregoncrime2002_smarter/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:18}, {id:"dbc5d63e613448dd9f758e51828bcbbb", owner:"kneemer", created:1425871619000, modified:1427132865000, guid:null, name:null, title:"PortlandHeritageTrees_smart", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "webmap_2.1", "Hosted Service"], description:null, tags:["smart map"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.7495015860359, 45.43435020107916], [-122.50184198231008, 45.597597739114306]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/PortlandHeritageTrees_smart/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:20}, {id:"a85f31f1194d4ff49fa753bab60f3b68", owner:"kneemer", created:1427215709000, modified:1427216962000, guid:null, name:null, title:"default_symbol_issue", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "webmap_2.1", "Hosted Service"], description:null, tags:["bug report"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-124.56602501575065, 41.99246228002075], [-116.4616396730659, 46.285762692319686]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/default_symbol_issue/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:9}, {id:"a864aa59ea4c40038a57fef16e7b528d", owner:"kneemer", created:1427216917000, modified:1427217236000, guid:null, name:null, title:"divided_by_with_classify", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["bug report"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-124.56602501575065, 41.99246228002075], [-116.4616396730659, 46.285762692319686]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/divided_by_with_classify/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"beb7c92d9c4a472894f318f1b0ab0226", owner:"kneemer", created:1407515272000, modified:1433172279000, guid:null, name:null, title:"oregoncrime2002", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["crime"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-124.56602501575065, 41.99246228002075], [-116.4616396730659, 46.285762692319686]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/oregoncrime2002/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:453}, {id:"7b66fdf4f75c42cf96ba1b749a15cb98", owner:"NikolasWise", created:1409953636000, modified:1409953654000, guid:null, name:null, title:"Portland Light Rail Lines", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["PDX", "light rail", "MAX"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.99443933841748, 45.30687210352117], [-122.41230139663062, 45.610150875731776]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Light_Rail_Lines/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"1e79d13739a244e08be7f4f2ab3034ac", owner:"NikolasWise", created:1427553915000, modified:1427553922000, guid:null, name:null, title:"PlotPDX-Copy", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["Exploration"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6697, 45.5289], [-122.646, 45.5396]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"26db5682878d4d1aab135c742e82d3d4", owner:"aaronpk", created:1351190482000, modified:1366148789091, guid:null, name:"What people are saying about the election", title:"What people are saying about the election", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Web Map"], description:null, tags:["Voting", "Polling Places", "HI"], snippet:"Official Polling Places and Election Districts for 2012 elections for U.S. Congress, State of Hawaii House and Senate and Honolulu Council", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://www.arcgis.com/apps/SocialMedia/index.html?appid=26db5682878d4d1aab135c742e82d3d4", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:3}, {id:"5b9db0989d914c5780fcb26210e46064", owner:"aaronpk", created:1351186935000, modified:1366148790956, guid:null, name:"What people are saying about politics", title:"What people are saying about election", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "null", "Online Map", "Web Map"], description:null, tags:["Voting"], snippet:"Official Polling Places and Election Districts for 2012 elections for U.S. Congress, State of Hawaii House and Senate and Honolulu Council", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://www.arcgis.com/apps/SocialMedia/index.html?appid=5b9db0989d914c5780fcb26210e46064", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:6}, {id:"8c8aed9a021a4ac08a2aeb07170284cd", owner:"aaronpk", created:1362927064000, modified:1366148792903, guid:null, name:"Restaurant_Inspection_Scores.csv", title:"Restaurant_Inspection_Scores", type:"CSV", typeKeywords:["CSV"], description:null, tags:["hackathon", "sxsw"], snippet:"for hackathon", thumbnail:null, documentation:null, extent:[[-160.00000000000028, -79.99999999999996], [160.00000000000028, 79.99999999999996]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"9b5ecafcc8c74fe086698357df31446b", owner:"aaronpk", created:1323791203000, modified:1366148792846, guid:null, name:null, title:"Live from Antarctica", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:null, tags:["Geo"], snippet:"Live from Antarctica", thumbnail:null, documentation:null, extent:[[-179.462373189432, -69.1386695081005], [99.0712175867873, 65.594791762082]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:14}, {id:"b8915afe48ef4cc98a2f1c74705cb6df", owner:"aaronpk", created:1362923350000, modified:1366148793534, guid:null, name:"Restaurant_Inspection_Scores.csv", title:"Restaurant_Inspection_Scores", type:"CSV", typeKeywords:["CSV"], description:null, tags:["sxsw"], snippet:"Restaurant Inspection Scores", thumbnail:null, documentation:null, extent:[[-160.00000000000028, -79.99999999999996], [160.00000000000028, 79.99999999999996]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"a33d8906b46e4da884eadf5cf57f3698", owner:"paulcpederson", created:1366743154000, modified:1366757555000, guid:null, name:null, title:"USA Population Density", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["population", "USA"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-135.0578, 20.6664], [-73.6662, 52.6382]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:13}, {id:"57b22a75b05246ee9855a3fd7c1ee20f", owner:"paulcpederson", created:1366743578000, modified:1366757980000, guid:null, name:"USA Population Density", title:"USA Population Density", type:"Web Mapping Application", typeKeywords:["JavaScript", "Map", "Mapping Site", "Online Map", "Ready To Use", "Web Map", "Registered App"], description:null, tags:["population", "USA"], snippet:"A county-level representation of America's population density.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esri23.maps.arcgis.com/apps/SimpleMapViewer/index.html?appid=57b22a75b05246ee9855a3fd7c1ee20f&webmap=a33d8906b46e4da884eadf5cf57f3698", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:3}, {id:"5f5dfdf50233491e9ab90caee76b8436", owner:"paulcpederson", created:1375881703000, modified:1375896143143, guid:null, name:null, title:"Portland Bike Network", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["bikes", "bicycle", "portland", "transportation"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.84852232732496, 45.429604356882], [-122.46847943740904, 45.64439025505505]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Bike_Network/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"fc74690f4d5e4201bcb9a52350f4f291", owner:"paulcpederson", created:1375882424000, modified:1375897377762, guid:null, name:null, title:"Portland, OR Slope", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["topography", "slope", "portland", "oregon"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.86576193466479, 45.41102898938168], [-122.4438999444915, 45.67656126665721]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland,_OR_Slope/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"bd0d13640ded48f19f21d427f1855516", owner:"paulcpederson", created:1376445170000, modified:1376460467161, guid:null, name:null, title:"Portland Topo", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["topography", "NPS", "US Topography"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8158, 45.4113], [-122.4928, 45.5706]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"3f9f081bb8cd499babdc8c5be473ed1b", owner:"jyaganeh@esri.com", created:1382446249000, modified:1382461984795, guid:null, name:null, title:"xaa", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["usa geonames"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-160, -80.00000000000001], [160, 80]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/xaa/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:58}, {id:"7e2a67e256fb4915a7623741464ccaba", owner:"paulcpederson", created:1389896870000, modified:1389915526000, guid:null, name:null, title:"Portland Elevation Contours", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["elevation", "portland"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83912440972034, 45.42955176940826], [-122.46803363310653, 45.65620826510416]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Elevation_Contours/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"5ece5f4e19ce437682eb5686c9fd219f", owner:"dstevenson", created:1399299752000, modified:1399314164000, guid:null, name:"Hot Spots ZIP", title:"Hot Spots ZIP", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindHotSpots/jobs/j050250b701864afe8f39c73d7e1f9f9d", "Service", "Hosted Service"], description:"<b>The following report outlines the workflow used to optimize your Find Hot Spots result:</b><br /><u><b>Initial Data Assessment.</b></u><br /><ul><li>There were 94 valid input features.</li></ul><ul><li>ZIP Properties:</li></ul><table style='width: 200px;margin-left: 2.5em;'><tbody><tr><td>Min</td><td style='float:right'>32086.0000</td></tr><tr><td>Max</td><td style='float: right;'>34996.0000</td></tr><tr><td>Mean</td><td style='float: right;'>33356.3085</td></tr><tr><td>Std. Dev.</td><td style='float: right;'>793.7450</td></tr></tbody></table><br /><ul><li>There were 2 outlier locations; these were not used to compute the optimal fixed distance band.</li></ul><br /><u><b>Scale of Analysis</b></u><br /><ul><li>The optimal fixed distance band selected was based on peak clustering found at 65145.8606 Meters.</li></ul><br /><u><b>Hot Spot Analysis</b></u><br /><ul><li>49 output features are statistically significant based on a FDR correction for multiple testing and spatial dependence.</li></ul><br /><u><b>Output</b></u><br /><ul><li>Red output features represent hot spots where high ZIP values cluster.</li></ul><ul><li>Blue output features represent cold spots where low ZIP values cluster.</li></ul><br />", tags:["Analysis Result", "Hot Spots", "FL_BloodBanks", "ZIP"], snippet:"Analysis Feature Service generated from Find Hot Spots", thumbnail:null, documentation:null, extent:[[-87.2247072889657, 25.596135744682933], [-80.05753472722947, 30.78065760012485]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Hot Spots ZIP/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8a2fa81846ee4f1e83ab277c41b16a78", owner:"dstevenson", created:1399300231000, modified:1399314762209, guid:null, name:"Drive from FL_BloodBanks (30 Minutes)", title:"Drive from FL_BloodBanks (30 Minutes)", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/CreateDriveTimeAreas/jobs/ja0076d4ff12a4a3fbb35ee1d9a4af0ae", "Service", "Hosted Service"], description:"Feature Service generated from running the Create Drive Times solution.", tags:["Analysis Result", "Drive Times", "FL_BloodBanks"], snippet:"Analysis Feature Service generated from Create Drive Times", thumbnail:null, documentation:null, extent:[[-87.67079544099994, 25.27916526800004], [-80.03201103199996, 31.138418198000068]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Drive from FL_BloodBanks (30 Minutes)/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"6d7e1294a9754c1daa8247b84d859e08", owner:"amber-case", created:1399386192000, modified:1399386192000, guid:"9CE06142-A814-45B5-9B09-A8BDA82899AB", name:"Heritage_Trees.sd", title:"Heritage_Trees", type:"Service Definition", typeKeywords:[".sd", "ArcGIS", "File Geodatabase Feature Class", "Service Definition", "Online"], description:"Point location of officially recognized Heritage Trees. Maintained by Bureau of Planning for Urban Forestry division of Parks & Recreation.", tags:["tree", "heritage", "portland", "watercolor", "caseorganic"], snippet:"This is a watercolor icon set for Portland Heritage Tree Database scaled by diameter. ", thumbnail:"thumbnail/thumbnail.png", documentation:null, extent:[[-122.749065131599, 45.4351972551072], [-122.503849408769, 45.5931289379528]], spatialReference:"WGS_1984_Web_Mercator_Auxiliary_Sphere", accessInformation:"Agency Program City of Portland / Parks http://www.civicapps.org/datasets/heritage-trees ", licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"a3c300cac23e4d9789ede0bc891a2b51", owner:"jyaganeh@esri.com", created:1399390918000, modified:1399405683000, guid:null, name:null, title:"Portland Business Licenses", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["Portland", "Business Licenses"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83637826886414, 45.43281825259544], [-122.46979956689106, 45.64526951342676]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Business_Licenses/FeatureServer", access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:8}, {id:"3b10d12057de470a97bd835246398e3a", owner:"dstevenson", created:1399299560000, modified:1399313963000, guid:null, name:null, title:"Florida Blood Banks", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["ARC1", "Florida", "blood bank"], snippet:"Map displaying all the blood bank locations in the state of Florida", thumbnail:null, documentation:null, extent:[[-89.0731, 24.7009], [-78.2845, 31.2072]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:5}, {id:"b8658ad130304fe184314f6f5b563267", owner:"dstevenson", created:1407444268000, modified:1407444272000, guid:null, name:"Test_Layer", title:"Test Layer", type:"Feature Service", typeKeywords:["ArcGIS Server", "Collector", "Data", "Feature Access", "Feature Service", "Location Tracking", "Service", "Hosted Service"], description:"Location tracking log for ArcGIS Collector app", tags:["Location Tracking"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.801, 45.467], [-122.509, 45.62]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Test_Layer/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:4}, {id:"502c59f12a104167872c28df066b3c0a", owner:"davy_publisher", created:1407533693000, modified:1407533702000, guid:null, name:"Location_Tracking_Thing", title:"Location Tracking Thing", type:"Feature Service", typeKeywords:["ArcGIS Server", "Collector", "Data", "Feature Access", "Feature Service", "Location Tracking", "Service", "Hosted Service"], description:"Location tracking log for ArcGIS Collector app", tags:["Location Tracking"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.712, 45.507], [-122.639, 45.546]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Location_Tracking_Thing/FeatureServer", access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:8}, {id:"b5b4d1d90d7b4e39a84cef4627ea686d", owner:"loqipdx", created:1407517843000, modified:1407517845000, guid:null, name:"ELF_Location_History", title:"ELF Location History", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["ELF"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.77843951415586, 45.45096046669867], [-122.53056048583588, 45.6361082348944]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/ELF_Location_History/FeatureServer", access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:13}, {id:"126dc0ece08b4b4fa3b0df950897fd12", owner:"loqipdx", created:1407520157000, modified:1407520164000, guid:null, name:"ELF_Notification_History", title:"ELF Notification History", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["ELF"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.7990388793902, 45.45096046669867], [-122.50996112060153, 45.6361082348944]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/ELF_Notification_History/FeatureServer", access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:4}, {id:"a65be6d61444458d8e5577002f89fece", owner:"dstevenson", created:1411509827000, modified:1411509827000, guid:null, name:null, title:"Heritage Trees Portland", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service"], description:" The original shapefile for this data is available from the City of Portland at https://www.portlandoregon.gov/bts/article/268487", tags:["portland", "location awareness", "demo"], snippet:"Heritage trees in Portland Oregon", thumbnail:null, documentation:null, extent:[[-122.7495, 45.4344], [-122.5018, 45.5976]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Heritage_Trees_Portland/FeatureServer", access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:15}, {id:"b7f678656f1f45f187c31d6feb903cc2", owner:"dstevenson", created:1411511723000, modified:1411512078000, guid:null, name:null, title:"Dangerous Areas - Enter", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service"], description:null, tags:["location awareness", "demo"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8231, 45.451], [-122.4859, 45.6361]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/ELF_polygons/FeatureServer", access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"07a4a2ecb6cd428fbc5c6d340801e1fd", owner:"dstevenson", created:1411510346000, modified:1411513071000, guid:null, name:null, title:"Location Awareness Demo", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["location awareness", "demo"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6805, 45.5211], [-122.6747, 45.5235]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:3}, {id:"fa0ae81e011d4d4fbf2e83af2c740902", owner:"kenichi", created:1411515196000, modified:1411515344000, guid:null, name:"whatever", title:"whatever", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["elfathon"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.801, 45.467], [-122.509, 45.62]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/whatever/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:6}, {id:"be22c5145d114529ac29576f643bd22c", owner:"patrickarlt7104", created:1429122075000, modified:1429122081000, guid:null, name:"Location_Tracking_Layer", title:"Location Tracking Layer", type:"Feature Service", typeKeywords:["ArcGIS Server", "Collector", "Data", "Feature Access", "Feature Service", "Feature Service Template", "Layer", "Layer Template", "Location Tracking", "Platform", "Service", "Service template", "Singlelayer", "Template", "Hosted Service"], description:"Location tracking log for ArcGIS Collector app", tags:["Location Tracking"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.801, 45.467], [-122.509, 45.62]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Location_Tracking_Layer/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"97fae8d86e714a42b5405e02aac8d3c8", owner:"patrickarlt7104", created:1429128929000, modified:1429128930000, guid:null, name:"97fae8d86e714a42b5405e02aac8d3c8", title:"Sample KML", type:"KML", typeKeywords:["Data", "kml", "Map"], description:null, tags:["KML"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-105.5233, 40.566], [-105.189, 40.7035]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://i-cubed.maps.arcgis.com/sharing/content/items/d7e3170c02ea4e6bad97b6452795d904/data", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"1dd4f4bf77d84ba98664cc533bf252a5", owner:"patrickarlt7104", created:1429133630000, modified:1429133714000, guid:null, name:null, title:"stops_24", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["dont use"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.11544800000001, 45.28522700000001], [-122.33300999999999, 45.637725999999994]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/stops_24/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"7c046f005ff04011a2202e7679c89b3a", owner:"patrickarlt7104", created:1430343334000, modified:1430343334000, guid:null, name:null, title:"My Scene 2", type:"Web Scene", typeKeywords:["3D", "Map", "Scene", "Streaming", "Web", "Web Scene"], description:null, tags:["scene"], snippet:null, thumbnail:"thumbnail/thumbnail.jpeg", documentation:null, extent:[[-179.999989, -77.867358], [179.999989, 88.510302]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"5ff7d554623441f9ab87ee9465ba493a", owner:"patrickarlt7104", created:1431450986000, modified:1431451000000, guid:null, name:null, title:"more tiles", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["tiles"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.76093719962503, 45.46609621846465], [-122.49498458798588, 45.61871418515808]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/more_tiles/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"f10f6abb30d248cdbd5a390c09ea0765", owner:"aaronpk", created:1433202420000, modified:1433202424000, guid:null, name:null, title:"Kerns bike map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["aaronpk"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8146, 45.4509], [-122.4554, 45.5835]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"e71bde14715b41a0b64b4f8b625845c6", owner:"patrickarlt7104", created:1433693963000, modified:1433693982000, guid:null, name:null, title:"xfiles", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["foo"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-118.75820899999995, 33.254142999999985], [-115.47264899999996, 34.47782699999999]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/xfiles/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"896bbe2abc7c47f4818720b1aea77764", owner:"NikolasWise", created:1427224759000, modified:1427224759000, guid:null, name:"residential_permits.zip", title:"residential_permits", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["buildathon", "residential", "housing", "permits"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"dce518e4d1324b2081061d8e17546631", owner:"NikolasWise", created:1427393263000, modified:1427393327000, guid:null, name:"Comprehensive_Plan_geojson.geojson", title:"Comprehensive Plan geojson", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.83920746703001, 45.429090720873155], [-122.46801457212878, 45.658205995501994]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"0c64d2c133c646d3909f437908ac522a", owner:"NikolasWise", created:1427393312000, modified:1427393362000, guid:null, name:"central_city_projects_geojson.geojson", title:"central_city_projects geojson", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.70093138918352, 45.4874711735984], [-122.64821340510385, 45.542544732687055]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"0feaa1d537a14c25abe99d8cd08c5a7e", owner:"NikolasWise", created:1427393480000, modified:1427393700000, guid:null, name:"Zoning_Data_geojson.geojson", title:"Zoning Data geojson", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.83920751133117, 45.429090720174614], [-122.46801457272088, 45.65820708375028]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"3ef8cee1669048cf83bdba8d9bfc7011", owner:"NikolasWise", created:1427394838000, modified:1427394838000, guid:null, name:"Building_Footprints_pdx geojson", title:"Building_Footprints_pdx geojson", type:"Feature Service", typeKeywords:["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"], description:null, tags:["pdx", "buildings"], snippet:null, thumbnail:null, documentation:null, extent:[[-123.20152672561757, 45.18870619006695], [-121.91569256433102, 45.7389538485741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Building_Footprints_pdx_geojson/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8d7bd39d3a1d418aa7c983cd0faa943b", owner:"patrickarlt7104", created:1427725253000, modified:1427725283000, guid:null, name:null, title:"Complex Renderer", type:"Web Mapping Application", typeKeywords:["JavaScript", "Map", "Mapping Site", "Online Map", "Web Map"], description:null, tags:["demo"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/apps/Viewer/index.html?appid=8d7bd39d3a1d418aa7c983cd0faa943b", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d9f7953164294872af5b25ad577bc834", owner:"joslislo", created:1399558034000, modified:1399572434000, guid:null, name:"realtime_ios.csv", title:"realtime_ios", type:"CSV", typeKeywords:["CSV"], description:null, tags:["benchmark"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"762e5fc9780f4fe8b7fb761041c596e8", owner:"patrickarlt7104", created:1402935705000, modified:1402950142000, guid:null, name:"stops1.csv", title:"stops1", type:"CSV", typeKeywords:["CSV"], description:null, tags:["foo"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"3776568f618e4a4bb6d4bb6e040a5bd2", owner:"paulcpederson", created:1409702119000, modified:1409702120000, guid:null, name:null, title:"Fake App$", type:"Web Mapping Application", typeKeywords:["JavaScript", "Map", "Mapping Site", "Online Map", "Ready To Use", "Web Map"], description:null, tags:["delete this"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://paulcpederson.com", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"b7b6ee432bfd495f88a9c10b84313fda", owner:"smorehouse_Esri23", created:1421338761000, modified:1421338761000, guid:null, name:null, title:"a scene", type:"Web Scene", typeKeywords:["3D", "Map", "Scene", "Streaming", "Web", "Web Scene"], description:null, tags:["temp"], snippet:"temp", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"88a0f54861544a6c8e1f24c129b4100f", owner:"jsievert", created:1421954671000, modified:1421954681000, guid:null, name:"ForGeodesignIddc196ed2a3f844279f83e6da19eded47", title:"Test - Project Feature Service", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "geodesignProjectFeatureService", "geodesignProjectIDdc196ed2a3f844279f83e6da19eded47", "geodesignTemplateFeatureServiceIDa78a60d3ee954b508a05f58c6e1336b2", "geodesignTemplateID6af1795876204c2aa6e1eb78c24948ec", "Service", "Hosted Service"], description:null, tags:["geodesignProjectFeatureService"], snippet:"Test Project", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/ForGeodesignIddc196ed2a3f844279f83e6da19eded47/FeatureServer", access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d1f15b040a8643eb8c52a0274eb3a59a", owner:"patrickarlt7104", created:1429133528000, modified:1429133629000, guid:null, name:"stops-24.csv", title:"stops_24", type:"CSV", typeKeywords:["CSV"], description:null, tags:["dont use"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"ef1de0407e7f481cb696ce3dae040fae", owner:"patrickarlt7104", created:1392215015000, modified:1392215015000, guid:null, name:null, title:"LA Rail Accessibility Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["LA"], snippet:null, thumbnail:null, documentation:null, extent:[[-118.3955, 33.9836], [-118.1551, 34.1022]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"ceab9f1c88764f3b8c561ce62c9f4d19", owner:"patrickarlt7104", created:1408726229000, modified:1408726229000, guid:null, name:null, title:"Complex Renderer", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["demo"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.8439, 45.4605], [-122.4649, 45.625]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"75675fe0a1194343a3f075151506c255", owner:"patrickarlt7104", created:1428940096000, modified:1428940096000, guid:null, name:null, title:"Map w/ Mapbox streets", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["demo mapbox"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.8885, 45.4593], [-122.527, 45.6278]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"4cde90ff2ca64217987a6735fa03491b", owner:"patrickarlt7104", created:1429047847000, modified:1429047847000, guid:null, name:null, title:"stops feature collection", type:"Feature Collection", typeKeywords:["Data", "Feature Collection", "Singlelayer"], description:null, tags:["feature collection"], snippet:null, thumbnail:null, documentation:null, extent:[[-123.1154, 45.2852], [-122.333, 45.6377]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"42438064ba614022ba89dc9999e84aa3", owner:"patrickarlt7104", created:1374245959000, modified:1374261632501, guid:null, name:null, title:"Stops Analysis", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["stops"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.5984, 45.4683], [-122.4993, 45.4821]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"76949f17883e4185a1e59a323c62ba66", owner:"paulcpederson", created:-1, modified:1375896099374, guid:null, name:"Bicycle_Network_pdx.zip", title:"Portland Bike Network", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["bikes", "bicycle", "portland", "transportation"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"e15775fa6bf648389961e79b4ded7bfd", owner:"paulcpederson", created:-1, modified:1375896822917, guid:null, name:"Percent_Slope_pdx.zip", title:"Portland, OR Slope", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["topography", "slope", "portland", "oregon"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"09668f28c9c846ffbd4d56ae6e1cc878", owner:"jyaganeh@esri.com", created:1378317872000, modified:1378317872000, guid:null, name:null, title:"Geotriggers Debug App", type:"Application", typeKeywords:["Application", "Registered App"], description:"it works!", tags:["Geotriggers", "Android", "iOS", "Debug"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"73c476c129b64801b2efb1579cb2b108", owner:"joslislo", created:1399557969000, modified:1399557969000, guid:null, name:null, title:"Benchmarking", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["benchmark"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.6857, 45.5081], [-122.6477, 45.5286]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"ad8a8743d3104b2a8d17880c8e266708", owner:"dstevenson", created:1405957453000, modified:1405971997000, guid:null, name:"TEST_PDF.pdf", title:"TEST PDF - dstevenson", type:"PDF", typeKeywords:["Data", "Document", "PDF"], description:null, tags:["elf"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.745, 45.442], [-122.588, 45.558]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"f59a27e785ef48bda1292486a27d8523", owner:"joslislo", created:1408053036000, modified:1408053036000, guid:null, name:null, title:"LeeCategory3", type:"Feature Collection", typeKeywords:["Data", "Feature Collection"], description:null, tags:["feature_service", "Lee County"], snippet:null, thumbnail:null, documentation:null, extent:[[-82.2718, 26.3196], [-81.6641, 26.7894]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"0bfac020b8e945d68049b46d8099dff0", owner:"dstevenson", created:1411050693000, modified:1411050723000, guid:null, name:"bike_racks.zip", title:"bike_racks", type:"CSV Collection", typeKeywords:["CSV Collection"], description:null, tags:["bike"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.6807, 45.5218], [-122.677, 45.5228]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"37e21b704cd74c819cdc722b88a71aab", owner:"smorehouse_Esri23", created:1421348664000, modified:1421348664000, guid:null, name:null, title:"map1", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["tmp"], snippet:null, thumbnail:null, documentation:null, extent:[[-165.4102, -68.7709], [165.4102, 78.5677]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"85a0dabc3a344cad989adba3d85f5957", owner:"patrickarlt7104", created:1425316805000, modified:1425316805000, guid:null, name:null, title:"JS API oAuth 2.0 Demo", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["demo", "dev summit", "oauth", "js api"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"6c3e6176e35746aa89f7b1926a1698d2", owner:"patrickarlt7104", created:1426710988000, modified:1426710988000, guid:null, name:null, title:"mapfolio", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:"Web Map for mapfolio .", tags:["mapfolio_autoInstall", "mapfolio_autoInstall_map"], snippet:null, thumbnail:null, documentation:null, extent:[[-127.675, 20.6047], [-62.7678, 52.3035]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"57cbc0ff8f364fba9114cafab6dfaea3", owner:"joslislo", created:1427925381000, modified:1427925381000, guid:null, name:null, title:"PDX Tech Companies and Coffee Shops", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["tech", "coffee"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.6975, 45.5078], [-122.6519, 45.527]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"4dbd5314db884dc499d901125a34edae", owner:"patrickarlt7104", created:1429123715000, modified:1429123715000, guid:null, name:null, title:"My New Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["tag"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.837, 45.432], [-122.472, 45.655]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d69c40004b25428e866fa58383211352", owner:"patrickarlt7104", created:1429132614000, modified:1429132772888, guid:null, name:null, title:"Portland Bus Stops", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "showUnmatchedAddresses", "Singlelayer", "Hosted Service"], description:null, tags:["pdx"], snippet:null, thumbnail:null, documentation:null, extent:[[-123.11544800000001, 45.28522700000001], [-122.33300999999999, 45.637725999999994]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Bus_Stops/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8952a18bb5504491935b9bff36219ad4", owner:"patrickarlt7104", created:1435071447000, modified:1435071497000, guid:null, name:"Esri_Leaflet_Auth_Test.zip", title:"Esri_Leaflet_Auth_Test", type:"File Geodatabase", typeKeywords:["File Geodatabase"], description:null, tags:["fo"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.82307147216153, 45.45096046669794], [-122.48592852782608, 45.636108234893676]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"70d3af0c751d4fad8ec2535bc7a87204", owner:"NikolasWise", created:1399305856000, modified:1399305856000, guid:null, name:"Contours_5ft_pdx_28129.zip", title:"Contours_5ft_pdx (1)", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["Contours PDX"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"290c9467893d4e0abed0566cafd2e2a0", owner:"NikolasWise", created:1407972664000, modified:1407972664000, guid:null, name:"Streets_pdx.zip", title:"Portland Streets", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "portland", "streets"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"5f748c745e58481bb5c7436fb1b74960", owner:"NikolasWise", created:1408061350000, modified:1408061350000, guid:null, name:"Zoning_Data_pdx.zip", title:"Zoning Data", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "zoning"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"a80dc1927bbc4045aae670ce259500f2", owner:"NikolasWise", created:1408136556000, modified:1408136556000, guid:null, name:"rivers.zip", title:"Portland Rivers", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "rivers"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"7c4f2651113c423587ab3b1c667b69b5", owner:"NikolasWise", created:1408138198000, modified:1408138198000, guid:null, name:"Building_Footprints_pdx.zip", title:"Building_Footprints_pdx", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "buildings"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"81d671d96e5a406989cd60110c995d5e", owner:"NikolasWise", created:1408143566000, modified:1408143566000, guid:null, name:"Curbs_pdx.zip", title:"Portland Curbs", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "curbs"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"e6e72266eb744fcb8ea3af8396082b75", owner:"NikolasWise", created:1408144094000, modified:1408144094000, guid:null, name:"Neighborhoods_pdx.zip", title:"Portland Neighborhoods", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "neighborhoods"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"463bbf310f07439496a434985588946c", owner:"NikolasWise", created:1408379858000, modified:1408379858000, guid:null, name:"Freight_Facilities_pdx.zip", title:"Portland Freight Facillities", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "freight"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"a15d23b8edc2460d8a57896db23f1a65", owner:"NikolasWise", created:1409953633000, modified:1409953633000, guid:null, name:"tm_rail_lines.zip", title:"Portland Light Rail Lines", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["PDX", "light rail", "MAX"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"09ca2284bb6c470f8244a6f12b46e241", owner:"NikolasWise", created:1409955394000, modified:1409955394000, guid:null, name:"us_rail_network_100k_lin_BTS_2006.zip", title:"USA Rail Network", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["Rail", "usa"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"f30e5cbd3dc84535b385dc638409aee7", owner:"NikolasWise", created:1410208239000, modified:1410208239000, guid:null, name:"rail_lines.zip", title:"Rail Lines", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["rail"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"797f18368a6d4e3b95a7737eb7829ad8", owner:"NikolasWise", created:1416521556000, modified:1416521556000, guid:null, name:null, title:"Lower Albina", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["portland", "mapping"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"2ac4607b4dda40dfb7ea199f62a95842", owner:"NikolasWise", created:1427224461000, modified:1427224461000, guid:null, name:"affordable_housing.zip", title:"affordable_housing", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["buildathon", "affordable", "housing"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"4542f3908ae5407c8db7c6e2b9266255", owner:"NikolasWise", created:1427230898000, modified:1427230898000, guid:null, name:"taxlots.zip", title:"taxlots", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["buildathon", "taxlots"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d050d451e93644f586a12e37eedc49f1", owner:"NikolasWise", created:1427490471000, modified:1427490471000, guid:null, name:"NonPark_vacant_BLInon_openspace.zip", title:"NonPark_vacant_BLInon_openspace", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["Vacant Lots", "development"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"9fe35e0ca7474aad86ace5ccd5a573e8", owner:"NikolasWise", created:1432936715000, modified:1432936797000, guid:null, name:null, title:"Web App Builder App", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Web AppBuilder", "Web Map"], description:null, tags:["web", "app", "builder"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/apps/webappviewer/index.html?id=9fe35e0ca7474aad86ace5ccd5a573e8", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"2cf9d68043c646ce9347674ef287bcb9", owner:"paulcpederson", created:1374695323000, modified:1374695323000, guid:null, name:null, title:"Geotrigger Editor", type:"Application", typeKeywords:["Application", "Registered App"], description:"Need App ID and Secret for testing the geotrigger Editor", tags:["geotriggers", "test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"c2c79dc2e5364025a8b8bd76ae40a4e9", owner:"aaronpk", created:1376769270000, modified:1376769270000, guid:null, name:null, title:"Shoeboxed Test", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["shadow"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"01c0597dc24e463e9e8b9dad00afd314", owner:"jyaganeh@esri.com", created:1377783480000, modified:1377783480000, guid:null, name:null, title:"Test application", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["android", "test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"796c65ee7b704183ac052a4c73014b64", owner:"jyaganeh@esri.com", created:1377890483000, modified:1377906902261, guid:null, name:null, title:"Android Test App", type:"Application", typeKeywords:["Application", "Registered App"], description:"testing... is this thing on?", tags:["android", "geotriggers"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"753128303c014a68874aaa1ee3e6fe31", owner:"jsievert", created:1378227668000, modified:1378227668000, guid:null, name:null, title:"My Cool Geotrigger App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["triggers"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"c341c2c40cfe4c4d9869d538393be4f5", owner:"joslislo", created:1378315588000, modified:1378315588000, guid:null, name:null, title:"Jen's Super App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["awesome"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"38cbc9db9a284980965e90fbdf375b36", owner:"aaronpk", created:1379607468000, modified:1379607468000, guid:null, name:null, title:"MapAttack", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["game"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"6d8e0b3a1c1f4f6e8c71458ce1003643", owner:"jyaganeh@esri.com", created:1381259125000, modified:1381259125000, guid:null, name:null, title:"ShadowGopher", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["golang", "testing", "gtriggs"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"f2d8061075f240efb9acfe51de552423", owner:"jyaganeh@esri.com", created:-1, modified:1382460466860, guid:null, name:"xaa.csv", title:"xaa", type:"CSV", typeKeywords:["CSV"], description:null, tags:["usa geonames"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"e92847cdf13248f9aeef8b7d314dfcc0", owner:"aaronpk", created:1384825603000, modified:1384825603000, guid:null, name:null, title:"pk places", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["aaronpk"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d06cf285c6f14c6c9fe442436ef25951", owner:"aaronpk", created:1386958922000, modified:1386958922000, guid:null, name:null, title:"iBeacon Test", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["aaronpk"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d9af48f7499c481ca415efa637f81b33", owner:"ajohnson_Esri23", created:1389276054000, modified:1389294134000, guid:null, name:null, title:"fuzzy-hipster", type:"Application", typeKeywords:["Application", "Registered App"], description:"https://github.com/aaronjohnson/fuzzy-hipster", tags:["android"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"30fc3cd8417e48cc8f6c11e313e252c1", owner:"jyaganeh@esri.com", created:1389617370000, modified:1389617370000, guid:null, name:null, title:"weird pushie test", type:"Application", typeKeywords:["Application", "Registered App"], description:"wetwt", tags:["android"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"034c12c67b88473eb89e3e67878b7f7d", owner:"paulcpederson", created:1389896868000, modified:1389896868000, guid:null, name:"Contours_5ft_pdx.zip", title:"Portland Elevation Contours", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["elevation", "portland"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"36bc5de333274a2dbfc0ec31f58c9c53", owner:"manuel_lopez_Esri23", created:1386093975000, modified:1393980747000, guid:null, name:null, title:"Test App Manny", type:"Application", typeKeywords:["Application", "Registered App"], description:"Testing - Notifs on personal phone.", tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"1dbc1e6372f249f6b0b3521590bbdd40", owner:"paulcpederson", created:1394479715000, modified:1394479715000, guid:null, name:null, title:"Geotrogger Test", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["geotroggers"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"aa56eef386214013bae39eb9e3f85167", owner:"jsievert", created:1395934753000, modified:1395934753000, guid:null, name:null, title:"Something Cool", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["mapping"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"694475e72aa74e32a7a32de6069fda16", owner:"jsievert", created:1395934746000, modified:1395934746000, guid:null, name:null, title:"Something Cool", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["mapping"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"88dab35901e646879f3f57aa4f89888b", owner:"patrickarlt7104", created:1396301718000, modified:1396301718000, guid:null, name:"Parks_pdx.zip", title:"Portland Parks", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["parks"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"93d3e4836c724aab9cf1039c88651b2a", owner:"kenichi", created:1397145263000, modified:1397145263000, guid:null, name:null, title:"battery", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["benchmark"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"ec9d8ab06fa445448518ce0c23efef39", owner:"patrickarlt7104", created:1398255525000, modified:1398255525000, guid:null, name:"Bicycle_Network_pdx.zip", title:"Portland Bicycle Network", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["portland", "cycling", "bikes"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"3573ee7e11b940d9962ebeda90a56da6", owner:"jyaganeh@esri.com", created:1399390916000, modified:1399390916000, guid:null, name:"PortlandBusinessLicenses.zip", title:"Portland Business Licenses", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["Portland", "Business Licenses"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"c1b54da52db24e4d90c069a0cba1b7d5", owner:"davy_user", created:1405957910000, modified:1405957910000, guid:null, name:"TEST_PDF.pdf", title:"TEST PDF - davy_user", type:"PDF", typeKeywords:["Data", "Document", "PDF"], description:null, tags:["elf"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"66822d8db7704317bcec4e1ca28e5d18", owner:"davy_publisher", created:1405957692000, modified:1405957692000, guid:null, name:"TEST_PDF.pdf", title:"TEST PDF - davy_publisher", type:"PDF", typeKeywords:["Data", "Document", "PDF"], description:null, tags:["elf"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"86a4a67812c74611a3adeaab52510b42", owner:"aaronpk", created:1406228781000, modified:1406228781000, guid:null, name:null, title:"XOXO Shuttle Tracker", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["xoxo", "aaronpk"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"865d587d1e274421b362de1fd6099690", owner:"paulcpederson", created:1406908148000, modified:1406908148000, guid:null, name:null, title:"GeoEnrichment Data Browser", type:"Application", typeKeywords:["Application", "Registered App"], description:"Used for token generation for a little javascript app", tags:["geoenrich", "don't delete"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"13aa3f77d6314737ad8a33c5d8961850", owner:"kneemer", created:1407450927000, modified:1407450927000, guid:null, name:"condivl020_nt00155.zip", title:"continental divide", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["geology"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"7ad9a173d1f74679b28901c95c483f63", owner:"kneemer", created:1407515269000, modified:1407515269000, guid:null, name:"oregoncrime2002.zip", title:"oregoncrime2002", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["crime"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"3c10e7429b434ccdb98ae300f95437fd", owner:"kenichi", created:1407522139000, modified:1407522139000, guid:null, name:"polygons.png", title:"polygons", type:"Image", typeKeywords:["Data", "Image", "png"], description:null, tags:["foo"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"36452e6de9af44fb8b78b67934cecb43", owner:"jyaganeh@esri.com", created:1409179492000, modified:1409180967000, guid:null, name:null, title:"iOS Test App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["geotriggers"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"67abda6eeb374d0abb8e7b0f173edfe1", owner:"kneemer", created:1410472881000, modified:1410472881000, guid:null, name:"BufferedHeritageTrees.zip", title:"BufferedHeritageTrees", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["trees"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"466c76f1e12c494b88d2fff1db9da4c9", owner:"kpettijohn_Esri23", created:1414435115000, modified:1414435115000, guid:null, name:null, title:"Geotrigger Health Checks", type:"Application", typeKeywords:["Application", "Registered App"], description:"Simple application using the Geotrigger Ruby SDK that performs health checks on the Geotrigger Service.\n\n", tags:["health"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"3452426c973a4b319dba81c539569f7b", owner:"patrickarlt7104", created:1414519902000, modified:1414519902000, guid:null, name:null, title:"Blaster", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["foo"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8bbc66725dd54de3b40773ae0d917c31", owner:"patrickarlt7104", created:1416022082000, modified:1416022082000, guid:null, name:null, title:"Hapi Demo App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["Demo", "Hapi"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"436110c2a25b40ca8e219c217ccd80fd", owner:"patrickarlt7104", created:1416850943000, modified:1416850943000, guid:null, name:null, title:"Geocoding Demo", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["demo"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"b760f85564ef47dab733635327602b46", owner:"patrickarlt7104", created:1417279676000, modified:1417279676000, guid:null, name:"Archive.zip", title:"Airports", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["airports"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"28f20a9a0f7147578b50d36c5380b031", owner:"patrickarlt7104", created:1417280055000, modified:1417280055000, guid:null, name:"Archive_2.zip", title:"Airports 2", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["airports"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"806dbde2c4b544fca8553e10be50029c", owner:"patrickarlt7104", created:1420328063000, modified:1420328063000, guid:null, name:null, title:"Geotrigger Demo", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["geotrigger"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"b381a20eb2254f0c81ee79b13247c971", owner:"patrickarlt7104", created:1420859956000, modified:1420859956000, guid:null, name:null, title:"Esri Leaflet Routing", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["routing", "esri leaflet"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"c5b0da0e1647446784c853675141eb76", owner:"smorehouse_Esri23", created:1421345194000, modified:1421345194000, guid:null, name:null, title:"scene55", type:"Web Scene", typeKeywords:["3D", "Map", "Scene", "Streaming", "Web", "Web Scene"], description:null, tags:["tmp"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"0378bb0bcfcd4096a09cf8a65b0271e0", owner:"smorehouse_Esri23", created:1421357612000, modified:1421357615000, guid:null, name:null, title:"dfsfsddf", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Web AppBuilder", "Web Map"], description:null, tags:["tmp"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"/apps/webappviewer/index.html?id=0378bb0bcfcd4096a09cf8a65b0271e0", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"da3ea497a0734131b1231c06f42425f3", owner:"smorehouse_Esri23", created:1422323363000, modified:1422323366000, guid:null, name:null, title:"world land cover", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Web AppBuilder", "Web Map"], description:null, tags:["temp"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"/apps/webappviewer/index.html?id=da3ea497a0734131b1231c06f42425f3", access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"237da5776ff5409d823202a2e7ec3bce", owner:"smorehouse_Esri23", created:1422331399000, modified:1422331400000, guid:null, name:null, title:"world land cover", type:"Web Mapping Application", typeKeywords:["JavaScript", "layout-swipe", "Map", "Mapping Site", "Online Map", "Ready To Use", "selfConfigured", "Story Map", "Story Maps", "SwipeSpyglass", "Web Map"], description:null, tags:["Story Map", "Swipe", "Spyglass"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/apps/StorytellingSwipe/?appid=237da5776ff5409d823202a2e7ec3bce", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"79b5544ebec54e0c93400971e4fe27d5", owner:"kneemer", created:1425871616000, modified:1425871616000, guid:null, name:"PortlandHeritageTrees.zip", title:"PortlandHeritageTrees_smart", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["smart map"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d23f315e849d4c16a65f51393c8de542", owner:"patrickarlt7104", created:1425673108000, modified:1426195217253, guid:null, name:null, title:"Proxy Demo", type:"Application", typeKeywords:["Application", "Registered App", "App Proxy"], description:null, tags:["proxies", "demo"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, appProxies:[{sourceUrl:"https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World", proxyUrl:"http://utility.arcgis.com/usrsvcs/appservices/8i5VAdSW92TFSUDL/rest/services/World/Route/NAServer/Route_World", hitsPerInterval:10, intervalSeconds:1, proxyId:"8i5VAdSW92TFSUDL"}, {sourceUrl:"https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer", proxyUrl:"http://utility.arcgis.com/usrsvcs/appservices/anZhdabTh6q1YMKq/rest/services/World/Traffic/MapServer", hitsPerInterval:100, intervalSeconds:1, proxyId:"anZhdabTh6q1YMKq"}], access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"b1a1bd1052a04c769695027c1da2eeb2", owner:"patrickarlt7104", created:1426710992000, modified:1426710992000, guid:null, name:null, title:"mapfolio Application", type:"Web Mapping Application", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Mapping Site", "Online Map", "Web Map"], description:"Web Mapping Application for mapfolio.", tags:["mapfolio_autoInstall", "mapfolio_autoInstall_application"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://apps.geopowered.com/mapfolio/?appid=b1a1bd1052a04c769695027c1da2eeb2", access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"02002dbe42b54a6d8e106928fe8ef7ae", owner:"kneemer", created:1427216915000, modified:1427216915000, guid:null, name:"oregoncrime2002.zip", title:"divided_by_with_classify", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["bug report"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"715b1810b77c4809bae9dadb05c7b330", owner:"kneemer", created:1427758198000, modified:1427758198000, guid:null, name:null, title:"GeoTigers", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["geotiger"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"142f8d90eb334e89aab3dd7ee2a7b612", owner:"aaronpk", created:1428688655000, modified:1428688655000, guid:null, name:null, title:"PushTest", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["aaronpk"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"39d69f9504bc4708ae38888535424f29", owner:"patrickarlt7104", created:1429134742000, modified:1429134742000, guid:null, name:null, title:"map", type:"Document Link", typeKeywords:["Data", "Document"], description:null, tags:["tag"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"https://gist.githubusercontent.com/patrickarlt/7f6e8884321c5160f021/raw/e3b735fc5e61f4ab78b744b630b83c518214274b/map.geojson", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"723a1dee2fa6430cbed0e3488de5576c", owner:"patrickarlt7104", created:1429134866000, modified:1429134866000, guid:null, name:"map.geojson", title:"map", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJSON", "Geometry", "GeometryCollection"], description:null, tags:["tag"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"2e149ae5aea34c618b87c291540d58af", owner:"patrickarlt7104", created:1430255019000, modified:1430256402494, guid:null, name:null, title:"App Service", type:"Application", typeKeywords:["Application", "Registered App", "App Proxy"], description:null, tags:["demo"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, appProxies:[{sourceUrl:"https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World", proxyUrl:"http://utility.arcgis.com/usrsvcs/appservices/50cdZrig5KNcY4ke/rest/services/World/Route/NAServer/Route_World", hitsPerInterval:1000, intervalSeconds:1, proxyId:"50cdZrig5KNcY4ke"}, {sourceUrl:"https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer", proxyUrl:"http://utility.arcgis.com/usrsvcs/appservices/nMHjDookO0su6q5H/rest/services/World/Traffic/MapServer", hitsPerInterval:1000, intervalSeconds:1, proxyId:"nMHjDookO0su6q5H"}, {sourceUrl:"https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World", proxyUrl:"http://utility.arcgis.com/usrsvcs/appservices/mDIPQrDxlZPijSx0/rest/services/World/Route/NAServer/Route_World", hitsPerInterval:1000, intervalSeconds:1, proxyId:"mDIPQrDxlZPijSx0"}], access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"59fd697833a049518592d7e13b04fe7c", owner:"manny_lopez", created:1430325325000, modified:1430325825000, guid:null, name:null, title:"Geotrigger Pro", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["geotrigger"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"null", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"10a969ea9fcf4d9d86aba0e3245ff50f", owner:"patrickarlt7104", created:1433693961000, modified:1433693961000, guid:null, name:"xfiles.zip", title:"xfiles", type:"Shapefile", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["foo"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"173d3f12cfee4185a60291579195f363", owner:"kneemer", created:1434748131000, modified:1434748131000, guid:null, name:null, title:"rainforest", type:"Application", typeKeywords:["Application", "Registered App"], description:"test", tags:["georain"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"24394ae59e3a482993dbaa3862b1956e", owner:"NikolasWise", created:1432913782000, modified:1432914147000, guid:null, name:null, title:"Lower Albina Impart Study?", type:"Web Mapping Application", typeKeywords:["JavaScript", "Map", "Mapping Site", "Online Map", "Ready To Use", "selfConfigured", "Web Map"], description:null, tags:["test"], snippet:"This is an examination of the web map template thingy", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/apps/ImpactSummary/index.html?appid=24394ae59e3a482993dbaa3862b1956e", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:5}, {id:"fb08fa57fbe241d69068adb4f46071aa", owner:"NikolasWise", created:1428602934000, modified:1428602948000, guid:null, name:null, title:"contours", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["test", "tiles"], snippet:"esting tiles", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83912440972034, 45.42955176940826], [-122.46803363310653, 45.65620826510416]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/contours/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"be3947bb0dd040c8b1b0508893825377", owner:"NikolasWise", created:1428620946000, modified:1428621006000, guid:null, name:"central_city_projects_bps.geojson", title:"central_city_projects_bps", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["test"], snippet:"export?", thumbnail:null, documentation:null, extent:[[-122.70093138918352, 45.4874711735984], [-122.64821340510385, 45.542544732687055]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8b37f4b562fb4620b9f84e98a83286d9", owner:"NikolasWise", created:1429114933000, modified:1429114947000, guid:null, name:"Find Locations in Portland Contours - Contours_5ft_pdx_(1)", title:"tile test two", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["tiles"], snippet:"test", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.70345094432786, 45.51938019069081], [-122.6310521034549, 45.55660322947741]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/tile_test_two/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"4c7f108f0e5a41d4a1d9b0b48a4a7ed1", owner:"aaronpk", created:1343229565000, modified:1366148790777, guid:null, name:"San Diego Test App", title:"San Diego Test App", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Web Map"], description:null, tags:["map"], snippet:"test", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://www.arcgis.com/apps/OnePane/basicviewer/index.html?appid=4c7f108f0e5a41d4a1d9b0b48a4a7ed1", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:7}, {id:"682598310102405ba60afbdc1f01ee51", owner:"aaronpk", created:1280952697000, modified:1366148791248, guid:null, name:null, title:"Redlands", type:"Web Map", typeKeywords:["Web Map", "Explorer Web Map", "Map", "Online Map", "ArcGIS Online"], description:null, tags:["test"], snippet:"summary", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-117.283, 34.0045], [-117.0822, 34.106]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:3721}, {id:"affbdbbe95fb489f9c4c8b1307b8ad16", owner:"aaronpk", created:1352996638000, modified:1366148793489, guid:null, name:null, title:"Al Test", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["Al"], snippet:"test", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-167.6953, -82.6763], [170.5078, 86.1273]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:6}, {id:"ffe3c16b86b3465d91f0470bfbb792a3", owner:"aaronpk", created:1343229421000, modified:1366148794377, guid:null, name:null, title:"San Diego", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["map"], snippet:"test", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-117.2198, 32.6734], [-117.0841, 32.7559]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:11}, {id:"9b004613773a4e18ae5006989c5b2cea", owner:"aaronpk", created:1354704305000, modified:1366148967654, guid:null, name:null, title:"test", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["test"], snippet:"test", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-117.5977, -50.9354], [50.0977, 68.5416]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:6}, {id:"ff7d82b4f2ad4f05b6e9d2645c6b1b9e", owner:"kneemer", created:1409935237000, modified:1409940624000, guid:null, name:null, title:"for collector", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Offline", "Online Map", "Web Map"], description:null, tags:["test"], snippet:"checking required attributes", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-112.1168, 34.2111], [-90.0343, 45.7477]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:12}, {id:"b6148747f7594f9aa7db562b07d6f912", owner:"aaronpk", created:1416943723000, modified:1416943774000, guid:null, name:null, title:"Testing Sharing", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["test", "aaronpk"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.756, 45.4835], [-122.6003, 45.5499]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"c63db91dd2594ab2abb18c5562e4712f", owner:"jsievert", created:1421340092000, modified:1421340439000, guid:null, name:null, title:"Heritage Trees", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Other", "Ready To Use", "Web AppBuilder", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"/apps/webappviewer/index.html?id=c63db91dd2594ab2abb18c5562e4712f", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"4e66aa0d3f984746935b4f6a955a193c", owner:"paulcpederson", created:1425592246000, modified:1425592248000, guid:null, name:null, title:"Test Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Offline", "Online Map", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.7045, 45.4921], [-122.6313, 45.5298]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d46efc8d250446128def5c9bcbbd4cbd", owner:"paulcpederson", created:1425594323000, modified:1425594676000, guid:null, name:null, title:"Template App", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.8006, 45.4674], [-122.4728, 45.6184]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"aebac88025064a27a8498508482dd2fa", owner:"patrickarlt7104", created:1426805648000, modified:1426805859000, guid:null, name:null, title:"Trimet Stops in PDX Neighborhoods", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "webmap_2.1", "Hosted Service"], description:null, tags:["test"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83674938105494, 45.43253600792552], [-122.47202418503875, 45.65287759272508]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Trimet_Stops_in_PDX_Neighborhoods/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"d0738f90a12443e6b0cf102cb8525417", owner:"patrickarlt7104", created:1427215914000, modified:1427215928000, guid:null, name:"Enriched Trimet Stops in PDX Neighborhoods - Trimet_Stops_in_PDX_Neighborhoods_0", title:"Tile of Stuff", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Enrich layer solution. Trimet Stops in PDX Neighborhoods - Trimet_Stops_in_PDX_Neighborhoods_0 were enriched", tags:["test"], snippet:"Analysis Feature Service generated from Enrich layer", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83674938105494, 45.432536007925506], [-122.47202418503875, 45.652877592725076]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jf7a6b717afa047c1bd2ea6c0829c2637", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/EnrichLayer/jobs/jf7a6b717afa047c1bd2ea6c0829c2637"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Tile_of_Stuff/MapServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"cb5f96dfd55a4a6da7f96d9a8769e9fd", owner:"patrickarlt7104", created:1431721388000, modified:1431721988000, guid:null, name:null, title:"Sharing a map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Presentation Map", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8128, 45.4307], [-122.4767, 45.625]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:6}, {id:"beab005f65bd4904a2a9567605c279dd", owner:"patrickarlt7104", created:1435079468000, modified:1435079476000, guid:null, name:null, title:"Test Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.8034, 45.47], [-122.5147, 45.6171]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"cf846b259e1d4577bc9f65b486c6ea08", owner:"aaronpk", created:1355520152000, modified:1357949230883, guid:null, name:"test_map_1355538149770", title:"Test Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-147.6921, 32.5956], [-42.7507, 57.4051]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"58e9c8b501bd4270aaa22eebbeb89b85", owner:"aaronpk", created:1365792121000, modified:1365792121000, guid:null, name:"Test App_1365806521112", title:"Test App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"87395b5a182f4093833eacd50ea7bdc1", owner:"aaronpk", created:1365793043000, modified:1365793043000, guid:null, name:"Test App_1365807442947", title:"Test App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"e21e01956a054551830ce75e167a1aad", owner:"aaronpk", created:1354704341000, modified:1366148967683, guid:null, name:"non-claro", title:"non-claro", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Web Map"], description:null, tags:["test"], snippet:"test", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://www.arcgis.com/apps/OnePane/basicviewer/index.html?appid=e21e01956a054551830ce75e167a1aad", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:5}, {id:"5da6cd23c18744ac9c27889db7980979", owner:"aaronpk", created:1364151290000, modified:1377277878735, guid:null, name:"Test App_1364165690601", title:"Test App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"dfed3a1f66dd406a9845bfe3ca1c013a", owner:"jsievert", created:1377879264000, modified:1377879264000, guid:null, name:null, title:"Geotrigger Test", type:"Application", typeKeywords:["Application", "Registered App"], description:"Geotrigger Test Application", tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"248897ee19314be1b6610bdbef5685a8", owner:"aaronpk", created:1379081766000, modified:1384776457169, guid:null, name:null, title:"OAuth Demo", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["test", "aaronpk"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"440739a0ecf14f52a15a772f84dd9427", owner:"patrickarlt7104", created:1389109407000, modified:1389378484000, guid:null, name:null, title:"Demographic Data Demo", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.6987, 45.5226], [-122.604, 45.5637]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:156}, {id:"e0628f0a1f8d4aeb8ccfbc8571e0c98e", owner:"kenichi", created:1392740215000, modified:1392740215000, guid:null, name:null, title:"geotrigger-ruby", type:"Application", typeKeywords:["Application", "Registered App"], description:"test application for the geotrigger-ruby gem", tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"440e5848133e45be94141b5d2f992e14", owner:"paulcpederson", created:1399048306000, modified:1399048306000, guid:null, name:null, title:"Token Generate Test", type:"Application", typeKeywords:["Application", "Registered App"], description:"See if I can figure out how to generate a token inside the developers site.", tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"468e3c10dea44e869db59208a96a8280", owner:"jsievert", created:1403029086000, modified:1403029086000, guid:null, name:null, title:"Adam", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["testing"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"a297f970845744bb819164ede7e77b4b", owner:"dstevenson", created:1405972018000, modified:1405972018000, guid:null, name:null, title:"My App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"dcad267e36334b918f745450a3e88ec7", owner:"loqipdx", created:1407193513000, modified:1407193515000, guid:null, name:"test", title:"test", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"test", tags:["elf"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.82307147216359, 45.45096046669867], [-122.48592852782814, 45.6361082348944]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/test/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"217a45359d2544d9a08bf17754540320", owner:"loqipdx", created:1408487371000, modified:1408487388000, guid:null, name:"Location_Tracking.zip", title:"Location Tracking", type:"CSV Collection", typeKeywords:["CSV Collection"], description:"Location tracking log for ArcGIS Collector app", tags:["TEST"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.718, 45.501], [-122.645, 45.54]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"5dcf16e566324d138735ba13b3a072e1", owner:"dstevenson", created:1409789629000, modified:1409789636000, guid:null, name:null, title:"test web map thing", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.7217, 45.5023], [-122.6269, 45.5448]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"6ec735d085cf4cf697d54e2525252f98", owner:"kneemer", created:1409940435000, modified:1409940448000, guid:null, name:null, title:"test features for collector", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Hosted Service"], description:null, tags:["test"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-114.55390426318336, 31.871083711105538], [-87.59713636786182, 47.66191789761966]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/test_features_for_collector/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"3055a3c7f6ac458b9a6b57fe867bbed5", owner:"kneemer", created:1409941110000, modified:1409941154000, guid:null, name:null, title:"map for activity", type:"Web Map", typeKeywords:["ArcGIS Online", "Collector", "Data Editing", "Explorer Web Map", "Map", "Offline", "Online Map", "Web Map"], description:"need to add activity", tags:["test"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-176.6602, -76.1532], [176.6602, 76.2167]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"4cc2198b9ce240d4a2b89b0a2d648713", owner:"jyaganeh@esri.com", created:1412016292000, modified:1412016295000, guid:null, name:"SRtest", title:"SRtest", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"what's it gonna be?", tags:["test", "deleteme"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.81002520751518, 45.45096046669871], [-122.49897479247655, 45.636108234894444]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/SRtest/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"e07cc58e8c7340d0bbc2e846e54a6f4e", owner:"smorehouse_Esri23", created:1412806659000, modified:1412807092000, guid:null, name:null, title:"test", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Other", "Ready To Use", "Web AppBuilder", "Web Map"], description:"sdfsdfsd <span style='font-weight: bold;'>bunny!  </span>sdfdsf", tags:["test"], snippet:"a test item built with the web applicaiton builder.", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"/apps/webappviewer/index.html?id=e07cc58e8c7340d0bbc2e846e54a6f4e", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"ee79e47a5ec346aaac1c21f9bc2b05fb", owner:"patrickarlt7104", created:1417538564000, modified:1417538565000, guid:null, name:null, title:"Traffic Again", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Dynamic", "Map Service", "Multilayer", "Service", "Service Proxy"], description:"<div style='text-align:Left;'><div><div><p style='margin:0 0 0 0;'><span>The map layers in this service provide color-coded maps of the traffic conditions you can expect for the present time (the default). The map shows present traffic as a blend of live and typical information. Live speeds are used wherever available and are established from real-time sensor readings. Typical speeds come from a record of average speeds, which are collected over several weeks within the last year or so. Layers also show current incident locations where available. </span></p><p style='margin:0 0 0 0;'><span>By changing the map time, the service can also provide past and future conditions. Live readings from sensors are saved for 12 hours, so setting the map time back within 12 hours allows you to see a actual recorded traffic speeds, supplemented with typical averages by default. You can choose to turn off the average speeds and see only the recorded live traffic speeds for any time within the 12-hour window. Predictive traffic conditions are shown for any time in the future.</span></p><p style='margin:0 0 0 0;'><span>The color-coded traffic map layer can be used to represent relative traffic speeds; this is a common type of a map for online services and is used to provide context for routing, navigation, and field operations. A color-coded traffic map can be requested for the current time and any time in the future. A map for a future request might be used for planning purposes.</span></p><p style='margin:0 0 0 0;'><span>The map also includes dynamic traffic incidents showing the location of accidents, construction, closures, and other issues that could potentially impact the flow of traffic. Traffic incidents are commonly used to provide context for routing, navigation and field operations. Incidents are not features; they cannot be exported and stored for later use or additional analysis.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Data source</span></p><p style='margin:0 0 0 0;'><span>Esri’s typical speed records and live and predictive traffic feeds come directly from HERE (</span><a href='http://www.HERE.com'><span><span>www.HERE.com</span></span></a><span><span>). HERE collects billions of GPS and cell phone probe records per month and, where available, uses sensor and toll-tag data to augment the probe data collected. An advanced algorithm compiles the data and computes accurate speeds. </span></span><span>The real-time and predictive traffic data is updated every five minutes through traffic feeds.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Data coverage</span></p><p style='margin:0 0 0 0;'><span>The service works globally and can be used to visualize traffic speeds and incidents in many countries. Check the </span><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=b7a893e8e1e04311bd925ea25cb8d7c7&amp;extent=-142.207,-43.4529,152.0508,70.729'><span><span>service coverage web map</span></span></a><span /><span> to determine availability in your area of interest. Look at the coverage map to learn whether a country currently supports traffic. The support for traffic incidents can be determined by identifying a country. For detailed information on this service, visit the </span><a href='http://links.esri.com/arcgis-online-network-analysis-rest-api'><span><span>directions and routing documentation</span></span></a><span /><span><span> and the </span></span><a href='http://links.esri.com/arcgis-online-traffic-arcmap'><span><span>ArcGIS Help</span></span></a><span>.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Symbology</span></p><p style='margin:0 0 0 0;'><span>Traffic speeds are displayed as a percentage of free-flow speeds, which is frequently the speed limit or how fast cars tend to travel when unencumbered by other vehicles. The streets are color coded as follows:</span></p><ul><li><p><span>Green (fast): 85 - 100% of free flow speeds</span></p></li><li><p><span>Yellow (moderate): 65 - 85%</span></p></li><li><p><span>Orange (slow); 45 - 65%</span></p></li><li><p><span>Red (stop and go): 0 - 45%</span></p></li></ul><p><span>To view live traffic only—that is, excluding typical traffic conditions—enable the Live Traffic layer and disable the Traffic layer. (You can find these layers under World/Traffic &gt; [region] &gt; [region] Traffic). To view more comprehensive traffic information that includes live and typical conditions, disable the Live Traffic layer and enable the Traffic layer.</span></p><p><span style='font-weight:bold;'>ArcGIS Online organization subscription</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Important Note:</span><span><span>The World Traffic map service is available for users with an ArcGIS Online organizational subscription. To access this map service, you'll need to sign in with an account that is a member of an organizational subscription. If you don't have an organizational subscription, you can create a new account and then sign up for a </span></span><a href='https://www.arcgis.com/about/trial.html'><span><span>30-day trial of ArcGIS Online</span></span></a><span>.</span></p></div></div></div>", tags:["Live Traffic", "Real time traffic", "traffic map", "traffic accidents", "incidents", "congestion", "traffic"], snippet:"This map service presents near real-time traffic information for different regions in the world. The data is updated every 5 minutes. This map service requires an ArcGIS Online organizational subscription.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-180, -59.5368], [180, 83.7257]], spatialReference:"102100", accessInformation:"Esri, HERE", licenseInfo:null, culture:"en-us", properties:null, url:"http://utility.arcgis.com/usrsvcs/servers/ee79e47a5ec346aaac1c21f9bc2b05fb/rest/services/World/Traffic/MapServer", sourceUrl:"http://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"09dce1f4e46e445cae0f5bedabaf6a9c", owner:"smorehouse_Esri23", created:1412806622000, modified:1412806625000, guid:null, name:null, title:"test", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Offline", "Online Map", "Web Map"], description:null, tags:["test"], snippet:"test", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.7368, 45.5797], [-122.7143, 45.5881]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:7}, {id:"0861e03de36e49e497eb96b1a52f0a71", owner:"paulcpederson", created:1419276246000, modified:1419276249000, guid:null, name:"Testing", title:"Testing ", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"ok", tags:["test", "delete"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.82307147216359, 45.45096046669871], [-122.48592852782814, 45.636108234894444]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Testing/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"09ff6a6945c04ac29e668088dd779360", owner:"smorehouse_Esri23", created:1421340089000, modified:1421340094000, guid:null, name:null, title:"test3", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Web AppBuilder", "Web Map", "Registered App"], description:null, tags:["temp"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"/apps/webappviewer/index.html?id=09ff6a6945c04ac29e668088dd779360", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"d2a271ebbb824165a0b7682ee7326590", owner:"smorehouse_Esri23", created:1421344691000, modified:1421344694000, guid:null, name:null, title:"test33", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Web AppBuilder", "Web Map", "Registered App"], description:null, tags:["temp"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"/apps/webappviewer/index.html?id=d2a271ebbb824165a0b7682ee7326590", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"d7e924e960394ceda010ef0302ec5c6c", owner:"paulcpederson", created:1372808576000, modified:1421879309000, guid:null, name:"Cool_Service_for_Friends", title:"Cool Service for Friends or whatever", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"Starring Poochy", tags:["test", "poochy"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Cool_Service_for_Friends/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:16}, {id:"602acea8c38145b184007259a8cf06ba", owner:"smorehouse_Esri23", created:1421883826000, modified:1421883829000, guid:null, name:null, title:"test5", type:"Web Mapping Application", typeKeywords:["Map", "Mapping Site", "Online Map", "Web AppBuilder", "Web Map"], description:null, tags:["temp"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"/apps/webappviewer/index.html?id=602acea8c38145b184007259a8cf06ba", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"613c5125e799463bac65ab963fbea52d", owner:"jsievert", created:1421954682000, modified:1421954682000, guid:null, name:null, title:"Test - Project Web Map", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "geodesignProjectIDdc196ed2a3f844279f83e6da19eded47", "geodesignProjectWebMap", "geodesignTemplateID6af1795876204c2aa6e1eb78c24948ec", "geodesignTemplateWebMapID172bd3fd9a2f48be9768210d05f3ecb8", "Map", "Online Map", "Web Map"], description:null, tags:["test", "geodesign", "geodesignProjectWebMap"], snippet:"Test Project", thumbnail:null, documentation:null, extent:[[-128.8916, 16.4607], [-53.7451, 57.4647]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"75d81fb408424067b14b58799530f188", owner:"jsievert", created:1421954684000, modified:1421954685000, guid:null, name:null, title:"Scenario A", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "geodesignProjectIDdc196ed2a3f844279f83e6da19eded47", "geodesignScenario", "Service"], description:null, tags:["test", "geodesign", "geodesignScenario"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/ForGeodesignIddc196ed2a3f844279f83e6da19eded47/FeatureServer", access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"cb0c3d8aeb98481c862ec7095f32dbab", owner:"jsievert", created:1421954689000, modified:1421954689000, guid:null, name:null, title:"Test", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "geodesignProjectIDdc196ed2a3f844279f83e6da19eded47", "geodesignUserWebMap", "Map", "Online Map", "Web Map"], description:null, tags:["test", "geodesign", "geodesignUserWebMap"], snippet:null, thumbnail:null, documentation:null, extent:[[-128.8916, 16.4607], [-53.7451, 57.4647]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"shared", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"fdbdd4a1b2204908871ce17eadc5c5df", owner:"patrickarlt7104", created:1426199197000, modified:1426199253058, guid:null, name:null, title:"Demo", type:"Application", typeKeywords:["Application", "Registered App", "App Proxy"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, appProxies:[{sourceUrl:"https://geoenrich.arcgis.com/arcgis/rest/services/World/GeoenrichmentServer", proxyUrl:"http://utility.arcgis.com/usrsvcs/appservices/jGwdAwLu992oMTiY/rest/services/World/GeoenrichmentServer", hitsPerInterval:1000, intervalSeconds:60, proxyId:"jGwdAwLu992oMTiY"}], access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"7a36a106384842bdad022911e6027fce", owner:"patrickarlt7104", created:1426805625000, modified:1426805625000, guid:null, name:"Trimet_Transit_Stops_In_Portland_Neighborhoods.geojson", title:"Trimet Stops in PDX Neighborhoods", type:"GeoJson", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJSON", "Geometry", "GeometryCollection"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"fe39135ae0e3428b900189651ed52585", owner:"patrickarlt7104", created:1427214424000, modified:1427214452000, guid:null, name:null, title:"Sharing Demo", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8226, 45.4428], [-122.4862, 45.6426]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"org", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"a030eb498bfc4dc88c55061a6ab2a2d7", owner:"kneemer", created:1417904956000, modified:1428965141000, guid:null, name:null, title:"PortlandHeritageTrees2", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["test"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.7495015860359, 45.43435020107916], [-122.50184198231008, 45.597597739114306]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/PortlandHeritageTrees2/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:176}, {id:"98f9b721e4ff485fabbcf062b35a5d61", owner:"patrickarlt7104", created:1429128689000, modified:1429128689000, guid:null, name:null, title:"Traffic", type:"Map Service", typeKeywords:["ArcGIS Server", "Data", "Dynamic", "Map Service", "Multilayer", "Service", "Service Proxy"], description:"<div style='text-align:Left;'><div><div><p style='margin:0 0 0 0;'><span>The map layers in this service provide color-coded maps of the traffic conditions you can expect for the present time (the default). The map shows present traffic as a blend of live and typical information. Live speeds are used wherever available and are established from real-time sensor readings. Typical speeds come from a record of average speeds, which are collected over several weeks within the last year or so. Layers also show current incident locations where available. </span></p><p style='margin:0 0 0 0;'><span>By changing the map time, the service can also provide past and future conditions. Live readings from sensors are saved for 12 hours, so setting the map time back within 12 hours allows you to see a actual recorded traffic speeds, supplemented with typical averages by default. You can choose to turn off the average speeds and see only the recorded live traffic speeds for any time within the 12-hour window. Predictive traffic conditions are shown for any time in the future.</span></p><p style='margin:0 0 0 0;'><span>The color-coded traffic map layer can be used to represent relative traffic speeds; this is a common type of a map for online services and is used to provide context for routing, navigation, and field operations. A color-coded traffic map can be requested for the current time and any time in the future. A map for a future request might be used for planning purposes.</span></p><p style='margin:0 0 0 0;'><span>The map also includes dynamic traffic incidents showing the location of accidents, construction, closures, and other issues that could potentially impact the flow of traffic. Traffic incidents are commonly used to provide context for routing, navigation and field operations. Incidents are not features; they cannot be exported and stored for later use or additional analysis.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Data source</span></p><p style='margin:0 0 0 0;'><span>Esri’s typical speed records and live and predictive traffic feeds come directly from HERE (</span><a href='http://www.HERE.com'><span><span>www.HERE.com</span></span></a><span><span>). HERE collects billions of GPS and cell phone probe records per month and, where available, uses sensor and toll-tag data to augment the probe data collected. An advanced algorithm compiles the data and computes accurate speeds. </span></span><span>The real-time and predictive traffic data is updated every five minutes through traffic feeds.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Data coverage</span></p><p style='margin:0 0 0 0;'><span>The service works globally and can be used to visualize traffic speeds and incidents in many countries. Check the </span><a href='http://www.arcgis.com/home/webmap/viewer.html?webmap=b7a893e8e1e04311bd925ea25cb8d7c7&amp;extent=-142.207,-43.4529,152.0508,70.729'><span><span>service coverage web map</span></span></a><span /><span> to determine availability in your area of interest. Look at the coverage map to learn whether a country currently supports traffic. The support for traffic incidents can be determined by identifying a country. For detailed information on this service, visit the </span><a href='http://links.esri.com/arcgis-online-network-analysis-rest-api'><span><span>directions and routing documentation</span></span></a><span /><span><span> and the </span></span><a href='http://links.esri.com/arcgis-online-traffic-arcmap'><span><span>ArcGIS Help</span></span></a><span>.</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Symbology</span></p><p style='margin:0 0 0 0;'><span>Traffic speeds are displayed as a percentage of free-flow speeds, which is frequently the speed limit or how fast cars tend to travel when unencumbered by other vehicles. The streets are color coded as follows:</span></p><ul><li><p><span>Green (fast): 85 - 100% of free flow speeds</span></p></li><li><p><span>Yellow (moderate): 65 - 85%</span></p></li><li><p><span>Orange (slow); 45 - 65%</span></p></li><li><p><span>Red (stop and go): 0 - 45%</span></p></li></ul><p><span>To view live traffic only—that is, excluding typical traffic conditions—enable the Live Traffic layer and disable the Traffic layer. (You can find these layers under World/Traffic &gt; [region] &gt; [region] Traffic). To view more comprehensive traffic information that includes live and typical conditions, disable the Live Traffic layer and enable the Traffic layer.</span></p><p><span style='font-weight:bold;'>ArcGIS Online organization subscription</span></p><p style='margin:0 0 0 0;'><span style='font-weight:bold;'>Important Note:</span><span><span>The World Traffic map service is available for users with an ArcGIS Online organizational subscription. To access this map service, you'll need to sign in with an account that is a member of an organizational subscription. If you don't have an organizational subscription, you can create a new account and then sign up for a </span></span><a href='https://www.arcgis.com/about/trial.html'><span><span>30-day trial of ArcGIS Online</span></span></a><span>.</span></p></div></div></div>", tags:["Live Traffic", "Real time traffic", "traffic map", "traffic accidents", "incidents", "congestion", "traffic"], snippet:"This map service presents near real-time traffic information for different regions in the world. The data is updated every 5 minutes. This map service requires an ArcGIS Online organizational subscription.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-180, -59.5368], [180, 83.7257]], spatialReference:"102100", accessInformation:"Esri, HERE", licenseInfo:null, culture:"en-us", properties:null, url:"http://utility.arcgis.com/usrsvcs/servers/98f9b721e4ff485fabbcf062b35a5d61/rest/services/World/Traffic/MapServer", sourceUrl:"http://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"68294b0250a54f04a04155a7caa4c461", owner:"patrickarlt7104", created:1429129405000, modified:1429129405000, guid:null, name:null, title:"Gap Mapper", type:"Web Mapping Application", typeKeywords:["Flex", "Map", "Mapping Site", "Online Map", "Ready To Use", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://internal.shell.com/apps/gasMapper", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"7dbb0d38e4534e3e9f87e68bc95647e6", owner:"kneemer", created:1431625378000, modified:1431625378000, guid:null, name:null, title:"testament", type:"Web Map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[[-123.2622, 45.4059], [-122.0468, 45.681]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"209d4a86be4a4bc08a4bb06778be1697", owner:"kneemer", created:1435010937000, modified:1435010937000, guid:null, name:null, title:"dtest2", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["test"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8b78fa529f4949ca84dc85fb6dc00462", owner:"patrickarlt7104", created:1435031842000, modified:1435031846000, guid:null, name:"Esri_Leaflet_Auth_Test", title:"Esri Leaflet Auth Test", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["auth", "testing", "leaflet"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.82307147216153, 45.45096046669794], [-122.48592852782608, 45.636108234893676]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Esri_Leaflet_Auth_Test/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"cbb23a8393d3437cb05d7b6cf823236e", owner:"patrickarlt7104", created:-1, modified:1374267954742, guid:null, name:"Antartica Stories", title:"Antartica Stories", type:"Feature Service", typeKeywords:["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Antartica Stories/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"c03f242642424b3ab96b974ee4ca7ed0", owner:"patrickarlt7104", created:-1, modified:1374268067406, guid:null, name:"TestFoo", title:"TestFoo", type:"Feature Service", typeKeywords:["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/TestFoo/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"24ce4e96dbfa4ee7b4c4d5a7d71770c0", owner:"kenichi", created:1374608820000, modified:1374608820000, guid:null, name:null, title:"gtrigz", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"29e4766ab93d425ebaa5c60577184819", owner:"rarana", created:1374758839000, modified:1374758839000, guid:null, name:null, title:"Test App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"a6d102127bb746858dbfc469bcf49205", owner:"jsievert", created:1377888168000, modified:1377888168000, guid:null, name:null, title:"Test", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"23cab1e56854444f86cdeef8c654b5cd", owner:"rarana", created:1377969185000, modified:1377969185000, guid:null, name:null, title:"ios-geotrigger-sample", type:"Application", typeKeywords:["Application", "Registered App"], description:"Sample app for the SDK Beta", tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"96f3f899da184aea95c12996ac194bc7", owner:"rarana", created:1377970059000, modified:1377970059000, guid:null, name:null, title:"ios-geotrigger-sample-2", type:"Application", typeKeywords:["Application", "Registered App"], description:"SDK Beta sample app", tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"1116e817ab9e425dadf1d29ca5f8eb52", owner:"rarana", created:1378235916000, modified:1378235916000, guid:null, name:null, title:"geotrigger-debug-ios", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"2e6b910cafdf4c39ab1183c512bf953e", owner:"ngoldman", created:1379687492000, modified:1379687492000, guid:null, name:null, title:"secret test app", type:"Application", typeKeywords:["Application", "Registered App"], description:"shhh", tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"2c391180c637442482da1dfdb021c298", owner:"kenichi", created:1381240644000, modified:1381240644000, guid:null, name:null, title:"shadow", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8cb31f220db84bdbbcc798262f2bea7b", owner:"kenichi", created:1387201048000, modified:1387201048000, guid:null, name:null, title:"gtdb", type:"Application", typeKeywords:["Application", "Registered App"], description:"gtrigz debugger", tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"02a07111fbb94d3492981b43bec9ea2a", owner:"patrickarlt7104", created:1388494272000, modified:1388494272000, guid:null, name:null, title:"Esri Leaflet Test", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"49a6cbeca3b9449a99ab9d393a8b1f80", owner:"manny_lopez", created:1394640758000, modified:1394640758000, guid:null, name:null, title:"app on manny_lopez", type:"Application", typeKeywords:["Application", "Registered App"], description:"3/12/14", tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"869d32e47de64e64b3bd1c42824f132b", owner:"patrickarlt7104", created:1396445415000, modified:1396445415000, guid:null, name:null, title:"Test", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"496329f1c04f4b8e92156726520b1496", owner:"patrickarlt7104", created:1397066742000, modified:1397066742000, guid:null, name:null, title:"Coffee Test", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"a84d3b6e162a4ccea2db9d90bd048cb1", owner:"patrickarlt7104", created:1398339393000, modified:1398339393000, guid:null, name:null, title:"Import Test", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"df68bfd7066d42e98bff7487c4de0f89", owner:"patrickarlt7104", created:1402935886000, modified:1402950288000, guid:null, name:"stops2.csv", title:"stops2", type:"CSV", typeKeywords:["CSV"], description:null, tags:[], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"2b429477982a4bd6901968edf1f77df7", owner:"jsievert", created:1403194043000, modified:1403208450000, guid:null, name:"Fred", title:"Fred", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:"stuff", tags:[], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.81174182128473, 45.450960466698696], [-122.49725817870701, 45.63610823489444]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Fred/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8ddb2d5273534eda845e467500f447fb", owner:"aaronpk", created:1404400276000, modified:1404400276000, guid:null, name:null, title:"Geotrigger Demo App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"77851373b5d94f42aa878299595361ee", owner:"ahaddad_Esri23", created:1405010280000, modified:1405010280000, guid:null, name:"PDX.csv", title:"PDX", type:"CSV", typeKeywords:["CSV"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"771c8952cffd4b8a90d0e037c9ffed8f", owner:"ahaddad_Esri23", created:1405011195000, modified:1405011195000, guid:null, name:"Table1.csv", title:"Table1", type:"CSV", typeKeywords:["CSV"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"e392b6d34d964f1293ae2ac3a036d2a6", owner:"ahaddad_Esri23", created:1405011196000, modified:1405025670000, guid:null, name:null, title:"Table1", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:[], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.68277787199972, 45.511317121000495], [-122.6489295929998, 45.522407833000486]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Table1/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"0173aeaf175d416eb927300d269f21d8", owner:"ahaddad_Esri23", created:1405012280000, modified:1405012280000, guid:null, name:"Table2.csv", title:"Table2", type:"CSV", typeKeywords:["CSV"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"7c554177b0e246d6b36c8af61bc19228", owner:"ahaddad_Esri23", created:1405012281000, modified:1405026719000, guid:null, name:null, title:"Table2", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:[], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.68277787199972, 45.511317121000495], [-122.6489295929998, 45.522407833000486]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Table2/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"cdb30f889cbf4c918b461359a56be2c6", owner:"ahaddad_Esri23", created:1405013935000, modified:1405013935000, guid:null, name:"Davy1.csv", title:"Davy1", type:"CSV", typeKeywords:["CSV"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8354c4b241314bcf9eac475d7234bebe", owner:"ahaddad_Esri23", created:1405013937000, modified:1405028389000, guid:null, name:null, title:"Davy1", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:[], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.68277787199972, 45.511317121000495], [-122.6489295929998, 45.522407833000486]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Davy1/FeatureServer", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"064f038dcf3641baa374b027d6e920a2", owner:"jyaganeh@esri.com", created:1405207472000, modified:1405221874000, guid:null, name:"cities_to_visit", title:"cities to visit", type:"Feature Service", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:[], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.78633593749569, 45.45096046669867], [-122.52266406249603, 45.6361082348944]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:null, properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/cities_to_visit/FeatureServer", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"1d3164d09fa3430f90cd7376b3aab766", owner:"patrickarlt7104", created:1406552782000, modified:1406552782000, guid:null, name:null, title:"Geotrigger JS Test", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"fa286012cad043ff89536fb52ffc7e09", owner:"loqipdx", created:1407968563000, modified:1407968563000, guid:null, name:null, title:"fake app", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"549e76d87dee4cd1a5e7bef15d632d0f", owner:"smorehouse_Esri23", created:1412806670000, modified:1412806670000, guid:null, name:"549e76d87dee4cd1a5e7bef15d632d0f", title:"test", type:"Code Attachment", typeKeywords:["Code", "Javascript", "Web Mapping Application"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/sharing/rest/content/items/e07cc58e8c7340d0bbc2e846e54a6f4e/package", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"5c4a21058d3e495ca5f15bcd7ffe74b5", owner:"loqipdx", created:1413842108000, modified:1413842108000, guid:null, name:null, title:"My App", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"english (united states)", properties:null, url:null, access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"b1694ff45914443ba59ae42d0358aee4", owner:"smorehouse_Esri23", created:1421340115000, modified:1421340115000, guid:null, name:"b1694ff45914443ba59ae42d0358aee4", title:"test3", type:"Code Attachment", typeKeywords:["Code", "Javascript", "Web Mapping Application"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/sharing/rest/content/items/09ff6a6945c04ac29e668088dd779360/package", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8183565c2dd74a15810bf9448eaadad2", owner:"jsievert", created:1421340115000, modified:1421340115000, guid:null, name:"8183565c2dd74a15810bf9448eaadad2", title:"Test", type:"Code Attachment", typeKeywords:["Code", "Javascript", "Web Mapping Application"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/sharing/rest/content/items/c63db91dd2594ab2abb18c5562e4712f/package", access:"public", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"7457d077910b4cc6b2ff0c810ca17eb6", owner:"smorehouse_Esri23", created:1421344705000, modified:1421344705000, guid:null, name:"7457d077910b4cc6b2ff0c810ca17eb6", title:"test33", type:"Code Attachment", typeKeywords:["Code", "Javascript", "Web Mapping Application"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/sharing/rest/content/items/d2a271ebbb824165a0b7682ee7326590/package", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"dcd561037f984871b93e08abee880d43", owner:"smorehouse_Esri23", created:1421357625000, modified:1421357625000, guid:null, name:"dcd561037f984871b93e08abee880d43", title:"dfsfsddf", type:"Code Attachment", typeKeywords:["Code", "Javascript", "Web Mapping Application"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"https://esripdx.maps.arcgis.com/sharing/rest/content/items/0378bb0bcfcd4096a09cf8a65b0271e0/package", access:"private", size:-1, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, numComments:0, numRatings:0, avgRating:0, numViews:0}]};

},{}],4:[function(require,module,exports){
"use strict";module.exports = {username:"NikolasWise", total:84, start:1, num:84, nextStart:-1, currentFolder:null, items:[{id:"scene-layer-id", owner:"esri_3d", orgId:"P3ePLMYs2RVChkJx", created:1418274743000, modified:1425540276000, guid:null, name:null, title:"Portland, Oregon USA  Buildings", type:"Scene Service", typeKeywords:["ArcGIS Server", "Data", "Scene Service", "Service", "Singlelayer"], description:"<font size='3'>This layer provides 3D models of buildings for Portland, Oregon USA to support your work 3D and provides a technical preview of 3D streaming capabilities of ArcGIS 10.3.  You can use this layer  ArcGIS Pro projects or the Online Scene viewer to\r\n visualize your maps and layers within the context of the built \r\nenvironment.  This layer includes data provided by the City of Portland, Oregon USA.  <br /><br /></font>\r\n<font size='3'><span style='font-weight: bold;'><span style='color: rgb(178, 34, 34);'>Note:</span></span> The\r\nscene layer of buildings is being published by Esri using an early, internal\r\nrelease of 10.3.1.  Users will be able to publish similar\r\nbuildings and other features based on geometry meshes (aka multipatch\r\ngeometry) using ArcGIS for Server when this capability is\r\nreleased in 2015.</font>", tags:["holistic sample", "3D", "3D Buildings", "3D Cities", "Urban"], snippet:"This layer provides 3D models of buildings for Portland, Oregon USA to support your work in 3D", thumbnail:"thumbnail/Portland3DCity.png", documentation:null, extent:[[-122.823, 45.376], [-122.529, 45.67]], spatialReference:null, accessInformation:"Oregon Metro, City of Portland, Esri", licenseInfo:"<span style='font-family: Verdana, Helvetica, sans-serif; font-size: 12px; overflow: auto; background-color: rgb(255, 255, 255);'><span style='overflow: auto;'><img alt='Esri logo' src='http://downloads.esri.com/blogs/arcgisonline/esrilogo_new.png' style='border: 0px currentcolor;' /> </span></span><span style='font-family: Verdana, Helvetica, sans-serif; font-size: 12px; background-color: rgb(255, 255, 255);'>This work is licensed under the Esri Master License Agreement.</span><div style='margin: 0px; padding: 0px; font-family: Verdana, Helvetica, sans-serif; font-size: 12px; background-color: rgb(255, 255, 255);'><span style='line-height: 1.3846;'><font size='2' style='background-color: rgb(0, 0, 0);'><br /></font></span><a href='http://links.esri.com/tou_summary' style='color: rgb(33, 117, 155); outline: none !important;' target='_blank'><b>View Summary</b></a><span style='line-height: 1.3846;'> | </span><b><a href='http://links.esri.com/agol_tou' style='color: rgb(33, 117, 155); line-height: 1.3846; outline: none !important;' target='_blank'>View Terms of Use</a></b></div>", culture:"en-us", properties:null, url:"http://scene.arcgis.com/arcgis/rest/services/Hosted/Building_Portland/SceneServer", access:"public", size:81, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, commentsEnabled:true, numComments:0, numRatings:0, avgRating:0, numViews:2627, is3d:true, hasData:true, hasVisualization:true, hasUsage:true}, {id:"scene-id", owner:"esri_3d", orgId:"P3ePLMYs2RVChkJx", created:1418285978000, modified:1425545858000, guid:null, name:null, title:"Portland, Oregon USA Scene", type:"Web Scene", typeKeywords:["3D", "Map", "Scene", "Streaming", "Web", "Web Scene"], description:"<span style='overflow: auto;'><font size='4'><span style='font-family: Tahoma;'>This\r\n scene highlights layers for Portland, Oregon available in ArcGIS to \r\nsupport your work in 3D.  Use these layers in conjunction with your own \r\nlayers to create new scenes focused on a specific topic or area of \r\ninterest to you.  What\r\n\r\n is a scene?  Think of it as a map for working in 3D but with \r\nadditional settings for things like sun angle.</span><br /><br /></font></span><font size='3' style='font-family: Tahoma;'><span style='overflow: auto;'><span><font size='4'>What's in this scene? </font><br />1)\r\n Terrain: includes a global 3D terrain layer to provide \r\nelevation context.  Your layers are placed in relationship to this \r\nterrain<br />2) Basemap: includes one of the ArcGIS Basemaps regularly used in in your mapping work<br />3) Scene Layers</span></span>: includes a layer</font><font size='3'>\r\n of 3D buildings to help understand your data within the context of the \r\nbuilt environment.  The layer is a file type optimized for rendering in \r\n3D.<br /><br />This scene has pop ups available for the Buildings layer to provide useful information<br /><img alt='Buildings Layer Pop Up' src='http://arcgis.com/sharing/rest/content/items/5204857c4ca141748928a2dbc40e4515/data' /></font><br /><font size='3'><span style='overflow: auto;'><font size='4'><font face='Tahoma'><br />Create your own scene:</font><br /><font size='3' style='font-family: Tahoma;'>1) Sign in with your ArcGIS account and create new scene</font></font></span></font><br /><font size='3'><span style='overflow: auto;'><font size='4'><font size='3' style='font-family: Tahoma;'>2) Add this scene: Click ADD LAYERS and click Import</font></font></span></font><div style='margin-left: 40px;'><img alt='Esri Featured Content' src='http://arcgis.com/sharing/rest/content/items/49f8084f5a4648328fac4711f955d8c7/data' /><br /></div><font size='3'><span style='overflow: auto;'><font size='4'><font size='3' style='font-family: Tahoma;'>3) Choose basemap: Select one of the ArcGIS basemaps from the Basemap Gallery<br /></font></font></span></font><div style='margin-left: 40px;'><img alt='Scene Basemap Gallery' src='http://arcgis.com/sharing/rest/content/items/7421ffb325504b8289dd061bcf8a068e/data' /></div><font size='3'><span style='overflow: auto;'><font size='4'><font size='3' style='font-family: Tahoma;'>4) Add your own unique layers </font></font></span></font><font size='3'><span style='overflow: auto;'><font size='4'><font size='3' style='font-family: Tahoma;'><font size='3'><span style='overflow: auto;'><font size='4'><font size='3' style='font-family: Tahoma;'>(Note: publishing multipatch features like 3D buildings will be supported in the 10.3.1 release of ArcGIS)<br /></font></font></span></font>5) Create slides to direct users to interesting places in your scene - <a href='http://video.esri.com/watch/3981/author-web-scenes-using-arcgis-online' target='_blank'>See More</a><br />6) Save and share the results of your work with others in your organization and the \r\npublic</font></font></span><br /><br /></font><font size='3'><font size='3'><span style='font-weight: bold;'>Examples</span> <br />Gain inspiration from these examples to help you create your own scene</font><br /><a href='http://qaext.arcgis.com/home/item.html?id=220029e0ec714403934c473faee1eec9' target='_blank'>Visualize Urban Development</a><br /><a href='http://qaext.arcgis.com/home/item.html?id=1dc308ae1e65421292e8b04813d59e48' target='_blank'>Perform Solar Analysis</a><br /><br />For more see these helpful videos:<br /><span style='color: rgb(0, 0, 238);'><span style='font-weight: bold;'><a href='http://video.esri.com/watch/3991/mashup-3d-content-using-arcgis-online' target='_blank'>Mashup 3D Content Using ArcGIS Online</a><br /><a href='http://video.esri.com/watch/3981/author-web-scenes-using-arcgis-online' target='_blank'>Author Web Scenes Using ArcGIS Online</a></span></span></font><span style='line-height: 22.153844833374px; color: rgb(0, 0, 0); font-size: medium;'></span>", tags:["holistic sample", "3D", "3D Buildings", "3D Cities", "Urban", "Scenes"], snippet:"This scene highlights layers for Portland, Oregon available in ArcGIS to support your work in 3D.  Use these layers in conjunction with your own layers to create new scenes focused on a specific topic or area of interest to you.", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.068274, 45.279301], [-122.179095, 45.739868]], spatialReference:null, accessInformation:"Oregon Metro, City of Portland, Esri", licenseInfo:"<span style='font-family: Verdana, Helvetica, sans-serif; font-size: 12px; overflow: auto; background-color: rgb(255, 255, 255);'><span style='overflow: auto;'><img alt='Esri logo' src='http://downloads.esri.com/blogs/arcgisonline/esrilogo_new.png' style='border: 0px currentcolor;' /> </span></span><span style='font-family: Verdana, Helvetica, sans-serif; font-size: 12px; background-color: rgb(255, 255, 255);'>This work is licensed under the Esri Master License Agreement.</span><div style='margin: 0px; padding: 0px; font-family: Verdana, Helvetica, sans-serif; font-size: 12px; background-color: rgb(255, 255, 255);'><span style='line-height: 1.3846;'><font size='2' style='background-color: rgb(0, 0, 0);'><br /></font></span><a href='http://links.esri.com/tou_summary' style='color: rgb(33, 117, 155); outline: none !important;' target='_blank'><b>View Summary</b></a><span style='line-height: 1.3846;'> | </span><b><a href='http://links.esri.com/agol_tou' style='color: rgb(33, 117, 155); line-height: 1.3846; outline: none !important;' target='_blank'>View Terms of Use</a></b></div>", culture:"en-us", properties:null, url:null, access:"public", size:15352, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, commentsEnabled:true, numComments:0, numRatings:1, avgRating:3.75, numViews:2041, canOpen:true, is3d:true, hasData:false, hasVisualization:false, hasUsage:true}, {id:"registration-id", owner:"NikolasWise", created:1416521556000, modified:1416521556000, guid:null, name:null, title:"Lower Albina", type:"Application", typeKeywords:["Application", "Registered App"], description:null, tags:["holistic sample", "portland", "mapping"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:0, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, commentsEnabled:true, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"dumb-file-id", owner:"Melbourne_Water", orgId:"ZSYwjtv8RKVhkXIL", created:1435625501000, modified:1435815779000, guid:null, name:"Melbourne_WW_WQ_data.xls", title:"Water Quality Data", type:"Microsoft Excel", typology:"file", typeKeywords:["Data", "Document", "Microsoft Excel"], description:"<p><span style='font-family: Calibri, sans-serif; color: black;'>Across the Melbourne region over 140 volunteer monitoring groups\r\nmonitor over 400 sites across the five major catchments. Healthy Waterways\r\nWaterwatch monitors are trained to conduct tests that assess the health of the\r\nwaterway. The results of these tests are compared to guidelines on ecological\r\nhealth. By monitoring water quality and biological indicators and observing the\r\nenvironment we can learn about the health of waterways and help identify\r\nproblems. Healthy Waterways Waterwatch data can also provide an historical\r\nrecord of how waterways have changed over time and identify actions to rectify\r\nany problems.</span></p>\r\n\r\n<p> </p>\r\n\r\n<p><span> </span></p>", tags:["holistic sample", "Melbourne Water Corporation", "MWC", "Victoria", "Utility", "Healthy Waterways Vision"], snippet:"Spreadsheet containing water quality data", thumbnail:"thumbnail/C_3A_Users_rorked_Desktop_waterquality.jpg", documentation:null, extent:[], spatialReference:null, accessInformation:"Melbourne Water Corporation", licenseInfo:"<a href='http://creativecommons.org/licenses/by/3.0/' target='_blank'>Creative Commons Attribution</a>", culture:"en-us", properties:null, url:null, access:"public", size:16924160, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, commentsEnabled:false, numComments:0, numRatings:0, avgRating:0, numViews:28}, {id:"desktop-file-id", owner:"esri", orgId:"P3ePLMYs2RVChkJx", created:1291234057000, modified:1432158987000, guid:"C1A19CCB-23F5-4293-A94E-69ACBFC81FCD", name:"Imagery.lpk", title:"Imagery", type:"Layer Package", typology:"file", typeKeywords:["holistic sample", "ArcGIS Explorer", "ArcGlobe", "ArcMap", "Data", "Layer Package", "lpk"], description:"<span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><p><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span>This  layer package can be used by ArcGIS Desktop 9.3.1 or 10 users. The  services it contains are stored as a high performance basemap layer which gives you  the best drawing speed in ArcGIS 10. </span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>(This basemap layer appears as a normal group layer when opened in 9.3.1.)</p><p>This layer package <span style='overflow: auto;'><span>provides one meter or better satellite and aerial imagery in many parts of the world and lower resolution satellite imagery worldwide with transportation, political boundaries and place names for reference purposes. </span></span><span style='overflow: auto;'><span>For more details, visit the <a href='http://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9'>World Imagery</a>, <a href='http://www.arcgis.com/home/item.html?id=94f838a535334cf1aa061846514b77c7' target='_self'>World Transportation</a>, and <a href='http://www.arcgis.com/home/item.html?id=a842e359856a4365b1ddf8cc34fde079'>World Boundaries and Places</a> map service descriptions.</span></span></p><span style='display: block;'></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>", tags:["holistic sample", "world", "imagery", "basemap", "satellite", "aerial", "orthophotos", "maps"], snippet:"This LPK combines the World Imagery service and World Transportation and World Boundaries and Places reference overlay services in one convenient group layer", thumbnail:"thumbnail/Imagery.png", documentation:null, extent:[[-179.99998854084, -89], [179.99998854084, 89]], spatialReference:"None", accessInformation:"Esri and its users and partners", licenseInfo:"<span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><span><div style='display: block;'></div><div style='display: block;'><span style='overflow: auto;'><span><span style='overflow: auto; font-family: Verdana, Helvetica, sans-serif; font-size: 12px; background-color: rgb(255, 255, 255);'><img alt='Esri logo' src='http://downloads.esri.com/blogs/arcgisonline/esrilogo_new.png' style='border: 0px currentColor;' /> </span><span style='font-family: Verdana, Helvetica, sans-serif; font-size: 12px; background-color: rgb(255, 255, 255);'>This work is licensed under the Esri Master License Agreement.</span></span></span><div style='margin: 0px; padding: 0px; font-family: Verdana, Helvetica, sans-serif; font-size: 12px; background-color: rgb(255, 255, 255);'><span style='line-height: 1.3846;'><font size='2' style='background-color: rgb(0, 0, 0);'><br /></font></span><a href='http://links.esri.com/tou_summary' style='color: rgb(33, 117, 155);' target='_blank'><b>View Summary</b></a><span style='line-height: 1.3846;'> | </span><span style='line-height: 1.3846;'><a href='http://links.esri.com/agol_tou' style='color: rgb(33, 117, 155); line-height: 1.3846;' target='_blank'><b>View Terms of Use</b></a></span></div></div></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>", culture:"en-us", properties:null, url:null, access:"public", size:28685, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, commentsEnabled:true, numComments:0, numRatings:8, avgRating:4.3888897895813, numViews:545442}, {id:"publishable-file-id", owner:"rsacco", created:1317222565000, modified:1417724421000, guid:null, name:"Elk.zip", title:"CPW Elk Shapefile Download", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:"<p><span>Updated December, 2014</span></p><p><span></span><span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>HIGHWAY CROSSING:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>Those areas where elk movements traditionally cross roads, presenting potential conflicts between elk and motorists.</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>LIMITED USE AREA:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>An area within the overall range which is occasionally inhabited by elk and/or contains a small scattered population of elk.</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>MIGRATION CORRIDORS:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>A specific mappable site through which large numbers of animals migrate and loss of which would change migration routes.</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>OVERALL RANGE:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>The area which encompasses all known seasonal activity areas within the observed range of an elk  population.</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>PRODUCTION AREA:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>That part of the overall range of elk occupied by the females from May 15 to June 15 for calving. (Only known areas are mapped and this does not include all production areas for the DAU).</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>RESIDENT POPULATION:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>An area used year-round by a population of elk.  Individuals could be found in any part of the area at any time of the year; the area cannot be subdivided into seasonal ranges.  It is most likely included within the overall range of the larger population.</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>SEVERE WINTER:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>That part of the range of a species where 90 percent of the individuals are located when the annual snowpack is at its maximum and/or temperatures are at a minimum in the two worst winters out of ten.  The winter of 1983-84 is a good example of a severe winter.</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>SUMMER CONCENTRATION:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>Those areas where elk concentrate from mid-June through mid-August.  High quality forage, security, and lack of disturbance are characteristics of these areas to meet the high energy demands of lactation, calf rearing, antler growth, and general preparation for the rigors of fall and winter.</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>SUMMER RANGE:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>That part of the range of a species where 90% of the individuals are located between spring green-up and the first heavy snowfall, or during a site specific period of summer as defined for each DAU.  Summer range is not necessarily exclusive of winter range; in some areas winter range and summer range may overlap.</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>WINTER CONCENTRATION:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>That part of the winter range of a species where densities are at least 200% greater than the surrounding winter range density during the same period used to define winter range in the average five winters out of ten.</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'><font size='3'><font face='Calibri'>WINTER RANGE:</font></font></span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='COLOR: #444444; mso-bidi-font-family: helvetica'></span></span><span><span style='LINE-height: 115%'>That part of the overall range of a species where 90 percent of the individuals are located during the average five winters out of ten from the first heavy snowfall to spring green-up, or during a site specific period of winter as defined for each Data Analysis Unit.  Winter range is not delineated for Elk on the Eastern Plains.</span></span></p><p style='MARGIN-RIGHT: 0px'><span><span style='LINE-height: 115%'></span></span></p><span><span style='LINE-height: 115%'><p style='MARGIN: 0in 0in 10pt'><span><span style='LINE-height: 115%'>This information was derived from Colorado Parks and Wildlife field personnel. Data was captured by digitizing through a SmartBoard Interactive Whiteboard using topographic maps and NAIP imagery at various scales (Cowardin, M., M. Flenner. March 2003. Maximizing Mapping Resources. GeoWorld 16(3):32-35). <p></p></span></span></p><p></p><p></p><p></p><p></p><p></p><p style='MARGIN-RIGHT: 0px'><span><span style='LINE-height: 115%'>These data are updated on a four year rotation with one of the four Colorado Parks and Wildlife Regions updated each year.  These data are not updated on a statewide level annually.</span></span></p></span></span>", tags:["holistic sample", "Colorado", "Elk", "Migration Corridors", "Migration Patterns", "Overall Range", "Production Area", "Severe Winter Range", "Summer Concentration", "Summer Range", "Wildlife", "Winter Concentration", "Winter Range", "Highway Crossings", "Limited Use Area", "Resident Population Area"], snippet:"This is part of the Species Activity Mapping (SAM), which provides information on wildlife distributions to public and private agencies and individuals, for environmental assessment, land management resource planning and general scientific reference.", thumbnail:"thumbnail/G_3A_Projects_Web_ArcGIScom_Elk.jpg", documentation:null, extent:[[-109.256, 36.798], [-101.855, 41.194]], spatialReference:null, accessInformation:"Colorado Parks and Wildlife", licenseInfo:"<p style='MARGIN: 0in 0in 10pt'><span><span style='LINE-height: 115%'>This wildlife distribution map is a product and property of Colorado Parks and Wildlife, a division of the Colorado Department of Natural Resources. Care should be taken in interpreting these data. Written documents may accompany this map and should be referenced. The information portrayed on these maps should not replace field studies necessary for more localized planning efforts. The data are gathered at a variety of scales; discrepancies may become apparent at larger scales. The areas portrayed here are graphic representations of phenomena that are difficult to reduce to two dimensions. Animal distributions are fluid; animal populations and their habitats are dynamic. <p></p></span></span></p>", culture:"en-us", properties:null, url:null, access:"public", size:7255851, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, commentsEnabled:true, numComments:0, numRatings:0, avgRating:0, numViews:2030}, {id:"service-link-id", owner:"esri", orgId:"P3ePLMYs2RVChkJx", created:1356027142000, modified:1420748328000, guid:null, name:null, title:"World Geocoding", type:"Geocoding Service", typology:"app", typeKeywords:["holistic sample", "ArcGIS Server", "Geocoding Service", "Locator Service", "Service", "Tool"], description:"The World Geocoding Service finds addresses and places in all <a href='http://links.esri.com/arcgis-online-data-coverage-for-geocoding' target='_blank'>supported countries</a> around the world in a single geocoding service. The service can find point locations of  addresses, cities, landmarks, business names, and other places. The output points can be  visualized on a map, inserted as stops for a route, or loaded as input  for a spatial analysis.<div><br /></div><div>The service is available as both a geosearch and geocoding service:<br /><div><ul><li><b>Geosearch Services</b><span style='line-height: 1.38461538461538; text-indent: -0.25in;'>  – The primary purpose of geosearch services is to locate a feature or  point of interest and then have the map zoom to that location. The  result might be displayed on the map, but the result is not stored in  any way for later use. Requests of this type do not require a subscription or a credit fee.  </span></li><li><b>Geocoding Services</b><span style='text-indent: -0.25in; line-height: 1.38461538461538;'>  – The primary purpose of geocoding services is to convert an address to  an x,y coordinate and append the result to an existing record in a  database. Mapping is not always involved, but placing the results on a  map may be part of a workflow. Batch geocoding falls into this  category. </span><b>Geocoding requires a subscription.</b><span style='text-indent: -0.25in; line-height: 1.38461538461538;'> An </span><a href='http://www.esri.com/software/arcgis/arcgisonline' style='text-indent: -0.25in; line-height: 1.38461538461538;' target='_blank'>ArcGIS Online subscription</a><span style='text-indent: -0.25in; line-height: 1.38461538461538;'> will  provide you access to the World Geocoding service for batch geocoding.</span></li></ul><span style='overflow: auto;'><span><font color='#4d4d4d'><span style='line-height: 17.899999618530273px;'>The service can be used to find address and places for many countries around the world. For detailed information on this service, including a data coverage map, visit the </span></font></span></span><a href='http://links.esri.com/arcgis-online-geocoding-rest-api/' target='_blank'>World Geocoding service documentation</a><span style='overflow: auto;'><span><font color='#4d4d4d'><span style='line-height: 17.899999618530273px;'>.</span></font></span></span></div></div>", tags:["holistic sample", "geocoding", "geocode", "locator", "world", "batch geocode", "geosearch"], snippet:"The World Geocoding Service finds addresses and places in all supported countries around the world in a single geocoding service.", thumbnail:"thumbnail/geocoding_world.jpg", documentation:null, extent:[], spatialReference:"4326", accessInformation:"Esri, NAVTEQ", licenseInfo:"<span style='overflow: auto;'><span style='font-family: Verdana, Helvetica, sans-serif; font-size: 12px; overflow: auto; background-color: rgb(255, 255, 255);'><span style='overflow: auto;'><img alt='Esri logo' src='http://downloads.esri.com/blogs/arcgisonline/esrilogo_new.png' style='border: 0px currentcolor;' /> </span></span><span style='font-family: Verdana, Helvetica, sans-serif; font-size: 12px; background-color: rgb(255, 255, 255);'>This work is licensed under the Esri Master License Agreement.</span><div style='margin: 0px; padding: 0px; font-family: Verdana, Helvetica, sans-serif; font-size: 12px; background-color: rgb(255, 255, 255);'><span style='line-height: 1.3846;'><font size='2' style='background-color: rgb(0, 0, 0);'><br /></font></span><a href='http://links.esri.com/tou_summary' style='color: rgb(33, 117, 155); outline: none !important;' target='_blank'><b>View Summary</b></a><span style='line-height: 1.3846;'> | </span><a href='http://links.esri.com/agol_tou' style='color: rgb(33, 117, 155); line-height: 1.3846; outline: none !important;' target='_blank'><b>View Terms of Use</b></a><div style='margin: 0px; padding: 0px;'><div style='margin: 0px; padding: 0px;'><br /></div><div style='margin: 0px; padding: 0px;'><b><font color='#8b0000'>Important Note:</font></b> T<span style='line-height: 1.3846;'>his item requires </span><span style='line-height: 1.3846;'>an ArcGIS Online organizational subscription or an ArcGIS Developer account for </span><span style='line-height: 1.3846;'>some capabilities such as </span><span style='line-height: 18px;'>batch geocoding, which</span><span style='line-height: 18px;'> </span><a href='http://www.arcgis.com/features/plans/credits.html' style='line-height: 1.38461538461538; color: rgb(33, 117, 155); outline: none !important;' target='_blank'>consumes credits</a><span style='line-height: 1.3846;'>. </span><span style='line-height: 1.3846;'>To access this item for these capabilities, you'll need to</span><span style='line-height: 1.3846;'> do one of the following:</span></div><div style='margin: 0px; padding: 0px;'><ul><li><span style='line-height: 1.3846;'>Sign in with an account that is a member of an organizational subscription</span></li><li><span style='line-height: 1.3846;'><span style='line-height: 17.9998016357422px;'>Sign in with </span>a developer account</span></li><li><a href='http://goto.arcgisonline.com/developers/register' style='color: rgb(33, 117, 155); line-height: 1.3846; outline: none !important;' target='_blank'>Register an application</a><span style='line-height: 1.3846;'> and use your application's credentials</span></li></ul><span style='line-height: 1.3846;'>If you don't have an account, you can sign up for a </span><a href='http://goto.arcgisonline.com/features/trial' style='color: rgb(33, 117, 155); line-height: 1.3846; outline: none !important;' target='_blank'>free trial of ArcGIS</a><span style='line-height: 1.3846;'> </span><span style='line-height: 1.3846;'>or a</span><span style='line-height: 1.3846;'> </span><a href='http://goto.arcgisonline.com/developers/signup' style='color: rgb(33, 117, 155); line-height: 1.3846; outline: none !important;' target='_blank'>free ArcGIS Developer account</a><span style='line-height: 1.3846;'>.</span></div><div style='margin: 0px; padding: 0px;'><br /></div></div></div></span>", culture:"en", properties:null, url:"http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer", access:"public", size:66, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, commentsEnabled:true, numComments:5, numRatings:9, avgRating:4.0500001907349, numViews:33561}, {id:"map-id", owner:"NikolasWise", created:1308645443000, modified:1383097293000, guid:null, name:null, title:"USA Food Expenditures at Home vs. Away from Home", type:"Web Map", typology:"map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:"<span><span><span><span><span><span><span><span><span><p>This web map displays a ratio of the average annual household expenditure on &quot;food at home&quot; to &quot;food away from home.&quot;  Some of the patterns are quite interesting.<br /></p><p>Red area households spend noticeably more at home, blue area households spend noticeably more away from home. Households in an &quot;average&quot; area tend to spend $1.38 on food at home for every $1.00 on food away from home.  Red areas are above this average, and blue areas are below this average.  Yellow areas are average.<br /></p><p><span><span><span><span>Data is shown at the county, tract and block group levels using consistent colors and classifications.  Put this map in your web browser or <a href='http://www.esri.com/software/arcgis/ios/index.html' target='_blank'>Esri iPhone/iPad app.</a></span></span></span></span></p><p>There's a very nice <a href='http://www.visualeconomics.com/how-the-average-us-consumer-spends-their-paycheck/' target='_blank'>visual of consumer expenditures data here</a>.</p><p><span><span><span><span><span><span>These are just two of the <a href='http://www.esri.com/data/esri_data/pdfs/2010-esri-consumer-spending-data-list.pdf' target='_blank'>hundreds of variables</a> available in the Esri Consumer Spending database.  <br /></span></span></span></span></span></span></p><p><span><span><span><span><span><span></span></span></span></span></span></span>Esri combined the 2005-2006 <a href='http://www.bls.gov/cex/home.htm' target='_blank'>Consumer Expenditure Surveys from the Bureau of Labor Statistics</a> to estimate current spending patterns. The continuing surveys include a Diary Survey for daily purchases and an Interview Survey for general purchases. The Diary Survey represents record keeping by consumer units for two consecutive weeklong periods. This component collects data on small daily purchases that could be overlooked by the quarterly Interview Survey. The Interview Survey collects expenditure data from consumers in five interviews conducted every three months. <br /></p><p>Esri integrates data from both surveys to provide a comprehensive database on all consumer expenditures. To compensate for the relatively small survey bases and the variability of single-year data, expenditures are averaged from the 2005–2006 surveys.</p>Esri's 2010<b> </b>Consumer Spending database details which products and services area consumers buy. Updated annually, the Consumer Spending database contains more than 760 items in 15 categories such as apparel, food, and financial. The database includes information about total dollars spent, the average amount spent by household, and a Spending Potential Index that compares local average product expenditures to the national average.<br /></span></span></span></span></span></span></span></span></span>", tags:["holistic sample", "food", "consumer spending", "demographics", "food at home", "food desert", "spending", "health", "dollars", "USA", "U.S.", "United States", "food away from home"], snippet:"Depicts the ratio of dollars spent on food at home versus away from home in the USA.  Think \"groceries\" versus \"restaurants\".  Red area households spend noticeably more at home, blue area households spend noticeably more away from home.", thumbnail:"thumbnail/Food_at_home_thumb3.png", documentation:null, extent:[[-126.127, 26.0751], [-73.6563, 50.2322]], spatialReference:null, accessInformation:"Copyright: ©2010 ESRI", licenseInfo:"<span><span><span><span><span><span><span><span><span style='overflow: auto'><span>This work is licensed under a <a href='http://creativecommons.org/licenses/by-nc-sa/3.0/us/' style='font-weight: bold'>Creative Commons Attribution-Noncommercial-Share Alike 3.0 United States License</a>.</span></span></span></span></span></span></span></span></span></span>", culture:"en-us", properties:null, url:null, access:"public", size:4650, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, commentsEnabled:true, numComments:9, numRatings:6}, {id:"web-layer-id", owner:"NikolasWise", orgId:"Wl7Y1m92PbjtJs5n", created:1426859690000, modified:1426891771000, guid:null, name:"Alternative_Fuel_Stations", title:"Alternative Fuel Stations", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"The Alternative Fuels database is a geographic point database of fueling facilities that offer fuels other than gasoline in the United States.  The dataset provides users with information about alternative fueling station locations and attributes and can be used for national and regional analysis applications. \n\nAll point records in this dataset are represented by a single coordinate pair and a unique feature identifier. BTS quality checks were to cross reference the place dataset with the state dataset, to determine that the spatial data and attribute data were accurate.\n\nThe creation of this geospatial data layer was completed by RITA/BTS in March 2008. This Shapefile was built from a combination of database tables and internet research. The coodinates of the fueling stations were derived from the addressed by geo location.\n\n", tags:["holistic sample", "Aternative Fuel", "U.S.", "transportation"], snippet:"Alternative fuel stations in the U.S.", thumbnail:"thumbnail/thumbnail.png", documentation:null, extent:[[-157.94500000044962, 19.729454999748484], [-68.01116800040283, 64.81265800016662]], spatialReference:"WGS_1984_Web_Mercator_Auxiliary_Sphere", accessInformation:"http://www.rita.dot.gov/bts/sites/rita.dot.gov.bts/files/publications/national_transportation_atlas_database/2012/index.html", licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/Wl7Y1m92PbjtJs5n/arcgis/rest/services/Alternative_Fuel_Stations/FeatureServer", access:"public", size:104, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, commentsEnabled:true, numComments:0, numRatings:0, avgRating:0, numViews:96}, {id:"0064f04f7e164e978d080be01fcef274", owner:"NikolasWise", created:1408136563000, modified:1408137673000, guid:null, name:null, title:"Oregon Rivers", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["pdx", "rivers"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-124.80037495627, 41.126895427359], [-115.57252313084, 46.530524706614]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Rivers/FeatureServer", access:"private", size:79011840, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:118}, {id:"02f1a0ee7e1c4e24a7cfa6bce33ae6b4", owner:"NikolasWise", created:1429108647000, modified:1429108702000, guid:null, name:"Eliot_Building_Footprints_GeoJSON.geojson", title:"Eliot Building Footprints GeoJSON", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Building_Footprints_pdx.<div><i><u>Expression</u>  Building_Footprints_pdx completely within Portland Neighborhoods and Portland Neighborhoods where NAME is 'ELIOT' </i></div>", tags:["pdx", "footprints", "geojson"], snippet:"Yup", thumbnail:null, documentation:null, extent:[[-122.68035232088, 45.533685666034], [-122.65870133521, 45.548190657857]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:1779631, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"03bff3f3239a4fc1888a458a8f4fa87e", owner:"NikolasWise", created:1429293436000, modified:1429293486000, guid:null, name:"Find Locations in Portland Streets", title:"Find Locations in Portland Streets", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Streets.<div><i><u>Expression</u>  Portland Streets intersects Map Notes_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Portland Streets"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.69612324372, 45.518890476561], [-122.63587608258, 45.556405172054]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jfe0b4c2f33984e0e9d0725b79c38bd40", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jfe0b4c2f33984e0e9d0725b79c38bd40"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in Portland Streets/FeatureServer", access:"private", size:113, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"047c67860ed54c7abb473811e4ff7111", owner:"NikolasWise", created:1429112767000, modified:1429112838000, guid:null, name:"Taxlots2C_Lower_Albina_Plus_GEojson.geojson", title:"Taxlots, Lower Albina Plus GEojson", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots intersects Map Notes_Areas </i></div>", tags:["geojson"], snippet:"yup", thumbnail:null, documentation:null, extent:[[-122.6985768419, 45.52298362173], [-122.63643894358, 45.554629859521]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jc77d441c590a4896805f52b69b83e2fe", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jc77d441c590a4896805f52b69b83e2fe"}, url:null, access:"private", size:12474756, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"083cc532e6734437b94210a4a38bcfd9", owner:"NikolasWise", created:1400175955000, modified:1400190883000, guid:null, name:null, title:"PortlandCafesAudit", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["select", "portland", "cafes", "pdx", "coffee"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.755289, 45.460537], [-122.5369, 45.600818]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/PortlandCafesAudit/FeatureServer", access:"public", size:57344, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":true, numComments:0, numRatings:0, avgRating:0, numViews:6107}, {id:"09ca2284bb6c470f8244a6f12b46e241", owner:"NikolasWise", created:1409955394000, modified:1409955394000, guid:null, name:"us_rail_network_100k_lin_BTS_2006.zip", title:"USA Rail Network", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["Rail", "usa"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:33494338, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"0c64d2c133c646d3909f437908ac522a", owner:"NikolasWise", created:1427393312000, modified:1427393362000, guid:null, name:"central_city_projects_geojson.geojson", title:"central_city_projects geojson", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.70093138918, 45.487471173598], [-122.6482134051, 45.542544732687]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:274330, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"0feaa1d537a14c25abe99d8cd08c5a7e", owner:"NikolasWise", created:1427393480000, modified:1427393700000, guid:null, name:"Zoning_Data_geojson.geojson", title:"Zoning Data geojson", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.83920751133, 45.429090720175], [-122.46801457272, 45.65820708375]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:59768832, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"17366a41957f4ea4b920181ae6fd4a50", owner:"NikolasWise", created:1429740388000, modified:1429740439000, guid:null, name:"Lower_Albina_-_River.geojson", title:"Lower Albina - River", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Water Bodies - Summarize Map Notes_Areas within USA Detailed Water Bodies.<div><i><u>Expression</u>  Portland Water Bodies - Summarize Map Notes_Areas within USA Detailed Water Bodies intersects Study Area_Areas </i></div>", tags:["geojson"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jb61d26f2d8474b31ab476abde6e9d35b", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jb61d26f2d8474b31ab476abde6e9d35b"}, url:null, access:"private", size:180751, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"1cecbde6a8ec467ab0cff3cb66fecb9d", owner:"NikolasWise", created:1400175885000, modified:1400190354000, guid:null, name:"PortlandCafesAudit.csv", title:"PortlandCafesAudit", type:"CSV", typology:"file", typeKeywords:["CSV"], description:null, tags:["select", "portland", "cafes", "pdx", "coffee"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:10130, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"2008dd1c90b54fb5be3ea0e501282e7a", owner:"NikolasWise", created:1427389201000, modified:1427389256000, guid:null, name:"affordable_housing.geojson", title:"affordable_housing", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:"please?", thumbnail:null, documentation:null, extent:[[-123.15192357839, 45.134948640943], [-121.74400624825, 45.835444102357]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:1351102, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"24394ae59e3a482993dbaa3862b1956e", owner:"NikolasWise", created:1432913782000, modified:1432914147000, guid:null, name:null, title:"Lower Albina Impart Study?", type:"Web Mapping Application", typology:"app", typeKeywords:["JavaScript", "Map", "Mapping Site", "Online Map", "Ready To Use", "selfConfigured", "Web Map"], description:null, tags:["test"], snippet:"This is an examination of the web map template thingy", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/apps/ImpactSummary/index.html?appid=24394ae59e3a482993dbaa3862b1956e", access:"public", size:1844, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:20}, {id:"290c9467893d4e0abed0566cafd2e2a0", owner:"NikolasWise", created:1407972664000, modified:1407972664000, guid:null, name:"Streets_pdx.zip", title:"Portland Streets", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "portland", "streets"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:5010789, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"2ac4607b4dda40dfb7ea199f62a95842", owner:"NikolasWise", created:1427224461000, modified:1427224461000, guid:null, name:"affordable_housing.zip", title:"affordable_housing", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["buildathon", "affordable", "housing"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:207271, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"34578079401e473fbaacbb8a0bab9d7b", owner:"NikolasWise", created:1429110823000, modified:1429740011000, guid:null, name:null, title:"Lower Albina Base", type:"Web Map", typology:"map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["pdx", "lower albina", "base", "contours", "taxlots"], snippet:"Base layer for tile generation for Lower Albina. Shows taxlot outlines and 5ft contours (val tied to elevation).", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.705, 45.5128], [-122.6107, 45.5554]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"public", size:81507, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:49}, {id:"351617fcc3b847b2943b7d9461e6ec31", owner:"NikolasWise", created:1429732284000, modified:1429909472000, guid:null, name:"Lower Albina - Zoning Data", title:"Lower Albina - Zoning Data", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Zoning Data - Zoning_pdx.<div><i><u>Expression</u>  Zoning Data - Zoning_pdx intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Zoning Data - Zoning_pdx"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.74381633378, 45.519346162936], [-122.6203122295, 45.577225097616]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j69a8cdc5f94b40ebb94884465bd29450", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j69a8cdc5f94b40ebb94884465bd29450"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Zoning Data/FeatureServer", access:"public", size:105, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:15}, {id:"3ef8cee1669048cf83bdba8d9bfc7011", owner:"NikolasWise", created:1427394838000, modified:1427394838000, guid:null, name:"Building_Footprints_pdx geojson", title:"Building_Footprints_pdx geojson", type:"Feature Service", typology:"layer", typeKeywords:["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"], description:null, tags:["pdx", "buildings"], snippet:null, thumbnail:null, documentation:null, extent:[[-123.20152672562, 45.188706190067], [-121.91569256433, 45.738953848574]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Building_Footprints_pdx_geojson/FeatureServer", access:"private", size:757710848, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:10}, {id:"44e9f75c3c734ebaac5fc378e89a5e1f", owner:"NikolasWise", created:1429740345000, modified:1429740395000, guid:null, name:"Lower_Albina_-_Light_Rail_Geojson.geojson", title:"Lower Albina - Light Rail Geojson", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Light Rail Lines.<div><i><u>Expression</u>  Portland Light Rail Lines intersects Study Area_Areas </i></div>", tags:["geojson"], snippet:"geojson", thumbnail:null, documentation:null, extent:[[-122.69866901264, 45.511512687068], [-122.5645122159, 45.605449969031]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jf7909bff05db4f37b5501e65d5de7db7", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jf7909bff05db4f37b5501e65d5de7db7"}, url:null, access:"private", size:57419, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"4542f3908ae5407c8db7c6e2b9266255", owner:"NikolasWise", created:1427230898000, modified:1427230898000, guid:null, name:"taxlots.zip", title:"taxlots", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["buildathon", "taxlots"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:235991711, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"463bbf310f07439496a434985588946c", owner:"NikolasWise", created:1408379858000, modified:1408379858000, guid:null, name:"Freight_Facilities_pdx.zip", title:"Portland Freight Facillities", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "freight"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:7188, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"474556d356164beb95e6b021acc78461", owner:"NikolasWise", created:1427393492000, modified:1427397516000, guid:null, name:"business_licenses_geojson.geojson", title:"business_licenses geojson", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.835, 45.435], [-122.474, 45.64]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:15958016, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"4c860330a2d944a98741b916d624271e", owner:"NikolasWise", created:1410208241000, modified:1410211629000, guid:null, name:null, title:"Rail Lines", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["rail"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-158.15219299991, 20.880179000261], [-66.983910999993, 64.92614800063]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Rail_Lines/FeatureServer", access:"public", size:125059072, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:286}, {id:"4cdabc15592744baa53288a3072740a0", owner:"NikolasWise", created:1429110235000, modified:1429114510000, guid:null, name:"Find Locations in Portland Contours - Contours_5ft_pdx_(1)", title:"AAAAAAAAFind Locations in Portland Contours - Contours_5ft_pdx_(1)", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Portland Contours - Contours_5ft_pdx_(1)"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.70345094433, 45.519380190691], [-122.63105210345, 45.556603229477]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in Portland Contours - Contours_5ft_pdx_(1)/FeatureServer", access:"public", size:137, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:61}, {id:"4df070f92b2a471e81ba9a6236bfb4a9", owner:"NikolasWise", created:1428769967000, modified:1428770124000, guid:null, name:"Find Locations in taxlots", title:"Find Locations in taxlots", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots where OWNER1 contains 'BAILEYWICK ' </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.66614620937, 45.537814309751], [-122.65300157773, 45.544997894172]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"je92c184635aa4c14b5240936e2b33f12", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/je92c184635aa4c14b5240936e2b33f12"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in taxlots/FeatureServer", access:"private", size:104, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"51caabbaf8f841b2b42b9c5daee24308", owner:"NikolasWise", created:1428770382000, modified:1428770556000, guid:null, name:"Find Locations in taxlots by addr", title:"Find Locations in taxlots by addr", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots where OWNERADDR contains '535 NE THOMPSON' </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.66614620937, 45.537108516045], [-122.65300157773, 45.544997894172]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j3470c53a77234b44835e8d3761ee69c7", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j3470c53a77234b44835e8d3761ee69c7"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in taxlots by addr/FeatureServer", access:"private", size:112, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"5f748c745e58481bb5c7436fb1b74960", owner:"NikolasWise", created:1408061350000, modified:1408061350000, guid:null, name:"Zoning_Data_pdx.zip", title:"Zoning Data", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "zoning"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:10898536, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"606127d04f5b4fee8a81309e43ae3d57", owner:"NikolasWise", created:1408143570000, modified:1408145665000, guid:null, name:null, title:"Portland Curbs", type:"Feature Service", typology:"layer", typeKeywords:["Data", "Service", "Feature Service", "ArcGIS Server", "Feature Access", "Hosted Service"], description:null, tags:["pdx", "curbs"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.83776869729, 45.429543112713], [-122.46829305973, 45.644858655295]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Curbs/FeatureServer", access:"private", size:112893952, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:18}, {id:"64dd1a2bbcfc41e59f91416ad8860536", owner:"NikolasWise", created:1429195815000, modified:1429195839000, guid:null, name:"contours_csv.zip", title:"contours csv", type:"CSV Collection", typology:"file", typeKeywords:["CSV Collection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["csv"], snippet:"yup", thumbnail:null, documentation:null, extent:[[-122.70345094433, 45.519380190691], [-122.63105210345, 45.556603229477]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:null, access:"private", size:21112, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"65f53d9002c34a8fa998fa74b4e304f8", owner:"NikolasWise", created:1429294671000, modified:1429294724000, guid:null, name:"Find_Locations_in_Portland_Streets_GeoJSON.geojson", title:"Find Locations in Portland Streets GeoJSON", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Streets.<div><i><u>Expression</u>  Portland Streets intersects Map Notes_Areas </i></div>", tags:["geojson"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[[-122.69612324372, 45.518890476561], [-122.63587608258, 45.556405172054]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jfe0b4c2f33984e0e9d0725b79c38bd40", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jfe0b4c2f33984e0e9d0725b79c38bd40"}, url:null, access:"private", size:2547708, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"6ca3f49b66554d8aac37af0d3b369b48", owner:"NikolasWise", created:1428871408000, modified:1428871429000, guid:null, name:"Find Locations in New Construction Residential Permits in Portland Oregon", title:"Find Locations in New Construction Residential Permits in Portland Oregon", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  New Construction Residential Permits in Portland Oregon.<div><i><u>Expression</u>  New Construction Residential Permits in Portland Oregon where UNITS is 2 </i></div>", tags:["Analysis Result", "Find Existing Locations", "New Construction Residential Permits in Portland Oregon"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.73872454531, 45.450441915157], [-122.52013763725, 45.585813597161]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j24a2158e8df045e1b916ec61f8781de2", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j24a2158e8df045e1b916ec61f8781de2"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in New Construction Residential Permits in Portland Oregon/FeatureServer", access:"private", size:152, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"6e42731e0a1e468cb2534163eca70d6d", owner:"NikolasWise", created:1429912519000, modified:1429912519000, guid:null, name:null, title:"Scenic Resource Zoning", type:"Web Map", typology:"map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["pdx", "weird"], snippet:"weird!", thumbnail:null, documentation:null, extent:[[-123.1772, 45.2775], [-121.8609, 45.8041]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:22195, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"6ee36b9f768d431f9f2c83eb5255e92f", owner:"NikolasWise", created:1408379860000, modified:1408379889000, guid:null, name:null, title:"Portland Freight Facillities", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["pdx", "freight"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.78736849047, 45.488587453538], [-122.57854390329, 45.64699067273]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Freight_Facillities/FeatureServer", access:"public", size:32768, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:234}, {id:"70d3af0c751d4fad8ec2535bc7a87204", owner:"NikolasWise", created:1399320256000, modified:1399320256000, guid:null, name:"Contours_5ft_pdx_28129.zip", title:"Contours_5ft_pdx (1)", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["Contours PDX"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:44861885, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"77c1aeb7122c42c79fc74b21fac95824", owner:"NikolasWise", created:1429731379000, modified:1429731401000, guid:null, name:"Lower Albina - Light Rail", title:"Lower Albina - Light Rail", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Light Rail Lines.<div><i><u>Expression</u>  Portland Light Rail Lines intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Portland Light Rail Lines"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.69866901264, 45.511512687068], [-122.5645122159, 45.605449969031]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jf7909bff05db4f37b5501e65d5de7db7", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jf7909bff05db4f37b5501e65d5de7db7"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Light Rail/FeatureServer", access:"private", size:104, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:12}, {id:"785d6e0a6cc941539b72e23d23226a6f", owner:"NikolasWise", created:1428770809000, modified:1428770970000, guid:null, name:"Find Locations in taxlots strimer", title:"Find Locations in taxlots strimer", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots where OWNER1 contains 'STREIMER' </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.67577521586, 45.541092874116], [-122.6728265202, 45.542200322489]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j8608c01c8a714c2292b994ca0ac6a81a", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j8608c01c8a714c2292b994ca0ac6a81a"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Find Locations in taxlots strimer/FeatureServer", access:"private", size:112, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"797f18368a6d4e3b95a7737eb7829ad8", owner:"NikolasWise", created:1416521556000, modified:1416521556000, guid:null, name:null, title:"Lower Albina", type:"Application", typology:"app", typeKeywords:["Application", "Registered App"], description:null, tags:["portland", "mapping"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:0, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"7b66fdf4f75c42cf96ba1b749a15cb98", owner:"NikolasWise", created:1409953636000, modified:1409953654000, guid:null, name:null, title:"Portland Light Rail Lines", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["PDX", "light rail", "MAX"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.99443933842, 45.306872103521], [-122.41230139663, 45.610150875732]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Portland_Light_Rail_Lines/FeatureServer", access:"public", size:253952, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:394}, {id:"7c4f2651113c423587ab3b1c667b69b5", owner:"NikolasWise", created:1408138198000, modified:1408138198000, guid:null, name:"Building_Footprints_pdx.zip", title:"Building_Footprints_pdx", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "buildings"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:167451464, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"7f0f959e7089452baca04990a7d5a930", owner:"NikolasWise", created:1429195969000, modified:1429196021000, guid:null, name:"contuors_geojson.geojson", title:"contuors geojson", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["geojson"], snippet:"again", thumbnail:null, documentation:null, extent:[[-122.70345094433, 45.519380190691], [-122.63105210345, 45.556603229477]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:null, access:"private", size:2935771, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"81d671d96e5a406989cd60110c995d5e", owner:"NikolasWise", created:1408143566000, modified:1408143566000, guid:null, name:"Curbs_pdx.zip", title:"Portland Curbs", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "curbs"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:19087976, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"8926cd1be76640b5b720436fd0827493", owner:"NikolasWise", created:1427491832000, modified:1427512117000, guid:null, name:null, title:"Vacant Lots", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer"], description:null, tags:["Vacant Lots"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8384, 45.4292], [-122.4688, 45.6465]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/ArcGIS/rest/services/NonPark_vacant_BLInon_openspace/FeatureServer", access:"public", size:110, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:18}, {id:"896bbe2abc7c47f4818720b1aea77764", owner:"NikolasWise", created:1427224759000, modified:1427224759000, guid:null, name:"residential_permits.zip", title:"residential_permits", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["buildathon", "residential", "housing", "permits"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:2331242, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"8b37f4b562fb4620b9f84e98a83286d9", owner:"NikolasWise", created:1429114933000, modified:1429114947000, guid:null, name:"Find Locations in Portland Contours - Contours_5ft_pdx_(1)", title:"tile test two", type:"Map Service", typology:"map", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["tiles"], snippet:"test", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.70345094433, 45.519380190691], [-122.63105210345, 45.556603229477]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/tile_test_two/MapServer", access:"private", size:88, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"8e5e8d9269544312b6163967d432191b", owner:"NikolasWise", created:1425490406000, modified:1425490890000, guid:null, name:"Summarize Map Notes_Areas within USA Detailed Water Bodies", title:"Portland Water Bodies", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Polygons for water bodies in the Portland OR area", tags:["pdx", "rivers", "water"], snippet:"Analysis Feature Service generated from Summarize Within", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.18366622891, 44.749231338356], [-120.69129371603, 45.850843429381]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd4378d1ff3354f4a8667b104cbc30123", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/SummarizeWithin/jobs/jd4378d1ff3354f4a8667b104cbc30123"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Summarize Map Notes_Areas within USA Detailed Water Bodies/FeatureServer", access:"public", size:137, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:67}, {id:"8e688c432a4b4693b45b89dae885fab1", owner:"NikolasWise", created:1429740367000, modified:1429740417000, guid:null, name:"Lower_Albina_-_Rail_Lines.geojson", title:"Lower Albina - Rail Lines", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Rail Lines.<div><i><u>Expression</u>  Rail Lines intersects Study Area_Areas </i></div>", tags:["geojson"], snippet:"yup", thumbnail:null, documentation:null, extent:[[-122.73620900021, 45.507841000339], [-122.54369399994, 45.560140000084]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j9435d5aa65894808ba9477587d557ed9", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j9435d5aa65894808ba9477587d557ed9"}, url:null, access:"private", size:36978, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"8ef8cf9054554607a2e4dc5f83cb8b8a", owner:"NikolasWise", created:1429731151000, modified:1429731169000, guid:null, name:"Lower Albina - River", title:"Lower Albina - River", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Water Bodies - Summarize Map Notes_Areas within USA Detailed Water Bodies.<div><i><u>Expression</u>  Portland Water Bodies - Summarize Map Notes_Areas within USA Detailed Water Bodies intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Portland Water Bodies - Summarize Map Notes_Areas within USA Detailed Water Bodies"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jb61d26f2d8474b31ab476abde6e9d35b", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jb61d26f2d8474b31ab476abde6e9d35b"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - River/FeatureServer", access:"private", size:99, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:12}, {id:"902c67661b4749a6a4f139c400fb0d68", owner:"NikolasWise", created:1427220976000, modified:1427220977000, guid:null, name:"Central_City_Development.gdb.zip", title:"Central_City_Development.gdb", type:"File Geodatabase", typology:"file", typeKeywords:["File Geodatabase"], description:null, tags:["buildathon", "buildings", "development"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:79908, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"9fe35e0ca7474aad86ace5ccd5a573e8", owner:"NikolasWise", created:1432936715000, modified:1432936797000, guid:null, name:null, title:"Web App Builder App", type:"Web Mapping Application", typology:"app", typeKeywords:["Map", "Mapping Site", "Online Map", "Web AppBuilder", "Web Map"], description:null, tags:["web", "app", "builder"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/apps/webappviewer/index.html?id=9fe35e0ca7474aad86ace5ccd5a573e8", access:"private", size:3959, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:4}, {id:"a15d23b8edc2460d8a57896db23f1a65", owner:"NikolasWise", created:1409953633000, modified:1409953633000, guid:null, name:"tm_rail_lines.zip", title:"Portland Light Rail Lines", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["PDX", "light rail", "MAX"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:67864, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"a390aa1d5d96457a83a9be08d1782210", owner:"NikolasWise", created:1427221553000, modified:1427221553000, guid:null, name:"2010_Census_Data.gdb.zip", title:"2010_Census_Data.gdb", type:"File Geodatabase", typology:"file", typeKeywords:["File Geodatabase"], description:null, tags:["buildathon", "census"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:33478219, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"a48fbb04fc004856bc1f79ac1b4918a5", owner:"NikolasWise", created:1421630174000, modified:1421630281000, guid:null, name:"Enriched Eliot Building Footprints", title:"Enriched Eliot Building Footprints", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:https://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/EnrichLayer/jobs/j4a52b48837af4b559daf9c7c7e673a24", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Enrich layer solution. Eliot Building Footprints were enriched", tags:["Analysis Result", "Enrich Layer", "Eliot Building Footprints"], snippet:"Analysis Feature Service generated from Enrich layer", thumbnail:null, documentation:null, extent:[[-122.68035232088, 45.533685666034], [-122.65870133521, 45.548190657857]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"https://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Enriched Eliot Building Footprints/FeatureServer", access:"private", size:114, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:11}, {id:"a4c4ee76c9a64c03b260b2a5edc7d073", owner:"NikolasWise", created:1429195667000, modified:1429195694000, guid:null, name:"contours_.shp.zip", title:"contours .shp", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["shapefile"], snippet:"yup", thumbnail:null, documentation:null, extent:[[-122.70345094433, 45.519380190691], [-122.63105210345, 45.556603229477]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:null, access:"private", size:908292, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"a5afd69bd2ae46729ee071b1d5374f89", owner:"NikolasWise", created:1403722097000, modified:1403736976000, guid:null, name:null, title:"Zoning Map-Copy", type:"Web Map", typology:"map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Offline", "Online Map", "Web Map"], description:null, tags:["portlandmaps", "BPS", "Planning", "planning", "zoning", "map", "pdx"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.6728, 45.5353], [-122.6492, 45.5429]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:815, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:8}, {id:"a5e5e5ac3cfc44dfa8e90b92cd7289fb", owner:"NikolasWise", created:1408378310000, modified:1408378466000, guid:null, name:"Eliot Building Footprints", title:"Eliot Building Footprints", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "jobUrl:http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j5a32f53f6f204b7c9ffe906bb276b7f0", "Service", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Building_Footprints_pdx.<div><i><u>Expression</u>  Building_Footprints_pdx completely within Portland Neighborhoods and Portland Neighborhoods where NAME is 'ELIOT' </i></div>", tags:["Analysis Result", "Find Existing Locations", "Building_Footprints_pdx"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.68035232088, 45.533685666034], [-122.65870133521, 45.548190657857]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Eliot Building Footprints/FeatureServer", access:"public", size:104, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:519}, {id:"a683e5cce08246c096ce1da8d306eab5", owner:"NikolasWise", created:1427393738000, modified:1427394837000, guid:null, name:"Building_Footprints_pdx_geojson.geojson", title:"Building_Footprints_pdx geojson", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["pdx", "buildings"], snippet:null, thumbnail:null, documentation:null, extent:[[-123.20152672562, 45.188706190067], [-121.91569256433, 45.738953848574]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:757710848, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"a80dc1927bbc4045aae670ce259500f2", owner:"NikolasWise", created:1408136556000, modified:1408136556000, guid:null, name:"rivers.zip", title:"Portland Rivers", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "rivers"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:16314048, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"b1fcc46807604da4897ea2e12dd9a8ce", owner:"NikolasWise", created:1427220980000, modified:1427221003000, guid:null, name:null, title:"Central_City_Development.gdb", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["buildathon", "buildings", "development"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.70093138918, 45.487471173598], [-122.6482134051, 45.542544732687]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Central_City_Development.gdb/FeatureServer", access:"public", size:237568, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:7}, {id:"b35efc2bc2f84d408cd65f007eb2b108", owner:"NikolasWise", created:1427393376000, modified:1427396993000, guid:null, name:"residential_permits_geojson.geojson", title:"residential_permits geojson", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.92776073642, 45.427416188647], [-122.47431425876, 45.728243433534]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:13893632, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"bdfb1212b020468ba076dabbb4234411", owner:"NikolasWise", created:1404093236000, modified:1404107643000, guid:null, name:null, title:"Zoning Map-Copy-Copy", type:"Web Map", typology:"map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Offline", "Online Map", "Web Map"], description:null, tags:["portlandmaps", "BPS", "Planning", "planning", "zoning", "map", "pdx"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6702, 45.5345], [-122.6584, 45.5399]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:779, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:14}, {id:"be3947bb0dd040c8b1b0508893825377", owner:"NikolasWise", created:1428620946000, modified:1428621006000, guid:null, name:"central_city_projects_bps.geojson", title:"central_city_projects_bps", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["test"], snippet:"export?", thumbnail:null, documentation:null, extent:[[-122.70093138918, 45.487471173598], [-122.6482134051, 45.542544732687]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:274330, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:3}, {id:"beb255e8271e4071a7f82df400fc0024", owner:"NikolasWise", created:1432936742000, modified:1432936742000, guid:null, name:"beb255e8271e4071a7f82df400fc0024", title:"Web App Builder App", type:"Code Attachment", typology:"app", typeKeywords:["Code", "Javascript", "Web Mapping Application"], description:null, tags:[], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://esripdx.maps.arcgis.com/sharing/rest/content/items/9fe35e0ca7474aad86ace5ccd5a573e8/package", access:"private", size:0, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"c3f89809824e439a94549b506e70aaf8", owner:"NikolasWise", created:1409955401000, modified:1409957942000, guid:null, name:null, title:"USA Rail Network", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["Rail", "usa"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-158.1521784003, 20.880175229585], [-66.983912031746, 64.926145942828]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/USA_Rail_Network/FeatureServer", access:"public", size:120348672, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:467}, {id:"c56b2872536d4587ad4baa050acc1e40", owner:"NikolasWise", created:1429732145000, modified:1429732192000, guid:null, name:"Lower Albina - Neighborhoods", title:"Lower Albina - Neighborhoods", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Neighborhoods.<div><i><u>Expression</u>  Portland Neighborhoods intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Portland Neighborhoods"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.76812048556, 45.505353249054], [-122.61496777278, 45.585183276236]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j4101bfbdeade44c884b1ed5871df9f32", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j4101bfbdeade44c884b1ed5871df9f32"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Neighborhoods/FeatureServer", access:"private", size:107, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:11}, {id:"c703eba8e7e348588d69ce601e4e04f2", owner:"NikolasWise", created:1399320260000, modified:1408143573000, guid:null, name:null, title:"Portland Contours", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Hosted Service"], description:null, tags:["Contours PDX"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83912440972, 45.429551769408], [-122.46803363311, 45.656208265104]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Contours_5ft_pdx_(1)/FeatureServer", access:"public", size:176291840, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:694}, {id:"c82c00f63a53422ea91ab6092a0c9386", owner:"NikolasWise", created:1429731892000, modified:1429731962000, guid:null, name:"Lower Albina - Business Liscenses", title:"Lower Albina - Business Liscenses", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  business_licenses.<div><i><u>Expression</u>  business_licenses completely within Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "business_licenses"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.69700000034, 45.523000000095], [-122.63699999987, 45.552000000029]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j653114a0857d417eb28c7a25dff1bbae", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j653114a0857d417eb28c7a25dff1bbae"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Business Liscenses/FeatureServer", access:"private", size:112, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:10}, {id:"cafed3fe485d4d7bb631038d30fbcd87", owner:"NikolasWise", created:1427221557000, modified:1427222522000, guid:null, name:null, title:"2010_Census_Data.gdb", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Multilayer", "Service", "Hosted Service"], description:null, tags:["buildathon", "census"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.8596574913, 44.845361165776], [-121.49681824827, 46.394868759844]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/2010_Census_Data.gdb/FeatureServer", access:"public", size:162693120, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:8}, {id:"d4ab3bdcecec453796644f6920003607", owner:"NikolasWise", created:1429740354000, modified:1429740404000, guid:null, name:"Lower_Albina_-_Neighborhoods.geojson", title:"Lower Albina - Neighborhoods", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Neighborhoods.<div><i><u>Expression</u>  Portland Neighborhoods intersects Study Area_Areas </i></div>", tags:["geojs"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[[-122.76812048556, 45.505353249054], [-122.61496777278, 45.585183276236]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j4101bfbdeade44c884b1ed5871df9f32", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j4101bfbdeade44c884b1ed5871df9f32"}, url:null, access:"private", size:52901, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"d9a819163ea842da8301d0bd5040a880", owner:"NikolasWise", created:1428871726000, modified:1428871747000, guid:null, name:"New Const. Sw foot greatter than 3000", title:"New Const. Sw foot greatter than 3000", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  New Construction Residential Permits in Portland Oregon.<div><i><u>Expression</u>  New Construction Residential Permits in Portland Oregon where SQFT is greater than 3000 </i></div>", tags:["Analysis Result", "Find Existing Locations", "New Construction Residential Permits in Portland Oregon"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.68343095516, 45.542649933625], [-122.63727283529, 45.558555998269]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd67f358c592b4031af930002afee4c5f", jobStatus:"processing", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd67f358c592b4031af930002afee4c5f"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/New Const. Sw foot greatter than 3000/FeatureServer", access:"private", size:116, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"d9b859da02df41f7b10d69eaa1591b56", owner:"NikolasWise", created:1427222695000, modified:1427222695000, guid:null, name:"Comp_Plan_BPS_150319.gdb.zip", title:"Comp_Plan_BPS_150319.gdb", type:"File Geodatabase", typology:"file", typeKeywords:["File Geodatabase"], description:null, tags:["buildathon", "planning"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:1994591, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"da524aa2312345cf96ca4d6abad0a7cc", owner:"NikolasWise", created:1399400024000, modified:1399414454000, guid:null, name:"business_licenses.csv", title:"business_licenses", type:"CSV", typology:"file", typeKeywords:["CSV"], description:null, tags:["pdx", "business"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:9558799, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"dce518e4d1324b2081061d8e17546631", owner:"NikolasWise", created:1427393263000, modified:1427393327000, guid:null, name:"Comprehensive_Plan_geojson.geojson", title:"Comprehensive Plan geojson", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:null, tags:["geojson"], snippet:null, thumbnail:null, documentation:null, extent:[[-122.83920746703, 45.429090720873], [-122.46801457213, 45.658205995502]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:11659514, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"e20400bc293947ceaeea4ff90c41d526", owner:"NikolasWise", created:1427240895000, modified:1427241222000, guid:null, name:"Summarize taxlots within Map Notes_Areas", title:"Summarize taxlots within Map Notes_Areas", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Summarize Within solution. taxlots were summarized within Map Notes_Areas", tags:["Analysis Result", "Summarize Within", "Map Notes_Areas", "taxlots"], snippet:"Analysis Feature Service generated from Summarize Within", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.66112517221, 45.501219403206], [-122.61812399725, 45.506934144153]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j88b1e2966bb74902aecf465600565f3b", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/SummarizeWithin/jobs/j88b1e2966bb74902aecf465600565f3b"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Summarize taxlots within Map Notes_Areas/FeatureServer", access:"private", size:119, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:2}, {id:"e3bb939b350a49d3b5e488cfdf2dffce", owner:"NikolasWise", created:1426786706000, modified:1426786720000, guid:null, name:"Summarize Map Notes_Areas within USA Detailed Water Bodies", title:"Summarize Map Notes_Areas within USA Detailed Water Bodies", type:"Feature Collection", typology:"layer", typeKeywords:["Data", "Feature Collection", "Singlelayer"], description:"Polygons for water bodies in the Portland OR area", tags:["what"], snippet:"huh?", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-123.18366622891, 44.749231338356], [-120.69129371603, 45.850843429381]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd4378d1ff3354f4a8667b104cbc30123", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/SummarizeWithin/jobs/jd4378d1ff3354f4a8667b104cbc30123"}, url:null, access:"private", size:1004378, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"e43ad17bc3ce4c97acf810d155dd07c5", owner:"NikolasWise", created:1429112647000, modified:1429112698000, guid:null, name:"Lower_Albina_Contours.geojson", title:"Lower Albina Contours", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["geojson"], snippet:"yup", thumbnail:null, documentation:null, extent:[[-122.70345094433, 45.519380190691], [-122.63105210345, 45.556603229477]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:null, access:"private", size:2935771, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"e6e72266eb744fcb8ea3af8396082b75", owner:"NikolasWise", created:1408144094000, modified:1408144094000, guid:null, name:"Neighborhoods_pdx.zip", title:"Portland Neighborhoods", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["pdx", "neighborhoods"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:277062, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"e89739a322994ad8a810f8c6ec030a9d", owner:"NikolasWise", created:1429731780000, modified:1429731812000, guid:null, name:"Lower Albina - Rail Lines", title:"Lower Albina - Rail Lines", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Rail Lines.<div><i><u>Expression</u>  Rail Lines intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Rail Lines"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.73620900021, 45.507841000339], [-122.54369399994, 45.560140000084]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"j9435d5aa65894808ba9477587d557ed9", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/j9435d5aa65894808ba9477587d557ed9"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Rail Lines/FeatureServer", access:"private", size:104, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:11}, {id:"ef26b7c68ee94cbe9a8cb012c059f99b", owner:"NikolasWise", created:1429740378000, modified:1429740399000, guid:null, name:"Lower_Albina_-_Rail_Nods.geojson", title:"Lower Albina - Rail Nods", type:"GeoJson", typology:"file", typeKeywords:["Coordinates Type", "CRS", "Feature", "FeatureCollection", "GeoJson", "Geometry", "GeometryCollection"], description:"Feature Service generated from running the Find Existing Locations solutions for  Rail Lines - rail_nodes.<div><i><u>Expression</u>  Rail Lines - rail_nodes intersects Study Area_Areas </i></div>", tags:["geojson"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:null, documentation:null, extent:[[-122.69700799984, 45.52606400028], [-122.6637600001, 45.551391999267]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jec783a10dadd46bdbfe78d9081013e66", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jec783a10dadd46bdbfe78d9081013e66"}, url:null, access:"private", size:7005, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"f1da90a2ba4a463c8dc4b7691861b24c", owner:"NikolasWise", created:1406063016000, modified:1406077416000, guid:null, name:null, title:"Zoning - Copy", type:"Map Service", typology:"map", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service"], description:null, tags:["portland", "zoning"], snippet:null, thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.8367, 45.4325], [-122.472, 45.6529]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.portlandmaps.com/ags/rest/services/Public/Zoning/MapServer", access:"private", size:74, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:13}, {id:"f30e5cbd3dc84535b385dc638409aee7", owner:"NikolasWise", created:1410208239000, modified:1410208239000, guid:null, name:"rail_lines.zip", title:"Rail Lines", type:"Shapefile", typology:"file", typeKeywords:["ArcGIS Desktop", "Data", "Layer", "Shapefile", "Template"], description:null, tags:["rail"], snippet:null, thumbnail:null, documentation:null, extent:[], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:34818648, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:1}, {id:"f3ad1cb7083f4cd9a40927f63337e458", owner:"NikolasWise", created:1432665146000, modified:1432665202000, guid:null, name:null, title:"Scenic Resource Zoning-Copy", type:"Web Map", typology:"map", typeKeywords:["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"], description:null, tags:["pdx", "weird"], snippet:"weird!", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6586, 45.4704], [-122.2806, 45.6411]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:null, access:"private", size:22213, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"f849bf55d9a2486caf8637fdaebdd0c7", owner:"NikolasWise", created:1429109918000, modified:1429110146000, guid:null, name:"Taxlots, Lower Albina Plus", title:"Taxlots, Lower Albina Plus", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  taxlots.<div><i><u>Expression</u>  taxlots intersects Map Notes_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "taxlots"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.6985768419, 45.52298362173], [-122.63643894358, 45.554629859521]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jc77d441c590a4896805f52b69b83e2fe", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jc77d441c590a4896805f52b69b83e2fe"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Taxlots, Lower Albina Plus/FeatureServer", access:"public", size:105, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:44}, {id:"f8adc083077f4f7fa2bc7309d36887f4", owner:"NikolasWise", created:1429731669000, modified:1429740256000, guid:null, name:"Lower Albina - Rail Nods", title:"Lower Albina - Rail Nods", type:"Feature Service", typology:"layer", typeKeywords:["ArcGIS Server", "Data", "Feature Access", "Feature Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Rail Lines - rail_nodes.<div><i><u>Expression</u>  Rail Lines - rail_nodes intersects Study Area_Areas </i></div>", tags:["Analysis Result", "Find Existing Locations", "Rail Lines - rail_nodes"], snippet:"Analysis Feature Service generated from Find Existing Locations", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.69700799984, 45.52606400028], [-122.6637600001, 45.551391999267]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jec783a10dadd46bdbfe78d9081013e66", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jec783a10dadd46bdbfe78d9081013e66"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/Lower Albina - Rail Nods/FeatureServer", access:"private", size:103, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:11}, {id:"fb08fa57fbe241d69068adb4f46071aa", owner:"NikolasWise", created:1428602934000, modified:1428602948000, guid:null, name:null, title:"contours", type:"Map Service", typology:"map", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Singlelayer", "Hosted Service"], description:null, tags:["test", "tiles"], snippet:"esting tiles", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.83912440972, 45.429551769408], [-122.46803363311, 45.656208265104]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:null, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/contours/MapServer", access:"private", size:176291840, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:0}, {id:"fcbbe850ed5f4beaa8024ba09a3a2eed", owner:"NikolasWise", created:1429114580000, modified:1429114594000, guid:null, name:"Find Locations in Portland Contours - Contours_5ft_pdx_(1)", title:"contour tiles one", type:"Map Service", typology:"map", typeKeywords:["ArcGIS Server", "Data", "Map Service", "Service", "Singlelayer", "Hosted Service"], description:"Feature Service generated from running the Find Existing Locations solutions for  Portland Contours - Contours_5ft_pdx_(1).<div><i><u>Expression</u>  Portland Contours - Contours_5ft_pdx_(1) intersects Map Notes_Areas </i></div>", tags:["tile", "lower albina"], snippet:"tiles yo", thumbnail:"thumbnail/ago_downloaded.png", documentation:null, extent:[[-122.70345094433, 45.519380190691], [-122.63105210345, 45.556603229477]], spatialReference:null, accessInformation:null, licenseInfo:null, culture:"en-us", properties:{jobId:"jd73708cefd1d47ffb96f534cc2ba740c", jobStatus:"completed", jobType:"GPServer", jobUrl:"http://analysis.arcgis.com/arcgis/rest/services/tasks/GPServer/FindExistingLocations/jobs/jd73708cefd1d47ffb96f534cc2ba740c"}, url:"http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/services/contour_tiles_one/MapServer", access:"private", size:92, appCategories:[], industries:[], languages:[], largeThumbnail:null, banner:null, screenshots:[], listed:false, ownerFolder:null, "protected":false, numComments:0, numRatings:0, avgRating:0, numViews:0}], folders:[{username:"NikolasWise", id:"220141d1d7cc4933a84b16154bb0b7b0", title:"Buildathon", created:1427394938000}, {username:"NikolasWise", id:"74de70a1eb7a481c986e15224595a8be", title:"Tiles", created:1378847090000}, {username:"NikolasWise", id:"eede98cbf5ec4bb2b8a5bf8e2ab28007", title:"_ Geodesign ad036b3503cf4a558546b6810a0beca3", created:1421965131000}]};

},{}],5:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var most = _interopRequire(require("most"));

var Delegate = _interopRequire(require("../lib/delegate.js"));

var closest = _interopRequire(require("dom-closest"));

var getId = function (e) {
  return closest(e.target, ".js-row").getAttribute("data-id");
};
var getType = function (e) {
  return closest(e.target, ".js-row").getAttribute("data-type");
};
var getFilter = function (e) {
  return e.target.getAttribute("data-type");
};

function getIntent(domNode) {
  var delegate = Delegate(domNode);

  var toggleSelect = delegate("click", ".js-row-checkbox").map(function (e) {
    // return { id: getId(e), selected: e.target.checked }
    return {
      id: getId(e),
      type: getType(e),
      selected: e.target.checked
    };
  });

  var filterInput = delegate("keyup", ".js-content-filter").map(function (e) {
    return e.srcElement.value;
  });

  var filterType = delegate("click", ".js-type").map(function (e) {
    // return { id: getId(e), selected: e.target.checked }
    return {
      target: e.target,
      filter: getFilter(e)
    };
  });

  var clearInput = delegate("click", ".js-content-filter-clear");

  var toggleSelectAll = delegate("click", ".js-content-select-all");

  var sortName = delegate("click", ".js-order-name");
  var sortDate = delegate("click", ".js-order-date");
  var sortType = delegate("click", ".js-order-type");
  var sortPerms = delegate("click", ".js-order-permissions");

  var previewItem = delegate("click", ".js-preview-item").tap(function (e) {
    return e.preventDefault();
  }).map(getId);

  return {
    toggleSelect: toggleSelect,
    filterInput: filterInput,
    filterType: filterType,
    clearInput: clearInput,
    toggleSelectAll: toggleSelectAll,
    sortName: sortName,
    sortDate: sortDate,
    sortType: sortType,
    sortPerms: sortPerms,
    previewItem: previewItem
  };
}

module.exports = getIntent

/* Actions:
*  - upload
*  - create
*  - filter
*  - selectRow
*  - selectAllRows
*  - deselectAllRows
*  - sortBy
*  - bulkEdit
*  - bulkEditSave
*  - bulkEditCancel
*/
;

},{"../lib/delegate.js":9,"dom-closest":14,"most":77}],6:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var most = _interopRequire(require("most"));

var Store = _interopRequire(require("../lib/store.js"));

var sortOn = _interopRequire(require("../lib/sort-on.js"));

var calcite = _interopRequire(require("calcite-web"));

console.log(calcite);

// set up app store
var store = undefined;
var nameAscending = undefined;
var typeAscending = undefined;
var dateAscending = undefined;
var permsAscending = undefined;

// wrap store events as a most stream
function publisher(add, end, error) {
  store.on("changed", function (state) {
    add(state);
  });
}

/**
* Open the description of an item
*/
function previewItem(id) {
  var state = store();
  state.items = state.items.map(function (i) {
    if (i.preview && i.id === id) {
      i.preview = false;
    } else {
      i.preview = i.id === id;
    }
    return i;
  });
  store(state);
}

/**
* Filter Content List
*/
function filterInput(term) {
  var state = store();
  state.hidden = state.items.filter(function (item) {
    var relevant = "" + item.title + " " + item.owner + " " + item.name + " " + item.type + " " + item.tags;
    var filterBy = relevant.toLowerCase();
    var isHidden = filterBy.indexOf(term.toLowerCase()) < 0;
    return isHidden;
  });
  store(state);
}

function filterType(e) {
  var state = store();
  // console.log(e.target)
  calcite.toggleClass(e.target, "is-active");
  state.hidden = state.items.filter(function (item) {
    var isHidden = item.typology.indexOf(e.filter.toLowerCase()) < 0;
    return isHidden;
  });
  store(state);
}

function clearInput() {
  var state = store();
  document.querySelector(".js-content-filter").value = "";
  state.hidden = [];
  store(state);
}

/**
* Select / Deselect Items
*/
function toggleSelect(row) {
  var state = store();
  state.selected = state.selected.filter(function (obj) {
    return obj.id !== row.id;
  });
  if (row.selected) {
    state.selected.push({
      id: row.id,
      type: row.type
    });
  }
  if (state.selected.length) {
    document.querySelector(".js-content-select-all").indeterminate = true;
  } else {
    document.querySelector(".js-content-select-all").indeterminate = false;
  }
  store(state);
}

function toggleSelectAll(e) {
  var state = store();
  var selectAll = e.target.checked;
  var unselectable = [];

  if (!selectAll) {
    state.selected = [];
  } else {

    state.hidden.forEach(function (item) {
      unselectable.push(item.id);
    });

    state.items.forEach(function (item) {
      if (unselectable.indexOf(item.id) == -1) {
        state.selected.push({
          id: item.id,
          type: item.type
        });
      }
    });

    if (unselectable.length) {
      document.querySelector(".js-content-select-all").indeterminate = true;
    } else {
      document.querySelector(".js-content-select-all").indeterminate = false;
    }
  }

  store(state);
}

/**
* Handle sorting data by ascending, descending, across 4 columns with tiebreaker key
*/
function sortName() {
  var state = store();
  var ascending = sortOn("title", "modified");
  var descending = sortOn("title", "modified", true);
  if (nameAscending) {
    state.items = state.items.sort(descending);
    nameAscending = false;
  } else {
    state.items = state.items.sort(ascending);
    nameAscending = true;
  }
  store(state);
}
function sortDate() {
  var state = store();
  var ascending = sortOn("modified", "title");
  var descending = sortOn("modified", "title", true);
  if (dateAscending) {
    state.items = state.items.sort(descending);
    dateAscending = false;
  } else {
    state.items = state.items.sort(ascending);
    dateAscending = true;
  }
  store(state);
}
function sortType() {
  var state = store();
  var ascending = sortOn("type", "title");
  var descending = sortOn("type", "title", true);
  if (typeAscending) {
    state.items = state.items.sort(descending);
    typeAscending = false;
  } else {
    state.items = state.items.sort(ascending);
    typeAscending = true;
  }
  store(state);
}
function sortPerms() {
  var state = store();
  var ascending = sortOn("access", "title");
  var descending = sortOn("access", "title", true);
  if (typeAscending) {
    state.items = state.items.sort(descending);
    typeAscending = false;
  } else {
    state.items = state.items.sort(ascending);
    typeAscending = true;
  }
  store(state);
}

/**
* Observe intent streams
* export a stream of store updates
*/
function getModel(intent, Store) {
  store = Store;
  intent.previewItem.observe(previewItem);
  intent.toggleSelect.observe(toggleSelect);
  intent.filterInput.observe(filterInput);
  intent.filterType.observe(filterType);
  intent.clearInput.observe(clearInput);
  intent.toggleSelectAll.observe(toggleSelectAll);
  intent.sortName.observe(sortName);
  intent.sortDate.observe(sortDate);
  intent.sortType.observe(sortType);
  intent.sortPerms.observe(sortPerms);
  var currentState = store();
  currentState.selected = [];
  currentState.hidden = [];
  currentState.items.sort(sortOn("modified", "title"));
  dateAscending = true;
  store(currentState);
  return most.create(publisher).startWith(currentState);
}

module.exports = getModel;

},{"../lib/sort-on.js":11,"../lib/store.js":12,"calcite-web":13,"most":77}],7:[function(require,module,exports){
module.exports = function anonymous(it
/**/) {
var out='<div class="column-18 pre-1 large-pre-1"> <div class="input-group trailer-half leader-0"> <input class="input-group-input js-content-filter" type="text" placeholder="Refine content"> <span class="input-group-button"> <button class="btn btn-transparent js-content-filter-clear">clear</button> </span> </div> <section class="content-list"> <div class="content-header column-18 first-column trailer-0 link-gray"> <div class="column-1"> <label class="font-size--2 left trailer-0 gutter-right-2 padding-leader-half"> <input type="checkbox" class="js-content-select-all"> </label> </div> ';if(it.selected.length){out+=' <div class="action-bar action-bar-left"> ';var arr1=it.actions;if(arr1){var action,i=-1,l1=arr1.length-1;while(i<l1){action=arr1[i+=1];out+=' <button type="button" class="btn btn-small btn-clear action-bar-btn js-modal-toggle">'+(action)+'</button> ';} } out+=' </div> ';}else{out+=' <div class="column-8 padding-leader-half"><a href="#" class="js-order-name">Name</a></div> <div class="column-3 padding-leader-half"><a href="#" class="js-order-date">Modified</a></div> <div class="column-4 padding-leader-half"><a href="#" class="js-order-type">Type</a></div> <div class="column-2 padding-leader-half"><a href="#" class="js-order-permissions">Sharing</a></div> ';}out+=' </div> ';var arr2=it.items;if(arr2){var item,i2=-1,l2=arr2.length-1;while(i2<l2){item=arr2[i2+=1];out+=' <div class="content-item ';if(item.selected){out+='is-selected';}out+=' ';if(item.hidden){out+='is-hidden';}out+=' js-row font-size--1 content-row column-18 first-column" data-id="'+(item.id)+'" data-type="'+(item.type)+'"> <div class="column-18"> <div class="column-9 text-ellipsis"> <label class="font-size--2 left trailer-0"><input type="checkbox" class="js-row-checkbox content-item-checkbox" ';if(item.selected){out+='checked';}out+='></label> <!-- <img class="content-item-icon" src="../_assets/img/arcgis-online-icons/map_32.png" alt="map"> --> <a href="../'+( item.id)+'">'+(item.title)+'</a> </div> <div class="column-3 text-ellipsis">'+(item.modified)+'</div> <div class="column-4 text-ellipsis">'+(item.type)+'</div> <div class="column-2 text-ellipsis">'+(item.access)+' <a href="#" class="js-preview-item icon-ui-down-arrow link-gray right"></a></div> </div> <div class="column-18 padding-leader-2 padding-trailer-2 ';if(!item.preview){out+='hide';}out+='"> <img class="column-5 pre-1 post-1" src="../_assets/img/web-layer-thumbnail.jpg"> <div class="column-10"> <h2>'+(item.title)+'</h2> <p> <img src="../_assets/img/arcgis-online-icons/Web Map.png" alt="" width="16" height="16"> <a href="#">'+(item.type)+'</a> by <a href="">'+(item.owner)+'</a> </p> <p>'+(item.snippet)+'</p> </div> </div> </div> ';} } out+=' </section></div>';return out;
}
},{}],8:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var most = _interopRequire(require("most"));

var virtualize = _interopRequire(require("vdom-virtualize"));

var template = _interopRequire(require("./view.dot"));

var render = _interopRequire(require("../lib/render.js"));

var calcite = _interopRequire(require("calcite-web"));

var dict = _interopRequire(require("./data/item-actions-dict"));

function parseState(state) {
  var items = state.items.map(function (item) {
    state.selected.forEach(function (obj) {
      if (obj.id == item.id) {
        item.selected = true;
      }
    });
    state.hidden.forEach(function (obj) {
      if (obj.id == item.id) {
        item.hidden = true;
      }
    });
    return item;
  });
  state.items = items;
  return state;
}

function parseActions(state) {
  var actions = [];
  var selectedTypes = [];

  state.selected.forEach(function (i) {
    selectedTypes.push(i.type);
  });
  dict.actions.forEach(function (i) {
    actions.push(i);
  });
  dict.types.forEach(function (type) {
    if (selectedTypes.indexOf(type.name) > -1) {
      type.excludes.forEach(function (x) {
        var i = actions.indexOf(x);
        if (i > -1) {
          actions.splice(i, 1);
        }
      });
    }
  });
  state.actions = actions;
  return state;
}

/**
* Render current state to DOM Node
* @param  {Stream}  model   Event stream of changes to model
* @param  {Element} domNode Render target for view (DOM Element)
*/
function getView(model, domNode) {
  var tree = virtualize(domNode);
  model.forEach(function (state) {
    parseState(state);
    parseActions(state);
    var html = template(state);
    tree = render(domNode, html, tree);
    calcite.dropdown(domNode);
  });
}

module.exports = getView;

},{"../lib/render.js":10,"./data/item-actions-dict":2,"./view.dot":7,"calcite-web":13,"most":77,"vdom-virtualize":87}],9:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var most = _interopRequire(require("most"));

var matches = _interopRequire(require("matches-selector"));

/**
* @param  {String} event DOM Event like 'click' or 'mousemove'
* @param  {String} query Query Selector string like 'ul li.x'
* @return {Stream}       Return a most stream of the correct events
*/
function Stream(event, query) {
  var stream = most.fromEvent(event, this.domNode).filter(function (e) {
    return matches(e.target, query);
  });
  return stream;
}

/**
* All events are attached to a root DOM element,
* @param  {String} query CSS selector for root dom node ex. '#my-id'
*/
function getStream(domNode) {
  return Stream.bind({ domNode: domNode });
}

module.exports = getStream;

},{"matches-selector":16,"most":77}],10:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var virtualize = _interopRequire(require("vdom-virtualize"));

var diff = _interopRequire(require("virtual-dom/diff"));

var patch = _interopRequire(require("virtual-dom/patch"));

function deleteNullProperties(tree) {
  if (tree.children) {
    tree.children = tree.children.filter(function (child) {
      return child;
    });
    tree.children.forEach(function (child) {
      deleteNullProperties(child);
    });
  }
}

/**
* Render anything that has changed to a DOM Node
* @param  {Element} node Root DOM Node to be rendered to
* @param  {String}  html String representing desired html state
* @param  {Object}  tree Current virtual DOM tree
* @return {Object}       Updated virtual DOM tree
*/
function render(node, html, tree) {
  var tmp = node.cloneNode(false);
  tmp.innerHTML = html;
  var newTree = virtualize(tmp);
  deleteNullProperties(newTree);
  var patches = diff(tree, newTree);
  patch(node, patches);
  return newTree;
}

module.exports = render;

},{"vdom-virtualize":87,"virtual-dom/diff":95,"virtual-dom/patch":99}],11:[function(require,module,exports){
"use strict";

function sortOn(key, key2, descending) {
  return function (a, b) {
    if (typeof a[key] == "string") {
      if (a[key].toLowerCase() > b[key].toLowerCase()) {
        if (descending) {
          return -1;
        }
        return 1;
      }
      if (a[key].toLowerCase() < b[key].toLowerCase()) {
        if (descending) {
          return 1;
        }
        return -1;
      }
    } else {
      if (a[key] > b[key]) {
        if (descending) {
          return -1;
        }
        return 1;
      }
      if (a[key] < b[key]) {
        if (descending) {
          return 1;
        }
        return -1;
      }
    }

    if (typeof a[key2] == "string") {
      if (a[key2].toLowerCase() > b[key2].toLowerCase()) {
        if (descending) {
          return -1;
        }
        return 1;
      }
      if (a[key2].toLowerCase() < b[key2].toLowerCase()) {
        if (descending) {
          return 1;
        }
        return -1;
      }
    } else {
      if (a[key2] > b[key2]) {
        if (descending) {
          return -1;
        }
        return 1;
      }
      if (a[key2] < b[key2]) {
        if (descending) {
          return 1;
        }
        return -1;
      }
    }

    return 0;
  };
}

module.exports = sortOn;

},{}],12:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// Save items to local storage
// maybe should be its own little module (l-store, l-s)

var Emitter = _interopRequire(require("tiny-emitter"));

function get(KEY) {
  if (localStorage[KEY]) {
    return JSON.parse(localStorage[KEY]);
  } else {
    return undefined;
  }
}

function set(KEY, value) {
  localStorage[KEY] = JSON.stringify(value);
  return get(KEY);
}

function Store(ee, arg) {
  var KEY = this.KEY;
  if (!arg) {
    return get(KEY);
  } else {
    if (typeof arg === "function") {
      var newValue = arg(get(KEY));
      set(KEY, newValue);
    } else {
      set(KEY, arg);
    }
    ee.emit("changed", get(KEY));
    return get(KEY);
  }
}

function getStore(KEY, defaults) {
  var ee = new Emitter();
  var store = Store.bind({ KEY: KEY }, ee);

  if (!get(KEY) && defaults) {
    set(KEY, defaults);
  }

  store.on = ee.on;
  store.emit = ee.emit;

  ee.on("changed", function (value) {
    store.emit("changed", value);
  });

  return store;
}

module.exports = getStore;

},{"tiny-emitter":86}],13:[function(require,module,exports){
/* calcite-web - v0.14.2 - 2015-10-07
*  https://github.com/esri/calcite-web
*  Copyright (c) 2015 Environmental Systems Research Institute, Inc.
*  Apache 2.0 License */
(function Calcite () {

  // ┌────────────┐
  // │ Public API │
  // └────────────┘
  // define all public api methods (excluding patterns)
  var calcite = {
    version: 'v0.14.1',
    click: click,
    addEvent: addEvent,
    removeEvent: removeEvent,
    eventTarget: eventTarget,
    preventDefault: preventDefault,
    stopPropagation: stopPropagation,
    hasClass: hasClass,
    addClass: addClass,
    removeClass: removeClass,
    toggleClass: toggleClass,
    closest: closest,
    nodeListToArray: nodeListToArray,
    init: init
  };

  // ┌──────────────────────┐
  // │ Polyfills            │
  // └──────────────────────┘

  // string.includes()
  if (!String.prototype.includes) {
    String.prototype.includes = function() {'use strict';
      return String.prototype.indexOf.apply(this, arguments) !== -1;
    };
  }

  // focusin event
  !function(){
      var w = window,
          d = w.document;

      if( w.onfocusin === undefined ){
          d.addEventListener('focus'    ,addPolyfill    ,true);
          d.addEventListener('blur'     ,addPolyfill    ,true);
          d.addEventListener('focusin'  ,removePolyfill ,true);
          d.addEventListener('focusout' ,removePolyfill ,true);
      }
      function addPolyfill(e){
          var type = e.type === 'focus' ? 'focusin' : 'focusout';
          var event = new CustomEvent(type, { bubbles:true, cancelable:false });
          event.c1Generated = true;
          e.target.dispatchEvent( event );
      }
      function removePolyfill(e){
          if(!e.c1Generated){ // focus after focusin, so chrome will the first time trigger tow times focusin
              d.removeEventListener('focus'    ,addPolyfill    ,true);
              d.removeEventListener('blur'     ,addPolyfill    ,true);
              d.removeEventListener('focusin'  ,removePolyfill ,true);
              d.removeEventListener('focusout' ,removePolyfill ,true);
          }
          setTimeout(function(){
              d.removeEventListener('focusin'  ,removePolyfill ,true);
              d.removeEventListener('focusout' ,removePolyfill ,true);
          });
      }
  }();


  // ┌──────────────────────┐
  // │ DOM Event Management │
  // └──────────────────────┘

  // returns standard interaction event, later will add touch support
  function click () {
    return 'click';
  }

  // add a callback function to an event on a DOM node
  function addEvent (domNode, e, fn) {
    if (domNode.addEventListener) {
      return domNode.addEventListener(e, fn, false);
    } else if (domNode.attachEvent) {
      return domNode.attachEvent('on' + e, fn);
    }
  }

  // remove a specific function binding from a DOM node event
  function removeEvent (domNode, e, fn) {
    if (domNode.removeEventListener) {
      return domNode.removeEventListener(e, fn, false);
    } else if (domNode.detachEvent) {
      return domNode.detachEvent('on' + e,  fn);
    }
  }

  // get the target element of an event
  function eventTarget (e) {
    return e.target || e.srcElement;
  }

  // prevent default behavior of an event
  function preventDefault (e) {
    if (e.preventDefault) {
      return e.preventDefault();
    } else if (e.returnValue) {
      e.returnValue = false;
    }
  }

  // stop and event from bubbling up the DOM tree
  function stopPropagation (e) {
    e = e || window.event;
    if (e.stopPropagation) {
      return e.stopPropagation();
    }
    if (e.cancelBubble) {
      e.cancelBubble = true;
    }
  }

  // ┌────────────────────┐
  // │ Class Manipulation │
  // └────────────────────┘

  // check if an element has a specific class
  function hasClass (domNode, className) {
    var elementClass = ' ' + domNode.className + ' ';
    return elementClass.indexOf(' ' + className + ' ') !== -1;
  }

  // add one or more classes to an element
  function addClass (domNode, classes) {
    classes.split(' ').forEach(function (c) {
      if (!hasClass(domNode, c)) {
        domNode.className += ' ' + c;
      }
    });
  }

  // remove one or more classes from an element
  function removeClass (domNode, classes) {
    var elementClass = ' ' + domNode.className + ' ';
    classes.split(' ').forEach(function (c) {
      elementClass = elementClass.replace(' ' + c + ' ', ' ');
    });
    domNode.className = elementClass.trim();
  }

  // if domNode has the class, remove it, else add it
  function toggleClass (domNode, className) {
    if (hasClass(domNode, className)) {
      removeClass(domNode, className);
    } else {
      addClass(domNode, className);
    }
  }

  // ┌─────┐
  // │ DOM │
  // └─────┘

  // returns closest element up the DOM tree matching a given class
  function closest (className, context) {
    var result, current;
    for (current = context; current; current = current.parentNode) {
      if (current.nodeType === 1 && hasClass(current, className)) {
        result = current;
        break;
      }
    }
    return current;
  }

  // turn a domNodeList into an array
  function nodeListToArray (domNodeList) {
    return Array.prototype.slice.call(domNodeList);
  }

  // ┌─────────────┐
  // │ JS Patterns │
  // └─────────────┘
  // helper functions for ui patterns

  // return an array of elements matching a query
  function findElements (query, domNode) {
    var context = domNode || document;
    var elements = context.querySelectorAll(query);
    return nodeListToArray(elements);
  }

  // remove 'is-active' class from every element in an array
  function removeActive (array) {
    if (typeof array == 'object') {
      array = nodeListToArray(array);
    }
    array.forEach(function (item) {
      removeClass(item, 'is-active');
    });
  }

  function addActive (array) {
    if (typeof array == 'object') {
      array = nodeListToArray(array);
    }
    array.forEach(function (item) {
      addClass(item, 'is-active');
    });
  }


  // remove 'is-active' from array, add to element
  function toggleActive (array, el) {
    var isActive = hasClass(el, 'is-active');
    if (isActive) {
      removeClass(el, 'is-active');
    } else {
      removeActive(array);
      addClass(el, 'is-active');
    }
  }

  // toggles `aria-hidde="true"` on a domNode
  function toggleAriaHidden (array) {
    array.forEach(function (node) {
      var hidden = node.getAttribute('aria-hidden');
      if (hidden !== 'true') {
        node.setAttribute('aria-hidden', true);
      } else {
        node.removeAttribute('aria-hidden');
      }
    });
  }

  // ┌───────────┐
  // │ Accordion │
  // └───────────┘
  // collapsible accordion list
  calcite.accordion = function (domNode) {

    function toggleAriaExpanded(domNode) {
      var isExpanded = domNode.getAttribute('aria-expanded');
      if (domNode.getAttribute('aria-expanded')) {
        domNode.setAttribute('aria-expanded', 'false');
      } else {
        domNode.setAttribute('aria-expanded', 'true');
      }
    }

    findElements('.js-accordion', domNode).forEach(function (accordion) {
      accordion.setAttribute('aria-live', 'polite');
      accordion.setAttribute('role', 'tablist');
      nodeListToArray(accordion.children).forEach(function (child) {
        var firstChild = child.children[0];
        firstChild.setAttribute('role', 'tab');
        firstChild.setAttribute('tabindex', '0');
        if (hasClass(child, 'is-active')) {
          child.setAttribute('aria-expanded', 'true');
        } else {
          child.setAttribute('aria-expanded', 'false');
        }
        var sectionTitle = child.querySelector('.accordion-title');
        addEvent(sectionTitle, click(), toggleAccordion);
        addEvent(child, 'keyup', function(e) {
          if (e.keyCode === 13) {
            toggleAccordion(e);
          }
        });
      });
    });

    function toggleAccordion (e) {
      var parent = closest('accordion-section', eventTarget(e));
      toggleClass(parent, 'is-active');
      toggleAriaExpanded(parent);
    }
  };

  // ┌──────────┐
  // │ Dropdown │
  // └──────────┘
  // show and hide dropdown menus
  calcite.dropdown = function (domNode) {
    var toggles = findElements('.js-dropdown-toggle', domNode);
    var dropdowns = findElements('.js-dropdown', domNode);

    function closeAllDropdowns () {
      removeEvent(document.body, click(), closeAllDropdowns);
      dropdowns.forEach(function (dropdown) {
        removeClass(dropdown, 'is-active');
      });
    }

    function bindToggle (toggle) {
      addEvent(toggle, click(), function (e) {
        preventDefault(e);
        stopPropagation(e);
        var dropdown = closest('js-dropdown', toggle);
        var isOpen = hasClass(dropdown, 'is-active');
        closeAllDropdowns();
        if (!isOpen) {
          addClass(dropdown, 'is-active');
        }
        addEvent(document.body, click(), closeAllDropdowns);
      });
    }

    toggles.forEach(bindToggle);
  };

  // ┌────────┐
  // │ Drawer │
  // └────────┘
  // show and hide drawers
  calcite.drawer = function (domNode) {
    var wrapper = document.querySelector('.wrapper');
    var footer = document.querySelector('.footer');
    var toggles = findElements('.js-drawer-toggle', domNode);
    var drawers = findElements('.js-drawer', domNode);
    var lastOn;

    function fenceDrawer (e) {
      if ( !closest('js-drawer', e.target)) {
        drawers.forEach(function (drawer) {
          if (hasClass(drawer, 'is-active')) {
            drawer.focus();
          }
        });
      }
    }

    function escapeCloseDrawer (e) {
      if (e.keyCode === 27) {
        drawers.forEach(function (drawer) {
          removeClass(drawer, 'is-active');
          drawer.removeAttribute('tabindex');
        });
        toggleAriaHidden([wrapper, footer]);
        removeEvent(document, 'keyup', escapeCloseDrawer);
        removeEvent(document, 'focusin', fenceDrawer);
        lastOn.focus();
      }
    }

    function bindDrawerToggle (e) {
      preventDefault(e);
      var toggle = e.target;
      var drawerId = toggle.getAttribute('data-drawer');
      var drawer = document.querySelector('.js-drawer[data-drawer="' + drawerId + '"]');
      var isOpen = hasClass(drawer, 'is-active');

      toggleActive(drawers, drawer);
      toggleAriaHidden([wrapper, footer]);

      if (isOpen) {
        removeEvent(document, 'keyup', escapeCloseDrawer);
        removeEvent(document, 'focusin', fenceDrawer);
        lastOn.focus();
        drawer.removeAttribute('tabindex');
      } else {
        addEvent(document, 'keyup', escapeCloseDrawer);
        addEvent(document, 'focusin', fenceDrawer);

        lastOn = toggle;
        drawer.setAttribute('tabindex', 0);
        drawer.focus();
      }
    }

    toggles.forEach(function (toggle) {
      addEvent(toggle, click(), bindDrawerToggle);
    });

    drawers.forEach(function (drawer) {
      addEvent(drawer, click(), function (e) {
        if (hasClass(eventTarget(e), 'drawer')) {
          toggleActive(drawers, drawer);
          toggleAriaHidden([wrapper, footer]);
          removeEvent(document, 'keyup', escapeCloseDrawer);
        }
      });
    });
  };

  // ┌───────────────┐
  // │ Expanding Nav │
  // └───────────────┘
  // show and hide exanding nav located under topnav
  calcite.expandingNav = function (domNode) {
    var toggles = findElements('.js-expand-toggle', domNode);
    var sections = document.querySelectorAll('.js-expand');

    toggles.forEach(function (toggle) {
      addEvent(toggle, click(), function (e) {
        preventDefault(e);

        var sectionId = toggle.getAttribute('data-expand');
        var section = document.querySelector('.js-expand[data-expand="' + sectionId + '"]');
        var isOpen = hasClass(section, 'is-active');
        var shouldClose = hasClass(section, 'is-active');

        toggleActive(sections, section);

        if (isOpen && shouldClose) {
          removeClass(section, 'is-active');
        } else {
          addClass(section, 'is-active');
        }
      });
    });
  };

  // ┌───────┐
  // │ Modal │
  // └───────┘
  // show and hide modal dialogues
  calcite.modal = function (domNode) {
    var wrapper = document.querySelector('.wrapper');
    var footer = document.querySelector('.footer');
    var toggles = findElements('.js-modal-toggle', domNode);
    var modals = findElements('.js-modal', domNode);
    var lastOn;

    function fenceModal (e) {
      if ( !closest('js-modal', e.target)) {
        modals.forEach(function (modal) {
          if (hasClass(modal, 'is-active')) {
            modal.focus();
          }
        });
      }
    }

    function escapeCloseModal (e) {
      if (e.keyCode === 27) {
        modals.forEach(function (modal) {
          removeClass(modal, 'is-active');
          modal.removeAttribute('tabindex');
        });
        lastOn.focus();
        toggleAriaHidden([wrapper, footer]);
        removeEvent(document, 'keyup', escapeCloseModal);
        removeEvent(document, 'focusin', fenceModal);
      }
    }

    function bindModalToggle (e) {
      preventDefault(e);
      var toggle = e.target;
      var modal;
      var modalId = toggle.getAttribute('data-modal');
      if (modalId) {
        modal = document.querySelector('.js-modal[data-modal="' + modalId + '"]');
      } else {
        modal = closest('js-modal', toggle);
      }

      var isOpen = hasClass(modal, 'is-active');
      toggleActive(modals, modal);
      toggleAriaHidden([wrapper, footer]);

      if (isOpen) {
        removeEvent(document, 'keyup', escapeCloseModal);
        removeEvent(document, 'focusin', fenceModal);
        lastOn.focus();
        modal.removeAttribute('tabindex');
      } else {
        addEvent(document, 'keyup', escapeCloseModal);
        addEvent(document, 'focusin', fenceModal);
        lastOn = toggle;
        modal.setAttribute('tabindex', 0);
        modal.focus();
      }
    }

    toggles.forEach(function (toggle) {
      addEvent(toggle, click(), bindModalToggle);
    });

    modals.forEach(function (modal) {
      addEvent(modal, click(), function (e) {
        if (eventTarget(e) === modal) {
          toggleActive(modals, modal);
          toggleAriaHidden([wrapper, footer]);
          removeEvent(document, 'keyup', escapeCloseModal);
        }
      });
    });
  };

  // ┌──────┐
  // │ Tabs │
  // └──────┘
  // tabbed content pane
  calcite.tabs = function (domNode) {
    var tabs = findElements('.js-tab', domNode);
    var tabGroups = findElements('.js-tab-group', domNode);
    var tabSections = findElements('.js-tab-section', domNode);

    // set max width for each tab
    tabGroups.forEach(function (tab) {
      tab.setAttribute('aria-live', 'polite');
      tab.children[0].setAttribute('role', 'tablist');
      var tabsInGroup = tab.querySelectorAll('.js-tab');
      var percent = 100 / tabsInGroup.length;
      for (var i = 0; i < tabsInGroup.length; i++) {
        tabsInGroup[i].style.maxWidth = percent + '%';
      }
    });

    function switchTab (e) {
      preventDefault(e);

      var tab = closest('js-tab', eventTarget(e));
      var tabGroup = closest('js-tab-group', tab);
      var tabs = tabGroup.querySelectorAll('.js-tab');
      var contents = tabGroup.querySelectorAll('.js-tab-section');
      var index = nodeListToArray(tabs).indexOf(tab);

      removeActive(tabs);
      removeActive(contents);

      nodeListToArray(tabs).forEach(function (t){
        t.setAttribute('aria-expanded', false);
      });

      nodeListToArray(contents).forEach(function (c){
        c.setAttribute('aria-expanded', false);
      });

      addClass(tab, 'is-active');
      addClass(contents[index], 'is-active');

      tab.setAttribute('aria-expanded', 'true');
      contents[index].setAttribute('aria-expanded', 'true');
    }

    tabs.forEach(function (tab) {
      tab.setAttribute('aria-expanded', 'false');
      tab.setAttribute('role', 'tab');
      addEvent(tab, click(), switchTab);
      addEvent(tab, 'keyup', function(e) {
        if (e.keyCode === 13) {
          switchTab(e);
        }
      });
      tab.setAttribute('tabindex', '0');
    });

    tabSections.forEach(function (section) {
      section.setAttribute('role', 'tabpanel');
      var isOpen = hasClass(section, 'is-active');
      if (isOpen) {
        section.setAttribute('aria-expanded', 'true');
      } else {
        section.setAttribute('aria-expanded', 'false');
      }
    });
  };


  // ┌─────────────┐
  // │ Site Search │
  // └─────────────┘
  // Expanding search bar that lives in the top nav.
  calcite.siteSearch = function (domNode) {
    var searchForms = findElements('.js-site-search', domNode);

    function toggleForm (e) {
      var searchContainer = closest('js-site-search', e.target);
      var isOpen = hasClass(searchContainer, 'is-active');

      if (isOpen) {
        removeClass(searchContainer, 'is-active');
        e.target.value = '';
      } else {
        addClass(searchContainer, 'is-active');
      }
    }

    searchForms.forEach(function (search) {
      addEvent(search, 'focusin', toggleForm);
      addEvent(search, 'focusout', toggleForm);
    });
  };


  // ┌────────┐
  // │ Sticky │
  // └────────┘
  // sticks things to the window
  calcite.sticky = function (domNode) {
    var elements = findElements('.js-sticky', domNode);

    var stickies = elements.map(function (el) {
      var offset = el.offsetTop;
      var dataTop = el.getAttribute('data-top') || 0;
      el.style.top = dataTop + 'px';
      var parent = el.parentNode;
      var shim = el.cloneNode('deep');
      shim.style.visibility = 'hidden';
      shim.style.display = 'none';
      parent.insertBefore(shim, el);

      return {
        top: offset - parseInt(dataTop, 0),
        shim: shim,
        element: el
      };
    });

    function resize () {
      stickies.forEach(function (item) {
        var referenceElement = item.element;
        if (hasClass(item.element, 'is-sticky')) {
          referenceElement = item.shim;
        }
        var dataTop = referenceElement.getAttribute('data-top') || 0;
        item.top = referenceElement.offsetTop - parseInt(dataTop, 0);
      });
      scrollHandler();
    }

    var scrollHandler = function () {
      stickies.forEach(function (item) {
        if (item.top < window.pageYOffset) {
          addClass(item.element, 'is-sticky');
          item.shim.style.display = '';
        } else {
          removeClass(item.element, 'is-sticky');
          item.shim.style.display = 'none';
        }
      });
    };

    if (elements) {
      calcite.addEvent(window, 'scroll', scrollHandler);
      calcite.addEvent(window, 'resize', resize);
    }
  };

  // ┌───────────┐
  // │ Third Nav │
  // └───────────┘
  // sticks things to the window
  calcite.thirdNav = function (domNode) {
    var nav = findElements('.js-nav-overflow', domNode)[0];
    var leftBtn = findElements('.js-overflow-left', domNode)[0];
    var rightBtn = findElements('.js-overflow-right', domNode)[0];

    function scroll (distance) {
      nav.scrollLeft += distance;
    }

    function resize () {
      calcite.removeClass(leftBtn, 'is-active');
      calcite.removeClass(rightBtn, 'is-active');
      if (nav.scrollLeft > 0) calcite.addClass(leftBtn, 'is-active');
      if (nav.scrollLeft + nav.clientWidth + 5 < nav.scrollWidth) calcite.addClass(rightBtn, 'is-active');
    }

    if (nav) {
      calcite.addEvent(leftBtn, calcite.click(), scroll.bind(null, -40));
      calcite.addEvent(rightBtn, calcite.click(), scroll.bind(null, 40));
      calcite.addEvent(nav, 'scroll', resize);
      calcite.addEvent(window, 'resize', resize);
      resize();
    }
  };

  // ┌─────────────┐
  // │ Filter List │
  // └─────────────┘
  // Used for filtering lists
  calcite.filterList = function (value, items) {
    var results = items.filter(function (item) {
        var val = value.toLowerCase();
        var t = item.innerHTML.toLowerCase();
        return t.includes(val);
    });
    return results;
  };

  // ┌─────────────────┐
  // │ Filter Dropdown │
  // └─────────────────┘
  // Component used to select any number of things from an array of any number of things

  calcite.filterDropdown = function (domNode) {
    var context = domNode || document;
    var dropdowns = nodeListToArray(context.querySelectorAll('.js-filter-dropdown'));

    dropdowns.forEach(function (dropdown) {
      var container = dropdown.querySelector('.filter-dropdown-container');
      var list = dropdown.querySelector('.filter-dropdown-list');
      var input = dropdown.querySelector('.filter-dropdown-input');
      var clearButton = dropdown.querySelector('.filter-dropdown-clear');
      var items = dropdown.querySelectorAll('.filter-dropdown-link');

      list.setAttribute('aria-expanded', false);

      for (i = 0; i < items.length; i++) {
        var item = items[i];
        item.setAttribute('data-item-id', i);
        addEvent(item, 'click', toggleItem);
      }

      function showActive() {
        var activeItems = dropdown.querySelectorAll('.filter-dropdown-active');

        for (i = 0; i < activeItems.length; i++) {
          var activeItem = activeItems[i];
          activeItem.parentNode.removeChild(activeItem);
        }

        for (i = 0; i < items.length; i++) {
          var item = items[i];
          if (hasClass(item, 'is-active')) {
            var template = '<span class="filter-dropdown-active">' + item.innerHTML  + '<a class="filter-dropdown-remove" href="#" data-item-id='+ [i] +'></a></span>';
            container.insertAdjacentHTML('afterend', template);
          }
        }

        activeItems = dropdown.querySelectorAll('.filter-dropdown-active');

        for (i = 0; i < activeItems.length; i++) {
          var closeButton = activeItems[i].querySelector('.filter-dropdown-remove');
          addEvent(closeButton, 'click', clearItem);
        }
      }

      function clearAllItems (e) {
        if (e) e.preventDefault();
        for (i = 0; i < items.length; i++) {
          var item = items[i];
          if (hasClass(item, 'is-active')) removeClass(item, 'is-active');
        }
        showActive();
      }

      function clearItem (e) {
        e.preventDefault();
        var targetId = e.target.getAttribute('data-item-id');
        removeClass(items[targetId], 'is-active');
        showActive();
      }

      function openDropdown (e) {
        list.setAttribute('aria-expanded', true);
        addClass(list, 'is-active');
        addEvent(document.body, 'click', setDropdown);
        console.log('open the thingy')
      }

      function setDropdown (e) {
        addEvent(document.body, 'click', closeDropdown);
        addEvent(input, 'keyup', escapeCloseDropdown);
      }

      function escapeCloseDropdown (e) {
        if (e.keyCode == 27) {
          closeDropdown();
        }
      }

      function closeDropdown (e) {
        removeEvent(document.body, 'click', setDropdown);
        removeEvent(input, 'keyup', escapeCloseDropdown);
        removeEvent(document.body, 'click', closeDropdown);
        list.setAttribute('aria-expanded', false);
        removeClass(list, 'is-active');
      }

      function toggleItem (e) {
        e.preventDefault();
        toggleClass(e.target, 'is-active');
        showActive();
      }

      addEvent(input, 'keyup', function(e) {
        var itemsArray = nodeListToArray(items);
        itemsArray.forEach(function(item) {
          addClass(item, 'is-hidden');
        });

        calcite.filterList(input.value, itemsArray).forEach(function(item) {
          removeClass(item, 'is-hidden');
        });
      });

      container.addEventListener('focusin', openDropdown, true);
      if (clearButton) {
        addEvent(clearButton, 'click', clearAllItems);
      }
      showActive();
    });
  };

  // ┌────────────────────┐
  // │ Initialize Calcite │
  // └────────────────────┘
  // start up Calcite and attach all the patterns
  // optionally pass an array of patterns you'd like to watch
  function init (patterns) {
    patterns = patterns || ['sticky', 'accordion', 'dropdown', 'drawer', 'expandingNav', 'modal', 'tabs', 'siteSearch', 'thirdNav', 'filterDropdown'];
    patterns.forEach(function (pattern) {
      calcite[pattern]();
    });
  }

  // ┌────────────────┐
  // │ Expose Calcite │
  // └────────────────┘
  // make calcite available to amd, common-js, or globally
  if (typeof define === 'function' && define.amd) {
    define(function () { return calcite; });
  } else if (typeof exports === 'object') {
    module.exports = calcite;
  } else {
    // if something called calcite already exists,
    // save it for recovery via calcite.noConflict()
    var oldCalcite = window.calcite;
    calcite.noConflict = function () {
      window.calcite = oldCalcite;
      return this;
    };
    window.calcite = calcite;
  }

})();

},{}],14:[function(require,module,exports){
/**
 * Module dependencies
 */

var matches = require('dom-matches');

/**
 * @param element {Element}
 * @param selector {String}
 * @param context {Element}
 * @return {Element}
 */
module.exports = function (element, selector, context) {
  context = context || document;
  // guard against orphans
  element = { parentNode: element };

  while ((element = element.parentNode) && element !== context) {
    if (matches(element, selector)) {
      return element;
    }
  }
};

},{"dom-matches":15}],15:[function(require,module,exports){
'use strict';

/**
 * Vendor-specific implementations of `Element.prototype.matches()`.
 */

var proto = Element.prototype;

var nativeMatches = proto.matches ||
  proto.mozMatchesSelector ||
  proto.msMatchesSelector ||
  proto.oMatchesSelector ||
  proto.webkitMatchesSelector;

/**
 * Determine if the browser supports matching orphan elements. IE 9's
 * vendor-specific implementation doesn't work with orphans and neither does
 * the fallback for older browsers.
 */

var matchesOrphans = (function () {
  return nativeMatches ? nativeMatches.call(document.createElement('a'), 'a') : false;
}());

/**
 * Determine if a DOM element matches a CSS selector
 *
 * @param {Element} elem
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function matches(elem, selector) {
  if (!elem || elem.nodeType !== 1) {
    return false;
  }

  var parentElem = elem.parentNode;

  // create a parent for orphans if the browser requires it
  if (!parentElem && !matchesOrphans) {
    parentElem = document.createDocumentFragment();
    parentElem.appendChild(elem);
  }

  // use native 'matches'
  if (nativeMatches) {
      return nativeMatches.call(elem, selector);
  }

  // native support for `matches` is missing and a fallback is required
  var nodes = parentElem.querySelectorAll(selector);
  var len = nodes.length;

  for (var i = 0; i < len; i++) {
    if (nodes[i] === elem) {
      return true;
    }
  }

  return false;
}

/**
 * Expose `matches`
 */

module.exports = matches;

},{}],16:[function(require,module,exports){
'use strict';

var proto = Element.prototype;
var vendor = proto.matches
  || proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == el) return true;
  }
  return false;
}
},{}],17:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Promise = require('./Promise');

var all = Promise.all;
var resolve = Promise.resolve;

module.exports = LinkedList;

/**
 * Doubly linked list
 * @constructor
 */
function LinkedList() {
	this.head = null;
	this.length = 0;
}

/**
 * Add a node to the end of the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to add
 */
LinkedList.prototype.add = function(x) {
	if(this.head !== null) {
		this.head.prev = x;
		x.next = this.head;
	}
	this.head = x;
	++this.length;
};

/**
 * Remove the provided node from the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to remove
 */
LinkedList.prototype.remove = function(x) {
	--this.length;
	if(x === this.head) {
		this.head = this.head.next;
	}
	if(x.next !== null) {
		x.next.prev = x.prev;
		x.next = null;
	}
	if(x.prev !== null) {
		x.prev.next = x.next;
		x.prev = null;
	}
};

/**
 * @returns {boolean} true iff there are no nodes in the list
 */
LinkedList.prototype.isEmpty = function() {
	return this.length === 0;
};

/**
 * Dispose all nodes
 * @returns {Promise} promise that fulfills when all nodes have been disposed,
 *  or rejects if an error occurs while disposing
 */
LinkedList.prototype.dispose = function() {
	if(this.isEmpty()) {
		return resolve();
	}

	var promises = [];
	var x = this.head;
	this.head = null;
	this.length = 0;

	while(x !== null) {
		promises.push(x.dispose());
		x = x.next;
	}

	return all(promises);
};
},{"./Promise":18}],18:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var unhandledRejection = require('when/lib/decorators/unhandledRejection');
module.exports = unhandledRejection(require('when/lib/Promise'));

},{"when/lib/Promise":78,"when/lib/decorators/unhandledRejection":80}],19:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

// Based on https://github.com/petkaantonov/deque

module.exports = Queue;

function Queue(capPow2) {
	this._capacity = capPow2||32;
	this._length = 0;
	this._head = 0;
}

Queue.prototype.push = function (x) {
	var len = this._length;
	this._checkCapacity(len + 1);

	var i = (this._head + len) & (this._capacity - 1);
	this[i] = x;
	this._length = len + 1;
};

Queue.prototype.shift = function () {
	var head = this._head;
	var x = this[head];

	this[head] = void 0;
	this._head = (head + 1) & (this._capacity - 1);
	this._length--;
	return x;
};

Queue.prototype.isEmpty = function() {
	return this._length === 0;
};

Queue.prototype.length = function () {
	return this._length;
};

Queue.prototype._checkCapacity = function (size) {
	if (this._capacity < size) {
		this._ensureCapacity(this._capacity << 1);
	}
};

Queue.prototype._ensureCapacity = function (capacity) {
	var oldCapacity = this._capacity;
	this._capacity = capacity;

	var last = this._head + this._length;

	if (last > oldCapacity) {
		copy(this, 0, this, oldCapacity, last & (oldCapacity - 1));
	}
};

function copy(src, srcIndex, dst, dstIndex, len) {
	for (var j = 0; j < len; ++j) {
		dst[j + dstIndex] = src[j + srcIndex];
		src[j + srcIndex] = void 0;
	}
}


},{}],20:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = Stream;

function Stream(source) {
	this.source = source;
}

},{}],21:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.noop = noop;
exports.identity = identity;
exports.compose = compose;

exports.cons = cons;
exports.append = append;
exports.drop = drop;
exports.tail = tail;
exports.copy = copy;
exports.map = map;
exports.reduce = reduce;
exports.replace = replace;
exports.remove = remove;
exports.removeAll = removeAll;
exports.findIndex = findIndex;

function noop() {}

function identity(x) {
	return x;
}

function compose(f, g) {
	return function(x) {
		return f(g(x));
	};
}

function cons(x, array) {
	var l = array.length;
	var a = new Array(l + 1);
	a[0] = x;
	for(var i=0; i<l; ++i) {
		a[i + 1] = array[i];
	}
	return a;
}

function append(x, a) {
	var l = a.length;
	var b = new Array(l+1);
	for(var i=0; i<l; ++i) {
		b[i] = a[i];
	}

	b[l] = x;
	return b;
}

function drop(n, array) {
	var l = array.length;
	if(n >= l) {
		return [];
	}

	l -= n;
	var a = new Array(l);
	for(var i=0; i<l; ++i) {
		a[i] = array[n+i];
	}
	return a;
}

function tail(array) {
	return drop(1, array);
}

function copy(array) {
	var l = array.length;
	var a = new Array(l);
	for(var i=0; i<l; ++i) {
		a[i] = array[i];
	}
	return a;
}

function map(f, array) {
	var l = array.length;
	var a = new Array(l);
	for(var i=0; i<l; ++i) {
		a[i] = f(array[i]);
	}
	return a;
}

function reduce(f, z, array) {
	var r = z;
	for(var i=0, l=array.length; i<l; ++i) {
		r = f(r, array[i], i);
	}
	return r;
}

function replace(x, i, array) {
	var l = array.length;
	var a = new Array(l);
	for(var j=0; j<l; ++j) {
		a[j] = i === j ? x : array[j];
	}
	return a;
}

function remove(index, array) {
	var l = array.length;
	if(index >= array) { // exit early if index beyond end of array
		return array;
	}

	if(l === 1) { // exit early if index in bounds and length === 1
		return [];
	}

	l -= 1;
	var b = new Array(l);
	var i;
	for(i=0; i<index; ++i) {
		b[i] = array[i];
	}
	for(i=index; i<l; ++i) {
		b[i] = array[i+1];
	}

	return b;
}

function removeAll(f, a) {
	var l = a.length;
	var b = new Array(l);
	for(var x, i=0, j=0; i<l; ++i) {
		x = a[i];
		if(!f(x)) {
			b[j] = x;
			++j;
		}
	}

	b.length = j;
	return b;
}

function findIndex(x, a) {
	for (var i = 0, l = a.length; i < l; ++i) {
		if (x === a[i]) {
			return i;
		}
	}
	return -1;
}

},{}],22:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Pipe = require('../sink/Pipe');
var runSource = require('../runSource');
var noop = require('../base').noop;

exports.scan = scan;
exports.reduce = reduce;

/**
 * Create a stream containing successive reduce results of applying f to
 * the previous reduce result and the current stream item.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @param {Stream} stream stream to scan
 * @returns {Stream} new stream containing successive reduce results
 */
function scan(f, initial, stream) {
	return new Stream(new Scan(f, initial, stream.source));
}

function Scan(f, z, source) {
	this.f = f;
	this.value = z;
	this.source = source;
}

Scan.prototype.run = function(sink, scheduler) {
	return this.source.run(new ScanSink(this.f, this.value, sink), scheduler);
};

function ScanSink(f, z, sink) {
	this.f = f;
	this.value = z;
	this.sink = sink;
	this.init = true;
}

ScanSink.prototype.event = function(t, x) {
	if(this.init) {
		this.init = false;
		this.sink.event(t, this.value);
	}

	var f = this.f;
	this.value = f(this.value, x);
	this.sink.event(t, this.value);
};

ScanSink.prototype.error = Pipe.prototype.error;

ScanSink.prototype.end = function(t) {
	this.sink.end(t, this.value);
};

/**
 * Reduce a stream to produce a single result.  Note that reducing an infinite
 * stream will return a Promise that never fulfills, but that may reject if an error
 * occurs.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @param {Stream} stream to reduce
 * @returns {Promise} promise for the file result of the reduce
 */
function reduce(f, initial, stream) {
	return runSource(noop, new Accumulate(f, initial, stream.source));
}

function Accumulate(f, z, source) {
	this.f = f;
	this.value = z;
	this.source = source;
}

Accumulate.prototype.run = function(sink, scheduler) {
	return this.source.run(new AccumulateSink(this.f, this.value, sink), scheduler);
};

function AccumulateSink(f, z, sink) {
	this.f = f;
	this.value = z;
	this.sink = sink;
}

AccumulateSink.prototype.event = function(t, x) {
	var f = this.f;
	this.value = f(this.value, x);
	this.sink.event(t, this.value);
};

AccumulateSink.prototype.error = Pipe.prototype.error;

AccumulateSink.prototype.end = function(t) {
	this.sink.end(t, this.value);
};

},{"../Stream":20,"../base":21,"../runSource":57,"../sink/Pipe":63}],23:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var combine = require('./combine').combine;

exports.ap  = ap;

/**
 * Assume fs is a stream containing functions, and apply the latest function
 * in fs to the latest value in xs.
 * fs:         --f---------g--------h------>
 * xs:         -a-------b-------c-------d-->
 * ap(fs, xs): --fa-----fb-gb---gc--hc--hd->
 * @param {Stream} fs stream of functions to apply to the latest x
 * @param {Stream} xs stream of values to which to apply all the latest f
 * @returns {Stream} stream containing all the applications of fs to xs
 */
function ap(fs, xs) {
	return combine(apply, fs, xs);
}

function apply(f, x) {
	return f(x);
}

},{"./combine":25}],24:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var streamOf = require('../source/core').of;
var fromArray = require('../source/fromArray').fromArray;
var concatMap = require('./concatMap').concatMap;
var Sink = require('../sink/Pipe');
var Promise = require('../Promise');
var identity = require('../base').identity;

exports.concat = concat;
exports.cycle = cycle;
exports.cons = cons;

/**
 * @param {*} x value to prepend
 * @param {Stream} stream
 * @returns {Stream} new stream with x prepended
 */
function cons(x, stream) {
	return concat(streamOf(x), stream);
}

/**
 * @param {Stream} left
 * @param {Stream} right
 * @returns {Stream} new stream containing all events in left followed by all
 *  events in right.  This *timeshifts* right to the end of left.
 */
function concat(left, right) {
	return concatMap(identity, fromArray([left, right]));
}

/**
 * Tie stream into a circle, thus creating an infinite stream
 * @param {Stream} stream
 * @returns {Stream} new infinite stream
 */
function cycle(stream) {
	return new Stream(new Cycle(stream.source));
}

function Cycle(source) {
	this.source = source;
}

Cycle.prototype.run = function(sink, scheduler) {
	return new CycleSink(this.source, sink, scheduler);
};

function CycleSink(source, sink, scheduler) {
	this.active = true;
	this.sink = sink;
	this.scheduler = scheduler;
	this.source = source;
	this.disposable = source.run(this, scheduler);
}

CycleSink.prototype.error = Sink.prototype.error;

CycleSink.prototype.event = function(t, x) {
	if(!this.active) {
		return;
	}
	this.sink.event(t, x);
};

CycleSink.prototype.end = function(t) {
	if(!this.active) {
		return;
	}

	var self = this;
	Promise.resolve(this.disposable.dispose()).catch(function(e) {
		self.error(t, e);
	});
	this.disposable = this.source.run(this, this.scheduler);
};

CycleSink.prototype.dispose = function() {
	this.active = false;
	return this.disposable.dispose();
};
},{"../Promise":18,"../Stream":20,"../base":21,"../sink/Pipe":63,"../source/core":67,"../source/fromArray":70,"./concatMap":26}],25:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var transform = require('./transform');
var core = require('../source/core');
var Pipe = require('../sink/Pipe');
var IndexSink = require('../sink/IndexSink');
var CompoundDisposable = require('../disposable/CompoundDisposable');
var base = require('../base');
var invoke = require('../invoke');

var hasValue = IndexSink.hasValue;
var getValue = IndexSink.getValue;

var map = base.map;
var tail = base.tail;

exports.combineArray = combineArray;
exports.combine = combine;

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
function combine(f /*, ...streams */) {
	return new Stream(new Combine(f, map(getSource, tail(arguments))));
}

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @param {[Stream]} streams most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
function combineArray(f, streams) {
	return streams.length === 0 ? core.empty()
		 : streams.length === 1 ? transform.map(f, streams[0])
		 : new Stream(new Combine(f, map(getSource, streams)));
}

function getSource(stream) {
	return stream.source;
}

function Combine(f, sources) {
	this.f = f;
	this.sources = sources;
}

Combine.prototype.run = function(sink, scheduler) {
	var l = this.sources.length;
	var disposables = new Array(l);
	var sinks = new Array(l);

	var combineSink = new CombineSink(this.f, sinks, sink);

	for(var indexSink, i=0; i<l; ++i) {
		indexSink = sinks[i] = new IndexSink(i, combineSink);
		disposables[i] = this.sources[i].run(indexSink, scheduler);
	}

	return new CompoundDisposable(disposables);
};

function CombineSink(f, sinks, sink) {
	this.f = f;
	this.sinks = sinks;
	this.sink = sink;
	this.ready = false;
	this.activeCount = sinks.length;
}

CombineSink.prototype.event = function(t /*, indexSink */) {
	if(!this.ready) {
		this.ready = this.sinks.every(hasValue);
	}

	if(this.ready) {
		// TODO: Maybe cache values in their own array once this.ready
		this.sink.event(t, invoke(this.f, map(getValue, this.sinks)));
	}
};

CombineSink.prototype.end = function(t, indexedValue) {
	if(--this.activeCount === 0) {
		this.sink.end(t, indexedValue.value);
	}
};

CombineSink.prototype.error = Pipe.prototype.error;

},{"../Stream":20,"../base":21,"../disposable/CompoundDisposable":48,"../invoke":55,"../sink/IndexSink":61,"../sink/Pipe":63,"../source/core":67,"./transform":45}],26:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var mergeConcurrently = require('./mergeConcurrently').mergeConcurrently;
var map = require('./transform').map;

exports.concatMap = concatMap;

/**
 * Map each value in stream to a new stream, and concatenate them all
 * stream:              -a---b---cX
 * f(a):                 1-1-1-1X
 * f(b):                        -2-2-2-2X
 * f(c):                                -3-3-3-3X
 * stream.concatMap(f): -1-1-1-1-2-2-2-2-3-3-3-3X
 * @param {function(x:*):Stream} f function to map each value to a stream
 * @param {Stream} stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
function concatMap(f, stream) {
	return mergeConcurrently(1, map(f, stream));
}

},{"./mergeConcurrently":36,"./transform":45}],27:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');
var CompoundDisposable = require('../disposable/CompoundDisposable');
var PropagateTask = require('../scheduler/PropagateTask');

exports.delay = delay;

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @param {Stream} stream
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
function delay(delayTime, stream) {
	return delayTime <= 0 ? stream
		 : new Stream(new Delay(delayTime, stream.source));
}

function Delay(dt, source) {
	this.dt = dt;
	this.source = source;
}

Delay.prototype.run = function(sink, scheduler) {
	var delaySink = new DelaySink(this.dt, sink, scheduler);
	return new CompoundDisposable([delaySink, this.source.run(delaySink, scheduler)]);
};

function DelaySink(dt, sink, scheduler) {
	this.dt = dt;
	this.sink = sink;
	this.scheduler = scheduler;
}

DelaySink.prototype.dispose = function() {
	var self = this;
	this.scheduler.cancelAll(function(task) {
		return task.sink === self.sink;
	});
};

DelaySink.prototype.event = function(t, x) {
	this.scheduler.delay(this.dt, PropagateTask.event(x, this.sink));
};

DelaySink.prototype.end = function(t, x) {
	this.scheduler.delay(this.dt, PropagateTask.end(x, this.sink));
};

DelaySink.prototype.error = Sink.prototype.error;

},{"../Stream":20,"../disposable/CompoundDisposable":48,"../scheduler/PropagateTask":58,"../sink/Pipe":63}],28:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var ValueSource = require('../source/ValueSource');

exports.flatMapError = flatMapError;
exports.throwError   = throwError;

/**
 * If stream encounters an error, recover and continue with items from stream
 * returned by f.
 * @param {function(error:*):Stream} f function which returns a new stream
 * @param {Stream} stream
 * @returns {Stream} new stream which will recover from an error by calling f
 */
function flatMapError(f, stream) {
	return new Stream(new FlatMapError(f, stream.source));
}

/**
 * Create a stream containing only an error
 * @param {*} e error value, preferably an Error or Error subtype
 * @returns {Stream} new stream containing only an error
 */
function throwError(e) {
	return new Stream(new ValueSource(error, e));
}

function error(t, e, sink) {
	sink.error(t, e);
}

function FlatMapError(f, source) {
	this.f = f;
	this.source = source;
}

FlatMapError.prototype.run = function(sink, scheduler) {
	return new FlatMapErrorSink(this.f, this.source, sink, scheduler);
};

function FlatMapErrorSink(f, source, sink, scheduler) {
	this.f = f;
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;
	this.disposable = source.run(this, scheduler);
}

FlatMapErrorSink.prototype.error = function(t, e) {
	if(!this.active) {
		return;
	}

	// TODO: forward dispose errors
	this.disposable.dispose();
	//resolve(this.disposable.dispose()).catch(function(e) { sink.error(t, e); });

	var f = this.f;
	var stream = f(e);
	this.disposable = stream.source.run(this.sink, this.scheduler);
};

FlatMapErrorSink.prototype.event = function(t, x) {
	if(!this.active) {
		return;
	}
	this.sink.event(t, x);
};

FlatMapErrorSink.prototype.end = function(t, x) {
	if(!this.active) {
		return;
	}
	this.sink.end(t, x);
};

FlatMapErrorSink.prototype.dispose = function() {
	this.active = false;
	return this.disposable.dispose();
};
},{"../Stream":20,"../source/ValueSource":66}],29:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');
var Filter = require('../fusion/Filter');

exports.filter = filter;
exports.skipRepeats = skipRepeats;
exports.skipRepeatsWith = skipRepeatsWith;

/**
 * Retain only items matching a predicate
 * @param {function(x:*):boolean} p filtering predicate called for each item
 * @param {Stream} stream stream to filter
 * @returns {Stream} stream containing only items for which predicate returns truthy
 */
function filter(p, stream) {
	return new Stream(Filter.create(p, stream.source));
}

/**
 * Skip repeated events, using === to detect duplicates
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
function skipRepeats(stream) {
	return skipRepeatsWith(same, stream);
}

/**
 * Skip repeated events using the provided equals function to detect duplicates
 * @param {function(a:*, b:*):boolean} equals optional function to compare items
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
function skipRepeatsWith(equals, stream) {
	return new Stream(new SkipRepeats(equals, stream.source));
}

function SkipRepeats(equals, source) {
	this.equals = equals;
	this.source = source;
}

SkipRepeats.prototype.run = function(sink, scheduler) {
	return this.source.run(new SkipRepeatsSink(this.equals, sink), scheduler);
};

function SkipRepeatsSink(equals, sink) {
	this.equals = equals;
	this.sink = sink;
	this.value = void 0;
	this.init = true;
}

SkipRepeatsSink.prototype.end   = Sink.prototype.end;
SkipRepeatsSink.prototype.error = Sink.prototype.error;

SkipRepeatsSink.prototype.event = function(t, x) {
	if(this.init) {
		this.init = false;
		this.value = x;
		this.sink.event(t, x);
	} else if(!this.equals(this.value, x)) {
		this.value = x;
		this.sink.event(t, x);
	}
};

function same(a, b) {
	return a === b;
}

},{"../Stream":20,"../fusion/Filter":52,"../sink/Pipe":63}],30:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var mergeConcurrently = require('./mergeConcurrently').mergeConcurrently;
var map = require('./transform').map;

exports.flatMap = flatMap;
exports.join = join;

/**
 * Map each value in the stream to a new stream, and merge it into the
 * returned outer stream. Event arrival times are preserved.
 * @param {function(x:*):Stream} f chaining function, must return a Stream
 * @param {Stream} stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
function flatMap(f, stream) {
	return join(map(f, stream));
}

/**
 * Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer. Event arrival times are preserved.
 * @param {Stream<Stream<X>>} stream stream of streams
 * @returns {Stream<X>} new stream containing all events of all inner streams
 */
function join(stream) {
	return mergeConcurrently(Infinity, stream);
}

},{"./mergeConcurrently":36,"./transform":45}],31:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');
var AwaitingDisposable = require('../disposable/AwaitingDisposable');
var CompoundDisposable = require('../disposable/CompoundDisposable');

exports.flatMapEnd = flatMapEnd;

function flatMapEnd(f, stream) {
	return new Stream(new FlatMapEnd(f, stream.source));
}

function FlatMapEnd(f, source) {
	this.f = f;
	this.source = source;
}

FlatMapEnd.prototype.run = function(sink, scheduler) {
	return new FlatMapEndSink(this.f, this.source, sink, scheduler);
};

function FlatMapEndSink(f, source, sink, scheduler) {
	this.f = f;
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;
	this.disposable = new AwaitingDisposable(source.run(this, scheduler));
}

FlatMapEndSink.prototype.error = Sink.prototype.error;

FlatMapEndSink.prototype.event = function(t, x) {
	if(!this.active) {
		return;
	}
	this.sink.event(t, x);
};

FlatMapEndSink.prototype.end = function(t, x) {
	if(!this.active) {
		return;
	}

	this.dispose();

	var f = this.f;
	var stream = f(x);
	var disposable = stream.source.run(this.sink, this.scheduler);
	this.disposable = new CompoundDisposable([this.disposable, disposable]);
};

FlatMapEndSink.prototype.dispose = function() {
	this.active = false;
	return this.disposable.dispose();
};
},{"../Stream":20,"../disposable/AwaitingDisposable":47,"../disposable/CompoundDisposable":48,"../sink/Pipe":63}],32:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var combine = require('./combine').combineArray;

var paramsRx = /\(([^)]*)/;
var liftedSuffix = '_most$Stream$lifted';

exports.lift = lift;

/**
 * @deprecated
 * Lift a function to operate on streams.  For example:
 * lift(function(x:number, y:number):number) -> function(xs:Stream, ys:Stream):Stream
 * @param {function} f function to be lifted
 * @returns {function} function with the same arity as f that accepts
 *  streams as arguments and returns a stream
 */
function lift (f) {
	/*jshint evil:true*/
	var m = paramsRx.exec(f.toString());
	var body = 'return function ' + f.name + liftedSuffix + ' (' + m[1] + ') {\n' +
			'  return combine(f, arguments);\n' +
			'};';

	return (new Function('combine', 'f', body)(combine, f));
}
},{"./combine":25}],33:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');
var CompoundDisposable = require('../disposable/CompoundDisposable');
var PropagateTask = require('../scheduler/PropagateTask');

exports.throttle = throttle;
exports.debounce = debounce;

/**
 * Limit the rate of events by suppressing events that occur too often
 * @param {Number} period time to suppress events
 * @param {Stream} stream
 * @returns {Stream}
 */
function throttle(period, stream) {
	return new Stream(new Throttle(period, stream.source));
}

function Throttle(period, source) {
	this.dt = period;
	this.source = source;
}

Throttle.prototype.run = function(sink, scheduler) {
	return this.source.run(new ThrottleSink(this.dt, sink), scheduler);
};

function ThrottleSink(dt, sink) {
	this.time = 0;
	this.dt = dt;
	this.sink = sink;
}

ThrottleSink.prototype.event = function(t, x) {
	if(t >= this.time) {
		this.time = t + this.dt;
		this.sink.event(t, x);
	}
};

ThrottleSink.prototype.end   = function(t, e) {
	return Sink.prototype.end.call(this, t, e);
};

ThrottleSink.prototype.error = Sink.prototype.error;

/**
 * Wait for a burst of events to subside and emit only the last event in the burst
 * @param {Number} period events occuring more frequently than this
 *  will be suppressed
 * @param {Stream} stream stream to debounce
 * @returns {Stream} new debounced stream
 */
function debounce(period, stream) {
	return new Stream(new Debounce(period, stream.source));
}

function Debounce(dt, source) {
	this.dt = dt;
	this.source = source;
}

Debounce.prototype.run = function(sink, scheduler) {
	return new DebounceSink(this.dt, this.source, sink, scheduler);
};

function DebounceSink(dt, source, sink, scheduler) {
	this.dt = dt;
	this.sink = sink;
	this.scheduler = scheduler;
	this.value = void 0;
	this.timer = null;

	var sourceDisposable = source.run(this, scheduler);
	this.disposable = new CompoundDisposable([this, sourceDisposable]);
}

DebounceSink.prototype.event = function(t, x) {
	this._clearTimer();
	this.value = x;
	this.timer = this.scheduler.delay(this.dt, PropagateTask.event(x, this.sink));
};

DebounceSink.prototype.end = function(t, x) {
	if(this._clearTimer()) {
		this.sink.event(t, this.value);
		this.value = void 0;
	}
	this.sink.end(t, x);
};

DebounceSink.prototype.error = function(t, x) {
	this._clearTimer();
	this.sink.error(t, x);
};

DebounceSink.prototype.dispose = function() {
	this._clearTimer();
};

DebounceSink.prototype._clearTimer = function() {
	if(this.timer === null) {
		return false;
	}
	this.timer.cancel();
	this.timer = null;
	return true;
};

},{"../Stream":20,"../disposable/CompoundDisposable":48,"../scheduler/PropagateTask":58,"../sink/Pipe":63}],34:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Pipe = require('../sink/Pipe');

exports.loop = loop;

/**
 * Generalized feedback loop. Call a stepper function for each event. The stepper
 * will be called with 2 params: the current seed and the an event value.  It must
 * return a new { seed, value } pair. The `seed` will be fed back into the next
 * invocation of stepper, and the `value` will be propagated as the event value.
 * @param {function(seed:*, value:*):{seed:*, value:*}} stepper loop step function
 * @param {*} seed initial seed value passed to first stepper call
 * @param {Stream} stream event stream
 * @returns {Stream} new stream whose values are the `value` field of the objects
 * returned by the stepper
 */
function loop(stepper, seed, stream) {
	return new Stream(new Loop(stepper, seed, stream.source));
}

function Loop(stepper, seed, source) {
	this.step = stepper;
	this.seed = seed;
	this.source = source;
}

Loop.prototype.run = function(sink, scheduler) {
	return this.source.run(new LoopSink(this.step, this.seed, sink), scheduler);
};

function LoopSink(stepper, seed, sink) {
	this.step = stepper;
	this.seed = seed;
	this.sink = sink;
}

LoopSink.prototype.error = Pipe.prototype.error;

LoopSink.prototype.event = function(t, x) {
	var result = this.step(this.seed, x);
	this.seed = result.seed;
	this.sink.event(t, result.value);
};

LoopSink.prototype.end = function(t) {
	this.sink.end(t, this.seed);
};

},{"../Stream":20,"../sink/Pipe":63}],35:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var empty = require('../Stream').empty;
var fromArray = require('../source/fromArray').fromArray;
var mergeConcurrently = require('./mergeConcurrently').mergeConcurrently;
var copy = require('../base').copy;

exports.merge = merge;
exports.mergeArray = mergeArray;

/**
 * @returns {Stream} stream containing events from all streams in the argument
 * list in time order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
function merge(/*...streams*/) {
	return mergeArray(copy(arguments));
}

/**
 * @param {Array} streams array of stream to merge
 * @returns {Stream} stream containing events from all input observables
 * in time order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
function mergeArray(streams) {
	var l = streams.length;
    return l === 0 ? empty()
		 : l === 1 ? streams[0]
		 : mergeConcurrently(l, fromArray(streams));
}

},{"../Stream":20,"../base":21,"../source/fromArray":70,"./mergeConcurrently":36}],36:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var AwaitingDisposable = require('../disposable/AwaitingDisposable');
var LinkedList = require('../LinkedList');
var Promise = require('../Promise');

var resolve = Promise.resolve;
var all = Promise.all;

exports.mergeConcurrently = mergeConcurrently;

function mergeConcurrently(concurrency, stream) {
	return new Stream(new MergeConcurrently(concurrency, stream.source));
}

function MergeConcurrently(concurrency, source) {
	this.concurrency = concurrency;
	this.source = source;
}

MergeConcurrently.prototype.run = function(sink, scheduler) {
	return new Outer(this.concurrency, this.source, sink, scheduler);
};

function Outer(concurrency, source, sink, scheduler) {
	this.concurrency = concurrency;
	this.sink = sink;
	this.scheduler = scheduler;
	this.pending = [];
	this.current = new LinkedList();
	this.disposable = new AwaitingDisposable(source.run(this, scheduler));
	this.active = true;
}

Outer.prototype.event = function(t, x) {
	this._addInner(t, x);
};

Outer.prototype._addInner = function(t, stream) {
	if(this.current.length < this.concurrency) {
		this._startInner(t, stream);
	} else {
		this.pending.push(stream);
	}
};

Outer.prototype._startInner = function(t, stream) {
	var innerSink = new Inner(t, this, this.sink);
	this.current.add(innerSink);
	innerSink.disposable = stream.source.run(innerSink, this.scheduler);
};

Outer.prototype.end = function(t, x) {
	this.active = false;
	this.disposable.dispose();
	this._checkEnd(t, x);
};

Outer.prototype.error = function(t, e) {
	this.active = false;
	this.sink.error(t, e);
};

Outer.prototype.dispose = function() {
	this.active = false;
	this.pending.length = 0;
	return all([this.disposable.dispose(), this.current.dispose()]);
};

Outer.prototype._endInner = function(t, x, inner) {
	this.current.remove(inner);
	var self = this;
	resolve(inner.dispose()).catch(function(e) {
		self.error(t, e);
	});

	if(this.pending.length === 0) {
		this._checkEnd(t, x);
	} else {
		this._startInner(t, this.pending.shift());
	}
};

Outer.prototype._checkEnd = function(t, x) {
	if(!this.active && this.current.isEmpty()) {
		this.sink.end(t, x);
	}
};

function Inner(time, outer, sink) {
	this.prev = this.next = null;
	this.time = time;
	this.outer = outer;
	this.sink = sink;
	this.disposable = void 0;
}

Inner.prototype.event = function(t, x) {
	this.sink.event(Math.max(t, this.time), x);
};

Inner.prototype.end = function(t, x) {
	this.outer._endInner(Math.max(t, this.time), x, this);
};

Inner.prototype.error = function(t, e) {
	this.outer.error(Math.max(t, this.time), e);
};

Inner.prototype.dispose = function() {
	return this.disposable.dispose();
};

},{"../LinkedList":17,"../Promise":18,"../Stream":20,"../disposable/AwaitingDisposable":47}],37:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var runSource = require('../runSource');
var noop = require('../base').noop;

exports.observe = observe;
exports.drain = drain;

/**
 * Observe all the event values in the stream in time order. The
 * provided function `f` will be called for each event value
 * @param {function(x:T):*} f function to call with each event value
 * @param {Stream<T>} stream stream to observe
 * @return {Promise} promise that fulfills after the stream ends without
 *  an error, or rejects if the stream ends with an error.
 */
function observe(f, stream) {
	return runSource(f, stream.source);
}

/**
 * "Run" a stream by
 * @param stream
 * @return {*}
 */
function drain(stream) {
	return runSource(noop, stream.source);
}

},{"../base":21,"../runSource":57}],38:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var resolve = require('../Promise').resolve;
var fatal = require('../fatalError');

exports.fromPromise = fromPromise;
exports.await = await;

function fromPromise(p) {
	return new Stream(new PromiseSource(p));
}

function PromiseSource(p) {
	this.promise = p;
}

PromiseSource.prototype.run = function(sink, scheduler) {
	return new PromiseProducer(this.promise, sink, scheduler);
};

function PromiseProducer(p, sink, scheduler) {
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;

	var self = this;
	resolve(p).then(function(x) {
		self._emit(self.scheduler.now(), x);
	}).catch(function(e) {
		self._error(self.scheduler.now(), e);
	});
}

PromiseProducer.prototype._emit = function(t, x) {
	if(!this.active) {
		return;
	}

	this.sink.event(t, x);
	this.sink.end(t, void 0);
};

PromiseProducer.prototype._error = function(t, e) {
	if(!this.active) {
		return;
	}

	this.sink.error(t, e);
};

PromiseProducer.prototype.dispose = function() {
	this.active = false;
};

function await(stream) {
	return new Stream(new Await(stream.source));
}

function Await(source) {
	this.source = source;
}

Await.prototype.run = function(sink, scheduler) {
	return this.source.run(new AwaitSink(sink, scheduler), scheduler);
};

function AwaitSink(sink, scheduler) {
	this.sink = sink;
	this.scheduler = scheduler;
	this.queue = void 0;
}

AwaitSink.prototype.event = function(t, promise) {
	var self = this;
	this.queue = resolve(this.queue).then(function() {
		return self._event(t, promise);
	}).catch(function(e) {
		return self._error(t, e);
	});
};

AwaitSink.prototype.end = function(t, x) {
	var self = this;
	this.queue = resolve(this.queue).then(function() {
		return self._end(t, x);
	}).catch(function(e) {
		return self._error(t, e);
	});
};

AwaitSink.prototype.error = function(t, e) {
	var self = this;
	this.queue = resolve(this.queue).then(function() {
		return self._error(t, e);
	}).catch(fatal);
};

AwaitSink.prototype._error = function(t, e) {
	try {
		// Don't resolve error values, propagate directly
		this.sink.error(Math.max(t, this.scheduler.now()), e);
	} catch(e) {
		fatal(e);
		throw e;
	}
};

AwaitSink.prototype._event = function(t, promise) {
	var self = this;
	return promise.then(function(x) {
		self.sink.event(Math.max(t, self.scheduler.now()), x);
	});
};

AwaitSink.prototype._end = function(t, x) {
	var self = this;
	return resolve(x).then(function(x) {
		self.sink.end(Math.max(t, self.scheduler.now()), x);
	});
};

},{"../Promise":18,"../Stream":20,"../fatalError":51}],39:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Pipe = require('../sink/Pipe');
var CompoundDisposable = require('../disposable/CompoundDisposable');
var base = require('../base');
var invoke = require('../invoke');

exports.sample = sample;
exports.sampleWith = sampleWith;
exports.sampleArray = sampleArray;

/**
 * When an event arrives on sampler, emit the result of calling f with the latest
 * values of all streams being sampled
 * @param {function(...values):*} f function to apply to each set of sampled values
 * @param {Stream} sampler streams will be sampled whenever an event arrives
 *  on sampler
 * @returns {Stream} stream of sampled and transformed values
 */
function sample(f, sampler /*, ...streams */) {
	return sampleArray(f, sampler, base.drop(2, arguments));
}

/**
 * When an event arrives on sampler, emit the latest event value from stream.
 * @param {Stream} sampler stream of events at whose arrival time
 *  stream's latest value will be propagated
 * @param {Stream} stream stream of values
 * @returns {Stream} sampled stream of values
 */
function sampleWith(sampler, stream) {
	return new Stream(new Sampler(base.identity, sampler.source, [stream.source]));
}

function sampleArray(f, sampler, streams) {
	return new Stream(new Sampler(f, sampler.source, base.map(getSource, streams)));
}

function getSource(stream) {
	return stream.source;
}

function Sampler(f, sampler, sources) {
	this.f = f;
	this.sampler = sampler;
	this.sources = sources;
}

Sampler.prototype.run = function(sink, scheduler) {
	var l = this.sources.length;
	var disposables = new Array(l+1);
	var sinks = new Array(l);

	var sampleSink = new SampleSink(this.f, sinks, sink);

	for(var hold, i=0; i<l; ++i) {
		hold = sinks[i] = new Hold(sampleSink);
		disposables[i] = this.sources[i].run(hold, scheduler);
	}

	disposables[i] = this.sampler.run(sampleSink, scheduler);

	return new CompoundDisposable(disposables);
};

function Hold(sink) {
	this.sink = sink;
	this.hasValue = false;
}

Hold.prototype.event = function(t, x) {
	this.value = x;
	this.hasValue = true;
	this.sink._notify(this);
};

Hold.prototype.end = base.noop;
Hold.prototype.error = Pipe.prototype.error;

function SampleSink(f, sinks, sink) {
	this.f = f;
	this.sinks = sinks;
	this.sink = sink;
	this.active = false;
}

SampleSink.prototype._notify = function() {
	if(!this.active) {
		this.active = this.sinks.every(hasValue);
	}
};

SampleSink.prototype.event = function(t) {
	if(this.active) {
		this.sink.event(t, invoke(this.f, base.map(getValue, this.sinks)));
	}
};

SampleSink.prototype.end = Pipe.prototype.end;
SampleSink.prototype.error = Pipe.prototype.error;

function hasValue(hold) {
	return hold.hasValue;
}

function getValue(hold) {
	return hold.value;
}

},{"../Stream":20,"../base":21,"../disposable/CompoundDisposable":48,"../invoke":55,"../sink/Pipe":63}],40:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');
var core = require('../source/core');
var AwaitingDisposable = require('../disposable/AwaitingDisposable');

exports.take = take;
exports.skip = skip;
exports.slice = slice;
exports.takeWhile = takeWhile;
exports.skipWhile = skipWhile;

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream containing only up to the first n items from stream
 */
function take(n, stream) {
	return slice(0, n, stream);
}

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream with the first n items removed
 */
function skip(n, stream) {
	return slice(n, Infinity, stream);
}

/**
 * Slice a stream by index. Negative start/end indexes are not supported
 * @param {number} start
 * @param {number} end
 * @param {Stream} stream
 * @returns {Stream} stream containing items where start <= index < end
 */
function slice(start, end, stream) {
	return end <= start ? core.empty()
		: new Stream(new Slice(start, end, stream.source));
}

function Slice(min, max, source) {
	this.skip = min;
	this.take = max - min;
	this.source = source;
}

Slice.prototype.run = function(sink, scheduler) {
	return new SliceSink(this.skip, this.take, this.source, sink, scheduler);
};

function SliceSink(skip, take, source, sink, scheduler) {
	this.skip = skip;
	this.take = take;
	this.sink = sink;
	this.disposable = new AwaitingDisposable(source.run(this, scheduler));
}

SliceSink.prototype.end   = Sink.prototype.end;
SliceSink.prototype.error = Sink.prototype.error;

SliceSink.prototype.event = function(t, x) {
	if(this.skip > 0) {
		this.skip -= 1;
		return;
	}

	if(this.take === 0) {
		return;
	}

	this.take -= 1;
	this.sink.event(t, x);
	if(this.take === 0) {
		this.dispose();
		this.sink.end(t, x);
	}
};

SliceSink.prototype.dispose = function() {
	return this.disposable.dispose();
};

function takeWhile(p, stream) {
	return new Stream(new TakeWhile(p, stream.source));
}

function TakeWhile(p, source) {
	this.p = p;
	this.source = source;
}

TakeWhile.prototype.run = function(sink, scheduler) {
	return new TakeWhileSink(this.p, this.source, sink, scheduler);
};

function TakeWhileSink(p, source, sink, scheduler) {
	this.p = p;
	this.sink = sink;
	this.active = true;
	this.disposable = new AwaitingDisposable(source.run(this, scheduler));
}

TakeWhileSink.prototype.end   = Sink.prototype.end;
TakeWhileSink.prototype.error = Sink.prototype.error;

TakeWhileSink.prototype.event = function(t, x) {
	if(!this.active) {
		return;
	}

	var p = this.p;
	this.active = p(x);
	if(this.active) {
		this.sink.event(t, x);
	} else {
		this.dispose();
		this.sink.end(t, x);
	}
};

TakeWhileSink.prototype.dispose = function() {
	return this.disposable.dispose();
};

function skipWhile(p, stream) {
	return new Stream(new SkipWhile(p, stream.source));
}

function SkipWhile(p, source) {
	this.p = p;
	this.source = source;
}

SkipWhile.prototype.run = function(sink, scheduler) {
	return this.source.run(new SkipWhileSink(this.p, sink), scheduler);
};

function SkipWhileSink(p, sink) {
	this.p = p;
	this.sink = sink;
	this.skipping = true;
}

SkipWhileSink.prototype.end   = Sink.prototype.end;
SkipWhileSink.prototype.error = Sink.prototype.error;

SkipWhileSink.prototype.event = function(t, x) {
	if(this.skipping) {
		var p = this.p;
		this.skipping = p(x);
		if(this.skipping) {
			return;
		}
	}

	this.sink.event(t, x);
};

},{"../Stream":20,"../disposable/AwaitingDisposable":47,"../sink/Pipe":63,"../source/core":67}],41:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var MulticastSource = require('../source/MulticastSource');
var until = require('./timeslice').takeUntil;
var mergeConcurrently = require('./mergeConcurrently').mergeConcurrently;
var map = require('./transform').map;

exports.switch = switchLatest;

/**
 * Given a stream of streams, return a new stream that adopts the behavior
 * of the most recent inner stream.
 * @param {Stream} stream of streams on which to switch
 * @returns {Stream} switching stream
 */
function switchLatest(stream) {
	var upstream = new Stream(new MulticastSource(stream.source));

	return mergeConcurrently(1, map(untilNext, upstream));

	function untilNext(s) {
		return until(upstream, s);
	}
}

},{"../Stream":20,"../source/MulticastSource":65,"./mergeConcurrently":36,"./timeslice":42,"./transform":45}],42:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Pipe = require('../sink/Pipe');
var CompoundDisposable = require('../disposable/CompoundDisposable');
var core = require('../source/core');
var join = require('../combinator/flatMap').join;
var take = require('../combinator/slice').take;
var noop = require('../base').noop;

var streamOf = core.of;
var never = core.never;

exports.during    = during;
exports.takeUntil = takeUntil;
exports.skipUntil = skipUntil;

function takeUntil(signal, stream) {
	return between(streamOf(), signal, stream);
}

function skipUntil(signal, stream) {
	return between(signal, never(), stream);
}

function during(timeWindow, stream) {
	return between(timeWindow, join(timeWindow), stream);
}

function between(start, end, stream) {
	return new Stream(new Within(take(1, start).source, take(1, end).source, stream.source));
}

function Within(minSignal, maxSignal, source) {
	this.minSignal = minSignal;
	this.maxSignal = maxSignal;
	this.source = source;
}

Within.prototype.run = function(sink, scheduler) {
	var min = new MinBound(this.minSignal, sink, scheduler);
	var max = new MaxBound(this.maxSignal, sink, scheduler);
	var disposable = this.source.run(new WithinSink(min, max, sink), scheduler);

	return new CompoundDisposable([min, max, disposable]);
};

function WithinSink(min, max, sink) {
	this.min = min;
	this.max = max;
	this.sink = sink;
}

WithinSink.prototype.event = function(t, x) {
	if(t >= this.min.value && t < this.max.value) {
		this.sink.event(t, x);
	}
};

WithinSink.prototype.error = Pipe.prototype.error;
WithinSink.prototype.end = Pipe.prototype.end;

function MinBound(signal, sink, scheduler) {
	this.value = Infinity;
	this.sink = sink;
	this.disposable = signal.run(this, scheduler);
}

MinBound.prototype.event = function(t /*, x */) {
	if(t < this.value) {
		this.value = t;
	}
};

MinBound.prototype.end = noop;
MinBound.prototype.error = Pipe.prototype.error;

MinBound.prototype.dispose = function() {
	return this.disposable.dispose();
};

function MaxBound(signal, sink, scheduler) {
	this.value = Infinity;
	this.sink = sink;
	this.disposable = signal.run(this, scheduler);
}

MaxBound.prototype.event = function(t, x) {
	if(t < this.value) {
		this.value = t;
		this.sink.end(t, x);
	}
};

MaxBound.prototype.end = noop;
MaxBound.prototype.error = Pipe.prototype.error;

MaxBound.prototype.dispose = function() {
	return this.disposable.dispose();
};

},{"../Stream":20,"../base":21,"../combinator/flatMap":30,"../combinator/slice":40,"../disposable/CompoundDisposable":48,"../sink/Pipe":63,"../source/core":67}],43:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');

exports.timestamp = timestamp;

function timestamp(stream) {
	return new Stream(new Timestamp(stream.source));
}

function Timestamp(source) {
	this.source = source;
}

Timestamp.prototype.run = function(sink, scheduler) {
	return this.source.run(new TimestampSink(sink), scheduler);
};

function TimestampSink(sink) {
	this.sink = sink;
}

TimestampSink.prototype.end   = Sink.prototype.end;
TimestampSink.prototype.error = Sink.prototype.error;

TimestampSink.prototype.event = function(t, x) {
	this.sink.event(t, new TimeValue(t, x));
};

function TimeValue(t, x) {
	this.time = t;
	this.value = x;
}
},{"../Stream":20,"../sink/Pipe":63}],44:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');

exports.transduce = transduce;

/**
 * Transform a stream by passing its events through a transducer.
 * @param  {function} transducer transducer function
 * @param  {Stream} stream stream whose events will be passed through the
 *  transducer
 * @return {Stream} stream of events transformed by the transducer
 */
function transduce(transducer, stream) {
	return new Stream(new Transduce(transducer, stream.source));
}

function Transduce(transducer, source) {
	this.transducer = transducer;
	this.source = source;
}

Transduce.prototype.run = function(sink, scheduler) {
	var xf = this.transducer(new Transformer(sink));
	return this.source.run(new TransduceSink(getTxHandler(xf), sink), scheduler);
};

function TransduceSink(adapter, sink) {
	this.xf = adapter;
	this.sink = sink;
}

TransduceSink.prototype.event = function(t, x) {
	var next = this.xf.step(t, x);

	return this.xf.isReduced(next)
		? this.sink.end(t, this.xf.getResult(next))
		: next;
};

TransduceSink.prototype.end = function(t, x) {
	return this.xf.result(x);
};

TransduceSink.prototype.error = function(t, e) {
	return this.sink.error(t, e);
};

function Transformer(sink) {
	this.time = -Infinity;
	this.sink = sink;
}

Transformer.prototype['@@transducer/init'] = Transformer.prototype.init = function() {};

Transformer.prototype['@@transducer/step'] = Transformer.prototype.step = function(t, x) {
	if(!isNaN(t)) {
		this.time = Math.max(t, this.time);
	}
	return this.sink.event(this.time, x);
};

Transformer.prototype['@@transducer/result'] = Transformer.prototype.result = function(x) {
	return this.sink.end(this.time, x);
};

/**
 * Given an object supporting the new or legacy transducer protocol,
 * create an adapter for it.
 * @param {object} tx transform
 * @returns {TxAdapter|LegacyTxAdapter}
 */
function getTxHandler(tx) {
	return typeof tx['@@transducer/step'] === 'function'
		? new TxAdapter(tx)
		: new LegacyTxAdapter(tx);
}

/**
 * Adapter for new official transducer protocol
 * @param {object} tx transform
 * @constructor
 */
function TxAdapter(tx) {
	this.tx = tx;
}

TxAdapter.prototype.step = function(t, x) {
	return this.tx['@@transducer/step'](t, x);
};
TxAdapter.prototype.result = function(x) {
	return this.tx['@@transducer/result'](x);
};
TxAdapter.prototype.isReduced = function(x) {
	return x != null && x['@@transducer/reduced'];
};
TxAdapter.prototype.getResult = function(x) {
	return x['@@transducer/value'];
};

/**
 * Adapter for older transducer protocol
 * @param {object} tx transform
 * @constructor
 */
function LegacyTxAdapter(tx) {
	this.tx = tx;
}

LegacyTxAdapter.prototype.step = function(t, x) {
	return this.tx.step(t, x);
};
LegacyTxAdapter.prototype.result = function(x) {
	return this.tx.result(x);
};
LegacyTxAdapter.prototype.isReduced = function(x) {
	return x != null && x.__transducers_reduced__;
};
LegacyTxAdapter.prototype.getResult = function(x) {
	return x.value;
};

},{"../Stream":20}],45:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Map = require('../fusion/Map');

exports.map = map;
exports.constant = constant;
exports.tap = tap;

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @param {Stream} stream stream to map
 * @returns {Stream} stream containing items transformed by f
 */
function map(f, stream) {
	return new Stream(Map.create(f, stream.source));
}

/**
 * Replace each value in the stream with x
 * @param {*} x
 * @param {Stream} stream
 * @returns {Stream} stream containing items replaced with x
 */
function constant(x, stream) {
	return map(function() {
		return x;
	}, stream);
}

/**
 * Perform a side effect for each item in the stream
 * @param {function(x:*):*} f side effect to execute for each item. The
 *  return value will be discarded.
 * @param {Stream} stream stream to tap
 * @returns {Stream} new stream containing the same items as this stream
 */
function tap(f, stream) {
	return map(function(x) {
		f(x);
		return x;
	}, stream);
}

},{"../Stream":20,"../fusion/Map":54}],46:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var transform = require('./transform');
var core = require('../source/core');
var Sink = require('../sink/Pipe');
var IndexSink = require('../sink/IndexSink');
var CompoundDisposable = require('../disposable/CompoundDisposable');
var base = require('../base');
var invoke = require('../invoke');
var Queue = require('../Queue');

var map = base.map;
var tail = base.tail;

exports.zip = zip;
exports.zipArray = zipArray;

/**
 * Combine streams pairwise (or tuple-wise) by index by applying f to values
 * at corresponding indices.  The returned stream ends when any of the input
 * streams ends.
 * @param {function} f function to combine values
 * @returns {Stream} new stream with items at corresponding indices combined
 *  using f
 */
function zip(f /*,...streams */) {
	return zipArray(f, tail(arguments));
}

/**
 * Combine streams pairwise (or tuple-wise) by index by applying f to values
 * at corresponding indices.  The returned stream ends when any of the input
 * streams ends.
 * @param {function} f function to combine values
 * @param {[Stream]} streams streams to zip using f
 * @returns {Stream} new stream with items at corresponding indices combined
 *  using f
 */
function zipArray(f, streams) {
	return streams.length === 0 ? core.empty()
		 : streams.length === 1 ? transform.map(f, streams[0])
		 : new Stream(new Zip(f, map(getSource, streams)));
}

function getSource(stream) {
	return stream.source;
}

function Zip(f, sources) {
	this.f = f;
	this.sources = sources;
}

Zip.prototype.run = function(sink, scheduler) {
	var l = this.sources.length;
	var disposables = new Array(l);
	var sinks = new Array(l);
	var buffers = new Array(l);

	var zipSink = new ZipSink(this.f, buffers, sinks, sink);

	for(var indexSink, i=0; i<l; ++i) {
		buffers[i] = new Queue();
		indexSink = sinks[i] = new IndexSink(i, zipSink);
		disposables[i] = this.sources[i].run(indexSink, scheduler);
	}

	return new CompoundDisposable(disposables);
};

function ZipSink(f, buffers, sinks, sink) {
	this.f = f;
	this.sinks = sinks;
	this.sink = sink;
	this.buffers = buffers;
}

ZipSink.prototype.event = function(t, indexedValue) {
	var buffers = this.buffers;
	var buffer = buffers[indexedValue.index];

	buffer.push(indexedValue.value);

	if(buffer.length() === 1) {
		if(!ready(this.buffers)) {
			return;
		}

		emitZipped(this.f, t, buffers, this.sink);

		if (ended(this.buffers, this.sinks)) {
			this.sink.end(t, void 0);
		}
	}
};

ZipSink.prototype.end = function(t, indexedValue) {
	var buffer = this.buffers[indexedValue.index];
	if(buffer.isEmpty()) {
		this.sink.end(t, indexedValue.value);
	}
};

ZipSink.prototype.error = Sink.prototype.error;

function emitZipped (f, t, buffers, sink) {
	sink.event(t, invoke(f, map(head, buffers)));
}

function head(buffer) {
	return buffer.shift();
}

function ended(buffers, sinks) {
	for(var i=0, l=buffers.length; i<l; ++i) {
		if(buffers[i].isEmpty() && !sinks[i].active) {
			return true;
		}
	}
	return false;
}

function ready(buffers) {
	for(var i=0, l=buffers.length; i<l; ++i) {
		if(buffers[i].isEmpty()) {
			return false;
		}
	}
	return true;
}

},{"../Queue":19,"../Stream":20,"../base":21,"../disposable/CompoundDisposable":48,"../invoke":55,"../sink/IndexSink":61,"../sink/Pipe":63,"../source/core":67,"./transform":45}],47:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = AwaitingDisposable;

function AwaitingDisposable(disposable) {
	this.disposed = false;
	this.disposable = disposable;
	this.value = void 0;
}

AwaitingDisposable.prototype.dispose = function() {
	if(!this.disposed) {
		this.disposed = true;
		this.value = this.disposable.dispose();
	}
	return this.value;
};

},{}],48:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var all = require('../Promise').all;
var map = require('../base').map;

module.exports = CompoundDisposable;

function CompoundDisposable(disposables) {
	this.disposed = false;
	this.disposables = disposables;
}

CompoundDisposable.prototype.dispose = function() {
	if(this.disposed) {
		return;
	}
	this.disposed = true;
	return all(map(dispose, this.disposables));
};

function dispose(disposable) {
	return disposable.dispose();
}
},{"../Promise":18,"../base":21}],49:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = Disposable;

function Disposable(f, data) {
	this.disposed = false;
	this._dispose = f;
	this._data = data;
}

Disposable.prototype.dispose = function() {
	if(this.disposed) {
		return;
	}
	this.disposed = true;
	return this._dispose(this._data);
};

},{}],50:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var noop = require('../base').noop;

module.exports = EmptyDisposable;

function EmptyDisposable() {}

EmptyDisposable.prototype.dispose = noop;
},{"../base":21}],51:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = fatalError;

function fatalError (e) {
	setTimeout(function() {
		throw e;
	}, 0);
}
},{}],52:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Pipe = require('../sink/Pipe');

module.exports = Filter;

function Filter(p, source) {
	this.p = p;
	this.source = source;
}

/**
 * Create a filtered source, fusing adjacent filter.filter if possible
 * @param {function(x:*):boolean} p filtering predicate
 * @param {{run:function}} source source to filter
 * @returns {Filter} filtered source
 */
Filter.create = function createFilter(p, source) {
	if (source instanceof Filter) {
		return new Filter(and(source.p, p), source.source);
	}

	return new Filter(p, source);
};

Filter.prototype.run = function(sink, scheduler) {
	return this.source.run(new FilterSink(this.p, sink), scheduler);
};

function FilterSink(p, sink) {
	this.p = p;
	this.sink = sink;
}

FilterSink.prototype.end   = Pipe.prototype.end;
FilterSink.prototype.error = Pipe.prototype.error;

FilterSink.prototype.event = function(t, x) {
	var p = this.p;
	p(x) && this.sink.event(t, x);
};

function and(p, q) {
	return function(x) {
		return p(x) && q(x);
	};
}

},{"../sink/Pipe":63}],53:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Pipe = require('../sink/Pipe');

module.exports = FilterMap;

function FilterMap(p, f, source) {
	this.p = p;
	this.f = f;
	this.source = source;
}

FilterMap.prototype.run = function(sink, scheduler) {
	return this.source.run(new FilterMapSink(this.p, this.f, sink), scheduler);
};

function FilterMapSink(p, f, sink) {
	this.p = p;
	this.f = f;
	this.sink = sink;
}

FilterMapSink.prototype.event = function(t, x) {
	var f = this.f;
	var p = this.p;
	p(x) && this.sink.event(t, f(x));
};

FilterMapSink.prototype.end = Pipe.prototype.end;
FilterMapSink.prototype.error = Pipe.prototype.error;

},{"../sink/Pipe":63}],54:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Pipe = require('../sink/Pipe');
var Filter = require('./Filter');
var FilterMap = require('./FilterMap');
var base = require('../base');

module.exports = Map;

function Map(f, source) {
	this.f = f;
	this.source = source;
}

/**
 * Create a mapped source, fusing adjacent map.map, filter.map,
 * and filter.map.map if possible
 * @param {function(*):*} f mapping function
 * @param {{run:function}} source source to map
 * @returns {Map|FilterMap} mapped source, possibly fused
 */
Map.create = function createMap(f, source) {
	if(source instanceof Map) {
		return new Map(base.compose(f, source.f), source.source);
	}

	if(source instanceof Filter) {
		return new FilterMap(source.p, f, source.source);
	}

	if(source instanceof FilterMap) {
		return new FilterMap(source.p, base.compose(f, source.f), source.source);
	}

	return new Map(f, source);
};

Map.prototype.run = function(sink, scheduler) {
	return this.source.run(new MapSink(this.f, sink), scheduler);
};

function MapSink(f, sink) {
	this.f = f;
	this.sink = sink;
}

MapSink.prototype.end   = Pipe.prototype.end;
MapSink.prototype.error = Pipe.prototype.error;

MapSink.prototype.event = function(t, x) {
	var f = this.f;
	this.sink.event(t, f(x));
};

},{"../base":21,"../sink/Pipe":63,"./Filter":52,"./FilterMap":53}],55:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = invoke;

function invoke(f, args) {
	/*jshint maxcomplexity:7*/
	switch(args.length) {
		case 0: return f();
		case 1: return f(args[0]);
		case 2: return f(args[0], args[1]);
		case 3: return f(args[0], args[1], args[2]);
		case 4: return f(args[0], args[1], args[2], args[3]);
		case 5: return f(args[0], args[1], args[2], args[3], args[4]);
		default:
			return f.apply(void 0, args);
	}
}
},{}],56:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.isIterable = isIterable;
exports.getIterator = getIterator;
exports.makeIterable = makeIterable;

/*global Set, Symbol*/
var iteratorSymbol;
// Firefox ships a partial implementation using the name @@iterator.
// https://bugzilla.mozilla.org/show_bug.cgi?id=907077#c14
if (typeof Set === 'function' && typeof new Set()['@@iterator'] === 'function') {
	iteratorSymbol = '@@iterator';
} else {
	iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator ||
	'_es6shim_iterator_';
}

function isIterable(o) {
	return typeof o[iteratorSymbol] === 'function';
}

function getIterator(o) {
	return o[iteratorSymbol]();
}

function makeIterable(f, o) {
	o[iteratorSymbol] = f;
	return o;
}
},{}],57:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Promise = require('./Promise');
var Observer = require('./sink/Observer');
var scheduler = require('./scheduler/defaultScheduler');

var resolve = Promise.resolve;

module.exports = runSource;

function runSource(f, source) {
	return new Promise(function (res, rej) {
		var disposable;
		var observer = new Observer(f,
			function (x) {
				disposeThen(res, rej, disposable, x);
			}, function (e) {
				disposeThen(rej, rej, disposable, e);
			});

		disposable = source.run(observer, scheduler);
	});
}

function disposeThen(res, rej, disposable, x) {
	resolve(disposable.dispose()).then(function () {
		res(x);
	}, rej);
}


},{"./Promise":18,"./scheduler/defaultScheduler":60,"./sink/Observer":62}],58:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var fatal = require('../fatalError');

module.exports = PropagateTask;

function PropagateTask(run, value, sink) {
	this._run = run;
	this.value = value;
	this.sink = sink;
	this.active = true;
}

PropagateTask.event = function(value, sink) {
	return new PropagateTask(emit, value, sink);
};

PropagateTask.end = function(value, sink) {
	return new PropagateTask(end, value, sink);
};

PropagateTask.error = function(value, sink) {
	return new PropagateTask(error, value, sink);
};

PropagateTask.prototype.dispose = function() {
	this.active = false;
};

PropagateTask.prototype.run = function(t) {
	if(!this.active) {
		return;
	}
	this._run(t, this.value, this.sink);
};

PropagateTask.prototype.error = function(t, e) {
	if(!this.active) {
		return fatal(e);
	}
	this.sink.error(t, e);
};

function error(t, e, sink) {
	sink.error(t, e);
}

function emit(t, x, sink) {
	sink.event(t, x);
}

function end(t, x, sink) {
	sink.end(t, x);
}

},{"../fatalError":51}],59:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var base = require('./../base');
var Promise = require('./../Promise');

var findIndex = base.findIndex;

module.exports = Scheduler;

function ScheduledTask(delay, period, task, scheduler) {
	this.time = delay;
	this.period = period;
	this.task = task;
	this.scheduler = scheduler;
	this.active = true;
}

ScheduledTask.prototype.run = function() {
	return this.task.run(this.time);
};

ScheduledTask.prototype.error = function(e) {
	return this.task.error(this.time, e);
};

ScheduledTask.prototype.cancel = function() {
	this.scheduler.cancel(this);
	return this.task.dispose();
};

function runTask(task) {
	try {
		return task.run();
	} catch(e) {
		return task.error(e);
	}
}

function Scheduler(setTimer, clearTimer, now) {
	this.now = now;
	this._setTimer = setTimer;
	this._clearTimer = clearTimer;

	this._timer = null;
	this._nextArrival = 0;
	this._tasks = [];

	var self = this;
	this._runReadyTasksBound = function() {
		self._runReadyTasks();
	};
}

Scheduler.prototype.asap = function(task) {
	var scheduled = new ScheduledTask(0, -1, task, this);
	return Promise.resolve(scheduled).then(runTask);
};

Scheduler.prototype.delay = function(delay, task) {
	return this.schedule(delay, -1, task);
};

Scheduler.prototype.periodic = function(period, task) {
	return this.schedule(0, period, task);
};

Scheduler.prototype.schedule = function(delay, period, task) {
	var st = new ScheduledTask(this.now() + Math.max(0, delay), period, task, this);

	insertByTime(st, this._tasks);
	this._scheduleNextRun(st);
	return st;
};

Scheduler.prototype.cancel = function(task) {
	task.active = false;
	var i = findIndex(task, this._tasks);

	if(i >= 0) {
		this._tasks.splice(i, 1);
		this._reschedule();
	}
};

Scheduler.prototype.cancelAll = function(f) {
	this._tasks = base.removeAll(f, this._tasks);
	this._reschedule();
};

Scheduler.prototype._reschedule = function() {
	if(this._tasks.length === 0) {
		this._unschedule();
	} else {
		this._scheduleNextRun(this.now());
	}
};

Scheduler.prototype._unschedule = function() {
	this._clearTimer(this._timer);
	this._timer = null;
};

Scheduler.prototype._runReadyTasks = function() {
	/*jshint maxcomplexity:6*/
	this._timer = null;

	var now = this.now();
	var tasks = this._tasks;
	var l = tasks.length;
	var toRun = [];

	var task, i;

	// Collect all active tasks with time <= now
	// TODO: Consider using findInsertion instead of linear scan
	for(i=0; i<l; ++i) {
		task = tasks[i];
		if(task.time > now) {
			break;
		}
		if(task.active) {
			toRun.push(task);
		}
	}

	this._tasks = base.drop(i, tasks);

	// Run all ready tasks
	for(i=0, l=toRun.length; i<l; ++i) {
		task = toRun[i];
		runTask(task);

		// Reschedule periodic repeating tasks
		// Check active again, since a task may have canceled itself
		if(task.period >= 0 && task.active) {
			task.time = task.time + task.period;
			insertByTime(task, this._tasks);
		}
	}

	this._scheduleNextRun(this.now());
};

Scheduler.prototype._scheduleNextRun = function(now) {
	if(this._tasks.length === 0) {
		return;
	}

	var nextArrival = this._tasks[0].time;

	if(this._timer === null) {
		this._schedulerNextArrival(nextArrival, now);
	} else if(nextArrival < this._nextArrival) {
		this._unschedule();
		this._schedulerNextArrival(nextArrival, now);
	}
};

Scheduler.prototype._schedulerNextArrival = function(nextArrival, now) {
	this._nextArrival = nextArrival;
	var delay = Math.max(0, nextArrival - now);
	this._timer = this._setTimer(this._runReadyTasksBound, delay);
};

function insertByTime(task, tasks) {
	tasks.splice(findInsertion(task, tasks), 0, task);
}

function findInsertion(task, tasks) {
	var i = binarySearch(task, tasks);
	var l = tasks.length;
	var t = task.time;

	while(i<l && t === tasks[i].time) {
		++i;
	}

	return i;
}

function binarySearch(x, sortedArray) {
	var lo = 0;
	var hi = sortedArray.length;
	var mid, y;

	while (lo < hi) {
		mid = Math.floor((lo + hi) / 2);
		y = sortedArray[mid];

		if (x.time === y.time) {
			return mid;
		} else if (x.time < y.time) {
			hi = mid;
		} else {
			lo = mid + 1;
		}
	}
	return hi;
}

},{"./../Promise":18,"./../base":21}],60:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Scheduler = require('./Scheduler');

module.exports = new Scheduler(defaultSetTimer, defaultClearTimer, Date.now);

// Default timer functions
function defaultSetTimer(f, ms) {
	return setTimeout(f, ms);
}

function defaultClearTimer(t) {
	return clearTimeout(t);
}


},{"./Scheduler":59}],61:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Sink = require('./Pipe');

module.exports = IndexSink;

IndexSink.hasValue = hasValue;
IndexSink.getValue = getValue;

function hasValue(indexSink) {
	return indexSink.hasValue;
}

function getValue(indexSink) {
	return indexSink.value;
}

function IndexSink(i, sink) {
	this.index = i;
	this.sink = sink;
	this.active = true;
	this.hasValue = false;
	this.value = void 0;
}

IndexSink.prototype.event = function(t, x) {
	if(!this.active) {
		return;
	}
	this.value = x;
	this.hasValue = true;
	this.sink.event(t, this);
};

IndexSink.prototype.end = function(t, x) {
	if(!this.active) {
		return;
	}
	this.active = false;
	this.sink.end(t, { index: this.index, value: x });
};

IndexSink.prototype.error = Sink.prototype.error;

},{"./Pipe":63}],62:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = Observer;

/**
 * Sink that accepts functions to apply to each event, and to end, and error
 * signals.
 * @param {function(x:*):void} event function to be applied to each event
 * @param {function(x:*):void} end function to apply to end signal value.
 * @param {function(e:Error|*):void} error function to apply to error signal value.
 * @constructor
 */
function Observer(event, end, error) {
	this._event = event;
	this._end = end;
	this._error = error;
	this.active = true;
}

Observer.prototype.event = function(t, x) {
	if (!this.active) {
		return;
	}
	this._event(x);
};

Observer.prototype.end = function(t, x) {
	if (!this.active) {
		return;
	}
	this.active = false;
	this._end(x);
};

Observer.prototype.error = function(t, e) {
	this.active = false;
	this._error(e);
};

},{}],63:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = Pipe;

/**
 * A sink mixin that simply forwards event, end, and error to
 * another sink.
 * @param sink
 * @constructor
 */
function Pipe(sink) {
	this.sink = sink;
}

Pipe.prototype.event = function(t, x) {
	return this.sink.event(t, x);
};

Pipe.prototype.end = function(t, x) {
	return this.sink.end(t, x);
};

Pipe.prototype.error = function(t, e) {
	return this.sink.error(t, e);
};

},{}],64:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var base = require('../base');
var resolve = require('../Promise').resolve;
var Disposable = require('../disposable/Disposable');

module.exports = AsyncSource;

function AsyncSource(source) {
	this.source = source;
}

AsyncSource.prototype.run = function(sink, scheduler) {
	var task = new StartAsyncTask(this.source, sink, scheduler);
	var disposable = scheduler.asap(task);

	return new Disposable(asyncDispose, disposable);
};

function asyncDispose(disposable) {
	return resolve(disposable).then(dispose);
}

function dispose(disposable) {
	if(disposable === void 0) {
		return;
	}
	return disposable.dispose();
}

function StartAsyncTask(source, sink, scheduler) {
	this.source = source;
	this.sink = sink;
	this.scheduler = scheduler;
}

StartAsyncTask.prototype.run = function() {
	return this.source.run(this.sink, this.scheduler);
};

StartAsyncTask.prototype.error = function(t, e) {
	this.sink.error(t, e);
};

StartAsyncTask.prototype.dispose = base.noop;
},{"../Promise":18,"../base":21,"../disposable/Disposable":49}],65:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var base = require('../base');
var resolve = require('../Promise').resolve;

module.exports = MulticastSource;

function MulticastSource(source) {
	this.source = source;
	this.sink = new MulticastSink();
	this._disposable = void 0;
}

MulticastSource.prototype.run = function(sink, scheduler) {
	var n = this.sink.add(sink);
	if(n === 1) {
		this._disposable = this.source.run(this.sink, scheduler);
	}

	return new MulticastDisposable(this, sink);
};

MulticastSource.prototype._dispose = function() {
	return resolve(this._disposable).then(dispose);
};

function dispose(disposable) {
	if(disposable === void 0) {
		return;
	}
	return disposable.dispose();
}

function MulticastDisposable(source, sink) {
	this.source = source;
	this.sink = sink;
}

MulticastDisposable.prototype.dispose = function() {
	var s = this.source;
	var remaining = s.sink.remove(this.sink);
	return remaining === 0 && s._dispose();
};

function MulticastSink() {
	this.sinks = [];
}

MulticastSink.prototype.add = function(sink) {
	this.sinks = base.append(sink, this.sinks);
	return this.sinks.length;
};

MulticastSink.prototype.remove = function(sink) {
	this.sinks = base.remove(base.findIndex(sink, this.sinks), this.sinks);
	return this.sinks.length;
};

MulticastSink.prototype.event = function(t, x) {
	var s = this.sinks;
	for(var i=0; i<s.length; ++i) {
		s[i].event(t, x);
	}
};

MulticastSink.prototype.end = function(t, x) {
	var s = this.sinks;
	for(var i=0; i<s.length; ++i) {
		s[i].end(t, x);
	}
};

MulticastSink.prototype.error = function(t, e) {
	var s = this.sinks;
	for (var i=0; i<s.length; ++i) {
		s[i].error(t, e);
	}
};
},{"../Promise":18,"../base":21}],66:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var PropagateTask = require('../scheduler/PropagateTask');

module.exports = ValueSource;

function ValueSource(emit, x) {
	this.emit = emit;
	this.value = x;
}

ValueSource.prototype.run = function(sink, scheduler) {
	return new ValueProducer(this.emit, this.value, sink, scheduler);
};

function ValueProducer(emit, x, sink, scheduler) {
	this.task = new PropagateTask(emit, x, sink);
	scheduler.asap(this.task);
}

ValueProducer.prototype.dispose = function() {
	return this.task.dispose();
};

},{"../scheduler/PropagateTask":58}],67:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var ValueSource = require('../source/ValueSource');
var Disposable = require('../disposable/Disposable');
var EmptyDisposable = require('../disposable/EmptyDisposable');
var PropagateTask = require('../scheduler/PropagateTask');

exports.of = streamOf;
exports.empty = empty;
exports.never = never;

/**
 * Stream containing only x
 * @param {*} x
 * @returns {Stream}
 */
function streamOf(x) {
	return new Stream(new ValueSource(emit, x));
}

function emit(t, x, sink) {
	sink.event(0, x);
	sink.end(0, void 0);
}

/**
 * Stream containing no events and ends immediately
 * @returns {Stream}
 */
function empty() {
	return EMPTY;
}

function EmptySource() {}

EmptySource.prototype.run = function(sink, scheduler) {
	var task = PropagateTask.end(void 0, sink);
	scheduler.asap(task);

	return new Disposable(dispose, task);
};

function dispose(task) {
	return task.dispose();
}

var EMPTY = new Stream(new EmptySource());

/**
 * Stream containing no events and never ends
 * @returns {Stream}
 */
function never() {
	return NEVER;
}

function NeverSource() {}

NeverSource.prototype.run = function() {
	return new EmptyDisposable();
};

var NEVER = new Stream(new NeverSource());

},{"../Stream":20,"../disposable/Disposable":49,"../disposable/EmptyDisposable":50,"../scheduler/PropagateTask":58,"../source/ValueSource":66}],68:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var MulticastSource = require('./MulticastSource');
var AsyncSource = require('./AsyncSource');

exports.create = create;

function create(run) {
	return new Stream(new MulticastSource(new AsyncSource(new SubscriberSource(run))));
}

function SubscriberSource(subscribe) {
	this._subscribe = subscribe;
}

SubscriberSource.prototype.run = function(sink, scheduler) {
	return new Subscription(sink, scheduler, this._subscribe);
};

function Subscription(sink, scheduler, subscribe) {
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;

	var s = this;

	this._unsubscribe = subscribe(add, end, error);

	function add(x) {
		s._add(x);
	}
	function end(x) {
		s._end(x);
	}
	function error(e) {
		s._error(e);
	}
}

Subscription.prototype._add = function(x) {
	if(!this.active) {
		return;
	}
	tryEvent(this.scheduler.now(), x, this.sink);
};

Subscription.prototype._end = function(x) {
	if(!this.active) {
		return;
	}
	this.active = false;
	tryEnd(this.scheduler.now(), x, this.sink);
};

Subscription.prototype._error = function(x) {
	this.active = false;
	this.sink.error(this.scheduler.now(), x);
};

Subscription.prototype.dispose = function() {
	this.active = false;
	if(typeof this._unsubscribe === 'function') {
		return this._unsubscribe();
	}
};

function tryEvent(t, x, sink) {
	try {
		sink.event(t, x);
	} catch(e) {
		sink.error(t, e);
	}
}

function tryEnd(t, x, sink) {
	try {
		sink.end(t, x);
	} catch(e) {
		sink.error(t, e);
	}
}
},{"../Stream":20,"./AsyncSource":64,"./MulticastSource":65}],69:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var fromArray = require('./fromArray').fromArray;
var isIterable = require('../iterable').isIterable;
var fromIterable = require('./fromIterable').fromIterable;

exports.from = from;

function from(a) {
	if(Array.isArray(a)) {
		return fromArray(a);
	}

	if(isIterable(a)) {
		return fromIterable(a);
	}

	throw new TypeError('not iterable: ' + a);
}
},{"../iterable":56,"./fromArray":70,"./fromIterable":72}],70:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var PropagateTask = require('../scheduler/PropagateTask');

exports.fromArray = fromArray;

function fromArray (a) {
	return new Stream(new ArraySource(a));
}

function ArraySource(a) {
	this.array = a;
}

ArraySource.prototype.run = function(sink, scheduler) {
	return new ArrayProducer(this.array, sink, scheduler);
};

function ArrayProducer(array, sink, scheduler) {
	this.scheduler = scheduler;
	this.task = new PropagateTask(runProducer, array, sink);
	scheduler.asap(this.task);
}

ArrayProducer.prototype.dispose = function() {
	return this.task.dispose();
};

function runProducer(t, array, sink) {
	return produce(this, array, sink, 0);
}

function produce(task, array, sink, k) {
	for(var i=k, l=array.length; i<l && task.active; ++i) {
		sink.event(0, array[i]);
	}

	return end();

	function end() {
		return task.active && sink.end(0);
	}
}

},{"../Stream":20,"../scheduler/PropagateTask":58}],71:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var MulticastSource = require('./MulticastSource');
var PropagateTask = require('../scheduler/PropagateTask');
var base = require('../base');

exports.fromEvent = fromEvent;

/**
 * Create a stream from an EventTarget, such as a DOM Node, or EventEmitter.
 * @param {String} event event type name, e.g. 'click'
 * @param {EventTarget|EventEmitter} source EventTarget or EventEmitter
 * @returns {Stream} stream containing all events of the specified type
 * from the source.
 */
function fromEvent(event, source) {
	var s;
	if(typeof source.addEventListener === 'function') {
		s = new MulticastSource(new EventSource(event, source));
	} else if(typeof source.addListener === 'function') {
		s = new EventEmitterSource(event, source);
	} else {
		throw new Error('source must support addEventListener or addListener');
	}

	return new Stream(s);
}

function EventSource(event, source) {
	this.event = event;
	this.source = source;
}

EventSource.prototype.run = function(sink, scheduler) {
	return new EventAdapter(this.event, this.source, sink, scheduler);
};

function EventAdapter(event, source, sink, scheduler) {
	this.event = event;
	this.source = source;
	this.sink = sink;

	var self = this;
	function addEvent(ev) {
		tryEvent(scheduler.now(), ev, self.sink);
	}

	this._addEvent = this._init(addEvent, event, source);
}

EventAdapter.prototype._init = function(addEvent, event, source) {
	source.addEventListener(event, addEvent, false);
	return addEvent;
};

EventAdapter.prototype.dispose = function() {
	if (typeof this.source.removeEventListener !== 'function') {
		throw new Error('source must support removeEventListener or removeListener');
	}

	this.source.removeEventListener(this.event, this._addEvent, false);
};

function EventEmitterSource(event, source) {
	this.event = event;
	this.source = source;
}

EventEmitterSource.prototype.run = function(sink, scheduler) {
	return new EventEmitterAdapter(this.event, this.source, sink, scheduler);
};

function EventEmitterAdapter(event, source, sink, scheduler) {
	this.event = event;
	this.source = source;
	this.sink = sink;

	var self = this;
	function addEvent(ev) {
		// NOTE: Because EventEmitter allows events in the same call stack as
		// a listener is added, use the scheduler to buffer all events
		// until the stack clears, then propagate.
		scheduler.asap(new PropagateTask(tryEvent, ev, self.sink));
	}

	this._addEvent = this._init(addEvent, event, source);
}

EventEmitterAdapter.prototype._init = function(addEvent, event, source) {
	var doAddEvent = addEvent;

	// EventEmitter supports varargs (eg: emitter.emit('event', a, b, c, ...)) so
	// have to support it here by turning into an array
	doAddEvent = function addVarargs(a) {
		return arguments.length > 1 ? addEvent(base.copy(arguments)) : addEvent(a);
	};

	source.addListener(event, doAddEvent);

	return doAddEvent;
};

EventEmitterAdapter.prototype.dispose = function() {
	if (typeof this.source.removeListener !== 'function') {
		throw new Error('source must support removeEventListener or removeListener');
	}

	this.source.removeListener(this.event, this._addEvent);
};

function tryEvent (t, x, sink) {
	try {
		sink.event(t, x);
	} catch(e) {
		sink.error(t, e);
	}
}
},{"../Stream":20,"../base":21,"../scheduler/PropagateTask":58,"./MulticastSource":65}],72:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var getIterator = require('../iterable').getIterator;
var PropagateTask = require('../scheduler/PropagateTask');

exports.fromIterable = fromIterable;

function fromIterable(iterable) {
	return new Stream(new IterableSource(iterable));
}

function IterableSource(iterable) {
	this.iterable = iterable;
}

IterableSource.prototype.run = function(sink, scheduler) {
	return new IteratorProducer(getIterator(this.iterable), sink, scheduler);
};

function IteratorProducer(iterator, sink, scheduler) {
	this.scheduler = scheduler;
	this.iterator = iterator;
	this.task = new PropagateTask(runProducer, this, sink);
	scheduler.asap(this.task);
}

IteratorProducer.prototype.dispose = function() {
	return this.task.dispose();
};

function runProducer(t, producer, sink) {
	var x = producer.iterator.next();
	if(x.done) {
		sink.end(t, x.value);
	} else {
		sink.event(t, x.value);
	}

	producer.scheduler.asap(producer.task);
}

},{"../Stream":20,"../iterable":56,"../scheduler/PropagateTask":58}],73:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Promise = require('../Promise');
var base = require('../base');

exports.generate = generate;

/**
 * Compute a stream using an *async* generator, which yields promises
 * to control event times.
 * @param f
 * @returns {Stream}
 */
function generate(f /*, ...args */) {
	return new Stream(new GenerateSource(f, base.tail(arguments)));
}

function GenerateSource(f, args) {
	this.f = f;
	this.args = args;
}

GenerateSource.prototype.run = function(sink, scheduler) {
	return new Generate(this.f.apply(void 0, this.args), sink, scheduler);
};

function Generate(iterator, sink, scheduler) {
	this.iterator = iterator;
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;

	var self = this;
	function err(e) {
		self.sink.error(self.scheduler.now(), e);
	}

	Promise.resolve(this).then(next).catch(err);
}

function next(generate, x) {
	return generate.active ? handle(generate, generate.iterator.next(x)) : x;
}

function handle(generate, result) {
	if (result.done) {
		return generate.sink.end(generate.scheduler.now(), result.value);
	}

	return Promise.resolve(result.value).then(function (x) {
		return emit(generate, x);
	}, function(e) {
		return error(generate, e);
	});
}

function emit(generate, x) {
	generate.sink.event(generate.scheduler.now(), x);
	return next(generate, x);
}

function error(generate, e) {
	return handle(generate, generate.iterator.throw(e));
}

Generate.prototype.dispose = function() {
	this.active = false;
};
},{"../Promise":18,"../Stream":20,"../base":21}],74:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Promise = require('../Promise');

exports.iterate = iterate;

/**
 * Compute a stream by iteratively calling f to produce values
 * Event times may be controlled by returning a Promise from f
 * @param {function(x:*):*|Promise<*>} f
 * @param {*} x initial value
 * @returns {Stream}
 */
function iterate(f, x) {
	return new Stream(new IterateSource(f, x));
}

function IterateSource(f, x) {
	this.f = f;
	this.value = x;
}

IterateSource.prototype.run = function(sink, scheduler) {
	return new Iterate(this.f, this.value, sink, scheduler);
};

function Iterate(f, initial, sink, scheduler) {
	this.f = f;
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;

	var x = initial;

	var self = this;
	function err(e) {
		self.sink.error(self.scheduler.now(), e);
	}

	function start(iterate) {
		return stepIterate(iterate, x);
	}

	Promise.resolve(this).then(start).catch(err);
}

Iterate.prototype.dispose = function() {
	this.active = false;
};

function stepIterate(iterate, x) {
	iterate.sink.event(iterate.scheduler.now(), x);

	if(!iterate.active) {
		return x;
	}

	var f = iterate.f;
	return Promise.resolve(f(x)).then(function(y) {
		return continueIterate(iterate, y);
	});
}

function continueIterate(iterate, x) {
	return !iterate.active ? iterate.value : stepIterate(iterate, x);
}

},{"../Promise":18,"../Stream":20}],75:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Disposable = require('../disposable/Disposable');
var MulticastSource = require('./MulticastSource');
var PropagateTask = require('../scheduler/PropagateTask');

exports.periodic = periodic;

/**
 * Create a stream that emits the current time periodically
 * @param {Number} period periodicity of events in millis
 * @param {*) value value to emit each period
 * @returns {Stream} new stream that emits the current time every period
 */
function periodic(period, value) {
	return new Stream(new MulticastSource(new Periodic(period, value)));
}

function Periodic(period, value) {
	this.period = period;
	this.value = value;
}

Periodic.prototype.run = function(sink, scheduler) {
	var task = scheduler.periodic(this.period, new PropagateTask(emit, this.value, sink));
	return new Disposable(cancelTask, task);
};

function cancelTask(task) {
	task.cancel();
}

function emit(t, x, sink) {
	sink.event(t, x);
}

},{"../Stream":20,"../disposable/Disposable":49,"../scheduler/PropagateTask":58,"./MulticastSource":65}],76:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Promise = require('../Promise');

exports.unfold = unfold;

/**
 * Compute a stream by unfolding tuples of future values from a seed value
 * Event times may be controlled by returning a Promise from f
 * @param {function(seed:*):{value:*, seed:*, done:boolean}|Promise<{value:*, seed:*, done:boolean}>} f unfolding function accepts
 *  a seed and returns a new tuple with a value, new seed, and boolean done flag.
 *  If tuple.done is true, the stream will end.
 * @param {*} seed seed value
 * @returns {Stream} stream containing all value of all tuples produced by the
 *  unfolding function.
 */
function unfold(f, seed) {
	return new Stream(new UnfoldSource(f, seed));
}

function UnfoldSource(f, seed) {
	this.f = f;
	this.value = seed;
}

UnfoldSource.prototype.run = function(sink, scheduler) {
	return new Unfold(this.f, this.value, sink, scheduler);
};

function Unfold(f, x, sink, scheduler) {
	this.f = f;
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;

	var self = this;
	function err(e) {
		self.sink.error(self.scheduler.now(), e);
	}

	function start(unfold) {
		return stepUnfold(unfold, x);
	}

	Promise.resolve(this).then(start).catch(err);
}

Unfold.prototype.dispose = function() {
	this.active = false;
};

function stepUnfold(unfold, x) {
	var f = unfold.f;
	return Promise.resolve(f(x)).then(function(tuple) {
		return continueUnfold(unfold, tuple);
	});
}

function continueUnfold(unfold, tuple) {
	if(tuple.done) {
		unfold.sink.end(unfold.scheduler.now(), tuple.value);
		return tuple.value;
	}

	unfold.sink.event(unfold.scheduler.now(), tuple.value);

	if(!unfold.active) {
		return tuple.value;
	}
	return stepUnfold(unfold, tuple.seed);
}
},{"../Promise":18,"../Stream":20}],77:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2015 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('./lib/Stream');
var base = require('./lib/base');
var core = require('./lib/source/core');
var from = require('./lib/source/from').from;
var periodic = require('./lib/source/periodic').periodic;

/**
 * Core stream type
 * @type {Stream}
 */
exports.Stream = Stream;

// Add of and empty to constructor for fantasy-land compat
exports.of       = Stream.of    = core.of;
exports.empty    = Stream.empty = core.empty;
exports.never    = core.never;
exports.from     = from;
exports.periodic = periodic;

//-----------------------------------------------------------------------
// Creating

var create = require('./lib/source/create');

/**
 * Create a stream by imperatively pushing events.
 * @param {function(add:function(x), end:function(e)):function} run function
 *  that will receive 2 functions as arguments, the first to add new values to the
 *  stream and the second to end the stream. It may *return* a function that
 *  will be called once all consumers have stopped observing the stream.
 * @returns {Stream} stream containing all events added by run before end
 */
exports.create = create.create;

//-----------------------------------------------------------------------
// Adapting other sources

var events = require('./lib/source/fromEvent');

/**
 * Create a stream of events from the supplied EventTarget or EventEmitter
 * @param {String} event event name
 * @param {EventTarget|EventEmitter} source EventTarget or EventEmitter. The source
 *  must support either addEventListener/removeEventListener (w3c EventTarget:
 *  http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget),
 *  or addListener/removeListener (node EventEmitter: http://nodejs.org/api/events.html)
 * @returns {Stream} stream of events of the specified type from the source
 */
exports.fromEvent = events.fromEvent;

//-----------------------------------------------------------------------
// Lifting functions

var lift = require('./lib/combinator/lift').lift;

/**
 * Lift a function that accepts values and returns a value, and return a function
 * that accepts streams and returns a stream.
 * @type {function(f:function(...args):*):function(...streams):Stream<*>}
 */
exports.lift = lift;

//-----------------------------------------------------------------------
// Observing

var observe = require('./lib/combinator/observe');

exports.observe = observe.observe;
exports.forEach = observe.observe;
exports.drain   = observe.drain;

/**
 * Process all the events in the stream
 * @returns {Promise} promise that fulfills when the stream ends, or rejects
 *  if the stream fails with an unhandled error.
 */
Stream.prototype.observe = Stream.prototype.forEach = function(f) {
	return observe.observe(f, this);
};

/**
 * Consume all events in the stream, without providing a function to process each.
 * This causes a stream to become active and begin emitting events, and is useful
 * in cases where all processing has been setup upstream via other combinators, and
 * there is no need to process the terminal events.
 * @returns {Promise} promise that fulfills when the stream ends, or rejects
 *  if the stream fails with an unhandled error.
 */
Stream.prototype.drain = function() {
	return observe.drain(this);
};

//-------------------------------------------------------

var loop = require('./lib/combinator/loop').loop;

exports.loop = loop;

/**
 * Generalized feedback loop. Call a stepper function for each event. The stepper
 * will be called with 2 params: the current seed and the an event value.  It must
 * return a new { seed, value } pair. The `seed` will be fed back into the next
 * invocation of stepper, and the `value` will be propagated as the event value.
 * @param {function(seed:*, value:*):{seed:*, value:*}} stepper loop step function
 * @param {*} seed initial seed value passed to first stepper call
 * @returns {Stream} new stream whose values are the `value` field of the objects
 * returned by the stepper
 */
Stream.prototype.loop = function(stepper, seed) {
	return loop(stepper, seed, this);
};

//-------------------------------------------------------

var accumulate = require('./lib/combinator/accumulate');

exports.scan   = accumulate.scan;
exports.reduce = accumulate.reduce;

/**
 * Create a stream containing successive reduce results of applying f to
 * the previous reduce result and the current stream item.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @returns {Stream} new stream containing successive reduce results
 */
Stream.prototype.scan = function(f, initial) {
	return accumulate.scan(f, initial, this);
};

/**
 * Reduce the stream to produce a single result.  Note that reducing an infinite
 * stream will return a Promise that never fulfills, but that may reject if an error
 * occurs.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial optional initial value
 * @returns {Promise} promise for the file result of the reduce
 */
Stream.prototype.reduce = function(f, initial) {
	return accumulate.reduce(f, initial, this);
};

//-----------------------------------------------------------------------
// Building and extending

var unfold = require('./lib/source/unfold');
var iterate = require('./lib/source/iterate');
var generate = require('./lib/source/generate');
var build = require('./lib/combinator/build');

exports.unfold    = unfold.unfold;
exports.iterate   = iterate.iterate;
exports.generate  = generate.generate;
exports.concat    = build.cycle;
exports.concat    = build.concat;
exports.startWith = build.cons;

/**
 * Tie this stream into a circle, thus creating an infinite stream
 * @returns {Stream} new infinite stream
 */
Stream.prototype.cycle = function() {
	return build.cycle(this);
};

/**
 * @param {Stream} tail
 * @returns {Stream} new stream containing all items in this followed by
 *  all items in tail
 */
Stream.prototype.concat = function(tail) {
	return build.concat(this, tail);
};

/**
 * @param {*} x value to prepend
 * @returns {Stream} a new stream with x prepended
 */
Stream.prototype.startWith = function(x) {
	return build.cons(x, this);
};

//-----------------------------------------------------------------------
// Transforming

var transform = require('./lib/combinator/transform');
var applicative = require('./lib/combinator/applicative');

exports.map      = transform.map;
exports.constant = transform.constant;
exports.tap      = transform.tap;
exports.ap       = applicative.ap;

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @returns {Stream} stream containing items transformed by f
 */
Stream.prototype.map = function(f) {
	return transform.map(f, this);
};

/**
 * Assume this stream contains functions, and apply each function to each item
 * in the provided stream.  This generates, in effect, a cross product.
 * @param {Stream} xs stream of items to which
 * @returns {Stream} stream containing the cross product of items
 */
Stream.prototype.ap = function(xs) {
	return applicative.ap(this, xs);
};

/**
 * Replace each value in the stream with x
 * @param {*} x
 * @returns {Stream} stream containing items replaced with x
 */
Stream.prototype.constant = function(x) {
	return transform.constant(x, this);
};

/**
 * Perform a side effect for each item in the stream
 * @param {function(x:*):*} f side effect to execute for each item. The
 *  return value will be discarded.
 * @returns {Stream} new stream containing the same items as this stream
 */
Stream.prototype.tap = function(f) {
	return transform.tap(f, this);
};

//-----------------------------------------------------------------------
// Transducer support

var transduce = require('./lib/combinator/transduce');

exports.transduce = transduce.transduce;

/**
 * Transform this stream by passing its events through a transducer.
 * @param  {function} transducer transducer function
 * @return {Stream} stream of events transformed by the transducer
 */
Stream.prototype.transduce = function(transducer) {
	return transduce.transduce(transducer, this);
};

//-----------------------------------------------------------------------
// FlatMapping

var flatMap = require('./lib/combinator/flatMap');

exports.flatMap = exports.chain = flatMap.flatMap;
exports.join    = flatMap.join;

/**
 * Map each value in the stream to a new stream, and merge it into the
 * returned outer stream. Event arrival times are preserved.
 * @param {function(x:*):Stream} f chaining function, must return a Stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
Stream.prototype.flatMap = Stream.prototype.chain = function(f) {
	return flatMap.flatMap(f, this);
};

/**
 * Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer. Event arrival times are preserved.
 * @returns {Stream<X>} new stream containing all events of all inner streams
 */
Stream.prototype.join = function() {
	return flatMap.join(this);
};

var flatMapEnd = require('./lib/combinator/flatMapEnd').flatMapEnd;

exports.flatMapEnd = flatMapEnd;

/**
 * Map the end event to a new stream, and begin emitting its values.
 * @param {function(x:*):Stream} f function that receives the end event value,
 * and *must* return a new Stream to continue with.
 * @returns {Stream} new stream that emits all events from the original stream,
 * followed by all events from the stream returned by f.
 */
Stream.prototype.flatMapEnd = function(f) {
	return flatMapEnd(f, this);
};

var concatMap = require('./lib/combinator/concatMap').concatMap;

exports.concatMap = concatMap;

Stream.prototype.concatMap = function(f) {
	return concatMap(f, this);
};

//-----------------------------------------------------------------------
// Merging

var merge = require('./lib/combinator/merge');

exports.merge = merge.merge;

/**
 * Merge this stream and all the provided streams
 * @returns {Stream} stream containing items from this stream and s in time
 * order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
Stream.prototype.merge = function(/*...streams*/) {
	return merge.mergeArray(base.cons(this, arguments));
};

//-----------------------------------------------------------------------
// Combining

var combine = require('./lib/combinator/combine');

exports.combine = combine.combine;

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
Stream.prototype.combine = function(f /*, ...streams*/) {
	return combine.combineArray(f, base.replace(this, 0, arguments));
};

//-----------------------------------------------------------------------
// Sampling

var sample = require('./lib/combinator/sample');

exports.sample = sample.sample;
exports.sampleWith = sample.sampleWith;

/**
 * When an event arrives on sampler, emit the latest event value from stream.
 * @param {Stream} sampler stream of events at whose arrival time
 *  signal's latest value will be propagated
 * @returns {Stream} sampled stream of values
 */
Stream.prototype.sampleWith = function(sampler) {
	return sample.sampleWith(sampler, this);
};

/**
 * When an event arrives on this stream, emit the result of calling f with the latest
 * values of all streams being sampled
 * @param {function(...values):*} f function to apply to each set of sampled values
 * @returns {Stream} stream of sampled and transformed values
 */
Stream.prototype.sample = function(f /* ...streams */) {
	return sample.sampleArray(f, this, base.tail(arguments));
};

//-----------------------------------------------------------------------
// Zipping

var zip = require('./lib/combinator/zip');

exports.zip = zip.zip;

/**
 * Pair-wise combine items with those in s. Given 2 streams:
 * [1,2,3] zipWith f [4,5,6] -> [f(1,4),f(2,5),f(3,6)]
 * Note: zip causes fast streams to buffer and wait for slow streams.
 * @param {function(a:Stream, b:Stream, ...):*} f function to combine items
 * @returns {Stream} new stream containing pairs
 */
Stream.prototype.zip = function(f /*, ...streams*/) {
	return zip.zipArray(f, base.replace(this, 0, arguments));
};

//-----------------------------------------------------------------------
// Switching

var switchLatest = require('./lib/combinator/switch').switch;

exports.switch       = switchLatest;
exports.switchLatest = switchLatest;

/**
 * Given a stream of streams, return a new stream that adopts the behavior
 * of the most recent inner stream.
 * @returns {Stream} switching stream
 */
Stream.prototype.switch = Stream.prototype.switchLatest = function() {
	return switchLatest(this);
};

//-----------------------------------------------------------------------
// Filtering

var filter = require('./lib/combinator/filter');

exports.filter          = filter.filter;
exports.skipRepeats     = exports.distinct   = filter.skipRepeats;
exports.skipRepeatsWith = exports.distinctBy = filter.skipRepeatsWith;

/**
 * Retain only items matching a predicate
 * stream:                           -12345678-
 * filter(x => x % 2 === 0, stream): --2-4-6-8-
 * @param {function(x:*):boolean} p filtering predicate called for each item
 * @returns {Stream} stream containing only items for which predicate returns truthy
 */
Stream.prototype.filter = function(p) {
	return filter.filter(p, this);
};

/**
 * Skip repeated events, using === to compare items
 * stream:           -abbcd-
 * distinct(stream): -ab-cd-
 * @returns {Stream} stream with no repeated events
 */
Stream.prototype.skipRepeats = function() {
	return filter.skipRepeats(this);
};

/**
 * Skip repeated events, using supplied equals function to compare items
 * @param {function(a:*, b:*):boolean} equals function to compare items
 * @returns {Stream} stream with no repeated events
 */
Stream.prototype.skipRepeatsWith = function(equals) {
	return filter.skipRepeatsWith(equals, this);
};

//-----------------------------------------------------------------------
// Slicing

var slice = require('./lib/combinator/slice');

exports.take      = slice.take;
exports.skip      = slice.skip;
exports.slice     = slice.slice;
exports.takeWhile = slice.takeWhile;
exports.skipWhile = slice.skipWhile;

/**
 * stream:          -abcd-
 * take(2, stream): -ab|
 * @param {Number} n take up to this many events
 * @returns {Stream} stream containing at most the first n items from this stream
 */
Stream.prototype.take = function(n) {
	return slice.take(n, this);
};

/**
 * stream:          -abcd->
 * skip(2, stream): ---cd->
 * @param {Number} n skip this many events
 * @returns {Stream} stream not containing the first n events
 */
Stream.prototype.skip = function(n) {
	return slice.skip(n, this);
};

/**
 * Slice a stream by event index. Equivalent to, but more efficient than
 * stream.take(end).skip(start);
 * NOTE: Negative start and end are not supported
 * @param {Number} start skip all events before the start index
 * @param {Number} end allow all events from the start index to the end index
 * @returns {Stream} stream containing items where start <= index < end
 */
Stream.prototype.slice = function(start, end) {
	return slice.slice(start, end, this);
};

/**
 * stream:                        -123451234->
 * takeWhile(x => x < 5, stream): -1234|
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items up to, but not including, the
 * first item for which p returns falsy.
 */
Stream.prototype.takeWhile = function(p) {
	return slice.takeWhile(p, this);
};

/**
 * stream:                        -123451234->
 * skipWhile(x => x < 5, stream): -----51234->
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items following *and including* the
 * first item for which p returns falsy.
 */
Stream.prototype.skipWhile = function(p) {
	return slice.skipWhile(p, this);
};

//-----------------------------------------------------------------------
// Time slicing

var timeslice = require('./lib/combinator/timeslice');

exports.until  = exports.takeUntil = timeslice.takeUntil;
exports.since  = exports.skipUntil = timeslice.skipUntil;
exports.during = timeslice.during; // EXPERIMENTAL

/**
 * stream:                    -a-b-c-d-e-f-g->
 * signal:                    -------x
 * takeUntil(signal, stream): -a-b-c-|
 * @param {Stream} signal retain only events in stream before the first
 * event in signal
 * @returns {Stream} new stream containing only events that occur before
 * the first event in signal.
 */
Stream.prototype.until = Stream.prototype.takeUntil = function(signal) {
	return timeslice.takeUntil(signal, this);
};

/**
 * stream:                    -a-b-c-d-e-f-g->
 * signal:                    -------x
 * takeUntil(signal, stream): -------d-e-f-g->
 * @param {Stream} signal retain only events in stream at or after the first
 * event in signal
 * @returns {Stream} new stream containing only events that occur after
 * the first event in signal.
 */
Stream.prototype.since = Stream.prototype.skipUntil = function(signal) {
	return timeslice.skipUntil(signal, this);
};

/**
 * stream:                    -a-b-c-d-e-f-g->
 * timeWindow:                -----s
 * s:                               -----t
 * stream.during(timeWindow): -----c-d-e-|
 * @param {Stream<Stream>} timeWindow a stream whose first event (s) represents
 *  the window start time.  That event (s) is itself a stream whose first event (t)
 *  represents the window end time
 * @returns {Stream} new stream containing only events within the provided timespan
 */
Stream.prototype.during = function(timeWindow) {
	return timeslice.during(timeWindow, this);
};

//-----------------------------------------------------------------------
// Delaying

var delay = require('./lib/combinator/delay').delay;

exports.delay = delay;

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
Stream.prototype.delay = function(delayTime) {
	return delay(delayTime, this);
};

//-----------------------------------------------------------------------
// Getting event timestamp

var timestamp = require('./lib/combinator/timestamp').timestamp;

exports.timestamp = timestamp;

/**
 * Expose event timestamps into the stream. Turns a Stream<X> into
 * Stream<{time:t, value:X}>
 * @returns {Stream<{time:number, value:*}>}
 */
Stream.prototype.timestamp = function() {
	return timestamp(this);
};

//-----------------------------------------------------------------------
// Rate limiting

var limit = require('./lib/combinator/limit');

exports.throttle = limit.throttle;
exports.debounce = limit.debounce;

/**
 * Limit the rate of events
 * stream:              abcd----abcd----
 * throttle(2, stream): a-c-----a-c-----
 * @param {Number} period time to suppress events
 * @returns {Stream} new stream that skips events for throttle period
 */
Stream.prototype.throttle = function(period) {
	return limit.throttle(period, this);
};

/**
 * Wait for a burst of events to subside and emit only the last event in the burst
 * stream:              abcd----abcd----
 * debounce(2, stream): -----d-------d--
 * @param {Number} period events occuring more frequently than this
 *  on the provided scheduler will be suppressed
 * @returns {Stream} new debounced stream
 */
Stream.prototype.debounce = function(period) {
	return limit.debounce(period, this);
};

//-----------------------------------------------------------------------
// Awaiting Promises

var promises = require('./lib/combinator/promises');

exports.fromPromise = promises.fromPromise;
exports.await       = promises.await;

/**
 * Await promises, turning a Stream<Promise<X>> into Stream<X>.  Preserves
 * event order, but timeshifts events based on promise resolution time.
 * @returns {Stream<X>} stream containing non-promise values
 */
Stream.prototype.await = function() {
	return promises.await(this);
};

//-----------------------------------------------------------------------
// Error handling

var errors = require('./lib/combinator/errors');


exports.flatMapError = errors.flatMapError;
exports.throwError   = errors.throwError;

/**
 * If this stream encounters an error, recover and continue with items from stream
 * returned by f.
 * stream:                  -a-b-c-X-
 * f(X):                           d-e-f-g-
 * flatMapError(f, stream): -a-b-c-d-e-f-g-
 * @param {function(error:*):Stream} f function which returns a new stream
 * @returns {Stream} new stream which will recover from an error by calling f
 */
Stream.prototype.flatMapError = function(f) {
	return errors.flatMapError(f, this);
};

},{"./lib/Stream":20,"./lib/base":21,"./lib/combinator/accumulate":22,"./lib/combinator/applicative":23,"./lib/combinator/build":24,"./lib/combinator/combine":25,"./lib/combinator/concatMap":26,"./lib/combinator/delay":27,"./lib/combinator/errors":28,"./lib/combinator/filter":29,"./lib/combinator/flatMap":30,"./lib/combinator/flatMapEnd":31,"./lib/combinator/lift":32,"./lib/combinator/limit":33,"./lib/combinator/loop":34,"./lib/combinator/merge":35,"./lib/combinator/observe":37,"./lib/combinator/promises":38,"./lib/combinator/sample":39,"./lib/combinator/slice":40,"./lib/combinator/switch":41,"./lib/combinator/timeslice":42,"./lib/combinator/timestamp":43,"./lib/combinator/transduce":44,"./lib/combinator/transform":45,"./lib/combinator/zip":46,"./lib/source/core":67,"./lib/source/create":68,"./lib/source/from":69,"./lib/source/fromEvent":71,"./lib/source/generate":73,"./lib/source/iterate":74,"./lib/source/periodic":75,"./lib/source/unfold":76}],78:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function (require) {

	var makePromise = require('./makePromise');
	var Scheduler = require('./Scheduler');
	var async = require('./env').asap;

	return makePromise({
		scheduler: new Scheduler(async)
	});

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });

},{"./Scheduler":79,"./env":81,"./makePromise":83}],79:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	// Credit to Twisol (https://github.com/Twisol) for suggesting
	// this type of extensible queue + trampoline approach for next-tick conflation.

	/**
	 * Async task scheduler
	 * @param {function} async function to schedule a single async function
	 * @constructor
	 */
	function Scheduler(async) {
		this._async = async;
		this._running = false;

		this._queue = this;
		this._queueLen = 0;
		this._afterQueue = {};
		this._afterQueueLen = 0;

		var self = this;
		this.drain = function() {
			self._drain();
		};
	}

	/**
	 * Enqueue a task
	 * @param {{ run:function }} task
	 */
	Scheduler.prototype.enqueue = function(task) {
		this._queue[this._queueLen++] = task;
		this.run();
	};

	/**
	 * Enqueue a task to run after the main task queue
	 * @param {{ run:function }} task
	 */
	Scheduler.prototype.afterQueue = function(task) {
		this._afterQueue[this._afterQueueLen++] = task;
		this.run();
	};

	Scheduler.prototype.run = function() {
		if (!this._running) {
			this._running = true;
			this._async(this.drain);
		}
	};

	/**
	 * Drain the handler queue entirely, and then the after queue
	 */
	Scheduler.prototype._drain = function() {
		var i = 0;
		for (; i < this._queueLen; ++i) {
			this._queue[i].run();
			this._queue[i] = void 0;
		}

		this._queueLen = 0;
		this._running = false;

		for (i = 0; i < this._afterQueueLen; ++i) {
			this._afterQueue[i].run();
			this._afterQueue[i] = void 0;
		}

		this._afterQueueLen = 0;
	};

	return Scheduler;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));

},{}],80:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	var setTimer = require('../env').setTimer;
	var format = require('../format');

	return function unhandledRejection(Promise) {

		var logError = noop;
		var logInfo = noop;
		var localConsole;

		if(typeof console !== 'undefined') {
			// Alias console to prevent things like uglify's drop_console option from
			// removing console.log/error. Unhandled rejections fall into the same
			// category as uncaught exceptions, and build tools shouldn't silence them.
			localConsole = console;
			logError = typeof localConsole.error !== 'undefined'
				? function (e) { localConsole.error(e); }
				: function (e) { localConsole.log(e); };

			logInfo = typeof localConsole.info !== 'undefined'
				? function (e) { localConsole.info(e); }
				: function (e) { localConsole.log(e); };
		}

		Promise.onPotentiallyUnhandledRejection = function(rejection) {
			enqueue(report, rejection);
		};

		Promise.onPotentiallyUnhandledRejectionHandled = function(rejection) {
			enqueue(unreport, rejection);
		};

		Promise.onFatalRejection = function(rejection) {
			enqueue(throwit, rejection.value);
		};

		var tasks = [];
		var reported = [];
		var running = null;

		function report(r) {
			if(!r.handled) {
				reported.push(r);
				logError('Potentially unhandled rejection [' + r.id + '] ' + format.formatError(r.value));
			}
		}

		function unreport(r) {
			var i = reported.indexOf(r);
			if(i >= 0) {
				reported.splice(i, 1);
				logInfo('Handled previous rejection [' + r.id + '] ' + format.formatObject(r.value));
			}
		}

		function enqueue(f, x) {
			tasks.push(f, x);
			if(running === null) {
				running = setTimer(flush, 0);
			}
		}

		function flush() {
			running = null;
			while(tasks.length > 0) {
				tasks.shift()(tasks.shift());
			}
		}

		return Promise;
	};

	function throwit(e) {
		throw e;
	}

	function noop() {}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

},{"../env":81,"../format":82}],81:[function(require,module,exports){
(function (process){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/*global process,document,setTimeout,clearTimeout,MutationObserver,WebKitMutationObserver*/
(function(define) { 'use strict';
define(function(require) {
	/*jshint maxcomplexity:6*/

	// Sniff "best" async scheduling option
	// Prefer process.nextTick or MutationObserver, then check for
	// setTimeout, and finally vertx, since its the only env that doesn't
	// have setTimeout

	var MutationObs;
	var capturedSetTimeout = typeof setTimeout !== 'undefined' && setTimeout;

	// Default env
	var setTimer = function(f, ms) { return setTimeout(f, ms); };
	var clearTimer = function(t) { return clearTimeout(t); };
	var asap = function (f) { return capturedSetTimeout(f, 0); };

	// Detect specific env
	if (isNode()) { // Node
		asap = function (f) { return process.nextTick(f); };

	} else if (MutationObs = hasMutationObserver()) { // Modern browser
		asap = initMutationObserver(MutationObs);

	} else if (!capturedSetTimeout) { // vert.x
		var vertxRequire = require;
		var vertx = vertxRequire('vertx');
		setTimer = function (f, ms) { return vertx.setTimer(ms, f); };
		clearTimer = vertx.cancelTimer;
		asap = vertx.runOnLoop || vertx.runOnContext;
	}

	return {
		setTimer: setTimer,
		clearTimer: clearTimer,
		asap: asap
	};

	function isNode () {
		return typeof process !== 'undefined' &&
			Object.prototype.toString.call(process) === '[object process]';
	}

	function hasMutationObserver () {
		return (typeof MutationObserver === 'function' && MutationObserver) ||
			(typeof WebKitMutationObserver === 'function' && WebKitMutationObserver);
	}

	function initMutationObserver(MutationObserver) {
		var scheduled;
		var node = document.createTextNode('');
		var o = new MutationObserver(run);
		o.observe(node, { characterData: true });

		function run() {
			var f = scheduled;
			scheduled = void 0;
			f();
		}

		var i = 0;
		return function (f) {
			scheduled = f;
			node.data = (i ^= 1);
		};
	}
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

}).call(this,require('_process'))

},{"_process":85}],82:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return {
		formatError: formatError,
		formatObject: formatObject,
		tryStringify: tryStringify
	};

	/**
	 * Format an error into a string.  If e is an Error and has a stack property,
	 * it's returned.  Otherwise, e is formatted using formatObject, with a
	 * warning added about e not being a proper Error.
	 * @param {*} e
	 * @returns {String} formatted string, suitable for output to developers
	 */
	function formatError(e) {
		var s = typeof e === 'object' && e !== null && e.stack ? e.stack : formatObject(e);
		return e instanceof Error ? s : s + ' (WARNING: non-Error used)';
	}

	/**
	 * Format an object, detecting "plain" objects and running them through
	 * JSON.stringify if possible.
	 * @param {Object} o
	 * @returns {string}
	 */
	function formatObject(o) {
		var s = String(o);
		if(s === '[object Object]' && typeof JSON !== 'undefined') {
			s = tryStringify(o, s);
		}
		return s;
	}

	/**
	 * Try to return the result of JSON.stringify(x).  If that fails, return
	 * defaultValue
	 * @param {*} x
	 * @param {*} defaultValue
	 * @returns {String|*} JSON.stringify(x) or defaultValue
	 */
	function tryStringify(x, defaultValue) {
		try {
			return JSON.stringify(x);
		} catch(e) {
			return defaultValue;
		}
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));

},{}],83:[function(require,module,exports){
(function (process){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function makePromise(environment) {

		var tasks = environment.scheduler;
		var emitRejection = initEmitRejection();

		var objectCreate = Object.create ||
			function(proto) {
				function Child() {}
				Child.prototype = proto;
				return new Child();
			};

		/**
		 * Create a promise whose fate is determined by resolver
		 * @constructor
		 * @returns {Promise} promise
		 * @name Promise
		 */
		function Promise(resolver, handler) {
			this._handler = resolver === Handler ? handler : init(resolver);
		}

		/**
		 * Run the supplied resolver
		 * @param resolver
		 * @returns {Pending}
		 */
		function init(resolver) {
			var handler = new Pending();

			try {
				resolver(promiseResolve, promiseReject, promiseNotify);
			} catch (e) {
				promiseReject(e);
			}

			return handler;

			/**
			 * Transition from pre-resolution state to post-resolution state, notifying
			 * all listeners of the ultimate fulfillment or rejection
			 * @param {*} x resolution value
			 */
			function promiseResolve (x) {
				handler.resolve(x);
			}
			/**
			 * Reject this promise with reason, which will be used verbatim
			 * @param {Error|*} reason rejection reason, strongly suggested
			 *   to be an Error type
			 */
			function promiseReject (reason) {
				handler.reject(reason);
			}

			/**
			 * @deprecated
			 * Issue a progress event, notifying all progress listeners
			 * @param {*} x progress event payload to pass to all listeners
			 */
			function promiseNotify (x) {
				handler.notify(x);
			}
		}

		// Creation

		Promise.resolve = resolve;
		Promise.reject = reject;
		Promise.never = never;

		Promise._defer = defer;
		Promise._handler = getHandler;

		/**
		 * Returns a trusted promise. If x is already a trusted promise, it is
		 * returned, otherwise returns a new trusted Promise which follows x.
		 * @param  {*} x
		 * @return {Promise} promise
		 */
		function resolve(x) {
			return isPromise(x) ? x
				: new Promise(Handler, new Async(getHandler(x)));
		}

		/**
		 * Return a reject promise with x as its reason (x is used verbatim)
		 * @param {*} x
		 * @returns {Promise} rejected promise
		 */
		function reject(x) {
			return new Promise(Handler, new Async(new Rejected(x)));
		}

		/**
		 * Return a promise that remains pending forever
		 * @returns {Promise} forever-pending promise.
		 */
		function never() {
			return foreverPendingPromise; // Should be frozen
		}

		/**
		 * Creates an internal {promise, resolver} pair
		 * @private
		 * @returns {Promise}
		 */
		function defer() {
			return new Promise(Handler, new Pending());
		}

		// Transformation and flow control

		/**
		 * Transform this promise's fulfillment value, returning a new Promise
		 * for the transformed result.  If the promise cannot be fulfilled, onRejected
		 * is called with the reason.  onProgress *may* be called with updates toward
		 * this promise's fulfillment.
		 * @param {function=} onFulfilled fulfillment handler
		 * @param {function=} onRejected rejection handler
		 * @param {function=} onProgress @deprecated progress handler
		 * @return {Promise} new promise
		 */
		Promise.prototype.then = function(onFulfilled, onRejected, onProgress) {
			var parent = this._handler;
			var state = parent.join().state();

			if ((typeof onFulfilled !== 'function' && state > 0) ||
				(typeof onRejected !== 'function' && state < 0)) {
				// Short circuit: value will not change, simply share handler
				return new this.constructor(Handler, parent);
			}

			var p = this._beget();
			var child = p._handler;

			parent.chain(child, parent.receiver, onFulfilled, onRejected, onProgress);

			return p;
		};

		/**
		 * If this promise cannot be fulfilled due to an error, call onRejected to
		 * handle the error. Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		Promise.prototype['catch'] = function(onRejected) {
			return this.then(void 0, onRejected);
		};

		/**
		 * Creates a new, pending promise of the same type as this promise
		 * @private
		 * @returns {Promise}
		 */
		Promise.prototype._beget = function() {
			return begetFrom(this._handler, this.constructor);
		};

		function begetFrom(parent, Promise) {
			var child = new Pending(parent.receiver, parent.join().context);
			return new Promise(Handler, child);
		}

		// Array combinators

		Promise.all = all;
		Promise.race = race;
		Promise._traverse = traverse;

		/**
		 * Return a promise that will fulfill when all promises in the
		 * input array have fulfilled, or will reject when one of the
		 * promises rejects.
		 * @param {array} promises array of promises
		 * @returns {Promise} promise for array of fulfillment values
		 */
		function all(promises) {
			return traverseWith(snd, null, promises);
		}

		/**
		 * Array<Promise<X>> -> Promise<Array<f(X)>>
		 * @private
		 * @param {function} f function to apply to each promise's value
		 * @param {Array} promises array of promises
		 * @returns {Promise} promise for transformed values
		 */
		function traverse(f, promises) {
			return traverseWith(tryCatch2, f, promises);
		}

		function traverseWith(tryMap, f, promises) {
			var handler = typeof f === 'function' ? mapAt : settleAt;

			var resolver = new Pending();
			var pending = promises.length >>> 0;
			var results = new Array(pending);

			for (var i = 0, x; i < promises.length && !resolver.resolved; ++i) {
				x = promises[i];

				if (x === void 0 && !(i in promises)) {
					--pending;
					continue;
				}

				traverseAt(promises, handler, i, x, resolver);
			}

			if(pending === 0) {
				resolver.become(new Fulfilled(results));
			}

			return new Promise(Handler, resolver);

			function mapAt(i, x, resolver) {
				if(!resolver.resolved) {
					traverseAt(promises, settleAt, i, tryMap(f, x, i), resolver);
				}
			}

			function settleAt(i, x, resolver) {
				results[i] = x;
				if(--pending === 0) {
					resolver.become(new Fulfilled(results));
				}
			}
		}

		function traverseAt(promises, handler, i, x, resolver) {
			if (maybeThenable(x)) {
				var h = getHandlerMaybeThenable(x);
				var s = h.state();

				if (s === 0) {
					h.fold(handler, i, void 0, resolver);
				} else if (s > 0) {
					handler(i, h.value, resolver);
				} else {
					resolver.become(h);
					visitRemaining(promises, i+1, h);
				}
			} else {
				handler(i, x, resolver);
			}
		}

		Promise._visitRemaining = visitRemaining;
		function visitRemaining(promises, start, handler) {
			for(var i=start; i<promises.length; ++i) {
				markAsHandled(getHandler(promises[i]), handler);
			}
		}

		function markAsHandled(h, handler) {
			if(h === handler) {
				return;
			}

			var s = h.state();
			if(s === 0) {
				h.visit(h, void 0, h._unreport);
			} else if(s < 0) {
				h._unreport();
			}
		}

		/**
		 * Fulfill-reject competitive race. Return a promise that will settle
		 * to the same state as the earliest input promise to settle.
		 *
		 * WARNING: The ES6 Promise spec requires that race()ing an empty array
		 * must return a promise that is pending forever.  This implementation
		 * returns a singleton forever-pending promise, the same singleton that is
		 * returned by Promise.never(), thus can be checked with ===
		 *
		 * @param {array} promises array of promises to race
		 * @returns {Promise} if input is non-empty, a promise that will settle
		 * to the same outcome as the earliest input promise to settle. if empty
		 * is empty, returns a promise that will never settle.
		 */
		function race(promises) {
			if(typeof promises !== 'object' || promises === null) {
				return reject(new TypeError('non-iterable passed to race()'));
			}

			// Sigh, race([]) is untestable unless we return *something*
			// that is recognizable without calling .then() on it.
			return promises.length === 0 ? never()
				 : promises.length === 1 ? resolve(promises[0])
				 : runRace(promises);
		}

		function runRace(promises) {
			var resolver = new Pending();
			var i, x, h;
			for(i=0; i<promises.length; ++i) {
				x = promises[i];
				if (x === void 0 && !(i in promises)) {
					continue;
				}

				h = getHandler(x);
				if(h.state() !== 0) {
					resolver.become(h);
					visitRemaining(promises, i+1, h);
					break;
				} else {
					h.visit(resolver, resolver.resolve, resolver.reject);
				}
			}
			return new Promise(Handler, resolver);
		}

		// Promise internals
		// Below this, everything is @private

		/**
		 * Get an appropriate handler for x, without checking for cycles
		 * @param {*} x
		 * @returns {object} handler
		 */
		function getHandler(x) {
			if(isPromise(x)) {
				return x._handler.join();
			}
			return maybeThenable(x) ? getHandlerUntrusted(x) : new Fulfilled(x);
		}

		/**
		 * Get a handler for thenable x.
		 * NOTE: You must only call this if maybeThenable(x) == true
		 * @param {object|function|Promise} x
		 * @returns {object} handler
		 */
		function getHandlerMaybeThenable(x) {
			return isPromise(x) ? x._handler.join() : getHandlerUntrusted(x);
		}

		/**
		 * Get a handler for potentially untrusted thenable x
		 * @param {*} x
		 * @returns {object} handler
		 */
		function getHandlerUntrusted(x) {
			try {
				var untrustedThen = x.then;
				return typeof untrustedThen === 'function'
					? new Thenable(untrustedThen, x)
					: new Fulfilled(x);
			} catch(e) {
				return new Rejected(e);
			}
		}

		/**
		 * Handler for a promise that is pending forever
		 * @constructor
		 */
		function Handler() {}

		Handler.prototype.when
			= Handler.prototype.become
			= Handler.prototype.notify // deprecated
			= Handler.prototype.fail
			= Handler.prototype._unreport
			= Handler.prototype._report
			= noop;

		Handler.prototype._state = 0;

		Handler.prototype.state = function() {
			return this._state;
		};

		/**
		 * Recursively collapse handler chain to find the handler
		 * nearest to the fully resolved value.
		 * @returns {object} handler nearest the fully resolved value
		 */
		Handler.prototype.join = function() {
			var h = this;
			while(h.handler !== void 0) {
				h = h.handler;
			}
			return h;
		};

		Handler.prototype.chain = function(to, receiver, fulfilled, rejected, progress) {
			this.when({
				resolver: to,
				receiver: receiver,
				fulfilled: fulfilled,
				rejected: rejected,
				progress: progress
			});
		};

		Handler.prototype.visit = function(receiver, fulfilled, rejected, progress) {
			this.chain(failIfRejected, receiver, fulfilled, rejected, progress);
		};

		Handler.prototype.fold = function(f, z, c, to) {
			this.when(new Fold(f, z, c, to));
		};

		/**
		 * Handler that invokes fail() on any handler it becomes
		 * @constructor
		 */
		function FailIfRejected() {}

		inherit(Handler, FailIfRejected);

		FailIfRejected.prototype.become = function(h) {
			h.fail();
		};

		var failIfRejected = new FailIfRejected();

		/**
		 * Handler that manages a queue of consumers waiting on a pending promise
		 * @constructor
		 */
		function Pending(receiver, inheritedContext) {
			Promise.createContext(this, inheritedContext);

			this.consumers = void 0;
			this.receiver = receiver;
			this.handler = void 0;
			this.resolved = false;
		}

		inherit(Handler, Pending);

		Pending.prototype._state = 0;

		Pending.prototype.resolve = function(x) {
			this.become(getHandler(x));
		};

		Pending.prototype.reject = function(x) {
			if(this.resolved) {
				return;
			}

			this.become(new Rejected(x));
		};

		Pending.prototype.join = function() {
			if (!this.resolved) {
				return this;
			}

			var h = this;

			while (h.handler !== void 0) {
				h = h.handler;
				if (h === this) {
					return this.handler = cycle();
				}
			}

			return h;
		};

		Pending.prototype.run = function() {
			var q = this.consumers;
			var handler = this.handler;
			this.handler = this.handler.join();
			this.consumers = void 0;

			for (var i = 0; i < q.length; ++i) {
				handler.when(q[i]);
			}
		};

		Pending.prototype.become = function(handler) {
			if(this.resolved) {
				return;
			}

			this.resolved = true;
			this.handler = handler;
			if(this.consumers !== void 0) {
				tasks.enqueue(this);
			}

			if(this.context !== void 0) {
				handler._report(this.context);
			}
		};

		Pending.prototype.when = function(continuation) {
			if(this.resolved) {
				tasks.enqueue(new ContinuationTask(continuation, this.handler));
			} else {
				if(this.consumers === void 0) {
					this.consumers = [continuation];
				} else {
					this.consumers.push(continuation);
				}
			}
		};

		/**
		 * @deprecated
		 */
		Pending.prototype.notify = function(x) {
			if(!this.resolved) {
				tasks.enqueue(new ProgressTask(x, this));
			}
		};

		Pending.prototype.fail = function(context) {
			var c = typeof context === 'undefined' ? this.context : context;
			this.resolved && this.handler.join().fail(c);
		};

		Pending.prototype._report = function(context) {
			this.resolved && this.handler.join()._report(context);
		};

		Pending.prototype._unreport = function() {
			this.resolved && this.handler.join()._unreport();
		};

		/**
		 * Wrap another handler and force it into a future stack
		 * @param {object} handler
		 * @constructor
		 */
		function Async(handler) {
			this.handler = handler;
		}

		inherit(Handler, Async);

		Async.prototype.when = function(continuation) {
			tasks.enqueue(new ContinuationTask(continuation, this));
		};

		Async.prototype._report = function(context) {
			this.join()._report(context);
		};

		Async.prototype._unreport = function() {
			this.join()._unreport();
		};

		/**
		 * Handler that wraps an untrusted thenable and assimilates it in a future stack
		 * @param {function} then
		 * @param {{then: function}} thenable
		 * @constructor
		 */
		function Thenable(then, thenable) {
			Pending.call(this);
			tasks.enqueue(new AssimilateTask(then, thenable, this));
		}

		inherit(Pending, Thenable);

		/**
		 * Handler for a fulfilled promise
		 * @param {*} x fulfillment value
		 * @constructor
		 */
		function Fulfilled(x) {
			Promise.createContext(this);
			this.value = x;
		}

		inherit(Handler, Fulfilled);

		Fulfilled.prototype._state = 1;

		Fulfilled.prototype.fold = function(f, z, c, to) {
			runContinuation3(f, z, this, c, to);
		};

		Fulfilled.prototype.when = function(cont) {
			runContinuation1(cont.fulfilled, this, cont.receiver, cont.resolver);
		};

		var errorId = 0;

		/**
		 * Handler for a rejected promise
		 * @param {*} x rejection reason
		 * @constructor
		 */
		function Rejected(x) {
			Promise.createContext(this);

			this.id = ++errorId;
			this.value = x;
			this.handled = false;
			this.reported = false;

			this._report();
		}

		inherit(Handler, Rejected);

		Rejected.prototype._state = -1;

		Rejected.prototype.fold = function(f, z, c, to) {
			to.become(this);
		};

		Rejected.prototype.when = function(cont) {
			if(typeof cont.rejected === 'function') {
				this._unreport();
			}
			runContinuation1(cont.rejected, this, cont.receiver, cont.resolver);
		};

		Rejected.prototype._report = function(context) {
			tasks.afterQueue(new ReportTask(this, context));
		};

		Rejected.prototype._unreport = function() {
			if(this.handled) {
				return;
			}
			this.handled = true;
			tasks.afterQueue(new UnreportTask(this));
		};

		Rejected.prototype.fail = function(context) {
			this.reported = true;
			emitRejection('unhandledRejection', this);
			Promise.onFatalRejection(this, context === void 0 ? this.context : context);
		};

		function ReportTask(rejection, context) {
			this.rejection = rejection;
			this.context = context;
		}

		ReportTask.prototype.run = function() {
			if(!this.rejection.handled && !this.rejection.reported) {
				this.rejection.reported = true;
				emitRejection('unhandledRejection', this.rejection) ||
					Promise.onPotentiallyUnhandledRejection(this.rejection, this.context);
			}
		};

		function UnreportTask(rejection) {
			this.rejection = rejection;
		}

		UnreportTask.prototype.run = function() {
			if(this.rejection.reported) {
				emitRejection('rejectionHandled', this.rejection) ||
					Promise.onPotentiallyUnhandledRejectionHandled(this.rejection);
			}
		};

		// Unhandled rejection hooks
		// By default, everything is a noop

		Promise.createContext
			= Promise.enterContext
			= Promise.exitContext
			= Promise.onPotentiallyUnhandledRejection
			= Promise.onPotentiallyUnhandledRejectionHandled
			= Promise.onFatalRejection
			= noop;

		// Errors and singletons

		var foreverPendingHandler = new Handler();
		var foreverPendingPromise = new Promise(Handler, foreverPendingHandler);

		function cycle() {
			return new Rejected(new TypeError('Promise cycle'));
		}

		// Task runners

		/**
		 * Run a single consumer
		 * @constructor
		 */
		function ContinuationTask(continuation, handler) {
			this.continuation = continuation;
			this.handler = handler;
		}

		ContinuationTask.prototype.run = function() {
			this.handler.join().when(this.continuation);
		};

		/**
		 * Run a queue of progress handlers
		 * @constructor
		 */
		function ProgressTask(value, handler) {
			this.handler = handler;
			this.value = value;
		}

		ProgressTask.prototype.run = function() {
			var q = this.handler.consumers;
			if(q === void 0) {
				return;
			}

			for (var c, i = 0; i < q.length; ++i) {
				c = q[i];
				runNotify(c.progress, this.value, this.handler, c.receiver, c.resolver);
			}
		};

		/**
		 * Assimilate a thenable, sending it's value to resolver
		 * @param {function} then
		 * @param {object|function} thenable
		 * @param {object} resolver
		 * @constructor
		 */
		function AssimilateTask(then, thenable, resolver) {
			this._then = then;
			this.thenable = thenable;
			this.resolver = resolver;
		}

		AssimilateTask.prototype.run = function() {
			var h = this.resolver;
			tryAssimilate(this._then, this.thenable, _resolve, _reject, _notify);

			function _resolve(x) { h.resolve(x); }
			function _reject(x)  { h.reject(x); }
			function _notify(x)  { h.notify(x); }
		};

		function tryAssimilate(then, thenable, resolve, reject, notify) {
			try {
				then.call(thenable, resolve, reject, notify);
			} catch (e) {
				reject(e);
			}
		}

		/**
		 * Fold a handler value with z
		 * @constructor
		 */
		function Fold(f, z, c, to) {
			this.f = f; this.z = z; this.c = c; this.to = to;
			this.resolver = failIfRejected;
			this.receiver = this;
		}

		Fold.prototype.fulfilled = function(x) {
			this.f.call(this.c, this.z, x, this.to);
		};

		Fold.prototype.rejected = function(x) {
			this.to.reject(x);
		};

		Fold.prototype.progress = function(x) {
			this.to.notify(x);
		};

		// Other helpers

		/**
		 * @param {*} x
		 * @returns {boolean} true iff x is a trusted Promise
		 */
		function isPromise(x) {
			return x instanceof Promise;
		}

		/**
		 * Test just enough to rule out primitives, in order to take faster
		 * paths in some code
		 * @param {*} x
		 * @returns {boolean} false iff x is guaranteed *not* to be a thenable
		 */
		function maybeThenable(x) {
			return (typeof x === 'object' || typeof x === 'function') && x !== null;
		}

		function runContinuation1(f, h, receiver, next) {
			if(typeof f !== 'function') {
				return next.become(h);
			}

			Promise.enterContext(h);
			tryCatchReject(f, h.value, receiver, next);
			Promise.exitContext();
		}

		function runContinuation3(f, x, h, receiver, next) {
			if(typeof f !== 'function') {
				return next.become(h);
			}

			Promise.enterContext(h);
			tryCatchReject3(f, x, h.value, receiver, next);
			Promise.exitContext();
		}

		/**
		 * @deprecated
		 */
		function runNotify(f, x, h, receiver, next) {
			if(typeof f !== 'function') {
				return next.notify(x);
			}

			Promise.enterContext(h);
			tryCatchReturn(f, x, receiver, next);
			Promise.exitContext();
		}

		function tryCatch2(f, a, b) {
			try {
				return f(a, b);
			} catch(e) {
				return reject(e);
			}
		}

		/**
		 * Return f.call(thisArg, x), or if it throws return a rejected promise for
		 * the thrown exception
		 */
		function tryCatchReject(f, x, thisArg, next) {
			try {
				next.become(getHandler(f.call(thisArg, x)));
			} catch(e) {
				next.become(new Rejected(e));
			}
		}

		/**
		 * Same as above, but includes the extra argument parameter.
		 */
		function tryCatchReject3(f, x, y, thisArg, next) {
			try {
				f.call(thisArg, x, y, next);
			} catch(e) {
				next.become(new Rejected(e));
			}
		}

		/**
		 * @deprecated
		 * Return f.call(thisArg, x), or if it throws, *return* the exception
		 */
		function tryCatchReturn(f, x, thisArg, next) {
			try {
				next.notify(f.call(thisArg, x));
			} catch(e) {
				next.notify(e);
			}
		}

		function inherit(Parent, Child) {
			Child.prototype = objectCreate(Parent.prototype);
			Child.prototype.constructor = Child;
		}

		function snd(x, y) {
			return y;
		}

		function noop() {}

		function initEmitRejection() {
			/*global process, self, CustomEvent*/
			if(typeof process !== 'undefined' && process !== null
				&& typeof process.emit === 'function') {
				// Returning falsy here means to call the default
				// onPotentiallyUnhandledRejection API.  This is safe even in
				// browserify since process.emit always returns falsy in browserify:
				// https://github.com/defunctzombie/node-process/blob/master/browser.js#L40-L46
				return function(type, rejection) {
					return type === 'unhandledRejection'
						? process.emit(type, rejection.value, rejection)
						: process.emit(type, rejection);
				};
			} else if(typeof self !== 'undefined' && typeof CustomEvent === 'function') {
				return (function(noop, self, CustomEvent) {
					var hasCustomEvent = false;
					try {
						var ev = new CustomEvent('unhandledRejection');
						hasCustomEvent = ev instanceof CustomEvent;
					} catch (e) {}

					return !hasCustomEvent ? noop : function(type, rejection) {
						var ev = new CustomEvent(type, {
							detail: {
								reason: rejection.value,
								key: rejection
							},
							bubbles: false,
							cancelable: true
						});

						return !self.dispatchEvent(ev);
					};
				}(noop, self, CustomEvent));
			}

			return noop;
		}

		return Promise;
	};
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));

}).call(this,require('_process'))

},{"_process":85}],84:[function(require,module,exports){

},{}],85:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],86:[function(require,module,exports){
function E () {
	// Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

E.prototype = {
	on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    };

    listener._ = callback
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

module.exports = E;

},{}],87:[function(require,module,exports){
/*!
* vdom-virtualize
* Copyright 2014 by Marcel Klehr <mklehr@gmx.net>
*
* (MIT LICENSE)
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
var VNode = require("virtual-dom/vnode/vnode")
  , VText = require("virtual-dom/vnode/vtext")

module.exports = createVNode

function createVNode(domNode, key) {
  key = key || null // XXX: Leave out `key` for now... merely used for (re-)ordering

  if(domNode.nodeType == 1) return createFromElement(domNode, key)
  if(domNode.nodeType == 3) return createFromTextNode(domNode, key)
  return
}

createVNode.fromHTML = function(html, key) {
  var domNode = document.createElement('div'); // create container
  domNode.innerHTML = html; // browser parses HTML into DOM tree
  domNode = domNode.children[0] || domNode; // select first node in tree
  return createVNode(domNode, key);
};

function createFromTextNode(tNode) {
  return new VText(tNode.nodeValue)
}


function createFromElement(el) {
  var tagName = el.tagName
  , namespace = el.namespaceURI == 'http://www.w3.org/1999/xhtml'? null : el.namespaceURI
  , properties = getElementProperties(el)
  , children = []

  for (var i = 0; i < el.childNodes.length; i++) {
    children.push(createVNode(el.childNodes[i]/*, i*/))
  }

  return new VNode(tagName, properties, children, null, namespace)
}


function getElementProperties(el) {
  var obj = {}

  props.forEach(function(propName) {
    if(!el[propName]) return

    if(el[propName] instanceof Element) return

    // Special case: style
    // .style is a DOMStyleDeclaration, thus we need to iterate over all
    // rules to create a hash of applied css properties.
    //
    // You can directly set a specific .style[prop] = value so patching with vdom
    // is possible.
    if("style" == propName) {
      var css = {}
        , styleProp
      for(var i=0; i<el.style.length; i++) {
        styleProp = el.style[i]
        css[styleProp] = el.style.getPropertyValue(styleProp) // XXX: add support for "!important" via getPropertyPriority()!
      }

      obj[propName] = css
      return
    }

    // Special case: dataset
    // we can iterate over .dataset with a simple for..in loop.
    // The all-time foo with data-* attribs is the dash-snake to camelCase
    // conversion.
    //
    // *This is compatible with h(), but not with every browser, thus this section was removed in favor
    // of attributes (specified below)!*
    //
    // .dataset properties are directly accessible as transparent getters/setters, so
    // patching with vdom is possible.
    /*if("dataset" == propName) {
      var data = {}
      for(var p in el.dataset) {
        data[p] = el.dataset[p]
      }
      obj[propName] = data
      return
    }*/

    // Special case: attributes
    // these are a NamedNodeMap, but we can just convert them to a hash for vdom,
    // because of https://github.com/Matt-Esch/virtual-dom/blob/master/vdom/apply-properties.js#L57
    if("attributes" == propName){
      var atts = Array.prototype.slice.call(el[propName]);
      var hash = atts.reduce(function(o,a){
        var name = a.name;
        if(obj[name]) return o;
        o[name] = el.getAttribute(a.name);
        return o;
      },{});
      return obj[propName] = hash;
    }
    if("tabIndex" == propName && el.tabIndex === -1) return

    // Special case: contentEditable
    // browser use 'inherit' by default on all nodes, but does not allow setting it to ''
    // diffing virtualize dom will trigger error
    // ref: https://github.com/Matt-Esch/virtual-dom/issues/176
    if("contentEditable" == propName && el[propName] === 'inherit') return

    // default: just copy the property
    obj[propName] = el[propName]
    return
  })

  return obj
}

/**
 * DOMNode property white list
 * Taken from https://github.com/Raynos/react/blob/dom-property-config/src/browser/ui/dom/DefaultDOMPropertyConfig.js
 */
var props =

module.exports.properties = [
 "accept"
,"accessKey"
,"action"
,"alt"
,"async"
,"autoComplete"
,"autoPlay"
,"cellPadding"
,"cellSpacing"
,"checked"
,"className"
,"colSpan"
,"content"
,"contentEditable"
,"controls"
,"crossOrigin"
,"data"
,"dataset"
,"defer"
,"dir"
,"download"
,"draggable"
,"encType"
,"formNoValidate"
,"href"
,"hrefLang"
,"htmlFor"
,"httpEquiv"
,"icon"
,"id"
,"label"
,"lang"
,"list"
,"loop"
,"max"
,"mediaGroup"
,"method"
,"min"
,"multiple"
,"muted"
,"name"
,"noValidate"
,"pattern"
,"placeholder"
,"poster"
,"preload"
,"radioGroup"
,"readOnly"
,"rel"
,"required"
,"rowSpan"
,"sandbox"
,"scope"
,"scrollLeft"
,"scrolling"
,"scrollTop"
,"selected"
,"span"
,"spellCheck"
,"src"
,"srcDoc"
,"srcSet"
,"start"
,"step"
,"style"
,"tabIndex"
,"target"
,"title"
,"type"
,"value"

// Non-standard Properties
,"autoCapitalize"
,"autoCorrect"
,"property"

, "attributes"
]

var attrs =
module.exports.attrs = [
 "allowFullScreen"
,"allowTransparency"
,"charSet"
,"cols"
,"contextMenu"
,"dateTime"
,"disabled"
,"form"
,"frameBorder"
,"height"
,"hidden"
,"maxLength"
,"role"
,"rows"
,"seamless"
,"size"
,"width"
,"wmode"

// SVG Properties
,"cx"
,"cy"
,"d"
,"dx"
,"dy"
,"fill"
,"fx"
,"fy"
,"gradientTransform"
,"gradientUnits"
,"offset"
,"points"
,"r"
,"rx"
,"ry"
,"spreadMethod"
,"stopColor"
,"stopOpacity"
,"stroke"
,"strokeLinecap"
,"strokeWidth"
,"textAnchor"
,"transform"
,"version"
,"viewBox"
,"x1"
,"x2"
,"x"
,"y1"
,"y2"
,"y"
]

},{"virtual-dom/vnode/vnode":93,"virtual-dom/vnode/vtext":94}],88:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],89:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],90:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":92}],91:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],92:[function(require,module,exports){
module.exports = "2"

},{}],93:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":88,"./is-vhook":89,"./is-vnode":90,"./is-widget":91,"./version":92}],94:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":92}],95:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":115}],96:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"min-document":84}],97:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],98:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],99:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":104}],100:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":108,"is-object":97}],101:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":106,"../vnode/is-vnode.js":109,"../vnode/is-vtext.js":110,"../vnode/is-widget.js":111,"./apply-properties":100,"global/document":96}],102:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],103:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":111,"../vnode/vpatch.js":113,"./apply-properties":100,"./update-widget":105}],104:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var render = require("./create-element")
var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
        ? renderOptions.patch
        : patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./create-element":101,"./dom-index":102,"./patch-op":103,"global/document":96,"x-is-array":98}],105:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":111}],106:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":107,"./is-vnode":109,"./is-vtext":110,"./is-widget":111}],107:[function(require,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"dup":88}],108:[function(require,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"dup":89}],109:[function(require,module,exports){
arguments[4][90][0].apply(exports,arguments)
},{"./version":112,"dup":90}],110:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":112}],111:[function(require,module,exports){
arguments[4][91][0].apply(exports,arguments)
},{"dup":91}],112:[function(require,module,exports){
arguments[4][92][0].apply(exports,arguments)
},{"dup":92}],113:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":112}],114:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":108,"is-object":97}],115:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":106,"../vnode/is-thunk":107,"../vnode/is-vnode":109,"../vnode/is-vtext":110,"../vnode/is-widget":111,"../vnode/vpatch":113,"./diff-props":114,"x-is-array":98}]},{},[1])
//# sourceMappingURL=content.js.map
