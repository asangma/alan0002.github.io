import Portal = require("../Portal");
import Layer = require("../../layers/Layer");
import Error = require("../../core/Error");

import LabelClass = require("../../layers/support/LabelClass");
import Renderer = require("../../renderers/Renderer");
import PopupTemplate = require("../../PopupTemplate");

import {
  OperationalLayer,
  ElevationInfo
 } from "../jsonTypes";

export interface CreatorParams {
  portal?: Portal;
}

export type PropertyFilter = (layer: OperationalLayer, properties: LayerProperties) => LayerProperties | void;

export interface LayerProperties {
  id?: string;
  url?: string;
  title: string;

  visible?: boolean;
  opacity?: number;
  minScale?: number;
  maxScale?: number;

  listMode?: string;

  elevationInfo?: ElevationInfo;
  labelingInfo?: LabelClass[];
  popupTemplate?: PopupTemplate;

  disablePopup?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;

  renderer?: Renderer;
}

export type LayerFilter = (layer: Layer) => IPromise<Layer, Error> | Layer;

export interface LayerCreatorParams extends CreatorParams {
  propertyFilter?: PropertyFilter;
  filter?: LayerFilter;
  defaultLayerType?: string;
}
