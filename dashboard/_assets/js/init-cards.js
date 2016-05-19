(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

(function () {
  var v15cards = document.querySelector("[data-version=\"v15\"] .cards");
  var v16cards = document.querySelectorAll("[data-version=\"v16\"] .cards");
  imagesLoaded(".cards", function () {
    var msnry = new Masonry(v15cards, {
      itemSelector: ".card",
      percentPosition: true
    });
    var msnry = new Masonry(v16cards[0], {
      itemSelector: ".card",
      percentPosition: true
    });
    var msnry = new Masonry(v16cards[1], {
      itemSelector: ".card",
      percentPosition: true
    });
  });
})();

},{}]},{},[1])
//# sourceMappingURL=init-cards.js.map
