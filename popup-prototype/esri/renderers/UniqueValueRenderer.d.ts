import Renderer = require("./Renderer");
import Symbol = require("../symbols/Symbol");

declare class UniqueValueRenderer extends Renderer {
  constructor(symbol: Symbol, attr: string, attr2?: string, attr3?: string, fieldDelimiter?: string);
  addValue(valueOrInfo: any, symbol: Symbol): void;
}

export = UniqueValueRenderer;
