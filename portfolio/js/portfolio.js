jQuery(document).ready(function(readyEvent) {

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
        jQuery('#skrollr-body').prepend(data);
        getFooter();
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
            //jQuery('.navbar-brand').attr('data--200-top', "margin-left:-75px;");
            //jQuery('.navbar-brand').attr('data--250-top', "margin-left:-25px;");
        }
       //jQuery('body').animate({scrollTop: 0}, 25, function(){
            /*sklr = skrollr.init({
                smoothScrollling: false,
                forceHeight: false,
                edgeStrategy: 'ease'
            }); */
       //});
    });


    jQuery(window).resize(function(e) {
        var w = jQuery('.project-banner').width();
        jQuery('.project-banner').height(w / 2.5);
    });
    jQuery(window).trigger('resize');
    // if(jQuery('.zoom-gallery').length > 0) {
        jQuery('.zoom-gallery').magnificPopup({
            delegate: 'a',
            type: 'image',
            closeOnContentClick: false,
            closeBtnInside: false,
            mainClass: 'mfp-with-zoom mfp-img-mobile',
            image: {
                verticalFit: true,
                titleSrc: function(item) {
                    return item.el.attr('data-title');
                }
            },
            gallery: {
                enabled: true
            },
            zoom: {
                enabled: true,
                duration: 300, // don't foget to change the duration also in CSS
                opener: function(element) {
                    return element.find('img');
                }
            }
            
        });
    // }

});
function getFooter() {
    jQuery.get('includes/footer.html', function(data, textStatus, xhr) {
        jQuery('.body').append(data);
        // sklr = skrollr.init({
        //         smoothScrollling: false,
        //         forceHeight: false,
        //         edgeStrategy: 'ease'
        //     }); 
    });
}

   
/*jQuery(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
    event.preventDefault();
    jQuery(this).ekkoLightbox({
        //footer: jQuery(this).attr('title');
    });
}); */