define([
  'intern!object',
  'intern/chai!assert',
  'esri/core/lang'
], function(registerSuite, assert, lang){

  var num_array,
    string_array,
    obj_array,
    success_test_obj,
    fail_test_obj,
    stripTags_string,
    stripTags_test_string,
    stripTags_obj,
    stripTags_obj_same,
    stripTags_test_obj,
    substitute_obj,
    substitute_obj_template,
    substitute_test_string,
    substitute_test_string_first_property,
    substitute_test_string_template,
    num_array_test,
    filterFunction,
    filter_array,
    filter_string,
    filter_success_test_obj,
    filter_fail_test_obj,
    filter_string_test_obj;

  registerSuite({
    name: 'esri/core/lang',

    setup: function(){
      num_array = [1, 2, 3, 4, 5];
      string_array = ["Oregon", "Washington"];
      obj_array = [
        {
          name: "John",
          age: 24
        },
        {
          name: "James",
          age: 30
        }
      ];
      success_test_obj = {
        name: "James",
        age: 30
      };
      fail_test_obj = {
        name: "James",
        age: 35
      };

      stripTags_string = "<b>Jane</b>";
      stripTags_test_string = "Jane";

      stripTags_obj = {
        name: "<b>Jane</b>",   //myobj.name = "<b>Jane</b>"
        last: "Doe",
        age: "30"
      };

      stripTags_obj_same = {
        name: "<b>Jane</b>",   //myobj.name = "<b>Jane</b>"
        last: "Doe",
        age: "30"
      };

      stripTags_test_obj = {
        name: "Jane",   //myobj.name = "<b>Jane</b>"
        last: "Doe",
        age: "30"
      };

      substitute_obj = {state_name: "Arizona", state_capital: "Phoenix"};
      substitute_obj_template = "The capital of ${state_name} is ${state_capital}.";
      substitute_test_string = "state_name = Arizona<br/>state_capital = Phoenix<br/>";
      substitute_test_string_first_property = "state_name = Arizona<br/>";
      substitute_test_string_template = "The capital of Arizona is Phoenix.";

      filterFunction = function(value) {
        if((value !== ' ') && (Number(value) !== 0)){
          return true;
        }
      };

      filter_array = [0, 'string', 3, ''];
      filter_string = 'I am';

      filter_success_test_obj = {'1':'string', '2':3};
      filter_fail_test_obj = {'1':'string', '2':3, '3': ''};

      filter_string_test_obj= {'0': 'I', '2': 'a', '3': 'm'};
    },

    valueOf: function(){

      assert.isFunction(lang.valueOf, 'ValueOf should be a function');

      assert.equal(lang.valueOf(num_array, 3), 2, 'It should return the location of the number in the array');
      assert.strictEqual(lang.valueOf(num_array, 3), '2', 'It should return the location of the number in the array');
      assert.strictEqual(lang.valueOf(num_array, 6), null, 'It should return null as the number doesnt exist in the array');
      assert.notEqual(lang.valueOf(num_array, 1), null, 'The output should not be equal to null as the number exists in the array');

      assert.equal(lang.valueOf(string_array, "Washington"), 1, 'It should return the location of the string in the array');
      assert.strictEqual(lang.valueOf(string_array, "Washington"), '1', 'It should return the location of the string in the array');
      assert.strictEqual(lang.valueOf(string_array, "Arizona"), null, 'It should return null as the string doesnt exist in the array');
      assert.notEqual(lang.valueOf(string_array, "Oregon"), null, 'The output should not be equal to null as the string exists in the array');

      assert.equal(lang.valueOf(success_test_obj, "James"), 'name', 'It should return the property of the object to which its value is equal to argument value');
      assert.strictEqual(lang.valueOf(success_test_obj, 30), 'age', 'It should return the property of the object to which its value is equal to argument value');
      assert.strictEqual(lang.valueOf(success_test_obj, "Arizona"), null, 'It should return the property of the object to which its value is equal to argument value');
      assert.notEqual(lang.valueOf(success_test_obj, 30), null, 'It should return the property of the object to which its value is equal to argument value');


      assert.strictEqual(lang.valueOf(null, 4), null, 'The output should be null as the array is null');

      //This test fails as the valueOf function doesnt check for equality of 2 objects
      //assert.equal(lang.valueOf(obj_array, success_test_obj), 1, 'its not working');
    },

    stripTags: function(){

      assert.isFunction(lang.stripTags, 'stripTags should be a function');

      assert.strictEqual(lang.stripTags(stripTags_string), stripTags_test_string, 'It should strip html tags from the string');
      assert.notStrictEqual(lang.stripTags(stripTags_string), stripTags_string, 'It should strip html tags from the string');

      assert.deepEqual(lang.stripTags(stripTags_obj), stripTags_test_obj, 'It should strip html tags from the object');
      assert.notDeepEqual(lang.stripTags(stripTags_obj), stripTags_obj_same, 'It should strip html tags from the object');
    },

    substitute: function(){

      assert.isFunction(lang.substitute, 'stripTags should be a function');

      assert.strictEqual(lang.substitute(substitute_obj), substitute_test_string, 'The output should use wildcard template and substitute the argument data');
      assert.strictEqual(lang.substitute(substitute_obj, null), substitute_test_string, 'The output should use null template and substitute the argument data');
      assert.strictEqual(lang.substitute(substitute_obj, null, true), substitute_test_string_first_property, 'The output should use null template and return the first property');
      assert.strictEqual(lang.substitute(substitute_obj, substitute_obj_template), substitute_test_string_template, 'The output should use the template and substitute the argument data');
    },

    filter: function(){

      assert.isFunction(lang.filter, 'filter should be a function');

      assert.deepEqual(lang.filter(filter_array, filterFunction), filter_success_test_obj, 'The output should filter the array based on the filter function');
      assert.notDeepEqual(lang.filter(filter_array, filterFunction), filter_fail_test_obj, 'The output should filter the array based on the filter function');
      assert.deepEqual(lang.filter([], filterFunction), {}, 'The output should filter the array based on the filter function');
      assert.deepEqual(lang.filter(filter_string, filterFunction), filter_string_test_obj, 'The output should filter the array based on the filter function');

    },

    isDefined: function(){

      assert.isFunction(lang.isDefined, 'isDefined should be a function');
      assert.strictEqual(lang.isDefined(num_array), true, 'The output should be true if the value is defined');
      assert.strictEqual(lang.isDefined(num_array_test), false, 'The output should be false if the value is not defined');
    }
  });
});