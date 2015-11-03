import Symbol = require("../Symbol");

declare namespace jsonUtils {
  export function fromJSON(json: any): Symbol;
}

export = jsonUtils;
