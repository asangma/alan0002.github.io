var map, view, query, queryTask, extent_container, options_toggle, current_features;

 require([
     "esri/Map",
     "esri/views/MapView",
     "esri/tasks/QueryTask",
     "esri/tasks/support/Query",
     "esri/layers/FeatureLayer",
     "esri/layers/GraphicsLayer",
     "esri/geometry/Extent",
     /*"esri/widgets/Compass",
     "esri/widgets/Home",
     "esri/widgets/Locate",
     "esri/widgets/BasemapToggle",
     "esri/widgets/Search",
     "esri/widgets/Zoom",
     "esri/tasks/Locator",*/
     "esri/widgets/Search",
     "dojo/dom-construct",
     "dojo/domReady!"
 ], function(Map, MapView,
     QueryTask,
     Query,
     FeatureLayer,
     GraphicsLayer,
     Extent,
     // Compass, Home, Locate, BasemapToggle, Search, Zoom, Locator,
     Search,
     domConstruct
 ) {
     //Create the map
     map = new Map({
         basemap: "streets"
     });

     //Create the MapView
     view = new MapView({
         container: "sceneDiv",
         map: map,
         extent: new Extent({
             xmin: -9177882.740387835,
             ymin: 4246761.27629837,
             xmax: -9176720.658692285,
             ymax: 4247967.548150893,
             spatialReference: 102100
         })
     });

     treeLayer = new FeatureLayer({
         // popupTemplate: tpl,
         url: "http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0",
         outFields: ["*"]
     });

     map.add(treeLayer);


     var search = new Search({
         viewModel: {
             view: view
         }
     });
     search.startup();
     view.ui.add(search, 'bottom-right');

     queryTask = new QueryTask({
         url: "http://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0"
     });
     query = new Query();

     setExtentWidget();
     addListeners();
     updateCopyInput();
 });

 function addListeners() {
     extent_container = document.getElementById('extent-widget-container');
     document.getElementById('toggle-mode').addEventListener('click', function(e) {
         toggleClasses(extent_container, 'show-min-max', 'show-center');
         updateCoordRadios();
         updateCopyInput();
     });

     var coordsRadios = document.getElementsByClassName('coords-radio');
     for (var i = 0; i < coordsRadios.length; i++) {
         coordsRadios[i].addEventListener('change', function(e) {
             updateCoords(this.value);
         });
     }

     current_features = document.getElementById('current-features');
     current_features.addEventListener('click', function(e) {
         toggleClasses(extent_container, 'is-extent-features', 'is-all-features');
         updateFeatureRadios();
     });
     /*
     query.geometry = view.extent;
     queryTask.execute(query).then(function(result){
         console.dir(result);
     });
     */
     var featuresRadios = document.getElementsByClassName('features-radio');
     for (var i = 0; i < featuresRadios.length; i++) {
         featuresRadios[i].addEventListener('change', function(e) {
             toggleClasses(extent_container, 'is-extent-features', 'is-all-features');
         });
     }


     view.on("pan", setExtentWidget);
     view.watch("animation", setExtentWidget);

     options_toggle = document.getElementById('more-link');
     options_toggle.addEventListener('click', function(e) {
         toggleSingleClass(extent_container, 'show-options-menu');
     });

 }


 function setExtentWidget() {
     document.getElementById('xmin').innerHTML = getFixed(view.extent.xmin);
     document.getElementById('ymin').innerHTML = getFixed(view.extent.ymin);
     document.getElementById('xmax').innerHTML = getFixed(view.extent.xmax);
     document.getElementById('ymax').innerHTML = getFixed(view.extent.ymax);
     document.getElementById('lat').innerHTML = getFixed(view.extent.center.latitude)
     document.getElementById('long').innerHTML = getFixed(view.extent.center.longitude);
 }

 function updateCopyInput() {
     var copy_input = document.getElementById('copy-input');
     if (extent_container.classList.contains('show-min-max')) {
         copy_input.value = 'xmin:' + view.extent.xmin + ', ymin:' + view.extent.ymin + ', xmax:' + view.extent.xmax + ', ymax:' + view.extent.ymax + ', spatialReference:' + view.extent.spatialReference.wkid;
     } else {
         copy_input.value = view.extent.center.latitude + ', ' + view.extent.center.longitude;
     }
 }

 function updateFeatureRadios() {
     var val = (extent_container.classList.contains('is-all-features')) ? 'all' : 'extent';
     var radios = document.getElementsByClassName('features-radio');
     for (var i = 0; i < radios.length; i++) {
         if (radios[i].value == val) radios[i].checked = true;
     }
 }

 function updateCoordRadios() {
     var val = (extent_container.classList.contains('show-min-max')) ? 'extent' : 'center';
     var radios = document.getElementsByClassName('coords-radio');
     for (var i = 0; i < radios.length; i++) {
         if (radios[i].value == val) radios[i].checked = true;
     }
 }

 function updateCoords(val) {
     extent_container.classList.remove('show-no-extent');
     switch (val) {

         case 'center':
             extent_container.classList.remove('show-min-max');
             extent_container.classList.add('show-center');
             break;

         case 'extent':
             extent_container.classList.remove('show-center');
             extent_container.classList.add('show-min-max');
             break;

         case 'none':
             extent_container.classList.add('show-no-extent');

     }
     updateCopyInput();
 }

 function getFixed(val) {
     return val.toFixed(4);
 }

 function toggleClasses(elem, class_a, class_b) {
     var new_class = '';
     var old_class = '';
     if (elem.classList.contains(class_a)) {
         new_class = class_b;
         old_class = class_a;
     } else if (elem.classList.contains(class_b)) {
         old_class = class_b;
         new_class = class_a;
     }
     removeClass(elem, old_class);
     addClass(elem, new_class);
 }

 function toggleSingleClass(elem, className) {
     if (elem.classList.contains(className)) {
         removeClass(elem, className);
     } else {
         addClass(elem, className);
     }
 }

 function addClass(el, className) {
     if (el.classList)
         el.classList.add(className)
     else if (!hasClass(el, className)) el.className += " " + className
 }

 function removeClass(el, className) {
     if (el.classList)
         el.classList.remove(className)
     else if (hasClass(el, className)) {
         var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
         el.className = el.className.replace(reg, ' ')
     }
 }
