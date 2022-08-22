require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @module - bounds
 * @description -
 * author: titus
 * date: 05/01/16
 * time: 10:12 AM
 */
var _ = require("ldash");
var coord = require("./coord");

/**
 * @type {bounds}
 */
module.exports = bounds;


/**
 * @description lat lng bounds: if array is passed expects array to be
 * lower left [x, y] and  upper right [x, y] or google.maps.LatLngBounds
 * call without arguments will return an empty bounds
 * @param ll - lower left as latlng or [x, y]
 * @param ur - lower left as latlng or [x, y]
 * @returns {google.maps.LatLngBounds}
 */
function bounds(ll, ur) {
  "use strict";
  var x = 0, y = 1, latlng = coord.latlng;

  if ((ll instanceof google.maps.LatLng) && (ur instanceof google.maps.LatLng)) {
    return new google.maps.LatLngBounds(latlng(ll), latlng(ur));
  }
  else if (arguments.length > 1 && _.isArray(ll) && _.isArray(ur)) {
   return  new google.maps.LatLngBounds(
     latlng(ll[y], ll[x]), latlng(ur[y], ur[x])
   );
  }
  else if (arguments.length == 1 && ll instanceof google.maps.LatLngBounds) {
    return bounds(ll.getSouthWest(), ll.getNorthEast());
  }
  return new google.maps.LatLngBounds();
}



},{"./coord":3,"ldash":undefined}],2:[function(require,module,exports){
/**
 * @module - bounds_origin_aspt
 * @description -
 * author: titus
 * date: 05/01/16
 * time: 9:41 AM
 */
var coord = require("./coord");
/**
 * @module exports
 * @type {bounds_origin_aspt}
 */
module.exports = bounds_origin_aspt;

/**
 *@description map bounds origin (top left corner as point)
 * world coordinates
 * @param map
 * @return Object - {x, y}
 */
function bounds_origin_aspt(map) {
  "use strict";

  var bounds = map.getBounds();
  var proj = map.getProjection();

  return proj.fromLatLngToPoint(
    coord.latlng(
      bounds.getNorthEast().lat(),
      bounds.getSouthWest().lng()
    )
  );
}
},{"./coord":3}],3:[function(require,module,exports){
/**
 * @module - latlng
 * author: titus
 * date: 05/01/16
 * time: 10:03 AM
 */
var _ = require("ldash");

/**
 * @type {{latlng: Function, lnglat: Function}}
 */
module.exports = {latlng: latlng, lnglat: lnglat};


/**
 * @description lnglat
 * @param lng
 * @param lat
 * @returns {*}
 */
function lnglat(lng, lat) {
  "use strict";
  if (lng instanceof google.maps.LatLng && _.isUndefined(lat)) {
    lat = lng.lat();
    lng = lng.lng();
  }
  else if (_.isArray(lng) && _.isNumber(lng[0]) && _.isUndefined(lat)) {
    lat = lng[1];
    lng = lng[0];
  }
  return latlng(lat, lng);
}


/**
 * @description latlng
 * @param lat
 * @param lng
 */
function latlng(lat, lng) {
  "use strict";
  var obj = null;

  if (_.isNumber(lat) && _.isNumber(lng)) {
    obj = new google.maps.LatLng(lat, lng);
  }
  else if (lng === undefined && lat instanceof google.maps.LatLng) {
    obj = new google.maps.LatLng(lat.lat(), lat.lng());
  }
  else {
    throw new Error("lat lng expects numeric values of lat and lng / instance of google.maps.LatLng");
  }
  return obj;
}
},{"ldash":undefined}],4:[function(require,module,exports){
/**
 * @module - service
 * @description -
 * author: titus
 * date: 05/01/16
 * time: 10:18 AM
 */
var _ = require("ldash");
/**
 * @module exports
 * @type {fetch_max_zoom}
 */
module.exports = fetch_max_zoom;
/**
 * @description fetch maximum zoom from google maxZoomService
 * at a given lat and lng
 * @param lat
 * @param lng
 * @param callback
 */
function fetch_max_zoom(lat, lng, callback) {
  "use strict";
  if (lat instanceof google.maps.LatLng) {
    callback = lng;
    lng = lat.lng();
    lat = lat.lat();
    arguments.length = 3
  }

  if (!(_.isNumber(lat) || _.isNumber(lng))) {
    throw new Error('fetch_max_zoom : lat::Number, lng::Number, expects a number')
  }

  if (!_.isFunction(callback)) {
    throw new Error('fetch_max_zoom : callback is not a function');
  }

  var maxZoomService = new google.maps.MaxZoomService();
  var latlng = new google.maps.LatLng(lat, lng);

  maxZoomService.getMaxZoomAtLatLng(latlng, function (response) {
    if (response.status == google.maps.MaxZoomStatus.OK) {
      return callback(response.zoom);
    }
    return callback(undefined);
  });
}
},{"ldash":undefined}],5:[function(require,module,exports){
/**
 * Author: DeepMetrics
 * Date: 2015-01-13
 * Time: 3:48 PM
 */
var isNode = new Function("try {return this===global;}catch(e){return false;}");
var _;

isNode() ? (_ = require("lodash")) : (_ = require("ldash"));

/**
 * @description geolocate by address
 */
module.exports = {
  address            : _address,
  administrative_area: _admin_area
};
/**
 * @description geolocate address
 * @param address
 * @param callback
 * @private
 */
function _address(address, callback) {
  "use strict";
  var latlngs = [];
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({'address': address}, function (results, status) {
    var error = new Error('geom.geolocate.address :an error occurred');
    if (status === google.maps.GeocoderStatus.OK) {
      error = null;
      latlngs = _.map(results, function (g) {
        var loc = g.geometry.location;
        return {
          coordinate: [loc.lat(), loc.lng()],
          address   : g.formatted_address,
          match     : g.partial_match,
          types     : g.types.join(",")
        };
      });
    }
    _.isFunction(callback) && callback(latlngs, error);
  });
}
/**
 * @description reverse geolocation address using lat & lng
 * @param lat
 * @param lng
 * @param callback{Function} - returns {null || [region , country]}
 */
function _admin_area(lat, lng, callback) {
  "use strict";
  var geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(lat, lng);
  geocoder.geocode({'location': latlng}, gcoder_callback);

  function gcoder_callback(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      if (!_.isEmpty(results)) {
        var admin_area = _.filter(results, function (loc) {
          var type = loc.types.join("|");
          return type.indexOf('administrative') != -1;
        });
        admin_area = _.map(admin_area, function (loc) {
          var comps = _.map(loc.address_components, function (c) {
            return c.long_name;
          });
          return comps.slice(comps.length - 2);
        });
        _.isFunction(callback) && callback(_.first(admin_area));
        return;
      }
    }
    _.isFunction(callback) && callback(null);
  }
}

},{"ldash":undefined,"lodash":undefined}],6:[function(require,module,exports){
/**
 * @module - latlng_to_pixel
 * @description -
 * author: titus
 * date: 05/01/16
 * time: 9:39 AM
 */
var _ = require("ldash");
var coord = require("./coord");
var bounds_origin = require("./bounds_origin_aspt");

/**
 * @module exports
 * @type {latlng_to_pixel}
 */
module.exports = latlng_to_pixel;
/**
 * @description from lat lng to pixel
 * @param map
 * @param lat{LatLng|Number}
 * @param lng{Number}
 * @returns {*}
 */
function latlng_to_pixel(map, lat, lng) {
  "use strict";
  var position = _.isNumber(lat) ? coord.latlng(lat, lng) : lat;
  var numtiles = Math.pow(2, map.getZoom());
  var proj = map.getProjection();

  var origin = bounds_origin(map);
  var point = proj.fromLatLngToPoint(position);

  return new google.maps.Point(
    Math.floor((point.x - origin.x) * numtiles),
    Math.floor((point.y - origin.y) * numtiles)
  );
}
},{"./bounds_origin_aspt":2,"./coord":3,"ldash":undefined}],7:[function(require,module,exports){
/**
 * @module - pixel_to_latlng
 * @description -
 * author: titus
 * date: 05/01/16
 * time: 9:34 AM
 */

var bounds_origin = require("./bounds_origin_aspt");

/**
 * @type {pixel_to_latlng}
 */
module.exports = pixel_to_latlng;

/**
 * @description from pixel to lat lng
 * @param map
 * @param x
 * @param y
 */
function pixel_to_latlng(map, x, y) {
  "use strict";
  var px, py;
  if (_.isNumber(x)) {
    px = x;
    py = y;
  }
  else {
    px = x.x;
    py = x.y;
  }

  var numtiles = Math.pow(2, map.getZoom());
  var proj = map.getProjection();
  var origin = bounds_origin(map);

  var point = new google.maps.Point(
    (px / numtiles) + origin.x,
    (py / numtiles) + origin.y
  );

  return proj.fromPointToLatLng(point);
}


},{"./bounds_origin_aspt":2}],"gmaps":[function(require,module,exports){
/**
 * @author - DeepMetrics
 * @description google utils
 */
var bounds          = require("./bounds");
var coord           = require("./coord");
var geolocate       = require("./geolocate");
var fetch_max_zoom  = require("./fetch_max_zoom");
var pixel_to_latlng = require("./pixel_to_latlng");
var latlng_to_pixel = require("./latlng_to_pixel");

/**
 *
 * @type {
   {latlng: Function, lnglat: Function, bounds: bounds, fetch_max_zoom: fetch_max_zoom,
   pixel_to_latlng: pixel_to_latlng, latlng_to_pixel: latlng_to_pixel, geolocate: *}
 }
 */
module.exports = {
  bounds         : bounds,
  latlng         : coord.latlng,
  lnglat         : coord.lnglat,
  geolocate      : geolocate,
  fetch_max_zoom : fetch_max_zoom,
  pixel_to_latlng: pixel_to_latlng,
  latlng_to_pixel: latlng_to_pixel
};












},{"./bounds":1,"./coord":3,"./fetch_max_zoom":4,"./geolocate":5,"./latlng_to_pixel":6,"./pixel_to_latlng":7}]},{},[])

