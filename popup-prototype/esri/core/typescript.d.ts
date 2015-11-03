export function subclass(mixins?: any[]): Function;
export function shared(value: any): Function;

export interface DojoDeclared {
  inherited<T>(args: IArguments): T;
}
