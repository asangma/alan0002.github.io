var colors = ["blue", "red", "green", "purple", "gray"];

var apps = [/*{
    name: "Marketplace",
    image: "images/product-icons/marketplace-48.png"
  },*/ {
    name: "Developers",
    letters: "D"
  }, {
    name: "Insights",
    image: "images/product-icons/Insights48.png"
  }, {
    name: "GeoPlanner",
    letters: "GeoP"
  }, {
    name: "Business Analyst",
    image: "images/product-icons/BAO_Android_Launch_48.png"
  }, {
    name: "Community Analyst",
    letters: "CA"
  }, {
    name: "Workforce",
    image: "images/product-icons/workforce_android_48.png"
  }, {
    name: "Survey123",
    image: "images/product-icons/Survey123_Windows_48.png"
  },
  // {
  //   name: "AppStudio",
  //   image: "images/product-icons/"
  // },
  {
    name: "Open Data",
    letters: "ODa"
  }, {
    name: "Operations Dashboard",
    image: "images/product-icons/Operations_Dashboard_48.png"
  }, {
    name: "Story Maps",
    letters: "SM"
  }/*, {
    name: "Some App",
    letters: "SA"
  }*/
  /*, {
      name: "All the Things",
      letters: "AT"
    }*/
];

jQuery(document).ready(function() { // You wish you could use jQuery
  var i = 0;
  var fontSizes = [
    28, // 1 char
    20, // 2 char
    16,  // 3 char
    14// <= 4 char 
  ]
  jQuery.each(apps, function(index, app) {
    var color = colors[i];
    var node_str = '<li class="app-module" id="app-no-'+ index +'" role="menuitem">'; // open li
    node_str += '<div class="app-icon-container '+ color +'">'; // open app-icon-container
    if (app.image) {
      node_str += '<div class="app-icon"><img src="'+ app.image +'" title="'+ app.name +'" alt=""/></div>'; // app-icon
    }
    if (app.letters) {
      var fontSize = app.letters.length <= fontSizes.length  ? fontSizes[app.letters.length-1]  : fontSizes[fontSizes.length-1];
      console.log(app.letters.length +' : '+ fontSize);
      node_str += '<div class="app-icon-svg" title="'+ app.name +'"></div><div class="app-letters" style="font-size:'+fontSize+'px;" aria-hidden="true">'+ app.letters +'</div>'; // app-icon-svg
      if (i < colors.length - 1) i++;
      else i = 0;
    }
    node_str += '</div>'; // close app-icon-container
    node_str += '<span class="app-title">'+ app.name +'</span>';  // app-title
    node_str += '</li>' // close li
    jQuery('.apps-container').append(node_str);

  });
  jQuery('.app-icon-svg').load('assets/app_bg.html', function(event) {
  });
  jQuery('.app-trigger').load('assets/app-switcher.html', function() {});
});

