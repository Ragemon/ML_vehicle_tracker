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

	}, {}], "nullview": [function(require, module, exports) {
		let geom = require("geom");
		/**
		 * @type {NullView}
		 */
		module.exports = NullView;

		function noop() {
		}

		/**
		 * @description Image View
		 * @param options{{mapElement, minZoom, maxZoom}}
		 * @returns {NullView}
		 * @constructor
		 */
		function NullView(options) {
			"use strict";
			if(!(this instanceof NullView)) {
				return new NullView(options);
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

			this.options.queryObj.subscribers['_draw_nulls'
				]           = this.drawNullTracks.bind(this);
			this.mapElement = mapElement;
			this.map        = null;
			this.drawTool   = {};
			this.info       = null;
			this.scale      = 0;

			this.width  = 0;
			this.height = 0;

			this.imobj = null;

			this.applyCallback = noop;
			if(_.isFunction(this.options.applyCallback)) {
				this.applyCallback = this.options.applyCallback
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
		NullView.prototype.load = function(im) {
			this._init(im);
			return this;
		};

		/**
		 * @description initialize map
		 * @returns {*}
		 * @private
		 */
		NullView.prototype._init = function(obj) {
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

			this.labelLayer   = {};
			this.annotesLayer = {};
			this._initDrawerTool();
			this._initLabelLayer();
			this._initAnnotationLayer();
			this._initTracksLayer();
			this._initMapKeyPress();

			this.show();
		};
		/**
		 * @description show map element
		 */
		NullView.prototype.show = function() {
			$('#' + this.mapElement).show();
		};

		NullView.prototype._initMapKeyPress = function() {
			let self = this;
			$(document ).unbind('keypress');
			$(document).keypress(function(event) {
				event.preventDefault();
				console.log(event.keyCode);
				if(event.key === "a") {
					self.assign_null_tracks();
					$.notify("Apply!", {
						position: "top center",
						className: "success",
						hideDuration: 1000,
						autoHideDelay: 1000
					});
				}
				else if(event.key === "f") {
					$.notify("Fetch!", {
						position: "top center",
						className: "success",
						hideDuration: 1000,
						autoHideDelay: 1000
					});
					self.options.queryObj && self.options.queryObj.fetch_null_tracks("limit")
				}
			})
		};

		NullView.prototype.assign_null_tracks = function() {
			let self = this;
			if(!self.options.queryObj.detfile || !self.options.queryObj.objclass || _.isEmpty(self.options.queryObj.tracks)) {
				return
			}

			let lyrs       = self.getLayers();
			let nullLabels = [];
			for(let i = 0; i < lyrs.length; i++) {
				let lyr    = lyrs[i];
				let ln     = lyr.toGeoJSON();
				let coords = this.imgCoords(ln.geometry.coordinates);
				let annot  = lyr.object;

				if(!annot.label) {
					continue
				}
				annot.coords = coords;
				nullLabels.push(annot);
			}
			self.options.applyCallback(nullLabels)
		};

		/**
		 * @description init draw tool
		 * @private
		 */
		NullView.prototype._initDrawerTool = function() {
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

		NullView.prototype._initLabelLayer = function() {
			this.labelLayer = new L.FeatureGroup();
			this.map.addLayer(this.labelLayer);
		};

		NullView.prototype._initAnnotationLayer = function() {
			this.annotesLayer = new L.FeatureGroup();
			this.map.addLayer(this.annotesLayer);
		};

		NullView.prototype._initTracksLayer = function() {
			this.tracksLayer = new L.FeatureGroup();
			this.map.addLayer(this.tracksLayer);
		};

		NullView.prototype.showDrawControl = function() {
			this.map.addControl(this.drawTool.control);
			this.map.addLayer(this.drawTool.layer);
		};

		NullView.prototype.drawOptions = function(drawLayer) {
			let self = this;
			return {
				position: 'topright',
				draw: {
					marker: false,
					polyline: {
						shapeOptions: self.drawPolylineShapeOptions()
					},
					polygon: false,
					circle: false,
					rectangle: false,
				},
				edit: {
					featureGroup: drawLayer, //REQUIRED!!
					remove: true
				}
			};
		};

		NullView.prototype.drawPolygonShapeOptions = function() {
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

		NullView.prototype.drawPolylineShapeOptions = function() {
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

		NullView.prototype.drawAnnotationPolylineShapeOptions = function() {
			return {
				clickable: false,
				opacity: 1.0,
				fillOpacity: 1.0,
				color: '#ffffff',
				stroke: true,
				weight: 3,
				fillRule: 'insideness',
				//dashArray: '5, 5',
				dashOffset: '10'
			}
		};

		/**
		 * @description get layers
		 * @return {*}
		 */
		NullView.prototype.getLayers = function() {
			return this.drawTool.layer.getLayers();
		};

		/**
		 * @description clear drawLayer geometries
		 * @return {*}
		 */
		NullView.prototype.clearLayers = function() {
			return this.drawTool.layer.clearLayers();
		};

		NullView.prototype.drawRectangle = function(bounds, obj) {
			let rect    = L.rectangle(bounds, this.drawPolylineShapeOptions());
			rect.object = obj;
			rect.addTo(this.drawTool.layer);
			rect.on('dblclick', function(e) {
				console.log(e.target.object);
			});
			$.fn.editable.defaults.mode = 'popup';
		};

		NullView.prototype.drawPolyline = function(coords, obj) {
			let pln    = L.polyline(coords, this.drawPolylineShapeOptions());
			pln.object = obj;
			pln.addTo(this.drawTool.layer);
			pln.on('dblclick', function(e) {
				console.log(e.target.object);
			});
			$.fn.editable.defaults.mode = 'popup';
		};

		NullView.prototype.drawAnnotationPolyline = function(coords, obj) {
			let pln    = L.polyline(coords, this.drawAnnotationPolylineShapeOptions());
			pln.object = obj;
			pln.addTo(this.annotesLayer);
			pln.on('dblclick', function(e) {
				console.log(e.target.object);
			});
			$.fn.editable.defaults.mode = 'popup';
		};

		NullView.prototype.drawPolygon = function(coords, obj) {
			let pln    = L.polygon(coords, this.drawPolygonShapeOptions());
			pln.object = obj;
			pln.addTo(this.drawTool.layer);
			pln.on('dblclick', function(e) {
				console.log(e.target.object);
			});
			$.fn.editable.defaults.mode = 'popup';
		};

		/**
		 * @description  on draw event
		 * @param editableLayers
		 * @param e
		 */
		NullView.prototype.onDraw = function(editableLayers, e) {
			let g       = e.layer;
			let geojson = g.toGeoJSON();
			g.object    = {label: "", type: geojson.geometry.type};
			editableLayers.addLayer(g);
			this.drawLabels();
		};

		NullView.prototype.drawNullTracks = function(ev) {
			if(ev !== "tracks") {
				return;
			}

			let self         = this;
			let opts         = {
				clickable: false,
				opacity: 1.0,
				fillOpacity: 1.0,
				stroke: true,
				weight: 3,
				fillRule: 'insideness',
				//dashArray: '5, 5',
				dashOffset: '10'
			};
			let optsStartMid = _.defaults(_.cloneDeep(opts), {
				color: '#41ff00',
			});
			let optsMidEnd   = _.defaults(_.cloneDeep(opts), {
				color: '#006dff',
			});

			self.tracksLayer.clearLayers();
			self.labelLayer.clearLayers();
			self.clearLayers();

			_.each(self.options.queryObj.tracks, function(track) {
				let coords    = [[track.startx, track.starty], [track.startmid, track.endmid], [track.endx, track.endy]];
				coords        = _.map(coords, function(o) {
					return L.latLng(mapApp.mapCoords(o[1], -1), mapApp.mapCoords(o[0], 1))
				});
				let firstLeg  = coords.slice(0, 2);
				let secondLeg = coords.slice(1, coords.length);
				drawTrack(firstLeg, track, optsStartMid);
				drawTrack(secondLeg, track, optsMidEnd);
			});

			function drawTrack(coords, obj, opts) {
				let pln    = L.polyline(coords, opts);
				pln.object = obj;
				pln.addTo(self.tracksLayer);
				pln.on('dblclick', function(e) {
					console.log(e.target.object);
				});
			}

		};

		NullView.prototype.drawLabels = function(e) {
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
					icon: new this.ObjectLabel({
						labelText: lobj.html
					})
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

			function gen_label(g) {
				let $id   = Math.random().toString(36).slice(2, 11);
				let label = g.object.label;
				if(!label) {
					label = ""
				}
				return {
					g: g,
					id: $id,
					html: '<div data-type="select" id="' + $id + '">' + label + "</div>",
				}
			}

			function gen_editable_events(obj) {
				let $obj   = $("#" + obj.id);
				let source = _.map(_.keys(self.imobj.linedata), function(k) {
					return {value: k, text: k};
				});
				$obj.editable({
					type: "text",
					title: "Direction",
					value: "",
					showbuttons: false,
					source: source,
					placement: 'center'
				});

				$obj.on('save', function(e, params) {
					obj.g.object.label = params.newValue;
				});
			}
		};

		NullView.prototype.drawAnnotationLabels = function(e) {
			let lyrs = this.annotesLayer.getLayers();
			for(let i = 0; i < lyrs.length; i++) {
				let g      = lyrs[i];
				let coords = geometryCentroid(g);
				let ctr    = L.latLng(coords[1], coords[0]);
				let lobj   = gen_label(g);
				let label  = new L.Marker(ctr, {
					icon: new this.ObjectLabel({
						labelText: lobj.html
					})
				});
				label.addTo(this.annotesLayer);
			}

			function gen_label(g) {
				let $id   = Math.random().toString(36).slice(2, 11);
				let label = g.object.label;
				if(!label) {
					label = ""
				}
				return {g: g, id: $id, html: "<div id='" + $id + "'>" + label + "</div>"}
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

		/**
		 * save labels
		 * @returns {boolean}
		 */
		NullView.prototype.saveLabels = function() {
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

		/**
		 * @description hide map element
		 */
		NullView.prototype.hide = function() {
			$('#' + this.mapElement).hide();
		};

		/**
		 * @description format image coordinates
		 * @param val
		 * @returns {number}
		 * @private
		 */
		NullView.prototype._formatImgCoords = function(val) {
			return this.imgCoords(val);
		};

		/**
		 * @description format image coordinates
		 * @param val
		 * @returns number
		 */
		NullView.prototype.imgCoords = function(val) {
			if(Array.isArray(val)) {
				let self = this;
				return val.map(function(v) {
					return self.imgCoords(v);
				});
			}
			return Math.trunc(Math.abs(val * this.scale));
		};

		/**
		 * @description map coordinates
		 * @param val
		 * @param multiplier
		 * @returns {number}
		 */
		NullView.prototype.mapCoords = function(val, multiplier) {
			if(Array.isArray(val)) {
				let self = this;
				return val.map(function(v) {
					return self.mapCoords(v, multiplier);
				})
			}
			return multiplier * Math.round(Math.abs(val / this.scale));
		};

		NullView.prototype.bbox = function(feat) {
			let bounds = feat.getBounds();
			let ul     = bounds.getNorthWest();
			let lr     = bounds.getSouthEast();
			return new BBox(feat.object.label,
				this._fix_img_edge_xy_vals(this.imgCoords([ul.lng, ul.lat])),
				this._fix_img_edge_xy_vals(this.imgCoords([lr.lng, lr.lat]))
			)
		};

		NullView.prototype._fix_img_edge_xy_vals = function(xy) {
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

		NullView.prototype.flashMap = function(state) {
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

