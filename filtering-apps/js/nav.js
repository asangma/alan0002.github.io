
function getNav(uri, htmlTarget, liElem) {

    var loc = window.location.href;
    var start = loc.lastIndexOf('/') + 1;
    var end = loc.length;
    var page = loc.substring(start, end);
    jQuery.get(uri, function(data, textStatus, xhr) {
      var window_w = jQuery(window).width();
      jQuery(htmlTarget).html(data);
      
        jQuery(htmlTarget + ' ' + liElem).each(function(index, elem) {
            var href = jQuery(elem).children('a').attr('href'); 

            if (href == page) {
              // console.log(href + ' : ' + page);
                jQuery(elem).addClass('active');
            }
        });
  });
}