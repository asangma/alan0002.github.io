/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

define([], function() {

  var unitBezier = function unitBezier(p1x, p1y, p2x, p2y) {
    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
    var cx = 3.0 * p1x;
    var bx = 3.0 * (p2x - p1x) - cx;
    var ax = 1.0 - cx -bx;

    var cy = 3.0 * p1y;
    var by = 3.0 * (p2y - p1y) - cy;
    var ay = 1.0 - cy - by;

    function sampleCurveX(t) {
      // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
      return ((ax * t + bx) * t + cx) * t;
    }

    function sampleCurveY(t) {
      return ((ay * t + by) * t + cy) * t;
    }

    function sampleCurveDerivativeX(t) {
      return (3.0 * ax * t + 2.0 * bx) * t + cx;
    }

    // Given an x value, find a parametric value it came from.
    function solveCurveX(x, epsilon) {
      var t0, t1, t2, x2, d2, i;

      epsilon = epsilon == null ? 1e-6 : epsilon;

      // First try a few iterations of Newton's method -- normally very fast.
      for (t2 = x, i = 0; i < 8; i++) {
        x2 = sampleCurveX(t2) - x;
        if (Math.abs(x2) < epsilon) {
          return t2;
        }
        d2 = sampleCurveDerivativeX(t2);
        if (Math.abs(d2) < 1e-6) {
          break;
        }
        t2 = t2 - x2 / d2;
      }

      // Fall back to the bisection method for reliability.
      t0 = 0.0;
      t1 = 1.0;
      t2 = x;

      if (t2 < t0) {
        return t0;
      }
      if (t2 > t1) {
        return t1;
      }

      while (t0 < t1) {
        x2 = sampleCurveX(t2);
        if (Math.abs(x2 - x) < epsilon) {
          return t2;
        }
        if (x > x2) {
          t0 = t2;
        }
        else {
          t1 = t2;
        }
        t2 = (t1 - t0) * .5 + t0;
      }

      // Failure.
      return t2;
    }

    return function solve(x, epsilon) {
      return sampleCurveY(solveCurveX(x, epsilon));
    }
  };

  var regex = /^cubic-bezier\((.*)\)/;

  unitBezier.parse = function(str) {
    var fn = unitBezier[str] || null;
    if (!fn) {
      var result = regex.exec(str);
      if (result) {
        // find the 4 numbers
        var components = result[1].split(",").map(function(v) {
          return parseFloat(v.trim());
        });
        // no NaN value please
        if (components.length === 4 && !components.some(function(c) { return isNaN(c); })) {
          fn = unitBezier.apply(unitBezier, components);
        }
      }
    }
    return fn;
  };

  unitBezier.ease      = unitBezier(0.25, 0.10, 0.25, 1.00);
  unitBezier.linear    = unitBezier(0.00, 0.00, 1.00, 1.00);
  unitBezier.easeIn    = unitBezier["ease-in"]     = unitBezier(0.42, 0.00, 1.00, 1.00);
  unitBezier.easeOut   = unitBezier["ease-out"]    = unitBezier(0.00, 0.00, 0.58, 1.00);
  unitBezier.easeInOut = unitBezier["ease-in-out"] = unitBezier(0.42, 0.00, 0.58, 1.00);

  return unitBezier;

});
