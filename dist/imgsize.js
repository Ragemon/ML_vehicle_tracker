require = (function e(t, n, r) {
	function s(o, u) {
		if(!n[o]) {
			if(!t[o]) {
				var a = typeof require == "function" && require;
				if(!u && a) {
					return a(o, !0);
				}
				if(i) {
					return i(o, !0);
				}
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

	var i = typeof require == "function" && require;
	for(var o = 0; o < r.length; o++) {
		s(r[o]);
	}
	return s
})({
	"imgsize": [function(require, module, exports) {
		/**
		 * Created by titus on 18/12/16.
		 */
		/**
		 * exports
		 * @type {loadImg}
		 */
		module.exports = loadImg;

		/**
		 * load image from a given source
		 * depends on $ and html 5 Image
		 * @param src
		 * @returns {*}
		 */
		function loadImg(src) {
			"use strict";
			if(!jQuery) {
				throw new Error("jQuery library missing");
			}
			var $        = jQuery;
			var deferred = $.Deferred();
			var im       = new Image();
			im.onload    = function() {
				deferred.resolve({width: im.width, height: im.height});
			};
			im.src       = src;

			im.onerror = function(err) {
				deferred.reject(err);
			};
			// return promise
			return deferred.promise();
		}

	}, {}]
}, {}, [])

