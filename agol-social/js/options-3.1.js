/*jQuery(document).ready(function($) {
    activateControls();
});
*/
function activateControls() {
    //console.log('*');
    //var toggle = jQuery('.thumb-toggle');
    jQuery('.thumb-toggle').on('click', function(event){
        jQuery('.social-content').toggleClass('hide-thumbs');
    });
    jQuery('.break-toggle').on('click', function(event){
        jQuery('.social-content').toggleClass('show-breaks');
    });

    jQuery('.col-toggle').on('click', function(event){
        if(jQuery('#feed-col').hasClass('col-md-6')) {
            jQuery('#feed-col').removeClass('col-md-6');
            jQuery('#feed-col').addClass('col-md-12');
        } else {
            jQuery('#feed-col').addClass('col-md-6');
            jQuery('#feed-col').removeClass('col-md-12');
        }
        //jQuery('.social-content').toggleClass('full-page');
        // if(!jQuery('.social-content').hasClass('show-breaks')) jQuery('.social-content').addClass('show-breaks');
        // if(jQuery('.social-content').hasClass('show-breaks')) jQuery('.social-content').removeClass('show-breaks');
        if(jQuery('.social-content').hasClass('full-page')) {
            jQuery('.social-content').removeClass('full-page');
            jQuery('.social-content').addClass('half-page');
        } else if(jQuery('.social-content').hasClass('half-page')) {
            jQuery('.social-content').addClass('full-page');
            jQuery('.social-content').removeClass('half-page');
        }
    });

    jQuery('.options-toggle').on('click', function(event) {
        event.preventDefault();
        jQuery('.options-wrap').removeClass('collapsed');
    });
    jQuery('.options-wrap').hover(function() {
        /* Stuff to do when the mouse enters the element */
    }, function() {
        jQuery('.options-wrap').addClass('collapsed');
    });

    jQuery('#role').change(function(e){
        //jQuery('#feed').empty();
        getData();
    });
}