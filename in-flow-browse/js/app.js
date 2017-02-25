var takeover, close, main;

jQuery(document).ready(function($) {
  setListeners();
});

function setListeners() {
  jQuery('body').on('click', takeover);
}

function takeover(e) {
  console.log(e.target)
  jQuery('body').off('click', takeover);
  jQuery('.page-takeover').addClass('page-takeover--visible');
  jQuery('.fake-bg').addClass('no-scroll');

  jQuery('.page-takeover-close').on('click', giveback);
}

function giveback(e) {
  console.log(e.target);
  e.stopPropagation();
  jQuery('.page-takeover-close').off('click', giveback);

  jQuery('.page-takeover').removeClass('page-takeover--visible');
  jQuery('.fake-bg').removeClass('no-scroll');

  setListeners();
}