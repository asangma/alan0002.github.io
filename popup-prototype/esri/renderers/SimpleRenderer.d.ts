import Renderer = require("./Renderer");
import Symbol = require("../symbols/Symbol");

declare class SimpleRenderer extends Renderer {
  constructor(symbol: Symbol);
}

export = SimpleRenderer;
