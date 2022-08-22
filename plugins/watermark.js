
L.Control.Watermark = L.Control.extend({
	onAdd: function(map) {
		var img         = L.DomUtil.create('img');
		img.src         = 'logo.png';
		img.style.width = '50px';
		return img;
	},
	onRemove: function(map) {
		// Nothing to do here
	}
});
L.control.watermark = function(opts) {
	return new L.Control.Watermark(opts);
};

