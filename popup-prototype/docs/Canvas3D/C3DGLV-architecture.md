## Canvas3DGraphicsLayerView architecture

Canvas3DGraphicsLayerView listens to changes in the underlying GraphicsLayer (could be a FeatureLayer or a SceneServiceLayer) and turns API Graphics/Symbols/Geometries into WebGL engine objects. Most parts operate exclusively on the Web3D symbology. Any 2D symbols are internally converted to 3D.

### Web3D symbology

The Web3D symbology adds the concept of layers to symbol:
![](https://devtopia.esri.com/WebGIS/arcgis-js-api/raw/4.0master/docs/Symbol3D_class_diagram.png)
* The symbol class itself, e.g. `PointSymbol3D`, is merely a container for symbol layers and doesn't contain any symbology information. But it defines which type of geometry the symbol is applicable to: a `LineSymbol3D` can only be used for a graphic with `Polyline` geometry.
* Each symbol can have an arbitrary number of symbol layers. When a symbol is used on a graphic, all symbol layers are used simultaneously and independently to visualize the graphic's geometry.

Thus, the main elements of the symbology are actually the symbol layers.

### Canvas3DGraphicsLayerView overview

In order to manage the conversion from API Graphics/Symbols to WebGL engine objects, Canvas3DGraphicsLayerView creates an internal object for each `Graphic` and `Symbol` it encounters:
![](https://devtopia.esri.com/WebGIS/arcgis-js-api/raw/4.0master/docs/Canvas3D/Canvas3DGraphicsLayerView-class-diagram.png)
* For each `Symbol3D`, an instance of `Canvas3DSymbolSet` is created.
* For each *`Symbol3DLayer`, an instance of `Canvas3D*Symbol` is created (e.g. `LineSymbol3DLayer` -> `Canvas3DLineSymbol`) and added to the corresponding `Canvas3DSymbolSet`.
* For each `Graphic` added to the layer, an instance of `Canvas3DGraphicSet` is created. Within the `Canvas3DGraphicSet`, there is an instance of `Canvas3DGraphic` for each symbol layer of the graphic's symbol.

#### Canvas3D*Symbol
Most of the logic to manage the WebGL engine objects for symbols/graphics is in the `Canvas3D*Symbol` classes:
* Creator and owner of the WebGL engine objects that apply to the entire symbol (for example `Material`, or the `Texture` of an icon symbol).
* Factory for `Canvas3DGraphic` instances for this symbol layer type (factory method: `.createCanvas3DGraphic()`).
* Handle symbol and layer property changes by updating the WebGL engine objects contained in `Canvas3DGraphic` instances they created. 
  * Current example: layer property changes that affect the symbology (`opacity`, `elevationInfo`) are handled by `Canvas3D*Symbol.layerPropertyChanged()`.
  * Future example: it is planned that symbol layer changes (e.g. color) are also going to be handled that way.

#### Canvas3DGraphic
`Canvas3DGraphic` is mostly just a container for the WebGL engine objects that . It is not subclassed for the different symbol layer types, so it doesn't really know what the object it contains are. Its functions:
* Owner (but not creator) of the WebGL engine objects that are unique to each graphic (for example the `Geometry` objects for a line graphic).
* Show/hide the graphic based on different visibility criteria (e.g. scale range).
* Align the elevation of the graphic's geometry with terrain when terrain changes.

In summary `Canvas3DGraphic` objects are oblivious of what exactly they contain. Any operations that require detailed knowledge about the contained WebGL engine objects are handled by `Canvas3D*Symbol`.

### Graphics creation
According to the [GraphicsLayer design](https://devtopia.esri.com/prav5100/arcgis-js-api/blob/master/design/hydra/graphics-layer.png), Canvas3DGraphicsLayerView listens to changes in the layer's underlying graphics collection. Whenever a `Graphic` is added to the layer, Canvas3DGraphicsLayerView calls `add(graphics)` on itself. This method creates the necessary `Canvas3D*Symbol` and `Canvas3DGraphic` instances:
![](https://devtopia.esri.com/WebGIS/arcgis-js-api/raw/4.0master/docs/Canvas3D/C3DGLV-add-sequence-diagram.png)

