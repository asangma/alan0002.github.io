/*jQuery(document).ready(function($) {
    activateControls();
});
*/
function activateControls() {
    //console.log('*');
    //var toggle = jQuery('.thumb-toggle');
    jQuery('.thumb-toggle').on('click', function(event){
        jQuery('.item-thumb').toggle();
        //jQuery('.item-thumb:hidden').show();
    });

    jQuery('.col-toggle').on('click', function(event){
        if(jQuery('#feed-col').hasClass('col-md-6')) {
            jQuery('#feed-col').removeClass('col-md-6');
            jQuery('#feed-col').addClass('col-md-12');
        } else {
            jQuery('#feed-col').addClass('col-md-6');
            jQuery('#feed-col').removeClass('col-md-12');
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