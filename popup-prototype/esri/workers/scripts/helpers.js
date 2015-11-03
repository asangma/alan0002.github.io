var merge = function(newProps, seedObj, scope){
    if(newProps && typeof newProps == 'object'){
        seedObj = seedObj || {};
        Object.keys(newProps).forEach(function(key){
            if(newProps[key] !== undefined){
                seedObj[key] = newProps[key];
            }
        }, scope || this);
    }
    return seedObj;
};

var mixin = function(target, newProps){
    return merge(newProps, target.prototype);
};

var geomToBbox = function(geom){
    var bbox=[], i;
    //point
    if((geom.x != null) && (geom.y != null)){
       return [geom.x,geom.y,geom.x,geom.y]; 
    }
    //multipoint
    else if(geom.points){
        var pts = geom.points, len = pts.length;
        i = -1;
        while(++i < len){
            bbox = collectExtent(bbox, pts[i]);
        }
        return bbox;
    }
    //polyline, multipolyline, polygon, multipolygon
    else if(geom.paths || geom.rings){
        var polys = geom.paths || geom.rings;
        var outLen = polys.length;
        var inLen, poly, j;
        i = -1;
        while(++i < outLen){
            poly = polys[i];
            inLen = poly.length;
            j = -1;
            while(++j < inLen){
                bbox = collectExtent(bbox, poly[j]);
            }
        }
        return bbox;
    }
    function collectExtent(bound, point){
        if(!bound.length){
            bound = [Infinity, Infinity, -Infinity, -Infinity];
        }
        if(point[0]<bound[0]){
            bound[0] = point[0];
        }
        if(point[1]<bound[1]){
            bound[1]=point[1];
        }
        if(point.length > 2){ //using bboxes not points
            if(point[2]>bound[2]){
                bound[2] = point[2];
            }
            if(point[3]>bound[3]){
                bound[3] = point[3];
            }
        } else {
            if(point[0]>bound[2]){
                bound[2]=point[0];
            }
            if(point[1]>bound[3]){
                bound[3]=point[1];
            }
        }
        return bound;
    }
};