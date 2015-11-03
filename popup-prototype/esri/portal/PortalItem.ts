/**
 * An item (a unit of content) in the Portal. Each item has a unique identifier and a 
 * well known url that is independent of the user owning the item. An item may have 
 * associated binary or textual data which is available via the item data resource. 
 * View the ArcGIS Portal API REST documentation for the 
 * [item](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000mt000000) 
 * for more details.
 * 
 * @module esri/portal/PortalItem
 * @since 4.0
 * @noconstructor
 * @see module:esri/portal/Portal
 * @see [Sample - Load a basic WebScene](../sample-code/webscene-basic/index.html)
 */

/// <amd-dependency path="../core/tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="../core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, shared, property } from "../core/accessorSupport/typescript";
import Deferred = require("dojo/Deferred");
import errors = require("../core/errors");
import Extent = require("../geometry/Extent");
import JSONSupport = require("../core/JSONSupport");
import Loadable = require("../core/Loadable");
import Portal = require("./Portal");

interface PortalItemBase extends JSONSupport, Loadable<PortalItem> {
}
interface PortalItemBaseConstructor {
  new (): PortalItemBase;
}
function getPortalItemBase(): PortalItemBaseConstructor {
  return <any> JSONSupport;
}

// TODO
// Handle cancelLoad

@subclass([Loadable])
class PortalItem extends getPortalItemBase() {

  @shared("esri.portal.PortalItem")
  declaredClass: string;

  //--------------------------------------------------------------------------
  //
  //  Life cycle
  //
  //--------------------------------------------------------------------------

  /**
   * @constructor
   * @alias module:esri/portal/PortalItem
   * @extends module:esri/core/Accessor
   * @mixes module:esri/core/Loadable
   * @param {Object} properties - See the [properties](#properties) for a list of all the properties
   *                            that may be passed into the constructor.
   */
  constructor(properties?: Object) {
    super();
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  created
  //----------------------------------

  /**
   * The date the item was created.
   * 
   * @type {Date}
   */
  @property({ type: Date })
  created: Date = null;

  //----------------------------------
  //  description
  //----------------------------------

  /**
   * The detailed description of the item.
   * 
   * @type {string}
   */
  @property()
  description: string = null;

  //----------------------------------
  //  extent
  //----------------------------------

  /**
   * The geographic extent, or bounding rectangle, of the item.
   * 
   * @type {module:esri/geometry/Extent}
   */
  @property({
    type: Extent,
    reader: function (value: number[][]): Extent {
      return (value && value.length) ? new Extent(value[0][0], value[0][1], value[1][0], value[1][1]) : null;
    }
  })
  extent: Extent = null;

  //----------------------------------
  //  id
  //----------------------------------

  /**
   * The unique id for the item.
   *
   * @type {string}
   */
  @property()
  id: string = null;

  //----------------------------------
  //  itemUrl
  //----------------------------------

  /**
   * The url to the item.
   *
   * @readonly
   * @type {string}
   */
  @property({ dependsOn: ["portal.restUrl"], readOnly: true })
  itemUrl: string = null;

  protected _itemUrlGetter(): string {
    const restUrl = this.get("portal.restUrl");
    return restUrl ? restUrl + "/content/items/" + this.id : null;
  }
    
  //----------------------------------
  //  loaded
  //----------------------------------
      
  /**
  * Indicates wheather the item's resources have loaded from the portal. When `true`,
  * all the properties of the object can be accessed.
  *
  * @name loaded
  * @instance
  * @type {boolean}
  * @default false
  * @readonly             
  */    

  //----------------------------------
  //  modified
  //----------------------------------

  /**
   * The date the item was last modified.
   * 
   * @type {Date}
   */
  @property({ type: Date })
  modified: Date = null;

  //----------------------------------
  //  name
  //----------------------------------

  /**
   * The name of the item.
   *
   * @type {string}
   */
  @property()
  name: string = null;

  //----------------------------------
  //  portal
  //----------------------------------

  /**
   * The portal that contains the item.
   * 
   * @type {module:esri/portal/Portal}
   */
  @property({ type: Portal })
  portal: Portal = null;

  //----------------------------------
  //  resourceInfo
  //----------------------------------

  @property()
  private resourceInfo: any;

  //----------------------------------
  //  title
  //----------------------------------

  /**
   * The title for the item. This is the name that is displayed to users and 
   * used to refer to the item. Every item must have a title.
   *
   * @type {string}
   */
  @property()
  title: string = null;

  //----------------------------------
  //  type
  //----------------------------------

  /**
   * The GIS content type of this item.
   * 
   * @type {string}
   * @example
   * portalItem.type = "Web Map";
   * 
   * @example
   * portalItem.type = "Web Mapping Application";
   */
  @property()
  type: string = null;

  //--------------------------------------------------------------------------
  //
  //  Overridden Methods
  //
  //--------------------------------------------------------------------------

  load(): PortalItem {
    if (!this.portal) {
      this.portal = Portal.getDefault();
    }

    const promise = this.portal.load().then(() => {
      if (this.resourceInfo) {
        return this.resourceInfo;
      } else if (this.id && this.itemUrl) {
        return this.portal._request(this.itemUrl);
      } else {
        return {};
      }
    }).then((json) => {
      this.resourceInfo = json;
      this.read(json);
    });

    this.addResolvingPromise(promise);
    return this;
  }

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  /*
   * THIS METHOD IS TEMPORARY
   * @ignore
   */
  create(params: any) {
    let modname: string = null;

    switch (this.type) {
      case "Web Scene":
        modname = "WebSceneCreator";
        break;
    }

    const ret = new Deferred();

    if (!modname) {
      ret.reject(errors.Portal.unsupportedItemType(this.type));
    }

    require(["./creators/" + modname], function (CreatorCtor: any) {
      const creator = new CreatorCtor(params);
      creator.createFromItem(this).then(ret.resolve, ret.reject, ret.progress);
    }.bind(this));

    return ret.promise;
  }

  /**
   * Requests a PortalItem in the format specified in `handleAs`.
   *
   * @param {string} handleAs - The format of the response. <br><br>
   *   **Known Values:** json | xml | text | blob | arraybuffer | document
   * @return {Promise} - When resolved, returns the requested data.
   */
  fetchData<T>(handleAs = "json"): IPromise<T, any> {
    return this.portal._request(this.itemUrl + "/data", { handleAs });
  }

  /**
   * @ignore
   * @return {{}}
   */
  toJSON(): Object {
    throw errors.Internal.notYetImplemented();
  }

  /**
   * @ignore
   * @return {PortalItem}
   */
  static fromJSON(json: any): PortalItem {
    if (!json) {
      return null;
    }
    if (json.declaredClass) {
      throw new Error("JSON object is already hydrated");
    }
    return new PortalItem({ "resourceInfo": json });
  }
}

export = PortalItem;
