
function getNav(uri) {

    var loc = window.location.href;
    var start = loc.lastIndexOf('/') + 1;
    var end = loc.length;
    var page = loc.substring(start, end);
    jQuery.get(uri, function(data, textStatus, xhr) {
      var window_w = jQuery(window).width();
      jQuery('.navbar-nav').prepend(data);
      
        jQuery('.nav li').each(function(index, elem) {
            var href = jQuery(elem).children('a').attr('href'); 
            if (href == page) {
                jQuery(elem).addClass('active');
            }
        });
  });
}