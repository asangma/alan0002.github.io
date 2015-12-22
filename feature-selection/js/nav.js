var features = {
  '247': {
    width: 20,
    height: 20,
    top: 591,
    left: 974,
    type: 'point'
  },
  'Cady-Mountains': {
    top: 82,
    left: 807,
    width: 644,
    height: 172,
    type: 'polygon'
  },
  'Cleghorn-Lakes': {
    top: 555,
    left: 1583,
    width: 379,
    height: 195,
    type: 'line'
  },
  'Larger-than-View': {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    type: 'polygon'
  }
}


function setBackgrounds(limit, htmlTarget) {
  var html = '';
  for (var i = 0; i < limit; i++) {
    var active = i > 0 ? '' : 'active';
    html += '<li><a class="bg-trigger ' + active + '" href="' + i + '">Background ' + i + '</a></li>'
  }
  jQuery(htmlTarget).append(html);
  
  bindBackgroundOptions();
}

function bindBackgroundOptions() {
  jQuery('.bg-trigger').on('click', function(event) {
    event.preventDefault();
    jQuery('.bg-trigger.active').removeClass('active');
    jQuery(this).addClass('active');
    jQuery('.container').css('background-image', 'url(images/map-' + jQuery(this).attr('href') + '.jpg)');
  });
}

function setFeatures(htmlTarget) {
  var html = '';
  //var regex = new RegExp('-');
  var i = 0;
  jQuery.each(features, function(key, obj) {
    var title = key.replace(/-/g, ' ');
    var active = '';//i > 0 ? '' : 'active';

    html += '<li><a class="feature-trigger ' + active + '" href="' + key + '">' + title + ' <small>('+obj.type+')</small></a></li>';
    i++;
  });
  /*for(var i = 0; i < limit; i++) {
    var active = i>0 ? '' : 'active';
    html += '<li><a class="feature-trigger'+active+'" href="'+i+'">Feature '+i+'</a></li>';
  }*/
  jQuery(htmlTarget).prepend(html);

  jQuery('.feature-trigger').on('click', handleFeatureClick);
  
  addFeatureHits();
}

function addFeatureHits() {
  jQuery.each(features, function(key, obj){
    if(key !== 'Larger-than-View') {
        jQuery('.container').append('<a class="hits ' + key + '" href="' + key + '"></a>');
        jQuery.each(obj, function(prop, val){
          jQuery('.'+key).css(prop, val);
        });
      }
  });

  jQuery('.hits').on('click', handleFeatureClick);
}


function handleFeatureClick(event) {
  event.preventDefault();
  var href = jQuery(this).attr('href');

  jQuery('.feature-trigger.active').removeClass('active');
  jQuery('.feature-trigger').each(function(i){
    if(jQuery(this).attr('href') == href) jQuery(this).addClass('active');
  });
  //jQuery(this).addClass('active');

  var position = features[href];
  jQuery.each(position, function(name, val) {
    if(name !== 'type') jQuery('.selection').css(name, val);
  });

  if (href == 'Cleghorn-Lakes') {
    jQuery('.bg-body').addClass('right-feature');
  } else {
    jQuery('.bg-body').removeClass('right-feature');
  }

  if (href == 'Larger-than-View') {
    jQuery('.bg-body').addClass('too-big');
  } else {
    jQuery('.bg-body').removeClass('too-big');
  }

}

var borderLimit = 0;

function setBorders(limit, htmlTarget) {
  var html = '';
  for(var i = 1; (i-1) < limit; i++) {
    var active = i !== 1 ? '' : 'active';
    html += '<li><a class="border-trigger '+active+'" href="px-'+i+'">'+i+'px</a></li>';
  }
  jQuery(htmlTarget).append(html);
  borderLimit = limit;

  bindBorderOptions();
}

function bindBorderOptions() {
  jQuery('.border-trigger').on('click', function(event) {
    event.preventDefault();

    jQuery('.border-trigger.active').removeClass('active');
    jQuery(this).addClass('active');

    var pixels = jQuery(this).attr('href');
    for (var i = 1; (i-1) < borderLimit; i++) {
      jQuery('.bg-body').removeClass('px-' + i);
    }
    jQuery('.bg-body').addClass(pixels);
  });
}

function addOptionsListeners() {
  /*jQuery('.options-trigger').hover(function() {
    jQuery(this).css('opacity', 1);
  }, function() {
    jQuery(this).css('opacity', 0);
  });*/
  jQuery('.options-trigger').on('click', function(event) {
    jQuery('.options-wrap').toggleClass('open');
  });

  /*jQuery('.options-wrap').hover(function() {}, function() {
    jQuery('.options-wrap').removeClass('open');
  });*/

}
