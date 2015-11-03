/* jshint forin:false */
define([
  "./Util"
  ], function (Util) {

  var AmbientLight = function(color, intensity, ssao, ssaoAttenuation, ssaoRadius, ssaoFilterRadius, ssaoSamples) {
    this.color = color;
    this.intensity = intensity;
    this.ssao = ssao;
    this.ssaoAttenuation = ssaoAttenuation;
    this.ssaoRadius = ssaoRadius;
    this.ssaoFilterRadius = ssaoFilterRadius;
    this.ssaoSamples = ssaoSamples;

    this.set = function(data) {
      for (var name in this) {
        if (name != "set") {
          Util.setIfDefined(name, data, this);
        }
      }
    };
  };

  var DirectionalLight = function(color, intensity, direction, shadows, shadowAttenuation) {
    this.color = color;
    this.intensity = intensity;
    this.direction = direction;
    this.shadowMap = shadows;
    this.shadowAttenuation = shadowAttenuation;

    this.set = function(data) {
      for (var name in this) {
        if (name != "set") {
          Util.setIfDefined(name, data, this);
        }
      }
    };
  };

  return {
    AmbientLight: AmbientLight,
    DirectionalLight: DirectionalLight
  };
});