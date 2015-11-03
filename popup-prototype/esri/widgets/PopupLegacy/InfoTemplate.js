/**
 * Mixin for PopupTemplate
 * 
 * @module esri/InfoTemplate
 * @mixin
 * @since 4.0
 * @see module:esri/widgets/PopupTemplate
 */
define(
[
  "../../core/declare",
  "dojo/_base/lang",
  "../../core/lang"
],
function(declare, lang, esriLang) {

// TODO Accessorize PopupInfo first
   
//   var InfoTemplate = declare([Accessor, JSONSupport], {
//     declaredClass: "esri.InfoTemplate",

//     //--------------------------------------------------------------------------
//     //
//     //  Lifecycle
//     //
//     //--------------------------------------------------------------------------
    
//     /**
//      * LEGACY DOC
//      * 
//      * ========== Constructor 1 ==========
//      * new esri.InfoTemplate(title, content);
//      * 
//      * title: <String|Function>
//      * content: <String|Function>
//      *
//      * Function: A user-defined function that will be
//      * passed reference to the graphic being processed.
//      * Returns one of the following:
//      *   String
//      *   DOMNode
//      *   Instance of dojo.Deferred
//      * 
//      * ========== Constructor 2 ==========
//      * new esri.InfoTemplate(JSON);
//      * 
//      * JSON: {
//      *   title: <String|DOMNode|Function>,
//      *   content: <String|DOMNode|Function>
//      * }
//      */
     
//     normalizeCtorArgs: function(/*String|Object*/ title, /*String*/ content) {
//       if (title && lang.isObject(title) && !lang.isFunction(title)) {
//         return title;
//       }
//       return {
//         title: title,
//         content: content
//       }
//     },

  
//     //--------------------------------------------------------------------------
//     //
//     //  Properties
//     //
//     //--------------------------------------------------------------------------

//     //----------------------------------
//     //  title
//     //----------------------------------

//     title: "${*}",

//     //----------------------------------
//     //  content
//     //----------------------------------

//     content: "${*}",

  
//     //--------------------------------------------------------------------------
//     //
//     //  Public Methods
//     //
//     //--------------------------------------------------------------------------

//     toJSON: function() {
//       return esriLang.fixJson({
//         title: this.title,
//         content: this.content
//       });
//     }

//   });
  
  
  var InfoTemplate = declare(null, 
  /** @lends module:esri/InfoTemplate */                           
  {
    declaredClass: "esri.InfoTemplate",
    
    /*
     * ========== Constructor 1 ==========
     * new esri.InfoTemplate(title, content);
     * 
     * title: <String|Function>
     * content: <String|Function>
     *
     * Function: A user-defined function that will be
     * passed reference to the graphic being processed.
     * Returns one of the following:
     *   String
     *   DOMNode
     *   Instance of dojo.Deferred
     * 
     * ========== Constructor 2 ==========
     * new esri.InfoTemplate(JSON);
     * 
     * JSON: {
     *   title: <String|DOMNode|Function>,
     *   content: <String|DOMNode|Function>
     * }
     */
    constructor: function(/*String|Object*/ title, /*String*/ content) {
      if (title && lang.isObject(title) && !lang.isFunction(title)) {
        lang.mixin(this, title);
      }
      else {
        this.title = title || "${*}";
        this.content = content || "${*}";
      }
    },
    
    /**
    * The template for defining how to format the title used in a {@link module:esri/widgets/Popup Popup}. 
    * You can format the title by specifying either a string value or a function. See the [content](#content) 
    * property for more details. In most cases, the title is specified as either a simple string or a function
    * that returns a simple string.
    * 
    * @type {string | function}
    */
    title: null,
     
    /**
    * The template for defining how to format the content used in a {@link module:esri/widgets/Popup Popup}. 
    * The content for a {@link module:esri/widgets/Popup Popup} can be defined using either a string or a function. 
    * This provides the developer with the ability to easily format and customize the {@link module:esri/widgets/Popup Popup} 
    * contents.
    * 
    * When the content contains a chart, use a 
    * [Dojo CSS theme](http://dojotoolkit.org/reference-guide/1.10/dijit/themes.html), such as Claro or Tundra,
    * in your application for a better user experience.
    * 
    * @type {string | function}
    */  
    content: null,

    setTitle: function(title) {
      this.title = title;
      return this;
    },

    setContent: function(content) {
      this.content = content;
      return this;
    },

    toJson: function() {
      try {
        throw new Error("toJson is deprecated, use toJSON instead");
      }
      catch (e) {
        console.warn(e.stack);
      }

      return this.toJSON();
    },

    toJSON: function() {
      return esriLang.fixJson({
        title: this.title,
        content: this.content
      });
    }
  });
  
  return InfoTemplate;
});
