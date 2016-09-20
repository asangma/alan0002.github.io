
jQuery(document).ready(function($) {
  init();
});

var appWrapper;

function init() {
  // console.log('init');
  appWrapper = jQuery('.app-wrapper');
  jQuery('.app-item').on('click', function(event){
    event.preventDefault();
    appWrapper.toggleClass('in-item');
  });
}