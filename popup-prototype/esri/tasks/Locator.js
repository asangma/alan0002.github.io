/**
 * Represents a geocode service resource exposed by the ArcGIS Server REST API. It is used to 
 * generate candidates for an address. It is also used to generate batch results for a set of addresses.
 * 
 * Set the URL to the ArcGIS Server REST resource that represents a Locator service, for example:  `http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer`. 
 *
 * @see [World Geocoding Service](https://developers.arcgis.com/rest/geocode/api-reference/overview-world-geocoding-service.htm)
 * 
 * @since 4.0
 * @module esri/tasks/Locator
 */
define(
[
  "dojo/_base/array",
  "../core/declare",
  "dojo/_base/lang",

  "../request",

  "./Task",

  "./support/AddressCandidate"
],
function(
  array, declare, lang, esriRequest,
  Task,
  AddressCandidate
) {

  /**
   * @extends module:esri/tasks/Task
   * @constructor module:esri/tasks/Locator
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                              that may be passed into the constructor.
   */
  var Locator = declare(Task,
  /** @lends module:esri/tasks/Locator.prototype */
  {

    declaredClass: "esri.tasks.Locator",

      
    /**
    * Limit the results to one or more categories. For example "Populated Place" or "airport". Only applicable 
    * when using the World Geocode Service. View the [World Geocoding Service documentation](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm) for more information.
    * @type {string[]}
    */
    categories: null,
      
    /**
    * Limits the results to only search in the country provided. For example `US` for United States or `SE` for Sweden. Only applies to the 
    * World Geocode Service. See the [World Geocoding Service documentation](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm) for more information.
    * @type {string}
    */
    countryCode: null,

    /**
    * The spatial reference of the output geometries. If not specified, the output geometries are in the spatial reference of
    * the input geometries when performing a reverse geocode and in the default spatial reference returned by the service if 
    * finding locations by address. 
    * 
    * If `processSpatialReference` is specified and `outSpatialReference`
    * is not specified, the output geometries are in the spatial reference of the process spatial reference.
    * @type {module:esri/geometry/SpatialReference}
    */  
    outSpatialReference: null,
    
    /**
    * URL to the ArcGIS Server REST resource that represents a locator service.
    * @type {string}
    */   
    url: null,


    /**
     * Sends a request to the ArcGIS REST geocode resource to find candidates for a single address specified in the address parameter.
     * 
     * @param {Object}    params    - Specify the address and optionally specify the outFields and searchExtent. 
     *                              See the object specifications table below.
     * @param {Object} params.address - The address argument is data object that contains properties representing the various 
     *                                address fields accepted by the corresponding geocode service. These fields are listed in the
     *                                addressFields property of the associated geocode service resource.
     * For example, if the *addressFields* of a geocode service resource includes fields with the following names:
     * Street, City, State and Zone, then the address argument is of the form:
     * ```js
     * {
     *   Street: "1234 W Main St",
     *   City: "Small Town",
     *   State: "WA",
     *   Zone: "99027"
     * }
     * ```
     * 
     * Locators published using ArcGIS 10 or later support a single line address field, which 
     * can be specified using the following syntax where field_name is the name of the single
     * line address field. You can find this name by viewing the help or services directory for
     * your locator services. Common values are *SingleLine* and *SingleLineFieldName*:
     * ```js
     * var address = {
     *   "field_name": "380 New York St, Redlands, CA 92373"
     * };
     * ```
     * The Services Directory can be used to find out the required and optional address fields 
     * and the correct names for the input name fields. If you are using the World Geocoding Service 
     * visit the ArcGIS Online Geocoding Service help for more details on the World Geocoder.
     * @param {string[]} params.categories - Limit result to one or more categories. For example, 
     *                                     "Populated Place" or "Scandinavian Food". Only applies to the World Geocode Service. 
     *                                     See [Category filtering (World Geocoding Service)](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm#ESRI_SECTION1_502B3FE2028145D7B189C25B1A00E17B) for more information.
     * @param {string} params.countryCode - Limit result to a specific country. For example, "US" for United States or "SE" for Sweden.
     *                             Only applies to the World Geocode Service. See Geocode coverage (World Geocoding Service) 
     *                             for more information.
     * @param {number} params.distance - Used in combination with `location` option to weight returned results 
     *                                 within this distance (meters).
     * @param {boolean} params.forStorage - Allows the results of single geocode transactions to be persisted.
     * @param {module:esri/geometry/Point} params.location - Used in combination with `distance` option to weight 
     *                                                     returned results for a specified area.
     * @param {string} params.magicKeg - A `suggestLocations` result ID (magicKey). Used to query for a specific results information. 
     * @param {number} params.maxLocations - Maximum results to return from the query.
     * @param {string[]} params.outFields - The list of fields included in the returned result set. This list is a comma delimited 
     *                                    list of field names. If you specify the shape field in the list of return fields, it is ignored.
     *                                    For non-intersection addresses you can specify the candidate fields as defined in the geocode
     *                                    service. For intersection addresses you can specify the intersection candidate fields.  
     * @param {module:esri/geometry/Extent} params.searchExtent - Defines the extent within which the geocode server will search. 
     *                                                          Requires ArcGIS Server version 10.1 or greater.    
     *                                                          
     * @param   {Object=}   address   - You can directly pass `address` into the method if you choose not to pass in a `params` Object.
     * @param   {(String[])=} outFields - If you opt to not define and pass a `params` object, specify the `outFields` here.
     *                              
     * @return {Promise} When resolved, returns an Object, containing an `addresses` property, which is an array of 
     *                                        {@link module:esri/tasks/support/AddressCandidate AddressCandidates[]}. Each element of the
     *                                        array is a candidate that matches the input address. 
     */
    addressToLocations: function(/*Object*/ address, /*String[]?*/ outFields, /*Envelope?*/ searchExtent) {
      //summary: Find all address candidates for given address
      // address: esri.tasks.AddressCandidate: Address to find candidates for
      // from 2.6, address, outFields and searchExtent should be congregated as a params obj. For backward compatible reason,
      // it supports both signature.
      // new signature function(/*Object*/ params)

      var magicKey, distance, location, maxLocations, forStorage, categories, countryCode;

      if (address.address) {
        outFields = address.outFields;
        searchExtent = address.searchExtent;
        countryCode = address.countryCode;
        magicKey = address.magicKey;
        distance = address.distance;
        categories = address.categories;
        if (address.location && this.normalization) {
          location = address.location.normalize();
        }
        maxLocations = address.maxLocations;
        forStorage = address.forStorage;
        address = address.address;
      }

      if (searchExtent) {
        searchExtent = searchExtent.shiftCentralMeridian();
      }

      var outSR = this.outSpatialReference,
          _params = this._encode(
            lang.mixin(
              {},
              this.parsedUrl.query,
              address,
              {
                f: "json",
                outSR: outSR && JSON.stringify(outSR.toJSON()),
                outFields: (outFields && outFields.join(",")) || null,
                searchExtent: searchExtent && JSON.stringify(searchExtent.toJSON()),
                category: (categories && categories.join(",")) || null,
                countryCode: countryCode || null,
                magicKey: magicKey || null,
                distance: distance || null,
                location: location || null,
                maxLocations: maxLocations || null,
                forStorage: forStorage || null
              }
            )
          );

      return esriRequest({
        url: this.parsedUrl.path + "/findAddressCandidates",
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleAddressToLocationsResponse);
    },

    _handleAddressToLocationsResponse: function(response) {
      var candidates = response.candidates || [],
          sr         = response.spatialReference,
          location;

      return candidates.map(function(candidate) {
        location = candidate.location;

        if (location) {
          location.spatialReference = sr;
        }

        return AddressCandidate.fromJSON(candidate);
      });
    },

    /**
     * Get character by character auto complete suggestions.
     * @param {Object} params - An object that defines suggest parameters. See specifications below.
     * @param {string[]} params.categories - A place or address type which can be used to filter suggest results. 
     *                                     The parameter supports input of single category values or multiple comma-separated values.
     * @param {number} params.distance - Used with the `location` property. The `distance` property specifies the radial distance 
     *                                 from the location.
     * @param {module:esri/geometry/Point} params.location - Defines a normalized location point that is used with the
     *                                                     distance parameter to sort geocoding candidates based upon their proximity 
     *                                                     to the given location.
     * @param {string} params.text - The input text entered by a user which is used by the suggest operation to generate a 
     *                             list of possible matches.                                                    
     * @returns {Object} The result is an object containing a suggestions property, which is an array of objects, 
     *                   each representing a suggestion result.             
     */
    suggestLocations: function(params){
      var _params;
      // normalize location
      if (params.hasOwnProperty("location") && this.normalization) {
        params.location = params.location.normalize();
      }

      if (params.searchExtent) {
        params.searchExtent = params.searchExtent.shiftCentralMeridian();
      }

      // mixin params
      _params = this._encode(
        lang.mixin(
          {},
          this.parsedUrl.query,
          {
            f: "json",
            text: params.text,
            searchExtent: params.searchExtent && JSON.stringify(params.searchExtent.toJSON()),
            category: (params.categories && params.categories.join(",")) || null,
            location: params.location || null,
            distance: params.distance || null
          },
          {
            f: "json"
          }
        )
      );

      return esriRequest({
        url: this.parsedUrl.path + "/suggest",
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleSuggestLocationsResponse);
    },

    _handleSuggestLocationsResponse: function(response) {
      return response.suggestions || [];
    },

    /**
     * Find address candidates for the input addresses. This method requires an ArcGIS Server 10.1 or greater geocode service. 
     * @param   {Object} params - See specifications below.
     * @param {Object[]} params.addresses - The input addresses in the format supported by the geocode service. If the service supports 
     *                          'Single Line Input' the input addresses will be in the following format:
     * ```js
     * {
     *   "OBJECTID": 0,
     *   "Single Line Input":"440 Arguello Blvd, 94118"
     * }
     * ```
     * @param {String} params.countryCode - Limits the results to only search in the country provided. For example `US` for United States or `SE` for Sweden. Only applies to the 
     * World Geocode Service. See the [World Geocoding Service documentation](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm) for more information.
     *
     * @param {String[]} params.categories - Limit result to one or more categories. For example, 
     *                                     "Populated Place" or "Scandinavian Food". Only applies to the World Geocode Service. 
     *                                     See [Category filtering (World Geocoding Service)](https://developers.arcgis.com/rest/geocode/api-reference/geocoding-category-filtering.htm#ESRI_SECTION1_502B3FE2028145D7B189C25B1A00E17B) for more information.
     * @return {Promise} When resolved, the result is an object with an `addresses` property containing an 
     *                                        array of {@link module:esri/tasks/support/AddressCandidate AddressCandidate}.
     */
    addressesToLocations: function(/*Object*/ params) {
      var outSR = this.outSpatialReference,
          records = [],
          categories = params.categories,
          sourceCountry = params.countryCode,
          addresses = params.addresses;

      array.forEach(addresses, function(address, idx){
        records.push({attributes: address});
      });

      var _params = this._encode(lang.mixin(
            {},
            this.parsedUrl.query,
            {
              category: (categories && categories.join(",")) || null,
              sourceCountry: sourceCountry || null
            },
            {addresses: JSON.stringify({records: records})},
            {f:"json", outSR: outSR && JSON.stringify(outSR.toJSON())}
          ));

      return esriRequest({
        url: this.parsedUrl.path + "/geocodeAddresses",
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleAddressesToLocationsResponse);
    },


    _handleAddressesToLocationsResponse: function(response) {
      var locations = response.locations || [],
          sr        = response.spatialReference,
          location;

      return locations.map(function(result) {
        location = result.location;
        if (location) {
          location.spatialReference = sr;
        }

        return AddressCandidate.fromJSON(result);
      });
    },

    /**
     * Locates an address based on a given point.
     * @param   {module:esri/geometry/Point} location - The point at which to search for the closest address. The location 
     *                                                should be in the same spatial reference as that of the geocode service.
     * @param   {number} distance  - The distance in meters from the given location within which a matching address should be searched. 
     *                             If this parameter is not provided or an invalid value is provided, a default value of 0 meters is used.
     * @returns {Promise} When resoloved, the result is an object containing an address property 
     *                                        with the resulting {@link module:esri/tasks/support/AddressCandidate AddressCandidate}. 
     */
    locationToAddress: function(/*esri.geometry.Point*/ location, /*Number*/ distance) {
      //summary: Reverse geocode location on map and get address
      // location: esri.tasks.Point: Point to reverse reverse geocode
      // distance: Number: Tolerance distance within which to find an address

      if (location && this.normalization) {
        location = location.normalize();
      }

      var outSR = this.outSpatialReference,
          _params = this._encode(lang.mixin(
            {},
            this.parsedUrl.query,
            {
              outSR: outSR && JSON.stringify(outSR.toJSON()),
              location: location && JSON.stringify(location.toJSON()),
              distance:distance,
              f:"json"
            }
          ));

      return esriRequest({
        url: this.parsedUrl.path + "/reverseGeocode",
        content: _params,
        callbackParamName: "callback"
      })
        .then(this._handleLocationToAddressResponse);
    },

    _handleLocationToAddressResponse: function(response) {
      return AddressCandidate.fromJSON({
        address: response.address,
        location: response.location,
        score: 100
      });
    }

  });

  return Locator;
});
