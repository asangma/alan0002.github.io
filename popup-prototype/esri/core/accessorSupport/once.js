define([], function() {
  return function(fn) {
    var called = false;
    return function() {
      if (!called) {
        called = true;
        fn();
      }
    };
  };
});