
declare namespace watchUtils {
  export function whenOnce(obj: any, name: string, cb: (newValue?: any, oldValue?: any, propName?: string, target?: any) => void): IHandle;
}

export = watchUtils;
