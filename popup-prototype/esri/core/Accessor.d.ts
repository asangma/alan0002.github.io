import { DojoDeclared } from "./typescript";

declare class Accessor implements DojoDeclared {
  constructor(params?: Object);

  protected getDefaults(params?: Object): Object;

  protected normalizeCtorArgs(params?: Object): Object;

  protected initialize(): void;

  protected notifyChange(prop: string): void;

  get(props: string | string[]): any;

  set(prop: string, value: any): Accessor;

  watch(prop: string | string[], callback: (value?: any, oldValue?: any, propName?: string, targetObject?: any) => void): IHandle;

  destroy(): void;

  // DojoDeclared interface
  inherited<T>(args: IArguments): T;
}

export = Accessor;
