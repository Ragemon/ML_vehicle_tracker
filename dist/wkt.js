require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @author - DeepMetrics
 * @description adapted from OpenLayers 2.11 implementation.
 * @modified 2016
 */
module.exports = WKTReader;
/**
 * A <code>wktreader</code> is parameterized by a <code>GeometryFactory</code>,
 * to allow it to create <code>Geometry</code> objects of the appropriate
 * implementation. In particular, the <code>GeometryFactory</code> determines
 * the <code>PrecisionModel</code> and <code>SRID</code> that is used.
 * <P>
 */
function WKTReader() {
  "use strict";
  if (!(this instanceof WKTReader)) {
    return new WKTReader();
  }

  this.regExes = {
    'typeStr'         : /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/,
    'emptyTypeStr'    : /^\s*(\w+)\s*EMPTY\s*$/,
    'spaces'          : /\s+/,
    'parenComma'      : /\)\s*,\s*\(/,
    'doubleParenComma': /\)\s*\)\s*,\s*\(\s*\(/, // can't use {2} here
    'trimParens'      : /^\s*\(?(.*?)\)?\s*$/
  };
}

/**
 * @description prototype
 * @type {Function}
 */
var proto = WKTReader.prototype;

/**
 * @description deserialize a WKT string and return a geometry. Supports WKT for POINT,
 * MULTIPOINT, LINESTRING, LINEARRING, MULTILINESTRING, POLYGON, MULTIPOLYGON,
 * and GEOMETRYCOLLECTION.
 * @param wkt{String} - wkt A WKT string.
 * @return {Array} A geometry array.
 */
proto.read = function (wkt) {
  var geometry, type, str;
  wkt = wkt.replace(/[\n\r]/g, ' ');
  var matches = this.regExes.typeStr.exec(wkt);

  if (wkt.search('EMPTY') !== -1) {
    matches = this.regExes.emptyTypeStr.exec(wkt);
    matches[2] = undefined;
  }

  if (matches) {
    type = matches[1].toLowerCase();
    str = matches[2];
    this[type] && (geometry = this[type](str));
  }

  if (geometry === undefined) {
    throw new Error('Could not parse WKT ' + wkt);
  }
  return geometry;
};

/**
 * Return point geometry given a point WKT fragment.
 * @param str{String} - str A WKT fragment representing the point.
 * @return {Array} A point geometry.
 */
proto.point = function (str) {
  if (str === undefined || str === '') {
    throw new Error("wkt point not passed");
  }
  var coords = str.trim().split(this.regExes.spaces);
  return coords.map(parseFloat)
};

/**
 * Return a lineString geometry given a lineString WKT fragment.
 * @param str{String} - A WKT fragment representing the lineString.
 * @return {Array} A lineString coodinate list.
 */
proto.stringCoordinates = function (str) {
  if (str === undefined || str === '') {
    throw new Error("coordinate list not passed");
  }

  var points = str.trim().split(',');
  var n = points.length, coords;
  var components = [];

  for (var i = 0; i < n; ++i) {
    coords = points[i].trim().split(this.regExes.spaces);
    components[i] = coords.map(parseFloat);
  }

  return components;
};
/**
 * Return a lineString geometry given a lineString WKT fragment.
 * Notes: name is all lowercase because of programmatic access from read
 * @param str{String} - A WKT fragment representing the lineString.
 * @return {Array} A lineString geometry.
 */
proto.linestring = function (str) {
  if (str === undefined || str === '') {
    throw new Error("coordinate list not passed");
  }
  return this.stringCoordinates(str)
};

/**
 * Return a linearring geometry given a linearring WKT fragment.
 * @param str{String} - A WKT fragment representing the linearring.
 * @return {Array} A linearring geometry.
 */
proto.linearring = function (str) {
  if (str === undefined || str === '') {
    throw new Error("coordinate list is empty");
  }
  return this.stringCoordinates(str)
};

/**
 * Return a polygon geometry given a polygon WKT fragment.
 * @param str{String} - A WKT fragment representing the polygon.
 * @return {Array} A polygon geometry.
 */
proto.polygon = function (str) {
  if (str === undefined || str === '') {
    throw new Error('wkt fragement not passed')
  }
  var ring, components;
  var rings = str.trim().split(this.regExes.parenComma);
  var n = rings.length;
  var shell, holes = [];
  for (var i = 0; i < n; i++) {
    ring = rings[i].replace(this.regExes.trimParens, '$1');
    components = this.stringCoordinates(ring);
    (i == 0) && (shell = components);
    (i > 0) && (holes[i - 1] = components);
  }
  return holes.length ? [shell, holes] : [shell];
};


},{}],"wkt":[function(require,module,exports){
/**
 * @author - DeepMetrics
 */
var isNode = new Function("try {return this===global;}catch(e){return false;}");
var _;
isNode() ? (_ = require('lodash')) : (_ = require("ldash"));
var WKTReader = require("./WKTReader");

/**
 * @module exports
 * @type {{getTypeWKT: getTypeWKT}}
 */
module.exports = {
  type_of_wkt : type_of_wkt,
  wkt_to_array: wkt_to_array,
  WKTReader : WKTReader
};

/**
 * @description get the type of wkt string
 * @param wkt
 * @returns {String||undefined}
 */
function type_of_wkt(wkt) {
  "use strict";

  if (_.isEmpty(wkt)) {
    return undefined;
  }

  wkt = wkt.replace(/[\n\r]/g, ' ');
  var regtype = /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/;
  var matches = regtype.exec(wkt);
  var type = undefined;

  if (!_.isEmpty(matches)) {
    type = matches[1].toLowerCase();
  }
  return type;
}

/**
 * @description convert wkt string to array of coordinates [[lat, lng]]
 * @param wktstr{String}
 * @param [reverse]{Boolean}
 * @returns {Array}
 */
function wkt_to_array(wktstr, reverse) {
  "use strict";

  var coords;
  var type = type_of_wkt(wktstr);
  var reader = new WKTReader();
  reverse = !(!reverse);

  if (type == 'linestring' || type == 'point') {
    coords = reader.read(wktstr);
  }
  else {
    coords = reader.read(wktstr);
  }
  //if reverse, reverse coordinates
  reverse &&  _reverseCoordinates(coords);
  return   coords;
}

/**
 * @description lng lat to lat lng
 * @param coords
 * @private
 */
function _reverseCoordinates(coords) {
  "use strict";
  if (_.isArray(coords) && _.isArray(coords[0])) {
    for (var i = 0; i < coords.length; ++i) {
      _reverseCoordinates(coords[i])
    }
    return;
  }
  if (_.isArray(coords)) {
    coords.reverse()
  }
}


},{"./WKTReader":1,"ldash":undefined,"lodash":undefined}]},{},[])

