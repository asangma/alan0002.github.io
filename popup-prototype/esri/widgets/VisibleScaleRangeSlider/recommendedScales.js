define([
  "dojo/_base/lang"
],
function(
  lang
) {

  var recommendedScalesUtil = {

    _recommendedScales: {
      // property names match properties in:
      // nlsJsapi.widgets.visibleScaleRangeSlider.featuredScaleLabels
      world: 100000000,
      continent: 50000000,
      countriesBig: 25000000,
      countriesSmall: 12000000,
      statesProvinces: 6000000,
      stateProvince: 3000000,
      counties: 1500000,
      county: 750000,
      metropolitanArea: 320000,
      cities: 160000,
      city: 80000,
      town: 40000,
      neighborhood: 20000,
      streets: 10000,
      street: 5000,
      buildings: 2500,
      building: 1250,
      smallBuilding: 800,
      rooms: 400,
      room: 100
    },

    getRecommendedScale: function(id) {
      return recommendedScalesUtil._recommendedScales[id];
    },

    all: function() {
      return lang.clone(recommendedScalesUtil._recommendedScales);
    }
  };

  return recommendedScalesUtil;
});
