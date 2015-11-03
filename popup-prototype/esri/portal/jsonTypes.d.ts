export type Color = [number, number, number, number];

export interface Outline {
  color: Color;
  width: number;
}

export interface SimpleMarkerSymbol {
  type: string;
  style: string;
  color: Color;
  size: number;

  angle?: number;
  xoffset?: number;
  yoffset?: number;
  outline?: Outline;
}

export interface PictureMarkerSymbol {
  type: string;
  url?: string;
  imageData?: string;
  contentType?: string;
  width?: number;
  height?: number;

  angle?: number;
  xoffset?: number;
  yoffset?: number;
}

export interface SimpleLineSymbol {
  type: string;
  style: string;
  color: Color;
  width?: number;
}

export interface SimpleFillSymbol {
  type: string;
  style: string;
  color: Color;
  outline?: Outline;
}

export interface PictureFillSymbol {
  type: string;
  url?: string;
  imageData?: string;
  contentType?: string;
  outline?: Outline;
  width?: number;
  height?: number;

  angle?: number;
  xoffset?: number;
  yoffset?: number;

  xscale?: number;
  yscale?: number;
}

export interface SymbolLayerMaterial {
  color?: Color;
  transparency?: number;
}

export interface IconSymbolLayer {
  type: string;
  enabled?: boolean;
  material?: SymbolLayerMaterial;

  size: number;
  resource: { primitive: string } | { href: string } | { dataURI: string };
  anchor?: string;
}

export interface ObjectSymbolLayer {
  type: string;
  enabled?: boolean;
  material?: SymbolLayerMaterial;

  width?: number;
  height?: number;
  depth?: number;
  resource: { primitive: string } | { href: string };
  anchor?: string;
}

export interface LineSymbolLayer {
  type: string;
  enabled?: boolean;
  material?: SymbolLayerMaterial;

  size: number;
}

export interface PathSymbolLayer {
  type: string;
  enabled?: boolean;
  material?: SymbolLayerMaterial;

  size: number;
}

export interface FillSymbolLayer {
  type: string;
  enabled?: boolean;
  material?: SymbolLayerMaterial;
}

export interface ExtrudeSymbolLayer {
  type: string;
  enabled?: boolean;
  material?: SymbolLayerMaterial;

  size: number;
}

export interface Font {
  family: string;
  style?: string;
  weight?: string;
}

export interface TextSymbolLayer {
  type: string;
  enabled?: boolean;
  material?: SymbolLayerMaterial;

  size: number;
  text?: string;
  font?: Font;
}

export type SymbolLayer = IconSymbolLayer | ObjectSymbolLayer | LineSymbolLayer | PathSymbolLayer | FillSymbolLayer | ExtrudeSymbolLayer | TextSymbolLayer;

export interface Symbol3D {
  type: string;
  symbolLayers: SymbolLayer[];
}

export type Symbol2D = SimpleMarkerSymbol | PictureMarkerSymbol | SimpleLineSymbol | SimpleFillSymbol | PictureFillSymbol;
export type Symbol = Symbol2D | Symbol3D;

export interface LabelExpressionInfo {
  value: string;
}

export interface LabelingInfo {
  labelExpression: string;
  labelExpressionInfo: LabelExpressionInfo;
  labelPlacement: string;
  useCodedValues?: boolean;
  minScale?: number;
  maxScale?: number;
  symbol?: Symbol;
  where?: string;
}

export interface ColorStop {
  value: number;
  color: Color;
  label?: string;
  transparency?: number;
}

export interface ColorInfo {
  type: string;
  field: string;
  stops: ColorStop[];
  maxSliderValue?: number;
  minSliderValue?: number;
  normalizationField?: string;
  normalizationTotal?: number;
  normalizationType?: string;
  theme?: string;
}

export interface SizeInfo {
  type: string;
  field: string;
  maxDataValue: number;
  maxSize?: number;
  minDataValue: number;
  minSize?: number;
  valueUnit?: string;
  normalizationType?: string;
  normalizationField?: string;
  normalizationTotal?: number;

  axis?: string;
  useSymbolValue?: boolean;
}

export interface TransparencyStop {
  value: number;
  transparency: number;
}

export interface TransparencyInfo {
  type: string;
  field: string;
  stops?: TransparencyStop[];
  maxDataValue: number;
  minDataValue: number;
  maxSliderValue: number;
  minSliderValue: number;
  normalizationField?: string;
  transparencyValues?: number[];
}

export type VisualVariable = ColorInfo | SizeInfo | TransparencyInfo;

export interface AuthoringInfo {
  type?: string;
  classificationMethod?: string;
  field?: any;
  theme?: any;
  standardDeviationInterval?: number;
  visualVariables: VisualVariable[];
}

export interface VisualVariables {
  field: string;
  maxSliderValue?: number;
  minSliderValue?: number;
  normalizationField: string;
}

export interface SimpleRenderer {
  type: string;
  authoringInfo?: AuthoringInfo;
  description?: string;
  label?: string;
  rotationExpression?: string;
  rotationType?: string;
  symbol: Symbol;
  visualVariables: VisualVariable[];
}

export interface UniqueValueInfo {
  value: string;
  label?: string;
  description?: string;
  symbol?: Symbol;
}

export interface UniqueValueRenderer {
  type: string;
  defaultLabel?: string;
  defaultSymbol?: Symbol;
  field1?: string;
  field2?: string;
  field3?: string;
  fieldDelimiter?: string;
  rotationExpression?: string | number;
  rotationType?: string;
  uniqueValueInfos: UniqueValueInfo[];
}

export interface ClassBreakInfo {
  classMaxValue: number;
  classMinValue: number;
  description?: string;
  label?: string;
  symbol?: Symbol;
}

export interface ClassBreaksRenderer {
  type: string;
  backgroundFillSymbol?: Symbol;
  classBreakInfos: ClassBreakInfo[];
  classificationMethod?: string;
  defaultLabel?: string;
  defaultSymbol?: Symbol;
  field: string;
  minValue?: number;
  normalizationField?: string;
  normalizationTotal?: number;
  normalizationType?: string;
  rotationExpression?: string;
  rotationType?: string;
}

export type Renderer = SimpleRenderer | UniqueValueRenderer | ClassBreaksRenderer;

export interface DrawingInfo {
  labelingInfo?: LabelingInfo[];
  renderer?: Renderer;
}

export interface ElevationFeatureExpression {
  value: number;
}

export interface ElevationInfo {
  mode: string;
  offset?: number;
  featureExpression?: ElevationFeatureExpression;
}

export interface LayerDefinition {
  minScale?: number;
  maxScale?: number;
  elevationInfo?: ElevationInfo;
  definitionExpression?: string;
  drawingInfo?: DrawingInfo;
}

export interface Format {
  dateFormat?: string;
  digitSeparator?: boolean;
  places?: number;
}

export interface FieldInfo {
  fieldName?: string;
  format?: Format;
  isEditable?: boolean;
  label?: string;
  stringFieldOption?: string;
  tooltip?: string;
  visible?: boolean;
}

export interface FieldOrder {
  field?: string;
  order?: string;
}

export interface RelatedRecordsInfo {
  showRelatedRecords?: boolean;
  orderByFields?: FieldOrder[];
}

export interface Value {
  fields?: string[];
  linkURL?: string;
  normalizeField?: string;
  sourceURL?: string;
}

export interface MediaInfo {
  type: string;

  caption?: string;
  title?: string;
  value?: Value;
}

export interface PopupInfo {
  title?: string;
  description?: string;
  fieldInfos?: FieldInfo[];
  relatedRecordsInfo?: RelatedRecordsInfo;
  mediaInfos?: MediaInfo[];
  showAttachments?: boolean;
}

export interface BasemapLayer {
  id: string;
  url: string;
  layerType: string;
  isReference?: boolean;
}

export interface Basemap {
  id: string;
  title?: string;
  baseMapLayers: BasemapLayer[];
  elevationLayers?: BasemapLayer[];
  transparency?: number;
}

export interface SpatialReference {
  wkid: number;
  latestWkid?: number;
}

export interface Point {
  x: number;
  y: number;
  z?: number;

  spatialReference: SpatialReference;
}

export interface Extent {
  xmin: number;
  ymin: number;
  zmin?: number;
  xmax: number;
  ymax: number;
  zmax?: number;

  spatialReference: SpatialReference;
}

export type Geometry = Point | Extent;

export interface Camera {
  position: Point;
  heading?: number;
  tilt?: number;
}

export interface Viewpoint {
  camera?: Camera;
  scale?: number;
  rotation?: number;
  targetGeometry?: Extent | Point;
}

export interface LOD {
  scale: number;
  level: number;
  resolution: number;
  levelValue?: string;
}

export interface TileInfo {
  rows: number;
  cols: number;
  dpi: number;
  format: string;
  compressionQuality: number;
  origin: Point;
  spatialReference: SpatialReference;
  lods: LOD[];
}

export interface Lighting {
  datetime?: number;
  directShadows?: boolean;
  ambientOcclusion?: boolean;
  displayUTCOffset?: number;
}

export interface Environment {
  lighting: Lighting;
}

export interface InitialState {
  viewpoint?: Viewpoint;
  environment?: Environment;
}

export interface VisibleLayer {
  id: string;
}

export interface Slide {
  id: string;

  title: {
    text: string
  };

  description?: {
    text: string
  };

  thumbnail: {
    url: string
  };

  viewpoint: Viewpoint;
  baseMap: Basemap;
  visibleLayers: VisibleLayer[];
  environment?: Environment;
}

export interface Presentation {
  slides?: Slide[];
}

export interface ClippingArea {
  clip: boolean;
  geometry: Geometry;
}

export interface OperationalLayerOverrides {
  title?: string;
  visibility?: boolean;
  opacity?: number;
  showLabels?: boolean;
  disablePopup?: boolean;
  showLegend?: boolean;
  listMode?: string;

  layerDefinition?: LayerDefinition;
  popupInfo?: PopupInfo;
}

export interface OperationalLayer extends OperationalLayerOverrides {
  layerType: string;
  url?: string;
  id?: string;

  itemId?: string;

  // Group layer only
  visibilityMode?: string;
  layers?: OperationalLayer[];
}

export interface WebScene {
  version?: string;
  operationalLayers: OperationalLayer[];
  baseMap?: Basemap;
  authoringApp?: string;
  authoringAppVersion?: string;
  viewingMode?: string;
  presentation?: Presentation;
  initialState?: InitialState;
  clippingArea?: ClippingArea;
  spatialReference?: SpatialReference;
}
