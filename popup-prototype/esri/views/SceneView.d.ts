import Accessor = require("../core/Accessor");
import Camera = require("../Camera");
import Environment = require("../webscene/Environment");
import RenderCoordsHelper = require("./3d/support/RenderCoordsHelper");
import SceneViewEnvironmentManager = require("./3d/environment/SceneViewEnvironmentManager");
import Map = require("../Map");
import ViewAnimation = require("./ViewAnimation");
import Viewpoint = require("../Viewpoint");

import {
  Screenshot,
  ScreenshotOptions
} from "./3d/interfaces";

declare class SceneView extends Accessor {
  viewpoint: Viewpoint;
  camera: Camera;
  environment: Environment;
  renderCoordsHelper: RenderCoordsHelper;
  environmentManager: SceneViewEnvironmentManager;
  map: Map;

  animateTo(target: Camera, options?: Object): IPromise<ViewAnimation, any>;
  takeScreenshot(options: ScreenshotOptions): IPromise<Screenshot, void>;
}

export = SceneView;
