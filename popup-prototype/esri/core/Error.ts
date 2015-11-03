/// <amd-dependency path="./tsSupport/extendsHelper" name="__extends" />
/// <amd-dependency path="./tsSupport/decorateHelper" name="__decorate" />

import {
  subclass
} from "./typescript";

import dojoString = require("dojo/string");

@subclass()
class Error {
  name: string;

  message: string;

  details: any;

  constructor(name: string, message?: string, details?: any) {
  }

  dojoConstructor(name: string, message?: string, details?: any) {
    this.name = name;

    this.message = (message && dojoString.substitute(message, details, (s: string) => {
      return s == null ? "" : s;
    })) || "";

    this.details = details;
  }

  toString() {
    return "[" + this.name + "]: " + this.message;
  }
}

export = Error;
