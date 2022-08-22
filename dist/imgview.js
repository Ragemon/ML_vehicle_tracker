require = (function e(t, n, r) {
	function s(o, u) {
		if(!n[o]) {
			if(!t[o]) {
				var a = typeof require === "function" && require;
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
	for(var o = 0;
	    o < r.length;
	    o++) {
		s(r[o]);
	}
	return s
})({
	1: [function(require, module, exports) {

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
			let $        = jQuery;
			let deferred = $.Deferred();
			let im       = new Image();
			im.onload    = function() {
				deferred.resolve({
					width: im.width,
					height: im.height
				});
			};
			im.src       = src;

			im.onerror = function(err) {
				deferred.reject(err);
			};
			// return promise
			return deferred.promise();
		}

	}, {}], "imgview": [function(require, module, exports) {
		let geom    = require("geom");
		let imgsize = require('imgsize');
		/**
		 * @type {ImgView}
		 */
		module.exports = ImgView;

		function noop() {
		}

		/**
		 * @description Image View
		 * @param options{{mapElement, minZoom, maxZoom}}
		 * @returns {ImgView}
		 * @constructor
		 */
		function ImgView(options) {
			"use strict";
			if(!(this instanceof ImgView)) {
				return new ImgView(options);
			}
			this.options = options;

			let mapElement = this.options.mapElement;
			if(typeof mapElement !== "string") {
				throw new Error("element id not provided");
			}

			let elem = document.getElementById(mapElement);
			if(elem === null) {
				throw new Error("element " + mapElement + " not found");
			}
			this._drawState      = false;
			this._keyStrokes     = [];
			this._keySubscribers = [];

			this.mapElement = mapElement;
			this.map        = null;
			this.drawTool   = {};
			this.info       = null;
			this.scale      = 0;

			this.width  = 0;
			this.height = 0;

			this.imobj = null;

			this.onSaveCallback = noop;
			if(_.isFunction(this.options.onSaveCallback)) {
				this.onSaveCallback = this.options.onSaveCallback
			}

			let markerIcon = 'js/leaflet/images/empty-marker-icon.png';

			this.ObjectLabel = L.Icon.Label.extend({
				options: {
					labelAnchor: new L.Point(12, 16),
					wrapperAnchor: new L.Point(13, 41),
					iconAnchor: new L.Point(0, 0),
					labelText: null,
					iconUrl: markerIcon,
					iconSize: new L.Point(5, 5),
					popupAnchor: new L.Point(0, -10),
					shadowUrl: markerIcon,
					shadowSize: new L.Point(5, 5)
				}
			});
		}

		/**
		 * @description load image
		 * Load image from a given source
		 * @param im
		 */
		ImgView.prototype.load = function(im) {
			this._init(im);
			return this;
		};

		/**
		 * @description initialize map
		 * @returns {*}
		 * @private
		 */
		ImgView.prototype._init = function(obj) {
			let self    = this;
			self.imobj  = obj;
			self.width  = obj.width;
			self.height = obj.height;

			$("#" + self.mapElement).show();
			if(self.map) {
				self.map.remove();
				self.map = null;
			}

			this.scale     = Math.ceil(obj.width / 250.0);
			let atZoom     = self.options.atZoom ? self.options.atZoom : self.options.minZoom;
			let minZoom    = self.options.minZoom;
			let maxZoom    = self.options.maxZoom;
			let upperLeft  = [0, 0];
			let lowerRight = [-obj.height / this.scale, obj.width / this.scale];

			let map = this.map = L.map(this.mapElement, {
				crs: L.CRS.Simple,
				minZoom: minZoom,
				maxZoom: maxZoom,
				attributionControl: false,
				zoomControl: false,
				preferCanvas: false
			});
			map.doubleClickZoom.disable();
			map.eachLayer(map.removeLayer);

			L.imageOverlay(obj.base64, new L.LatLngBounds(upperLeft, lowerRight), {
				noWrap: true,
				minZoom: minZoom,
				maxZoom: maxZoom,
				attribution: ''
			}).addTo(map);

			L.control.mousePosition({
				lngFirst: true,
				lngFormatter: self._formatImgCoords.bind(self),
				latFormatter: self._formatImgCoords.bind(self)
			}).addTo(map);

			let center = new L.LatLng(-obj.height / this.scale / 2, obj.width / this.scale / 2);
			map.setView(center, atZoom);

			map.on('zoomend', function() {
			});

			//this.map.keyboard.disable();

			L.control.watermark({position: 'topleft'}).addTo(map);

			this.labelLayer = {};
			this._initDrawerTool();
			this._initLabelLayer();

			this.show();
		};

		ImgView.prototype.show = function() {
			$('#' + this.mapElement).show();
		};

		ImgView.prototype._initDrawerTool = function() {
			let drawLayer   = new L.FeatureGroup();
			let drawControl = new L.Control.Draw(this.drawOptions(drawLayer));
			this.drawTool   = {
				layer: drawLayer,
				control: drawControl
			};

			this.map.on(L.Draw.Event.CREATED, this.onDraw.bind(this, this.drawTool.layer));
			this.map.on(L.Draw.Event.EDITED, this.drawLabels.bind(this));
			this.map.on(L.Draw.Event.DELETED, this.drawLabels.bind(this));
		};

		ImgView.prototype._initLabelLayer = function() {
			this.labelLayer = new L.FeatureGroup();
			this.map.addLayer(this.labelLayer);
		};

		ImgView.prototype.showDrawControl = function() {
			this.map.addControl(this.drawTool.control);
			this.map.addLayer(this.drawTool.layer);
		};

		ImgView.prototype.drawOptions = function(drawLayer) {
			let self = this;
			return {
				position: 'topright',
				draw: {
					marker: false,
					polyline: {
						shapeOptions: self.drawPolylineShapeOptions()
					},
					polygon: {
						allowIntersection: false,
						drawError: {
							color: '#ff5e26'
						},
						shapeOptions: self.drawPolygonShapeOptions()
					},
					circle: false,
					rectangle: false,
				},
				edit: {
					featureGroup: drawLayer, //REQUIRED!!
					remove: true
				}
			};
		};

		ImgView.prototype.drawPolygonShapeOptions = function() {
			return {
				clickable: false,
				opacity: 1.0,
				fillOpacity: 0,
				color: '#68b5ff',
				stroke: true,
				weight: 3,
				fillRule: 'insideness',
				dashArray: '5, 5',
				dashOffset: '10'
			};
		};

		ImgView.prototype.drawPolylineShapeOptions = function() {
			return {
				clickable: false,
				opacity: 1.0,
				fillOpacity: 1.0,
				color: '#ffe513',
				stroke: true,
				weight: 3,
				fillRule: 'insideness',
				dashArray: '5, 5',
				dashOffset: '10'
			}
		};

		ImgView.prototype.getLayers = function() {
			return this.drawTool.layer.getLayers();
		};

		ImgView.prototype.clearLayers = function() {
			return this.drawTool.layer.clearLayers();
		};

		ImgView.prototype.drawRectangle = function(bounds, obj) {
			let rect    = L.rectangle(bounds, this.drawPolylineShapeOptions());
			rect.object = obj;
			rect.addTo(this.drawTool.layer);
			rect.on('dblclick', function(e) {
				console.log(e.target.object);
			});
			$.fn.editable.defaults.mode = 'popup';
		};

		ImgView.prototype.drawPolyline = function(coords, obj) {
			let pln    = L.polyline(coords, this.drawPolylineShapeOptions());
			pln.object = obj;
			pln.addTo(this.drawTool.layer);
			pln.on('dblclick', function(e) {
				console.log(e.target.object);
			});
			$.fn.editable.defaults.mode = 'popup';
		};

		ImgView.prototype.drawPolygon = function(coords, obj) {
			let pln    = L.polygon(coords, this.drawPolygonShapeOptions());
			pln.object = obj;
			pln.addTo(this.drawTool.layer);
			pln.on('dblclick', function(e) {
				console.log(e.target.object);
			});
			$.fn.editable.defaults.mode = 'popup';
		};

		ImgView.prototype.onDraw = function(editableLayers, e) {
			let g       = e.layer;
			let geojson = g.toGeoJSON();
			g.object    = {label: "", type: geojson.geometry.type};
			editableLayers.addLayer(g);
			this.drawLabels();
		};

		ImgView.prototype.drawLabels = function(e) {
			let self       = this;
			let label_objs = [];

			self.labelLayer.clearLayers();
			let lyrs = this.drawTool.layer.getLayers();

			for(let i = 0; i < lyrs.length; i++) {
				let g      = lyrs[i];
				let coords = geometryCentroid(g);
				let ctr    = L.latLng(coords[1], coords[0]);
				let lobj   = gen_label(g);
				let label  = new L.Marker(ctr, {
					icon: new this.ObjectLabel({labelText: lobj.html})
				});
				label.addTo(this.labelLayer);
				label_objs.push(lobj)
			}

			for(let i = 0; i < label_objs.length; i++) {
				gen_editable_events(label_objs[i])
			}

			//after events if on display draw: return
			if(_.isString(e) && e === 'display') {
				return;
			}

			if(_.isObject(e) && (e.type === "draw:edited" || e.type === "draw:deleted")) {
				if(self.saveLabels()) {
					this.onSaveCallback(self.imobj);
				}
			}

			function gen_label(g) {
				let $id   = Math.random().toString(36).slice(2, 11);
				let label = g.object.label;
				if(!label) {
					label = ""
				}
				return {
					g: g,
					id: $id,
					html: "<div id='" + $id + "'>" + label + "</div>",
				}
			}

			function gen_editable_events(obj) {
				let gtype = obj.g.toGeoJSON().geometry.type;
				let title = (gtype === "Polygon") ? "Enter DateTime YYYY-MM-DD H:M:S" : "Enter Road/Direction Label";
				let $obj  = $("#" + obj.id);
				$obj.editable({
					type: "text",
					title: title,
					placement: 'center',
					validate: function(val) {
						if(gtype === "Polygon" && !validateTime(val)) {
							return {newValue: val, msg: "invalid date [space] time"};
						}
						return undefined;
					}
				});

				$obj.on('save', function(e, params) {
					if(obj.g.object.type === "Polygon") {
						if(!validateTime(params.newValue)) {
							$.notify("ERROR: invalid time: expects hh:mm:ss in 24hr format", {
								position: "top center",
								className: "error",
								hideDuration: 2000,
								autoHideDelay: 10000
							});
							return false;
						}
					}
					obj.g.object.label = params.newValue;
					if(self.saveLabels()) {
						self.onSaveCallback(self.imobj);
					}
				});

				function validateTime(label) {
					let datetime = parse_video_datetime(label);
					let date     = datetime[0];
					let time     = datetime[1];
					if(!date && !time) {
						return false
					}
					if(date) {
						let [yyyy, mm, dd] = parse_date_tokens(date);
						let bln            = (yyyy > 0) && (mm >= 1 && mm <= 12) && (dd >= 1 && dd <= 31);
						if(!bln) {
							return false
						}
					}
					if(!time) {
						return false
					}
					let [hrs, mins, secs] = parse_time_tokens(time);
					return (hrs >= 0 && hrs < 24) && (mins >= 0 && mins < 60) && (secs >= 0 && secs < 60);
				}

				function parse_time_tokens(inputstr) {
					let regx = /^\s?([0-9]{1,2})\s?[:-]\s?([0-9]{1,2})\s?[:-]\s?([0-9]{1,2})\s?$/;
					let m    = inputstr.match(regx);
					let hr   = -1, min = -1, sec = -1;
					let g    = null;
					if(m) {
						g = m.slice(1)
					}
					if(g) {
						hr  = parseInt(g[0]);
						min = parseInt(g[1]);
						sec = parseInt(g[2])
					}
					return [hr, min, sec]
				}

				function parse_date_tokens(inputstr) {
					let regx = /^\s?([0-9]{4})\s?[/-]\s?([0-9]{1,2})\s?[/-]\s?([0-9]{1,2})\s?$/;
					let m    = inputstr.match(regx);
					let yyyy = -1, mm = -1, dd = -1;
					let g    = null;
					if(m) {
						g = m.slice(1)
					}
					if(g) {
						yyyy = parseInt(g[0]);
						mm   = parseInt(g[1]);
						dd   = parseInt(g[2])
					}
					return [yyyy, mm, dd]
				}

				function parse_video_datetime(inputstr) {
					const reg_time     = /(\s?[0-9]+\s?[:-]\s?[0-9]+\s?[:-]\s?[0-9]+\s?)/;
					const reg_datetime = /(\s?[0-9]+\s?[/-]\s?[0-9]+\s?[/-]\s?[0-9]+\s?)?\s+(\s?[0-9]+\s?[:-]\s?[0-9]+\s?[:-]\s?[0-9]+\s?)/;
					let m              = inputstr.match(reg_datetime);
					let out            = [null, null];
					if(m) {
						let g = m.slice(1);
						if(g) {
							out[0] = g[0];
							out[1] = g[1];
						}
					}
					else {
						m = inputstr.match(reg_time);
						if(m) {
							let g = m.slice(1);
							if(g) {
								out[1] = g[0]
							}
						}
					}
					return out;
				}

			}
		};

		function geometryCentroid(g) {
			let coords;
			let geojson = g.toGeoJSON();

			if(geojson.geometry.type === "Polygon") {
				coords = geojson.geometry.coordinates[0]
			}
			else if(geojson.geometry.type === "LineString") {
				coords = geojson.geometry.coordinates
			}
			else {
				throw new Error("unimplemented for geometry type");
			}
			return geom.centroid(coords);
		}

		ImgView.prototype.saveLabels = function() {
			let lyrs = this.getLayers();
			if(lyrs.length === 0) {
				$.notify("ERROR: no labels found ! use the draw tool to create new labels", {
					position: "top center",
					className: "error",
					hideDuration: 2000,
					autoHideDelay: 10000
				});
				return false;
			}
			//empty old coords
			this.imobj.labels.length = 0;
			for(let i = 0; i < lyrs.length; i++) {
				let lyr    = lyrs[i];
				let ln     = lyr.toGeoJSON();
				let coords = this.imgCoords(ln.geometry.coordinates);
				let annot  = lyr.object;

				if(!annot.label) {
					$.notify("ERROR: empty label found - label name required !", {
						position: "top center",
						className: "error",
						hideDuration: 2000,
						autoHideDelay: 10000
					});
					this.map.panTo(lyr.getBounds().getCenter());
					return false;
				}
				if(annot.type === "Polygon") {
					annot.coords = coords[0];
				}
				else if(annot.type === "LineString") {
					annot.coords = coords;
				}
				else {
					throw new Error("unimplemented for geometry type");
				}

				this.imobj.labels.push(annot);
			}
			return true;
		};

		ImgView.prototype.hide = function() {
			$('#' + this.mapElement).hide();
		};

		ImgView.prototype._formatImgCoords = function(val) {
			return this.imgCoords(val);
		};

		ImgView.prototype.imgCoords = function(val) {
			if(Array.isArray(val)) {
				let self = this;
				return val.map(function(v) {
					return self.imgCoords(v);
				});
			}
			return Math.trunc(Math.abs(val * this.scale));
		};

		ImgView.prototype.mapCoords = function(val, multiplier) {
			if(Array.isArray(val)) {
				let self = this;
				return val.map(function(v) {
					return self.mapCoords(v, multiplier);
				})
			}
			return multiplier * Math.round(Math.abs(val / this.scale));
		};

		ImgView.prototype.bbox = function(feat) {
			let bounds = feat.getBounds();
			let ul     = bounds.getNorthWest();
			let lr     = bounds.getSouthEast();
			return new BBox(feat.object.label,
				this._fix_img_edge_xy_vals(this.imgCoords([ul.lng, ul.lat])),
				this._fix_img_edge_xy_vals(this.imgCoords([lr.lng, lr.lat]))
			)
		};

		ImgView.prototype._fix_img_edge_xy_vals = function(xy) {
			if(!Array.isArray(xy)) {
				throw new Error("invalid input array : xy" + xy);
			}
			let val = xy.slice();
			if(val[0] >= this.width) {
				val[0] = this.width - 1;
			}
			if(val[1] >= this.height) {
				val[1] = this.height - 1;
			}
			return val;
		};

		ImgView.prototype.flashMap = function(state) {
			let self   = this;
			let bounds = this.map.getBounds();
			let rect   = L.rectangle(bounds, {
				color: state ? "#72ff59" : "#ff3a09",
				fillOpacity: 0.3,
				weight: 1
			});
			rect.addTo(this.map);
			setTimeout(function() {
				self.map.removeLayer(rect)
			}, 200)
		};

		function BBox(label, ul, lr) {
			"use strict";
			this.label = label;
			this.xmin  = ul[0];
			this.ymin  = ul[1];
			this.xmax  = lr[0];
			this.ymax  = lr[1];
		}

	}, {"imgsize": 1}]
}, {}, []);

