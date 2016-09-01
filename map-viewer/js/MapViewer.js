mapViewer = {
  on: null,
  navigationToggle: null,
  navigationBar: null,
  // domClass: null,

  init: function(
    on) {

    this.on = on;

    navigationBar = dojo.query('.navigation-bar')
    this._addListeners();
    return this;
  },
  _addListeners: function() {
    navigationToggle = dojo.query('.navigation-bar__toggle');
    this.on(navigationToggle[0], 'click', this._toggleNavigationBar);
  },
  _toggleNavigationBar: function(event) {
    var target = event.target;
    var toggleTargetClass = dojo.attr(target, 'data-toggle-target');
    // console.dir('class: ' + toggleTargetClass);
    // console.dir(target);
    dojo.toggleClass(navigationBar[0], 'navigation-bar--is-collapsed');
  }
}