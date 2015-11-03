/**
 * Represents a message generated during the execution of a network analyst task. It is composed
 * of a message type and description. NAMessage has no constructor.
 *
 * @see module:esri/tasks/RouteTask
 * @see module:esri/tasks/support/ClosestFacilitySolveResult
 * @see module:esri/tasks/support/ServiceAreaSolveResult
 *
 * @module esri/tasks/support/NAMessage
 * @noconstructor
 * @since 4.0
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",

  "../../core/JSONSupport"
],
function(
  declare, lang,
  JSONSupport
) {

  /**
   * @mixes module:esri/core/JSONSupport
   * @constructor module:esri/tasks/support/NAMessage
   */
  var NAMessage = declare(JSONSupport,
  /** @lends module:esri/tasks/support/NAMessage.prototype */
  {

    declaredClass: "esri.tasks.NAMessage",

    /**
    * A description of the network analyst message.
    * @type {string}
    */
    description: null,

    /**
    * The network analyst message type.
    * 
    * @type {Object}
    */  
    type: null

  });

  lang.mixin(NAMessage, {
    TYPE_INFORMATIVE: 0,
    TYPE_PROCESS_DEFINITION: 1,
    TYPE_PROCESS_START: 2,
    TYPE_PROCESS_STOP: 3,
    TYPE_WARNING: 50,
    TYPE_ERROR: 100,
    TYPE_EMPTY: 101,
    TYPE_ABORT: 200
  });

  return NAMessage;
});
