// Copyright 2011 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

define([], function() {

var ns = {};

(function() {
var f=this;
function h(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var d=Object.prototype.toString.call(a);if("[object Window]"==d)return"object";if("[object Array]"==d||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==d||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";else if("function"==
  b&&"undefined"==typeof a.call)return"object";return b}function k(a,b){var d=a.split("."),c=f;d[0]in c||!c.execScript||c.execScript("var "+d[0]);for(var e;d.length&&(e=d.shift());)d.length||void 0===b?c=c[e]?c[e]:c[e]={}:c[e]=b};function l(a,b){this.d=a;this.b=b}l.prototype.getKey=function(){return this.d};l.prototype.c=function(){return new l(this.d,this.b)};function n(a){if("array"!=h(a))for(var b=a.length-1;0<=b;b--)delete a[b];a.length=0};function p(a){this.a=[];if(a)a:{var b,d;if(a instanceof p){b=a.a;d=[];for(var c=b.length,e=0;e<c;e++)d.push(b[e].getKey());b=d;d=a.a;for(var c=[],e=d.length,g=0;g<e;g++)c.push(d[g].b);d=c;if(0>=a.a.length){a=this.a;for(c=0;c<b.length;c++)a.push(new l(b[c],d[c]));break a}}else{b=[];c=0;for(e in a)b[c++]=e;c=[];e=0;for(d in a)c[e++]=a[d];d=c}for(c=0;c<b.length;c++)q(this,b[c],d[c])}}
function q(a,b,d){var c=a.a;c.push(new l(b,d));b=c.length-1;a=a.a;for(d=a[b];0<b;)if(c=b-1>>1,a[c].getKey()>d.getKey())a[b]=a[c],b=c;else break;a[b]=d}p.prototype.remove=function(){var a=this.a,b=a.length,d=a[0];if(!(0>=b)){if(1==b)n(a);else{a[0]=a.pop();for(var a=0,b=this.a,c=b.length,e=b[a];a<c>>1;){var g=2*a+1,m=2*a+2,g=m<c&&b[m].getKey()<b[g].getKey()?m:g;if(b[g].getKey()>e.getKey())break;b[a]=b[g];a=g}b[a]=e}return d.b}};p.prototype.c=function(){return new p(this)};p.prototype.g=function(){return this.a.length};
p.prototype.h=function(){return 0==this.a.length};p.prototype.clear=function(){n(this.a)};function r(){p.call(this)}(function(){var a=p;function b(){}b.prototype=a.prototype;r.i=a.prototype;r.prototype=new b})();r.prototype.f=function(a,b){q(this,a,b)};r.prototype.e=function(){return this.remove()};k("goog.structs.PriorityQueue",r);k("goog.structs.PriorityQueue.prototype.enqueue",r.prototype.f);k("goog.structs.PriorityQueue.prototype.dequeue",r.prototype.e);k("goog.structs.PriorityQueue.prototype.isEmpty",r.prototype.h);k("goog.structs.PriorityQueue.prototype.clear",r.prototype.clear);k("goog.structs.PriorityQueue.prototype.clone",r.prototype.c);k("goog.structs.PriorityQueue.prototype.getCount",r.prototype.g);
}).bind(ns)();

return ns;

});