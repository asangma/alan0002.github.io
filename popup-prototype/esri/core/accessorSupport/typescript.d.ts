interface PropertyParams<T> {
  reader?: (value: any, source?: Object) => T;
  getter?: (cached?: T) => T | void;
  setter?: (value: T, cached?: T) => T | void;
  dependsOn?: string[];
  value?: T;
  type?: new (...params: any[]) => T;
  copy?: (dest: T, source: T) => void;
  readOnly?: boolean;
}

export interface ClassMetaData {
  properties?: HashMap<PropertyParams<any>>;
  computed?: HashMap<string[]>;

  reader?: {
    add: string[];
    exclude: string[];
  };
}

export function subclass(mixins?: any[], metadata?: ClassMetaData): Function;
export function shared(value: any): Function;
export function property<T>(params?: PropertyParams<T>): Function;
