const {remote} = require("electron");
const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');

const btnPreview = document.getElementById("btn-preview-stream");
const btnSaveStream = document.getElementById("btn-save-stream-task");
btnPreview.addEventListener('click', play_video_stream);
btnSaveStream.addEventListener('click', save_stream_task);

function play_video_stream() {
	const source = document.getElementById("video-src").value;
	const win = remote.getCurrentWindow();
	if(_.isEmpty(source)) {
		remote.dialog.showMessageBox(win, {
			title: "Video Stream",
			message: "No Video URL Provided",
			buttons: ["Ok"]
		});
		return;
	}
	let vidWin = new remote.BrowserWindow({
		width: 823, height: 575,
		webPreferences: {nodeIntegration: true},
		backgroundColor: "#000000",
	})
	let data = {src: source};
	vidWin.loadFile('video.html', {query: {"data": JSON.stringify(data)}});
}

function save_stream_task() {
	let start_date = parse_date("startdate");
	let stop_date = parse_date("stopdate");

	let start_time = parse_time("start-time");
	let stop_time = parse_time("stop-time");

	let all_input = _.every(_.map([start_date, stop_date, start_time, stop_time], _.negate(_.isEmpty)));

	if(!all_input) {
		remote.dialog.showMessageBox(remote.getCurrentWindow(), {
			title: "Invalid Input",
			message: "Invalid input, check start and stop date & time",
			buttons: ["Ok"]
		});
		return;
	}

	let current = get_current_utc_time().unix();
	let start = moment.utc(_.concat(start_date, start_time)).unix();
	let stop = moment.utc(_.concat(stop_date, stop_time)).unix();
	if(start >= stop) {
		remote.dialog.showMessageBox(remote.getCurrentWindow(), {
			title: "Invalid Input",
			message: "Start datetime is greater or equal to stop datetime",
			buttons: ["Ok"]
		});
		return;
	}
	if(start < current) {
		remote.dialog.showMessageBox(remote.getCurrentWindow(), {
			title: "Invalid Input",
			message: "Start datetime is less than current UTC datetime",
			buttons: ["Ok"]
		});
		return;
	}

	const source = document.getElementById("video-src").value;
	if(_.isEmpty(source)) {
		remote.dialog.showMessageBox(remote.getCurrentWindow(), {
			title: "Video Stream",
			message: "No Video URL Provided",
			buttons: ["Ok"]
		});
		return;
	}

	const obj = {
		start: start,
		stop: stop,
		source: source,
		step: 1
	}

	remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
		title: 'Save Video Stream Task',
		buttonLabel: 'Save',
		defaultPath: remote.app.getPath('home'),
		filters: [
			{name: 'Video Stream Task', extensions: ['vst']},
		]
	}, (filename) => save_tsk_to_file(filename, obj))
}

function parse_date(element_id) {
	let value = document.getElementById(element_id).value;
	if (_.isEmpty(value)) {
		return null;
	}
	const tokens = _.map(_.split(value, "/"), _.toNumber);
	if (_.size(tokens) !== 3){
		return null;
	}
	tokens[1] += -1;
	return _.reverse(tokens);
}

function parse_time(element_id) {
	let value = document.getElementById(element_id).value;
	if (_.isEmpty(value)) {
		return null;
	}

	const tokens = _.map(_.split(value, ":"), _.toNumber);
	if(_.size(tokens) !== 2) {
		return null;
	}
	tokens.push(0);
	return tokens;
}

function save_tsk_to_file(filepath, obj) {
	if(!_.isEmpty(filepath)) {
		filepath = _.trimEnd(filepath, '.vst');
		filepath = _.trimEnd(filepath, '.VST');
		filepath = `${filepath}.vst`;
		fs.writeFileSync(filepath, JSON.stringify(obj));
	}
}

function get_current_utc_time() {
	return moment.utc()
}
