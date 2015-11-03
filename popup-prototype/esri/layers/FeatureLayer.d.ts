
import Layer = require("./Layer");

declare class FeatureLayer extends Layer {
  isTable: boolean;
  defaultDefinitionExpression: string;

  graphicsSource: {
    url: string;
    layerDefinition: any;
  };

  constructor(url?: string | any, options?: any);

  static MODE_SNAPSHOT: number;
  static MODE_ONDEMAND: number;
  static MODE_SELECTION: number;
}

export = FeatureLayer;
