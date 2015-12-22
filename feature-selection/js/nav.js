
function setBackgrounds(limit, htmlTarget) {
  var html = '';
  for(var i = 0; i < limit; i++) {
    var active = i>0 ? '' : ' active';
    html += '<li><a class="bg-trigger'+active+'" href="'+i+'">Background '+i+'</a></li>'
  }
  jQuery(htmlTarget).append(html);
  jQuery('.bg-trigger').on('click', function(event){
    event.preventDefault();
    jQuery('.bg-trigger.active').removeClass('active');
    jQuery(this).addClass('active');
    jQuery('.bg-body').css('background-image', 'url(images/map-'+jQuery(this).attr('href')+'.jpg)');
  });
}

var features = {
  0: {
    top: 554,
    left: 869,
    width: 196,
    height: 121
  },
  1: {
    top: 82,
    left: 807,
    width: 644,
    height: 172
  },
  2: {
    top: 0,
    left: 1295,
    width: 667,
    height: 319
  },
  toobig: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  }
}

function setFeatures(limit, htmlTarget) {
  var html = '';
  

  for(var i = 0; i < limit; i++) {
    var active = i>0 ? '' : ' active';
    html += '<li><a class="feature-trigger'+active+'" href="'+i+'">Feature '+i+'</a></li>'
  }
  jQuery(htmlTarget).prepend(html);

  jQuery('.feature-trigger').on('click', function(event){
    event.preventDefault();
    var href = jQuery(this).attr('href');

    jQuery('.feature-trigger.active').removeClass('active');
    jQuery(this).addClass('active');

    var position = features[href];
    jQuery.each(position, function(name, val){
      jQuery('.selection').css(name, val);
    });

    if(href == 2) {
      jQuery('.bg-body').addClass('top-right-feature');
    } else {
      jQuery('.bg-body').removeClass('top-right-feature');
    }
    if(href == 'toobig') {
      jQuery('.bg-body').addClass('too-big');
    } else {
      jQuery('.bg-body').removeClass('too-big');
    }
  });
}


function setBorder(limit, htmlTarget) {
  var html = '';
  for(var i = 1; i-1 < limit; i++) {
    var active = i==2 ? ' active' : '';
    html += '<li><a href="px-'+i+'" class="border-trigger'+active+'">'+i+'px</a></li>';
  }
  jQuery(htmlTarget).append(html);

  jQuery('.border-trigger').on('click', function(event) {
    event.preventDefault();
    
    jQuery('.border-trigger.active').removeClass('active');
    jQuery(this).addClass('active');

    var pixels = jQuery(this).attr('href');
    for(var i = 1; i < 4; i++) {
      jQuery('.bg-body').removeClass('px-'+i);
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
    jQuery('.options-trigger').on('click', function(event){
        jQuery('.options-wrap').addClass('open');
    });

    jQuery('.options-wrap').hover(function(){},function(){
        jQuery('.options-wrap').removeClass('open');
    });

}