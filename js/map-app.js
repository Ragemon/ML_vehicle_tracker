/**
 * mapApp
 */
let mapApp = null;

/**
 * app
 */
function mapApplication(options, tasks) {
	const _       = require('ldash');
	const ImgView = require('imgview');
	let $slider   = null;
	let N         = 1;
	let idx       = 0;
	mapApp        = mapApp ? mapApp : new ImgView({
		mapElement: options.mapElement,
		atZoom: options.atZoom,
		minZoom: options.minZoom,
		maxZoom: options.maxZoom,
		onSaveCallback: onSaveCallback,
	});
	if(!_.isEmpty(tasks)) {
		N = tasks.length;
		load_img(tasks[idx]);
		init_slider(idx);
	}

	function get_check_propagate_id() {
		return "check-annotation-state-1";
	}

	function onSaveCallback(imobj) {
		let $chk    = $("#" + get_check_propagate_id());
		imobj.state = $chk.is(":checked") ? "this" : "all";
		if(imobj.state !== "this") {
			for(let i = 0; i < tasks.length; i++) {
				let cur = tasks[i];
				if(cur === imobj) {
					continue;
				}
				if(cur.state === "all") {
					cloneLabels(cur, imobj)
				}
			}
		}

		_.isFunction(options.onSaveCallback) && options.onSaveCallback(tasks);

		function cloneLabels(dest, src) {
			let destReg = cloneRegion(dest);
			dest.labels  = [];
			_.each(src.labels, function(o) {
				if(o.type === "Polygon") {
					if (_.isEmpty(destReg)){
						dest.labels.push(_.cloneDeep(o));
					}
					else if (!_.isEqual(destReg.coords, o.coords)) {
						destReg.coords = _.cloneDeep(o.coords);
						dest.labels.push(_.cloneDeep(destReg));
					}else {
						dest.labels.push(_.cloneDeep(destReg));
					}

				} else {
					dest.labels.push(_.cloneDeep(o));
				}
			})
		}

		function cloneRegion(obj) {
			let reg = undefined;
			_.each(obj.labels, function(o) {
				if(o.type === "Polygon") {
					reg = _.cloneDeep(o);
					return false;
				}
			});
			return reg;
		}
	}

	/**
	 * load image
	 * @param res
	 */
	function load_img(res) {
		if(res && res.video) {
			load_img.imobj = res;
			mapApp.load(load_img.imobj);
			_annotation_propagation();
			_annotate();
			draw_annotations(load_img.imobj);
		}

		//show draw control
		function _annotation_propagation() {
			let imobj                     = load_img.imobj;
			// create the control
			let propagateLabelsCheckbox   = L.control({position: 'topright'});
			propagateLabelsCheckbox.onAdd = function(map) {
				let div      = L.DomUtil.create('div', 'leaflet-draw-section');
				let check_id = get_check_propagate_id();
				$("#" + check_id).remove();

				let check_input = '<input id="' + check_id + '" type="checkbox" name="checkbox-toggle">';

				if(imobj.state === "this") {
					check_input = '<input id="' + check_id + '" type="checkbox" name="checkbox-toggle" checked>';
				}

				let html      = [
					'<form class="smart-form">',
					'<fieldset style="padding:2px;">',
					'<label class="toggle">',
					check_input,
					'<i data-swchon-text="T H I S" data-swchoff-text="A L L"></i>',
					'Apply To</label>',
					'</fieldset>',
					'</form>'
				];
				div.innerHTML = html.join("");
				//setup on immediate; after return div
				setTimeout(_setup_on_propagation_events, 0);
				return div;
			};
			propagateLabelsCheckbox.addTo(mapApp.map);
		}

		function _setup_on_propagation_events() {
			let imobj = load_img.imobj;
			let chk   = $("#" + get_check_propagate_id());
			$(chk).on("change", function() {
				let old_state = imobj.state;
				let new_state = chk.is(":checked") ? "this" : "all";

				imobj.state = new_state; //update new state
				if(old_state === "this" && new_state === "all") {
					for(let i = 0; i < tasks.length; i++) {
						let cur = tasks[i];
						if(cur === imobj) {
							continue
						}
						if(cur.state === new_state) {
							onSaveCallback(cur);
							draw_annotations(imobj); //update draw
							break;
						}
					}
				}
			});
		}

		//show draw control
		function _annotate() {
			// control that shows state info on hover
			mapApp.info       = L.control();
			mapApp.info.onAdd = function(map) {
				this._div = L.DomUtil.create('div', 'leaflet-draw-section');
				this.update(idx);
				return this._div;
			};

			mapApp.info.update = function(num) {
				(num === undefined) && (num = 0);
				var html            = [
					'<form class="smart-form">',
					'<fieldset style="padding: 2px;">',
					'<h4><b>' + (num + 1) + '</b> of ' + N + '</h4>',
					'</fieldset>',
					'</form>'
				];
				this._div.innerHTML = html.join("");
			};
			mapApp.info.addTo(mapApp.map);

			//show draw control
			mapApp.showDrawControl();
		}
	}

	/**
	 * draw annotations
	 * @param imobj
	 */
	function draw_annotations(imobj) {
		mapApp.clearLayers();
		if(imobj && imobj.labels && imobj.labels.length) {
			for(let i = 0; i < imobj.labels.length; i++) {
				let coords = _.map(imobj.labels[i].coords, function(o) {
					return L.latLng(mapApp.mapCoords(o[1], -1), mapApp.mapCoords(o[0], 1))
				});
				let annot  = imobj.labels[i];
				if(annot.type === "LineString") {
					mapApp.drawPolyline(coords, imobj.labels[i]);
				}
				else if(annot.type === "Polygon") {
					mapApp.drawPolygon([coords], imobj.labels[i]);
				}
				mapApp.drawLabels('display');
			}
		}
	}

	/**
	 * init slider
	 */
	function init_slider(index) {
		$slider = $('#' + options.sliderElement).bootstrapSlider({
			value: 0,
			min: 0,
			step: 1,
			max: N - 1,
			formatter: function(value) {
				return 'video: ' + (value + 1);
			}
		});

		//$slider.on('change', _.debounce(slider_change, 300));
		$slider.on('change', slider_change);
		setTimeout(function() {
			update_index(index);
		}, 0)
	}

	/**
	 * on slider change
	 * @param o
	 */
	function slider_change(o) {
		if((o && o.value) && update_index(o.value.newValue)) {
			load_img(tasks[idx]);
		}
	}

	/**
	 * update index
	 * @param val
	 * @returns {boolean}
	 */
	function update_index(val) {
		idx = val;
		$slider.bootstrapSlider('setValue', idx);
		return true
	}

	/**
	 * send video annotations
	 * @param control
	 */
	function send_video_annotes(control) {
		for(let i = 0; i < tasks.length; i++) {
			if(tasks[i].labels.length === 0) {
				$.notify("ERROR: missing label for video : " + tasks[i].video, {
					position: "top center",
					className: "error",
					hideDuration: 2000,
					autoHideDelay: 10000
				});

				let goto = i;
				//reload object at goto
				setTimeout(function() {
					load_img(tasks[goto]);
					init_slider(goto);
				}, 0);
				return;
			}
		}

		console.log(JSON.stringify(tasks));
	}
}
