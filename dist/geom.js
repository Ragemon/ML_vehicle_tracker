function isNode() {
	try {
		return this === global;
	} catch(e) {
		return false;
	}
}
require = (function e(t, n, r) {
	function s(o, u) {
		if(!n[o]) {
			if(!t[o]) {
				var a = typeof require === "function" && require;
				if(!u && a)return a(o, !0);
				if(i)return i(o, !0);
				var f = new Error("Cannot find module '" + o + "'");
				throw f.code = "MODULE_NOT_FOUND", f
			}
			var l = n[o] = {exports: {}};
			t[o][0].call(l.exports, function(e) {
				var n = t[o][1][e];
				return s(n ? n : e)
			}, l, l.exports, e, t, n, r)
		}
		return n[o].exports
	}

	var i = typeof require === "function" && require;
	for(var o = 0; o < r.length; o++)s(r[o]);
	return s
})({
	1: [function(require, module, exports) {
		/**
		 * @module - centroid
		 * @author: DeepMetrics
		 * date: 16/07/15
		 * time: 4:45 AM
		 */

		/**
		 * @module exports
		 * @type {centroid}
		 */
		module.exports = centroid;
		/**
		 * @description compute the geometric mean centroid of a polygon
		 * input coordinates = [[x, y], [x, y],...]
		 * @param coordinates
		 * @returns {*[]}
		 */
		function centroid(coordinates) {
			"use strict";
			if(!Array.isArray(coordinates) || !Array.isArray(coordinates[0])) {
				throw new Error("invalid data type");
			}

			var x    = 0, y = 1;
			var xSum = 0.0;
			var ySum = 0.0;
			var len  = coordinates.length;

			for(var i = 0; i < coordinates.length; ++i) {
				xSum += coordinates [i][x];
				ySum += coordinates [i][y];
			}
			return [xSum / len, ySum / len];
		}

	}, {}], 2: [function(require, module, exports) {
		/**
		 * @module - MBR
		 * @description - minimum bounding this
		 * author: DeepMetrics
		 * date: 05/06/15
		 * time: 2:02 PM
		 */
		var isNode = new Function("try {return this===global;}catch(e){return false;}");
		var _;

		isNode() ? (_ = require("lodash")) : (_ = require("ldash"));

		/**
		 * @description - module exports
		 * @type {MBR}
		 */
		module.exports = MBR;

		/**
		 * @description MBR
		 * @param x1
		 * @param y1
		 * @param x2
		 * @param y2
		 * @constructor
		 */
		function MBR(x1, y1, x2, y2) {
			"use strict";
			var x = 0, y = 0;
			var p1, p2;

			if(not(this instanceof MBR)) {
				return new MBR(x1, y1, x2, y2);
			}
			var undef = _.chain([x1, y1, x2, y2]).map(_.isUndefined).value();

			var args_2 = not(undef[0]) && not(undef[1]) && undef[2] && undef[3];

			var args_1 = not(args_2) && not(undef[0]) && undef[1] && undef[2] && undef[3];

			if(args_2 && isPt(x1) && isPt(y1)) {
				//[x,y], [x,y]
				p1 = x1;
				p2 = y1;

				x1 = p1[x];
				y1 = p1[y];
				x2 = p2[x];
				y2 = p2[y];
			}
			else if(args_1 && _.isArray(x1) && _.size(x1) >= 2 && isPt(x1[0])) {
				//[[x,y],[x,y]]
				p1 = x1[0];
				p2 = x1[1];

				x1 = p1[x];
				y1 = p1[y];
				x2 = p2[x];
				y2 = p2[y];
			}
			else if(args_1 && x1 instanceof MBR) {
				y1 = x1.miny;
				y2 = x1.maxy;
				x2 = x1.maxx;
				x1 = x1.minx;
			}
			else if(args_1 && _.isObject(x1) && _.has(x1, 'minx')) {
				y1 = x1.miny;
				y2 = x1.maxy;
				x2 = x1.maxx;
				x1 = x1.minx;
			}
			else {
				var valid = _.isNumber(x1) && _.isNumber(y1) &&
					_.isNumber(x2) && _.isNumber(y2);
				if(!valid) {
					throw new Error('MBR: invalid args , expects x1, y1, x2, y2 or ' +
						'MBR or [x1, y1], [x2, y2] or [[x1, y1], [x2, y2]]');
				}
			}

			return this._initmbr(x1, x2, y1, y2)
		}

		/**
		 * @description mbr proto
		 */
		var proto = MBR.prototype;

		/**
		 * @description init mbr
		 * @param x1
		 * @param x2
		 * @param y1
		 * @param y2
		 * @returns {MBR}
		 * @private
		 */
		proto._initmbr = function(x1, x2, y1, y2) {
			"use strict";
			if(x1 < x2) {
				this.minx = x1;
				this.maxx = x2;
			}
			else {
				this.minx = x2;
				this.maxx = x1;
			}

			if(y1 < y2) {
				this.miny = y1;
				this.maxy = y2;
			}
			else {
				this.miny = y2;
				this.maxy = y1
			}
			return this;
		};

		/**
		 * @description
		 * @returns {MBR}
		 */
		proto.clone = function() {
			return new MBR(this)
		};
		/**
		 * @description
		 * @returns {Array}
		 */
		proto.toArray = function() {
			return [[this.minx, this.miny], [this.maxx, this.maxy]]
		};

		/**
		 * @description equals
		 * @param other
		 * @returns {*}
		 */
		proto.equals = function(other) {
			"use strict";
			return _floatequal(this.maxx, other.maxx) &&
				_floatequal(this.maxy, other.maxy) &&
				_floatequal(this.minx, other.minx) &&
				_floatequal(this.miny, other.miny)
		};

		/**
		 * @description returns the difference between
		 *  the maximum and minimum x values.
		 * @returns {number}
		 */
		proto.width = function() {
			"use strict";
			return this.maxx - this.minx;
		};
		/**
		 * @description  returns the difference between
		 *  the maximum and minimum y values.
		 * @returns {number}
		 */
		proto.height = function() {
			"use strict";
			return this.maxy - this.miny;
		};
		/**
		 * @description area
		 * @returns {number}
		 */
		proto.area = function() {
			"use strict";
			return this.height() * this.width();
		};
		/**
		 * @description computes the intersection
		 * between this and other mbr
		 * @param other{MBR|Array}
		 * @returns {MBR|undefined}
		 */
		proto.intersection = function(other) {
			"use strict";
			var minx, miny, maxx, maxy;
			if(other instanceof MBR && this.intersectsMBR(other)) {
				minx = this.minx > other.minx ? this.minx : other.minx;
				miny = this.miny > other.miny ? this.miny : other.miny;
				maxx = this.maxx < other.maxx ? this.maxx : other.maxx;
				maxy = this.maxy < other.maxy ? this.maxy : other.maxy;
				return new MBR(minx, miny, maxx, maxy);
			}
			else if(isPt(other) && this.intersectsPoint(other)) {
				minx = maxx = other [0];
				miny = maxy = other [1];
				return new MBR(minx, miny, maxx, maxy);
			}
			return void 0;
		};

		/**
		 * @description true if the given point lies in or on the mbr.
		 * @param x{Number}
		 * @param y{Number}
		 * @returns {Boolean}
		 */
		proto.containsXY = function(x, y) {
			"use strict";
			if(arguments.length == 1 && isPt(x)) {
				y = x[1];
				x = x[0];
			}
			return (x >= this.minx) &&
				(x <= this.maxx) &&
				(y >= this.miny) &&
				(y <= this.maxy);
		};

		/**
		 * @description true if the given point lies in or on the mbr.
		 * @param x{Number}
		 * @param y{Number}
		 * @returns {Boolean}
		 */
		proto.completelyContainsXY = function(x, y) {
			"use strict";
			if(arguments.length == 1 && isPt(x)) {
				y = x[1];
				x = x[0];
			}
			return (x > this.minx) && (x < this.maxx) && (y > this.miny) && (y < this.maxy);
		};

		/**
		 * @description contains mbr
		 * @param other{MBR}
		 * @returns {Boolean}
		 */
		proto.containsMBR = function(other) {
			"use strict";
			return (other.minx >= this.minx) &&
				(other.maxx <= this.maxx) &&
				(other.miny >= this.miny) &&
				(other.maxy <= this.maxy);
		};

		/**
		 * @description contains completely other mbr (no boundary touch)
		 * @param other{MBR}
		 * @returns {Boolean}
		 */
		proto.completelyContainsMBR = function(other) {
			"use strict";
			return (
			(other.minx > this.minx) && (other.maxx < this.maxx) &&
			(other.miny > this.miny) && (other.maxy < this.maxy));
		};

		/**
		 * @description disjoint query
		 * @param q0{MBR|Array}
		 * @param [q1]{Array}
		 * @returns {Boolean}
		 */
		proto.disjoint = function(q0, q1) {
			"use strict";
			if(arguments.length == 1 && isPt(q0)) {
				return not(this.intersectsPoint(q0));
			}
			else if(arguments.length == 1 && (q0 instanceof MBR)) {
				return not(this.intersectsMBR(q0));
			}
			else if(arguments.length == 2 && isPt(q0) && isPt(q1)) {
				return not(this.intersectsBounds(q0, q1));
			}
			throw new Error('invalid args , disjoint expects Point, MBR or {pt0, pt1}' +
				' as extremal bounds')
		};

		/**
		 * @description checks if  mbr intersects other{mbr, point, bounds)
		 * @param other
		 * @returns {boolean}
		 */
		proto.intersects = function(other) {
			"use strict";
			var bln = false;
			if(other instanceof MBR) {
				bln = this.intersectsMBR(other);
			}
			else if(isPt(other)) {
				bln = this.intersectsPoint(other);
			}
			else if(arguments.length == 2 && isPt(arguments[0]) && isPt(arguments[1])) {
				bln = this.intersectsBounds(arguments[0], arguments[1]);
			}
			else {
				throw new Error("invalid args");
			}
			return bln;
		};

		/**
		 * @description intersect other mbr
		 * @param other{MBR}
		 * @returns {Boolean}
		 */
		proto.intersectsMBR = function(other) {
			"use strict";
			if(!(other instanceof MBR)) {
				throw new Error("invalid args, expects MBR type")
			}
			//not disjoint
			return !(other.minx > this.maxx ||
			other.maxx < this.minx ||
			other.miny > this.maxy ||
			other.maxy < this.miny);
		};

		/**
		 @description intersects the mbr box by q1
		 @param pt{Array} the point to test for intersection
		 @returns {Boolean} - true if pt intersects the mbr
		 */
		proto.intersectsPoint = function(pt) {
			"use strict";
			return this.containsXY(pt[0], pt[1]);
		};

		/**
		 * @description test the mbr defined by box intersects
		 * with the mbr defined by q1-q2
		 * @param p1{Array|Point} one extremal point of the bounds
		 * @param p2{Array|Point} another extremal point of the bounds
		 * @returns {Boolean} - this intersects Bounds[p1, p2]
		 */
		proto.intersectsBounds = function(p1, p2) {
			"use strict";
			var x = 0, y = 1;
			if(!(arguments.length == 2 && isPt(p1) && isPt(p2))) {
				throw new Error('invalid args , expects two Points as extremal points of bounds')
			}
			var minq = Math.min(p1[x], p2[x]);
			var maxq = Math.max(p1[x], p2[x]);

			if(this.minx > maxq || this.maxx < minq) {
				return false;
			}
			minq = Math.min(p1[y], p2[y]);
			maxq = Math.max(p1[y], p2[y]);
			//not disjoint
			return !(this.miny > maxq || this.maxy < minq);
		};

		/**
		 * @description expands this mbr by a given distance in all directions.
		 * @param dx
		 * @param dy
		 * @returns {MBR}
		 */
		proto.expandByDelta = function(dx, dy) {
			"use strict";
			this.minx -= dx;
			this.maxx += dx;
			this.miny -= dy;
			this.maxy += dy;
			//check for mbr disappearing
			this.minx = Math.min(this.minx, this.maxx);
			this.maxx = Math.max(this.minx, this.maxx);
			this.miny = Math.min(this.miny, this.maxy);
			this.maxy = Math.max(this.miny, this.maxy);
			return this;
		};
		/**
		 * @description enlarges the boundary of the <code>mbr</code> so that it contains
		 (x,y). Does nothing if (x,y) is already on or within the boundaries.
		 * @param x
		 * @param y
		 * @returns {MBR}
		 */
		proto.expandIncludeXY = function(x, y) {
			"use strict";
			x < this.minx && (this.minx = x);
			x > this.maxx && (this.maxx = x);
			y < this.miny && (this.miny = y);
			y > this.maxy && (this.maxy = y);
			return this;
		};
		/**
		 * @description enlarges the boundary of the
		 * mbr so that it contains other
		 * @param other
		 * @returns {MBR}
		 */
		proto.expandIncludeMBR = function(other) {
			"use strict";
			other.minx < this.minx && (this.minx = other.minx);
			other.maxx > this.maxx && (this.maxx = other.maxx);
			other.miny < this.miny && (this.miny = other.miny);
			other.maxy > this.maxy && (this.maxy = other.maxy);
			return this;
		};
		/**
		 * @description  translates this mbr given
		 * amounts in the X and Y direction. modifies mbr in place.
		 * @param dx - the amount to translate along the X axis
		 * @param dy - the amount to translate along the Y axis
		 * @returns {MBR}
		 */
		proto.translate = function(dx, dy) {
			"use strict";
			this.minx = this.minx + dx;
			this.miny = this.miny + dy;
			this.maxx = this.maxx + dx;
			this.maxy = this.maxy + dy;
		};
		/**
		 * @description computes the coordinate of the centre of
		 * this mbr
		 * @returns {Array|null} - [x,y] the centre coordinate of this mbr
		 */
		proto.center = function() {
			"use strict";
			return [
				(this.minx + this.maxx) / 2.0,
				(this.miny + this.maxy) / 2.0
			];
		};
		/**
		 * @description center aliase
		 * @type {Function|*}
		 */
		proto.getCenter = proto.center;
		/**
		 * @description  Computes the distance between this and another mbr
		 * the distance between overlapping BBoxs is 0.  Otherwise, the
		 * distance is the Euclidean distance between the closest points.
		 * @param other{MBR}
		 * @returns {Number}
		 */
		proto.distance = function(other) {
			"use strict";

			if(this.intersectsMBR(other)) {
				return 0.0;
			}

			var dx = 0.0;
			var dy = 0.0;
			if(this.maxx < other.minx) {
				dx = other.minx - this.maxx;
			}
			else if(this.minx > other.maxx) {
				dx = this.minx - other.maxx;
			}

			if(this.maxy < other.miny) {
				dy = other.miny - this.maxy;
			}
			else if(this.miny > other.maxy) {
				dy = this.miny - other.maxy;
			}
			return Math.hypot(dx, dy)
		};

		/**
		 * @description mbr to string
		 * @returns {String}
		 */
		proto.toString = function() {
			"use strict";

			return "POLYGON ((" + [
					this.minx + " " + this.miny,
					this.minx + " " + this.maxy,
					this.maxx + " " + this.maxy,
					this.maxx + " " + this.miny,
					this.minx + " " + this.miny
				].join(",") + "))"
		};

		/**
		 * @description is point
		 * @param geom
		 * @returns {boolean}
		 */
		function isPt(geom) {
			"use strict";
			if(_.isEmpty(geom)) {
				return false;
			}
			return Array.isArray(geom) && (geom.length > 1) && (typeof (geom[0]) === "number");
		}

		function not(o) {
			return !o
		}

		/**
		 * @description floating point equallity comparison
		 *  Ref: http://floating-point-gui.de/errors/comparison/
		 * @param a
		 * @param b
		 * @param {Number}[eps]
		 * @returns {boolean}
		 */
		function _floatequal(a, b, eps) {
			"use strict";
			eps = eps || 1e-12; //eps default to 12 decimal places
			//shortcut, handles infinities
			if(a === b) {
				return true;
			}
			var d = Math.abs(a - b);
			if(d <= eps || d <= 0.0) {
				return true;
			}
			return d <= Math.max(Math.abs(a), Math.abs(b)) * eps
		}
	}, {"ldash": undefined, "lodash": undefined}], "geom": [function(require, module, exports) {
		/**
		 * Created by DeepMetrics on 05/06/15.
		 */
		var MBR      = require("./mbr");
		var centroid = require("./centroid");

		module.exports = {
			MBR: MBR,
			centroid: centroid
		};
	}, {"./centroid": 1, "./mbr": 2}]
}, {}, [])

