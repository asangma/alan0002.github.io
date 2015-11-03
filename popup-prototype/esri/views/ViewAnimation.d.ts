import Promise = require("../core/Promise");

declare class ViewAnimation extends Promise<ViewAnimation> {
  stop(): void;
  finish(): void;

  state: string;
}

export = ViewAnimation;
