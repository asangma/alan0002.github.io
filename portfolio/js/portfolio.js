jQuery(document).ready(function($) {

    ////////////////////////////////////////////////
    //  INIT SKROLLR
    var sklr;
    /* = skrollr.init({
            smoothScrollling: true,
            forceHeight: true
        });*/
    ////////////////////////////////////////////////



    var loc = window.location.href;
    var start = loc.lastIndexOf('/') + 1;
    var end = loc.length;
    var page = loc.substring(start, end);
    var isHome = (page.length == 0 || page == 'index.html') ? true : false;
    //console.log(page + ' : ' + isHome);
    //console.log(isHome);
    //jQuery('')

    jQuery.get('includes/nav.html', function(data, textStatus, xhr) {
        var window_w = jQuery(window).width();
        jQuery('.body').prepend(data);
        if (!isHome) {
            jQuery('.nav li').each(function(index, elem) {
                var href = jQuery(elem).children('a').attr('href');
                if (href == page) {
                    jQuery(elem).addClass('active');
                    if (jQuery(elem).attr('data-parent')) {
                        jQuery('.' + jQuery(elem).attr('data-parent')).addClass('active');
                    }
                }
            });
        } else {
            jQuery('#about').addClass('active');
            //data-top="margin-left:-65px;" data--150-top="margin-left:-15px;"
            jQuery('.navbar-brand').attr('data--200-top', "margin-left:-75px;");
            jQuery('.navbar-brand').attr('data--250-top', "margin-left:-25px;");
        }
       jQuery('body').animate({scrollTop: 0}, 25, function(){
          //  console.log('*');
            sklr = skrollr.init({
                smoothScrollling: true,
                forceHeight: true,
                edgeStrategy: 'ease'
            }); 
       });
    });


    jQuery(window).resize(function(e) {
        var w = jQuery('.project-banner').width();
        jQuery('.project-banner').height(w / 2.5);
    });
    jQuery(window).trigger('resize');

});
