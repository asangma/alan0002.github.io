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
    var node_str = '<div class="app-module" id="app-no-' + index + '"><div class="app-icon-container ' + color + '">';
    if (app.image) {
      node_str += '<div class="app-icon"><img src="' + app.image + '"/></div>';
    }
    if (app.letters) {
      var fontSize = app.letters.length <= fontSizes.length  ? fontSizes[app.letters.length-1]  : fontSizes[fontSizes.length-1];
      console.log(app.letters.length + ' : ' + fontSize);
      node_str += '<div class="app-icon-svg"></div><div class="app-letters" style="font-size:'+fontSize+'px;">' + app.letters + '</div>';
      if (i < colors.length - 1) i++;
      else i = 0;
    }
    node_str += '</div><span class="app-title">' + app.name + '</span></div>'
    jQuery('.apps-container').append(node_str);

  });
  jQuery('.app-icon-svg').load('assets/app_bg.html', function(event) {
    // console.dir(jQuery(this).find('svg'));
    /*createGradient(jQuery(this).find('svg')[0],
      'svg-gradient-blue',
      [{
        offset:'0%',
        'stop-color':'rgb(0,122,194)'
      }, {
        offset:'75%',
        'stop-color':'rgb(0,69,117)'
      }
      ]);
    createGradient(jQuery(this).find('svg')[0],
      'svg-gradient-gray',
      [{
        offset:'0%',
        'stop-color':'rgb(110, 110, 110)'
      }, {
        offset:'75%',
        'stop-color':'rgb(51, 51, 51)'
      }
      ]);*/
  });
  jQuery('.app-trigger').load('assets/app-switcher.html', function() {});

  // jQuery('.apps-container').append('<div class="app-module see-all"><span class="see-all__icon esri-icon-handle-horizontal"></span><span class="see-all__text">See all</span></div>');

  /*jQuery('.app-trigger').on('click', function(event) {
    event.preventDefault();
    jQuery('body').toggleClass('app-switcher--visible');
  });
  jQuery('.cover').on('click', function(event) {
    jQuery('body').removeClass('app-switcher--visible');
  });

  jQuery('.style-trigger').on('click', function(event) {
    event.preventDefault();
    jQuery('.current-style').removeClass('current-style');
    console.log(jQuery(this).attr('href'));

    jQuery.each(jQuery('.style-trigger'), function(index, node) {
      jQuery('body').removeClass(jQuery(node).attr('href'));
    });

    jQuery('body').addClass(jQuery(this).attr('href'));
    jQuery(this).parent().addClass('current-style');
  });*/
});

/*function createGradient(svg, id, stops) {
  var svgNS = svg.namespaceURI;
  var grad = document.createElementNS(svgNS, 'linearGradient');
  grad.setAttribute('id', id);
  for (var i = 0; i < stops.length; i++) {
    var attrs = stops[i];
    var stop = document.createElementNS(svgNS, 'stop');
    for (var attr in attrs) {
      if (attrs.hasOwnProperty(attr)) stop.setAttribute(attr, attrs[attr]);
    }
    grad.appendChild(stop);
  }
  var gradTransform = document.createAttribute('gradientTransform');
  gradTransform.value = 'rotate(35)';
  grad.setAttributeNode(gradTransform);

  var defs = svg.querySelector('defs') ||
    svg.insertBefore(document.createElementNS(svgNS, 'defs'), svg.firstChild);
  return defs.appendChild(grad);
}*/
