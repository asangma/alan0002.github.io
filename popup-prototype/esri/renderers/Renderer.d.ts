import {
  Renderer as RendererJSON,
  SizeInfo,
  ColorInfo,
  VisualVariable
} from "../portal/jsonTypes";

declare class Renderer {
  declaredClass: string;

  sizeInfo: SizeInfo;
  colorInfo: ColorInfo;
  visualVariables: VisualVariable[];

  constructor(json: RendererJSON);

  setProportionalSymbolInfo(sizeInfo: SizeInfo): void;
  setColorInfo(colorInfo: ColorInfo): void;
  setVisualVariables(visualVariables: VisualVariable[]): void;

  toJSON(): any;
}

export = Renderer;
