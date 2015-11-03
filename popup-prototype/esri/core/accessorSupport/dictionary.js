define([
],
function() {
  return function() {
    // explicitely deactivate 'is better written in dot notation'
    /*jshint -W069 */
    var dictionary = Object.create(null);
    dictionary["temp"] = {};
    delete dictionary["temp"];
    return dictionary;
  };
});
