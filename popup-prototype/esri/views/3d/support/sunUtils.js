define([
  "./mathUtils",

  "../lib/glMatrix",
  "../lib/SunCalc"
], function(
  mathUtils,
  glMatrix, SunCalc
) {

  var vec3d = glMatrix.vec3d;
  var mat4d = glMatrix.mat4d;
  var lerp = mathUtils.lerp;

  var tmpTrafo = mat4d.identity();
  var tmpSunAngles = {
    azimuth: 0,
    altitude: 0
  };

  var lightSettings = {
    local: {
      altitude: 2000,  // up to this altitude, lighting will be in completely in local mode
      ambientAtNight: 0.2,
      ambientAtNoon: 0.75,
      ambientAtTwilight: 0.5,
      diffuseAtNoon: 0.25,
      diffuseAtTwilight: 0.5
    },
    global: {
      altitude: 20000,  // starting from this altitude, lighting will be completely in global mode
      ambient: 0.5,
      diffuse: 0.5
    }
  };

  var tmpLightingData = {
    ambient: {
      color: vec3d.create(),
      intensity: 0
    },
    diffuse: {
      color: vec3d.create(),
      intensity: 0,
      direction: vec3d.create()
    }
  };

  var sunUtils = {
    settings: lightSettings,
    computeDirection: function(date, position /* must be a point in WGS84 */, globeMode, result) {
      if (!result) {
        result = vec3d.create();
      }

      var sunAngles = tmpSunAngles;
      var trafo = mat4d.identity(tmpTrafo);
      if (globeMode === "spherical") {
        SunCalc.getPosition(date, 0, 0, sunAngles);
        vec3d.set3(0, 0, -1, result);
        mat4d.rotateX(trafo, -sunAngles.azimuth);
        mat4d.rotateY(trafo, -sunAngles.altitude);
        mat4d.multiplyVec3(trafo, result);
      } else {
        SunCalc.getPosition(date, position.y, position.x, sunAngles);
        vec3d.set3(0, -1, 0, result);
        mat4d.rotateZ(trafo, -sunAngles.azimuth);
        mat4d.rotateX(trafo, -sunAngles.altitude);
        mat4d.multiplyVec3(trafo, result);
      }
      return result;
    },

    computeColorAndIntensity: function(date, position /* must be a point in WGS84 */) {
      var altitude = position.z;
      var lightSettings = sunUtils.settings;

      var light = tmpLightingData;

      vec3d.set3(1, 1, 1, light.ambient.color);
      light.ambient.intensity = lightSettings.global.ambient;

      vec3d.set3(1, 1, 1, light.diffuse.color);
      light.diffuse.intensity = lightSettings.global.diffuse;

      var globalFactor = (altitude - lightSettings.local.altitude) /
        (lightSettings.global.altitude - lightSettings.local.altitude);
      globalFactor = mathUtils.clamp(globalFactor, 0, 1);
      if (globalFactor < 1) {

        var sunTimes = SunCalc.getTimes(date, position.y, position.x);
        var localLight = computeLocalLight(date, sunTimes);
        
        vec3d.lerp(localLight.ambient.color, light.ambient.color, globalFactor, light.ambient.color);
        light.ambient.intensity = lerp(localLight.ambient.intensity, light.ambient.intensity, globalFactor);
        
        vec3d.lerp(localLight.diffuse.color, light.diffuse.color, globalFactor, light.diffuse.color);
        light.diffuse.intensity = lerp(localLight.diffuse.intensity, light.diffuse.intensity, globalFactor);
      }
      return light;
    }
  };

  var computeLocalLight = function (date, sunTimes) {
    /*
     night - [sunsetA - sunset - sunsetB] - prenoon - noon - afternoon - [sunsetA - sunset - sunsetB] - night
     */
    
    var time = date.valueOf();
    var tsunrise, tsunset;
    if(sunTimes.polarException === SunCalc.POLAR_EXCEPTION.MIDNIGHT_SUN){
      // stretch day by by factor 6 to get neutral lighting around noon for the day range
      tsunrise = time - (date.getHours()+2*24) * 60*60*1000 - date.getMinutes() * 60 * 1000;
      tsunset = tsunrise + (5*24)*60*60*1000;
    }
    else if(sunTimes.polarException === SunCalc.POLAR_EXCEPTION.POLAR_NIGHT){
      // by setting both rise and set outside of time, we ensure night behaviour
      tsunrise = time-2;
      tsunset = time-1;
    }
    else {
      tsunrise = sunTimes.sunrise.valueOf();
      tsunset = sunTimes.sunset.valueOf();
    }
    

    var d_suntime = tsunset - tsunrise;

    var tnoon = tsunrise + d_suntime / 2; //FIXME: is this scientifically correct?
    var d_aroundnoon = d_suntime / 4; //~2 hours plus/minus noon;
    var tprenoon = tnoon - d_aroundnoon;
    var tafternoon = tnoon + d_aroundnoon;

    var d_rise    = d_suntime * 0.06; // ~0.7h sunset duration
    var d_set     = d_rise;
    var tsunriseA = tsunrise - d_rise / 2;
    var tsunriseB = tsunrise + d_rise / 2;
    var tsunsetA  = tsunset - d_set / 2;
    var tsunsetB  = tsunset + d_set / 2;

    // color and intensity settings
    var intensity = sunUtils.settings.local;

    var da_night = [0.01, intensity.ambientAtNight]; // diffuse, ambient intensity
    var ca_night = [0.8, 0.8, 1.0]; // ambient color
    var cd_night = [0.01, 0.01, 0.01]; // diffuse color

    var da_sunrisen = [intensity.diffuseAtTwilight, intensity.ambientAtTwilight];
    var cd_sunrisen = [1.0, 0.75, 0.75];
    var ca_sunrisen = [0.8, 0.8, 1.0];

    var da_prenoon = [0.9*intensity.diffuseAtNoon, intensity.ambientAtNoon];
    var cd_prenoon = [1.0, 0.98, 0.98];
    var ca_prenoon = [0.98, 0.98, 1.0];

    var da_noon = [intensity.diffuseAtNoon, intensity.ambientAtNoon];
    var cd_noon = [1, 1, 1];
    var ca_noon = [1, 1, 1];

    var da_afternoon = da_prenoon;
    var cd_afternoon = cd_prenoon;
    var ca_afternoon = ca_prenoon;

    var da_sunset = da_sunrisen;
    var cd_sunset = cd_sunrisen;
    var ca_sunset = ca_sunrisen;

    // output
    var da = [0, 0];
    var cd = [0, 0];
    var ca = [0, 0];

    var d;
    var timeOfDay;
    // night
    if (time < tsunriseA || time > tsunsetB) {
      da = da_night;
      cd = cd_night;
      ca = ca_night;
      timeOfDay = "night";
    }
    // night to sunrise done (sunrisen)
    else if (time < tsunriseB) {
      d = tsunriseB - tsunriseA;
      da = lerpV(time - tsunriseA, d, da_night, da_sunrisen);
      cd = lerpV(time - tsunriseA, d, cd_night, cd_sunrisen);
      ca = lerpV(time - tsunriseA, d, ca_night, ca_sunrisen);
      timeOfDay = "sun rising";
    }
    // sunrise done to prenoon
    else if (time < tprenoon) {
      d = tprenoon - tsunriseB;
      da = lerpV(time - tsunriseB, d, da_sunrisen, da_prenoon);
      cd = lerpV(time - tsunriseB, d, cd_sunrisen, cd_prenoon);
      ca = lerpV(time - tsunriseB, d, ca_sunrisen, ca_prenoon);
      timeOfDay = "early morning";
    }
    // prenoon to noon
    else if (time < tnoon) {
      d = tnoon - tprenoon;
      da = lerpV(time - tprenoon, d, da_prenoon, da_noon);
      cd = lerpV(time - tprenoon, d, cd_prenoon, cd_noon);
      ca = lerpV(time - tprenoon, d, ca_prenoon, ca_noon);
      timeOfDay = "late morning";
    }
    // noon to afternoon
    else if (time < tafternoon) {
      d = tafternoon - tnoon;
      da = lerpV(time - tnoon, d, da_noon, da_afternoon);
      cd = lerpV(time - tnoon, d, cd_noon, cd_afternoon);
      ca = lerpV(time - tnoon, d, ca_noon, ca_afternoon);
      timeOfDay = "early afternoon";
    }
    // afternoon to sunset start
    else if (time < tsunsetA) {
      d = tsunsetA - tafternoon;
      da = lerpV(time - tafternoon, d, da_afternoon, da_sunset);
      cd = lerpV(time - tafternoon, d, cd_afternoon, cd_sunset);
      ca = lerpV(time - tafternoon, d, ca_afternoon, ca_sunset);
      timeOfDay = "late afternoon";
    }
    //sunset start to sunset end
    else if (time < tsunsetB) {
      d = tsunsetB - tsunsetA;
      da = lerpV(time - tsunsetA, d, da_sunset, da_night);
      cd = lerpV(time - tsunsetA, d, cd_sunset, cd_night);
      ca = lerpV(time - tsunsetA, d, ca_sunset, ca_night);
      timeOfDay = "sun setting";
    }
    //console.log(sunTimes.polarException === 0 ? "Normal"  : (sunTimes.polarException === 1 ? "Midnight Sun" : "Polar night"));
    //console.log(timeOfDay);
    return {
      diffuse: {
        intensity: da[0],
        color: cd
      },
      ambient: {
        intensity: da[1],
        color: ca
      },
      timeOfDay: timeOfDay
    };
  };

  var lerpV = function(v, vrange, a,b) {
    var r = [];
    for (var i=0; i<a.length; i++){
      r[i] = (b[i]-a[i])*v/vrange + a[i];
    }
    return r;
  };

  return sunUtils;
});