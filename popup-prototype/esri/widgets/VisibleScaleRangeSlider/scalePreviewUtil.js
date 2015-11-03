define([
    "dojo/_base/array",
    "require"
  ],
  function (
    array,
    require
  ) {
    var scalePreviewUtil = {

      _supportedRegions: [
        "ar-iq",
        "ar-kw",
        "bg-bg",
        "cs-cz",
        "da-dk",
        "da-gl",
        "da-gl",
        "de-at",
        "de-ch",
        "de-de",
        "de-li",
        "el-gr",
        "en-ae",
        "en-au",
        "en-ca",
        "en-ca",
        "en-eg",
        "en-gb",
        "en-hk",
        "en-id",
        "en-ie",
        "en-ie",
        "en-il",
        "en-in",
        "en-iq",
        "en-ke",
        "en-lu",
        "en-mo",
        "en-my",
        "en-nz",
        "en-rw",
        "en-sg",
        "en-us",
        "en-us",
        "en-vi",
        "en-vi",
        "en-wo",
        "en-za",
        "es-ar",
        "es-ar",
        "es-bo",
        "es-bo",
        "es-cl",
        "es-cl",
        "es-co",
        "es-co",
        "es-cr",
        "es-cr",
        "es-es",
        "es-gt",
        "es-gt",
        "es-mx",
        "es-mx",
        "es-ni",
        "es-ni",
        "es-pe",
        "es-pe",
        "es-pr",
        "es-pr",
        "es-sv",
        "es-sv",
        "es-ve",
        "et-ee",
        "fi-fi",
        "fi-fi",
        "fr-ci",
        "fr-fr",
        "fr-ma",
        "fr-mg",
        "fr-ml",
        "fr-tn",
        "is-is",
        "is-is",
        "it-it",
        "ja-jp",
        "ja-jp",
        "ko-kr",
        "lt-lt",
        "lv-lv",
        "nl-be",
        "nl-nl",
        "nl-sr",
        "nl-sr",
        "nn-no",
        "nn-no",
        "pl-pl",
        "pt-br",
        "pt-br",
        "pt-pt",
        "ro-ro",
        "ru-ru",
        "sk-sk",
        "sv-se",
        "sv-se",
        "th-th",
        "zh-cn",
        "zh-tw"
      ],

      _defaultRegion: "en-us",

      _getSupportedRegion: function (region) {
        region = region ? region.toLowerCase() : "";
        var isSupported = array.indexOf(scalePreviewUtil._supportedRegions, region) > -1;
        return isSupported ? region : scalePreviewUtil._defaultRegion;
      },

      getScalePreviewSource: function (region) {
        var scalePreviewSpriteSheetUrl = "./images/scalePreview/" + scalePreviewUtil._getSupportedRegion(region) + ".jpg";
        return "url(" + require.toUrl(scalePreviewSpriteSheetUrl) + ")";
      },

      getScalePreviewSpriteBackgroundPosition: function (index) {
        var tileOffsetH = 128,
            tileOffsetW = 128,

            spriteTileColumns = 5,

            imageLeft = tileOffsetW * (index % spriteTileColumns),
            imageTop = tileOffsetH * Math.floor(index / spriteTileColumns);

        return "-" + imageLeft + "px -" + imageTop + "px";
      }
    };

    return scalePreviewUtil;
  });
