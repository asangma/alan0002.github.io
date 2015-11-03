interface EventedBase extends IEvented { }

interface EventedBaseConstructor {
  new (): EventedBase;
}

declare function getEventedBaseConstructor(): EventedBaseConstructor;

declare class Evented extends getEventedBaseConstructor() {
  hasEventListener(type: string): boolean;
}

export = Evented;
